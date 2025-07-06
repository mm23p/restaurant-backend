/* const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_secret_key';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing or malformed' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decodedPayload = jwt.verify(token, SECRET_KEY);
    req.user = decodedPayload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// ✅ Middleware to allow admins only (WITH A NEW ERROR MESSAGE)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // --- THIS IS THE ONLY CHANGE ---
    // We are changing the message to something completely unique.
    return res.status(403).json({
      message: 'ACCESS DENIED FROM THE **NEW** MIDDLEWARE CODE. FILE IS CORRECT.'
    });
  }
};

const isManager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Manager role required.' });
};

module.exports = { authenticate, isAdmin, SECRET_KEY }; */

// src/middleware/auth.js

const jwt = require('jsonwebtoken');

// --- SECURITY IMPROVEMENT: Use an environment variable for your secret key ---
// This is much safer than writing the key directly in the code.
const SECRET_KEY = process.env.JWT_SECRET || 'your_default_secret_for_development';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing or malformed' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decodedPayload = jwt.verify(token, SECRET_KEY);
    req.user = decodedPayload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  // Reverted to a standard, clear error message
  return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

const isManager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Manager role required.' });
};

// --- THIS IS THE CORRECTED EXPORT BLOCK ---
// We now include isManager and remove the unnecessary SECRET_KEY export.
module.exports = {
  authenticate,
  isAdmin,
  isManager
};
