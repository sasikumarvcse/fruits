const mongoose = require('mongoose');
const Item = require('./models/Item');

// MongoDB connection
const MONGO_URI = 'mongodb+srv://growwpark:growwpark123@cluster0.qsoytwo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Real fruit products data
const realProducts = [
  {
    name: 'Organic Spinach',
    description: 'Fresh organic spinach leaves, rich in iron and vitamins. Perfect for salads and cooking.',
    price: 90,
    stock: 50,
    category: 'basic',
    image: 'spinach.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Fresh Apples',
    description: 'Sweet and crisp red apples, perfect for snacking or making desserts.',
    price: 120,
    stock: 100,
    category: 'standard',
    image: 'apples.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Bananas',
    description: 'Yellow ripe bananas, rich in potassium and perfect for smoothies.',
    price: 60,
    stock: 150,
    category: 'standard',
    image: 'bananas.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Oranges',
    description: 'Juicy sweet oranges, high in vitamin C and perfect for juicing.',
    price: 80,
    stock: 75,
    category: 'standard',
    image: 'oranges.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Tomatoes',
    description: 'Fresh red tomatoes, perfect for salads, cooking, and making sauces.',
    price: 70,
    stock: 80,
    category: 'basic',
    image: 'tomatoes.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Carrots',
    description: 'Fresh orange carrots, rich in beta-carotene and perfect for cooking.',
    price: 50,
    stock: 60,
    category: 'basic',
    image: 'carrots.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Grapes',
    description: 'Sweet purple grapes, perfect for snacking or making wine.',
    price: 150,
    stock: 40,
    category: 'premium',
    image: 'grapes.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Strawberries',
    description: 'Fresh red strawberries, sweet and perfect for desserts.',
    price: 200,
    stock: 30,
    category: 'premium',
    image: 'strawberries.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Onions',
    description: 'Fresh white onions, essential for cooking and adding flavor.',
    price: 40,
    stock: 100,
    category: 'basic',
    image: 'onions.jpg',
    status: 'active',
    sales: 0
  },
  {
    name: 'Potatoes',
    description: 'Fresh potatoes, versatile and perfect for various dishes.',
    price: 45,
    stock: 120,
    category: 'basic',
    image: 'potatoes.jpg',
    status: 'active',
    sales: 0
  }
];

async function addRealProducts() {
  try {
    console.log('🔄 Adding real products to database...');
    
    // Clear existing products
    await Item.deleteMany({});
    console.log('✅ Cleared existing products');
    
    // Add new products
    for (const product of realProducts) {
      const newProduct = new Item(product);
      await newProduct.save();
      console.log(`✅ Added: ${product.name} - ₹${product.price}`);
    }
    
    console.log(`✅ Successfully added ${realProducts.length} real products!`);
    
    // Display summary
    const totalProducts = await Item.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);
    
    const fruits = await Item.countDocuments({ category: 'Fruits' });
    const vegetables = await Item.countDocuments({ category: 'Vegetables' });
    console.log(`🍎 Fruits: ${fruits}`);
    console.log(`🥬 Vegetables: ${vegetables}`);
    
  } catch (error) {
    console.error('❌ Error adding products:', error);
  } finally {
    mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the script
addRealProducts();
