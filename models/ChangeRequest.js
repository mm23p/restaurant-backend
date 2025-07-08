// src/models/ChangeRequest.js

const { DataTypes } = require('sequelize');


console.log("<<<<< LOADING THE LATEST ChangeRequest.js MODEL - VERSION 2 >>>>>");
// The entire file is now wrapped in this function
module.exports = (sequelize, DataTypes) => {
  const ChangeRequest = sequelize.define('ChangeRequest', {
    // All your column definitions are unchanged
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    requesterId: { type: DataTypes.INTEGER, allowNull: false, field: 'requester_id' },
    approverId: { type: DataTypes.INTEGER, allowNull: true, field: 'approver_id' },
    status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'DENIED'), defaultValue: 'PENDING', allowNull: false },
   // requestType: { type: DataTypes.ENUM('MENU_ITEM_EDIT', 'INVENTORY_QUANTITY_UPDATE'), allowNull: false, field: 'request_type' },
   requestType: {
  type: DataTypes.ENUM('MENU_ITEM_EDIT', 'MENU_ITEM_ADD', 'MENU_ITEM_DELETE', 'INVENTORY_QUANTITY_UPDATE'), // <-- NEW
  allowNull: false,
  field: 'request_type' 
}, 
   targetId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null, field: 'target_id' },
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