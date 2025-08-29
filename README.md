<<<<<<< HEAD
# fruits
=======
# 🍎 Fruits E-commerce Store

A modern, full-stack e-commerce platform for selling fresh fruits and produce. Built with Node.js, Express, MongoDB, and modern web technologies.

## ✨ Features

### 🛒 **Customer Features**
- User registration and authentication
- Browse products with search and filters
- Shopping cart functionality
- Secure payment processing (Razorpay)
- Order tracking and history
- Wishlist management
- Product reviews and ratings

### 🏪 **Admin Features**
- Complete product management (add, edit, delete)
- User management
- Order management and tracking
- Sales analytics and reporting
- Platform settings and configuration

### 👑 **Admin Features**
- Complete platform management
- User management
- Product management (add, edit, delete)
- Order monitoring and status updates
- Analytics dashboard and reporting

## 🚀 Quick Start

### **Option 1: Automated Setup (Recommended)**

#### Windows (Command Prompt):
```bash
quick-start.bat
```

#### Windows (PowerShell):
```powershell
.\quick-start.ps1
```

### **Option 2: Manual Setup**

1. **Complete Setup (Backend + Frontend):**
```bash
cd server
npm install
copy env.example .env
# Edit .env with your credentials
node create-admin.js
npm start
```

**That's it!** The server runs both backend API and frontend on port 5000.

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Modern web browser**
- **Internet connection** (for MongoDB Atlas and Razorpay)

## 🔧 Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://growwpark:growwpark123@cluster0.qsoytwo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7A8B9C0D1E2F3
RAZORPAY_KEY_ID=rzp_live_gBP9geXusrKWUg
RAZORPAY_KEY_SECRET=hCpyTv9AiSrMWONnsFu8dSs0
```

## 🏗️ Project Structure

```
new-e-commerce/
├── 📁 server/                 # Backend API + Frontend Server
│   ├── 📁 controllers/        # Route controllers
│   ├── 📁 middleware/         # Custom middleware
│   ├── 📁 models/            # Database models
│   ├── 📁 routes/            # API routes
│   ├── 📁 uploads/           # Product images
│   ├── server.js             # Main server file (serves both API & frontend)
│   └── package.json          # Dependencies
├── 📁 client/                # Frontend Files
│   ├── 📄 index.html         # Main landing page
│   ├── 📄 style.css          # Styles
│   ├── 📄 script.js          # Main JavaScript
│   ├── 📁 user/              # User pages
│   └── 📁 uploads/           # Static assets
├── 📄 SETUP_GUIDE.md         # Detailed setup guide
├── 📄 quick-start.bat        # Windows batch script
├── 📄 quick-start.ps1        # PowerShell script
├── 📄 setup-env.js           # Environment setup script
└── 📄 README.md              # This file
```

## 🧪 Testing

### **Backend Testing:**
```bash
# Test server health
curl http://localhost:5000/api/health

# Test products API
curl http://localhost:5000/api/products

# Test user registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"123456","role":"user"}'
```

### **Frontend Testing:**
- Open http://localhost:5000
- Register a new user
- Browse products
- Add items to cart
- Test payment flow

### **Admin Testing:**
- Navigate to http://localhost:5000/admin-login.html
- Login: `admin@growwpark.com` / `admin123`
- Test admin dashboard features
- Test product management (add, edit, delete)
- Test user management

## 🔐 Default Credentials

### **Admin Account:**
- **Email:** `admin@growwpark.com`
- **Password:** `admin123`

### **Test Payment Cards (Razorpay):**
- **Card Number:** `4111 1111 1111 1111`
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Name:** Any name

## 🚨 Troubleshooting

### **Common Issues:**

1. **Port 5000 already in use:**
   ```bash
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

2. **MongoDB connection failed:**
   - Check internet connection
   - Verify MONGO_URI in .env
   - Ensure MongoDB Atlas cluster is active

3. **Module not found errors:**
   ```bash
   cd server
   npm install
   ```

4. **Payment failures:**
   - Check Razorpay credentials in .env
   - Verify internet connection
   - Use test mode for development

### **Debug Commands:**
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Check server logs
# Look at the terminal where npm start is running
```

## 📚 API Documentation

### **Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### **Products:**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/admin/products` - Add new product (admin only)
- `PUT /api/admin/products/:id` - Update product (admin only)
- `DELETE /api/admin/products/:id` - Delete product (admin only)

### **Orders:**
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

### **Cart:**
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `DELETE /api/cart/remove/:id` - Remove item from cart

## 🛡️ Security Features

- **JWT Authentication** for secure API access
- **Password Hashing** using bcrypt
- **Input Validation** and sanitization
- **CORS Protection** for cross-origin requests
- **Rate Limiting** on sensitive endpoints
- **SQL Injection Prevention** through Mongoose

## 🎨 UI/UX Features

- **Responsive Design** for all devices
- **Modern UI** with Tailwind CSS
- **Smooth Animations** and transitions
- **Intuitive Navigation** with breadcrumbs
- **Loading States** and error handling
- **Toast Notifications** for user feedback

## 📱 Progressive Web App (PWA)

- **Offline Support** with service worker
- **App-like Experience** with manifest
- **Push Notifications** (coming soon)
- **Install Prompt** for mobile devices

## 🔄 Development Workflow

1. **Clone the repository**
2. **Install dependencies** (`npm install` in server directory)
3. **Set up environment variables** (create .env file)
4. **Create admin user** (`node create-admin.js`)
5. **Start development servers**
6. **Make changes and test**
7. **Deploy to production**

## 🚀 Deployment

### **Backend Deployment:**
- Deploy to Heroku, Railway, or similar
- Set environment variables in deployment platform
- Ensure MongoDB Atlas is accessible

### **Frontend Deployment:**
- Deploy static files to Netlify, Vercel, or similar
- Update API endpoints to production URLs
- Configure CORS for production domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation:** Check `SETUP_GUIDE.md` for detailed setup instructions
- **Issues:** Create an issue on GitHub
- **Email:** Contact the development team

---

**Happy Coding! 🍎✨**

*Your fruits e-commerce store is ready to serve fresh produce to customers!* 
>>>>>>> b74857a (Initial project files)
"# fruitE" 
