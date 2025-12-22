import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
    try {
        // 1. Ambil roomId dari URL
        const { roomId } = await params;

        // 2. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        if (!roomId) {
            return Response.json({
                success: false,
                message: "Room ID harus diisi"
            }, { status: 400 });
        }

        // 3. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const messagesCollection = db.collection("messages");
        const usersCollection = db.collection("users");

        // 4. Cek akses user ke room
        const room = await roomsCollection.findOne({ _id: roomId });

        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu tidak punya akses ke room ini"
            }, { status: 403 });
        }

        // 5. Build query untuk messages - tampilkan semua pesan termasuk yang dihapus
        let messageQuery = {
            roomId: roomId
        };

        // Ambil parameter query
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 30; // Default 30 pesan kayak WA
        const before = url.searchParams.get('before'); // Timestamp untuk load pesan lebih lama

        // Kalau ada parameter 'before', ambil pesan yang lebih lama
        if (before) {
            messageQuery.timestamp = { $lt: new Date(before) };
        }

        // 6. Ambil pesan dari database
        const messages = await messagesCollection
            .find(messageQuery)
            .sort({ timestamp: -1 }) // Urutkan dari terbaru
            .limit(limit)
            .toArray();

        // 7. Balik urutan biar dari lama ke baru
        messages.reverse();

        // 8. Ambil data sender untuk setiap pesan
        const messagesWithSender = await Promise.all(
            messages.map(async (msg) => {
                const sender = await usersCollection.findOne({ _id: msg.senderId });

                return {
                    id: msg._id,
                    message: msg.message,
                    messageType: msg.messageType,
                    timestamp: msg.timestamp,
                    sender: {
                        id: sender._id,
                        username: sender.username,
                        displayName: sender.displayName,
                        avatar: sender.avatar
                    },
                    isOwn: msg.senderId === currentUserId,
                    isEdited: msg.isEdited || false,
                    isDeleted: msg.isDeleted || false
                };
            })
        );

        return Response.json({
            success: true,
            data: {
                roomId: roomId,
                messages: messagesWithSender,
                hasMore: messages.length === limit, // Kalau jumlah pesan = limit, berarti mungkin masih ada lagi
                oldestTimestamp: messages.length > 0 ? messages[0].timestamp : null
            }
        });

    } catch (error) {
        console.error("Error loading messages:", error);
        return Response.json({
            success: false,
            message: "Error waktu load pesan",
            error: error.message
        }, { status: 500 });
    }
}