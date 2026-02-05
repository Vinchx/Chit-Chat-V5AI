import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin-config";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

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

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Clear suspension
        user.suspendedUntil = null;
        user.suspensionReason = null;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "User unsuspended successfully",
            user: {
                _id: user._id,
                username: user.username,
                suspendedUntil: user.suspendedUntil,
            },
        });
    } catch (error) {
        console.error("[Admin Unsuspend User] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
