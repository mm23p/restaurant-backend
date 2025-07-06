/* require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const db = require('./models');
app.use(cors());
app.use(express.json());
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
//const PORT = process.env.PORT || 5000;

const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

const corsOptions = {
  origin: frontendURL,
  optionsSuccessStatus: 200 // For legacy browser compatibility
};

app.use(cors(corsOptions));
app.use(express.json());
// 5. Middleware Setup


// 6. Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', changeRequestRoutes);


app.get('/', (req, res) => {
  res.send('Restaurant POS Backend is running!');
});
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
module.exports = app; */

// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./models'); // This now imports from models/index.js

const app = express();

// --- Middleware ---
// This flexible CORS setting is good for development.
// We will lock this down later once we have our frontend URL.
app.use(cors()); 
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

// --- REMOVE THE OLD app.listen() BLOCK ---
// const PORT = process.env.PORT || 5000;
// db.sequelize.sync({ alter: true }).then(() => {
//   app.listen(PORT, () => console.log(`🚀 Server is running at http://localhost:${PORT}`));
// });

// --- ADD THIS NEW EXPORT LINE ---
// This allows Vercel to use your Express app as a serverless function.
module.exports = app;