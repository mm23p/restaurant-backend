const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isManager } = require('../middleware/auth');
const { ChangeRequest, MenuItem, User } = require('../models');

// GET /requests - Get all pending requests (for Admin dashboard)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const requests = await ChangeRequest.findAll({
      where: { status: 'PENDING' },
      include: [{ model: User, as: 'requester', attributes: ['id', 'full_name', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (err) {
    console.error('GET /requests error:', err);
    res.status(500).json({ error: 'Failed to fetch change requests' });
  }
});

// GET /requests/my-requests - Get all requests for the logged-in manager
router.get('/my-requests', authenticate, isManager, async (req, res) => {
  try {
    const requests = await ChangeRequest.findAll({
      where: { requesterId: req.user.id },
      include: [{ model: User, as: 'approver', attributes: ['full_name', 'username'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    console.error('GET /requests/my-requests error:', err);
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});


/* router.post('/:id/approve', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const request = await ChangeRequest.findByPk(id);

    if (!request || request.status !== 'PENDING') {
      return res.status(404).json({ error: 'Request not found or already resolved.' });
    }

    if (request.requestType === 'MENU_ITEM_EDIT') {
      const item = await MenuItem.findByPk(request.targetId);
      if (item) {
        await item.update(request.payload);
      } else {
        request.status = 'DENIED';
        request.adminNotes = 'Auto-denied: Target item no longer exists.';
        await request.save();
        return res.status(404).json({ error: 'Target item not found; request denied.' });
      }
    } else if (request.requestType === 'MENU_ITEM_ADD') {
      // Create new MenuItem using payload
      try {
        const newItem = await MenuItem.create(request.payload);
        request.targetId = newItem.id; // Link new item id to the request
      } catch (err) {
        return res.status(500).json({ error: 'Failed to create new menu item.' });
      }
    } else if (request.requestType === 'MENU_ITEM_DELETE') {
      // Delete MenuItem with targetId
      const item = await MenuItem.findByPk(request.targetId);
      if (item) {
        await item.destroy();
      } else {
        request.status = 'DENIED';
        request.adminNotes = 'Auto-denied: Target item no longer exists.';
        await request.save();
        return res.status(404).json({ error: 'Target item not found; request denied.' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported request type.' });
    }

    // Mark request as approved
    request.status = 'APPROVED';
    request.approverId = req.user.id;
    request.adminNotes = adminNotes || 'Approved.';
    request.resolvedAt = new Date();
    await request.save();

    res.status(200).json({ message: 'Request approved.', request });
  } catch (err) {
    console.error(`POST /requests/${req.params.id}/approve error:`, err);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});
 */

router.post('/:id/approve', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ChangeRequest.findByPk(id);
    if (!request || request.status !== 'PENDING') {
      return res.status(404).json({ error: 'Request not found or already resolved.' });
    }

    // --- NEW LOGIC TO HANDLE ADD/EDIT/DELETE ---
    switch (request.requestType) {
      case 'MENU_ITEM_EDIT':
        const itemToEdit = await MenuItem.findByPk(request.targetId);
        if (itemToEdit) await itemToEdit.update(request.payload);
        else throw new Error('Item to edit not found');
        break;

      case 'MENU_ITEM_ADD':
        const newItem = await MenuItem.create(request.payload);
        request.targetId = newItem.id; // Store the ID of the newly created item
        break;
      
      case 'MENU_ITEM_DELETE':
        const deletedCount = await MenuItem.destroy({ where: { id: request.targetId } });
        if (deletedCount === 0) throw new Error('Item to delete not found');
        break;

      default:
        // Handle INVENTORY_QUANTITY_UPDATE or other types here in the future
        return res.status(400).json({ error: 'Unsupported request type.' });
    }

    // Mark request as approved
    request.status = 'APPROVED';
    request.approverId = req.user.id;
    request.adminNotes = req.body.adminNotes || 'Approved.';
    request.resolvedAt = new Date();
    await request.save();

    res.status(200).json({ message: 'Request approved.', request });

  } catch (err) {
    console.error(`POST /requests/${req.params.id}/approve error:`, err);
    // You could also auto-deny the request here if something fails
    res.status(500).json({ error: `Failed to approve request: ${err.message}` });
  }
});

router.post('/:id/deny', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body || {};
    if (!adminNotes) return res.status(400).json({ error: 'A reason is required to deny a request.' });

    const request = await ChangeRequest.findByPk(id);
    if (!request || request.status !== 'PENDING') return res.status(404).json({ error: 'Request not found or already resolved.' });

    request.status = 'DENIED';
    request.approverId = req.user.id;
    request.adminNotes = adminNotes;
    request.resolvedAt = new Date();
    await request.save();

    res.status(200).json({ message: 'Request denied.', request });
  } catch (err) {
    console.error(`POST /requests/${req.params.id}/deny error:`, err);
    res.status(500).json({ error: 'Failed to deny request' });
  }
});
module.exports = router;