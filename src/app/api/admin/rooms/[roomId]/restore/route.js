import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/admin-config";

// POST /api/admin/rooms/[roomId]/restore - Restore deleted room
export async function POST(request, { params }) {
    try {
        const awaitedParams = await params;
        const { roomId } = awaitedParams;

        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        // Check if user is admin using email whitelist
        await connectToDatabase();
        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");

        const currentUser = await usersCollection.findOne({ _id: userId });
        if (!currentUser || !isAdmin(currentUser.email)) {
            return Response.json({
                success: false,
                message: "Unauthorized - Admin only"
            }, { status: 403 });
        }

        const roomsCollection = db.collection("rooms");

        // Check if room exists and is deleted
        const room = await roomsCollection.findOne({ _id: roomId });
        if (!room) {
            return Response.json({
                success: false,
                message: "Room not found"
            }, { status: 404 });
        }

        if (!room.isDeleted) {
            return Response.json({
                success: false,
                message: "Room is not deleted"
            }, { status: 400 });
        }

        // Restore room by removing soft delete fields
        await roomsCollection.updateOne(
            { _id: roomId },
            {
                $set: {
                    isDeleted: false,
                    isActive: true
                },
                $unset: {
                    deletedAt: "",
                    deletedBy: ""
                }
            }
        );

        console.log(`[ADMIN] Room ${roomId} restored by admin ${userId}`);

        return Response.json({
            success: true,
            message: "Room successfully restored"
        });

    } catch (error) {
        console.error("Error restoring room:", error);
        return Response.json({
            success: false,
            message: "Error restoring room",
            error: error.message
        }, { status: 500 });
    }
}
