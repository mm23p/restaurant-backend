// src/models/User.js

import { DataTypes } from 'sequelize';

// We now export a default function, just like the other refactored models.
export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // Column definitions are unchanged
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
    },
    // This is the new field we need for the offline login fix
    last_known_token: {
        type: DataTypes.TEXT,
        allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  // The association logic is also unchanged
  User.associate = (models) => {
    User.hasMany(models.ChangeRequest, {
      foreignKey: 'requesterId',
      as: 'requesterRequests'
    });
    User.hasMany(models.ChangeRequest, {
      foreignKey: 'approverId',
      as: 'approverRequests'
    });
    // Add any other associations here if needed (e.g., for Orders)
    User.hasMany(models.Order, {
        foreignKey: 'user_id',
        as: 'orders'
    });
  };

  return User;
};