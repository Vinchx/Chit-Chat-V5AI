import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function GET(request) {
    try {
        // Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

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
                { isDeleted: { $ne: true } }, // Exclude soft-deleted users
                {
                    $or: [
                        { username: { $regex: searchQuery, $options: "i" } },
                        { displayName: { $regex: searchQuery, $options: "i" } }
                    ]
                }
            ]
        }).limit(20).toArray(); // Cuma ambil 10 hasil teratas

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
