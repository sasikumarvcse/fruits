// backfill-image-field.js
// Usage: node server/backfill-image-field.js

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '../.env');
console.log('ENV file exists:', fs.existsSync(envPath));
if (fs.existsSync(envPath)) {
  console.log('ENV file content:\n' + fs.readFileSync(envPath, 'utf8'));
}
require('dotenv').config({ path: envPath });
console.log('Loaded MONGO_URI:', process.env.MONGO_URI);

const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}


async function backfillImageField() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const products = await Product.find({});
  let updated = 0;
  for (const prod of products) {
    if (Array.isArray(prod.images) && prod.images.length > 0 && prod.image !== prod.images[0]) {
      prod.image = prod.images[0];
      await prod.save();
      updated++;
      console.log(`Updated product ${prod._id}: image set to ${prod.image}`);
    }
  }
  console.log(`\nBackfill complete. ${updated} products updated.`);
  await mongoose.disconnect();
}

backfillImageField().catch(e => {
  console.error('Error:', e);
  process.exit(1);
}); 