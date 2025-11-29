import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { CartModel } from './models/cart.js';
import Product from './models/product.js';
import { UserModel } from './models/user.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function debugCart() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all carts
        const carts = await CartModel.find().populate('user');
        console.log(`Found ${carts.length} cart(s)\n`);

        for (const cart of carts) {
            console.log(`\n📦 Cart for user: ${cart.user?.email || 'Unknown'}`);
            console.log(`   Cart ID: ${cart._id}`);
            console.log(`   Items: ${cart.items.length}`);

            for (const item of cart.items) {
                const product = await Product.findById(item.product);
                console.log(`\n   Item:`);
                console.log(`     Product ID: ${item.product}`);
                console.log(`     Quantity: ${item.quantity}`);
                console.log(`     Price: ${item.price}`);

                if (product) {
                    console.log(`     ✅ Product exists: ${product.name}`);
                    console.log(`     Image: ${product.image || 'No image'}`);
                } else {
                    console.log(`     ❌ Product NOT FOUND in database!`);
                }
            }
        }

        console.log('\n\n📊 All Products in Database:');
        const products = await Product.find();
        console.log(`Total products: ${products.length}`);
        products.forEach(p => {
            console.log(`  - ${p.name} (ID: ${p._id}, Image: ${p.image || 'none'})`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugCart();
