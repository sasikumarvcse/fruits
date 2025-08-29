// create-admin.js (inside server folder)
const mongoose = require('mongoose');
const User = require('./models/User'); // ✅ FIXED: Correct relative path
require('dotenv').config();

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ 
            email: 'admin@growwpark.com',
            role: 'admin' 
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log('📧 Email: admin@growwpark.com');
            console.log('🔐 Role:', existingAdmin.role);
            console.log('📊 Status:', existingAdmin.status);
            return;
        }

        // Create new admin user
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@growwpark.com',
            password: 'admin123', // Will be hashed by pre-save hook
            mobile: '9999999999',
            role: 'admin',
            status: 'active'
        });

        await adminUser.save();
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@growwpark.com');
        console.log('🔒 Password: admin123');
        console.log('👤 Role: admin');
        console.log('📊 Status: active');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔐 Database connection closed');
    }
}

createAdminUser();
