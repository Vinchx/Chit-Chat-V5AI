// Admin Session Management Utility
// Handles admin-specific authentication tokens separate from user session

const ADMIN_TOKEN_KEY = 'admin_token';
const TOKEN_EXPIRY_HOURS = 8;

/**
 * Generate admin token data
 * @param {string} email - Admin email
 * @returns {object} Token data with email and expiry
 */
export function generateAdminTokenData(email) {
    const now = new Date();
    const expiry = new Date(now.getTime() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    return {
        email,
        issuedAt: now.toISOString(),
        expiresAt: expiry.toISOString(),
    };
}

/**
 * Verify if admin token is valid
 * @param {object} tokenData - Token data to verify
 * @returns {boolean} True if valid
 */
export function verifyAdminToken(tokenData) {
    if (!tokenData || !tokenData.email || !tokenData.expiresAt) {
        return false;
    }

    const expiry = new Date(tokenData.expiresAt);
    const now = new Date();

    return now < expiry;
}

/**
 * Set admin token in localStorage
 * @param {object} tokenData - Token data to store
 */
export function setAdminToken(tokenData) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify(tokenData));
    }
}

/**
 * Get admin token from localStorage
 * @returns {object|null} Token data or null
 */
export function getAdminToken() {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return null;

    try {
        return JSON.parse(token);
    } catch (error) {
        console.error('Failed to parse admin token:', error);
        return null;
    }
}

/**
 * Clear admin token from localStorage
 */
export function clearAdminToken() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
}

/**
 * Check if current admin token is valid
 * @returns {boolean} True if valid admin token exists
 */
export function hasValidAdminToken() {
    const token = getAdminToken();
    return verifyAdminToken(token);
}

/**
 * Get admin email from token if valid
 * @returns {string|null} Admin email or null
 */
export function getAdminEmail() {
    const token = getAdminToken();
    if (verifyAdminToken(token)) {
        return token.email;
    }
    return null;
}
