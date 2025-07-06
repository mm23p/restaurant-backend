// src/models/Order.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // An Order belongs to one User (the one who created it).
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      // An Order can have many OrderItems.
      this.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
    }
  }
  Order.init({
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    table: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true
  });
  return Order;
};