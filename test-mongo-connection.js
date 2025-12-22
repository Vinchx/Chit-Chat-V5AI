const { MongoClient } = require('mongodb');

async function testDirectConnection() {
  const uri = "mongodb://localhost:27017/chitchat";
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000, // 5 detik timeout
  });

  try {
    await client.connect();
    console.log('✅ Koneksi langsung ke MongoDB berhasil!');
    
    const db = client.db();
    console.log('Nama database:', db.databaseName);
    
    // Coba akses koleksi users
    const collections = await db.listCollections().toArray();
    console.log('Koleksi yang tersedia:', collections.map(c => c.name));
    
    return true;
  } catch (error) {
    console.error('❌ Error koneksi langsung ke MongoDB:', error.message);
    return false;
  } finally {
    await client.close();
  }
}

testDirectConnection().then(success => {
  if (success) {
    console.log('Test selesai - koneksi MongoDB berhasil');
  } else {
    console.log('Test selesai - koneksi MongoDB gagal');
  }
});