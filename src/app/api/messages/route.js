import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function POST(request) {
    try {
        // 1. Cek siapa yang mau kirim pesan
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return Response.json({
                success: false,
                message: "Login dulu sebelum kirim pesan"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;

        // 2. Ambil data pesan yang mau dikirim
        const { roomId, message, messageType = "text" } = await request.json();
        console.log("📝 DATA RECEIVED:", { roomId, message, messageType, currentUserId });

        if (!roomId || !message) {
            return Response.json({
                success: false,
                message: "Room ID dan pesan harus diisi"
            }, { status: 400 });
        }

        // 3. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const messagesCollection = db.collection("messages");

        // 4. Cek apakah room ada dan user punya akses
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

        // 5. Bikin message baru dengan ID unik
        const messageCount = await messagesCollection.countDocuments();
        let messageId;
        let attempts = 0;

        // Cari ID yang belum dipakai
        do {
            const idNumber = messageCount + 1 + attempts;
            messageId = `msg${String(idNumber).padStart(3, "0")}`;
            const existingMessage = await messagesCollection.findOne({ _id: messageId });
            if (!existingMessage) break;
            attempts++;
        } while (attempts < 1000); // Maksimal 1000 attempts

        const newMessage = {
            _id: messageId,
            roomId: roomId,
            senderId: currentUserId,
            message: message,
            messageType: messageType,
            isAI: false,
            timestamp: new Date()
        };

        await messagesCollection.insertOne(newMessage);

        // 6. Update room dengan pesan terakhir
        await roomsCollection.updateOne(
            { _id: roomId },
            {
                $set: {
                    lastMessage: message,
                    lastActivity: new Date()
                }
            }
        );

        return Response.json({
            success: true,
            message: "Pesan berhasil dikirim!",
            data: {
                messageId: messageId,
                roomId: roomId,
                message: message,
                timestamp: newMessage.timestamp
            }
        });

    } catch (error) {
        console.log("❌ ERROR di API messages:", error);
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        return Response.json({
            success: false,
            message: "Error waktu kirim pesan",
            error: error.message
        }, { status: 500 });
    }
}