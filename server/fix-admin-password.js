// server/fix-admin-password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixAdminPassword() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete ALL existing admin users to start fresh
        const deleteResult = await User.deleteMany({ 
            $or: [
                { email: 'admin@growwpark.com' },
                { role: 'admin' }
            ]
        });
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing admin users`);

        // Manually hash the password (bypass mongoose middleware)
        const plainPassword = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        
        console.log('🔒 Password details:');
        console.log('   - Plain password:', plainPassword);
        console.log('   - Salt rounds:', saltRounds);
        console.log('   - Hashed password:', hashedPassword);
        console.log('   - Hash length:', hashedPassword.length);

        // Create admin user with manually hashed password
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@growwpark.com',
            password: hashedPassword, // Pre-hashed password
            mobile: '9999999999',
            role: 'admin',
            status: 'active'
        });

        // Save WITHOUT triggering pre-save hook (to avoid double hashing)
        await User.collection.insertOne(adminUser.toObject());
        console.log('✅ Admin user created with pre-hashed password');

        // Verify the saved user
        const savedAdmin = await User.findOne({ email: 'admin@growwpark.com' });
        if (savedAdmin) {
            console.log('✅ Admin user verification:');
            console.log('   - ID:', savedAdmin._id);
            console.log('   - Email:', savedAdmin.email);
            console.log('   - Role:', savedAdmin.role);
            console.log('   - Status:', savedAdmin.status);
            console.log('   - Stored hash:', savedAdmin.password);
            console.log('   - Stored hash length:', savedAdmin.password.length);

            // Test password comparison manually
            console.log('\n🧪 Testing password comparison:');
            
            // Test 1: Manual bcrypt.compare
            const manualCompare = await bcrypt.compare(plainPassword, savedAdmin.password);
            console.log('   - Manual bcrypt.compare result:', manualCompare);
            
            // Test 2: Using model method
            const modelCompare = await savedAdmin.comparePassword(plainPassword);
            console.log('   - Model comparePassword result:', modelCompare);
            
            // Test 3: Wrong password
            const wrongCompare = await bcrypt.compare('wrongpassword', savedAdmin.password);
            console.log('   - Wrong password test:', wrongCompare);

            if (manualCompare && modelCompare) {
                console.log('🎉 SUCCESS: Password comparison is working correctly!');
                console.log('📧 Admin login credentials:');
                console.log('   - Email: admin@growwpark.com');
                console.log('   - Password: admin123');
            } else {
                console.log('❌ FAILED: Password comparison still not working');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔐 Database connection closed');
    }
}

fixAdminPassword();
