
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

  // Admin logic is unchanged
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
  
  // Manager logic is now more robust
  if (user.role === 'manager') {
    /* try {
      // --- THE FIX IS HERE ---
      // We create the object first, and only include the fields we have.
      // We no longer explicitly set `targetId: null`.
      const requestData = {
        requesterId: user.id,
        requestType: 'MENU_ITEM_ADD',
        payload: payload,
        requesterNotes: payload.requesterNotes || null
      };

      await ChangeRequest.create(requestData);
      
      return res.status(202).json({ message: 'Request to add item has been submitted for approval.' });
    } catch (err) {
      // Add a specific error log for this case
      console.error('Error creating ADD request for manager:', err);
      return res.status(500).json({ error: 'Failed to create add item request.' });
    } */

       console.log(">>>> MANAGER ADD ITEM ROUTE HAS BEEN REACHED SUCCESSFULLY (DATABASE BYPASSED) <<<<");
    return res.status(202).json({ message: 'DEBUG: Request received, database call was bypassed.' });
  }
});

router.delete('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  // Admin logic remains the same
  if (user.role === 'admin') {
    try {
      const deleted = await MenuItem.destroy({ where: { id } });
      if (deleted) return res.status(200).json({ message: 'Item deleted successfully' });
      else return res.status(404).json({ error: 'Item not found' });
    } catch (err) {
      console.error('Error during admin delete:', err);
      return res.status(500).json({ error: 'Failed to delete item' });
    }
  }

  // Manager logic is now more robust
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
        payload: { name: itemToDelete.name }, // Store the name for the admin's reference
        // We no longer rely on req.body. We just use a standard note.
        requesterNotes: `Manager requested deletion of item "${itemToDelete.name}".`
      });

      return res.status(202).json({ message: 'Request to delete item has been submitted for approval.' });

    } catch (err) {
      console.error('Error creating deletion request for manager:', err);
      return res.status(500).json({ error: 'Failed to create deletion request.' });
    }
  }
});


module.exports = router;