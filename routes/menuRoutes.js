
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { MenuItem, ChangeRequest } = require('../models');

// A helper middleware for routes accessible by both Admins and Managers
const isManagerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Manager or Admin role required.' });
};

// GET /menu - Get all menu items
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await MenuItem.findAll({ order: [['updatedAt', 'DESC']] });
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


router.post('/', authenticate, isManagerOrAdmin, async (req, res) => {
  const user = req.user;
  const payload = req.body;

  if (user.role === 'admin') {
    try {
      const newItem = await MenuItem.create(payload);
      return res.status(201).json(newItem);
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'A menu item with this name already exists.' });
      }
      return res.status(400).json({ error: 'Failed to add menu item' });
    }
  } 
  
  if (user.role === 'manager') {
    await ChangeRequest.create({
      requesterId: user.id,
      requestType: 'MENU_ITEM_ADD',
      targetId: null, // No target ID for a new item
      payload: payload,
      requesterNotes: payload.requesterNotes || null
    });
    return res.status(202).json({ message: 'Request to add item has been submitted for approval.' });
  }
});

// PUT /menu/:id - Update a menu item (Admin or Manager)
router.put('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const proposedChanges = req.body;
    const { user } = req;

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
        requesterNotes: proposedChanges.requesterNotes || null
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
  const user = req.user;
  const { id } = req.params;

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
    // For a delete request, the payload is minimal, just noting what is being deleted.
    const itemToDelete = await MenuItem.findByPk(id);
    if (!itemToDelete) return res.status(404).json({ error: 'Item to delete not found.' });

    await ChangeRequest.create({
      requesterId: user.id,
      requestType: 'MENU_ITEM_DELETE',
      targetId: id,
      payload: { name: itemToDelete.name }, // Store the name for the admin's reference
      requesterNotes: req.body.requesterNotes || 'Requesting deletion of this item.'
    });
    return res.status(202).json({ message: 'Request to delete item has been submitted for approval.' });
  }
});


module.exports = router;