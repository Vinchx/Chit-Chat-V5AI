// WebAuthn Helper Functions using SimpleWebAuthn
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { rpName, getRpID, getOrigin } from './admin-config';

/**
 * Generate registration options for a new passkey
 * @param {Object} user - User object with id, email, username
 * @param {Array} existingCredentials - Array of existing passkey credentials
 * @param {string} currentDomain - Current domain (e.g., 'localhost', 'xyz.ngrok-free.dev')
 * @returns {Promise<Object>} Registration options
 */
export async function generatePasskeyRegistrationOptions(user, existingCredentials = [], currentDomain = 'localhost') {
    // Convert user ID to Uint8Array as required by SimpleWebAuthn v10
    const userIdString = user.id || user._id.toString();
    const userIdBytes = new TextEncoder().encode(userIdString);

    // Temporarily disable excludeCredentials to test registration without existing credentials
    // TODO: Re-enable after fixing the input.replace error 
    const formattedExcludeCredentials = []; // Empty for now

    // Get dynamic rpID and origin based on current domain
    const rpID = getRpID(currentDomain);

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: userIdBytes,
        userName: user.email,
        userDisplayName: user.displayName || user.username,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: formattedExcludeCredentials,
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            // Remove authenticatorAttachment to allow both platform (laptop) and cross-platform (phone via QR)
            // This enables hybrid authentication like GitHub
        },
    });

    return options;
}

/**
 * Verify registration response from the client
 * @param {Object} response - Registration response from client
 * @param {String} expectedChallenge - Expected challenge
 * @param {string} currentDomain - Current domain
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPasskeyRegistration(response, expectedChallenge, currentDomain = 'localhost') {
    const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: getOrigin(currentDomain),
        expectedRPID: getRpID(currentDomain),
        requireUserVerification: true,
    });

    return verification;
}

/**
 * Generate authentication options for passkey login
 * @param {Array} allowedCredentials - Array of allowed credentials for the user
 * @param {string} currentDomain - Current domain
 * @returns {Promise<Object>} Authentication options
 */
export async function generatePasskeyAuthenticationOptions(allowedCredentials = [], currentDomain = 'localhost') {
    // Temporarily disable allowCredentials filtering to avoid input.replace error
    // TODO: Re-enable after fixing the credentialID format issue with SimpleWebAuthn v10
    // This makes authentication "user-initiated" where user selects from all their passkeys
    const formattedCredentials = []; // Empty for now

    /* Original code - commented out due to input.replace error
    const formattedCredentials = allowedCredentials.map((cred) => {
        let credentialBytes;

        if (Buffer.isBuffer(cred.credentialID)) {
            // Convert Buffer to base64url string first, then back to Uint8Array
            // This is necessary because SimpleWebAuthn v10 expects specific formatting
            const base64url = cred.credentialID.toString('base64url');
            credentialBytes = Buffer.from(base64url, 'base64url');
        } else if (cred.credentialID instanceof Uint8Array) {
            credentialBytes = cred.credentialID;
        } else if (typeof cred.credentialID === 'string') {
            // If it's already a string, convert from base64url
            credentialBytes = Buffer.from(cred.credentialID, 'base64url');
        } else {
            // Fallback: try to create buffer from unknown type
            credentialBytes = Buffer.from(cred.credentialID);
        }

        return {
            id: credentialBytes,
            type: 'public-key',
            transports: cred.transports || [],
        };
    });
    */

    const options = await generateAuthenticationOptions({
        rpID: getRpID(currentDomain),
        timeout: 60000,
        allowCredentials: formattedCredentials,
        userVerification: 'preferred',
    });

    return options;
}

/**
 * Verify authentication response from the client
 * @param {Object} response - Authentication response from client
 * @param {String} expectedChallenge - Expected challenge
 * @param {Object} credential - Stored credential from database
 * @param {string} currentDomain - Current domain
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPasskeyAuthentication(response, expectedChallenge, credential, currentDomain = 'localhost') {
    const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: getOrigin(currentDomain),
        expectedRPID: getRpID(currentDomain),
        authenticator: {
            credentialID: credential.credentialID,
            credentialPublicKey: credential.publicKey,
            counter: credential.counter,
        },
        requireUserVerification: true,
    });

    return verification;
}

/**
 * Convert credential from database format to format expected by verifier
 * @param {Object} dbCredential - Credential from MongoDB (now strings, not Buffers)
 * @returns {Object} Formatted credential
 */
export function formatCredentialForVerification(dbCredential) {
    return {
        credentialID: Buffer.from(dbCredential.credentialID, 'base64url'),
        publicKey: Buffer.from(dbCredential.publicKey, 'base64'),
        counter: dbCredential.counter,
        transports: dbCredential.transports || [],
    };
}
