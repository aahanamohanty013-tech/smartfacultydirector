/**
 * Knuth-Morris-Pratt (KMP) String Matching Algorithm
 */
class KMP {
    /**
     * Builds the Longest Prefix Suffix (LPS) array for the given pattern.
     * The LPS array tells us how many characters we can skip when a mismatch occurs.
     * 
     * @param {string} pattern - The search query
     * @returns {Array} - The LPS array
     */
    static buildLPS(pattern) {
        const lps = new Array(pattern.length).fill(0);
        let len = 0; // Length of the previous longest prefix suffix
        let i = 1;

        while (i < pattern.length) {
            if (pattern[i] === pattern[len]) {
                len++;
                lps[i] = len;
                i++;
            } else {
                if (len !== 0) {
                    len = lps[len - 1]; // Fallback to previous longest prefix
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        return lps;
    }

    /**
     * Searches for a pattern within a text using the KMP algorithm.
     * Runs in O(N + M) time complexity.
     * 
     * @param {string} text - The long string to search through (e.g. specialization)
     * @param {string} pattern - The query to find
     * @returns {boolean} - True if pattern is found, false otherwise
     */
    static search(text, pattern) {
        if (!text || !pattern || pattern.length === 0) return false;
        
        // Convert to lowercase for case-insensitive matching
        const textLower = text.toLowerCase();
        const patternLower = pattern.toLowerCase();

        const lps = this.buildLPS(patternLower);
        let i = 0; // Index for text
        let j = 0; // Index for pattern

        while (i < textLower.length) {
            if (patternLower[j] === textLower[i]) {
                j++;
                i++;
            }

            if (j === patternLower.length) {
                // Found a match
                return true;
            } else if (i < textLower.length && patternLower[j] !== textLower[i]) {
                // Mismatch after j matches
                if (j !== 0) {
                    j = lps[j - 1];
                } else {
                    i++;
                }
            }
        }

        return false;
    }
}

module.exports = KMP;
