import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI tidak ditemukan di .env.local');
    process.exit(1);
}

async function createReadReceiptsIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('readreceipts');

        console.log('\n📊 Creating indexes for readreceipts collection...\n');

        // Index 1: Compound unique index untuk ensure 1 user 1 read receipt per message
        console.log('Creating index: { messageId: 1, userId: 1 } (unique)');
        await collection.createIndex(
            { messageId: 1, userId: 1 },
            { unique: true }
        );
        console.log('✅ Index created');

        // Index 2: Query performance untuk fetch read receipts by room
        console.log('\nCreating index: { roomId: 1, userId: 1, readAt: -1 }');
        await collection.createIndex(
            { roomId: 1, userId: 1, readAt: -1 }
        );
        console.log('✅ Index created');

        // Index 3: Query performance untuk fetch read receipts by message
        console.log('\nCreating index: { messageId: 1, readAt: 1 }');
        await collection.createIndex(
            { messageId: 1, readAt: 1 }
        );
        console.log('✅ Index created');

        // Verify indexes
        console.log('\n📋 Verifying all indexes...');
        const indexes = await collection.listIndexes().toArray();
        console.log('\nExisting indexes:');
        indexes.forEach(index => {
            console.log(`- ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n✅ All indexes created successfully!');

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

createReadReceiptsIndexes();
