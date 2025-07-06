// models/index.js

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  // --- THIS IS THE CORRECTED CONFIGURATION ---
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: 'mysql',
    // We are adding a pool configuration to manage connections more robustly.
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // This explicitly tells the mysql2 driver how to behave.
    // The `insecureAuth` option can sometimes resolve tricky handshake issues.
    dialectOptions: {
      insecureAuth: true
    }
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// ... The rest of the file is completely unchanged ...
// The code that reads model files and runs associations is still correct.

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;