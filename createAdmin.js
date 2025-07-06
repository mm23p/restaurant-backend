// createAdmin.js

const { User } = require('./models');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Make sure it can read the .env file

async function createAdmin() {
  console.log('Attempting to create a default admin user...');
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Using findOrCreate is safe because it won't create a duplicate
    const [user, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        password: hashedPassword,
        full_name: 'Default Admin',
        role: 'admin',
        is_active: true
      }
    });

    if (created) {
      console.log('✅✅✅ Success! Admin user has been created in the database.');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('ℹ️ Admin user already exists. No action taken.');
    }
    // We need to explicitly exit the process, or it might hang
    process.exit(0);
  } catch (error) {
    console.error('❌❌❌ FAILED TO CREATE ADMIN USER:');
    console.error(error);
    process.exit(1);
  }
}

// Run the function
createAdmin();