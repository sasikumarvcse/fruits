const mongoose = require('mongoose');
const Item = require('./models/Item');
require('dotenv').config();

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas for seeding fruits'))
.catch(err => console.error('MongoDB connection error:', err));

const fruits = [
  // Premium Fruits
  {
    name: "Fresh Mango",
    description: "Sweet and juicy Alphonso mangoes, handpicked from the finest orchards. Perfect for smoothies, desserts, or enjoying fresh.",
    price: 120,
    originalPrice: 150,
    category: "premium",
    images: ["uploads/mango-1.jpg", "uploads/mango-2.jpg"],
    image: "uploads/mango-1.jpg",
    stock: 50,
    status: "active",
    offers: ["Buy 2 Get 1 Free", "Free Delivery"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in Vitamin C and antioxidants. Perfect ripeness guaranteed."
  },
  {
    name: "Golden Pineapple",
    description: "Sweet and tangy pineapples with golden flesh. Great for tropical salads, juices, or as a healthy snack.",
    price: 80,
    originalPrice: 100,
    category: "premium",
    images: ["uploads/pineapple-1.jpg", "uploads/pineapple-2.jpg"],
    image: "uploads/pineapple-1.jpg",
    stock: 30,
    status: "active",
    offers: ["20% Off", "Free Cutting Service"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin C and bromelain. Helps with digestion and immunity."
  },
  {
    name: "Organic Papaya",
    description: "Ripe and sweet papaya, certified organic. Excellent source of Vitamin A and digestive enzymes.",
    price: 60,
    originalPrice: 75,
    category: "premium",
    images: ["uploads/papaya-1.jpg", "uploads/papaya-2.jpg"],
    image: "uploads/papaya-1.jpg",
    stock: 25,
    status: "active",
    offers: ["Organic Certified", "Free Delivery"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in papain enzyme, Vitamin C, and fiber. Great for digestive health."
  },

  // Standard Fruits
  {
    name: "Sweet Oranges",
    description: "Juicy and sweet oranges, perfect for fresh juice or eating. High in Vitamin C and natural sweetness.",
    price: 100,
    originalPrice: 120,
    category: "standard",
    images: ["uploads/orange-1.jpg", "uploads/orange-2.jpg"],
    image: "uploads/orange-1.jpg",
    stock: 80,
    status: "active",
    offers: ["Buy 1kg Get 500g Free", "Free Juicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Excellent source of Vitamin C, fiber, and antioxidants."
  },
  {
    name: "Fresh Lemons",
    description: "Tangy and aromatic lemons, perfect for cooking, beverages, or natural cleaning. Rich in Vitamin C.",
    price: 40,
    originalPrice: 50,
    category: "standard",
    images: ["uploads/lemon-1.jpg", "uploads/lemon-2.jpg"],
    image: "uploads/lemon-1.jpg",
    stock: 100,
    status: "active",
    offers: ["Buy 2kg Get 1kg Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin C and citric acid. Great for immunity and detox."
  },
  {
    name: "Green Limes",
    description: "Fresh and zesty limes, perfect for cocktails, cooking, or garnishing. Adds perfect acidity to dishes.",
    price: 50,
    originalPrice: 60,
    category: "standard",
    images: ["uploads/lime-1.jpg", "uploads/lime-2.jpg"],
    image: "uploads/lime-1.jpg",
    stock: 60,
    status: "active",
    offers: ["Buy 1kg Get 500g Free", "Free Juicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in Vitamin C and antioxidants. Perfect for detox drinks."
  },

  // Premium Berries
  {
    name: "Fresh Strawberries",
    description: "Sweet and juicy strawberries, handpicked at peak ripeness. Perfect for desserts, smoothies, or fresh eating.",
    price: 200,
    originalPrice: 250,
    category: "premium",
    images: ["uploads/strawberry-1.jpg", "uploads/strawberry-2.jpg"],
    image: "uploads/strawberry-1.jpg",
    stock: 40,
    status: "active",
    offers: ["Buy 2 Boxes Get 1 Free", "Free Washing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in antioxidants, Vitamin C, and fiber. Great for heart health."
  },
  {
    name: "Organic Blueberries",
    description: "Sweet and nutritious blueberries, certified organic. Perfect for smoothies, baking, or healthy snacking.",
    price: 300,
    originalPrice: 350,
    category: "premium",
    images: ["uploads/blueberry-1.jpg", "uploads/blueberry-2.jpg"],
    image: "uploads/blueberry-1.jpg",
    stock: 30,
    status: "active",
    offers: ["Organic Certified", "Buy 2 Get 1 Free"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Superfood rich in antioxidants, Vitamin K, and fiber."
  },

  // Standard Stone Fruits
  {
    name: "Red Apples",
    description: "Crisp and sweet red apples, perfect for snacking or baking. High in fiber and antioxidants.",
    price: 150,
    originalPrice: 180,
    category: "standard",
    images: ["uploads/apple-1.jpg", "uploads/apple-2.jpg"],
    image: "uploads/apple-1.jpg",
    stock: 70,
    status: "active",
    offers: ["Buy 2kg Get 1kg Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in fiber, Vitamin C, and antioxidants. Great for heart health."
  },
  {
    name: "Juicy Peaches",
    description: "Sweet and fragrant peaches, perfect for desserts, smoothies, or fresh eating. Soft and juicy texture.",
    price: 180,
    originalPrice: 220,
    category: "standard",
    images: ["uploads/peach-1.jpg", "uploads/peach-2.jpg"],
    image: "uploads/peach-1.jpg",
    stock: 35,
    status: "active",
    offers: ["Buy 1kg Get 500g Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin A, C, and fiber. Great for skin health."
  },
  {
    name: "Fresh Plums",
    description: "Sweet and tart plums, perfect for jams, desserts, or fresh eating. Rich in antioxidants and fiber.",
    price: 120,
    originalPrice: 150,
    category: "standard",
    images: ["uploads/plum-1.jpg", "uploads/plum-2.jpg"],
    image: "uploads/plum-1.jpg",
    stock: 45,
    status: "active",
    offers: ["Buy 2kg Get 1kg Free", "Free Delivery"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in Vitamin C, fiber, and antioxidants. Great for digestion."
  },

  // Basic Melons
  {
    name: "Sweet Watermelon",
    description: "Juicy and refreshing watermelon, perfect for hot days. High water content and natural sweetness.",
    price: 40,
    originalPrice: 50,
    category: "basic",
    images: ["uploads/watermelon-1.jpg", "uploads/watermelon-2.jpg"],
    image: "uploads/watermelon-1.jpg",
    stock: 20,
    status: "active",
    offers: ["Buy 1 Get 1 Free", "Free Cutting"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in water content, Vitamin A, and lycopene. Perfect for hydration."
  },
  {
    name: "Fresh Cantaloupe",
    description: "Sweet and aromatic cantaloupe, perfect for fruit salads or fresh eating. Rich in Vitamin A and C.",
    price: 80,
    originalPrice: 100,
    category: "basic",
    images: ["uploads/cantaloupe-1.jpg", "uploads/cantaloupe-2.jpg"],
    image: "uploads/cantaloupe-1.jpg",
    stock: 25,
    status: "active",
    offers: ["Buy 1 Get 1 Free", "Free Slicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in Vitamin A, C, and potassium. Great for eye health."
  },

  // Premium Exotic Fruits
  {
    name: "Dragon Fruit",
    description: "Exotic and beautiful dragon fruit with sweet, mild flavor. Perfect for smoothie bowls or fresh eating.",
    price: 400,
    originalPrice: 500,
    category: "premium",
    images: ["uploads/dragonfruit-1.jpg", "uploads/dragonfruit-2.jpg"],
    image: "uploads/dragonfruit-1.jpg",
    stock: 15,
    status: "active",
    offers: ["Exotic Premium", "Free Cutting"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "Rich in antioxidants, Vitamin C, and fiber. Great for skin health."
  },
  {
    name: "Passion Fruit",
    description: "Tangy and aromatic passion fruit, perfect for juices, desserts, or garnishing. Unique tropical flavor.",
    price: 250,
    originalPrice: 300,
    category: "premium",
    images: ["uploads/passionfruit-1.jpg", "uploads/passionfruit-2.jpg"],
    image: "uploads/passionfruit-1.jpg",
    stock: 20,
    status: "active",
    offers: ["Exotic Premium", "Free Juicing"],
    returnPolicy: "7 days easy return",
    warranty: "Freshness guaranteed",
    deliveryInfo: "Same day delivery available",
    details: "High in Vitamin C, fiber, and antioxidants. Great for immunity."
  }
];

async function seedFruits() {
  try {
    // Clear existing fruits
    await Item.deleteMany({});
    console.log('Cleared existing fruits');

    // Insert new fruits
    const insertedFruits = await Item.insertMany(fruits);
    console.log(`Successfully seeded ${insertedFruits.length} fruits`);

    // Display summary
    console.log('\n=== FreshFruits Database Seeded Successfully ===');
    console.log('Categories created:');
    
    const categories = [...new Set(fruits.map(fruit => fruit.category))];
    categories.forEach(category => {
      const count = fruits.filter(fruit => fruit.category === category).length;
      console.log(`- ${category}: ${count} fruits`);
    });

    console.log('\nSample fruits added:');
    fruits.forEach(fruit => {
      console.log(`- ${fruit.name}: ₹${fruit.price}/kg`);
    });

    console.log('\n✅ Database ready for FreshFruits marketplace!');
    console.log('🚀 You can now start the server and access the admin dashboard');
    console.log('📧 Admin login: admin@freshfruits.com / admin123');

  } catch (error) {
    console.error('Error seeding fruits:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedFruits();
