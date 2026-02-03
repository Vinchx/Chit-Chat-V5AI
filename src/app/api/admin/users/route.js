import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/admin-config";

// GET /api/admin/users - Get all users
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

        // Get all users (include soft-deleted for admin view)
        const users = await usersCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return Response.json({
            success: true,
            users: users,
            count: users.length
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json({
            success: false,
            message: "Error fetching users",
            error: error.message
        }, { status: 500 });
    }
}
