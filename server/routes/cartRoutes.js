const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/', auth, userController.getCart);
router.post('/add', auth, userController.addToCart);
router.put('/update', auth, userController.updateCart);
router.post('/remove', auth, userController.removeFromCart);
router.post('/clear', auth, userController.clearCart);

module.exports = router; 