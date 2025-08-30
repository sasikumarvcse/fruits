const mongoose = require('mongoose');
const Item = require('./models/Item');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/arobowl', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sampleProduct = {
  name: "Organic Bananas - Premium Quality",
  description: "Hand-picked organic bananas from the finest farms in Maharashtra. These premium quality bananas are rich in potassium, fiber, and essential vitamins. Perfect for smoothies, baking, or as a healthy snack.",
  price: 89.99,
  mrp: 120.00,
  category: "premium",
  isOrganic: true,
  isBestSeller: true,
  stock: 150,
  status: "active",
  image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500",
  images: ["https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500"],
  ratings: 4.8,
  sales: 1250,
  productDetails: {
    calories: "89 calories per 100g",
    protein: "1.1g per 100g",
    carbs: "23g per 100g",
    fiber: "2.6g per 100g",
    vitamins: "Vitamin C, Vitamin B6, Vitamin A, Folate",
    minerals: "Potassium, Magnesium, Iron, Calcium",
    origin: "Maharashtra, India",
    season: "Year-round availability",
    storage: "Store at room temperature until ripe, then refrigerate",
    shelfLife: "7-10 days at room temperature, 2-3 weeks refrigerated"
  },
  offers: ["Free delivery on orders above ₹500", "Buy 2 get 1 free"],
  returnPolicy: "30-day easy return policy",
  warranty: "Freshness guaranteed",
  deliveryInfo: "Same day delivery available in Mumbai, next day delivery in other cities"
};

async function addDetailedProduct() {
  try {
    // Clear existing product with same name
    await Item.deleteOne({ name: sampleProduct.name });
    
    // Create new product
    const newProduct = new Item(sampleProduct);
    await newProduct.save();
    
    console.log('✅ Detailed product added successfully!');
    console.log('Product ID:', newProduct._id);
    console.log('Name:', newProduct.name);
    console.log('Price: ₹', newProduct.price);
    console.log('MRP: ₹', newProduct.mrp);
    console.log('Category:', newProduct.category);
    console.log('Organic:', newProduct.isOrganic);
    console.log('Best Seller:', newProduct.isBestSeller);
    console.log('Stock:', newProduct.stock);
    console.log('Product Details:', JSON.stringify(newProduct.productDetails, null, 2));
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error adding product:', error);
    mongoose.connection.close();
  }
}

addDetailedProduct();
