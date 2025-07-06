require('dotenv').config();

// 2. Import Modules
const express = require('express');
const cors = require('cors');
// --- THIS IS THE KEY CHANGE ---
// We now import the fully configured sequelize instance from our central models hub.
const { sequelize } = require('./models');

// 3. Import all your route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const changeRequestRoutes = require('./routes/changeRequestRoutes');

// 4. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

const corsOptions = {
  origin: frontendURL,
  optionsSuccessStatus: 200 // For legacy browser compatibility
};

app.use(cors(corsOptions));
app.use(express.json());
// 5. Middleware Setup
app.use(cors());
app.use(express.json());

// 6. Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', changeRequestRoutes);

// 7. Start the Server
const startServer = async () => {
  try {
    // This connects to the database AND ensures all tables exist.
    // 'alter: true' will try to update tables to match your models.
    // Use with caution in production, but it's perfect for development.
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start the server:', error);
     process.exit(1)
  }

};

startServer();