'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('menu_items', 'approval_status', {
      type: Sequelize.ENUM('approved', 'pending_approval', 'rejected'),
      defaultValue: 'approved',
      allowNull: false
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('menu_items', 'approval_status');
  }
};