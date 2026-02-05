import { auth } from "@/auth";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

// POST /api/users/status - Update user online/offline status
export async function POST(request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const body = await request.json();
        const { isOnline } = body;

        if (typeof isOnline !== "boolean") {
            return Response.json(
                { success: false, message: "Invalid status value" },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");

        // Update user online status
        await usersCollection.updateOne(
            { _id: userId },
            {
                $set: {
                    isOnline: isOnline,
                    lastSeen: new Date()
                }
            }
        );

        console.log(`[STATUS] User ${userId} is now ${isOnline ? 'online' : 'offline'}`);

        return Response.json({
            success: true,
            isOnline: isOnline
        });

    } catch (error) {
        console.error("Error updating user status:", error);
        return Response.json(
            { success: false, message: "Error updating status" },
            { status: 500 }
        );
    }
}
