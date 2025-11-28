import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Product from './models/product.js';

/**
 * Test Script: Add sizes to the "Jordans Air" product
 */

async function addSizesToProduct() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the "Jordans Air" product
        const product = await Product.findOne({ name: /jordan/i });

        if (!product) {
            console.log('❌ Product not found');
            process.exit(1);
        }

        console.log('📦 Found product:', product.name);
        console.log('   Current sizes:', product.sizes);

        // Update with sizes array
        product.sizes = [4, 5, 6, 7, 8, 9, 10, 11, 12];
        await product.save();

        console.log('✅ Updated sizes:', product.sizes);
        console.log('\n🎉 Product updated successfully!');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

addSizesToProduct();
