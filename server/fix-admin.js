const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB connected');
  
  try {
    // Delete existing admin
    await User.deleteOne({ email: 'admin@freshfruits.com' });
    console.log('✅ Old admin deleted');
    
    // Create new admin with fresh password hash
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('✅ New password hash created:', hashedPassword);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@freshfruits.com',
      password: hashedPassword,
      role: 'admin',
      mobile: `123456789${Date.now().toString().slice(-3)}`,
      address: 'Admin Address',
      isAdmin: true
    });
    
    await adminUser.save();
    console.log('✅ New admin created');
    
    // Verify the password works
    const testAdmin = await User.findOne({ email: 'admin@freshfruits.com' });
    const isMatch = await bcrypt.compare('admin123', testAdmin.password);
    console.log('✅ Password verification test:', isMatch);
    
    console.log('\n🎉 Admin credentials:');
    console.log('📧 Email: admin@freshfruits.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 Login at: http://localhost:5000/admin-login.html');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
});
