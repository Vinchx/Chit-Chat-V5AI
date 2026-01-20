/**
 * Safe localStorage utilities with error handling and quota management
 */

const STORAGE_PREFIX = 'chat-cache-';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for message cache

/**
 * Safely set an item in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {boolean} - Success status
 */
export function safeSetItem(key, value) {
    try {
        const serialized = JSON.stringify(value);

        // Check if we're about to exceed storage quota
        const currentSize = getStorageSize();
        const newItemSize = new Blob([serialized]).size;

        if (currentSize + newItemSize > MAX_STORAGE_SIZE) {
            console.warn('Storage quota would be exceeded, clearing old cache...');
            clearOldCache(24 * 60 * 60 * 1000); // Clear cache older than 24 hours

            // Try again after cleanup
            const newSize = getStorageSize();
            if (newSize + newItemSize > MAX_STORAGE_SIZE) {
                console.error('Still exceeding quota after cleanup, cannot save');
                return false;
            }
        }

        localStorage.setItem(key, serialized);
        return true;
    } catch (error) {
        // Handle QuotaExceededError or other storage errors
        if (error.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded:', error);
            clearOldCache(12 * 60 * 60 * 1000); // More aggressive cleanup - 12 hours

            // Try one more time
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (retryError) {
                console.error('Failed to save after quota cleanup:', retryError);
                return false;
            }
        } else if (error.name === 'SecurityError') {
            // Private browsing mode or localStorage disabled
            console.warn('localStorage unavailable (private mode?):', error);
            return false;
        } else {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
}

/**
 * Safely get an item from localStorage
 * @param {string} key - Storage key
 * @returns {any|null} - Parsed value or null if error/not found
 */
export function safeGetItem(key) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);
        return parsed;
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error('Corrupted cache data for key:', key);
            // Remove corrupted data
            localStorage.removeItem(key);
        } else {
            console.error('Error reading from localStorage:', error);
        }
        return null;
    }
}

/**
 * Safely remove an item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} - Success status
 */
export function safeRemoveItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

/**
 * Calculate approximate size of localStorage usage
 * @returns {number} - Size in bytes
 */
export function getStorageSize() {
    try {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += new Blob([key, value]).size;
                }
            }
        }
        return totalSize;
    } catch (error) {
        console.error('Error calculating storage size:', error);
        return 0;
    }
}

/**
 * Clear cache entries older than the specified age
 * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
 * @returns {number} - Number of entries cleared
 */
export function clearOldCache(maxAge = 24 * 60 * 60 * 1000) {
    try {
        let clearedCount = 0;
        const now = Date.now();
        const keysToRemove = [];

        // Find old cache entries
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.timestamp) {
                        const age = now - data.timestamp;
                        if (age > maxAge) {
                            keysToRemove.push(key);
                        }
                    }
                } catch (parseError) {
                    // Corrupted data, mark for removal
                    keysToRemove.push(key);
                }
            }
        }

        // Remove old entries
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            clearedCount++;
        });

        if (clearedCount > 0) {
            console.log(`Cleared ${clearedCount} old cache entries`);
        }

        return clearedCount;
    } catch (error) {
        console.error('Error clearing old cache:', error);
        return 0;
    }
}

/**
 * Clear all message cache entries
 * @returns {boolean} - Success status
 */
export function clearAllMessageCache() {
    try {
        const keysToRemove = [];

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared all message cache (${keysToRemove.length} entries)`);

        return true;
    } catch (error) {
        console.error('Error clearing all message cache:', error);
        return false;
    }
}

/**
 * Get formatted storage size
 * @returns {string} - Human-readable size
 */
export function getFormattedStorageSize() {
    const bytes = getStorageSize();
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
