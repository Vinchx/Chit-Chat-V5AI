// API endpoint to create admin token
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin-config';
import { generateAdminTokenData } from '@/lib/admin-session';

export async function POST(request) {
    try {
        const session = await auth();

        // Check user authentication
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login first' },
                { status: 401 }
            );
        }

        // Check admin access
        if (!isAdmin(session.user.email)) {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Generate admin token
        const tokenData = generateAdminTokenData(session.user.email);

        return NextResponse.json({
            success: true,
            token: tokenData,
            message: 'Admin token created successfully',
        });

    } catch (error) {
        console.error('[Admin Token] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
