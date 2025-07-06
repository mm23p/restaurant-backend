/* // routes/menuRoutes.js

const express = require('express');
const router = express.Router();
//const { Op, literal } = require('sequelize');

const { ChangeRequest, MenuItem } = require('../models');

const { authenticate, isAdmin } = require('../middleware/auth');
const isManagerOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Manager or Admin role required.' });
};

// --- CORRECTED ROUTE ORDER ---

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
// THIS MUST BE DEFINED BEFORE THE /:id ROUTE
router.get('/categories', authenticate, async (req, res) => {
  try {
    const allItems = await MenuItem.findAll({
      attributes: ['category'],
      raw: true, 
    });
    const uniqueCategories = [...new Set(
      allItems
        .map(item => item.category)
        .filter(cat => cat && cat.trim() !== '')
    )].sort();
    res.json(uniqueCategories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /menu/:id - Get one menu item by ID
// This route is now correctly placed after the more specific '/categories' route
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

// POST /menu - Add a new menu item
router.post('/', authenticate, isAdmin, async (req, res) => {
  // ... (your existing POST logic is fine)
  try {
    const { name, price, is_available, category, quantity, track_quantity, low_stock_threshold } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') return res.status(400).json({ error: 'Item name is required.' });
    if (price === undefined || isNaN(price) || price <= 0) return res.status(400).json({ error: 'Price must be a positive number.' });
    if (track_quantity) {
        if (quantity === undefined || !Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ error: 'Valid initial quantity is required.' });
        if (low_stock_threshold !== undefined && (!Number.isInteger(low_stock_threshold) || low_stock_threshold < 0)) return res.status(400).json({ error: 'Low stock threshold must be a non-negative number.' });
    }
    const newItem = await MenuItem.create({
      name, price, is_available: is_available ?? true, category: category || 'Uncategorized', track_quantity: track_quantity ?? false,
      quantity: track_quantity ? (quantity ?? 0) : 0,
      low_stock_threshold: track_quantity ? (low_stock_threshold ?? 10) : null
    });
    res.status(201).json(newItem);
  } catch (err) {
    
    if (err.name === 'SequelizeUniqueConstraintError') {
      // This is the specific error for a duplicate entry
      return res.status(400).json({ error: 'A menu item with this name already exists. Please choose a different name.' });
    }
    // Fallback for other potential errors
    res.status(400).json({ error: 'Failed to add menu item' });
  }
  
});

router.put('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const proposedChanges = req.body;
    const { user } = req; // The user object from the authenticate middleware

    // First, verify the menu item exists
    const item = await MenuItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // --- LOGIC FOR MANAGER ---
    if (user.role === 'manager') {
      // For managers, we create a change request and DO NOT apply changes directly.
      await ChangeRequest.create({
        requesterId: user.id,
        requestType: 'MENU_ITEM_EDIT',
        targetId: id,
        payload: proposedChanges, // Store all proposed changes in the payload
        requesterNotes: proposedChanges.requesterNotes || null // Capture notes from the request body if provided
      });
      return res.status(202).json({ message: 'Edit request submitted for approval.' });
    }

    // --- LOGIC FOR ADMIN (Your original logic, slightly adapted) ---
    if (user.role === 'admin') {
      // Admins apply changes directly.
      const { name, price, is_available, category, quantity, track_quantity, low_stock_threshold } = proposedChanges;
      
      // --- Standard field updates ---
      item.name = name ?? item.name;
      item.price = price ?? item.price;
      item.category = category ?? item.category;
      item.track_quantity = track_quantity ?? item.track_quantity;

      if (item.track_quantity) {
          item.quantity = quantity ?? item.quantity;
          item.low_stock_threshold = low_stock_threshold ?? item.low_stock_threshold;
      } else {
          item.quantity = 0;
          item.low_stock_threshold = null;
      }

      const adminManuallySetAvailability = is_available !== undefined;
      if (adminManuallySetAvailability) {
          item.is_available = is_available;
      } else {
          if (item.track_quantity && item.quantity <= 0) {
              item.is_available = false;
          } else {
              item.is_available = true;
          }
      }
    
      await item.save();
      return res.status(200).json({ message: 'Menu item updated successfully', item });
    }

  } catch (err) {
    console.error(`PUT /menu/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to process update request' });
  }
});

// DELETE /menu/:id - Delete a menu item
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  // ... (your existing DELETE logic is fine)
  try {
    const { id } = req.params;
    const deleted = await MenuItem.destroy({ where: { id } });
    if (deleted) res.status(200).json({ message: 'Item deleted successfully' });
    else res.status(404).json({ error: 'Item not found' });
  } catch (err) {
    console.error(`DELETE /menu/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router; */

// src/routes/menuRoutes.js

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');

// --- CORRECT IMPORT ---
// Import all necessary models from the central `models` hub.
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

// POST /menu - Add a new menu item (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const newItem = await MenuItem.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A menu item with this name already exists.' });
    }
    res.status(400).json({ error: 'Failed to add menu item' });
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

// DELETE /menu/:id - Delete a menu item (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.destroy({ where: { id } });
    if (deleted) {
      res.status(200).json({ message: 'Item deleted successfully' });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (err) {
    console.error(`DELETE /menu/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;