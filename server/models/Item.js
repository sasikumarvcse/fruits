const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    mrp: {
        type: Number,
        min: 0
    },
    // ✅ UPDATED: Only 3 categories
    category: {
        type: String,
        enum: ['basic', 'standard', 'premium'], // ✅ Updated enum values
        required: true
    },
    isOrganic: {
        type: Boolean,
        default: false
    },
    isBestSeller: {
        type: Boolean,
        default: false
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
    images: {
        type: [String],
        default: ['default-item.jpg']
    },
    stock: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    offers: { type: [String], default: [] },
    deliveryInfo: {
        estimatedDelivery: { type: String, default: '' },
        additionalInfo: { type: String, default: '' }
    },
    details: { type: String, default: '' },
    productDetails: {
        calories: { type: String, default: '' },
        protein: { type: String, default: '' },
        carbs: { type: String, default: '' },
        fiber: { type: String, default: '' },
        vitamins: { type: String, default: '' },
        minerals: { type: String, default: '' },
        origin: { type: String, default: '' },
        season: { type: String, default: '' },
        storage: { type: String, default: '' },
        shelfLife: { type: String, default: '' },
        customFields: [{
            label: { type: String, required: true },
            value: { type: String, required: true }
        }]
    },
    deliveryStatus: [{
        status: {
            type: String,
            enum: ['arrived', 'picked_up', 'delivered', 'returned', 'issue'],
            required: true
        },
        notes: {
            type: String,
            default: ''
        },
        deliveryMan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);
