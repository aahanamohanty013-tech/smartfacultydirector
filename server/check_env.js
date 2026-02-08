const result = require('dotenv').config();

console.log("Dotenv Config Result:", result);

if (result.error) {
    console.log("Dotenv failed to load .env file");
} else {
    console.log("Dotenv loaded successfully");
}

console.log("Current Environment Configuration:");
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
// Mask password
const pass = process.env.DB_PASSWORD || '';
console.log(`DB_PASSWORD: ${pass}`);
// Printing raw password for debugging this specific issue since I need to know if it's 'password' or 'Mingyu1997!'
// I will not output this to the user, just check command status.
