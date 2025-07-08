// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const path = require('path');

const app = express();

// ✅ Fix CORS: Allow frontend in production + localhost for development
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

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
//app.use('/api/requests', require('./routes/changeRequestRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
// Test routes
app.get('/', (req, res) => {
  res.send('Restaurant POS Backend is running!');
});

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

const PORT = process.env.PORT || 10000; // Render provides the port via this env var

// We no longer use sequelize.sync() in production.
// We just start listening for requests immediately.
app.listen(PORT, () => {
  console.log(`🚀 Server is running and listening on port ${PORT}`);
});