#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🍎 Fruits E-commerce Store - Environment Setup');
console.log('==============================================');
console.log('');

const serverDir = path.join(__dirname, 'server');
const envPath = path.join(serverDir, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('If you want to recreate it, delete the existing file first.');
    process.exit(0);
}

// Default environment variables
const envContent = `# Server Configuration
PORT=5000

# MongoDB Connection (Cloud Database)
MONGO_URI=mongodb+srv://growwpark:growwpark123@cluster0.qsoytwo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret (Change this in production!)
JWT_SECRET=a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7A8B9C0D1E2F3

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_live_gBP9geXusrKWUg
RAZORPAY_KEY_SECRET=hCpyTv9AiSrMWONnsFu8dSs0

# Optional: Customize these settings
# NODE_ENV=development
# UPLOAD_PATH=./uploads
# MAX_FILE_SIZE=5242880
`;

try {
    // Ensure server directory exists
    if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
    }

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env file created successfully!');
    console.log('');
    console.log('📁 Location:', envPath);
    console.log('');
    console.log('🔧 Environment variables configured:');
    console.log('   • PORT: 5000');
    console.log('   • MONGO_URI: MongoDB Atlas connection');
    console.log('   • JWT_SECRET: Authentication secret');
    console.log('   • RAZORPAY_KEY_ID: Payment gateway');
    console.log('   • RAZORPAY_KEY_SECRET: Payment gateway secret');
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('   • Change JWT_SECRET in production');
    console.log('   • Update Razorpay credentials for production');
    console.log('   • Keep this file secure and never commit to version control');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Run: cd server && npm install');
    console.log('   2. Run: node create-admin.js');
    console.log('   3. Run: npm start');
    console.log('');

} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('');
    console.log('🔧 Manual setup:');
    console.log('   1. Navigate to the server directory');
    console.log('   2. Copy env.example to .env');
    console.log('   3. Update the values in .env file');
    process.exit(1);
}
