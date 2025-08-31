const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'sasikumar54vcse@gmail.com' });
    console.log('User found:', !!user);
    
    if (user) {
      const testPasswords = ['password123', '123456', 'password', 'admin123', 'test123', 'sasikumar123'];
      for (const pwd of testPasswords) {
        const isMatch = await user.comparePassword(pwd);
        console.log('Password test:', pwd, '->', isMatch);
        if (isMatch) {
          console.log('✅ Found correct password:', pwd);
          break;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPassword();