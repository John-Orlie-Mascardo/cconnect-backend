import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { CartModel } from './models/cart.js';
import { UserModel } from './models/user.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function fixCart() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user by email
    const user = await UserModel.findOne({ email: 'kenbaltero60@gmail.com' });
    if (!user) {
        console.log('❌ User not found');
        await mongoose.disconnect();
        return;
    }

    console.log(`Found user: ${user.email}`);

    // Find their cart
    const cart = await CartModel.findOne({ user: user._id });
    if (!cart) {
        console.log('❌ Cart not found');
        await mongoose.disconnect();
        return;
    }

    console.log(`\nCurrent cart items: ${cart.items.length}`);
    cart.items.forEach((item, index) => {
        console.log(`  ${index + 1}. Product ID: ${item.product}, Qty: ${item.quantity}`);
    });

    // Clear the cart
    cart.items = [];
    await cart.save();

    console.log('\n✅ Cart cleared successfully!');
    console.log('You can now add products fresh from the frontend.');

    await mongoose.disconnect();
}

fixCart().catch(console.error);
