import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
wishlistSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export const WishlistModel = mongoose.model('Wishlist', wishlistSchema);
