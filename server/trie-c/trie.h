
#ifndef TRIE_H
#define TRIE_H

#include <stdbool.h>

#define ALPHABET_SIZE 256

typedef struct TrieNode {
    struct TrieNode *children[ALPHABET_SIZE];
    bool isEndOfWord;
} TrieNode;

// Function prototypes
TrieNode *createNode(void);
void insert(TrieNode *root, const char *key);
void searchPrefix(TrieNode *root, const char *prefix, char ***results, int *count);
void fuzzySearch(TrieNode *root, const char *query, int maxDistance, char ***results, int *count);
void freeTrie(TrieNode *root);

// Helper to free results array
void freeResults(char **results, int count);

#endif // TRIE_H
