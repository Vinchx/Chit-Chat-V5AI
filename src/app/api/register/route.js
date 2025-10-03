import connectToDatabase from "@/lib/mongodb";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const { username, email, password, displayName } = await request.json();

    if (!username || !email || !password || !displayName) {
      return Response.json({
        success: false,
        message: "isi semua kolom dulu",
      });
    }

    // Validasi password minimal 8 karakter
    if (password.length < 8) {
      return Response.json({
        success: false,
        message: "Password minimal 8 karakter!",
      });
    }

    await connectToDatabase();

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return Response.json({
        success: false,
        message: "Username atau email sudah digunakan",
      });
    }

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(password, saltRound);


    const userCount = await usersCollection.countDocuments();
    const customId = `user${String(userCount + 1).padStart(3, '0')}`;


    const newUser = {
      _id: customId,
      username,
      email,
      password: hashedPassword,
      displayName,
      avatar: null,
      isOnline: false,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return Response.json(
      {
        success: true,
        message: "Akun berhasil dibuat! Selamat bergabung! 🎉",
        userId: customId,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "ada yg eror",
        error: error.message,
      },
      { status: 400 }
    );
  }
}
