
const trie = require('./trie');
const assert = require('assert');

console.log('Testing C Trie Wrapper...');

// 1. Insert Data
console.log('Inserting data...');
const facultyData = [
    { id: 1, name: 'Alice Smith', dept: 'CS' },
    { id: 2, name: 'Bob Jones', dept: 'ECE' },
    { id: 3, name: 'Alice Cooper', dept: 'Music' }, // Same first name
    { id: 4, name: 'Prashant', dept: 'ECE' },
    { id: 5, name: 'Prashant Kumar', dept: 'ECE' } // Prefix match
];

facultyData.forEach(f => trie.insert(f.name, f));

// 2. Prefix Search
console.log('Testing Prefix Search...');
const search1 = trie.search('Ali');
console.log('Search "Ali":', search1.map(f => f.name));
assert.strictEqual(search1.length, 2);
assert.ok(search1.some(f => f.name === 'Alice Smith'));
assert.ok(search1.some(f => f.name === 'Alice Cooper'));

const search2 = trie.search('Pra');
console.log('Search "Pra":', search2.map(f => f.name));
assert.strictEqual(search2.length, 2);

const search3 = trie.search('Zzz');
assert.strictEqual(search3.length, 0);

console.log('Testing Fuzzy Search...');
// "Alice" vs "Alice Smith" distance is 6. maxDistance 0 -> no match.
const fuzzy0 = trie.fuzzySearch('Alice', 0);
assert.strictEqual(fuzzy0.length, 0);

const fuzzy1 = trie.fuzzySearch('Prashant', 0); // Exact match "prashant" exists
assert.strictEqual(fuzzy1.length, 1);
assert.strictEqual(fuzzy1[0].name, 'Prashant');

const fuzzy2 = trie.fuzzySearch('Prasant', 1); // 1 deletion
console.log('Fuzzy "Prasant" (dist 1):', fuzzy2.map(f => f.name));
assert.ok(fuzzy2.some(f => f.name === 'Prashant'));

// 4. Case Sensitivity
console.log('Testing Case Insensitivity...');
const case1 = trie.search('alice');
assert.strictEqual(case1.length, 2);

console.log('All tests passed!');
