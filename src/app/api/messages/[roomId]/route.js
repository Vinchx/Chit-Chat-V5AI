import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function GET(request, { params }) {
    try {
        // 1. Ambil roomId dari URL
        const { roomId } = await params;

        // 2. Cek token user
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return Response.json({
                success: false,
                message: "Login dulu untuk baca pesan"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;

        // 3. Ambil parameter query - sistem WhatsApp style
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 30; // Default 30 pesan kayak WA
        const before = url.searchParams.get('before'); // Timestamp untuk load pesan lebih lama

        // 4. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const messagesCollection = db.collection("messages");
        const usersCollection = db.collection("users");

        // 5. Cek akses user ke room
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

        // 6. Setup query - sistem WhatsApp
        let query = { roomId: roomId };

        // Kalau ada parameter 'before', ambil pesan sebelum timestamp tersebut
        if (before) {
            query.timestamp = { $lt: new Date(before) };
        }

        // 7. Ambil pesan, urutkan dari yang terbaru ke lama
        const messages = await messagesCollection
            .find(query)
            .sort({ timestamp: -1 }) // Terbaru dulu
            .limit(limit + 1) // Ambil 1 lebih buat cek ada lagi atau nggak
            .toArray();

        // 8. Cek apakah masih ada pesan yang lebih lama
        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop(); // Buang pesan extra
        }

        // 9. Balik urutan jadi yang lama di atas (normal chat display)
        messages.reverse();

        // 10. Tambahkan data sender untuk setiap pesan
        const messagesWithSender = [];

        for (const message of messages) {
            const sender = await usersCollection.findOne({ _id: message.senderId });

            messagesWithSender.push({
                id: message._id,
                message: message.message,
                messageType: message.messageType,
                timestamp: message.timestamp,
                isAI: message.isAI,
                sender: {
                    userId: sender._id,
                    username: sender.username,
                    displayName: sender.displayName,
                    avatar: sender.avatar
                },
                isOwn: message.senderId === currentUserId
            });
        }

        // 11. Response WhatsApp style - sederhana dan jelas
        return Response.json({
            success: true,
            data: {
                roomId: roomId,
                messages: messagesWithSender,
                hasMore: hasMore, // Masih ada pesan lebih lama atau nggak
                oldestTimestamp: messages.length > 0 ? messages[0].timestamp : null
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error waktu ambil pesan",
            error: error.message
        }, { status: 500 });
    }
}       