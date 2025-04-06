const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/disserto')
  .then(() => {
    console.log('MongoDB Connected');
    seedAdmin();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });

// Function to seed admin user
const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@disserto.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@disserto.com',
      password: 'admin123',
      role: 'admin',
      branch: 'N/A',
      course: 'N/A'
    });

    console.log('Admin user created:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
    process.exit(1);
  }
}; 