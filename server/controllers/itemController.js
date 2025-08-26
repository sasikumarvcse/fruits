const Item = require('../models/Item');
const Order = require('../models/Order');
const User = require('../models/User');

// Create a new item
exports.createItem = async (req, res) => {
  console.log('req.user in createItem:', req.user); // Defensive log
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated (req.user missing)' });
  }
  console.log('req.user:', req.user); // DEBUG: Log the user from auth middleware
  console.log('--- Product Upload Attempt ---');
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);
  console.log('FILES:', req.files);
  console.log('HEADERS:', req.headers);
  try {
    const { name, description, price, mrp, category, isOrganic, isBestSeller, offers, returnPolicy, warranty, deliveryInfo, details, status, productDetails } = req.body;
    console.log('DEBUG: details field received:', details);
    // Patch: Always save a valid details object
    let detailsToSave = details;
    if (!detailsToSave || detailsToSave === '' || detailsToSave === undefined) {
      detailsToSave = '{}';
    }
    // Parse stock as a number
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : 0;
    // Handle multiple image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => f.filename);
      console.log('Files uploaded successfully:', images);
    } else if (req.body.imageUrl && req.body.imageUrl.trim() !== '') {
      let url = req.body.imageUrl.trim();
      if (url.startsWith('http')) {
        images = [url];
      } else {
        images = [url.split('/').pop()];
      }
    } else if (req.body.image && req.body.image.trim() !== '') {
      // Handle single image URL from admin form
      images = [req.body.image.trim()];
    } else {
      images = ['default-item.jpg'];
      console.log('No files uploaded, using default image');
    }
    console.log('Images to save in DB:', images);
    
    const newItem = new Item({
      name,
      description,
      price,
      mrp: mrp ? Number(mrp) : undefined,
      category,
      isOrganic: isOrganic || false,
      isBestSeller: isBestSeller || false,
      images,
      image: images[0], // Add image field for frontend compatibility
      stock,
      status: status || 'active', // Add status field with default 'active'
      offers: Array.isArray(offers) ? offers : (typeof offers === 'string' ? offers.split(/\n|,/).map(s => s.trim()).filter(Boolean) : []),
      returnPolicy: returnPolicy || undefined,
      warranty: warranty || undefined,
      deliveryInfo: deliveryInfo || undefined,
      details: detailsToSave,
      productDetails: productDetails || {}
    });

    await newItem.save();
    console.log('Product saved:', newItem);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error in createItem:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all items (public)
exports.getAllItems = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = { status: 'active' }; // Only show active products to users
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    let itemsQuery = Item.find(query);
    
    if (sort) {
      switch (sort) {
        case 'price-low':
          itemsQuery = itemsQuery.sort({ price: 1 });
          break;
        case 'price-high':
          itemsQuery = itemsQuery.sort({ price: -1 });
          break;
        case 'newest':
          itemsQuery = itemsQuery.sort({ createdAt: -1 });
          break;
        case 'oldest':
          itemsQuery = itemsQuery.sort({ createdAt: 1 });
          break;
        default:
          itemsQuery = itemsQuery.sort({ createdAt: -1 });
      }
    } else {
      itemsQuery = itemsQuery.sort({ createdAt: -1 });
    }
    
    const items = await itemsQuery;
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get item by ID (public)
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, status: 'active' })
      .populate('reviews.user', 'firstName lastName');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all items for admin management
exports.getAllItemsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);
  try {
    const { name, description, price, mrp, category, isOrganic, isBestSeller, offers, returnPolicy, warranty, deliveryInfo, details, status, productDetails } = req.body;
    console.log('DEBUG: details field received (update):', details);
    const updateData = { name, description, price, category };
    if (mrp !== undefined) updateData.mrp = mrp ? Number(mrp) : undefined;
    if (isOrganic !== undefined) updateData.isOrganic = isOrganic;
    if (isBestSeller !== undefined) updateData.isBestSeller = isBestSeller;
    // Patch: Always save a valid details object
    if (details !== undefined) updateData.details = details && details !== '' ? details : '{}';
    // Parse stock as a number
    updateData.stock = req.body.stock !== undefined ? Number(req.body.stock) : 0;
    // Add status field
    if (status !== undefined) updateData.status = status;
    // In updateItem, handle multiple images if files are uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(f => f.filename);
    } else if (req.body.imageUrl && req.body.imageUrl.trim() !== '') {
      let url = req.body.imageUrl.trim();
      if (url.startsWith('http')) {
        updateData.images = [url];
      } else {
        updateData.images = [url.split('/').pop()];
      }
    } else if (req.body.image && req.body.image.trim() !== '') {
      // Handle single image URL from admin form
      updateData.images = [req.body.image.trim()];
    }
    
    if (updateData.images && updateData.images.length > 0) {
      updateData.image = updateData.images[0];
    }
    
    if (offers !== undefined) updateData.offers = Array.isArray(offers) ? offers : (typeof offers === 'string' ? offers.split(/\n|,/).map(s => s.trim()).filter(Boolean) : []);
    if (returnPolicy !== undefined) updateData.returnPolicy = returnPolicy;
    if (warranty !== undefined) updateData.warranty = warranty;
    if (deliveryInfo !== undefined) updateData.deliveryInfo = deliveryInfo;
    if (productDetails !== undefined) updateData.productDetails = productDetails;
    
    // Only admin can update items
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update products' });
    }

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an item (admin only)
exports.deleteItem = async (req, res) => {
  try {
    // Only admin can delete items
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete products' });
    }

    const item = await Item.findOneAndDelete({ 
      _id: req.params.id
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 

exports.getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const productId = req.params.id;
    // Find all orders containing this product
    const orders = await Order.find({ 'items.item': productId });
    const freqMap = {};
    orders.forEach(order => {
      order.items.forEach(i => {
        const id = i.item.toString();
        if (id !== productId) {
          freqMap[id] = (freqMap[id] || 0) + 1;
        }
      });
    });
    // Sort by frequency
    const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ids = sorted.map(([id]) => id);
    const products = await Item.find({ _id: { $in: ids } });
    // Return in sorted order
    const result = ids.map(id => products.find(p => p._id.toString() === id)).filter(Boolean);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 

// Handle user question/request about a product (admin will handle)
exports.askAboutProduct = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required.' });
    }
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    // Log the question for admin review
    console.log(`[PRODUCT QUESTION] User ${req.user._id} asked about product ${item._id}: ${question}`);
    res.json({ message: 'Your question has been submitted. Admin will review and respond.' });
  } catch (error) {
    console.error('Error in askAboutProduct:', error);
    res.status(500).json({ message: 'Failed to submit question.' });
  }
};

// Set main image for a product
exports.setMainImage = async (req, res) => {
  try {
    const { imageName } = req.body;
    if (!imageName) {
      return res.status(400).json({ message: 'Image name is required.' });
    }

    // Only admin can set main image
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can modify product images' });
    }

    const item = await Item.findOne({ _id: req.params.id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Check if the image exists in the product's images array
    if (!item.images || !item.images.includes(imageName)) {
      return res.status(400).json({ message: 'Image not found in product images.' });
    }

    // Reorder images to put the selected image first
    const reorderedImages = [imageName, ...item.images.filter(img => img !== imageName)];
    
    item.images = reorderedImages;
    item.image = imageName; // Set as main image
    await item.save();

    res.json({ 
      success: true, 
      message: 'Main image set successfully.',
      item: item
    });
  } catch (error) {
    console.error('Error in setMainImage:', error);
    res.status(500).json({ message: 'Failed to set main image.' });
  }
};

// Bulk delete items (admin only)
exports.bulkDeleteItems = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required.' });
    }

    // Only admin can bulk delete items
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can bulk delete products' });
    }

    const result = await Item.deleteMany({
      _id: { $in: productIds }
    });

    res.json({ 
      success: true, 
      message: `${result.deletedCount} product(s) deleted successfully.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error in bulkDeleteItems:', error);
    res.status(500).json({ message: 'Failed to delete products.' });
  }
};

// Bulk update category for items (admin only)
exports.bulkUpdateCategory = async (req, res) => {
  try {
    const { productIds, category } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required.' });
    }

    // Only admin can bulk update categories
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can bulk update product categories' });
    }

    const result = await Item.updateMany(
      {
        _id: { $in: productIds }
      },
      {
        $set: { category: category.trim() }
      }
    );

    res.json({ 
      success: true, 
      message: `Category updated for ${result.modifiedCount} product(s).`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in bulkUpdateCategory:', error);
    res.status(500).json({ message: 'Failed to update category.' });
  }
}; 