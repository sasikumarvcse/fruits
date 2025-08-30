const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixUserAddresses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find users with incomplete addresses
    const usersWithInvalidAddresses = await User.find({
      $or: [
        { 'addresses.0.state': { $exists: false } },
        { 'addresses.0.city': { $exists: false } },
        { 'addresses.0.recipientName': { $exists: false } },
        { 'addresses.0.name': { $exists: false } },
        { 'addresses.0.mobile': { $exists: false } },
        { 'addresses.0.address': { $exists: false } },
        { 'addresses.0.pincode': { $exists: false } },
        { 'addresses.0.state': null },
        { 'addresses.0.city': null },
        { 'addresses.0.recipientName': null },
        { 'addresses.0.name': null },
        { 'addresses.0.mobile': null },
        { 'addresses.0.address': null },
        { 'addresses.0.pincode': null },
        { 'addresses.0.state': '' },
        { 'addresses.0.city': '' },
        { 'addresses.0.recipientName': '' },
        { 'addresses.0.name': '' },
        { 'addresses.0.mobile': '' },
        { 'addresses.0.address': '' },
        { 'addresses.0.pincode': '' }
      ]
    });

    console.log(`Found ${usersWithInvalidAddresses.length} users with invalid addresses`);

    // Clean up each user
    for (const user of usersWithInvalidAddresses) {
      console.log(`Cleaning up user: ${user.email}`);
      
      // Filter out incomplete addresses
      if (user.addresses && user.addresses.length > 0) {
        const validAddresses = user.addresses.filter(addr => 
          addr.name && addr.recipientName && addr.mobile && 
          addr.address && addr.pincode && addr.city && addr.state &&
          addr.name.trim() !== '' && addr.recipientName.trim() !== '' && 
          addr.mobile.trim() !== '' && addr.address.trim() !== '' && 
          addr.pincode.trim() !== '' && addr.city.trim() !== '' && 
          addr.state.trim() !== ''
        );
        
        console.log(`  User had ${user.addresses.length} addresses, keeping ${validAddresses.length} valid ones`);
        
        // Update user with clean addresses
        await User.findByIdAndUpdate(user._id, {
          $set: { addresses: validAddresses }
        });
      }
    }

    console.log('✅ User addresses cleaned up successfully');
    
    // Verify cleanup
    const remainingInvalidUsers = await User.find({
      $or: [
        { 'addresses.0.state': { $exists: false } },
        { 'addresses.0.city': { $exists: false } },
        { 'addresses.0.recipientName': { $exists: false } },
        { 'addresses.0.name': { $exists: false } },
        { 'addresses.0.mobile': { $exists: false } },
        { 'addresses.0.address': { $exists: false } },
        { 'addresses.0.pincode': { $exists: false } },
        { 'addresses.0.state': null },
        { 'addresses.0.city': null },
        { 'addresses.0.recipientName': null },
        { 'addresses.0.name': null },
        { 'addresses.0.mobile': null },
        { 'addresses.0.address': null },
        { 'addresses.0.pincode': null },
        { 'addresses.0.state': '' },
        { 'addresses.0.city': '' },
        { 'addresses.0.recipientName': '' },
        { 'addresses.0.name': '' },
        { 'addresses.0.mobile': '' },
        { 'addresses.0.address': '' },
        { 'addresses.0.pincode': '' }
      ]
    });

    console.log(`After cleanup: ${remainingInvalidUsers.length} users still have invalid addresses`);

  } catch (error) {
    console.error('❌ Error fixing user addresses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
fixUserAddresses();