import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { CartModel } from './models/cart.js';
import Product from './models/product.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function checkCart() {
    await mongoose.connect(MONGODB_URI);

    const carts = await CartModel.find();
    console.log(`Total carts: ${carts.length}`);

    for (const cart of carts) {
        console.log(`\nCart ${cart._id}:`);
        for (const item of cart.items) {
            const product = await Product.findById(item.product);
            if (product) {
                console.log(`  OK: ${product.name}`);
            } else {
                console.log(`  MISSING: ${item.product}`);
            }
        }
    }

    const products = await Product.find();
    console.log(`\nTotal products in DB: ${products.length}`);

    await mongoose.disconnect();
}

checkCart().catch(console.error);
