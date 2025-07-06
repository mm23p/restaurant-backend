// src/models/index.js

'use strict';

const fs = require('fs');
//const path = 'path';
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

// --- THIS IS THE KEY CHANGE ---
// Instead of looking for a config.json file, we directly import your
// existing, working sequelize instance from your db.js file.
const sequelize = require('../config/db');
const db = {};

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
    // We pass the connected sequelize instance to each model file.
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Run the association functions for all models.
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export the fully configured db object.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;