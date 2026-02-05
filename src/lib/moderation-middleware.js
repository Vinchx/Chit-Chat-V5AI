import connectDB from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Check if a user is currently banned or suspended
 * @param {string} userId - The user ID to check
 * @returns {Object} { allowed: boolean, reason?: string, until?: Date }
 */
export async function checkUserModeration(userId) {
    try {
        await connectDB();

        const user = await User.findById(userId).select(
            "isBanned bannedAt bannedReason suspendedUntil suspensionReason"
        );

        if (!user) {
            return {
                allowed: false,
                reason: "User not found",
            };
        }

        // Check if user is permanently banned
        if (user.isBanned) {
            return {
                allowed: false,
                reason: user.bannedReason || "Your account has been permanently banned",
                bannedAt: user.bannedAt,
            };
        }

        // Check if user is currently suspended
        if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
            return {
                allowed: false,
                reason: user.suspensionReason || "Your account is temporarily suspended",
                until: user.suspendedUntil,
            };
        }

        // User is allowed
        return {
            allowed: true,
        };
    } catch (error) {
        console.error("Error checking user moderation:", error);
        return {
            allowed: false,
            reason: "Failed to verify account status",
        };
    }
}

/**
 * Generate error response for moderated users
 * @param {Object} moderationCheck - Result from checkUserModeration
 * @returns {Response} Next.js Response object
 */
export function createModerationErrorResponse(moderationCheck) {
    if (moderationCheck.until) {
        const untilDate = new Date(moderationCheck.until).toLocaleString("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
        });

        return Response.json(
            {
                error: moderationCheck.reason,
                suspendedUntil: moderationCheck.until,
                message: `Your account is suspended until ${untilDate}`,
            },
            { status: 403 }
        );
    }

    if (moderationCheck.bannedAt) {
        return Response.json(
            {
                error: moderationCheck.reason,
                banned: true,
                message: "Your account has been permanently banned",
            },
            { status: 403 }
        );
    }

    return Response.json(
        {
            error: moderationCheck.reason || "Access denied",
            message: moderationCheck.reason || "Your account access has been restricted",
        },
        { status: 403 }
    );
}
