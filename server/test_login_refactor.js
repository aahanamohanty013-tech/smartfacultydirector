const http = require('http');

const runRequest = (path, method, body) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, res => {
            let responseBody = '';
            res.on('data', d => responseBody += d);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: responseBody });
            });
        });

        req.on('error', error => reject(error));
        req.write(data);
        req.end();
    });
};

async function test() {
    const timestamp = Date.now();
    const userA = {
        name: 'John Doe',
        email: `john_${timestamp}@rvce.edu.in`,
        shortform: `JD_${timestamp}`,
        specialization: 'AI',
        password: 'password123'
    };

    // User B: Same Name, Diff Email, Diff Shortform
    const userB = {
        name: 'John Doe', // Same Name
        email: `john_diff_${timestamp}@rvce.edu.in`,
        shortform: `JD2_${timestamp}`,
        specialization: 'ML',
        password: 'password123'
    };

    // User C: Diff Name, Diff Email, SAME Shortform as A
    const userC = {
        name: 'Jane Doe',
        email: `jane_${timestamp}@rvce.edu.in`,
        shortform: `JD_${timestamp}`, // DUPLICATE Shortform
        specialization: 'Networks',
        password: 'password123'
    };

    console.log('--- User A Signup (Should Pass) ---');
    try {
        const resA = await runRequest('/signup', 'POST', userA);
        console.log(`Status: ${resA.statusCode}`);
        console.log(`Body: ${resA.body}`);
        if (resA.statusCode !== 200) throw new Error('User A Signup Failed');
    } catch (e) {
        console.error(e);
        return;
    }

    console.log('\n--- User B Signup (Same Name - Should Pass) ---');
    try {
        const resB = await runRequest('/signup', 'POST', userB);
        console.log(`Status: ${resB.statusCode}`);
        console.log(`Body: ${resB.body}`);
        if (resB.statusCode !== 200) console.error('FAIL: User B should have succeeded');
        else console.log('PASS: Duplicate name allowed');
    } catch (e) { console.error(e); }

    console.log('\n--- User C Signup (Duplicate Shortform - Should Fail) ---');
    try {
        const resC = await runRequest('/signup', 'POST', userC);
        console.log(`Status: ${resC.statusCode}`);
        console.log(`Body: ${resC.body}`);
        if (resC.statusCode === 400 && resC.body.includes('Shortform')) console.log('PASS: Duplicate shortform blocked');
        else console.error('FAIL: User C should have failed with shortform error');
    } catch (e) { console.error(e); }

    console.log('\n--- Login User A (Using Email - Should Pass) ---');
    try {
        const loginData = { email: userA.email, password: userA.password };
        const resLogin = await runRequest('/login', 'POST', loginData);
        console.log(`Status: ${resLogin.statusCode}`);
        console.log(`Body: ${resLogin.body}`);
        // Note: Login might verify email first?
        if (resLogin.body.includes('verify your email')) {
            console.log('PASS: Login recognized email (asking for verification)');
        } else if (resLogin.statusCode === 200) {
            console.log('PASS: Login successful');
        } else {
            console.error('FAIL: Login failed');
        }
    } catch (e) { console.error(e); }
}

test();
