// src/routes/authRoutes.js

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../models/index.js'; 
const { User } = db; 


const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_default_secret_for_development';

// This is the only route in this file.
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // --- PAYLOAD IS DEFINED HERE ---
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    };

    // --- TOKEN IS CREATED HERE, USING THE PAYLOAD ---
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '8h' });

    // --- SAVE THE TOKEN TO THE DATABASE FOR THIS USER ---
    // This logic now correctly happens inside the route handler.
    user.last_known_token = token;
    await user.save();
    console.log(`Token saved for user: ${user.username}`);

    // Send the response
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

export default router;