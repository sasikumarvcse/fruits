const mongoose = require('mongoose');
const Item = require('./models/Item');

// MongoDB connection
const MONGO_URI = 'mongodb+srv://growwpark:growwpark123@cluster0.qsoytwo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Three-tier product categories
const threeTierProducts = [
    // BASIC TIER PRODUCTS
    {
        name: 'Basic Fruit Bowl',
        description: 'Simple and healthy fruit bowl with basic ingredients. Perfect for budget-conscious customers.',
        price: 99,
        mrp: 149,
        category: 'basic',
        image: 'basic-fruit-bowl.jpg',
        status: 'active',
        isOrganic: false,
        isBestSeller: false,
        stock: 200,
        sales: 0,
        productDetails: {
            calories: '120',
            protein: '2g',
            carbs: '28g',
            fiber: '4g',
            vitamins: 'Vitamin C',
            minerals: 'Potassium',
            origin: 'Local farms',
            season: 'All year',
            storage: 'Refrigerate',
            shelfLife: '3 days'
        },
        deliveryInfo: {
            estimatedDelivery: 'Same day',
            additionalInfo: 'Basic packaging'
        }
    },
    {
        name: 'Basic Veggie Mix',
        description: 'Essential vegetables for daily nutrition. Basic quality at affordable price.',
        price: 79,
        mrp: 120,
        category: 'basic',
        image: 'basic-veggie-mix.jpg',
        status: 'active',
        isOrganic: false,
        isBestSeller: true,
        stock: 150,
        sales: 0,
        productDetails: {
            calories: '45',
            protein: '3g',
            carbs: '8g',
            fiber: '3g',
            vitamins: 'Vitamin A, C',
            minerals: 'Iron, Calcium',
            origin: 'Local farms',
            season: 'All year',
            storage: 'Cool, dry place',
            shelfLife: '5 days'
        },
        deliveryInfo: {
            estimatedDelivery: 'Same day',
            additionalInfo: 'Standard packaging'
        }
    },
    {
        name: 'Basic Smoothie Pack',
        description: 'Basic ingredients for making healthy smoothies at home.',
        price: 149,
        mrp: 199,
        category: 'basic',
        image: 'basic-smoothie-pack.jpg',
        status: 'active',
        isOrganic: false,
        isBestSeller: false,
        stock: 100,
        sales: 0,
        productDetails: {
            calories: '180',
            protein: '5g',
            carbs: '42g',
            fiber: '6g',
            vitamins: 'Vitamin C, B6',
            minerals: 'Potassium, Magnesium',
            origin: 'Mixed sources',
            season: 'All year',
            storage: 'Freeze fruits',
            shelfLife: '7 days'
        },
        deliveryInfo: {
            estimatedDelivery: 'Next day',
            additionalInfo: 'Basic cold packaging'
        }
    },

    // STANDARD TIER PRODUCTS
    {
        name: 'Standard Premium Bowl',
        description: 'Quality fruit and veggie bowl with premium ingredients. Great balance of quality and price.',
        price: 199,
        mrp: 299,
        category: 'standard',
        image: 'standard-premium-bowl.jpg',
        status: 'active',
        isOrganic: true,
        isBestSeller: true,
        stock: 120,
        sales: 0,
        productDetails: {
            calories: '165',
            protein: '4g',
            carbs: '38g',
            fiber: '7g',
            vitamins: 'Vitamin A, C, E',
            minerals: 'Potassium, Iron, Calcium',
            origin: 'Certified organic farms',
            season: 'Seasonal selection',
            storage: 'Refrigerate immediately',
            shelfLife: '5 days'
        },
        deliveryInfo: {
            estimatedDelivery: 'Same day',
            additionalInfo: 'Premium packaging with ice packs'
        }
    },
    {
        name: 'Standard Protein Bowl',
        description: 'Balanced protein-rich bowl with nuts, seeds, and fresh produce. Standard quality nutrition.',
        price: 249,
        mrp: 349,
        category: 'standard',
        image: 'standard-protein-bowl.jpg',
        status: 'active',
        isOrganic: true,
        isBestSeller: false,
        stock: 80,
        sales: 0,
        productDetails: {
            calories: '320',
            protein: '15g',
            carbs: '28g',
            fiber: '10g',
            vitamins: 'Vitamin E, B complex',
            minerals: 'Magnesium, Zinc, Iron',
            origin: 'Organic certified sources',
            season: 'All year',
            storage: 'Cool, dry place',
            shelfLife: '7 days'
        },
        deliveryInfo: {
            estimatedDelivery: 'Same day',
            additionalInfo: 'Insulated packaging'
        }
    },
    {
        name: 'Standard Detox Pack',
        description: 'Carefully selected ingredients for natural detox. Standard quality health pack.',
        price: 299,
        mrp: 399,
        category: 'standard',
        image: 'standard-detox-pack.jpg',
        status: 'active',
        isOrganic: true,
        isBestSeller: true,
        stock: 60,
        sales: 0,
        productDetails: {
            calories: '95',
            protein: '2g',
            carbs: '22g',
            fiber: '8g',
            vitamins: 'Vitamin C, Folate',
            minerals: 'Potassium, Manganese',
            origin: 'Organic farms',
            season: 'Seasonal',
            storage: 'Refrigerate',
            shelfLife: '4 days'
        },
        deliveryInfo: {
            estimatedDelivery: 'Same day',
            additionalInfo: 'Temperature controlled delivery'
        }
    },

    // PREMIUM TIER PRODUCTS
    {
        name: 'Premium Gourmet Bowl',
        description: 'Luxury gourmet bowl with exotic fruits and premium ingredients. Top-tier quality and presentation.',
        price: 499,
        mrp: 699,
        category: 'premium',
        image: 'premium-gourmet-bowl.jpg',
        status: 'active',
        isOrganic: true,
        isBestSeller: true,
        stock: 40,
        sales: 0,
        productDetails: {
            calories: '245',
            protein: '8g',
            carbs: '45g',
            fiber: '12g',
            vitamins: 'Full vitamin spectrum',
            minerals: 'Complete mineral profile',
            origin: 'Premium organic farms worldwide',
            season: 'Curated seasonal selection',
            storage: 'Temperature controlled',
            shelfLife: '6 days'
        },
        deliveryInfo: {
            estimatedDelivery: '2 hours',
            additionalInfo: 'White-glove delivery with premium packaging'
        }
    },
    {
        name: 'Premium Superfood Bowl',
        description: 'Ultimate superfood experience with rare and exotic ingredients. Premium quality guarantee.',
        price: 699,
        mrp: 999,
        category: 'premium',
        image: 'premium-superfood-bowl.jpg',
        status: 'active',
        isOrganic: true,
        isBestSeller: false,
        stock: 25,
        sales: 0,
        productDetails: {
            calories: '380',
            protein: '18g',
            carbs: '52g',
            fiber: '15g',
            vitamins: 'Premium vitamin complex',
            minerals: 'Rare earth minerals',
            origin: 'Exclusive premium suppliers',
            season: 'Limited edition seasonal',
            storage: 'Professional grade storage',
            shelfLife: '8 days'
        },
        deliveryInfo: {
            estimatedDelivery: '1 hour',
            additionalInfo: 'Concierge delivery with dry ice packaging'
        }
    },
    {
        name: 'Premium Chef Special',
        description: 'Exclusive chef-curated bowl with premium ingredients. Limited edition premium experience.',
        price: 899,
        mrp: 1299,
        category: 'premium',
        image: 'premium-chef-special.jpg',
        status: 'active',
        isOrganic: true,
        isBestSeller: true,
        stock: 15,
        sales: 0,
        productDetails: {
            calories: '425',
            protein: '22g',
            carbs: '58g',
            fiber: '18g',
            vitamins: 'Chef-selected vitamin blend',
            minerals: 'Artisanal mineral selection',
            origin: 'Michelin-starred supplier network',
            season: 'Chef\'s seasonal selection',
            storage: 'Sommelier-grade storage',
            shelfLife: '10 days'
        },
        deliveryInfo: {
            estimatedDelivery: '30 minutes',
            additionalInfo: 'Personal delivery with premium presentation'
        }
    }
];

async function addThreeTierProducts() {
    try {
        console.log('🔄 Adding three-tier category products...');
        
        // Clear existing products
        await Item.deleteMany({});
        console.log('✅ Cleared existing products');

        // Add new three-tier products
        for (const product of threeTierProducts) {
            const newProduct = new Item(product);
            await newProduct.save();
            console.log(`✅ Added: ${product.name} - ${product.category.toUpperCase()} - ₹${product.price}`);
        }

        console.log(`✅ Successfully added ${threeTierProducts.length} three-tier products!`);
        
        // Display summary
        const totalProducts = await Item.countDocuments();
        console.log(`📊 Total products in database: ${totalProducts}`);
        
        const basicCount = await Item.countDocuments({ category: 'basic' });
        const standardCount = await Item.countDocuments({ category: 'standard' });
        const premiumCount = await Item.countDocuments({ category: 'premium' });
        
        console.log(`🥉 Basic: ${basicCount} products`);
        console.log(`🥈 Standard: ${standardCount} products`);
        console.log(`🥇 Premium: ${premiumCount} products`);
        
    } catch (error) {
        console.error('❌ Error adding products:', error);
    } finally {
        mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
}

// Run the script
addThreeTierProducts();
