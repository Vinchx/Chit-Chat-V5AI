import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

// Ini kayak ngetes: "Halo, gudang? Masih bisa dengar?"
export async function GET() {
  try {
    await connectToDatabase();

    // Tambahkan informasi koneksi
    const dbInfo = {
      isConnected: mongoose.connection.readyState === 1,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      hostPort: `${mongoose.connection.host}:${mongoose.connection.port}`,
    };

    return Response.json({
      success: true,
      message: "Yeay! Telepon ke gudang berhasil! 📞✅",
      dbInfo,
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: "Aduh, teleponnya putus! ☎️❌",
      error: error.message,
    });
  }
}
