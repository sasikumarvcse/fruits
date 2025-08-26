const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB connected');
  
  try {
    // Find the admin user
    const admin = await User.findOne({ email: 'admin@freshfruits.com' });
    console.log('Admin found:', admin ? 'YES' : 'NO');
    
    if (admin) {
      console.log('Admin details:');
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- Password hash:', admin.password);
      
      // Test password verification
      const isMatch = await bcrypt.compare('admin123', admin.password);
      console.log('Password match:', isMatch);
      
      // Test with wrong password
      const isWrongMatch = await bcrypt.compare('wrongpassword', admin.password);
      console.log('Wrong password match:', isWrongMatch);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}); 