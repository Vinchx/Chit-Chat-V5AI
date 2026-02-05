import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin-config";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";

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
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const statusFilter = searchParams.get("status"); // all, pending, under_review, resolved, rejected

        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (statusFilter && statusFilter !== "all") {
            query.status = statusFilter;
        }

        // Get reports with pagination
        const [reports, total, stats] = await Promise.all([
            Report.find(query)
                .populate("reporterId", "username displayName avatar email")
                .populate("reportedUserId", "username displayName avatar email warningCount isBanned suspendedUntil")
                .populate("reviewedBy", "username displayName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Report.countDocuments(query),
            // Get stats
            Report.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // Format stats
        const formattedStats = {
            total: total,
            pending: stats.find((s) => s._id === "pending")?.count || 0,
            under_review: stats.find((s) => s._id === "under_review")?.count || 0,
            resolved: stats.find((s) => s._id === "resolved")?.count || 0,
            rejected: stats.find((s) => s._id === "rejected")?.count || 0,
        };

        return NextResponse.json({
            success: true,
            reports,
            stats: formattedStats,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("[Admin Reports List] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
