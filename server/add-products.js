const mongoose = require('mongoose');
const Item = require('./models/Item');

// MongoDB Atlas connection
const MONGO_URI = 'mongodb+srv://growwpark:growwpark123@cluster0.qsoytwo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ MongoDB connected');
  
  try {
    // Clear existing products
    await Item.deleteMany({});
    console.log('✅ Cleared existing products');

    // Add test products
    const testProducts = [
      {
        name: '🍎 Fresh Red Apples',
        description: 'Sweet and juicy red apples, perfect for snacking',
        price: 120.00,
        stock: 50,
        category: 'Apples',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
        status: 'active'
      },
      {
        name: '🍌 Organic Bananas',
        description: 'Ripe organic bananas, rich in potassium',
        price: 80.00,
        stock: 75,
        category: 'Bananas',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
        status: 'active'
      },
      {
        name: '🍊 Sweet Oranges',
        description: 'Juicy sweet oranges, packed with vitamin C',
        price: 100.00,
        stock: 60,
        category: 'Oranges',
        image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400',
        status: 'active'
      },
      {
        name: '🫐 Fresh Blueberries',
        description: 'Antioxidant-rich blueberries',
        price: 200.00,
        stock: 30,
        category: 'Berries',
        image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400',
        status: 'active'
      },
      {
        name: '🥕 Organic Carrots',
        description: 'Fresh organic carrots, perfect for salads',
        price: 60.00,
        stock: 40,
        category: 'Vegetables',
        image: 'https://images.unsplash.com/photo-1447175008436-170170753886?w=400',
        status: 'active'
      },
      {
        name: '🌱 Organic Spinach',
        description: 'Nutrient-rich organic spinach leaves',
        price: 90.00,
        stock: 25,
        category: 'Organic',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
        status: 'active'
      }
    ];

    // Add products
    for (const product of testProducts) {
      const newProduct = new Item(product);
      await newProduct.save();
      console.log(`✅ Added: ${product.name}`);
    }

    console.log('\n🎉 Test products created successfully!');
    console.log('📊 Products will now be visible to users at: http://localhost:5000/products.html');

  } catch (error) {
    console.error('❌ Error creating test products:', error);
  } finally {
    mongoose.connection.close();
  }
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
});
