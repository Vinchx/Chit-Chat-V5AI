// API endpoint untuk verify registration response
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin-config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPasskeyRegistration } from '@/lib/webauthn';

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

        const body = await request.json();
        const { response, expectedChallenge } = body;

        if (!response || !expectedChallenge) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify registration response
        const verification = await verifyPasskeyRegistration(response, expectedChallenge);

        if (!verification.verified) {
            return NextResponse.json(
                { error: 'Verification failed', details: verification },
                { status: 400 }
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

        // Extract credential data
        const { registrationInfo } = verification;
        const {
            credentialID,
            credentialPublicKey,
            counter,
            credentialDeviceType,
            credentialBackedUp,
        } = registrationInfo;

        // Debug logging for registration
        console.log('[Passkey Verify Registration] ========== REGISTRATION DEBUG ==========');
        console.log('[Passkey Verify Registration] credentialID type:', typeof credentialID);
        console.log('[Passkey Verify Registration] credentialID value:', credentialID);
        console.log('[Passkey Verify Registration] credentialPublicKey type:', typeof credentialPublicKey);

        // IMPORTANT: SimpleWebAuthn v10 returns credentialID as base64url STRING, not Uint8Array!
        // Do NOT convert again or we'll get double encoding
        let credentialIDBase64url;
        let publicKeyBase64;

        if (typeof credentialID === 'string') {
            // Already a string (SimpleWebAuthn v10 behavior) - use directly
            credentialIDBase64url = credentialID;
            console.log('[Passkey Verify Registration] CredentialID is already string, using directly');
        } else {
            // Uint8Array (older version) - convert to base64url
            credentialIDBase64url = Buffer.from(credentialID).toString('base64url');
            console.log('[Passkey Verify Registration] CredentialID is Uint8Array, converting to base64url');
        }

        if (typeof credentialPublicKey === 'string') {
            // Already a string - use directly
            publicKeyBase64 = credentialPublicKey;
        } else {
            // Uint8Array - convert to base64
            publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64');
        }

        console.log('[Passkey Verify Registration] Storing credentialID:', credentialIDBase64url);
        console.log('[Passkey Verify Registration] Storing publicKey length:', publicKeyBase64.length);

        // Check if credential already exists (simple string comparison)
        const existingCredential = user.passkeys?.find(
            (passkey) => passkey.credentialID === credentialIDBase64url
        );

        if (existingCredential) {
            return NextResponse.json(
                { error: 'This passkey is already registered' },
                { status: 400 }
            );
        }

        // Add new passkey to user
        const newPasskey = {
            credentialID: credentialIDBase64url,
            publicKey: publicKeyBase64,
            counter,
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: response.response?.transports || [],
            createdAt: new Date(),
        };
        user.passkeys = user.passkeys || [];
        user.passkeys.push(newPasskey);
        console.log('[Passkey Verify Registration] Saving passkey for user:', session.user.email);
        console.log('[Passkey Verify Registration] Passkeys count before save:', user.passkeys.length);
        console.log('[Passkey Verify Registration] New passkey data:', {
            credentialIDLength: newPasskey.credentialID.length,
            publicKeyLength: newPasskey.publicKey.length,
            counter: newPasskey.counter,
            deviceType: newPasskey.deviceType,
        });

        try {
            await user.save();
            console.log('[Passkey Verify Registration] User saved successfully');

            // Verify the save by re-fetching
            const verifyUser = await User.findOne({ email: session.user.email });
            console.log('[Passkey Verify Registration] Verification - passkeys count after save:', verifyUser.passkeys?.length || 0);

            if (!verifyUser.passkeys || verifyUser.passkeys.length === 0) {
                throw new Error('Passkey was not saved to database - verification failed');
            }
        } catch (saveError) {
            console.error('[Passkey Verify Registration] Save error:', saveError);
            throw saveError;
        }

        return NextResponse.json({
            success: true,
            message: 'Passkey registered successfully',
            passkey: {
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp,
                createdAt: newPasskey.createdAt,
            },
        });

    } catch (error) {
        console.error('[Passkey Verify Registration] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
