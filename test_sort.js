const faculties = [
    { id: 1, name: 'Zebra', department: 'Computer Science' },
    { id: 2, name: 'Apple', department: 'Computer Science' },
    { id: 3, name: 'Mango', department: 'Electronics and Communication' },
];

const selectedDepartment = 'All';

const filtered = (selectedDepartment === 'All'
    ? faculties
    : faculties.filter(f => f.department === selectedDepartment)
).sort((a, b) => a.name.localeCompare(b.name));

console.log('Sorted Results:');
filtered.forEach(f => console.log(f.name));

if (filtered[0].name === 'Apple' && filtered[2].name === 'Zebra') {
    console.log('Sort Logic Success');
} else {
    console.log('Sort Logic Failed');
}
