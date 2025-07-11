// In migrations/...-add-token-to-users.js

'use strict';

// We are NOT using 'import' here. We use require.
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
// We are NOT using 'export default'. We use module.exports.
module.exports = {
  async up (queryInterface, Sequelize) {
    // The logic inside is unchanged.
    await queryInterface.addColumn('users', 'last_known_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'last_known_token');
  }
};