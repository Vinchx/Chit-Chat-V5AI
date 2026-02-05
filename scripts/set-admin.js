/**
 * Set user as admin
 * Run with: node scripts/set-admin.js <userId>
 * Example: node scripts/set-admin.js user001
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function setAdmin() {
    try {
        const userId = process.argv[2];

        if (!userId) {
            console.log('❌ Please provide userId');
            console.log('Usage: node scripts/set-admin.js <userId>');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Check if user exists
        const user = await usersCollection.findOne({ _id: userId });
        if (!user) {
            console.log(`❌ User ${userId} not found`);
            process.exit(1);
        }

        console.log(`\n👤 User found:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Current Role: ${user.role || 'user'}`);

        // Update role to admin
        await usersCollection.updateOne(
            { _id: userId },
            { $set: { role: 'admin' } }
        );

        console.log('\n✅ User role updated to ADMIN!');

        // Verify
        const updatedUser = await usersCollection.findOne({ _id: userId });
        console.log(`\n✅ Verified - New Role: ${updatedUser.role}`);

        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

setAdmin();
