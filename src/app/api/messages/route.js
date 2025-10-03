import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function POST(request) {
    try {
        // 1. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

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

        // Cek apakah user adalah member dari room ini
        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu bukan member room ini"
            }, { status: 403 });
        }

        // 5. Buat message ID
        const messageCount = await messagesCollection.countDocuments();
        const messageId = `msg${String(messageCount + 1).padStart(6, '0')}`;

        // 6. Simpan pesan ke database
        const newMessage = {
            _id: messageId,
            roomId: roomId,
            senderId: currentUserId,
            message: message,
            messageType: messageType,
            timestamp: new Date(),
            isEdited: false,
            isDeleted: false
        };

        await messagesCollection.insertOne(newMessage);

        // 7. Update last activity dan last message di room
        await roomsCollection.updateOne(
            { _id: roomId },
            {
                $set: {
                    lastMessage: message.substring(0, 50), // Ambil 50 karakter pertama
                    lastActivity: new Date()
                }
            }
        );

        return Response.json({
            success: true,
            message: "Pesan berhasil dikirim!",
            data: {
                messageId: messageId,
                timestamp: newMessage.timestamp
            }
        }, { status: 201 });

    } catch (error) {
        console.error("❌ ERROR SAVE MESSAGE:", error);
        return Response.json({
            success: false,
            message: "Error waktu simpan pesan",
            error: error.message
        }, { status: 500 });
    }
}
