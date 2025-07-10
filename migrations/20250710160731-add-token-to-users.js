'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'last_known_token', {
      type: Sequelize.TEXT, // TEXT can hold a long JWT
      allowNull: true
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'last_known_token');
  }
};