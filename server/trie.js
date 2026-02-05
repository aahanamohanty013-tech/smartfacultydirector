class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.facultyData = []; // Store multiple faculty if names collide or for variations
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    // Insert a word (name/alias) and associated faculty data
    insert(word, faculty) {
        if (!word) return;
        let current = this.root;
        const normalizedWord = word.toLowerCase();

        for (let i = 0; i < normalizedWord.length; i++) {
            const char = normalizedWord[i];
            if (!current.children[char]) {
                current.children[char] = new TrieNode();
            }
            current = current.children[char];
        }
        current.isEndOfWord = true;

        // Avoid duplicates if re-inserting
        const exists = current.facultyData.some(f => f.id === faculty.id);
        if (!exists) {
            current.facultyData.push(faculty);
        }
    }

    // Search for a prefix and return all matching faculty
    search(prefix) {
        if (!prefix) return [];
        let current = this.root;
        const normalizedPrefix = prefix.toLowerCase();

        // Navigate to the end of the prefix
        for (let i = 0; i < normalizedPrefix.length; i++) {
            const char = normalizedPrefix[i];
            if (!current.children[char]) {
                return []; // Prefix not found
            }
            current = current.children[char];
        }

        // Collect all words from this node
        return this._collectAll(current);
    }

    _collectAll(node) {
        let results = [];
        if (node.isEndOfWord) {
            results = [...results, ...node.facultyData];
        }

        for (const char in node.children) {
            results = [...results, ...this._collectAll(node.children[char])];
        }

        // Remove duplicates from results (if multiple aliases point to same person)
        const uniqueResults = [];
        const map = new Map();
        for (const item of results) {
            if (!map.has(item.id)) {
                map.set(item.id, true);
                uniqueResults.push(item);
            }
        }
        return uniqueResults;
    }

    // Clear trie (useful for refreshing from DB)
    clear() {
        this.root = new TrieNode();
    }

    // Levenshtein Distance Helper
    _levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1 // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    // Fuzzy Search
    fuzzySearch(query, maxDistance = 3) { // Increased tolerance
        if (!query) return [];
        const normalizedQuery = query.toLowerCase();
        const allWords = this._collectAllWords(this.root, "");
        const results = [];

        for (const { word, facultyData } of allWords) {
            const distance = this._levenshteinDistance(normalizedQuery, word);
            // Allow matches that are "close enough" relative to string length
            // or absolute distance for short strings. 
            // Also give bonus if the word *contains* the query or vice versa (though strict Levenshtein handles edits)
            if (distance <= maxDistance) {
                 results.push(...facultyData);
            }
        }

        // Remove duplicates
        const uniqueResults = [];
        const map = new Map();
        for (const item of results) {
            if (!map.has(item.id)) {
                map.set(item.id, true);
                uniqueResults.push(item);
            }
        }
        return uniqueResults;
    }

    _collectAllWords(node, currentWord) {
        let words = [];
        if (node.isEndOfWord) {
            words.push({ word: currentWord, facultyData: node.facultyData });
        }
        for (const char in node.children) {
            words = [...words, ...this._collectAllWords(node.children[char], currentWord + char)];
        }
        return words;
    }
}

module.exports = new Trie();
