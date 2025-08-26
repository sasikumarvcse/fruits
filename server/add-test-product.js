const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://growwpark:growwpark123@growwpark.8jqjqjq.mongodb.net/growwpark?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import the Item model
const Item = require('./models/Item');

const testProduct = {
  name: "Fresh Organic Apples",
  description: "Sweet and crisp organic apples, perfect for snacking or baking. Rich in fiber and antioxidants.",
  price: 150,
  category: "pome",
  isOrganic: true,
  stock: 25,
  status: "active",
  images: ["apple-organic.jpg"],
  image: "apple-organic.jpg",
  productDetails: {
    calories: "52 kcal/100g",
    protein: "0.3g/100g",
    carbs: "14g/100g",
    fiber: "2.4g/100g",
    vitamins: "Vitamin C, B6, K",
    minerals: "Potassium, Iron",
    origin: "Himachal Pradesh, India",
    season: "September to March",
    storage: "Refrigerate at 2-4°C",
    shelfLife: "7-10 days",
    customFields: [
      { label: "Variety", value: "Organic Red Delicious" },
      { label: "Size", value: "Medium to Large" },
      { label: "Certification", value: "USDA Organic" }
    ]
  },
  offers: ["20% off on organic products", "Free delivery on orders above ₹500", "Buy 2kg get 500g free"]
};

async function addTestProduct() {
  try {
    // Add the test product
    const result = await Item.create(testProduct);
    console.log('Test product added successfully:');
    console.log(`- Name: ${result.name}`);
    console.log(`- Category: ${result.category}`);
    console.log(`- Price: ₹${result.price}`);
    console.log(`- Organic: ${result.isOrganic ? 'Yes' : 'No'}`);
    console.log(`- Product ID: ${result._id}`);
    
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error adding test product:', error);
    mongoose.connection.close();
  }
}

addTestProduct();
