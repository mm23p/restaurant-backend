// src/middleware/auth.js

import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your_default_secret_for_development';

// --- THE FIX: Use 'export' before each function ---

export const authenticate = (req, res, next) => {
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

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

export const isManager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Manager role required.' });
};

export const isAdminOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin or Manager role required.' });
};

// We no longer need the module.exports block at the bottom
// module.exports = { ... }; // <-- DELETE THIS BLOCK