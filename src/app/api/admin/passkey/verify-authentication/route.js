// API endpoint untuk verify authentication response dan create session
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPasskeyAuthentication, formatCredentialForVerification } from '@/lib/webauthn';
import { signIn } from '@/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { response, expectedChallenge, email } = body;

        if (!response || !expectedChallenge || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        // Find the credential used for authentication
        // credentialID is now stored as base64url string in database
        const credentialIDBase64url = response.id; // This is already base64url from browser

        // Ultra-detailed debug logging
        console.log('[Passkey Verify Auth] ========== AUTHENTICATION DEBUG ==========');
        console.log('[Passkey Verify Auth] User email:', email);
        console.log('[Passkey Verify Auth] User has passkeys:', user.passkeys?.length || 0);
        console.log('[Passkey Verify Auth] Looking for credentialID (base64url):', credentialIDBase64url);

        if (user.passkeys && user.passkeys.length > 0) {
            console.log('[Passkey Verify Auth] Existing credentials in database:');
            user.passkeys.forEach((pk, idx) => {
                console.log(`  [${idx}] base64url: ${pk.credentialID}`);
                console.log(`  [${idx}] match: ${pk.credentialID === credentialIDBase64url}`);
            });
        }

        // Find credential using simple string comparison
        const credential = user.passkeys?.find(
            (passkey) => passkey.credentialID === credentialIDBase64url
        );

        if (!credential) {
            console.error('[Passkey Verify Auth] ❌ Credential not found!');
            console.error('[Passkey Verify Auth] Received credentialID (full):', credentialIDBase64url);

            // More helpful error message
            const errorMessage = user.passkeys && user.passkeys.length > 0
                ? 'Passkey not recognized. Please try registering a new passkey.'
                : 'No passkeys registered for this account. Please register a passkey first from the admin dashboard.';

            return NextResponse.json(
                { error: errorMessage },
                { status: 404 }
            );
        }

        console.log('[Passkey Verify Auth] ✅ Credential found successfully!');

        // Format credential for verification
        const formattedCredential = formatCredentialForVerification(credential);

        // Verify authentication response
        const verification = await verifyPasskeyAuthentication(
            response,
            expectedChallenge,
            formattedCredential
        );

        if (!verification.verified) {
            return NextResponse.json(
                { error: 'Verification failed' },
                { status: 400 }
            );
        }

        // Update counter
        const credentialIndex = user.passkeys.findIndex(
            (passkey) => passkey.credentialID === credentialIDBase64url
        );
        user.passkeys[credentialIndex].counter = verification.authenticationInfo.newCounter;
        await user.save();

        // Authentication successful - return user data for frontend to create session
        // Note: NextAuth session creation needs to be handled differently
        // For now, we'll return success and let the frontend handle the session
        return NextResponse.json({
            success: true,
            message: 'Authentication successful',
            user: {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
            },
        });

    } catch (error) {
        console.error('[Passkey Verify Authentication] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
