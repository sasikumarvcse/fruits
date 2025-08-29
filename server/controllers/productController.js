const Product = require('../models/Product');
const Item = require('../models/Item');
const Order = require('../models/Order');
const User = require('../models/User');
const Razorpay = require('razorpay');

// ✅ 1. CREATE PRODUCT FUNCTION
const createProduct = async (req, res) => {
  try {
    console.log('--- Product Creation Attempt ---');
    console.log('req.user:', req.user);
    console.log('BODY:', req.body);

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    const {
      name,
      description,
      shortDescription,
      price,
      mrp,
      category,
      isOrganic,
      isBestSeller,
      stock,
      status,
      estimatedDelivery,
      bankOffers,
      offers,
      productDetails
    } = req.body;

    // ✅ Handle deliveryInfo properly as an object
    const deliveryInfo = {
      estimatedDelivery: estimatedDelivery || ''
    };

    // Handle multiple image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => f.filename);
    } else if (req.body.imageUrl && req.body.imageUrl.trim() !== '') {
      images = [req.body.imageUrl.trim()];
    } else if (req.body.image && req.body.image.trim() !== '') {
      images = [req.body.image.trim()];
    } else {
      images = ['default-product.jpg'];
    }

    // Parse and validate numeric fields
    const parsedPrice = Number(price);
    const parsedMrp = mrp ? Number(mrp) : undefined;
    const parsedStock = stock !== undefined ? Number(stock) : 0;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    // Handle offers array
    let processedOffers = [];
    if (Array.isArray(offers)) {
      processedOffers = offers;
    } else if (typeof offers === 'string') {
      processedOffers = offers.split(/\n|,/).map(s => s.trim()).filter(Boolean);
    }

    // Handle bank offers array
    let processedBankOffers = [];
    if (Array.isArray(bankOffers)) {
      processedBankOffers = bankOffers;
    } else if (typeof bankOffers === 'string') {
      processedBankOffers = bankOffers.split(/\n|,/).map(s => s.trim()).filter(Boolean);
    }

    const newProduct = new Product({
      name,
      description,
      shortDescription: shortDescription || '',
      price: parsedPrice,
      mrp: parsedMrp,
      category,
      images,
      stock: parsedStock,
      status: status || 'active',
      isOrganic: Boolean(isOrganic),
      isBestSeller: Boolean(isBestSeller),
      seller: req.user._id,
      deliveryInfo,  // ✅ This is now an object as expected
      bankOffers: processedBankOffers,
      offers: processedOffers,
      productDetails: productDetails || {}
    });

    await newProduct.save();
    console.log('Product saved successfully:', newProduct._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });

  } catch (error) {
    console.error('Error in createProduct:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product'
    });
  }
};

// ✅ 2. GET ALL PRODUCTS FUNCTION
const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 20 } = req.query;
    let query = { status: 'active' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    let productsQuery = Product.find(query);

    switch (sort) {
      case 'price-low':
        productsQuery = productsQuery.sort({ price: 1 });
        break;
      case 'price-high':
        productsQuery = productsQuery.sort({ price: -1 });
        break;
      case 'newest':
        productsQuery = productsQuery.sort({ createdAt: -1 });
        break;
      case 'name':
        productsQuery = productsQuery.sort({ name: 1 });
        break;
      default:
        productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    productsQuery = productsQuery.skip(skip).limit(parseInt(limit));

    const products = await productsQuery;
    const totalProducts = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ 3. GET PRODUCT BY ID FUNCTION
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      status: 'active' 
    }).populate('reviews.user', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ 4. GET ALL PRODUCTS FOR ADMIN
const getAllProductsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find()
      .populate('seller', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments();

    res.json({
      success: true,
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('Error in getAllProductsForAdmin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ 5. UPDATE PRODUCT FUNCTION
const updateProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update products'
      });
    }

    const {
      name,
      description,
      price,
      mrp,
      category,
      isOrganic,
      isBestSeller,
      stock,
      status,
      estimatedDelivery,
      bankOffers,
      offers,
      productDetails
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (mrp !== undefined) updateData.mrp = mrp ? Number(mrp) : undefined;
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (status !== undefined) updateData.status = status;
    if (isOrganic !== undefined) updateData.isOrganic = Boolean(isOrganic);
    if (isBestSeller !== undefined) updateData.isBestSeller = Boolean(isBestSeller);

    // ✅ Handle deliveryInfo as object
    if (estimatedDelivery !== undefined) {
      updateData.deliveryInfo = {
        estimatedDelivery: estimatedDelivery || ''
      };
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(f => f.filename);
    }

    updateData.updatedAt = Date.now();

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product'
    });
  }
};

// ✅ 6. DELETE PRODUCT FUNCTION
const deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete products'
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ 7. BULK DELETE PRODUCTS FUNCTION
const bulkDeleteProducts = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can bulk delete products'
      });
    }

    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    const result = await Product.deleteMany({
      _id: { $in: productIds }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} product(s) deleted successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error in bulkDeleteProducts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ 8. UPDATE STOCK FUNCTION
const updateStock = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update stock'
      });
    }

    const { stock } = req.body;
    const parsedStock = Number(stock);

    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid stock quantity is required'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        stock: parsedStock,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      product
    });

  } catch (error) {
    console.error('Error in updateStock:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ 9. GET FREQUENTLY BOUGHT TOGETHER
const getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const productId = req.params.id;

    const orders = await Order.find({ 'items.item': productId });
    const freqMap = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const id = item.item.toString();
        if (id !== productId) {
          freqMap[id] = (freqMap[id] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const productIds = sorted.map(([id]) => id);
    const products = await Product.find({ 
      _id: { $in: productIds },
      status: 'active'
    });

    const result = productIds
      .map(id => products.find(p => p._id.toString() === id))
      .filter(Boolean);

    res.json({
      success: true,
      products: result
    });

  } catch (error) {
    console.error('Error in getFrequentlyBoughtTogether:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ 10. CREATE RAZORPAY ORDER FUNCTION
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: 'order_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed'
    });
  }
};

// ✅ EXPORT ALL FUNCTIONS - This must be at the end
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getAllProductsForAdmin,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  updateStock,
  getFrequentlyBoughtTogether,
  createRazorpayOrder
};
