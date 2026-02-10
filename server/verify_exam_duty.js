
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5001/api';

async function verify() {
    try {
        console.log('Verifying Exam Duty Feature...');

        // 1. Get a faculty ID
        console.log(`Fetching all faculty...`);
        let res = await axios.get(`${API_URL}/faculties`);
        if (res.data.length === 0) {
            console.error('❌ No faculty found in database. Run seed script first.');
            return;
        }
        const facultyId = res.data[0].id;
        console.log(`Using Faculty ID: ${facultyId} (${res.data[0].name})`);

        res = await axios.get(`${API_URL}/faculty/${facultyId}`);
        let faculty = res.data;
        console.log('Current Status:', faculty.status);

        // 2. Enable Exam Duty
        console.log('Enabling Exam Duty...');
        const testTime = '10:00 AM - 1:00 PM';
        res = await axios.put(`${API_URL}/faculty/${facultyId}`, {
            is_on_exam_duty: true,
            exam_duty_time: testTime
        });

        // 3. Verify Update
        res = await axios.get(`${API_URL}/faculty/${facultyId}`);
        faculty = res.data;

        if (faculty.is_on_exam_duty === true && faculty.exam_duty_time === testTime) {
            console.log('✅ Exam duty enabled successfully.');
        } else {
            console.error('❌ Failed to enable exam duty.', faculty);
        }

        if (faculty.status === 'Exam Duty') {
            console.log('✅ Status correctly inferred as "Exam Duty".');
        } else {
            console.error(`❌ Status inference failed. Expected "Exam Duty", got "${faculty.status}"`);
        }

        // 4. Disable Exam Duty
        console.log('Disabling Exam Duty...');
        res = await axios.put(`${API_URL}/faculty/${facultyId}`, {
            is_on_exam_duty: false,
            exam_duty_time: ''
        });

        // 5. Verify Clean up
        res = await axios.get(`${API_URL}/faculty/${facultyId}`);
        faculty = res.data;

        if (faculty.is_on_exam_duty === false) {
            console.log('✅ Exam duty disabled successfully.');
        } else {
            console.error('❌ Failed to disable exam duty.');
        }

    } catch (err) {
        console.error('Verification failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

verify();
