const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the Item model
const Item = require('./models/Item');

async function testImageFunctionality() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Testing Image Functionality...\n');

    // Test 1: Check uploads directory
    console.log('📁 Test 1: Checking uploads directory...');
    const uploadsDir = path.join(__dirname, '../client/uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`✅ Uploads directory exists with ${files.length} files`);
      console.log(`📄 Files: ${files.join(', ')}`);
    } else {
      console.log('❌ Uploads directory does not exist');
    }

    // Test 2: Check default image
    console.log('\n🖼️  Test 2: Checking default image...');
    const defaultImagePath = path.join(uploadsDir, 'default-item.jpg');
    if (fs.existsSync(defaultImagePath)) {
      console.log('✅ Default image exists');
    } else {
      console.log('❌ Default image does not exist');
    }

    // Test 3: Check all products have proper image configuration
    console.log('\n📦 Test 3: Checking product image configuration...');
    const products = await Item.find({});
    console.log(`📊 Found ${products.length} products`);

    let validProducts = 0;
    let invalidProducts = 0;
    const issues = [];

    for (const product of products) {
      const hasValidImage = product.image && product.images && 
                           Array.isArray(product.images) && 
                           product.images.length > 0 && 
                           product.images[0] === product.image;
      
      if (hasValidImage) {
        validProducts++;
      } else {
        invalidProducts++;
        issues.push({
          name: product.name,
          id: product._id,
          image: product.image,
          images: product.images
        });
      }
    }

    console.log(`✅ Valid products: ${validProducts}`);
    console.log(`❌ Invalid products: ${invalidProducts}`);

    if (issues.length > 0) {
      console.log('\n⚠️  Products with image issues:');
      issues.forEach(issue => {
        console.log(`   - ${issue.name} (${issue.id})`);
        console.log(`     image: ${issue.image}`);
        console.log(`     images: ${JSON.stringify(issue.images)}`);
      });
    }

    // Test 4: Check image file existence
    console.log('\n🔍 Test 4: Checking image file existence...');
    let existingFiles = 0;
    let missingFiles = 0;

    for (const product of products) {
      if (product.images && Array.isArray(product.images)) {
        for (const image of product.images) {
          if (!image.startsWith('http')) {
            const imagePath = path.join(uploadsDir, image);
            if (fs.existsSync(imagePath)) {
              existingFiles++;
            } else {
              missingFiles++;
              console.log(`❌ Missing image file: ${image} (referenced by product: ${product.name})`);
            }
          }
        }
      }
    }

    console.log(`✅ Existing image files: ${existingFiles}`);
    console.log(`❌ Missing image files: ${missingFiles}`);

    // Test 5: Test image URL generation
    console.log('\n🔗 Test 5: Testing image URL generation...');
    
    // Import utility functions from script.js (simplified version)
    function getProductImageUrl(product, index = 0) {
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const image = product.images[index] || product.images[0];
        if (image) {
          return image.startsWith('http') ? image : `/uploads/${image}`;
        }
      }
      
      if (product.image) {
        return product.image.startsWith('http') ? product.image : `/uploads/${product.image}`;
      }
      
      return '/uploads/default-item.jpg';
    }

    function getProductImages(product) {
      let images = [];
      
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        images = product.images.map(img => img.startsWith('http') ? img : `/uploads/${img}`);
      } else if (product.image) {
        images = [product.image.startsWith('http') ? product.image : `/uploads/${product.image}`];
      } else {
        images = ['/uploads/default-item.jpg'];
      }
      
      return images;
    }

    // Test with a few products
    const testProducts = products.slice(0, 3);
    testProducts.forEach((product, index) => {
      console.log(`\n   Product ${index + 1}: ${product.name}`);
      console.log(`   - getProductImageUrl(): ${getProductImageUrl(product)}`);
      console.log(`   - getProductImages(): ${getProductImages(product).join(', ')}`);
    });

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Total products: ${products.length}`);
    console.log(`✅ Valid image config: ${validProducts}`);
    console.log(`❌ Invalid image config: ${invalidProducts}`);
    console.log(`✅ Existing image files: ${existingFiles}`);
    console.log(`❌ Missing image files: ${missingFiles}`);

    if (invalidProducts === 0 && missingFiles === 0) {
      console.log('\n🎉 All image functionality is working correctly!');
    } else {
      console.log('\n⚠️  Some issues found. Consider running the fix script.');
    }

  } catch (error) {
    console.error('❌ Error testing image functionality:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testImageFunctionality(); 