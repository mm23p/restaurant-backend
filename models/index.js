// src/models/index.js

'use strict';

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import mysql2 from 'mysql2';
import { fileURLToPath } from 'url';
import { createRequire } from 'module'; // <-- 1. Import the helper

// These lines correctly set up __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- THIS IS THE FIX ---
const require = createRequire(import.meta.url); // 2. Create a local require function
const configJSON = require('../config/config.json'); // 3. Use it to load the JSON file
// --------------------

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = configJSON[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    ...config,
    dialect: 'mysql', // Explicitly set dialect
    dialectModule: mysql2,
    logging: false,
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    dialectModule: mysql2,
    logging: false,
  });
}

// Manually import and initialize each model
import initUserModel from './User.js';
import initMenuItemModel from './MenuItem.js';
import initOrderModel from './Order.js';
import initOrderItemModel from './OrderItem.js';
import initChangeRequestModel from './ChangeRequest.js';

const models = [
  initUserModel,
  initMenuItemModel,
  initOrderModel,
  initOrderItemModel,
  initChangeRequestModel,
];

for (const initModel of models) {
  const model = initModel(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// Run associations
Object.keys(db).forEach(modelName => {
  if (db[modelName] && db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;