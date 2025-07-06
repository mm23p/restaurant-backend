/* // models/MenuItem.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class MenuItem extends Model {}

MenuItem.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Uncategorized',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  track_quantity: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  low_stock_threshold: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 10 
  }
}, {
  sequelize,
  modelName: 'MenuItem',
  tableName: 'menu_items',
  timestamps: true,
});

module.exports = MenuItem; */

// src/models/MenuItem.js

const { DataTypes } = require('sequelize');

// The entire model definition is now wrapped in this function.
// It no longer connects to the database itself.
module.exports = (sequelize, DataTypes) => {
  // We use sequelize.define() for consistency with your other models.
  const MenuItem = sequelize.define('MenuItem', {
    // All your column definitions are copied here exactly as they were.
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'Uncategorized',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    track_quantity: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    low_stock_threshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10
    }
  }, {
    // The options are copied here.
    // 'sequelize' and 'modelName' are not needed because sequelize.define() handles them.
    tableName: 'menu_items',
    timestamps: true,
  });

  // --- NEW, IMPORTANT ADDITION ---
  // This defines the "other side" of the OrderItem relationship.
  // It tells Sequelize that a MenuItem can be included in many OrderItems.
  MenuItem.associate = (models) => {
    MenuItem.hasMany(models.OrderItem, {
      foreignKey: 'menu_item_id'
    });
  };

  return MenuItem;
};