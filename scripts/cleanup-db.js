/**
 * Database Cleanup Script
 * Deletes all rooms and messages from the database
 * Run with: node scripts/cleanup-db.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function cleanupDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI);

        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Delete all rooms
        console.log('\n🗑️  Deleting all rooms...');
        const roomsResult = await db.collection('rooms').deleteMany({});
        console.log(`   Deleted ${roomsResult.deletedCount} rooms`);

        // Delete all messages
        console.log('🗑️  Deleting all messages...');
        const messagesResult = await db.collection('messages').deleteMany({});
        console.log(`   Deleted ${messagesResult.deletedCount} messages`);

        console.log('\n✅ Database cleanup completed!');
        console.log('\n📊 Summary:');
        console.log(`   - Rooms deleted: ${roomsResult.deletedCount}`);
        console.log(`   - Messages deleted: ${messagesResult.deletedCount}`);

        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error cleaning up database:', error);
        process.exit(1);
    }
}

cleanupDatabase();
