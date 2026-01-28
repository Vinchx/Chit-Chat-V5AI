// scripts/create-blocked-users-indexes.js
import mongoose from "mongoose";
import BlockedUser from "../src/models/BlockedUser.js";

// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function createBlockedUsersIndexes() {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Get the collection
        const collection = mongoose.connection.db.collection("blockedusers");

        // Create indexes
        console.log("🔄 Creating indexes for BlockedUser...");

        // 1. Compound unique index for blockerId + blockedUserId
        await collection.createIndex(
            { blockerId: 1, blockedUserId: 1 },
            { unique: true, name: "blockerId_1_blockedUserId_1" },
        );
        console.log("✅ Index created: blockerId_1_blockedUserId_1 (unique)");

        // 2. Index untuk query siapa yang nge-block user ini
        await collection.createIndex(
            { blockedUserId: 1 },
            { name: "blockedUserId_1" },
        );
        console.log("✅ Index created: blockedUserId_1");

        // 3. Index untuk query list blocked users dengan sort by date
        await collection.createIndex(
            { blockerId: 1, blockedAt: -1 },
            { name: "blockerId_1_blockedAt_-1" },
        );
        console.log("✅ Index created: blockerId_1_blockedAt_-1");

        // List all indexes
        const indexes = await collection.indexes();
        console.log("\n📋 All indexes:");
        indexes.forEach((index) => {
            console.log(`  - ${index.name}`);
        });

        console.log("\n✅ All indexes created successfully!");
    } catch (error) {
        console.error("❌ Error creating indexes:", error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log("👋 MongoDB connection closed");
    }
}

// Run the script
createBlockedUsersIndexes()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
