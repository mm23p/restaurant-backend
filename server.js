const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./models'); // This now imports from models/index.js

const app = express();

const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  origin: frontendURL
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/requests', require('./routes/changeRequestRoutes'));

// Basic welcome route
app.get('/', (req, res) => {
  res.send('Restaurant POS Backend is running!');
});
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database connected and synced");
  })
  .catch((error) => {
    console.error("❌ Sequelize sync failed:", error);
  });
module.exports = app;  