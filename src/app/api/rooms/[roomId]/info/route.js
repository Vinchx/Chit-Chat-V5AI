// src/app/api/rooms/[roomId]/info/route.js
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

// Update group info (name, description, avatar)
export async function PATCH(request, { params }) {
    try {
        const { session, userId, error } = await getAuthSessionOrApiKey(request);
        if (error) return error;

        const awaitedParams = await params;
        const { roomId } = awaitedParams;
        const { name, description, groupAvatar } = await request.json();

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

        // Check if group room
        if (room.type !== "group") {
            return Response.json({
                success: false,
                message: "Hanya group room yang bisa diupdate"
            }, { status: 400 });
        }

        // Check if user is admin
        if (!room.admins || !room.admins.includes(userId)) {
            return Response.json({
                success: false,
                message: "Hanya admin yang bisa mengupdate info grup"
            }, { status: 403 });
        }

        // Prepare update object
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (groupAvatar !== undefined) updateData.groupAvatar = groupAvatar;

        if (Object.keys(updateData).length === 0) {
            return Response.json({
                success: false,
                message: "Tidak ada data yang diupdate"
            }, { status: 400 });
        }

        // Update room
        await roomsCollection.updateOne(
            { _id: roomId },
            { $set: updateData }
        );

        return Response.json({
            success: true,
            message: "Info grup berhasil diupdate",
            data: updateData
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error mengupdate info grup",
            error: error.message
        }, { status: 500 });
    }
}
