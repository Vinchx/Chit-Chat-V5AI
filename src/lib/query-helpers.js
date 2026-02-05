/**
 * Query Helpers untuk Soft Delete
 * Menyediakan helper functions untuk consistent query filtering
 */

/**
 * Get filter untuk active records (exclude soft deleted)
 * @returns {Object} MongoDB filter object
 */
export function getActiveRecordsFilter() {
    return { isDeleted: { $ne: true } };
}

/**
 * Merge filter dengan active records filter
 * @param {Object} filter - Original filter
 * @returns {Object} Merged filter with active records filter
 */
export function withActiveFilter(filter = {}) {
    return {
        ...filter,
        isDeleted: { $ne: true },
    };
}

/**
 * Get filter untuk include soft deleted records
 * @param {Object} filter - Original filter
 * @returns {Object} Filter without soft delete filtering
 */
export function includeDeleted(filter = {}) {
    return filter;
}

/**
 * Get filter untuk only soft deleted records
 * @returns {Object} MongoDB filter object
 */
export function getDeletedRecordsFilter() {
    return { isDeleted: true };
}

/**
 * Merge filter dengan deleted records filter
 * @param {Object} filter - Original filter
 * @returns {Object} Merged filter with deleted records filter
 */
export function withDeletedFilter(filter = {}) {
    return {
        ...filter,
        isDeleted: true,
    };
}
