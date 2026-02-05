import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import { checkUserModeration, createModerationErrorResponse } from "@/lib/moderation-middleware";

export async function GET(request) {
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

        // Check if user is banned/suspended
        const moderationCheck = await checkUserModeration(userId);
        if (!moderationCheck.allowed) {
            return createModerationErrorResponse(moderationCheck);
        }

        await connectDB();

        // Get query parameters for pagination
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status"); // Optional filter

        const skip = (page - 1) * limit;

        // Build query
        const query = { reporterId: userId };
        if (status && ["pending", "under_review", "resolved", "rejected"].includes(status)) {
            query.status = status;
        }

        // Get reports with pagination
        const [reports, total] = await Promise.all([
            Report.find(query)
                .populate("reportedUserId", "username displayName avatar")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Report.countDocuments(query),
        ]);

        return Response.json(
            {
                success: true,
                reports,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching user reports:", error);
        return Response.json(
            { error: "Failed to fetch reports" },
            { status: 500 }
        );
    }
}
