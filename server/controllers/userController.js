const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, address } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.address = address || user.address;
    await user.save();
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user orders
exports.getOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'orders',
      populate: { path: 'items.item' }
    });
    res.json(user.orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Place order
exports.placeOrder = async (req, res) => {
  try {
    const { items, total } = req.body;
    const Order = require('../models/Order');
    const Notification = require('../models/Notification');
    const Item = require('../models/Item');
    const order = new Order({
      user: req.user.id,
      items,
      total
    });
    await order.save();
    const user = await User.findById(req.user.id);
    user.orders.push(order._id);
    await user.save();

    // --- Notification logic ---
    // Notify the user
    await Notification.create({
      user: req.user.id,
      message: `Your order #${order._id.toString().slice(-6)} has been placed successfully!`,
      type: 'order'
    });
    // Notify each seller for the items in the order
    for (const item of items) {
      const product = await Item.findById(item.item);
      if (product && product.seller) {
        await Notification.create({
          user: product.seller,
          message: `You have a new order for "${product.name}" (Order #${order._id.toString().slice(-6)})`,
          type: 'order'
        });
      }
    }
    // --- End notification logic ---

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to clean up old cart format
function fixCartFormat(user) {
  let changed = false;
  user.cart = user.cart.map(c => {
    if (c.item && !c.product) {
      changed = true;
      return { product: c.item, quantity: c.quantity };
    }
    return c;
  });
  if (changed) user.save();
}

// --- CART LOGIC ---
exports.getCart = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: No user found in request.' });
  }
  try {
    const user = await User.findById(req.user.id).populate('cart.product');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    fixCartFormat(user); // Ensure cart is always in correct format
    // DEBUG: Log the populated cart
    console.log('getCart: user.cart =', JSON.stringify(user.cart, null, 2));
    const cartWithProduct = user.cart.map(c => ({
      ...c.toObject(),
      product: c.product
    }));
    res.json(cartWithProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: No user found in request.' });
  }
  try {
    const { productId, itemId, quantity = 1 } = req.body;
    const id = productId || itemId; // Accept both for backward compatibility
    console.log('Backend: addToCart received productId:', productId, 'itemId:', itemId, 'using:', id);
    if (!id) {
      return res.status(400).json({ message: 'No productId or itemId provided' });
    }
    
    // Check if product exists
    const product = await require('../models/Item').findById(id);
    console.log('Backend: addToCart product lookup result:', product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Use MongoDB update operation instead of saving entire user
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $push: { 
          cart: { 
            product: id, 
            quantity: quantity 
          } 
        }
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Populate cart products
    await result.populate('cart.product');
    
    const cartWithProduct = result.cart.map(c => ({
      ...c.toObject(),
      product: c.product
    }));
    
    res.json(cartWithProduct);
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, itemId, quantity } = req.body;
    const id = productId || itemId; // Accept both for backward compatibility
    if (!id) {
      return res.status(400).json({ message: 'No productId or itemId provided' });
    }
    
    // Use MongoDB update operation instead of saving entire user
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          "cart.$[elem].quantity": quantity 
        }
      },
      { 
        new: true,
        arrayFilters: [{ "elem.product": id }]
      }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await result.populate('cart.product');
    const cartWithProduct = result.cart.map(c => ({
      ...c.toObject(),
      product: c.product
    }));
    res.json(cartWithProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId, itemId } = req.body;
    const id = productId || itemId; // Accept both for backward compatibility
    if (!id) {
      return res.status(400).json({ message: 'No productId or itemId provided' });
    }
    
    // Use MongoDB update operation instead of saving entire user
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $pull: { 
          cart: { product: id } 
        }
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await result.populate('cart.product');
    const cartWithProduct = result.cart.map(c => ({
      ...c.toObject(),
      product: c.product
    }));
    res.json(cartWithProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    // Use MongoDB update operation instead of saving entire user
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { cart: [] }
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- WISHLIST LOGIC ---
exports.getWishlist = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: No user found in request.' });
  }
  console.log('getWishlist: req.user =', req.user);
  try {
    // Use MongoDB update operation to ensure wishlist exists
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $setOnInsert: { wishlist: [] }
      },
      { 
        new: true,
        upsert: false
      }
    );
    
    if (!result) {
      console.log('getWishlist: User not found for id', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Populate and return wishlist
    await result.populate('wishlist');
    res.json(result.wishlist || []);
  } catch (error) {
    console.error('getWishlist: Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addToWishlist = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: No user found in request.' });
  }
  console.log('addToWishlist: req.user =', req.user);
  console.log('addToWishlist: req.body =', req.body);
  try {
    const { productId, itemId } = req.body;
    const id = productId || itemId; // Accept both for backward compatibility
    if (!id) {
      return res.status(400).json({ message: 'No productId or itemId provided' });
    }
    
    // Validate that the product exists
    const Item = require('../models/Item');
    const product = await Item.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Use MongoDB update operation instead of saving entire user
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $addToSet: { wishlist: id } // $addToSet only adds if not already present
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Populate and return updated wishlist
    await result.populate('wishlist');
    res.json(result.wishlist || []);
  } catch (error) {
    console.error('addToWishlist: Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: No user found in request.' });
  }
  try {
    const { productId, itemId } = req.body;
    const id = productId || itemId; // Accept both for backward compatibility
    if (!id) {
      return res.status(400).json({ message: 'No productId or itemId provided' });
    }
    console.log('removeFromWishlist: req.user =', req.user);
    console.log('removeFromWishlist: req.body =', req.body);
    
    // Use MongoDB update operation instead of saving entire user
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $pull: { wishlist: id } // $pull removes the item from array
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Populate and return updated wishlist
    await result.populate('wishlist');
    res.json(result.wishlist || []);
  } catch (error) {
    console.error('removeFromWishlist: Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Address Book API
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addOrUpdateAddress = async (req, res) => {
  try {
    const { name, mobile, address, pincode, isDefault, idx } = req.body;
    if (!name || !mobile || !address || !pincode) {
      return res.status(400).json({ message: 'All fields required' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (typeof idx === 'number' && user.addresses[idx]) {
      user.addresses[idx] = { name, mobile, address, pincode, isDefault: !!isDefault };
    } else {
      if (isDefault) user.addresses.forEach(a => a.isDefault = false);
      user.addresses.push({ name, mobile, address, pincode, isDefault: !!isDefault });
    }
    if (isDefault) user.addresses.forEach((a, i) => a.isDefault = i === user.addresses.length - 1);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { idx } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (typeof idx === 'number' && user.addresses[idx]) {
      user.addresses.splice(idx, 1);
      await user.save();
    }
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};