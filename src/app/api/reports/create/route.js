import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import User from "@/models/User";
import { checkUserModeration, createModerationErrorResponse } from "@/lib/moderation-middleware";

export async function POST(request) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Check if reporter is banned/suspended
        const moderationCheck = await checkUserModeration(userId);
        if (!moderationCheck.allowed) {
            return createModerationErrorResponse(moderationCheck);
        }

        // Parse request body
        const { reportedUserId, category, reason, evidence } = await request.json();

        // Validate required fields
        if (!reportedUserId || !category || !reason) {
            return Response.json(
                { error: "Missing required fields: reportedUserId, category, reason" },
                { status: 400 }
            );
        }

        // Validate category
        const validCategories = ["harassment", "spam", "inappropriate_content", "impersonation", "other"];
        if (!validCategories.includes(category)) {
            return Response.json(
                { error: "Invalid category" },
                { status: 400 }
            );
        }

        // Cannot report yourself
        if (reportedUserId === userId) {
            return Response.json(
                { error: "You cannot report yourself" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if reported user exists
        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) {
            return Response.json(
                { error: "Reported user not found" },
                { status: 404 }
            );
        }

        // Check if user already has a pending report against this user
        const existingPendingReport = await Report.findOne({
            reporterId: userId,
            reportedUserId: reportedUserId,
            status: { $in: ["pending", "under_review"] },
        });

        if (existingPendingReport) {
            return Response.json(
                { error: "You already have a pending report against this user" },
                { status: 409 }
            );
        }

        // Generate report ID
        const lastReport = await Report.findOne().sort({ _id: -1 }).select("_id");
        let reportNumber = 1;

        if (lastReport?._id) {
            const match = lastReport._id.match(/report(\d+)/);
            if (match) {
                reportNumber = parseInt(match[1]) + 1;
            }
        }

        const reportId = `report${reportNumber.toString().padStart(6, "0")}`;

        // Create report
        const report = new Report({
            _id: reportId,
            reporterId: userId,
            reportedUserId,
            category,
            reason,
            evidence: evidence || [],
            status: "pending",
        });

        await report.save();

        // Populate user data for response
        await report.populate([
            { path: "reporterId", select: "username displayName avatar" },
            { path: "reportedUserId", select: "username displayName avatar" },
        ]);

        return Response.json(
            {
                success: true,
                message: "Report submitted successfully",
                report: report,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating report:", error);
        return Response.json(
            { error: "Failed to create report" },
            { status: 500 }
        );
    }
}
