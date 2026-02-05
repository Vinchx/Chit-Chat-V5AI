// src/app/api/rooms/[roomId]/leave/route.js
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import Room from "@/models/Room";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

// Leave group
export async function POST(request, { params }) {
    try {
        const { session, userId, error } = await getAuthSessionOrApiKey(request);
        if (error) return error;

        const awaitedParams = await params;
        const { roomId } = awaitedParams;

        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");

        // Get room
        const room = await roomsCollection.findOne({ _id: roomId });
        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        // Check if user is member
        if (!room.members.includes(userId)) {
            return Response.json({
                success: false,
                message: "Anda bukan member grup ini"
            }, { status: 400 });
        }

        // Check if user is last admin
        if (room.admins && room.admins.includes(userId) && room.admins.length === 1 && room.members.length > 1) {
            return Response.json({
                success: false,
                message: "Anda adalah admin terakhir. Promosikan member lain menjadi admin terlebih dahulu atau hapus semua member"
            }, { status: 400 });
        }

        // Remove user from members and admins
        await roomsCollection.updateOne(
            { _id: roomId },
            {
                $pull: {
                    members: userId,
                    admins: userId
                }
            }
        );

        // If no members left, soft delete the room
        const updatedRoom = await roomsCollection.findOne({ _id: roomId });
        if (updatedRoom && updatedRoom.members.length === 0) {
            // Soft delete menggunakan model method
            await Room.softDeleteById(roomId, userId);

            return Response.json({
                success: true,
                message: "Anda berhasil keluar dari grup. Grup telah diarsipkan karena tidak ada member"
            });
        }

        return Response.json({
            success: true,
            message: "Anda berhasil keluar dari grup"
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error keluar dari grup",
            error: error.message
        }, { status: 500 });
    }
}
