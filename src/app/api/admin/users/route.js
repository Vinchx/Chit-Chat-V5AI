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

        // Get collections for statistics
        const friendshipsCollection = db.collection("friendships");
        const messagesCollection = db.collection("messages");
        const roomsCollection = db.collection("rooms");

        // Calculate statistics for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                try {
                    // Count friends (accepted friendships where user is either sender or receiver)
                    const friendCount = await friendshipsCollection.countDocuments({
                        $or: [
                            { senderId: user._id, status: "accepted" },
                            { receiverId: user._id, status: "accepted" }
                        ]
                    });

                    // Count messages sent by this user
                    const messageCount = await messagesCollection.countDocuments({
                        senderId: user._id
                    });

                    // Count groups (rooms) where user is a member
                    const groupCount = await roomsCollection.countDocuments({
                        members: user._id
                    });

                    return {
                        ...user,
                        friendCount,
                        messageCount,
                        groupCount
                    };
                } catch (error) {
                    console.error(`Error calculating stats for user ${user._id}:`, error);
                    // Return user with 0 counts if error occurs
                    return {
                        ...user,
                        friendCount: 0,
                        messageCount: 0,
                        groupCount: 0
                    };
                }
            })
        );

        return Response.json({
            success: true,
            users: usersWithStats,
            count: usersWithStats.length
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
