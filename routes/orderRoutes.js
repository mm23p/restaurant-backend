const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, isAdmin } = require('../middleware/auth');
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
  const transaction = await sequelize.transaction();
  try {
    const { items, customer_name, table } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    let calculatedTotalPrice = 0;

    for (const requestedItem of items) {
      const menuItem = await MenuItem.findByPk(requestedItem.menu_item_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!menuItem) throw new Error(`Item with ID ${requestedItem.menu_item_id} not found.`);
      if (!menuItem.is_available) throw new Error(`'${menuItem.name}' is currently unavailable.`);
      
      if (menuItem.track_quantity) {
        if (menuItem.quantity < requestedItem.quantity) {
          throw new Error(`Not enough stock for '${menuItem.name}'.`);
        }
        const newQuantity = menuItem.quantity - requestedItem.quantity;
        menuItem.quantity = newQuantity;
        if (newQuantity <= 0) {
            menuItem.is_available = false;
        }
        await menuItem.save({ transaction });
      }
      calculatedTotalPrice += parseFloat(menuItem.price) * requestedItem.quantity;
    }

    // --- DEBUG LOG #1: CHECK THE CALCULATION ---
    console.log(`[POST /orders] STEP 1: Final calculated total price is: ${calculatedTotalPrice}`);

    const orderToCreate = {
      user_id: req.user.id,
      total_price: calculatedTotalPrice,
      customer_name: customer_name,
      table: table,
    };

    // --- DEBUG LOG #2: CHECK THE OBJECT BEING SAVED ---
    console.log('[POST /orders] STEP 2: Object being passed to Order.create():', orderToCreate);

    const newOrder = await Order.create(orderToCreate, { transaction });

    // --- DEBUG LOG #3: CHECK THE RESULT FROM THE DATABASE ---
    console.log('[POST /orders] STEP 3: Result from Order.create():', newOrder.toJSON());

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

router.get('/', authenticate, isAdmin, async (req, res) => {
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
            findOptions.include[0].required = true;
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
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router;