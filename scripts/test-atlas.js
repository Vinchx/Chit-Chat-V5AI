// Quick MongoDB Atlas Connection Test
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://chitchat:Akusukapaharikka16@chitchatdb.h3kxkua.mongodb.net/chitchat?retryWrites=true&w=majority&appName=Chitchatdb';

async function test() {
    console.log('🔗 Testing MongoDB Atlas connection...\n');
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas successfully!\n');

        const db = client.db();
        console.log('📊 Database:', db.databaseName);

        const collections = await db.listCollections().toArray();
        console.log('📁 Collections:', collections.length);

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await client.close();
    }
}

test();
