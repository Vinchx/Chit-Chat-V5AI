import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { isAdmin } from "@/lib/admin-config";



export async function POST(request, { params }) {
    try {
        const session = await auth();

        // Check authentication
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check admin access
        if (!isAdmin(session.user.email)) {
            return NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        const { userId } = params;
        const { reason } = await request.json();

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Cannot ban admin
        if (isAdmin(user.email)) {
            return NextResponse.json(
                { error: "Cannot ban admin users" },
                { status: 403 }
            );
        }

        // Update user
        user.isBanned = true;
        user.bannedAt = new Date();
        user.bannedReason = reason || "Account permanently banned";
        // Clear suspension if any
        user.suspendedUntil = null;
        user.suspensionReason = null;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "User banned successfully",
            user: {
                _id: user._id,
                username: user.username,
                isBanned: user.isBanned,
                bannedAt: user.bannedAt,
                bannedReason: user.bannedReason,
            },
        });
    } catch (error) {
        console.error("[Admin Ban User] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
