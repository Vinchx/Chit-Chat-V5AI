// API endpoint to check if current user is admin
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin-config';

export async function GET() {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ isAdmin: false, reason: 'not_logged_in' });
        }

        const adminStatus = isAdmin(session.user.email);

        return NextResponse.json({
            isAdmin: adminStatus,
            email: session.user.email,
        });
    } catch (error) {
        console.error('[Admin Check] Error:', error);
        return NextResponse.json(
            { isAdmin: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
