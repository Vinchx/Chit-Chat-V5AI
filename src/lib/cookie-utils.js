/**
 * Clear all cookies from the browser
 * Useful for development when switching between local and cloud databases
 */
export function clearAllCookies() {
    // Get all cookies
    const cookies = document.cookie.split(";");

    // Loop through all cookies and delete them
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;

        // Delete the cookie by setting it to expire in the past
        // Try multiple domain/path combinations to ensure deletion
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    }

    // Also clear localStorage and sessionStorage for a complete cleanup
    localStorage.clear();
    sessionStorage.clear();

    console.log('✅ All cookies, localStorage, and sessionStorage cleared');
}

/**
 * Clear specific cookie by name
 */
export function clearCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
}
