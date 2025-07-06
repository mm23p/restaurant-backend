// src/config/db.js

const { Sequelize } = require('sequelize');
require('dotenv').config(); // Make sure dotenv is loaded

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false // Optional: turn off logging for cleaner console
  }
);

// Test the connection (optional but good practice)
sequelize.authenticate()
  .then(() => console.log('✅ Connected to MySQL database.'))
  .catch(err => console.error('Unable to connect to the database:', err));

// --- CRUCIAL ---
// This file must export the created sequelize instance.
module.exports = sequelize;