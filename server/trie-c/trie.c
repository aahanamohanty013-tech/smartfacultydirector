
#include "trie.h"
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdio.h>

// Create a new Trie node
TrieNode *createNode(void) {
    TrieNode *pNode = (TrieNode *)malloc(sizeof(TrieNode));
    pNode->isEndOfWord = false;
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        pNode->children[i] = NULL;
    }
    return pNode;
}

// Convert char to index (using unsigned char for full ASCII support)
// For simplicity, we just cast to unsigned char as index
int charToIndex(char c) {
    return (unsigned char)tolower(c);
}

// Insert a key into the trie
void insert(TrieNode *root, const char *key) {
    TrieNode *pCrawl = root;
    for (int i = 0; key[i] != '\0'; i++) {
        int index = charToIndex(key[i]);
        if (!pCrawl->children[index]) {
            pCrawl->children[index] = createNode();
        }
        pCrawl = pCrawl->children[index];
    }
    pCrawl->isEndOfWord = true;
}

// Helper to collect all words from a node
void collectWords(TrieNode *node, char *buffer, int depth, char ***results, int *count, int *capacity) {
    if (node->isEndOfWord) {
        if (*count >= *capacity) {
            *capacity *= 2;
            *results = (char **)realloc(*results, (*capacity) * sizeof(char *));
        }
        buffer[depth] = '\0';
        (*results)[*count] = strdup(buffer);
        (*count)++;
    }

    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (node->children[i]) {
            buffer[depth] = (char)i;
            collectWords(node->children[i], buffer, depth + 1, results, count, capacity);
        }
    }
}

// Search for a prefix
void searchPrefix(TrieNode *root, const char *prefix, char ***results, int *count) {
    TrieNode *pCrawl = root;
    *count = 0;
    int capacity = 10;
    *results = (char **)malloc(capacity * sizeof(char *));
    
    // Navigate to end of prefix
    for (int i = 0; prefix[i] != '\0'; i++) {
        int index = charToIndex(prefix[i]);
        if (!pCrawl->children[index]) {
            return; // Prefix not found
        }
        pCrawl = pCrawl->children[index];
    }

    // Collect all words from here
    char buffer[1024];
    strcpy(buffer, prefix); // Start buffer with prefix
    // Lowercase the prefix in buffer to match internal storage if needed, 
    // but we want to return what is stored. Ideally we stored lowercase.
    // The insert function lowercases the index. The collected word will be reconstructed from indices.
    // So the buffer needs to be reconstructed from path or just append.
    // Wait, the indices ARE the characters.
    
    // Correct approach: The path IS the word.
    // When collecting, we need the full word.
    // So we need to pass the prefix to collectWords or reconstruct it.
    // My collectWords assumes buffer is built from root? No, from 'node'.
    // So we need to put the prefix into buffer first.
    
    // Re-verify charToIndex implementation. currently plain cast.
    // If I insert "TeSt", key[0]='T' -> index 't'.
    // So the path stores lowercase.
    // When retrieving, we get 't', 'e', 's', 't'. 
    // This loses casing. That IS a limitation of standard tries unless we store the original string at the node.
    // But for search, we usually want the ID or original string.
    // JS implementation stored `facultyData` at the node.
    // Here, we only return the *keys* (lower-cased names).
    // The JS wrapper will map `lower-cased-name` -> `FacultyData[]`.
    // So returning lower-cased strings is FINE.
    
    // However, I need to make sure buffer has the prefix.
    int prefixLen = strlen(prefix);
    for(int i=0; i<prefixLen; i++) {
        buffer[i] = (char)tolower(prefix[i]);
    }

    collectWords(pCrawl, buffer, prefixLen, results, count, &capacity);
}


// Levenshtein distance helper
int min3(int a, int b, int c) {
    if (a < b && a < c) return a;
    if (b < c) return b;
    return c;
}

// Recursive function for fuzzy search
void fuzzySearchRecursive(TrieNode *node, char ch, const char *word, int *row, int wordLen, int maxDist, char *buffer, int depth, char ***results, int *count, int *capacity) {
    int columns = wordLen + 1;
    int *newRow = (int *)malloc(columns * sizeof(int));
    newRow[0] = row[0] + 1;

    for (int i = 1; i < columns; i++) {
        int insertCost = newRow[i - 1] + 1;
        int deleteCost = row[i] + 1;
        int replaceCost = row[i - 1];
        if (word[i - 1] != ch) {
            replaceCost += 1;
        }
        newRow[i] = min3(insertCost, deleteCost, replaceCost);
    }

    if (newRow[wordLen] <= maxDist && node->isEndOfWord) {
         if (*count >= *capacity) {
            *capacity *= 2;
            *results = (char **)realloc(*results, (*capacity) * sizeof(char *));
        }
        buffer[depth] = '\0';
        (*results)[*count] = strdup(buffer); // Buffer contains the MATCHING word from Trie
        (*count)++;
    }

    int minRow = newRow[0];
    for (int i = 1; i < columns; i++) {
        if (newRow[i] < minRow) minRow = newRow[i];
    }

    if (minRow <= maxDist) {
        for (int i = 0; i < ALPHABET_SIZE; i++) {
            if (node->children[i]) {
                buffer[depth] = (char)i;
                fuzzySearchRecursive(node->children[i], (char)i, word, newRow, wordLen, maxDist, buffer, depth + 1, results, count, capacity);
            }
        }
    }

    free(newRow);
}

void fuzzySearch(TrieNode *root, const char *query, int maxDistance, char ***results, int *count) {
    *count = 0;
    int capacity = 10;
    *results = (char **)malloc(capacity * sizeof(char *));

    int wordLen = strlen(query);
    int *currentRow = (int *)malloc((wordLen + 1) * sizeof(int));
    for (int i = 0; i <= wordLen; i++) {
        currentRow[i] = i;
    }

    char buffer[1024];
    
    // We iterate over children of root to start the recursion
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (root->children[i]) {
            buffer[0] = (char)i;
            fuzzySearchRecursive(root->children[i], (char)i, query, currentRow, wordLen, maxDistance, buffer, 1, results, count, &capacity);
        }
    }

    free(currentRow);
}

void freeTrie(TrieNode *root) {
    if (!root) return;
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        freeTrie(root->children[i]);
    }
    free(root);
}

void freeResults(char **results, int count) {
    if (!results) return;
    for (int i = 0; i < count; i++) {
        free(results[i]);
    }
    free(results);
}
