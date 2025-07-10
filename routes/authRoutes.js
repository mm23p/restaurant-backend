// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '8h' });

const SECRET_KEY = process.env.JWT_SECRET || 'your_default_secret_for_development';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // --- DEBUGGING LOG ---
    // This will print the exact username your backend received from the frontend.
    console.log(`[AUTH] Received login attempt for username: "${username}"`);
    // ---

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username: username } });

    if (!user) {
      // This is the block that is currently running.
      console.log(`[AUTH] Query Result: User "${username}" was NOT FOUND in the database.`);
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name 
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '8h' });

    res.json({
      message: 'Login successful',
      token,
      user: payload
    });

  } catch (err) {
    console.error('Login process error:', err);
    res.status(500).json({ error: 'Server error during login process.' });
  }
});

const userToUpdate = await User.findByPk(user.id);
if (userToUpdate) {
  userToUpdate.last_known_token = token;
  await userToUpdate.save();
}

module.exports = router;