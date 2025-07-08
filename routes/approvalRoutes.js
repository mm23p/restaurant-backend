// src/routes/approvalRoutes.js

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { MenuItem, ChangeRequest, User } = require('../models');

// GET /api/approvals/pending - Get all items needing approval
router.get('/pending', authenticate, isAdmin, async (req, res) => {
    try {
        // 1. Fetch menu items that are pending approval (ADD requests)
        const pendingMenuItems = await MenuItem.findAll({
            where: { approval_status: 'pending_approval' },
            order: [['createdAt', 'DESC']]
        });

        // 2. Fetch edit and delete requests from the ChangeRequest table
        const pendingChangeRequests = await ChangeRequest.findAll({
            where: { status: 'PENDING' },
            include: [{ model: User, as: 'requester', attributes: ['full_name'] }],
            order: [['createdAt', 'DESC']]
        });

        // 3. Format both lists into a unified structure for the frontend
        const formattedAddRequests = pendingMenuItems.map(item => ({
            // Use a unique ID format to distinguish them
            id: `menu-add-${item.id}`, 
            type: 'MENU_ITEM_ADD',
            payload: item,
            requester: { full_name: 'Manager' }, // You might want to add a createdBy field to MenuItem later
            createdAt: item.createdAt,
            notes: 'New item submitted for approval.'
        }));

        const formattedEditDeleteRequests = pendingChangeRequests.map(req => ({
            id: `changereq-${req.id}`,
            type: req.requestType,
            payload: req.payload,
            requester: req.requester,
            createdAt: req.createdAt,
            notes: req.requesterNotes
        }));

        // 4. Combine and sort all requests by date
        const allPendingRequests = [...formattedAddRequests, ...formattedEditDeleteRequests];
        allPendingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(allPendingRequests);

    } catch (err) {
        console.error('Error fetching pending approvals:', err);
        res.status(500).json({ error: 'Failed to fetch pending approvals.' });
    }
});

router.post('/:id/approve', authenticate, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { adminNotes } = req.body;

    // The ID format tells us what kind of request it is
    const [type, realId] = id.split('-'); 

    try {
        if (type === 'menu-add') {
            // --- Logic to approve a NEW item ---
            const item = await MenuItem.findByPk(realId);
            if (!item || item.approval_status !== 'pending_approval') {
                return res.status(404).json({ error: 'Pending item not found.' });
            }
            item.approval_status = 'approved';
            item.is_available = true;
            await item.save();
            return res.json({ message: 'New menu item approved.' });

        } else if (type === 'changereq') {
            // --- Logic to approve an EDIT or DELETE request ---
            const request = await ChangeRequest.findByPk(realId);
            if (!request || request.status !== 'PENDING') {
                return res.status(404).json({ error: 'Change request not found or already resolved.' });
            }

            if (request.requestType === 'MENU_ITEM_EDIT') {
                const itemToEdit = await MenuItem.findByPk(request.targetId);
                if (itemToEdit) await itemToEdit.update(request.payload);
                else throw new Error('Item to edit not found');
            } else if (request.requestType === 'MENU_ITEM_DELETE') {
                const deletedCount = await MenuItem.destroy({ where: { id: request.targetId } });
                if (deletedCount === 0) throw new Error('Item to delete not found');
            }

            request.status = 'APPROVED';
            request.approverId = req.user.id;
            request.adminNotes = adminNotes || 'Approved.';
            request.resolvedAt = new Date();
            await request.save();
            return res.json({ message: 'Change request approved.' });

        } else {
            return res.status(400).json({ error: 'Invalid request ID format.' });
        }
    } catch (err) {
        console.error(`Error approving request ${id}:`, err);
        res.status(500).json({ error: `Failed to approve request: ${err.message}` });
    }
});


// In src/routes/approvalRoutes.js, after the /approve route

// POST /api/approvals/:id/deny
router.post('/:id/deny', authenticate, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const [type, realId] = id.split('-'); 

    try {
        if (type === 'menu-add') {
            // Denying an ADD request means deleting the draft item.
            await MenuItem.destroy({ where: { id: realId } });
            return res.json({ message: 'Draft item denied and deleted.' });
        } else if (type === 'changereq') {
            const request = await ChangeRequest.findByPk(realId);
            if (!request) return res.status(404).json({ error: 'Request not found.' });

            request.status = 'DENIED';
            request.approverId = req.user.id;
            request.adminNotes = adminNotes || 'Denied.';
            request.resolvedAt = new Date();
            await request.save();
            return res.json({ message: 'Change request denied.' });
        } else {
            return res.status(400).json({ error: 'Invalid request ID format.' });
        }
    } catch (err) {
        console.error(`Error denying request ${id}:`, err);
        res.status(500).json({ error: `Failed to deny request: ${err.message}` });
    }
});
module.exports = router;