
#include <node_api.h>
#include <stdlib.h>
#include <string.h>
#include "trie.h"

// Global root for the Trie
TrieNode *root = NULL;

// Helper to check arguments
napi_status check_args(napi_env env, napi_callback_info info, size_t expected_count, napi_value *args) {
    size_t argc = expected_count;
    napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    if (status != napi_ok || argc < expected_count) {
        napi_throw_type_error(env, NULL, "Wrong number of arguments");
        return napi_invalid_arg;
    }
    return napi_ok;
}

// initialize() - Clears/Resets the Trie
napi_value Initialize(napi_env env, napi_callback_info info) {
    if (root) {
        freeTrie(root);
    }
    root = createNode();
    return NULL;
}

// insert(word)
napi_value Insert(napi_env env, napi_callback_info info) {
    napi_value args[1];
    if (check_args(env, info, 1, args) != napi_ok) return NULL;

    size_t str_len;
    napi_get_value_string_utf8(env, args[0], NULL, 0, &str_len);
    char *word = (char *)malloc(str_len + 1);
    napi_get_value_string_utf8(env, args[0], word, str_len + 1, &str_len);

    if (!root) root = createNode();
    insert(root, word);
    
    free(word);
    return NULL;
}

// search(prefix) -> string[]
napi_value Search(napi_env env, napi_callback_info info) {
    napi_value args[1];
    if (check_args(env, info, 1, args) != napi_ok) return NULL;

    size_t str_len;
    napi_get_value_string_utf8(env, args[0], NULL, 0, &str_len);
    char *prefix = (char *)malloc(str_len + 1);
    napi_get_value_string_utf8(env, args[0], prefix, str_len + 1, &str_len);

    if (!root) root = createNode();

    char **results = NULL;
    int count = 0;
    searchPrefix(root, prefix, &results, &count);

    napi_value js_array;
    napi_create_array_with_length(env, count, &js_array);

    for (int i = 0; i < count; i++) {
        napi_value js_string;
        napi_create_string_utf8(env, results[i], NAPI_AUTO_LENGTH, &js_string);
        napi_set_element(env, js_array, i, js_string);
        free(results[i]);
    }
    free(results);
    free(prefix);

    return js_array;
}

// fuzzySearch(word, maxDistance) -> string[]
napi_value FuzzySearch(napi_env env, napi_callback_info info) {
    napi_value args[2];
    if (check_args(env, info, 2, args) != napi_ok) return NULL;

    size_t str_len;
    napi_get_value_string_utf8(env, args[0], NULL, 0, &str_len);
    char *word = (char *)malloc(str_len + 1);
    napi_get_value_string_utf8(env, args[0], word, str_len + 1, &str_len);

    int32_t maxDistance;
    napi_get_value_int32(env, args[1], &maxDistance);

    if (!root) root = createNode();

    char **results = NULL;
    int count = 0;
    fuzzySearch(root, word, maxDistance, &results, &count);

    napi_value js_array;
    napi_create_array_with_length(env, count, &js_array);

    for (int i = 0; i < count; i++) {
        napi_value js_string;
        napi_create_string_utf8(env, results[i], NAPI_AUTO_LENGTH, &js_string);
        napi_set_element(env, js_array, i, js_string);
        free(results[i]);
    }
    free(results);
    free(word);

    return js_array;
}

// Module initialization
napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        {"initialize", 0, Initialize, 0, 0, 0, napi_default, 0},
        {"insert", 0, Insert, 0, 0, 0, napi_default, 0},
        {"search", 0, Search, 0, 0, 0, napi_default, 0},
        {"fuzzySearch", 0, FuzzySearch, 0, 0, 0, napi_default, 0}
    };
    napi_define_properties(env, exports, 4, desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
