// server/seed-admin-demo.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Item = require('./models/Item');
const Order = require('./models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/groww';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear collections
  await User.deleteMany({});
  await Item.deleteMany({});
  await Order.deleteMany({});

  // Create admin
  const admin = new User({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: await bcrypt.hash('admin123', 10),
    mobile: '9999999999',
    role: 'admin',
    status: 'active'
  });
  await admin.save();

  // Create sellers
  const seller1 = new User({
    firstName: 'Alice',
    lastName: 'Seller',
    email: 'alice.seller@example.com',
    password: await bcrypt.hash('seller123', 10),
    mobile: '8888888888',
    role: 'seller',
    status: 'active'
  });
  const seller2 = new User({
    firstName: 'Bob',
    lastName: 'Seller',
    email: 'bob.seller@example.com',
    password: await bcrypt.hash('seller123', 10),
    mobile: '7777777777',
    role: 'seller',
    status: 'active'
  });
  await seller1.save();
  await seller2.save();

  // Create users
  const user1 = new User({
    firstName: 'Charlie',
    lastName: 'Buyer',
    email: 'charlie.buyer@example.com',
    password: await bcrypt.hash('user123', 10),
    mobile: '6666666666',
    role: 'user',
    status: 'active'
  });
  const user2 = new User({
    firstName: 'Diana',
    lastName: 'Buyer',
    email: 'diana.buyer@example.com',
    password: await bcrypt.hash('user123', 10),
    mobile: '5555555555',
    role: 'user',
    status: 'active'
  });
  await user1.save();
  await user2.save();

  // Add demo items/products with required fields
  const demoItems = [
    {
      name: 'Demo Phone',
      description: 'A demo smartphone for testing.',
      price: 9999,
      category: 'Electronics',
      images: ['default-item.jpg'],
      stock: 10,
      seller: seller1._id
    },
    {
      name: 'Demo Book',
      description: 'A demo book for testing.',
      price: 499,
      category: 'Books',
      images: ['default-item.jpg'],
      stock: 20,
      seller: seller2._id
    }
  ];
  const createdProducts = [];
  for (const item of demoItems) {
    const prod = await Item.create(item);
    createdProducts.push(prod);
  }

  // Create orders using createdProducts
  const order1 = new Order({
    user: user1._id,
    items: [
      { item: createdProducts[1]._id, quantity: 2 }, // Demo Book
      { item: createdProducts[0]._id, quantity: 1 }  // Demo Phone
    ],
    total: 499 * 2 + 9999 * 1,
    status: 'placed',
    recipientName: 'Charlie Buyer',
    mobile: '6666666666',
    address: '123 Main St, City',
    pincode: '123456',
    orderTimeline: [{ status: 'placed', description: 'Order placed successfully', updatedBy: user1._id }]
  });
  const order2 = new Order({
    user: user2._id,
    items: [
      { item: createdProducts[0]._id, quantity: 1 } // Demo Phone
    ],
    total: 9999,
    status: 'delivered',
    recipientName: 'Diana Buyer',
    mobile: '5555555555',
    address: '456 Market Rd, Town',
    pincode: '654321',
    orderTimeline: [{ status: 'delivered', description: 'Order has been delivered successfully', updatedBy: user2._id }]
  });
  await order1.save();
  await order2.save();

  console.log('Seeded admin, sellers, users, products, and orders!');
  process.exit();
}

seed().catch(e => { console.error(e); process.exit(1); }); 