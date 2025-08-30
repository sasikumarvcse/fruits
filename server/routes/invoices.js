const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

// Generate invoice for a specific order
router.get('/generate/:orderId', auth, invoiceController.generateInvoice);

// Download invoice as HTML
router.get('/download/:orderId', auth, invoiceController.downloadInvoice);

// Get all invoices for the current user
router.get('/user', auth, invoiceController.getUserInvoices);

// Get all invoices (admin only)
router.get('/all', auth, invoiceController.getAllInvoices);

module.exports = router;