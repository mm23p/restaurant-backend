// In seeders/YYYYMMDDHHMMSS-create-admin-user.js

'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 10); // Hashing the password

    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      password: hashedPassword,
      full_name: 'Default Admin',
      role: 'admin',
      is_active: true,
      // Sequelize handles createdAt and updatedAt automatically
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    // This allows you to undo the seed if needed
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  }
};