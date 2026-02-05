// Domain Detection Utility for Multi-Domain Passkey Support

/**
 * Get list of allowed passkey domains from environment variable
 * @returns {string[]} Array of allowed domain strings
 */
export function getAllowedDomains() {
    const domainsEnv = process.env.ALLOWED_PASSKEY_DOMAINS || 'localhost';

    // Split by comma and trim whitespace
    const domains = domainsEnv.split(',').map(d => d.trim()).filter(Boolean);

    if (domains.length === 0) {
        console.warn('⚠️ No domains configured, defaulting to localhost');
        return ['localhost'];
    }

    return domains;
}

/**
 * Detect current domain from request headers (server-side)
 * @param {Request} request - Next.js request object
 * @returns {string} Current domain (e.g., 'localhost' or 'xyz.ngrok-free.dev')
 */
export function detectDomainFromRequest(request) {
    try {
        // Try to get domain from headers
        const headers = request.headers;

        // Check x-forwarded-host first (for proxies like ngrok)
        const forwardedHost = headers.get('x-forwarded-host');
        if (forwardedHost) {
            return extractDomain(forwardedHost);
        }

        // Fallback to host header
        const host = headers.get('host');
        if (host) {
            return extractDomain(host);
        }

        // Last resort: try to parse from URL
        const url = new URL(request.url);
        return extractDomain(url.hostname);
    } catch (error) {
        console.error('Failed to detect domain from request:', error);
        return 'localhost'; // Safe default
    }
}

/**
 * Extract clean domain from host string (remove port)
 * @param {string} hostString - Host with potential port (e.g., 'localhost:1630')
 * @returns {string} Clean domain (e.g., 'localhost')
 */
function extractDomain(hostString) {
    if (!hostString) return 'localhost';

    // Remove port if present
    const domain = hostString.split(':')[0];

    return domain;
}

/**
 * Validate if a domain is allowed for passkey operations
 * @param {string} domain - Domain to validate
 * @returns {boolean} True if domain is in whitelist
 */
export function isDomainAllowed(domain) {
    const allowedDomains = getAllowedDomains();
    return allowedDomains.includes(domain);
}

/**
 * Get RP ID for WebAuthn based on current domain
 * @param {string} currentDomain - Current domain
 * @returns {string} RP ID to use
 */
export function getRpID(currentDomain) {
    const allowedDomains = getAllowedDomains();

    // If current domain is allowed, use it
    if (allowedDomains.includes(currentDomain)) {
        return currentDomain;
    }

    // Otherwise use first allowed domain as fallback
    console.warn(`⚠️ Domain ${currentDomain} not in whitelist, using fallback: ${allowedDomains[0]}`);
    return allowedDomains[0];
}

/**
 * Get origin URL for WebAuthn based on domain
 * @param {string} domain - Domain name
 * @returns {string} Full origin URL (e.g., 'http://localhost:1630')
 */
export function getOrigin(domain) {
    // Localhost uses http with port
    if (domain === 'localhost' || domain === '127.0.0.1') {
        return 'http://localhost:1630';
    }

    // All other domains use https (assumed to be production/ngrok)
    return `https://${domain}`;
}

/**
 * Client-side domain detection (browser)
 * @returns {string} Current domain from window.location
 */
export function detectDomainFromBrowser() {
    if (typeof window === 'undefined') {
        return 'localhost';
    }

    return extractDomain(window.location.hostname);
}
