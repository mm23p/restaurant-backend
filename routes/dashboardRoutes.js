// routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const { Op, literal } = require('sequelize');
/* const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem'); */ // --- 2. IMPORT MENUITEM MODEL ---
const { authenticate, isAdmin } = require('../middleware/auth');
//const { ChangeRequest, MenuItem, User } = require('../models');
const { Order, User, MenuItem } = require('../models');


router.get('/stats', authenticate, isAdmin, async (req, res) => {
    try {
        // --- Date setup for today and yesterday ---
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0); // Start of yesterday

        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999); // End of yesterday

        // --- Calculations ---
        const ordersToday = await Order.count({
            where: { createdAt: { [Op.gte]: today } },
        });

        // --- NEW CALCULATION for Yesterday's Orders ---
        const ordersYesterday = await Order.count({
            where: {
                createdAt: {
                    [Op.between]: [yesterday, endOfYesterday]
                }
            }
        });

        const activeWaiters = await User.count({
            where: { role: 'waiter', is_active: true },
        });

        // --- Return the new data structure ---
        // We are no longer sending totalOrders
        res.json({ ordersToday, ordersYesterday, activeWaiters });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});


router.get('/low-stock', authenticate, isAdmin, async (req, res) => {
    try {
        const lowStockItems = await MenuItem.findAll({
            where: {
                // Use a literal query to be absolutely explicit.
                // This tells Sequelize: "Generate a WHERE clause that is literally 'stock_quantity <= low_stock_threshold'".
                // This avoids any potential misinterpretation of the 'quantity' field mapping.
                [Op.and]: [
                    literal('quantity <= low_stock_threshold'),
                    {
                        low_stock_threshold: {
                            [Op.not]: null, // Ensure a threshold is set
                            [Op.gt]: 0      // Ensure it's a positive number
                        }
                    }
                ]
            },
            order: [['quantity', 'ASC']], // Order by the actual database column name
            limit: 5
        });
        res.json(lowStockItems);
    } catch (err) {
        console.error('Error fetching low stock items:', err);
        res.status(500).json({ error: 'Failed to fetch inventory alerts.' });
    }
});

module.exports = router;