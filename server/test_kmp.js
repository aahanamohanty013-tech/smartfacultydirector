const KMP = require('./lib/KMP');

console.log("=== Testing KMP Algorithm ===");

const testCases = [
    {
        text: "Signal Processing, Image processing, Flexible Electronics",
        pattern: "Image Processing",
        expected: true,
        desc: "Exact match in middle (case insensitive)"
    },
    {
        text: "Signal Processing, Image processing, Flexible Electronics",
        pattern: "Machine Learning",
        expected: false,
        desc: "Pattern not found"
    },
    {
        text: "Artificial Intelligence and Machine Learning",
        pattern: "machine",
        expected: true,
        desc: "Substring match"
    },
    {
        text: "AABZAABZAAAABZAABZ",
        pattern: "AABZ",
        expected: true,
        desc: "Repeating pattern"
    },
    {
        text: "Short",
        pattern: "Longer Pattern",
        expected: false,
        desc: "Pattern longer than text"
    }
];

let allPassed = true;

testCases.forEach((tc, idx) => {
    const result = KMP.search(tc.text, tc.pattern);
    const passed = result === tc.expected;
    console.log(`Test ${idx + 1}: ${tc.desc}`);
    console.log(`Text: "${tc.text}" | Pattern: "${tc.pattern}"`);
    console.log(`Expected: ${tc.expected} | Got: ${result}`);
    if (passed) {
        console.log("✅ Passed\n");
    } else {
        console.log("❌ Failed\n");
        allPassed = false;
    }
});

if (allPassed) {
    console.log("All tests passed! 🎉");
} else {
    console.log("Some tests failed. Check logic.");
}
