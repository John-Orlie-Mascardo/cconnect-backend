import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './models/user.js';

dotenv.config();

/**
 * Migration Script: Convert addresses from old schema to Philippine format
 * 
 * Old Format: { street, city, state, zipCode, country }
 * New Format: { province, city, barangay, postalCode, streetDetails }
 */

async function migrateAddresses() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all users with addresses
        const users = await UserModel.find({ 'addresses.0': { $exists: true } });
        console.log(`\nFound ${users.length} users with addresses`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            let userModified = false;

            for (const addr of user.addresses) {
                // Check if address is in old format (has 'street' field)
                if (addr.street !== undefined && addr.province === undefined) {
                    console.log(`\n📝 Migrating address for user: ${user.email}`);
                    console.log(`   Old: ${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`);

                    // Map old fields to new Philippine format
                    addr.province = addr.state || 'Metro Manila';
                    addr.barangay = 'To be updated'; // Default value - user needs to update
                    addr.postalCode = addr.zipCode || '';
                    addr.streetDetails = addr.street || '';

                    // Keep city as is
                    // Keep isDefault as is

                    // Remove old fields
                    addr.street = undefined;
                    addr.state = undefined;
                    addr.zipCode = undefined;
                    addr.country = undefined;

                    console.log(`   New: ${addr.streetDetails}, ${addr.barangay}, ${addr.city}, ${addr.province} ${addr.postalCode}`);

                    userModified = true;
                    migratedCount++;
                } else if (addr.province !== undefined) {
                    // Already in new format
                    skippedCount++;
                }
            }

            if (userModified) {
                await user.save();
                console.log(`   ✅ Saved updated addresses for ${user.email}`);
            }
        }

        console.log(`\n========================================`);
        console.log(`Migration Complete!`);
        console.log(`========================================`);
        console.log(`✅ Migrated: ${migratedCount} addresses`);
        console.log(`⏭️  Skipped: ${skippedCount} addresses (already in new format)`);
        console.log(`\n⚠️  Note: Addresses with barangay "To be updated" need manual correction`);

        await mongoose.disconnect();
        console.log(`\n✅ Disconnected from MongoDB`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateAddresses();
