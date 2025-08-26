const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

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
    const existingAdmin = await User.findOne({ email: 'admin@freshfruits.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@freshfruits.com');
      console.log('🔑 Password: admin123');
      console.log('🌐 Login at: http://localhost:5000/admin-login.html');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user with default values
                    const adminUser = new User({
                  firstName: 'Admin',
                  lastName: 'User',
                  email: 'admin@freshfruits.com',
                  password: hashedPassword,
                  role: 'admin',
                  mobile: `123456789${Date.now().toString().slice(-3)}`, // Unique mobile number
                  address: 'Admin Address',
                  isAdmin: true
                });

    await adminUser.save();
    
                    console.log('✅ Admin user created successfully!');
                console.log('📧 Email: admin@freshfruits.com');
                console.log('🔑 Password: admin123');
                console.log('🌐 Login at: http://localhost:5000/admin-login.html');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();
