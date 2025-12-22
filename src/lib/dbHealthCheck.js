import mongoose from 'mongoose';
import connectToDatabase from './mongodb';

export async function testDbConnection() {
  try {
    console.log('Mencoba terhubung ke database...');
    await connectToDatabase();
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Koneksi database berhasil!');
      console.log('Nama database:', mongoose.connection.name);
      console.log('Host:', mongoose.connection.host);
      console.log('Port:', mongoose.connection.port);
      return true;
    } else {
      console.log('❌ Koneksi database gagal, status:', mongoose.connection.readyState);
      return false;
    }
  } catch (error) {
    console.error('❌ Error koneksi database:', error.message);
    return false;
  }
}