// MongoDB Atlas Connection Test Script
// Run: node scripts/test-mongodb-connection.js

import { MongoClient } from 'mongodb';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

async function testMongoDBConnection() {
    // Get connection string from environment variable
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error(`${colors.red}❌ Error: MONGODB_URI not found in environment variables${colors.reset}`);
        console.log(`${colors.yellow}💡 Make sure to set MONGODB_URI in your .env.local file${colors.reset}`);
        process.exit(1);
    }

    // Mask password in connection string for logging
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`${colors.cyan}🔗 Connecting to: ${maskedUri}${colors.reset}\n`);

    const client = new MongoClient(uri);

    try {
        console.log(`${colors.yellow}⏳ Testing connection...${colors.reset}`);

        // Connect to MongoDB
        await client.connect();

        console.log(`${colors.green}✅ Successfully connected to MongoDB!${colors.reset}\n`);

        // Get database and test operations
        const db = client.db();
        const dbName = db.databaseName;

        console.log(`${colors.cyan}📊 Database Info:${colors.reset}`);
        console.log(`   Database Name: ${dbName}`);

        // List collections
        const collections = await db.listCollections().toArray();
        console.log(`   Collections: ${collections.length} found`);

        if (collections.length > 0) {
            console.log(`\n${colors.cyan}📁 Collections:${colors.reset}`);
            for (const collection of collections) {
                const count = await db.collection(collection.name).estimatedDocumentCount();
                console.log(`   - ${collection.name} (${count} documents)`);
            }
        } else {
            console.log(`\n${colors.yellow}💡 No collections found. Database is empty.${colors.reset}`);
        }

        // Test server status
        const adminDb = client.db('admin');
        const serverStatus = await adminDb.command({ serverStatus: 1 });

        console.log(`\n${colors.cyan}🖥️  Server Info:${colors.reset}`);
        console.log(`   Host: ${serverStatus.host}`);
        console.log(`   Version: ${serverStatus.version}`);
        console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);

        // Determine if it's Atlas or local
        const isAtlas = uri.includes('mongodb+srv') || uri.includes('mongodb.net');
        console.log(`   Type: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);

        console.log(`\n${colors.green}✅ Connection test completed successfully!${colors.reset}`);

    } catch (error) {
        console.error(`\n${colors.red}❌ Connection failed:${colors.reset}`);
        console.error(`   ${error.message}`);

        if (error.message.includes('authentication failed')) {
            console.log(`\n${colors.yellow}💡 Troubleshooting:${colors.reset}`);
            console.log(`   - Check your username and password in the connection string`);
            console.log(`   - Make sure the database user exists in Atlas`);
            console.log(`   - Verify password has no special characters or is URL-encoded`);
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
            console.log(`\n${colors.yellow}💡 Troubleshooting:${colors.reset}`);
            console.log(`   - Check your internet connection`);
            console.log(`   - Verify the cluster hostname is correct`);
            console.log(`   - Make sure IP address is whitelisted in Atlas Network Access`);
        }

        process.exit(1);
    } finally {
        await client.close();
        console.log(`\n${colors.cyan}🔌 Connection closed${colors.reset}`);
    }
}

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
    const { config } = await import('dotenv');
    config({ path: '.env.local' });
}

// Run the test
testMongoDBConnection();
