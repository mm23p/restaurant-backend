// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { authenticate, isAdminOrManager } = require('../middleware/auth');
const { Order, OrderItem, MenuItem, User } = require('../models');

// routes/reportRoutes.js

/**
 * @route   GET /api/reports/waiter-performance
 * @desc    Get sales performance grouped by waiter for a specific date
 * @access  Private, Admin
 * @query   date (e.g., "2023-10-27")
 */
router.get('/waiter-performance', authenticate, isAdminOrManager, async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'A date must be provided.' });

        // --- TIMEZONE-AWARE DATE HANDLING ---
        // 'date' comes in as 'YYYY-MM-DD'
        // This ensures the query covers the entire day from start to finish in UTC,
        // which will correctly capture all records for that local date.
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.999Z`;

        console.log(`Querying for waiter performance between: ${startDate} and ${endDate}`); // Added for debugging

        const performanceData = await Order.findAll({
            where: {
                createdAt: { [Op.between]: [startDate, endDate] },
                status: 'completed'
            },
            attributes: [
                [fn('COUNT', col('Order.id')), 'totalOrders'],
                [fn('SUM', col('total_price')), 'totalSales'],
            ],
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name'],
                required: true,
            }],
            group: ['user.id', 'user.full_name'], // Group by both to be safe
            order: [[literal('totalSales'), 'DESC']],
        });

        // The mapping is complex, let's simplify to ensure it works
        const report = performanceData.map(p => {
            // Sequelize returns a mix of dataValues and nested objects. Accessing directly can be safer.
            const user = p.get('user');
            const totalSales = parseFloat(p.get('totalSales') || 0);
            const totalOrders = parseInt(p.get('totalOrders') || 0, 10);
            
            return {
                waiterId: user.id,
                waiterName: user.full_name,
                totalOrders: totalOrders,
                totalSales: totalSales.toFixed(2),
                averageOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : "0.00",
            };
        });

        res.json(report);
    } catch (err) {
        console.error("Error fetching waiter performance:", err);
        res.status(500).json({ error: 'Failed to generate waiter performance report.' });
    }
});

/**
 * @route   GET /api/reports/menu-item-sales
 * @desc    Get sales performance grouped by menu item for a date range
 * @access  Private, Admin/Manager
 */


router.get('/menu-item-sales', authenticate, isAdminOrManager, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'A start date and end date are required.' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const salesData = await OrderItem.findAll({
      attributes: [
        
        [fn('SUM', col('OrderItem.quantity')), 'totalQuantitySold'],
        [fn('SUM', literal('`OrderItem`.`quantity` * `OrderItem`.`price_at_time`')), 'totalRevenue'],
      ],
      include: [
        {
          model: Order,
          where: { createdAt: { [Op.between]: [start, end] } , status: 'completed' },
          attributes: [],
          required: true,
        },
        {
          model: MenuItem,
          attributes: [ 'id','name', 'category'],
          required: true,
        }
      ],
    
       group: ['MenuItem.id'],
      order: [[literal('totalRevenue'), 'DESC']],
    });

       const report = salesData.map(s => {
      const menuItem = s.get('MenuItem'); // Access the nested MenuItem object
      return {
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        category: menuItem.category,
        totalQuantitySold: parseInt(s.getDataValue('totalQuantitySold'), 10),
        totalRevenue: parseFloat(s.getDataValue('totalRevenue') || 0).toFixed(2),
      }
    });
    res.json(report);

  } catch (err) {
    console.error("Error fetching menu item sales:", err);
    res.status(500).json({ error: 'Failed to generate menu item sales report.' });
  }
});



/**
 * @route   GET /api/reports/waiter-orders
 * @desc    Get all orders for a specific waiter on a specific date
 * @access  Private, Admin
 */

router.get('/waiter-orders', authenticate, isAdminOrManager, async (req, res) => {
  try {
    const { waiterId, date } = req.query;
    if (!waiterId || !date) {
      return res.status(400).json({ error: 'A waiterId and date must be provided.' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.findAll({
      where: {
        user_id: waiterId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [{
        model: OrderItem,
        as: 'items',
        attributes: ['quantity', 'price_at_time'],
        include: [{
          model: MenuItem,
          attributes: ['name']
        }]
      }],
      order: [['createdAt', 'ASC']]
    });

    const detailedOrders = orders.map(order => ({
      id: order.id,
      time: order.createdAt,
      total: parseFloat(order.total_amount).toFixed(2),
      items: order.items.map(oi => `${oi.quantity}x ${oi.MenuItem.name}`).join(', ')
    }));

    res.json(detailedOrders);

  } catch (err) {
    console.error("Error fetching waiter order details:", err);
    res.status(500).json({ error: 'Failed to generate waiter order details.' });
  }
});


module.exports = router;