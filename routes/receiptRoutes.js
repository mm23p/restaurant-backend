// routes/receiptRoutes.js

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth'); 

const { Order, OrderItem, MenuItem, User } = require('../models');


router.get('/:id', authenticate, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByPk(orderId, {
      attributes: ['id', 'createdAt', 'customer_name', 'table', 'total_price', 'user_id'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['quantity', 'price_at_time'],
          include: [{ model: MenuItem, attributes: ['name'] }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['full_name']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const receipt = {
      orderId: order.id,
      date: order.createdAt,
      customerName: order.customer_name || 'Guest',
      table: order.table || null,
      waiterName: order.user?.full_name || 'N/A',
      items: order.items.map(item => ({
        name: item.MenuItem?.name || 'Item Not Found',
        qty: item.quantity,
        price: parseFloat(item.price_at_time),
        total: (item.quantity * parseFloat(item.price_at_time))
      })),
      total: parseFloat(order.total_price)
    };
    
    res.json(receipt);
  } catch (err) {
    console.error('Error fetching receipt:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;