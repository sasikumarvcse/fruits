# Admin System Setup Guide

## Overview
The admin system provides comprehensive management capabilities for users, sellers, and products. The admin login is hidden from regular users and sellers, accessible only via direct URL.

## Features

### 🔐 Admin Authentication
- Separate admin login page (`admin-login.html`)
- Role-based access control (admin only)
- Secure JWT token authentication

### 📊 Admin Dashboard
- Real-time statistics (users, sellers, products, orders)
- Modern, responsive interface
- Sidebar navigation with multiple sections

### 👥 User Management
- View all users with pagination
- Search and filter by role
- Add new users (admin, seller, user)
- Edit user details
- Delete users
- View user statistics

### 🏪 Seller Management
- View all sellers with product counts
- Search and filter sellers
- Suspend/activate sellers
- View seller products
- Delete sellers (cascades to products)

### 📦 Product Management
- View all products in grid layout
- Search and filter by category
- Edit product details
- Delete products
- Product image management

## Setup Instructions

### 1. Create Admin User
Run the admin creation script:
```bash
cd server
node create-admin.js
```

This will create an admin user with:
- Email: `admin@growwpark.com`
- Password: `admin123`

### 2. Access Admin Panel
1. Start the server: `cd server && npm start`
2. Navigate to: `http://localhost:5000/admin-login.html`
3. Login with admin credentials
4. You'll be redirected to the admin dashboard

### 3. Admin URLs
- **Admin Login**: `http://localhost:5000/admin-login.html`
- **Admin Dashboard**: `http://localhost:5000/admin-dashboard.html`

## Security Features

### 🔒 Access Control
- Admin routes protected by middleware
- Role verification on all admin endpoints
- Separate admin token storage
- Automatic logout on invalid access

### 🛡️ Data Protection
- Password hashing for all users
- JWT token expiration
- Input validation and sanitization
- SQL injection prevention

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard` - Get platform statistics

### Users
- `GET /api/admin/users` - Get all users (with pagination/filters)
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Sellers
- `GET /api/admin/sellers` - Get all sellers (with pagination/filters)
- `PATCH /api/admin/sellers/:id/status` - Update seller status
- `GET /api/admin/sellers/:id/products` - Get seller products

### Products
- `DELETE /api/admin/products/:id` - Delete product (admin only)

## Usage Examples

### Creating a New User
```javascript
const response = await fetch('/api/admin/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'seller'
  })
});
```

### Suspending a Seller
```javascript
const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    status: 'suspended'
  })
});
```

## Important Notes

### 🔐 Admin Access
- Admin login is NOT visible on the main landing page
- Only accessible via direct URL or special access
- Regular users and sellers cannot see admin options

### 🚨 Security Considerations
- Change default admin password after first login
- Use strong passwords for admin accounts
- Regularly review admin access logs
- Implement rate limiting for admin endpoints

### 📝 Data Management
- Deleting a seller also deletes their products
- Admin cannot delete their own account
- User status changes are logged
- All admin actions are tracked

## Troubleshooting

### Common Issues

1. **"Access denied" error**
   - Ensure you're logged in as admin
   - Check if admin token is valid
   - Verify user role is 'admin'

2. **Admin login not working**
   - Run the admin creation script
   - Check server is running
   - Verify database connection

3. **Dashboard not loading data**
   - Check admin token in localStorage
   - Verify API endpoints are accessible
   - Check browser console for errors

### Support
For technical issues, check:
- Server logs for error messages
- Browser console for JavaScript errors
- Network tab for API request failures
- Database connection status

## Future Enhancements

- [ ] Order management system
- [ ] Advanced analytics dashboard
- [ ] Bulk user operations
- [ ] Email notifications for admin actions
- [ ] Audit trail for all admin actions
- [ ] Advanced reporting features 