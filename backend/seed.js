const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning');
  console.log('Connected to MongoDB');

  // Create admin user
  const existing = await User.findOne({ email: 'admin@eduspace.com' });
  if (!existing) {
    await User.create({
      name: 'Platform Admin',
      email: 'admin@eduspace.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true,
      isActive: true
    });
    console.log('✅ Admin user created: admin@eduspace.com / admin123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(console.error);
