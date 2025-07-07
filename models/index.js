'use strict';

require('dotenv').config(); // Load .env variables

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const mysql2 = require('mysql2'); // Use mysql2 explicitly
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

if (config.use_env_variable) {
  // ✅ Connect using DATABASE_URL
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: 'mysql',
    dialectModule: mysql2,
    logging: false,
    dialectOptions: {
      // Uncomment if your DB host requires secure connection
      // ssl: { rejectUnauthorized: false }
    }
  });
} else {
  // Fallback in case you're using manual DB vars (optional)
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      dialectModule: mysql2,
      logging: false,
    }
  );
}

// ✅ Automatically load all models in this folder
fs.readdirSync(__dirname)
  .filter(file =>
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  )
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// ✅ Run associations if defined
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
