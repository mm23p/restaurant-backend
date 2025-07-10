const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();

const { authenticate, isAdmin } = require('../middleware/auth');
const { User } = require('../models');
const { Op } = require('sequelize');
// PUT /users/:id — edit user info (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { full_name, is_active, username, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    user.full_name = full_name ?? user.full_name;
    user.is_active = is_active ?? user.is_active;
    user.username = username ?? user.username;
    user.role = role ?? user.role;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ message: 'User updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /users - Get all users (admin only)
router.get('/',  async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'full_name', 'is_active', 'role']
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /users - Add a new user (admin only)
//  authenticate, isAdmin,
router.post('/',  async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const newUser = await User.create({
      username,
      password: await bcrypt.hash(password, 10),
      full_name,
      role
    });

    res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/staff', authenticate, async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        // Use Op.or to get users where the role is either 'waiter' or 'manager'
        role: {
          [Op.or]: ['waiter', 'manager']
        }
      },
      attributes: ['id', 'username', 'full_name', 'role', 'is_active', 'last_known_token']
    });
    res.json(staff);
  } catch (err) {
    console.error("Error fetching staff list:", err);
    res.status(500).json({ error: 'Failed to fetch staff list' });
  }
});

// DELETE /users/:id - Delete a user by ID (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await User.destroy({ where: { id } });

    if (deleted) {
      res.json({ message: 'User deleted' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router; 