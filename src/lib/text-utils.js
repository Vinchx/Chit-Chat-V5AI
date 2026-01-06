/**
 * Clean AI response by removing markdown formatting
 * @param {string} text - AI response text with markdown
 * @returns {string} - Clean text without markdown
 */
export function cleanAIResponse(text) {
    if (!text) return '';

    return text
        .replace(/\*\*/g, '')  // Remove bold markdown (**)
        .replace(/\*/g, '')    // Remove italic markdown (*)
        .replace(/`/g, '')     // Remove code markdown (`)
        .replace(/#{1,6}\s/g, '') // Remove headers (# ## ###)
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
        .trim();
}
