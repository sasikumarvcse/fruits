# 🚀 Setup Guide - Fruits E-commerce Store

## 📋 **Project Overview**
A full-stack fruits e-commerce application with:
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: HTML/CSS/JavaScript with Tailwind CSS
- **Payment**: Razorpay integration
- **Features**: User authentication, product management, cart, orders, admin panel

## ⚠️ **Common Errors & Solutions**

### **1. Environment Variable Error**
**Error:** `MongoDB connection failed` or `JWT_SECRET is required`
**Solution:** Create `.env` file in server directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://growwpark:growwpark123@cluster0.qsoytwo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7A8B9C0D1E2F3
RAZORPAY_KEY_ID=rzp_live_gBP9geXusrKWUg
RAZORPAY_KEY_SECRET=hCpyTv9AiSrMWONnsFu8dSs0
```

### **2. MongoDB Connection Error**
**Error:** `MongoDB not running` or `Connection timeout`
**Solution:** 
- The project uses MongoDB Atlas (cloud database)
- Verify internet connection
- Check if the connection string is correct
- Ensure the database cluster is active

### **3. Port Already in Use**
**Error:** `Port 5000 already in use`
**Solution:** 
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# OR change port in .env
PORT=5001
```

### **4. Module Not Found Errors**
**Error:** `Cannot find module 'express'` or similar
**Solution:** 
```bash
cd server
npm install
```

### **5. Razorpay Script Loading Error**
**Error:** `Razorpay not loaded` or payment failures
**Solution:** 
- Check internet connection
- Refresh the page
- Clear browser cache
- Verify Razorpay credentials in .env

## 🔧 **Step-by-Step Setup**

### **Prerequisites:**
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser
- Internet connection (for MongoDB Atlas and Razorpay)

### **1. Backend Setup:**
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file with the content above
# Copy the env.example and update with your values
copy env.example .env

# Start the server
npm start
```

**Expected Output:**
```
Server running on port 5000
MongoDB connected successfully
```

### **2. Frontend Setup:**
```bash
# Frontend is automatically served by the backend server
# No additional setup needed!
# The server.js file serves both API and frontend files
```

### **3. Database Setup:**
The project uses MongoDB Atlas (cloud database):
- Database is already configured
- Connection string is provided in the .env file
- No local MongoDB installation required

### **4. Admin Setup:**
```bash
# Create admin user
cd server
node create-admin.js
```

This creates an admin user:
- Email: `admin@growwpark.com`
- Password: `admin123`

## 🧪 **Testing the Setup**

### **1. Test Backend:**
```bash
# Test server health
curl http://localhost:5000/api/health

# Test MongoDB connection
curl http://localhost:5000/api/products

# Test authentication
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"123456","role":"user"}'
```

### **2. Test Frontend:**
- Open http://localhost:5000
- Register a new user
- Browse products
- Add items to cart
- Test payment flow (use test cards)

### **3. Test Admin Panel:**
- Navigate to: http://localhost:5000/admin-login.html
- Login with admin credentials
- Access admin dashboard
- Test user/product management

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **CORS Error:**
   ```
   Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
   ```
   **Solution:** Backend CORS is configured, ensure backend is running on port 5000

2. **JWT Token Error:**
   ```
   jwt malformed or invalid token
   ```
   **Solution:** 
   - Check JWT_SECRET in .env
   - Clear localStorage in browser
   - Re-login

3. **Payment Error:**
   ```
   Razorpay payment failed
   ```
   **Solution:** 
   - Verify Razorpay credentials in .env
   - Use test mode for development
   - Check internet connection

4. **Database Error:**
   ```
   MongoDB connection failed
   ```
   **Solution:** 
   - Check internet connection
   - Verify MONGO_URI in .env
   - Ensure MongoDB Atlas cluster is active

5. **Image Upload Error:**
   ```
   Failed to upload image
   ```
   **Solution:** 
   - Check uploads directory permissions
   - Ensure multer is properly configured
   - Verify file size limits

### **Debug Commands:**
```bash
# Check if port is in use (Windows)
netstat -ano | findstr :5000
```

# Check Node.js version
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Check MongoDB connection
curl http://localhost:5000/api/health

# View server logs
# Check the terminal where you ran npm start
```

### **Browser Debugging:**
1. Open Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API requests
4. Check Application tab for localStorage issues

## ✅ **Verification Checklist**

### **Backend Verification:**
- [ ] Server running on port 5000
- [ ] MongoDB connected successfully
- [ ] .env file created with correct values
- [ ] All dependencies installed
- [ ] Admin user created
- [ ] API endpoints responding

### **Frontend Verification:**
- [ ] Frontend accessible (localhost:5000)
- [ ] No console errors
- [ ] User registration working
- [ ] User login working
- [ ] Product listing displaying
- [ ] Cart functionality working
- [ ] Payment integration working

### **Admin Panel Verification:**
- [ ] Admin login accessible
- [ ] Admin dashboard loading
- [ ] User management working
- [ ] Product management working (add, edit, delete)
- [ ] Order management working

### **Payment Verification:**
- [ ] Razorpay script loading
- [ ] Payment form displaying
- [ ] Test payment successful
- [ ] Order confirmation working

## 🆘 **Need Help?**

### **1. Check Logs:**
- Backend: Check terminal where `npm start` is running
- Frontend: Check browser console (F12)
- Database: Check MongoDB Atlas dashboard

### **2. Common Solutions:**
- Restart the server: `Ctrl+C` then `npm start`
- Clear browser cache and localStorage
- Check all environment variables
- Verify internet connection
- Ensure all dependencies are installed

### **3. File Structure Verification:**
```
new-e-commerce/
├── server/
│   ├── .env (create this)
│   ├── package.json
│   ├── server.js
│   └── ...
├── client/
│   ├── index.html
│   ├── style.css
│   └── ...
└── ...
```

### **4. Environment Variables Checklist:**
- [ ] PORT=5000
- [ ] MONGO_URI (MongoDB Atlas connection string)
- [ ] JWT_SECRET (long random string)
- [ ] RAZORPAY_KEY_ID
- [ ] RAZORPAY_KEY_SECRET

## 🎯 **Quick Start Commands**

```bash
# Complete setup in one go
cd new-e-commerce/server
npm install
copy env.example .env
# Edit .env with your values
node create-admin.js
npm start

# That's it! Everything runs on port 5000
```

## 📞 **Support**

If you're still having issues:
1. Check the troubleshooting section above
2. Verify all environment variables
3. Ensure all dependencies are installed
4. Check server and browser console logs
5. Verify internet connection for external services

---

**Happy Coding! 🍎✨**

*Your fruits e-commerce store is ready to serve fresh produce to customers!*
