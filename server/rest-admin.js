// server/reset-admin.js
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function resetAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing admin user
        await User.deleteOne({ email: 'admin@growwpark.com' });
        console.log('🗑️ Deleted existing admin user');

        // Create fresh admin user
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@growwpark.com',
            password: 'admin123', // This will be hashed by pre-save hook
            mobile: '9999999999',
            role: 'admin',
            status: 'active'
        });

        await adminUser.save();
        console.log('✅ Fresh admin user created successfully!');
        console.log('📧 Email: admin@growwpark.com');
        console.log('🔒 Password: admin123');
        console.log('👤 Role: admin');
        console.log('📊 Status: active');

        // Verify the admin user
        const verifyAdmin = await User.findOne({ 
            email: 'admin@growwpark.com', 
            role: 'admin' 
        });
        
        if (verifyAdmin) {
            console.log('✅ Admin user verified in database');
            console.log('🔒 Password hash:', verifyAdmin.password.substring(0, 20) + '...');
            
            // Test password comparison
            const testResult = await verifyAdmin.comparePassword('admin123');
            console.log('🧪 Password test result:', testResult);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔐 Database connection closed');
    }
}

resetAdminUser();
