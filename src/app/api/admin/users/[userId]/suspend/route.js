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
        const { days, reason } = await request.json();

        // Validate
        if (!days || days < 1) {
            return NextResponse.json(
                { error: "days is required and must be at least 1" },
                { status: 400 }
            );
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Cannot suspend admin
        if (isAdmin(user.email)) {
            return NextResponse.json(
                { error: "Cannot suspend admin users" },
                { status: 403 }
            );
        }

        // Calculate suspend until date
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + parseInt(days));

        // Update user
        user.suspendedUntil = suspendUntil;
        user.suspensionReason = reason || "Account temporarily suspended";
        await user.save();

        return NextResponse.json({
            success: true,
            message: `User suspended for ${days} day(s)`,
            user: {
                _id: user._id,
                username: user.username,
                suspendedUntil: user.suspendedUntil,
                suspensionReason: user.suspensionReason,
            },
        });
    } catch (error) {
        console.error("[Admin Suspend User] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
