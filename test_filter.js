const faculties = [
    { id: 1, name: 'Test 1', department: 'Electronics and Communication' },
    { id: 2, name: 'Test 2', department: 'Computer Science' },
    { id: 3, name: 'Test 3', department: ' Electronics and Communication ' }, // with spaces
    { id: 4, name: 'Test 4', department: 'ECM' }
];

const selectedDepartment = 'ECE Dept';

const filtered = faculties.filter(f => {
    if (selectedDepartment === 'ECE Dept') {
        const match = f.department?.trim() === 'Electronics and Communication' || f.department?.includes('Electronics');
        console.log(`Checking ${f.name} (${f.department}): ${match}`);
        return match;
    }
    return f.department === selectedDepartment;
});

console.log('Filtered Results:', filtered.length);
