const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/growwpark', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
    console.log('✅ Connected to MongoDB');
    
    try {
        // Import User model
        const User = require('./server/models/User');
        
        // Check if admin user exists
        const adminUser = await User.findOne({ email: 'admin@freshfruits.com' });
        
        if (adminUser) {
            console.log('✅ Admin user found:');
            console.log('   Email:', adminUser.email);
            console.log('   Role:', adminUser.role);
            console.log('   First Name:', adminUser.firstName);
            console.log('   Last Name:', adminUser.lastName);
            
            // Test password verification
            const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
            console.log('   Password Valid:', isPasswordValid);
            
            if (isPasswordValid) {
                // Test JWT token generation
                const token = jwt.sign(
                    { userId: adminUser._id, email: adminUser.email, role: adminUser.role },
                    'your-secret-key',
                    { expiresIn: '24h' }
                );
                
                console.log('✅ JWT token generated successfully');
                console.log('   Token:', token.substring(0, 50) + '...');
                
                // Test token verification
                try {
                    const decoded = jwt.verify(token, 'your-secret-key');
                    console.log('✅ JWT token verified successfully');
                    console.log('   Decoded:', decoded);
                } catch (error) {
                    console.error('❌ JWT token verification failed:', error.message);
                }
            } else {
                console.log('❌ Admin password is incorrect');
            }
        } else {
            console.log('❌ Admin user not found');
            console.log('   Please run create-admin-fixed.js to create the admin user');
        }
        
    } catch (error) {
        console.error('❌ Error testing admin login:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
});