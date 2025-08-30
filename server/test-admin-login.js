const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin authentication...');
    
    // Check if admin user exists
    const admin = await User.findOne({ email: 'admin@freshfruits.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('💡 Run: node create-admin-fixed.js');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('   ID:', admin._id);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   First Name:', admin.firstName);
    console.log('   Last Name:', admin.lastName);
    console.log('   Status:', admin.status);
    
    // Test password comparison
    const bcrypt = require('bcryptjs');
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
    
    console.log('🔑 Password test (admin123):', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    if (isPasswordValid && admin.role === 'admin') {
      console.log('🎉 Admin authentication test PASSED!');
      console.log('📧 Login credentials: admin@freshfruits.com / admin123');
    } else {
      console.log('❌ Admin authentication test FAILED!');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminLogin();