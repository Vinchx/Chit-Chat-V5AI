// WebAuthn Configuration
export const rpName = "ChitChat V5";
export const rpID = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
export const origin = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:1630";

// Admin whitelist (emails authorized untuk admin panel)
export const ADMIN_EMAILS = [
    'nzxtvinix@gmail.com',
    'chitchat.v5ai@gmail.com',
];

// Check if user is admin
export function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}
