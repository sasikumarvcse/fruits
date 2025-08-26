const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/arobowl';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import the Item model
const Item = require('./models/Item');

const sampleProducts = [
  {
    name: "Fresh Red Apples",
    description: "Sweet and crisp red apples, perfect for snacking or baking. Rich in fiber and antioxidants.",
    price: 120,
    category: "pome",
    isOrganic: false,
    stock: 50,
    status: "active",
    images: ["apple-red.jpg"],
    image: "apple-red.jpg",
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
        { label: "Variety", value: "Red Delicious" },
        { label: "Size", value: "Medium to Large" }
      ]
    },
    offers: ["Buy 2kg get 500g free", "10% off on bulk purchase"]
  },
  {
    name: "Organic Sweet Oranges",
    description: "Juicy and sweet organic oranges, rich in vitamin C. Perfect for fresh juice or eating.",
    price: 180,
    category: "citrus",
    isOrganic: true,
    stock: 30,
    status: "active",
    images: ["orange-sweet.jpg"],
    image: "orange-sweet.jpg",
    productDetails: {
      calories: "47 kcal/100g",
      protein: "0.9g/100g",
      carbs: "12g/100g",
      fiber: "2.4g/100g",
      vitamins: "Vitamin C, A, B6",
      minerals: "Potassium, Calcium",
      origin: "Nagpur, Maharashtra",
      season: "December to March",
      storage: "Room temperature or refrigerate",
      shelfLife: "5-7 days",
      customFields: [
        { label: "Variety", value: "Nagpur Orange" },
        { label: "Sweetness", value: "High" }
      ]
    },
    offers: ["15% off on organic products", "Free delivery on orders above ₹500"]
  },
  {
    name: "Fresh Strawberries",
    description: "Sweet and aromatic strawberries, perfect for desserts or fresh eating.",
    price: 250,
    category: "berry",
    isOrganic: false,
    stock: 25,
    status: "active",
    images: ["strawberry-fresh.jpg"],
    image: "strawberry-fresh.jpg",
    productDetails: {
      calories: "32 kcal/100g",
      protein: "0.7g/100g",
      carbs: "8g/100g",
      fiber: "2g/100g",
      vitamins: "Vitamin C, K, B9",
      minerals: "Manganese, Potassium",
      origin: "Maharashtra, India",
      season: "November to March",
      storage: "Refrigerate immediately",
      shelfLife: "3-5 days",
      customFields: [
        { label: "Size", value: "Medium" },
        { label: "Packaging", value: "250g Box" }
      ]
    },
    offers: ["Buy 2 boxes get 1 free", "20% off on first order"]
  },
  {
    name: "Ripe Mangoes",
    description: "Sweet and juicy mangoes, the king of fruits. Perfect for smoothies or eating fresh.",
    price: 150,
    category: "tropical",
    isOrganic: false,
    stock: 40,
    status: "active",
    images: ["mango-ripe.jpg"],
    image: "mango-ripe.jpg",
    productDetails: {
      calories: "60 kcal/100g",
      protein: "0.8g/100g",
      carbs: "15g/100g",
      fiber: "1.6g/100g",
      vitamins: "Vitamin A, C, E",
      minerals: "Potassium, Magnesium",
      origin: "Ratnagiri, Maharashtra",
      season: "March to July",
      storage: "Room temperature until ripe, then refrigerate",
      shelfLife: "5-7 days when ripe",
      customFields: [
        { label: "Variety", value: "Alphonso" },
        { label: "Ripeness", value: "Ready to eat" }
      ]
    },
    offers: ["Buy 1kg get 500g free", "Free mango cutting service"]
  },
  {
    name: "Fresh Watermelon",
    description: "Sweet and refreshing watermelon, perfect for hot summer days.",
    price: 80,
    category: "melon",
    isOrganic: false,
    stock: 20,
    status: "active",
    images: ["watermelon-fresh.jpg"],
    image: "watermelon-fresh.jpg",
    productDetails: {
      calories: "30 kcal/100g",
      protein: "0.6g/100g",
      carbs: "8g/100g",
      fiber: "0.4g/100g",
      vitamins: "Vitamin A, C, B6",
      minerals: "Potassium, Magnesium",
      origin: "Karnataka, India",
      season: "March to September",
      storage: "Refrigerate after cutting",
      shelfLife: "7-10 days whole, 3-5 days cut",
      customFields: [
        { label: "Size", value: "Large (3-5kg)" },
        { label: "Seedless", value: "Yes" }
      ]
    },
    offers: ["Free home delivery", "Free cutting and packaging"]
  }
];

async function addSampleProducts() {
  try {
    // Clear existing items
    await Item.deleteMany({});
    console.log('Cleared existing items');
    
    // Add new sample products
    const result = await Item.insertMany(sampleProducts);
    console.log(`Added ${result.length} sample products successfully`);
    
    // Display the added products
    result.forEach(product => {
      console.log(`- ${product.name} (${product.category}) - ₹${product.price}`);
    });
    
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error adding sample products:', error);
    mongoose.connection.close();
  }
}

addSampleProducts();
