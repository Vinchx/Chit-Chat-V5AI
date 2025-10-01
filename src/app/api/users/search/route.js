import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function GET(request) {
    try {
        // Cek token user
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return Response.json({
                success: false,
                message: "Login dulu untuk cari user"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;

        // Ambil query pencarian dari URL
        const url = new URL(request.url);
        const searchQuery = url.searchParams.get('q');

        if (!searchQuery) {
            return Response.json({
                success: false,
                message: "Masukkan kata kunci pencarian"
            }, { status: 400 });
        }

        // Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");

        // Cari user berdasarkan username atau displayName
        const users = await usersCollection.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Jangan tampilkan diri sendiri
                {
                    $or: [
                        { username: { $regex: searchQuery, $options: "i" } },
                        { displayName: { $regex: searchQuery, $options: "i" } }
                    ]
                }
            ]
        }).limit(10).toArray(); // Cuma ambil 10 hasil teratas

        // Format hasil pencarian
        const searchResults = users.map(user => ({
            userId: user._id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar
        }));

        return Response.json({
            success: true,
            data: {
                results: searchResults,
                count: searchResults.length
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error saat mencari user",
            error: error.message
        }, { status: 500 });
    }
}