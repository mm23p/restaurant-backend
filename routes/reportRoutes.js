// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');

const { authenticate, isAdmin } = require('../middleware/auth');
const { Order, OrderItem, MenuItem, User } = require('../models');


// New middleware to allow both Admin and Manager roles
const isAdminOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin or Manager role required.' });
};

// routes/reportRoutes.js

/**
 * @route   GET /api/reports/waiter-performance
 * @desc    Get sales performance grouped by waiter for a specific date
 * @access  Private, Admin
 * @query   date (e.g., "2023-10-27")
 */
/* router.get('/waiter-performance', authenticate, isAdmin, async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'A date must be provided.' });
        }

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const performanceData = await Order.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate],
                },
            },
            attributes: [
                'user_id',
                // --- THIS IS THE FIX ---
                // We specify `Order.id` to remove the ambiguity.
                [fn('COUNT', col('Order.id')), 'totalOrders'],
                [fn('SUM', col('total_amount')), 'totalSales'],
            ],
            include: [{
                model: User,
                as: 'user',
                attributes: ['full_name'],
                required: true,
            }],
            group: ['user_id', 'waiter.id'],
            order: [[literal('totalSales'), 'DESC']],
        });

        // Remap data for a cleaner frontend structure
        const report = performanceData.map(p => ({
            waiterId: p.user_id,
            waiterName: p.user.full_name,
            totalOrders: parseInt(p.getDataValue('totalOrders'), 10),
            totalSales: parseFloat(p.getDataValue('totalSales')).toFixed(2),
            averageOrderValue: (p.getDataValue('totalSales') / p.getDataValue('totalOrders')).toFixed(2),
        }));

        res.json(report);

    } catch (err) {
        console.error("Error fetching waiter performance:", err);
        res.status(500).json({ error: 'Failed to generate waiter performance report.' });
    }
});
 */

router.get('/waiter-performance', authenticate, isAdminOrManager, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'A date must be provided.' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const performanceData = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        'user_id',
        [fn('COUNT', col('Order.id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalSales'],
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['full_name'],
        required: true,
      }],
      group: ['user_id', 'user.id'],
      order: [[literal('totalSales'), 'DESC']],
    });

    const report = performanceData.map(p => ({
      waiterId: p.user_id,
      waiterName: p.user.full_name,
      totalOrders: parseInt(p.getDataValue('totalOrders'), 10),
      totalSales: parseFloat(p.getDataValue('totalSales')).toFixed(2),
      averageOrderValue: (p.getDataValue('totalSales') / p.getDataValue('totalOrders')).toFixed(2),
    }));

    res.json(report);

  } catch (err) {
    console.error("Error fetching waiter performance:", err);
    res.status(500).json({ error: 'Failed to generate waiter performance report.' });
  }
});
/**
 * @route   GET /api/reports/menu-item-sales
 * @desc    Get sales performance grouped by menu item for a date range
 * @access  Private, Admin
 * @query   startDate, endDate (e.g., "2023-10-01", "2023-10-27")
 */

/* router.get('/menu-item-sales', authenticate, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'A start date and end date are required.' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // This query needs to join OrderItem with Order to get the date
        const salesData = await OrderItem.findAll({
            attributes: [
                'menu_item_id',
                [fn('SUM', col('OrderItem.quantity')), 'totalQuantitySold'],
                // Use the correct column name 'price_at_time' from your OrderItem model
                [fn('SUM', literal('`OrderItem`.`quantity` * `OrderItem`.`price_at_time`')), 'totalRevenue'],
            ],
            include: [
                {
                    model: Order, // Include the parent Order model
                    where: { createdAt: { [Op.between]: [start, end] } },
                    attributes: [], // We only need it for the WHERE clause, not to return its data
                    required: true,
                },
                {
                    model: MenuItem,
                    // The alias 'MenuItem' from your old code was likely incorrect. 
                    // Let's rely on Sequelize's default if no alias is set, or ensure it matches the model definition.
                    // If this still fails, check the association in OrderItem.js
                    attributes: ['name', 'category'],
                    required: true,
                }
            ],
            group: ['menu_item_id', 'MenuItem.id', 'MenuItem.name', 'MenuItem.category'], // Group by all non-aggregated columns
            order: [[literal('totalRevenue'), 'DESC']],
        });

        const report = salesData.map(s => ({
            menuItemId: s.menu_item_id,
            itemName: s.MenuItem.name,
            category: s.MenuItem.category,
            totalQuantitySold: parseInt(s.getDataValue('totalQuantitySold'), 10),
            totalRevenue: parseFloat(s.getDataValue('totalRevenue') || 0).toFixed(2),
        }));
        
        res.json(report);

    } catch (err) {
        console.error("Error fetching menu item sales:", err);
        res.status(500).json({ error: 'Failed to generate menu item sales report.' });
    }
});
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
        'menu_item_id',
        [fn('SUM', col('OrderItem.quantity')), 'totalQuantitySold'],
        [fn('SUM', literal('`OrderItem`.`quantity` * `OrderItem`.`price_at_time`')), 'totalRevenue'],
      ],
      include: [
        {
          model: Order,
          where: { createdAt: { [Op.between]: [start, end] } },
          attributes: [],
          required: true,
        },
        {
          model: MenuItem,
          attributes: ['name', 'category'],
          required: true,
        }
      ],
      group: ['menu_item_id', 'MenuItem.id', 'MenuItem.name', 'MenuItem.category'],
      order: [[literal('totalRevenue'), 'DESC']],
    });

    const report = salesData.map(s => ({
      menuItemId: s.menu_item_id,
      itemName: s.MenuItem.name,
      category: s.MenuItem.category,
      totalQuantitySold: parseInt(s.getDataValue('totalQuantitySold'), 10),
      totalRevenue: parseFloat(s.getDataValue('totalRevenue') || 0).toFixed(2),
    }));

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
 * @query   waiterId, date
 */
/* router.get('/waiter-orders', authenticate, isAdmin, async (req, res) => {
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
                user_id: waiterId, // Filter by the specific waiter
                createdAt: {
                    [Op.between]: [startDate, endDate], // Filter by the specific day
                },
            },
            include: [{
                model: OrderItem,
                as: 'items', // Use the correct alias from your Order model
                attributes: ['quantity'],
                include: [{
                    model: MenuItem,
                    attributes: ['name']
                }]
            }],
            order: [['createdAt', 'ASC']] // Show orders from earliest to latest
        });

        // Remap the data for a clean frontend response
        const detailedOrders = orders.map(order => ({
            id: order.id,
            time: order.createdAt, // Send the full timestamp
            total: parseFloat(order.total_amount).toFixed(2),
            items: order.order_items.map(oi => `${oi.quantity}x ${oi.menu_item.name}`).join(', ')
        }));

        res.json(detailedOrders);

    } catch (err) {
        console.error("Error fetching waiter order details:", err);
        res.status(500).json({ error: 'Failed to generate waiter order details.' });
    }
}); */

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
        attributes: ['quantity'],
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