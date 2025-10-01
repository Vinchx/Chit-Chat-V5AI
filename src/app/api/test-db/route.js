import connectToDatabase from "@/lib/mongodb";

// Ini kayak ngetes: "Halo, gudang? Masih bisa dengar?"
export async function GET() {
  try {
    await connectToDatabase();

    return Response.json({
      success: true,
      message: "Yeay! Telepon ke gudang berhasil! 📞✅",
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: "Aduh, teleponnya putus! ☎️❌",
      error: error.message,
    });
  }
}
