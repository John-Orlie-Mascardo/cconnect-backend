import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { CartModel } from './models/cart.js';
import Product from './models/product.js';
import { UserModel } from './models/user.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function diagnose() {
    await mongoose.connect(MONGODB_URI);

    const user = await UserModel.findOne({ email: 'kenbaltero60@gmail.com' });
    const cart = await CartModel.findOne({ user: user._id }).populate('items.product');

    console.log('\n=== CART CONTENTS ===');
    console.log(`Total items: ${cart.items.length}\n`);

    cart.items.forEach((item, i) => {
        console.log(`Item ${i + 1}:`);
        console.log(`  Product ID in cart: ${item.product._id}`);
        console.log(`  Product name: ${item.product.name}`);
        console.log(`  Quantity: ${item.quantity}`);
        console.log(`  Price: ${item.price}`);
        console.log(`  Image: ${item.product.image}\n`);
    });

    console.log('\n=== ALL PRODUCTS IN DATABASE ===');
    const products = await Product.find();
    products.forEach(p => {
        console.log(`ID: ${p._id}`);
        console.log(`Name: ${p.name}`);
        console.log(`Image: ${p.image}`);
        console.log('---');
    });

    await mongoose.disconnect();
}

diagnose().catch(console.error);
