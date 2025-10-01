import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function GET(request) {
    try {
        // 1. Cek token dulu
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return Response.json({
                success: false,
                message: "Login dulu ya buat liat permintaan"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;

        // 2. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const friendsCollection = db.collection("friendships");
        const usersCollection = db.collection("users");

        // 3. Cari semua permintaan yang masuk ke user ini (status pending)
        const friendshipRequests = await friendsCollection.find({
            receiverId: currentUserId,  // Yang nerima = user yang login
            status: "pending"           // Cuma yang belum dijawab
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