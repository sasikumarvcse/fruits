// server/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    mrp: {
        type: Number,
        min: 0
    },
    // ✅ UPDATED: Only 3 categories
    category: {
        type: String,
        required: true,
        enum: ['basic', 'standard', 'premium']
    },
    images: {
        type: [String],
        default: []
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    isOrganic: {
        type: Boolean,
        default: false
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ratings: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    sales: {
        type: Number,
        default: 0,
        min: 0
    },
    returns: {
        type: Number,
        default: 0,
        min: 0
    },
    deliveryInfo: {
        estimatedDelivery: String
    },
    bankOffers: [String],
    offers: [String],
    productDetails: {
        calories: String,
        protein: String,
        carbs: String,
        fiber: String,
        vitamins: String,
        minerals: String,
        origin: String,
        season: String,
        storage: String,
        shelfLife: String,
        customFields: [{
            label: String,
            value: String
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
});

// Update timestamp before saving
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;
