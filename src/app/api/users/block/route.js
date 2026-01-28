import { NextResponse } from "next/server";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import connectDB from "@/lib/mongodb";
import BlockedUser from "@/models/BlockedUser";
import User from "@/models/User";
import Friendship from "@/models/Friendship";
import { nanoid } from "nanoid";

// POST /api/users/block - Block a user
export async function POST(req) {
    try {
        const { session, userId: currentUserId, error } = await getAuthSessionOrApiKey(req);
        if (error) {
            return error;
        }

        await connectDB();

        const body = await req.json();
        const { userId, type = "block" } = body;

        // Validation
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId is required" },
                { status: 400 },
            );
        }

        // Prevent self-block
        if (userId === currentUserId) {
            return NextResponse.json(
                { success: false, message: "Tidak bisa block diri sendiri" },
                { status: 400 },
            );
        }

        // Check if user exists
        const userToBlock = await User.findById(userId);
        if (!userToBlock) {
            return NextResponse.json(
                { success: false, message: "User tidak ditemukan" },
                { status: 404 },
            );
        }

        // Check if already blocked
        const existingBlock = await BlockedUser.findOne({
            blockerId: currentUserId,
            blockedUserId: userId,
        });

        if (existingBlock) {
            return NextResponse.json(
                { success: false, message: "User sudah diblokir" },
                { status: 409 },
            );
        }

        // Create block record
        const blockRecord = await BlockedUser.create({
            _id: nanoid(),
            blockerId: currentUserId,
            blockedUserId: userId,
            type: type,
        });

        // Auto-reject pending friend requests
        await Friendship.updateMany(
            {
                $or: [
                    { senderId: userId, receiverId: currentUserId, status: "pending" },
                    { senderId: currentUserId, receiverId: userId, status: "pending" },
                ],
            },
            { status: "rejected" },
        );

        return NextResponse.json({
            success: true,
            message: type === "block" ? "User berhasil diblokir" : "User berhasil dimute",
            data: {
                blockId: blockRecord._id,
                blockedUser: {
                    userId: userToBlock._id,
                    username: userToBlock.username,
                    displayName: userToBlock.displayName,
                    avatar: userToBlock.avatar,
                },
            },
        });
    } catch (error) {
        console.error("Error blocking user:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}

// DELETE /api/users/block?userId={userId} - Unblock a user
export async function DELETE(req) {
    try {
        const { session, userId, error } = await getAuthSessionOrApiKey(req);
        if (error) {
            return error;
        }

        const currentUserId = userId;

        await connectDB();

        const { searchParams } = new URL(req.url);
        const userIdParam = searchParams.get("userId");

        if (!userIdParam) {
            return NextResponse.json(
                { success: false, message: "userId is required" },
                { status: 400 },
            );
        }

        // Find and delete block record
        const deleteResult = await BlockedUser.findOneAndDelete({
            blockerId: currentUserId,
            blockedUserId: userIdParam,
        });

        if (!deleteResult) {
            return NextResponse.json(
                { success: false, message: "Block record tidak ditemukan" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            message: deleteResult.type === "block" ? "User berhasil di-unblock" : "User berhasil di-unmute",
        });
    } catch (error) {
        console.error("Error unblocking user:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}

// GET /api/users/block - Get list of blocked/muted users
export async function GET(req) {
    try {
        const { session, userId, error } = await getAuthSessionOrApiKey(req);
        if (error) {
            return error;
        }

        const currentUserId = userId;

        await connectDB();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // optional filter: 'block' or 'mute'

        // Build query
        const query = { blockerId: currentUserId };
        if (type) {
            query.type = type;
        }

        // Get blocked users with user details
        const blockedRecords = await BlockedUser.find(query)
            .sort({ blockedAt: -1 })
            .lean();

        // Fetch user details
        const blockedUsersWithDetails = await Promise.all(
            blockedRecords.map(async (record) => {
                const user = await User.findById(record.blockedUserId).select(
                    "_id username displayName avatar",
                );

                return {
                    blockId: record._id,
                    userId: user?._id || record.blockedUserId,
                    username: user?.username || "Unknown",
                    displayName: user?.displayName || "Unknown User",
                    avatar: user?.avatar || null,
                    type: record.type,
                    blockedAt: record.blockedAt,
                };
            }),
        );

        return NextResponse.json({
            success: true,
            data: {
                blockedUsers: blockedUsersWithDetails,
                count: blockedUsersWithDetails.length,
            },
        });
    } catch (error) {
        console.error("Error fetching blocked users:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
