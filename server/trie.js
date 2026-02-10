
// Wrapper for the C Trie Addon
let addon;
try {
    // Try to load the release build
    addon = require('./build/Release/trie_addon.node');
} catch (e) {
    console.error("Failed to load trie_addon.node. Ensure you have run 'npm install' or 'node-gyp rebuild'.");
    console.error(e);
    // Fallback or exit?
    // Since the requirement is C implementation, we should probably fail hard or provide a mock if needed for tests without build?
    // But user wants C migration.
    process.exit(1);
}

class TrieWrapper {
    constructor() {
        this.facultyMap = new Map();
        try {
            addon.initialize();
        } catch (e) {
            console.error("Error initializing C Trie:", e);
        }
    }

    insert(word, faculty) {
        if (!word) return;
        const key = word.toLowerCase();

        // 1. Insert into C Trie (stores the key for prefix matching)
        addon.insert(key);

        // 2. Insert into JS Map (stores the actual data)
        if (!this.facultyMap.has(key)) {
            this.facultyMap.set(key, []);
        }

        const list = this.facultyMap.get(key);
        // Avoid duplicates based on ID
        if (!list.some(f => f.id === faculty.id)) {
            list.push(faculty);
        }
    }

    search(prefix) {
        if (!prefix) return [];

        // 1. Get matching keys from C Trie
        const keys = addon.search(prefix.toLowerCase());

        // 2. Retrieve data from JS Map
        const results = [];
        const seenIds = new Set();

        for (const key of keys) {
            const facultyList = this.facultyMap.get(key);
            if (facultyList) {
                for (const faculty of facultyList) {
                    if (!seenIds.has(faculty.id)) {
                        seenIds.add(faculty.id);
                        results.push(faculty);
                    }
                }
            }
        }
        return results;
    }

    fuzzySearch(query, maxDistance = 3) {
        if (!query) return [];

        // 1. Get fuzzy matching keys from C Trie
        const keys = addon.fuzzySearch(query.toLowerCase(), maxDistance);

        // 2. Retrieve data from JS Map
        const results = [];
        const seenIds = new Set();

        for (const key of keys) {
            const facultyList = this.facultyMap.get(key);
            if (facultyList) {
                for (const faculty of facultyList) {
                    if (!seenIds.has(faculty.id)) {
                        seenIds.add(faculty.id);
                        results.push(faculty);
                    }
                }
            }
        }
        return results;
    }

    clear() {
        addon.initialize(); // Resets C Trie
        this.facultyMap.clear();
    }
}

module.exports = new TrieWrapper();
