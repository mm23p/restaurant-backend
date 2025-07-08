// src/routes/approvalRoutes.js

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { MenuItem, User } = require('../models');

// GET /api/approvals/pending - Get all items needing approval
router.get('/pending', authenticate, isAdmin, async (req, res) => {
    try {
        // Fetch menu items that are pending approval
        const pendingMenuItems = await MenuItem.findAll({
            where: {
                approval_status: 'pending_approval'
            },
            // You can optionally include the user who created it if you add a `createdBy` field to MenuItem
            order: [['createdAt', 'DESC']]
        });

        // We format it to look like the old ChangeRequest for easier frontend integration
        const formattedRequests = pendingMenuItems.map(item => ({
            id: item.id, // The ID of the menu item itself
            requestType: 'MENU_ITEM_ADD',
            payload: item, // The full menu item data is the payload
            requesterNotes: 'Manager has submitted a new item for approval.',
            // You might want to add a `requester` object if you track who created the menu item
        }));

        res.json(formattedRequests);
    } catch (err) {
        console.error('Error fetching pending approvals:', err);
        res.status(500).json({ error: 'Failed to fetch pending approvals.' });
    }
});

module.exports = router;