const trie = require('./trie');
const priorityQueue = require('./lib/PriorityQueue');
const IntervalTree = require('./lib/IntervalTree');
const graph = require('./lib/Graph');
const scheduler = require('./lib/Scheduler');
const SegmentTree = require('./lib/SegmentTree');
const notificationManager = require('./lib/NotificationManager');

// Mock Data
const facultyCheck = { id: 1, name: "Prashant Kumar" };
const mockFacultyList = [
    { id: 1, name: "Prashant Kumar", specialization: "AI, Machine Learning" },
    { id: 2, name: "Sunil Gupta", specialization: "Machine Learning, Data Science" },
    { id: 3, name: "Anjali Singh", specialization: "Web Development" }
];

async function testAll() {
    console.log("=== Testing Features ===\n");

    // 1. Fuzzy Search
    console.log("--- 1. Fuzzy Search ---");
    trie.clear();
    mockFacultyList.forEach(f => trie.insert(f.name, f));
    const searchRes = trie.fuzzySearch("Prahsant"); // Typo
    console.log(`Query: 'Prahsant' -> Result: ${searchRes.length > 0 ? searchRes[0].name : 'None'} (Expected: Prashant Kumar)`);
    console.log(searchRes.length > 0 && searchRes[0].name === "Prashant Kumar" ? "PASS" : "FAIL");
    console.log("");

    // 2. Priority Queue
    console.log("--- 2. Priority Queue ---");
    priorityQueue.enqueue("Alice", 2); // Medium
    priorityQueue.enqueue("Bob", 1);   // High
    priorityQueue.enqueue("Charlie", 3); // Low
    const next = priorityQueue.dequeue();
    console.log(`Dequeued: ${next.studentName} (urgency ${next.urgency}) (Expected: Bob)`);
    console.log(next.studentName === "Bob" ? "PASS" : "FAIL");
    console.log("");

    // 3. Meeting Scheduler (Interval Trees)
    console.log("--- 3. Meeting Scheduler ---");
    const tree = new IntervalTree();
    tree.insert("09:00", "10:00");
    tree.insert("11:00", "12:00");
    const gaps = tree.findGaps("09:00", "17:00");
    console.log("Gaps found:", gaps.map(g => `${g.start}-${g.end}`));
    // Expected: 10:00-11:00, 12:00-17:00
    const hasGap = gaps.some(g => g.start === "10:00" && g.end === "11:00");
    console.log(hasGap ? "PASS" : "FAIL");
    console.log("");

    // 4. Faculty Recommendations (Graph)
    console.log("--- 4. Faculty Recommendations ---");
    graph.buildFromFaculty(mockFacultyList);
    const recs = graph.recommend(1); // Prashant (AI, ML)
    console.log(`Recommendations for Prashant: ${recs.join(", ")} (Expected: 2 [Sunil])`);
    console.log(recs.includes(2) && !recs.includes(3) ? "PASS" : "FAIL");
    console.log("");

    // 5. Timetable Optimizer
    console.log("--- 5. Timetable Optimizer ---");
    const courses = [{ id: 101, name: "CS101", facultyId: 1, hours: 1 }];
    const existing = [{ day_of_week: "Monday", start_time: "09:00", end_time: "10:00", faculty_id: 1 }];
    const optimized = scheduler.optimize(courses, existing);
    if (optimized && optimized.length > 0) {
        console.log(`Scheduled CS101 at ${optimized[0].day} ${optimized[0].time}`);
        // Should NOT be Mon 09:00
        const conflict = optimized[0].day === "Monday" && optimized[0].time === "09:00";
        console.log(!conflict ? "PASS" : "FAIL");
    } else {
        console.log("Optimization failed to find slot");
        console.log("FAIL");
    }
    console.log("");

    // 6. Conflict Detector (Segment Tree)
    console.log("--- 6. Conflict Detector ---");
    const segTree = new SegmentTree(24); // smaller scale for test: hours
    segTree.update(9, 10, 1); // Occupy 9-10
    const conflictVal = segTree.query(9, 9); // Query 9
    console.log(`Query(9,9): ${conflictVal} (Expected: > 0)`);
    console.log(conflictVal > 0 ? "PASS" : "FAIL");
    console.log("");

    // 7. Smart Notifications
    console.log("--- 7. Smart Notifications ---");
    notificationManager.schedule("Test Msg", Date.now() - 1000); // Past due
    const due = notificationManager.getDueNotifications();
    console.log(`Due notifications: ${due.length} (Expected: 1)`);
    console.log(due.length === 1 ? "PASS" : "FAIL");
    console.log("");
}

testAll();
