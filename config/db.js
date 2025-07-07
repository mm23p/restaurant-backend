// src/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        // Uncomment if your DB requires SSL or other options:
        // ssl: { rejectUnauthorized: false }
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      }
    );

sequelize.authenticate()
  .then(() => console.log('✅ Connected to MySQL database.'))
  .catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
