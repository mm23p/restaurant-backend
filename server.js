// src/server.js

import 'dotenv/config'; // Modern way to load environment variables at the very top
import express from 'express';
import cors from 'cors';
import db from './models/index.js'; // Note the .js extension is required in ESM
import path from 'path';

// Import all your route files using the new ESM syntax
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import changeRequestRoutes from './routes/changeRequestRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js'; // <-- The missing import

const app = express();

// CORS configuration (no changes needed here)
const allowedOrigins = [
  'https://restaurant-frontend-ah3z.onrender.com',
  'http://localhost:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// --- Use the imported routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', changeRequestRoutes);
app.use('/api/approvals', approvalRoutes); // <-- THE CORRECTED LINE

// Test routes
app.get('/', (req, res) => {
  res.send('Restaurant POS Backend is running!');
});
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// Server launch block (no changes needed here)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running and listening on port ${PORT}`);
});