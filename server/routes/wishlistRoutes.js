const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/', auth, userController.getWishlist);
router.post('/add', auth, userController.addToWishlist);
router.post('/remove', auth, userController.removeFromWishlist);

module.exports = router; 

