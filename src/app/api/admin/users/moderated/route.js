import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin-config";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
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

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "suspended"; // suspended or banned

        let query = {};
        if (type === "suspended") {
            // Users who are currently suspended (suspendedUntil > now)
            query.suspendedUntil = { $gt: new Date() };
        } else if (type === "banned") {
            query.isBanned = true;
        }

        const users = await User.find(query)
            .select("username displayName email avatar isBanned bannedAt bannedReason suspendedUntil suspensionReason warningCount createdAt")
            .sort({ suspendedUntil: -1, bannedAt: -1 })
            .limit(100);

        return NextResponse.json({
            success: true,
            users,
            count: users.length,
        });
    } catch (error) {
        console.error("[Admin Moderated Users] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
