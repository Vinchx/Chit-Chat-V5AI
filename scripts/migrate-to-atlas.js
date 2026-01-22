// MongoDB Data Migration Script: Local → Atlas
// Run: node scripts/migrate-to-atlas.js

import { MongoClient } from 'mongodb';
import readline from 'readline';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

// Configuration
const SOURCE_URI = 'mongodb://localhost:27017/chitchat'; // Local MongoDB
const TARGET_URI = process.env.MONGODB_URI; // Atlas from .env.local

// Collections to migrate (add/remove as needed)
const COLLECTIONS_TO_MIGRATE = [
    'users',
    'accounts',
    'sessions',
    'verificationtokens',
    'conversations',
    'messages',
    'friendrequests',
    // Add more collections here if needed
];

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function migrateData() {
    if (!TARGET_URI) {
        console.error(`${colors.red}❌ Error: MONGODB_URI not found in .env.local${colors.reset}`);
        process.exit(1);
    }

    console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║   MongoDB Migration: Local → Atlas    ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.yellow}Source (Local):${colors.reset} ${SOURCE_URI}`);
    console.log(`${colors.yellow}Target (Atlas):${colors.reset} ${TARGET_URI.replace(/:([^@]+)@/, ':****@')}\n`);

    const answer = await askQuestion(`${colors.yellow}⚠️  This will copy data from LOCAL to ATLAS. Continue? (yes/no): ${colors.reset}`);

    if (answer.toLowerCase() !== 'yes') {
        console.log(`${colors.red}❌ Migration cancelled${colors.reset}`);
        process.exit(0);
    }

    let sourceClient, targetClient;

    try {
        console.log(`\n${colors.cyan}🔗 Connecting to databases...${colors.reset}`);

        sourceClient = new MongoClient(SOURCE_URI);
        targetClient = new MongoClient(TARGET_URI);

        await sourceClient.connect();
        console.log(`${colors.green}✅ Connected to source (local)${colors.reset}`);

        await targetClient.connect();
        console.log(`${colors.green}✅ Connected to target (Atlas)${colors.reset}\n`);

        const sourceDb = sourceClient.db();
        const targetDb = targetClient.db();

        // Get all collections from source if not specified
        const sourceCollections = await sourceDb.listCollections().toArray();
        const collectionsToMigrate = COLLECTIONS_TO_MIGRATE.length > 0
            ? COLLECTIONS_TO_MIGRATE
            : sourceCollections.map(c => c.name);

        console.log(`${colors.cyan}📦 Collections to migrate: ${collectionsToMigrate.length}${colors.reset}\n`);

        let totalDocuments = 0;
        let totalCollections = 0;

        for (const collectionName of collectionsToMigrate) {
            try {
                const sourceCollection = sourceDb.collection(collectionName);
                const targetCollection = targetDb.collection(collectionName);

                // Get document count
                const count = await sourceCollection.countDocuments();

                if (count === 0) {
                    console.log(`${colors.yellow}⊘ ${collectionName}: Skipped (empty)${colors.reset}`);
                    continue;
                }

                console.log(`${colors.cyan}📤 Migrating ${collectionName}... (${count} documents)${colors.reset}`);

                // Fetch all documents
                const documents = await sourceCollection.find({}).toArray();

                if (documents.length > 0) {
                    // Insert into target (use insertMany with ordered: false to continue on errors)
                    const result = await targetCollection.insertMany(documents, { ordered: false });
                    console.log(`${colors.green}✅ ${collectionName}: ${result.insertedCount} documents migrated${colors.reset}`);

                    totalDocuments += result.insertedCount;
                    totalCollections++;
                }

            } catch (error) {
                if (error.code === 11000) {
                    console.log(`${colors.yellow}⚠️  ${collectionName}: Some documents already exist (duplicates skipped)${colors.reset}`);
                } else {
                    console.error(`${colors.red}❌ ${collectionName}: ${error.message}${colors.reset}`);
                }
            }
        }

        console.log(`\n${colors.cyan}═══════════════════════════════════${colors.reset}`);
        console.log(`${colors.green}✅ Migration completed!${colors.reset}`);
        console.log(`${colors.cyan}═══════════════════════════════════${colors.reset}`);
        console.log(`   Collections migrated: ${totalCollections}`);
        console.log(`   Total documents: ${totalDocuments}`);
        console.log(`${colors.cyan}═══════════════════════════════════${colors.reset}\n`);

    } catch (error) {
        console.error(`\n${colors.red}❌ Migration failed:${colors.reset}`);
        console.error(`   ${error.message}`);
        process.exit(1);
    } finally {
        if (sourceClient) await sourceClient.close();
        if (targetClient) await targetClient.close();
        console.log(`${colors.cyan}🔌 Connections closed${colors.reset}`);
    }
}

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
    const { config } = await import('dotenv');
    config({ path: '.env.local' });
}

// Run migration
migrateData();
