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
    
    // Create admin user directly in database to bypass pre-save hook
    const adminUser = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@freshfruits.com',
      password: hashedPassword, // Already hashed
      role: 'admin',
      mobile: `123456789${Date.now().toString().slice(-3)}`,
      address: 'Admin Address',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert directly to avoid pre-save hook
    await mongoose.connection.db.collection('users').insertOne(adminUser);
    console.log('✅ New admin created (bypassing pre-save hook)');
    
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
