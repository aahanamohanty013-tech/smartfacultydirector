// Knuth-Morris-Pratt (KMP) String Matching Algorithm

function buildLPS(pattern) {
    const lps = new Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;
    while (i < pattern.length) {
        if (pattern[i] === pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len !== 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

function kmpSearch(text, pattern) {
    if (!pattern) return true; // Empty query matches anything
    if (!text) return false;

    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    const lps = buildLPS(lowerPattern);
    let i = 0; // index for lowerText
    let j = 0; // index for lowerPattern

    while (i < lowerText.length) {
        if (lowerPattern[j] === lowerText[i]) {
            i++;
            j++;
        }

        if (j === lowerPattern.length) {
            return true; // Match found
        } else if (i < lowerText.length && lowerPattern[j] !== lowerText[i]) {
            if (j !== 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }

    return false; // No match found
}

module.exports = {
    kmpSearch
};
