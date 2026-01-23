// Debug endpoint to check raw user data
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin-config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isAdmin(session.user.email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return full user data for debugging
        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                passkeysCount: user.passkeys?.length || 0,
                passkeysRaw: user.passkeys || [],
                hasPasskeysField: 'passkeys' in user,
            }
        });

    } catch (error) {
        console.error('[Debug User] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
