const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, isAdmin , isAdminOrManager} = require('../middleware/auth');
const { Order, OrderItem, MenuItem, User, sequelize } = require('../models');

// GET / - Get all orders with filtering (Admin only)


router.get('/my-orders', authenticate, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            attributes: ['id', 'createdAt', 'total_price', 'status', 'customer_name', 'table'],
            order: [['createdAt', 'DESC']],
        });
               res.json(orders);
    } catch (err) {
        console.error(`Error fetching orders for user ${req.user.id}:`, err);
        res.status(500).json({ error: 'Failed to fetch your orders' });
    }
});




router.post('/', authenticate, async (req, res) => {
  // We start a transaction for data safety
  const transaction = await sequelize.transaction();
  try {
    // --- THIS IS THE MOST IMPORTANT FIX ---
    // We get the user ID DIRECTLY from the authenticated token via req.user.
    // We completely ignore any userId that might be in the request body.
    const userIdFromToken = req.user.id;
    
    const { items, customer_name, table } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    let calculatedTotalPrice = 0;

    for (const requestedItem of items) {
      const menuItem = await MenuItem.findByPk(requestedItem.menu_item_id, { transaction });
      if (!menuItem) throw new Error(`Item with ID ${requestedItem.menu_item_id} not found.`);
      if (!menuItem.is_available) throw new Error(`'${menuItem.name}' is currently unavailable.`);
      
      if (menuItem.track_quantity) {
        if (menuItem.quantity < requestedItem.quantity) {
          throw new Error(`Not enough stock for '${menuItem.name}'.`);
        }
        menuItem.quantity -= requestedItem.quantity;
        if (menuItem.quantity <= 0) {
            menuItem.is_available = false;
        }
        await menuItem.save({ transaction });
      }
      calculatedTotalPrice += parseFloat(menuItem.price) * requestedItem.quantity;
    }

    const orderToCreate = {
      user_id: userIdFromToken, // <-- We use the secure ID from the token here
      total_price: calculatedTotalPrice,
      status: 'completed',
      customer_name: customer_name,
      table: table,
    };

    const newOrder = await Order.create(orderToCreate, { transaction });

    const orderItemsToCreate = items.map(item => ({
      order_id: newOrder.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_time: item.price,
    }));
    await OrderItem.bulkCreate(orderItemsToCreate, { transaction });

    await transaction.commit();
    res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder.id });

  } catch (err) {
    await transaction.rollback();
    console.error('Order creation failed:', err.message);
    res.status(400).json({ error: err.message });
  }
});


router.get('/', authenticate, isAdminOrManager, async (req, res) => {
    try {
        const { waiter, startDate, endDate } = req.query;
        const findOptions = {
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'full_name'] },
                {
                    model: OrderItem,
                    as: 'items',
                    include: { model: MenuItem, attributes: ['name'] }
                }
            ],
            order: [['createdAt', 'DESC']]
        };

        if (waiter) {
            findOptions.include[0].where = { full_name: { [Op.like]: `%${waiter}%` } };
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            findOptions.where = { createdAt: { [Op.between]: [start, end] } };
        }
        
        const orders = await Order.findAll(findOptions);
        res.json(orders);
    } catch (err) {
        console.error('Error fetching all orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
module.exports = router;