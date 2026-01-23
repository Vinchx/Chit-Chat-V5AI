// API endpoint untuk list dan delete passkeys
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin-config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

// GET - List all passkeys for current user
export async function GET(request) {
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
        console.log('[Passkey List] User email:', session.user.email);
        console.log('[Passkey List] User found:', !!user);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        console.log('[Passkey List] User passkeys count:', user.passkeys?.length || 0);

        // Return passkey list (without sensitive data)
        // Handle backward compatibility: old passkeys might be Buffer, new ones are String
        const passkeys = (user.passkeys || []).map((passkey, index) => {
            // Handle both Buffer (old) and String (new) formats
            let credentialIDString;
            if (typeof passkey.credentialID === 'string') {
                credentialIDString = passkey.credentialID;
            } else if (Buffer.isBuffer(passkey.credentialID)) {
                // Convert old Buffer format to base64url string
                credentialIDString = passkey.credentialID.toString('base64url');
            } else {
                // Fallback for unknown format
                credentialIDString = 'unknown';
            }

            return {
                id: index,
                credentialID: credentialIDString,
                deviceType: passkey.deviceType,
                backedUp: passkey.backedUp,
                transports: passkey.transports,
                createdAt: passkey.createdAt,
            };
        });

        return NextResponse.json({
            success: true,
            passkeys,
        });

    } catch (error) {
        console.error('[Passkey List] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Remove a passkey
export async function DELETE(request) {
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
        const { credentialID } = body;

        if (!credentialID) {
            return NextResponse.json(
                { error: 'Credential ID is required' },
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

        // Find and remove passkey (handle both Buffer and String formats)
        const initialLength = user.passkeys?.length || 0;

        user.passkeys = (user.passkeys || []).filter((passkey) => {
            // Handle both Buffer (old) and String (new) formats
            if (typeof passkey.credentialID === 'string') {
                return passkey.credentialID !== credentialID;
            } else if (Buffer.isBuffer(passkey.credentialID)) {
                return passkey.credentialID.toString('base64url') !== credentialID;
            }
            return true; // Keep unknown formats
        });

        if (user.passkeys.length === initialLength) {
            return NextResponse.json(
                { error: 'Passkey not found' },
                { status: 404 }
            );
        }

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Passkey deleted successfully',
        });

    } catch (error) {
        console.error('[Passkey Delete] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
