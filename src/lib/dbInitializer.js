// src/lib/dbInitializer.js
import connectToDatabase from './mongodb';

// Fungsi untuk menginisialisasi koneksi database saat aplikasi dimulai
export async function initializeDbConnection() {
  try {
    console.log('Menginisialisasi koneksi database...');
    await connectToDatabase();
    console.log('✅ Koneksi database berhasil diinisialisasi');
  } catch (error) {
    console.error('❌ Gagal menginisialisasi koneksi database:', error.message);
    throw error;
  }
}