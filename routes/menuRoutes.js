
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { MenuItem , ChangeRequest, sequelize} = require('../models');

// A helper middleware for routes accessible by both Admins and Managers
const isManagerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Manager or Admin role required.' });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

router.get('/', authenticate, async (req, res) => {
  try {
    const whereClause = {};

    // For waiters, only show items that are approved.
    // The frontend will handle displaying the "unavailable/out of stock" status.
    if (req.user.role === 'waiter') {
      whereClause.approval_status = 'approved';
    }

    // Admins and Managers will have an empty `whereClause`, so they see everything.
    const items = await MenuItem.findAll({ where: whereClause, order: [['name', 'ASC']] });
    res.json(items);
  } catch (err) {
    console.error('GET /menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});



// GET /menu/categories - Get a unique list of all categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const allItems = await MenuItem.findAll({
      attributes: ['category'],
      raw: true,
    });
    const uniqueCategories = [...new Set(
      allItems.map(item => item.category).filter(cat => cat && cat.trim() !== '')
    )].sort();
    res.json(uniqueCategories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /menu/:id - Get one menu item by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error(`GET /menu/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Server error while fetching item' });
  }
});

/* router.post('/', authenticate, isManagerOrAdmin, async (req, res) => {
  const { user, body: payload } = req;
  try {
    if (user.role === 'admin') {
      const newItem = await MenuItem.create(payload);
      return res.status(201).json(newItem);
    }

    if (user.role === 'manager') {
      // THIS IS THE CORRECT LOGIC: Create a ChangeRequest, NOT a MenuItem.
      await ChangeRequest.create({
        requesterId: user.id,
        requestType: 'MENU_ITEM_ADD',
        targetId: null, // targetId is null because we are adding a new item
        payload: payload,
        requesterNotes: payload.requesterNotes || 'Manager requesting to add this new item.'
      });
      return res.status(202).json({ message: 'Request to add item has been submitted for approval.' });
    }
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A menu item with this name already exists.' });
    }
    console.error("Error in POST /menu:", err);
    return res.status(400).json({ error: 'Failed to process add item request.' });
  }
}); */
router.post('/', authenticate, isManagerOrAdmin, async (req, res) => {
  const { user, body: payload } = req;

  try {
    if (user.role === 'admin') {
      // Admin logic is fine and remains unchanged
      const newItem = await MenuItem.create(payload);
      return res.status(201).json(newItem);
    }

    if (user.role === 'manager') {
      // --- THE CORRECTED RAW SQL QUERY ---
      console.log("MANAGER ADD REQUEST: Using final raw SQL query.");

      // We have removed `updated_at` from the list of columns and values.
      const query = `
        INSERT INTO change_requests 
        (requester_id, request_type, payload, requester_notes, status, created_at) 
        VALUES (:requesterId, :requestType, :payload, :requesterNotes, 'PENDING', NOW());
      `;

      await sequelize.query(query, {
        replacements: {
          requesterId: user.id,
          requestType: 'MENU_ITEM_ADD',
          payload: JSON.stringify(payload),
          requesterNotes: payload.requesterNotes || `Manager request to add item: ${payload.name}`
        },
        type: sequelize.QueryTypes.INSERT
      });
      
      return res.status(202).json({ message: 'Request to add item has been submitted for approval.' });
    }
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A menu item with this name already exists.' });
    }
    console.error("Critical Error in POST /menu with raw query:", err);
    return res.status(500).json({ error: 'Failed to process add item request.' });
  }
});


router.post('/:id/approve', authenticate, isAdmin, async (req, res) => {
    try {
        const item = await MenuItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Menu item not found.' });

        item.approval_status = 'approved';
        item.is_available = true; // Automatically make it available upon approval
        await item.save();
        res.json({ message: 'Menu item approved successfully.', item });
    } catch (err) {
        console.error('Error approving menu item:', err);
        res.status(500).json({ error: 'Failed to approve menu item.' });
    }
});

router.put('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { user, body: proposedChanges } = req;

    const itemToUpdate = await MenuItem.findByPk(id);
    if (!itemToUpdate) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (user.role === 'manager') {
      await ChangeRequest.create({
        requesterId: user.id,
        requestType: 'MENU_ITEM_EDIT',
        targetId: id,
        payload: proposedChanges,
        requesterNotes: proposedChanges.requesterNotes || 'Requesting edit to this item.'
      });
      return res.status(202).json({ message: 'Edit request submitted for approval.' });
    }

    if (user.role === 'admin') {
      await itemToUpdate.update(proposedChanges);
      return res.status(200).json({ message: 'Menu item updated successfully', item: itemToUpdate });
    }
  } catch (err) {
    console.error(`PUT /menu/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to process update request' });
  }
});

router.delete('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  const { user, params: { id } } = req;

  if (user.role === 'admin') {
    try {
      const deleted = await MenuItem.destroy({ where: { id } });
      if (deleted) return res.status(200).json({ message: 'Item deleted successfully' });
      else return res.status(404).json({ error: 'Item not found' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete item' });
    }
  }

  if (user.role === 'manager') {
    try {
      const itemToDelete = await MenuItem.findByPk(id);
      if (!itemToDelete) {
        return res.status(404).json({ error: 'Item to delete not found.' });
      }
      await ChangeRequest.create({
        requesterId: user.id,
        requestType: 'MENU_ITEM_DELETE',
        targetId: id,
        payload: { name: itemToDelete.name },
        requesterNotes: `Manager requested deletion of item "${itemToDelete.name}".`
      });
      return res.status(202).json({ message: 'Request to delete item has been submitted for approval.' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create deletion request.' });
    }
  }
});

router.get('/test-deploy-v3', (req, res) => {
  console.log("!!!!!! DEPLOYMENT TEST V3 SUCCESSFUL !!!!!!");
  res.status(200).send("DEPLOYMENT SUCCESSFUL - LATEST menuRoutes.js FILE IS RUNNING.");
});


module.exports = router;