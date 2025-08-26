// check-missing-images.js
// Usage: node server/check-missing-images.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('./models/Product');

const UPLOADS_DIR = path.join(__dirname, '../client/uploads');
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

async function checkImages() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const products = await Product.find({});
  let missing = [];
  let invalid = [];
  let ok = [];

  for (const prod of products) {
    const img = prod.image;
    if (!img) {
      missing.push({ id: prod._id, name: prod.name, reason: 'No image field' });
      continue;
    }
    const imgPath = path.join(UPLOADS_DIR, img);
    if (!fs.existsSync(imgPath)) {
      missing.push({ id: prod._id, name: prod.name, image: img, reason: 'File missing' });
      continue;
    }
    // Check if file is a valid image (basic check: non-zero size)
    const stat = fs.statSync(imgPath);
    if (stat.size === 0) {
      invalid.push({ id: prod._id, name: prod.name, image: img, reason: 'Zero size' });
      continue;
    }
    ok.push({ id: prod._id, name: prod.name, image: img });
  }

  console.log('--- Missing Images ---');
  if (missing.length) {
    missing.forEach(m => console.log(m));
  } else {
    console.log('None');
  }
  console.log('\n--- Invalid Images (zero size) ---');
  if (invalid.length) {
    invalid.forEach(i => console.log(i));
  } else {
    console.log('None');
  }
  console.log(`\n--- OK (${ok.length} products with valid images) ---`);
  if (ok.length) {
    ok.slice(0, 5).forEach(o => console.log(o));
    if (ok.length > 5) console.log(`...and ${ok.length - 5} more`);
  }

  await mongoose.disconnect();
}

checkImages().catch(e => {
  console.error('Error:', e);
  process.exit(1);
}); 