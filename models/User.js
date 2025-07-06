/* 
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('admin', 'manager', 'waiter'),
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'users', // optional: makes it match the MySQL table name
    timestamps: true     // adds createdAt and updatedAt
});

// We are now telling the User model that it "has many" ChangeRequests.
User.associate = (models) => {
  // A User can make many requests. This links User to ChangeRequest via requesterId.
  User.hasMany(models.ChangeRequest, {
    foreignKey: 'requesterId',
    as: 'requesterRequests' // An alias for the requests made by this user
  });

  // A User can also approve many requests. This links User to ChangeRequest via approverId.
  User.hasMany(models.ChangeRequest, {
    foreignKey: 'approverId',
    as: 'approverRequests' // An alias for the requests approved by this user
  });
};

module.exports = User;
 */

// src/models/User.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // All your column definitions are unchanged
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    full_name: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'manager', 'waiter'), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = (models) => {
    User.hasMany(models.ChangeRequest, { foreignKey: 'requesterId', as: 'requesterRequests' });
    User.hasMany(models.ChangeRequest, { foreignKey: 'approverId', as: 'approverRequests' });
  };

  return User;
};