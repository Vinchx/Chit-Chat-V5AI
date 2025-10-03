import { auth } from "@/auth";

/**
 * Helper function untuk check authentication di API routes
 * @returns {Promise<{session: object|null, userId: string|null, error: Response|null}>}
 */
export async function getAuthSession() {
    const session = await auth();

    if (!session || !session.user) {
        return {
            session: null,
            userId: null,
            error: Response.json({
                success: false,
                message: "Unauthorized. Please login first."
            }, { status: 401 })
        };
    }

    return {
        session,
        userId: session.user.id,
        error: null
    };
}

/**
 * Helper untuk API routes dengan support API key (development only)
 * Untuk testing di Postman tanpa perlu session cookie
 * @param {Request} request
 */
export async function getAuthSessionOrApiKey(request) {
    // Try NextAuth session first
    const session = await auth();

    if (session?.user) {
        return {
            session,
            userId: session.user.id,
            error: null
        };
    }

    // Fallback to API key for Postman testing (development only)
    if (process.env.NODE_ENV === "development") {
        const apiKey = request.headers.get("x-api-key");

        if (apiKey && apiKey === process.env.DEV_API_KEY) {
            // Get userId from header
            const userId = request.headers.get("x-user-id");

            if (userId) {
                return {
                    session: {
                        user: { id: userId }
                    },
                    userId: userId,
                    error: null
                };
            }
        }
    }

    return {
        session: null,
        userId: null,
        error: Response.json({
            success: false,
            message: "Unauthorized. Please login first."
        }, { status: 401 })
    };
}
