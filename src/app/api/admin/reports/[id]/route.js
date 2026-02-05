import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin-config";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";

export async function GET(request, context) {
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

        // Next.js 15+ requires await params
        const params = await context.params;
        const { id } = params;

        console.log("[Admin Report Detail] Looking for report ID:", id);

        // Get report detail
        const report = await Report.findById(id)
            .populate("reporterId", "username displayName avatar email createdAt")
            .populate("reportedUserId", "username displayName avatar email warningCount isBanned bannedReason suspendedUntil suspensionReason createdAt")
            .populate("reviewedBy", "username displayName email");

        console.log("[Admin Report Detail] Report found:", report ? "YES" : "NO");

        if (!report) {
            // Debug: Check if report exists with different query
            const allReports = await Report.find().limit(5).select("_id");
            console.log("[Admin Report Detail] Sample report IDs in DB:", allReports.map(r => r._id));

            return NextResponse.json(
                {
                    error: "Report not found",
                    requestedId: id,
                    debug: {
                        sampleIds: allReports.map(r => r._id),
                        message: "Report with this ID does not exist"
                    }
                },
                { status: 404 }
            );
        }

        // Get report history for the reported user
        const reportHistory = await Report.find({
            reportedUserId: report.reportedUserId._id,
            _id: { $ne: id }, // Exclude current report
        })
            .populate("reporterId", "username displayName")
            .sort({ createdAt: -1 })
            .limit(10);

        // Count reports by status for this user
        const reportStats = await Report.aggregate([
            { $match: { reportedUserId: report.reportedUserId._id } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        return NextResponse.json({
            success: true,
            report,
            history: {
                reports: reportHistory,
                stats: {
                    total: reportHistory.length,
                    resolved: reportStats.find((s) => s._id === "resolved")?.count || 0,
                    rejected: reportStats.find((s) => s._id === "rejected")?.count || 0,
                    pending: reportStats.find((s) => s._id === "pending")?.count || 0,
                },
            },
        });
    } catch (error) {
        console.error("[Admin Report Detail] Error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error.message
            },
            { status: 500 }
        );
    }
}
