import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function GET(request) {
    try {
        // 1. Cek token kayak biasa
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return Response.json({
                success: false,
                message: "Login dulu untuk lihat daftar teman"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;

        // 2. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const friendsCollection = db.collection("friendships");
        const usersCollection = db.collection("users");

        // 3. Ambil semua data friendship yang melibatkan user ini
        const friendships = await friendsCollection.find({
            $or: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ]
        }).toArray();

        // 4. Pisahkan berdasarkan kategori
        const acceptedFriends = [];
        const pendingReceived = [];  // Permintaan masuk (yang perlu dijawab)
        const pendingSent = [];      // Permintaan keluar (yang dikirim)

        for (const friendship of friendships) {
            // Tentuin siapa teman/pengirimnya
            const friendId = friendship.senderId === currentUserId
                ? friendship.receiverId
                : friendship.senderId;

            // Ambil data lengkap teman
            const friendData = await usersCollection.findOne({ _id: friendId });

            const friendInfo = {
                friendshipId: friendship._id,
                userId: friendData._id,
                username: friendData.username,
                displayName: friendData.displayName,
                avatar: friendData.avatar,
                isOnline: friendData.isOnline,
                createdAt: friendship.createdAt
            };

            // Kategorikan berdasarkan status dan posisi
            if (friendship.status === "accepted") {
                acceptedFriends.push(friendInfo);
            } else if (friendship.status === "pending") {
                if (friendship.receiverId === currentUserId) {
                    // Kamu yang menerima permintaan
                    pendingReceived.push(friendInfo);
                } else {
                    // Kamu yang kirim permintaan
                    pendingSent.push(friendInfo);
                }
            }
        }

        return Response.json({
            success: true,
            data: {
                friends: acceptedFriends,           // Teman yang udah jadi
                pendingReceived: pendingReceived,   // Perlu dijawab
                pendingSent: pendingSent            // Menunggu jawaban
            },
            counts: {
                totalFriends: acceptedFriends.length,
                pendingReceived: pendingReceived.length,
                pendingSent: pendingSent.length
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Ada error waktu ambil daftar teman",
            error: error.message
        }, { status: 500 });
    }
}