// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();

// Set CORS origin only from env variable (no fallback to localhost for production)
const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin) {
  console.warn("Warning: FRONTEND_URL is not set. CORS might block requests.");
}
app.use(cors({ origin: allowedOrigin }));

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

app.get('/', (req, res) => {
  res.send('Restaurant POS Backend is running!');
});

app.get('/api/ping', (req, res) => {
  res.send('pong');
});


const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; 

db.sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is running at http://${HOST}:${PORT}`);
  });
});
