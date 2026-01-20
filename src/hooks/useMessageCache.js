import { useCallback, useEffect } from 'react';
import { safeGetItem, safeSetItem, safeRemoveItem, clearOldCache } from '@/lib/localStorage-utils';

const CACHE_PREFIX = 'chat-cache-';
const CACHE_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Custom hook for managing message caching in localStorage
 */
export default function useMessageCache() {

    // Auto-cleanup old cache on mount
    useEffect(() => {
        clearOldCache(CACHE_TTL);
    }, []);

    /**
     * Load cached messages for a room
     * @param {string} roomId - Room ID
     * @returns {Array|null} - Cached messages or null if not found/expired
     */
    const loadFromCache = useCallback((roomId) => {
        if (!roomId) return null;

        const cacheKey = `${CACHE_PREFIX}${roomId}`;
        const cached = safeGetItem(cacheKey);

        if (!cached) return null;

        // Verify cache version
        if (cached.version !== CACHE_VERSION) {
            console.log('Cache version mismatch, ignoring cache');
            safeRemoveItem(cacheKey);
            return null;
        }

        // 🔥 CRITICAL: Verify cache roomId matches requested roomId
        if (cached.roomId !== roomId) {
            console.error(`⚠️ CACHE MISMATCH: Cache key ${cacheKey} has roomId ${cached.roomId}, expected ${roomId}`);
            safeRemoveItem(cacheKey);
            return null;
        }

        // Check if cache is expired
        const now = Date.now();
        const age = now - (cached.timestamp || 0);

        if (age > CACHE_TTL) {
            console.log('Cache expired, removing...');
            safeRemoveItem(cacheKey);
            return null;
        }

        console.log(`✅ Loaded ${cached.messages?.length || 0} messages from cache for room ${roomId}`);
        return cached.messages || [];
    }, []);

    /**
     * Save messages to cache for a room
     * @param {string} roomId - Room ID
     * @param {Array} messages - Messages array to cache
     * @returns {boolean} - Success status
     */
    const saveToCache = useCallback((roomId, messages) => {
        if (!roomId || !Array.isArray(messages)) return false;

        const cacheKey = `${CACHE_PREFIX}${roomId}`;
        const cacheData = {
            version: CACHE_VERSION,
            timestamp: Date.now(),
            messages: messages,
            roomId: roomId
        };

        const success = safeSetItem(cacheKey, cacheData);

        if (success) {
            console.log(`💾 Cached ${messages.length} messages for room ${roomId}`);
        }

        return success;
    }, []);

    /**
     * Add a single message to cache (optimistic update)
     * @param {string} roomId - Room ID
     * @param {Object} message - Message object to add
     * @returns {boolean} - Success status
     */
    const addMessageToCache = useCallback((roomId, message) => {
        if (!roomId || !message) return false;

        const cacheKey = `${CACHE_PREFIX}${roomId}`;
        const cached = safeGetItem(cacheKey);

        if (!cached) {
            // No existing cache, create new one with single message
            return saveToCache(roomId, [message]);
        }

        // Check for duplicates before adding
        const messages = cached.messages || [];
        const existingIndex = messages.findIndex(msg => msg.id === message.id);

        let updatedMessages;
        if (existingIndex !== -1) {
            // Update existing message
            updatedMessages = [...messages];
            updatedMessages[existingIndex] = message;
            console.log(`Updated existing message in cache: ${message.id}`);
        } else {
            // Add new message
            updatedMessages = [...messages, message];
            console.log(`Added new message to cache: ${message.id}`);
        }

        return saveToCache(roomId, updatedMessages);
    }, [saveToCache]);

    /**
     * Update a specific message in cache (for edits, deletes, etc.)
     * @param {string} roomId - Room ID
     * @param {string} messageId - Message ID to update
     * @param {Object} updates - Partial message object with updates
     * @returns {boolean} - Success status
     */
    const updateMessageInCache = useCallback((roomId, messageId, updates) => {
        if (!roomId || !messageId) return false;

        const cacheKey = `${CACHE_PREFIX}${roomId}`;
        const cached = safeGetItem(cacheKey);

        if (!cached || !cached.messages) return false;

        const messages = cached.messages;
        const messageIndex = messages.findIndex(msg => msg.id === messageId);

        if (messageIndex === -1) {
            console.log(`Message ${messageId} not found in cache`);
            return false;
        }

        // Update the message
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            ...updates
        };

        console.log(`Updated message ${messageId} in cache`);
        return saveToCache(roomId, updatedMessages);
    }, [saveToCache]);

    /**
     * Clear cache for a specific room
     * @param {string} roomId - Room ID
     * @returns {boolean} - Success status
     */
    const clearCache = useCallback((roomId) => {
        if (!roomId) return false;

        const cacheKey = `${CACHE_PREFIX}${roomId}`;
        const success = safeRemoveItem(cacheKey);

        if (success) {
            console.log(`🗑️ Cleared cache for room ${roomId}`);
        }

        return success;
    }, []);

    /**
     * Clear all message caches
     * @returns {number} - Number of caches cleared
     */
    const clearAllCache = useCallback(() => {
        try {
            let count = 0;
            const keysToRemove = [];

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith(CACHE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                count++;
            });

            console.log(`🗑️ Cleared all message caches (${count} rooms)`);
            return count;
        } catch (error) {
            console.error('Error clearing all caches:', error);
            return 0;
        }
    }, []);

    return {
        loadFromCache,
        saveToCache,
        addMessageToCache,
        updateMessageInCache,
        clearCache,
        clearAllCache
    };
}
