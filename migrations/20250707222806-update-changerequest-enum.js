// In migrations/YYYYMMDDHHMMSS-update-changerequest-enum.js

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // This command updates the 'request_type' column to accept the new values.
    await queryInterface.changeColumn('change_requests', 'request_type', {
      type: Sequelize.ENUM('MENU_ITEM_EDIT', 'MENU_ITEM_ADD', 'MENU_ITEM_DELETE', 'INVENTORY_QUANTITY_UPDATE'),
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    // This defines how to undo the migration if necessary.
    await queryInterface.changeColumn('change_requests', 'request_type', {
      type: Sequelize.ENUM('MENU_ITEM_EDIT', 'INVENTORY_QUANTITY_UPDATE'),
      allowNull: false
    });
  }
};