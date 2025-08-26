const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your_db_name';

async function seedProducts() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const Item = require('./models/Item');

  const testProduct = new Item({
    name: 'Test Product',
    price: 100,
    description: 'A test product for cart debugging',
    image: 'default-item.jpg',
    category: 'Test',
    stock: 10
  });

  await testProduct.save();
  console.log('Seeded test product with _id:', testProduct._id);
  mongoose.disconnect();
}

seedProducts().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
}); 