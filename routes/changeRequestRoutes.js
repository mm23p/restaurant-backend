import express from 'express';

const router = express.Router();
import { authenticate, isAdmin , isManager} from '../middleware/auth.js';
import db from '../models/index.js'; 
const { ChangeRequest, MenuItem, User } = db;
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


router.post('/:id/approve', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ChangeRequest.findByPk(id);
    if (!request || request.status !== 'PENDING') {
      return res.status(404).json({ error: 'Request not found or already resolved.' });
    }

    switch (request.requestType) {
      case 'MENU_ITEM_EDIT':
        const itemToEdit = await MenuItem.findByPk(request.targetId);
        if (itemToEdit) await itemToEdit.update(request.payload);
        else throw new Error('Item to edit not found');
        break;

      case 'MENU_ITEM_ADD':
        // This correctly creates a new MenuItem from the payload.
        const newItem = await MenuItem.create(request.payload);
        request.targetId = newItem.id;
        break;
      
      case 'MENU_ITEM_DELETE':
        const deletedCount = await MenuItem.destroy({ where: { id: request.targetId } });
        if (deletedCount === 0) throw new Error('Item to delete not found');
        break;

      default:
        return res.status(400).json({ error: 'Unsupported request type.' });
    }

    request.status = 'APPROVED';
    request.approverId = req.user.id;
    request.adminNotes = req.body.adminNotes || 'Approved.';
    request.resolvedAt = new Date();
    await request.save();

    res.status(200).json({ message: 'Request approved.', request });

  } catch (err) {
    console.error(`POST /requests/${req.params.id}/approve error:`, err);
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
export default router;