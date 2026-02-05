import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin-config";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import User from "@/models/User";


export async function PATCH(request, context) {
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
        const { status, reviewNote, actionTaken, suspendDays, banReason } = await request.json();

        console.log("[Admin Review Report] Report ID:", id);
        console.log("[Admin Review Report] Action:", actionTaken);

        // Validate status
        if (status && !["pending", "under_review", "resolved", "rejected"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Validate actionTaken
        if (actionTaken && !["none", "warning", "suspend", "ban"].includes(actionTaken)) {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        // Get report
        const report = await Report.findById(id);
        if (!report) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        // Update report
        if (status) report.status = status;
        if (reviewNote !== undefined) report.reviewNote = reviewNote;
        if (actionTaken !== undefined) report.actionTaken = actionTaken;
        report.reviewedBy = session.user.id;
        report.reviewedAt = new Date();

        // Take action on reported user if needed
        if (actionTaken && actionTaken !== "none") {
            const reportedUser = await User.findById(report.reportedUserId);

            if (!reportedUser) {
                return NextResponse.json(
                    { error: "Reported user not found" },
                    { status: 404 }
                );
            }

            switch (actionTaken) {
                case "warning":
                    reportedUser.warningCount = (reportedUser.warningCount || 0) + 1;
                    break;

                case "suspend":
                    if (!suspendDays || suspendDays < 1) {
                        return NextResponse.json(
                            { error: "suspendDays is required for suspension" },
                            { status: 400 }
                        );
                    }
                    const suspendUntil = new Date();
                    suspendUntil.setDate(suspendUntil.getDate() + parseInt(suspendDays));
                    reportedUser.suspendedUntil = suspendUntil;
                    reportedUser.suspensionReason = reviewNote || "Violation of community guidelines";
                    break;

                case "ban":
                    reportedUser.isBanned = true;
                    reportedUser.bannedAt = new Date();
                    reportedUser.bannedReason = banReason || reviewNote || "Permanent ban due to repeated violations";
                    break;
            }

            await reportedUser.save();
        }

        await report.save();

        // Populate for response
        await report.populate([
            { path: "reporterId", select: "username displayName avatar" },
            { path: "reportedUserId", select: "username displayName avatar warningCount isBanned suspendedUntil" },
            { path: "reviewedBy", select: "username displayName email" },
        ]);

        return NextResponse.json({
            success: true,
            message: "Report reviewed successfully",
            report,
        });
    } catch (error) {
        console.error("[Admin Review Report] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
