const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the Item model
const Item = require('./models/Item');

async function fixProductImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all products
    const products = await Item.find({});
    console.log(`📦 Found ${products.length} products to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      let updateData = {};

      // Check if product has images array but missing image field
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        if (!product.image || product.image !== product.images[0]) {
          updateData.image = product.images[0];
          needsUpdate = true;
          console.log(`🔄 Product "${product.name}" - Setting image to: ${product.images[0]}`);
        }
      } else if (product.image && (!product.images || product.images.length === 0)) {
        // Product has image field but no images array - create images array
        updateData.images = [product.image];
        needsUpdate = true;
        console.log(`🔄 Product "${product.name}" - Creating images array with: ${product.image}`);
      } else if (!product.image && (!product.images || product.images.length === 0)) {
        // Product has no images at all - set default
        updateData.image = 'default-item.jpg';
        updateData.images = ['default-item.jpg'];
        needsUpdate = true;
        console.log(`🔄 Product "${product.name}" - Setting default image`);
      }

      if (needsUpdate) {
        await Item.findByIdAndUpdate(product._id, updateData);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Image fix completed!`);
    console.log(`📊 Updated: ${updatedCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products (already correct)`);

    // Verify the fix
    console.log(`\n🔍 Verifying fix...`);
    const productsAfterFix = await Item.find({});
    let validCount = 0;
    let invalidCount = 0;

    for (const product of productsAfterFix) {
      const hasValidImage = product.image && product.images && 
                           Array.isArray(product.images) && 
                           product.images.length > 0 && 
                           product.images[0] === product.image;
      
      if (hasValidImage) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`❌ Product "${product.name}" still has issues:`);
        console.log(`   - image: ${product.image}`);
        console.log(`   - images: ${JSON.stringify(product.images)}`);
      }
    }

    console.log(`\n📊 Verification Results:`);
    console.log(`✅ Valid products: ${validCount}`);
    console.log(`❌ Invalid products: ${invalidCount}`);

    if (invalidCount === 0) {
      console.log(`\n🎉 All product images are now properly configured!`);
    } else {
      console.log(`\n⚠️  Some products still need manual attention.`);
    }

  } catch (error) {
    console.error('❌ Error fixing product images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixProductImages(); 