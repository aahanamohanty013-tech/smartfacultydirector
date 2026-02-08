const http = require('http');

const data = JSON.stringify({
    name: 'Test User',
    shortform: 'TU', // Shortform must be unique? 
    specialization: 'Testing',
    password: 'password123',
    email: `test_user_${Date.now()}@example.com`
});

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`StatusCode: ${res.statusCode}`);
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
