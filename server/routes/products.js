const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/products/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/frequently-bought', productController.getFrequentlyBoughtTogether);

// Admin routes
router.post('/', auth, upload.array('images', 5), productController.createProduct);
router.get('/admin/all', auth, productController.getAllProductsForAdmin);
router.put('/:id', auth, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);
router.post('/bulk-delete', auth, productController.bulkDeleteProducts);
router.patch('/:id/stock', auth, productController.updateStock);

module.exports = router;
