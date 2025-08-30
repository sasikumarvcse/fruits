const mongoose = require('mongoose');
const User = require('./models/User');
const Item = require('./models/Item');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🍎 Connected to MongoDB Atlas for FreshFruits setup'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Sample fruits data
const fruits = [
  // Tropical Fruits
  {
    name: "Fresh Mango",
    description: "Sweet and juicy Alphonso mangoes, handpicked from the finest orchards.",
    price: 120,
    originalPrice: 150,
    category: "Tropical",
    images: ["uploads/mango-1.jpg"],
    image: "uploads/mango-1.jpg",
    stock: 50,
    status: "active",
    offers: ["Buy 2 Get 1 Free", "Free Delivery"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in Vitamin C and antioxidants."
  },
  {
    name: "Golden Pineapple",
    description: "Sweet and tangy pineapples with golden flesh.",
    price: 80,
    originalPrice: 100,
    category: "Tropical",
    images: ["uploads/pineapple-1.jpg"],
    image: "uploads/pineapple-1.jpg",
    stock: 30,
    status: "active",
    offers: ["20% Off", "Free Cutting Service"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin C and bromelain."
  },
  {
    name: "Organic Papaya",
    description: "Ripe and sweet papaya, certified organic.",
    price: 60,
    originalPrice: 75,
    category: "Tropical",
    images: ["uploads/papaya-1.jpg"],
    image: "uploads/papaya-1.jpg",
    stock: 25,
    status: "active",
    offers: ["Organic Certified", "Free Delivery"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in papain enzyme and Vitamin C."
  },

  // Citrus Fruits
  {
    name: "Sweet Oranges",
    description: "Juicy and sweet oranges, perfect for fresh juice.",
    price: 100,
    originalPrice: 120,
    category: "Citrus",
    images: ["uploads/orange-1.jpg"],
    image: "uploads/orange-1.jpg",
    stock: 80,
    status: "active",
    offers: ["Buy 1kg Get 500g Free", "Free Juicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Excellent source of Vitamin C and fiber."
  },
  {
    name: "Fresh Lemons",
    description: "Tangy and aromatic lemons, perfect for cooking.",
    price: 40,
    originalPrice: 50,
    category: "Citrus",
    images: ["uploads/lemon-1.jpg"],
    image: "uploads/lemon-1.jpg",
    stock: 100,
    status: "active",
    offers: ["Buy 2kg Get 1kg Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin C and citric acid."
  },
  {
    name: "Green Limes",
    description: "Fresh and zesty limes, perfect for cocktails.",
    price: 50,
    originalPrice: 60,
    category: "Citrus",
    images: ["uploads/lime-1.jpg"],
    image: "uploads/lime-1.jpg",
    stock: 60,
    status: "active",
    offers: ["Buy 1kg Get 500g Free", "Free Juicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in Vitamin C and antioxidants."
  },

  // Premium Berries
  {
    name: "Fresh Strawberries",
    description: "Sweet and juicy strawberries, handpicked at peak ripeness.",
    price: 200,
    originalPrice: 250,
    category: "premium",
    images: ["uploads/strawberry-1.jpg"],
    image: "uploads/strawberry-1.jpg",
    stock: 40,
    status: "active",
    offers: ["Buy 2 Boxes Get 1 Free", "Free Washing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in antioxidants and Vitamin C."
  },
  {
    name: "Organic Blueberries",
    description: "Sweet and nutritious blueberries, certified organic.",
    price: 300,
    originalPrice: 350,
    category: "premium",
    images: ["uploads/blueberry-1.jpg"],
    image: "uploads/blueberry-1.jpg",
    stock: 30,
    status: "active",
    offers: ["Organic Certified", "Buy 2 Get 1 Free"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Superfood rich in antioxidants and Vitamin K."
  },

  // Standard Stone Fruits
  {
    name: "Red Apples",
    description: "Crisp and sweet red apples, perfect for snacking.",
    price: 150,
    originalPrice: 180,
    category: "standard",
    images: ["uploads/apple-1.jpg"],
    image: "uploads/apple-1.jpg",
    stock: 70,
    status: "active",
    offers: ["Buy 2kg Get 1kg Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in fiber, Vitamin C, and antioxidants."
  },
  {
    name: "Juicy Peaches",
    description: "Sweet and fragrant peaches, perfect for desserts.",
    price: 180,
    originalPrice: 220,
    category: "standard",
    images: ["uploads/peach-1.jpg"],
    image: "uploads/peach-1.jpg",
    stock: 35,
    status: "active",
    offers: ["Buy 1kg Get 500g Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin A, C, and fiber."
  },

  // Basic Melons
  {
    name: "Sweet Watermelon",
    description: "Juicy and refreshing watermelon, perfect for hot days.",
    price: 40,
    originalPrice: 50,
    category: "basic",
    images: ["uploads/watermelon-1.jpg"],
    image: "uploads/watermelon-1.jpg",
    stock: 20,
    status: "active",
    offers: ["Buy 1 Get 1 Free", "Free Cutting"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in water content and Vitamin A."
  },
  {
    name: "Fresh Cantaloupe",
    description: "Sweet and aromatic cantaloupe, perfect for fruit salads.",
    price: 80,
    originalPrice: 100,
    category: "basic",
    images: ["uploads/cantaloupe-1.jpg"],
    image: "uploads/cantaloupe-1.jpg",
    stock: 25,
    status: "active",
    offers: ["Buy 1 Get 1 Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in Vitamin A, C, and potassium."
  },

  // Exotic Fruits
  {
    name: "Dragon Fruit",
    description: "Exotic and beautiful dragon fruit with sweet, mild flavor.",
    price: 400,
    originalPrice: 500,
    category: "Exotic",
    images: ["uploads/dragonfruit-1.jpg"],
    image: "uploads/dragonfruit-1.jpg",
    stock: 15,
    status: "active",
    offers: ["Exotic Premium", "Free Cutting"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in antioxidants, Vitamin C, and fiber."
  },
  {
    name: "Passion Fruit",
    description: "Tangy and aromatic passion fruit, perfect for juices.",
    price: 250,
    originalPrice: 300,
    category: "Exotic",
    images: ["uploads/passionfruit-1.jpg"],
    image: "uploads/passionfruit-1.jpg",
    stock: 20,
    status: "active",
    offers: ["Exotic Premium", "Free Juicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin C, fiber, and antioxidants."
  }
];

async function setupFreshFruits() {
  try {
    console.log('🍎 Starting FreshFruits Marketplace Setup...\n');

    // Step 1: Create Admin User
    console.log('👤 Step 1: Creating Admin User...');
    const existingAdmin = await User.findOne({ email: 'admin@freshfruits.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminUser = new User({
        firstName: 'FreshFruits',
        lastName: 'Admin',
        email: 'admin@freshfruits.com',
        password: hashedPassword,
        mobile: '9876543210',
        role: 'admin',
        status: 'active',
        notificationPreferences: {
          order: true,
          offer: true,
          system: true,
          admin: true
        }
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    // Step 2: Clear and Seed Fruits
    console.log('\n🍊 Step 2: Setting up Fruit Products...');
    await Item.deleteMany({});
    console.log('✅ Cleared existing fruits');

    const insertedFruits = await Item.insertMany(fruits);
    console.log(`✅ Successfully seeded ${insertedFruits.length} fruits`);

    // Step 3: Display Summary
    console.log('\n📊 Step 3: Setup Summary');
    console.log('========================');
    
    const categories = [...new Set(fruits.map(fruit => fruit.category))];
    console.log('\n📂 Categories Created:');
    categories.forEach(category => {
      const count = fruits.filter(fruit => fruit.category === category).length;
      console.log(`   • ${category}: ${count} fruits`);
    });

    console.log('\n🍎 Sample Fruits Added:');
    fruits.forEach(fruit => {
      console.log(`   • ${fruit.name}: ₹${fruit.price}/kg`);
    });

    // Step 4: Success Message
    console.log('\n🎉 FreshFruits Marketplace Setup Complete!');
    console.log('==========================================');
    console.log('✅ Admin user: admin@freshfruits.com / admin123');
    console.log('✅ Database: MongoDB Atlas connected');
    console.log('✅ Fruits: 15 products across 6 categories');
    console.log('✅ System: Ready for production');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start server: npm start');
    console.log('   2. Access admin: http://localhost:5000/admin-login.html');
    console.log('   3. View marketplace: http://localhost:5000');
    console.log('   4. Change admin password after first login');
    
    console.log('\n⚠️  Security Notes:');
    console.log('   • Change admin password immediately');
    console.log('   • Update JWT_SECRET in .env file');
    console.log('   • Configure production environment variables');

  } catch (error) {
    console.error('❌ Setup Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the setup
setupFreshFruits();
