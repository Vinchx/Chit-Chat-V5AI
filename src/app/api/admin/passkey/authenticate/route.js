// API endpoint untuk generate authentication options
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { generatePasskeyAuthenticationOptions } from '@/lib/webauthn';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if email is admin
        if (!isAdmin(email)) {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        await connectToDatabase();

        // Get user from database
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user has passkeys
        if (!user.passkeys || user.passkeys.length === 0) {
            return NextResponse.json(
                { error: 'No passkeys registered for this account. Please register a passkey first.' },
                { status: 400 }
            );
        }

        // Generate authentication options
        const options = await generatePasskeyAuthenticationOptions(user.passkeys);

        return NextResponse.json({
            success: true,
            options,
            userId: user._id.toString(),
        });

    } catch (error) {
        console.error('[Passkey Authenticate] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
