import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/admin-config";

// DELETE /api/admin/rooms/[roomId]/permanent - Permanently delete room
export async function DELETE(request, { params }) {
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
        const messagesCollection = db.collection("messages");

        // Check if room exists
        const room = await roomsCollection.findOne({ _id: roomId });
        if (!room) {
            return Response.json({
                success: false,
                message: "Room not found"
            }, { status: 404 });
        }

        // Delete all messages in this room
        const messagesResult = await messagesCollection.deleteMany({ roomId: roomId });

        // Permanently delete the room
        await roomsCollection.deleteOne({ _id: roomId });

        console.log(`[ADMIN] Room ${roomId} permanently deleted by admin ${userId}`);
        console.log(`[ADMIN] Deleted ${messagesResult.deletedCount} messages`);

        return Response.json({
            success: true,
            message: "Room and messages permanently deleted",
            deletedMessages: messagesResult.deletedCount
        });

    } catch (error) {
        console.error("Error permanently deleting room:", error);
        return Response.json({
            success: false,
            message: "Error deleting room",
            error: error.message
        }, { status: 500 });
    }
}
