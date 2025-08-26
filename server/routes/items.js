const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Multer destination called for file:', file.originalname);
    cb(null, path.join(__dirname, '../../client/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.round(Math.random() * 1E9));
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter called with file:', file);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Public routes (no auth required)
router.get('/', itemController.getAllItems);

// Admin only - get all items for management (must come before /:id routes)
router.get('/admin/all', authMiddleware, itemController.getAllItemsForAdmin);

router.get('/:id', itemController.getItemById);
router.get('/:id/frequently-bought-together', itemController.getFrequentlyBoughtTogether);

// Test upload route
router.post('/test-upload', upload.single('image'), (req, res) => {
  console.log('Test upload route hit');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  if (req.file) {
    res.json({ 
      message: 'File uploaded successfully', 
      filename: req.file.filename,
      path: req.file.path 
    });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
}, (err, req, res, next) => {
  console.error('Upload error:', err);
  res.status(400).json({ error: err.message });
});

// Protected routes (auth required)
router.post('/',
  authMiddleware, 
  upload.array('images', 5),
  itemController.createItem
);


router.put('/:id', 
  authMiddleware, 
  upload.array('images', 5),
  itemController.updateItem
);
router.delete('/:id', authMiddleware, itemController.deleteItem);

// Advanced seller dashboard endpoints
router.post('/:id/set-main-image', authMiddleware, itemController.setMainImage);
router.post('/bulk-delete', authMiddleware, itemController.bulkDeleteItems);
router.post('/bulk-update-category', authMiddleware, itemController.bulkUpdateCategory);

// Ask About Product (admin will handle)
router.post('/:id/ask-about', authMiddleware, itemController.askAboutProduct);

// Add product review endpoint
router.post('/:productId/review', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id;
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // Check if user has purchased and received (delivered) this product
  const deliveredOrder = await Order.findOne({
    user: userId,
    status: 'delivered',
    'items.item': product._id
  });
  if (!deliveredOrder) return res.status(403).json({ message: 'You can only review products you have received.' });

  // Prevent duplicate reviews
  if (product.reviews.some(r => r.user.toString() === userId.toString())) {
    return res.status(400).json({ message: 'You have already reviewed this product.' });
  }

  product.reviews.push({ user: userId, rating, comment });
  await product.save();
  res.json({ message: 'Review added', review: product.reviews[product.reviews.length - 1] });
});

// Image upload endpoint for Quill editor
const quillUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../client/uploads/'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  }
});
router.post('/upload', quillUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

module.exports = router;