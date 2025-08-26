const mongoose = require('mongoose');
const User = require('./models/User');
const Item = require('./models/Item');
const Order = require('./models/Order');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB connected');
  
  try {
    // Create sample products
    const sampleProducts = [
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

    // Clear existing products
    await Item.deleteMany({});
    console.log('✅ Cleared existing products');

    // Add sample products
    for (const product of sampleProducts) {
      const newProduct = new Item(product);
      await newProduct.save();
    }
    console.log('✅ Added sample products');

    // Create a sample user if none exists
    let sampleUser = await User.findOne({ role: 'user' });
    if (!sampleUser) {
      sampleUser = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        mobile: '9876543210',
        address: '123 Main St, City',
        role: 'user'
      });
      await sampleUser.save();
      console.log('✅ Created sample user');
    }

    // Create sample orders
    const sampleOrders = [
      {
        user: sampleUser._id,
        items: [
          {
            item: (await Item.findOne({ name: '🍎 Fresh Red Apples' }))._id,
            quantity: 2
          },
          {
            item: (await Item.findOne({ name: '🍌 Organic Bananas' }))._id,
            quantity: 1
          }
        ],
        total: 320.00,
        status: 'delivered',
        recipientName: 'John Doe',
        mobile: '9876543210',
        address: '123 Main St, City',
        pincode: '123456'
      },
      {
        user: sampleUser._id,
        items: [
          {
            item: (await Item.findOne({ name: '🍊 Sweet Oranges' }))._id,
            quantity: 3
          }
        ],
        total: 300.00,
        status: 'success',
        recipientName: 'John Doe',
        mobile: '9876543210',
        address: '123 Main St, City',
        pincode: '123456'
      },
      {
        user: sampleUser._id,
        items: [
          {
            item: (await Item.findOne({ name: '🫐 Fresh Blueberries' }))._id,
            quantity: 1
          },
          {
            item: (await Item.findOne({ name: '🥕 Organic Carrots' }))._id,
            quantity: 2
          }
        ],
        total: 320.00,
        status: 'placed',
        recipientName: 'John Doe',
        mobile: '9876543210',
        address: '123 Main St, City',
        pincode: '123456'
      }
    ];

    // Clear existing orders
    await Order.deleteMany({});
    console.log('✅ Cleared existing orders');

    // Add sample orders
    for (const order of sampleOrders) {
      const newOrder = new Order(order);
      await newOrder.save();
    }
    console.log('✅ Added sample orders');

    console.log('\n🎉 Sample data created successfully!');
    console.log('📊 Dashboard will now show:');
    console.log('   - 6 products');
    console.log('   - 3 orders');
    console.log('   - 1 user (plus admin)');
    console.log('   - Revenue from orders');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
});
