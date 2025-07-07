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
app.use('/api/requests', require('./routes/changeRequestRoutes'));

// Test routes
app.get('/', (req, res) => {
  res.send('Restaurant POS Backend is running!');
});

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// Launch server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

db.sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is running at http://${HOST}:${PORT}`);
  });
});
