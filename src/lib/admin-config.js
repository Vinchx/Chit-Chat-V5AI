import { getAllowedDomains, getRpID as getDomainRpID, getOrigin as getDomainOrigin } from './domain-utils';

// WebAuthn Configuration with Multi-Domain Support
export const rpName = "ChitChat V5";

// Legacy static config (kept for backwards compatibility)
// Use getRpID() and getOrigin() functions instead for dynamic domain support
export const rpID = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
export const origin = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:1630";

// NEW: Dynamic domain-based configuration
/**
 * Get RP ID based on current domain
 * @param {string} currentDomain - Current domain (e.g., 'localhost', 'xyz.ngrok-free.dev')
 * @returns {string} RP ID for WebAuthn
 */
export function getRpID(currentDomain) {
    return getDomainRpID(currentDomain);
}

/**
 * Get origin URL based on current domain
 * @param {string} currentDomain - Current domain
 * @returns {string} Origin URL (e.g., 'http://localhost:1630')
 */
export function getOrigin(currentDomain) {
    return getDomainOrigin(currentDomain);
}

/**
 * Get list of all allowed domains for passkeys
 * @returns {string[]} Array of allowed domains
 */
export function getPasskeyDomains() {
    return getAllowedDomains();
}

// Admin whitelist (emails authorized untuk admin panel)
// Read from environment variable for security
// Format: comma-separated emails (e.g., "email1@test.com,email2@test.com")
const getAdminEmails = () => {
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';

    if (!adminEmailsEnv) {
        console.warn('⚠️  ADMIN_EMAILS not set in environment variables!');
        return [];
    }

    // Split by comma and trim whitespace
    return adminEmailsEnv.split(',').map(email => email.trim()).filter(Boolean);
};

export const ADMIN_EMAILS = getAdminEmails();

// Check if user is admin
export function isAdmin(email) {
    if (!email) return false;

    const adminEmails = getAdminEmails();

    if (adminEmails.length === 0) {
        console.warn('⚠️  No admin emails configured!');
        return false;
    }

    return adminEmails.includes(email);
}
