const http = require('http');

const testCases = [
    {
        name: 'Invalid Domain',
        data: {
            name: 'Invalid User',
            shortform: 'INV',
            specialization: 'Testing',
            password: 'password123',
            email: `test_inv_${Date.now()}@example.com`
        },
        expectedStatus: 400
    },
    {
        name: 'Valid Domain',
        data: {
            name: 'Valid User',
            shortform: 'VAL',
            specialization: 'Testing',
            password: 'password123',
            email: `test_val_${Date.now()}@rvce.edu.in`
        },
        expectedStatus: 200
    }
];

function runTest(testCase) {
    const data = JSON.stringify(testCase.data);
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
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log(`Test: ${testCase.name}`);
            console.log(`Status: ${res.statusCode} (Expected: ${testCase.expectedStatus})`);
            console.log('Response:', body);
            if (res.statusCode === testCase.expectedStatus) {
                console.log('PASS\n');
            } else {
                console.log('FAIL\n');
            }
        });
    });

    req.on('error', error => {
        console.error(`Error in ${testCase.name}:`, error);
    });

    req.write(data);
    req.end();
}

testCases.forEach((testCase, index) => {
    setTimeout(() => runTest(testCase), index * 1000);
});
