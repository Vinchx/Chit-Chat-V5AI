import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function GET(request) {
    try {
        // 1. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // 2. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const friendsCollection = db.collection("friendships");
        const usersCollection = db.collection("users");

        // 3. Cari semua permintaan yang masuk ke user ini (status pending, exclude soft deleted)
        const friendshipRequests = await friendsCollection.find({
            receiverId: currentUserId,  // Yang nerima = user yang login
            status: "pending",          // Cuma yang belum dijawab
            isDeleted: { $ne: true }    // Exclude soft deleted
        }).toArray();

        // 4. Ambil data lengkap sender (yang kirim permintaan)
        const requestsWithSenderInfo = [];

        for (const friendship of friendshipRequests) {
            const sender = await usersCollection.findOne(
                { _id: friendship.senderId },
                { password: 0 } // Jangan include password
            );

            if (sender) {
                requestsWithSenderInfo.push({
                    id: friendship._id,
                    sender: {
                        id: sender._id,
                        username: sender.username,
                        displayName: sender.displayName,
                        email: sender.email
                    },
                    createdAt: friendship.createdAt,
                    status: friendship.status
                });
            }
        }

        return Response.json({
            success: true,
            message: `Ditemukan ${requestsWithSenderInfo.length} permintaan pertemanan`,
            data: {
                requests: requestsWithSenderInfo
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error ambil permintaan pertemanan",
            error: error.message
        }, { status: 500 });
    }
}