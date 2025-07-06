/* // models/changeRequest.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Make sure this path is correct

const ChangeRequest = sequelize.define('ChangeRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'requester_id' // Maps this camelCase key to the snake_case column
    },
    approverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approver_id'
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'DENIED'),
        defaultValue: 'PENDING',
        allowNull: false
    },
    requestType: {
        type: DataTypes.ENUM('MENU_ITEM_EDIT', 'INVENTORY_QUANTITY_UPDATE'),
        allowNull: false,
        field: 'request_type'
    },
    targetId: {
        type: DataTypes.INTEGER.UNSIGNED, // Matching your UN column type
        allowNull: false,
        field: 'target_id'
    },
    payload: {
        type: DataTypes.JSON, // Using the native JSON type
        allowNull: false
    },
    requesterNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'requester_notes'
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'admin_notes'
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'resolved_at'
    }
}, {
    tableName: 'change_requests',
    timestamps: true,
    updatedAt: false,
    underscored: true
});

// If you have a models/index.js file, this association is useful.
// If not, it's still good practice to define it.
ChangeRequest.associate = (models) => {
    ChangeRequest.belongsTo(models.User, { as: 'requester', foreignKey: 'requesterId' });
    ChangeRequest.belongsTo(models.User, { as: 'approver', foreignKey: 'approverId' });
};

module.exports = ChangeRequest; */


// src/models/ChangeRequest.js

const { DataTypes } = require('sequelize');

// The entire file is now wrapped in this function
module.exports = (sequelize, DataTypes) => {
  const ChangeRequest = sequelize.define('ChangeRequest', {
    // All your column definitions are unchanged
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    requesterId: { type: DataTypes.INTEGER, allowNull: false, field: 'requester_id' },
    approverId: { type: DataTypes.INTEGER, allowNull: true, field: 'approver_id' },
    status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'DENIED'), defaultValue: 'PENDING', allowNull: false },
    requestType: { type: DataTypes.ENUM('MENU_ITEM_EDIT', 'INVENTORY_QUANTITY_UPDATE'), allowNull: false, field: 'request_type' },
    targetId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'target_id' },
    payload: { type: DataTypes.JSON, allowNull: false },
    requesterNotes: { type: DataTypes.TEXT, allowNull: true, field: 'requester_notes' },
    adminNotes: { type: DataTypes.TEXT, allowNull: true, field: 'admin_notes' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' }
  }, {
    tableName: 'change_requests',
    timestamps: true,
    updatedAt: false,
    underscored: true
  });

  ChangeRequest.associate = (models) => {
    ChangeRequest.belongsTo(models.User, { as: 'requester', foreignKey: 'requesterId' });
    ChangeRequest.belongsTo(models.User, { as: 'approver', foreignKey: 'approverId' });
  };

  return ChangeRequest;
};