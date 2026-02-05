import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/admin-config";

// GET /api/admin/rooms - Get all rooms (active or deleted)
export async function GET(request) {
    try {
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

        // Get status parameter (active or deleted)
        const url = new URL(request.url);
        const status = url.searchParams.get("status") || "active";

        const roomsCollection = db.collection("rooms");

        let query = {};
        if (status === "deleted") {
            query = { isDeleted: true };
        } else {
            query = { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };
        }

        const rooms = await roomsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        return Response.json({
            success: true,
            rooms: rooms,
            count: rooms.length
        });

    } catch (error) {
        console.error("Error fetching rooms:", error);
        return Response.json({
            success: false,
            message: "Error fetching rooms",
            error: error.message
        }, { status: 500 });
    }
}
