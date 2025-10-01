import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function POST(request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", ""); // Tambah spasi
        if (!token) {
            return Response.json({
                success: false,
                message: "token nggak ada, login dulu lee"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;
        const { identifier } = await request.json();

        if (!identifier) {
            return Response.json({
                success: false,
                message: "Kasih tau username atau email teman yang dicari!"
            }, { status: 400 });
        }

        await connectToDatabase();
        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");
        const friendsCollection = db.collection("friendships");

        const targetUser = await usersCollection.findOne({
            $or: [{ username: identifier }, { email: identifier }] // Perbaiki typo "emai"
        });

        if (!targetUser) {
            return Response.json({
                success: false,
                message: "User nggak ditemukan. Coba cek lagi username/email-nya"
            }, { status: 404 });
        }

        if (targetUser._id === currentUserId) {
            return Response.json({
                success: false,
                message: "Nggak bisa berteman sama diri sendiri dong 😅",
            }, { status: 400 });
        }

        const existingFriendship = await friendsCollection.findOne({
            $or: [
                { senderId: currentUserId, receiverId: targetUser._id },
                { senderId: targetUser._id, receiverId: currentUserId },
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === "accepted") {
                return Response.json({
                    success: false,
                    message: "sama temen sendiri masa lupa"
                }, { status: 400 });
            } else if (existingFriendship.status === "pending") { // Perbaiki kondisi
                return Response.json({
                    success: false,
                    message: "Permintaan pertemanan masih pending, sabar ya!"
                }, { status: 400 });
            }
        }

        const friendshipCount = await friendsCollection.countDocuments();
        const friendshipId = `friend${String(friendshipCount + 1).padStart(3, "0")}`; // Perbaiki nama variabel

        const newFriendship = { // Perbaiki nama variabel
            _id: friendshipId,
            senderId: currentUserId,
            receiverId: targetUser._id,
            status: "pending",
            createdAt: new Date()
        };

        await friendsCollection.insertOne(newFriendship); // Perbaiki nama variabel

        return Response.json({
            success: true,
            message: `Permintaan pertemanan dikirim ke ${targetUser.displayName}!`,
            friendship: {
                id: friendshipId,
                targetUser: {
                    id: targetUser._id,
                    username: targetUser.username,
                    displayName: targetUser.displayName
                }
            }
        });
    } catch (error) {
        return Response.json({
            success: false,
            message: "Ada eror jir",
            error: error.message
        }, { status: 500 });
    }
}