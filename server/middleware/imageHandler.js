const path = require('path');
const fs = require('fs');

// Middleware to handle image serving with fallbacks
const imageHandler = (req, res, next) => {
  // Only handle image requests
  if (!req.path.startsWith('/uploads/')) {
    return next();
  }

  const imagePath = path.join(__dirname, '../../client/uploads', req.path.replace('/uploads/', ''));
  
  // Check if the requested image exists
  if (fs.existsSync(imagePath)) {
    // Serve the requested image
    return res.sendFile(imagePath);
  }

  // If image doesn't exist, serve default image
  const defaultImagePath = path.join(__dirname, '../../client/uploads/default-item.jpg');
  
  if (fs.existsSync(defaultImagePath)) {
    console.log(`🖼️  Image not found: ${req.path}, serving default image`);
    return res.sendFile(defaultImagePath);
  }

  // If even default image doesn't exist, send 404
  console.log(`❌ Image not found: ${req.path} and no default image available`);
  res.status(404).json({ error: 'Image not found' });
};

// Utility function to validate image URLs
const validateImageUrl = (imageUrl) => {
  if (!imageUrl) return false;
  
  // Check if it's a valid URL
  if (imageUrl.startsWith('http')) {
    return true; // External URL, assume valid
  }
  
  // Check if local file exists
  const imagePath = path.join(__dirname, '../../client/uploads', imageUrl);
  return fs.existsSync(imagePath);
};

// Utility function to get safe image URL
const getSafeImageUrl = (imageUrl) => {
  if (!imageUrl) return '/uploads/default-item.jpg';
  
  if (imageUrl.startsWith('http')) {
    return imageUrl; // External URL
  }
  
  // Check if local file exists
  const imagePath = path.join(__dirname, '../../client/uploads', imageUrl);
  if (fs.existsSync(imagePath)) {
    return `/uploads/${imageUrl}`;
  }
  
  // Return default if file doesn't exist
  return '/uploads/default-item.jpg';
};

module.exports = {
  imageHandler,
  validateImageUrl,
  getSafeImageUrl
}; 