import mongoose from "mongoose";
import { MongoClient } from "mongodb";

// Ini kayak nomor telepon gudang data kita
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Eh, lupa nulis nomor telepon gudang! Cek file .env.local");
}

// Simpan sambungan telepon biar nggak putus-putus
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  // Kalo udah nyambung, nggak perlu telepon lagi
  if (cached.conn) {
    return cached.conn;
  }

  // Kalo belum, coba sambungin telepon
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Client Promise untuk NextAuth MongoDB Adapter
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default connectToDatabase;
export { clientPromise };
