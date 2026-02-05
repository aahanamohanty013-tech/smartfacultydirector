/* server/lib/Scheduler.js */

class Scheduler {
    constructor() {
        // days: Mon-Fri
        this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        // periods: 9-5
        this.periods = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    }

    // Backtracking algorithm to schedule courses
    // courses: [{ id, name, hoursNeeded, facultyId }]
    // existingTimetable: [{ day, time, facultyId }] - Constraints
    optimize(courses, existingTimetable) {
        const schedule = []; // resulting assignments
        const blocked = new Set(); // "Day-Time-Faculty" strings

        // Populate blocked set
        existingTimetable.forEach(t => {
            blocked.add(`${t.day_of_week}-${t.start_time.slice(0, 5)}-${t.faculty_id}`);
        });

        const success = this._backtrack(courses, 0, schedule, blocked);
        return success ? schedule : null;
    }

    _backtrack(courses, index, schedule, blocked) {
        if (index === courses.length) {
            return true; // All courses scheduled
        }

        const course = courses[index];
        // For simplicity, assume each course needs 1 hour blocks. 
        // Realistically, would loop 'hoursNeeded' times, but let's just schedule one slot per course object for now.
        // Or if we split courses into 1-hour chunks beforehand.

        for (const day of this.days) {
            for (const time of this.periods) {
                const key = `${day}-${time}-${course.facultyId}`;

                if (!blocked.has(key)) {
                    // Try this slot
                    blocked.add(key);
                    schedule.push({ ...course, day, time });

                    if (this._backtrack(courses, index + 1, schedule, blocked)) {
                        return true;
                    }

                    // Backtrack
                    schedule.pop();
                    blocked.delete(key);
                }
            }
        }

        return false; // No valid slot found for this course
    }
}

module.exports = new Scheduler();
