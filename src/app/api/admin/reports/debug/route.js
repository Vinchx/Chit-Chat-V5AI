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

        // Get all reports with details
        const reports = await Report.find()
            .populate("reporterId", "username displayName email")
            .populate("reportedUserId", "username displayName email")
            .sort({ createdAt: -1 })
            .limit(10);

        // Get some debug info
        const totalReports = await Report.countDocuments();
        const reportIds = await Report.find().select("_id").limit(20);

        return NextResponse.json({
            success: true,
            totalReports,
            reportCount: reports.length,
            reportIds: reportIds.map(r => r._id),
            reports: reports,
            debug: {
                message: "This endpoint shows all reports in the database for debugging",
                timestamp: new Date().toISOString(),
            }
        });
    } catch (error) {
        console.error("[Admin Reports Debug] Error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
