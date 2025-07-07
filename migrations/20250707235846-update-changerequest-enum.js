'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('change_requests', 'request_type', {
      type: Sequelize.ENUM('MENU_ITEM_EDIT', 'MENU_ITEM_ADD', 'MENU_ITEM_DELETE', 'INVENTORY_QUANTITY_UPDATE'),
      allowNull: false
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('change_requests', 'request_type', {
      type: Sequelize.ENUM('MENU_ITEM_EDIT', 'INVENTORY_QUANTITY_UPDATE'),
      allowNull: false
    });
  }
};