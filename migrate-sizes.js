import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Product from './models/product.js';

/**
 * Migration Script: Convert 'size' field to 'sizes' array
 * 
 * This script migrates existing products from the old schema (size: String)
 * to the new schema (sizes: [Number])
 */

async function migrateProducts() {
    try {
        console.log('🔄 Starting product migration...\n');

        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('❌ MONGODB_URI is missing in .env');
            process.exit(1);
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all products
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products to migrate\n`);

        let migrated = 0;
        let skipped = 0;

        for (const product of products) {
            // Check if product has old 'size' field (not in schema anymore but may exist in DB)
            const productObj = product.toObject();

            // If sizes array already exists and has data, skip
            if (product.sizes && product.sizes.length > 0) {
                console.log(`⏭️  Skipped: ${product.name} (already has sizes array)`);
                skipped++;
                continue;
            }

            // If old 'size' field exists in the raw document
            if (productObj.size) {
                let sizesArray = [];

                // Try to parse the old size field
                if (typeof productObj.size === 'string') {
                    // Check if it's comma-separated
                    if (productObj.size.includes(',')) {
                        sizesArray = productObj.size.split(',')
                            .map(s => parseFloat(s.trim()))
                            .filter(s => !isNaN(s));
                    } else {
                        // Single size value
                        const sizeNum = parseFloat(productObj.size);
                        if (!isNaN(sizeNum)) {
                            sizesArray = [sizeNum];
                        }
                    }
                } else if (typeof productObj.size === 'number') {
                    sizesArray = [productObj.size];
                }

                // Update the product
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: { sizes: sizesArray },
                        $unset: { size: "" } // Remove old field
                    }
                );

                console.log(`✅ Migrated: ${product.name} - sizes: [${sizesArray.join(', ')}]`);
                migrated++;
            } else {
                console.log(`⚠️  Warning: ${product.name} has no size data`);
                skipped++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Migrated: ${migrated} products`);
        console.log(`   ⏭️  Skipped: ${skipped} products`);
        console.log('\n✨ Migration completed successfully!');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
migrateProducts();
