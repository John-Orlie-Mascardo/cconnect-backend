import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    size: {
        type: Number,
        required: false
    },
    price: {
        type: Number,
        required: true
    }
});

const deliveryAddressSchema = new mongoose.Schema({
    province: { type: String, required: true },
    city: { type: String, required: true },
    barangay: { type: String, required: true },
    postalCode: { type: String, required: true },
    streetDetails: { type: String, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    deliveryAddress: {
        type: deliveryAddressSchema,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['CoD', 'CoP', 'Meetup', 'E-Wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique order number before saving
orderSchema.pre('save', function (next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderNumber = `ORD-${timestamp}-${random}`;
    }
    this.updatedAt = Date.now();
    next();
});

export const OrderModel = mongoose.model('Order', orderSchema);
