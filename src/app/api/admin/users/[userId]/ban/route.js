import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/admin-config";

// POST /api/admin/users/[userId]/ban - Ban or unban user
export async function POST(request, { params }) {
    try {
        const awaitedParams = await params;
        const { userId } = awaitedParams;

        const { session, userId: adminId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        // Check if user is admin using email whitelist
        await connectToDatabase();
        const db = mongoose.connection.db;
        const usersCollection = db.collection("users");

        const currentUser = await usersCollection.findOne({ _id: adminId });
        if (!currentUser || !isAdmin(currentUser.email)) {
            return Response.json({
                success: false,
                message: "Unauthorized - Admin only"
            }, { status: 403 });
        }

        // Get request body
        const body = await request.json();
        const { isBanned } = body;

        // Check if target user exists
        const targetUser = await usersCollection.findOne({ _id: userId });
        if (!targetUser) {
            return Response.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        // Cannot ban yourself
        if (userId === adminId) {
            return Response.json({
                success: false,
                message: "Cannot ban yourself"
            }, { status: 400 });
        }

        // Cannot ban another admin
        if (isAdmin(targetUser.email)) {
            return Response.json({
                success: false,
                message: "Cannot ban another admin"
            }, { status: 400 });
        }

        // Update ban status
        await usersCollection.updateOne(
            { _id: userId },
            {
                $set: {
                    isBanned: isBanned,
                    bannedAt: isBanned ? new Date() : null,
                    bannedBy: isBanned ? adminId : null
                }
            }
        );

        console.log(`[ADMIN] User ${userId} ${isBanned ? 'banned' : 'unbanned'} by admin ${adminId}`);

        return Response.json({
            success: true,
            message: `User successfully ${isBanned ? 'banned' : 'unbanned'}`
        });

    } catch (error) {
        console.error("Error banning/unbanning user:", error);
        return Response.json({
            success: false,
            message: "Error updating user ban status",
            error: error.message
        }, { status: 500 });
    }
}
