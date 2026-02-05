// API endpoint untuk generate registration options
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin-config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { generatePasskeyRegistrationOptions } from '@/lib/webauthn';

export async function POST(request) {
    try {
        const session = await auth();

        // Check authentication
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

        await connectToDatabase();

        // Get user from database
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get existing passkeys and serialize them properly
        const existingCredentials = (user.passkeys || []).map(passkey => ({
            credentialID: passkey.credentialID,  // Keep as Buffer
            transports: passkey.transports || []
        }));

        console.log('[Passkey Register] Existing passkeys count:', existingCredentials.length);

        // Detect current domain from request
        const { detectDomainFromRequest } = await import('@/lib/domain-utils');
        const currentDomain = detectDomainFromRequest(request);
        console.log('[Passkey Register] Detected domain:', currentDomain);

        // Generate registration options with current domain
        const options = await generatePasskeyRegistrationOptions(
            {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
                displayName: user.displayName,
            },
            existingCredentials,
            currentDomain
        );

        // Store challenge in session or temporary storage
        // For simplicity, we'll return it and expect client to send it back
        // In production, you might want to store this server-side
        return NextResponse.json({
            success: true,
            options,
        });

    } catch (error) {
        console.error('[Passkey Register] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
