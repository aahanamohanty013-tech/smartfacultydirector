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
}

module.exports = new Trie();
