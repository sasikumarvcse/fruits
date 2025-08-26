const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@growwpark.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@growwpark.com');
      console.log('Password: admin123');
      return;
    }

    // Prompt for mobile number
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const askMobile = () => {
      return new Promise((resolve) => {
        rl.question('Enter mobile number for admin user: ', (mobile) => {
          rl.close();
          resolve(mobile);
        });
      });
    };
    const mobile = await askMobile();

    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@growwpark.com',
      password: 'admin123',
      role: 'admin',
      mobile: mobile,
      address: 'Admin Address',
      isAdmin: true
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@growwpark.com');
    console.log('Password: admin123');
    console.log('You can now login at: http://localhost:5000/admin-login.html');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser(); 