// Scheduler algorithms for appointments

// Helper to convert "HH:MM:SS" or "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
}

// Helper to convert minutes to "HH:MM"
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hStr = hours.toString().padStart(2, '0');
    const mStr = mins.toString().padStart(2, '0');
    return `${hStr}:${mStr}`;
}

// Helper to check if two intervals overlap
function overlaps(startA, endA, startB, endB) {
    return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Greedy Interval Scheduling (Earliest Finish Time First)
 * Schedules pending requests around already 'Scheduled' (locked) appointments.
 * Returns { scheduled, rejected }
 */
function scheduleAppointments(pendingRequests, lockedAppointments) {
    const scheduled = [...lockedAppointments];
    const rejected = [];

    // Sort pending requests by end_time ascending (Earliest Finish Time First)
    const sortedPending = [...pendingRequests].sort((a, b) => {
        const aEnd = timeToMinutes(a.end_time);
        const bEnd = timeToMinutes(b.end_time);
        return aEnd - bEnd;
    });

    for (const req of sortedPending) {
        const reqStart = timeToMinutes(req.start_time);
        const reqEnd = timeToMinutes(req.end_time);

        // Check if overlaps with any already scheduled appointments
        let hasOverlap = false;
        for (const sched of scheduled) {
            const schedStart = timeToMinutes(sched.start_time);
            const schedEnd = timeToMinutes(sched.end_time);
            if (overlaps(reqStart, reqEnd, schedStart, schedEnd)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            scheduled.push(req);
        } else {
            rejected.push(req);
        }
    }

    // Filter out the locked appointments from scheduled to return only newly scheduled ones
    const lockedIds = new Set(lockedAppointments.map(l => l.id));
    const newlyScheduled = scheduled.filter(s => !lockedIds.has(s.id));

    return {
        scheduled: newlyScheduled,
        rejected
    };
}

/**
 * Calculate recommended 30-minute quick meet slots on a given day.
 * Leaves the largest continuous block of free time.
 */
function getRecommendedQuickMeetSlots(timetables, appointments, day) {
    // Standard working window: 9:00 AM to 4:30 PM (540 mins to 990 mins)
    const dayStart = 540;
    const dayEnd = 990;
    const slotDuration = 30; // 30 minutes

    // 1. Gather all occupied intervals for the day
    const occupied = [];

    // Add timetable classes for the day
    timetables.forEach(t => {
        if (t.day_of_week.toLowerCase() === day.toLowerCase()) {
            occupied.push({
                start: timeToMinutes(t.start_time),
                end: timeToMinutes(t.end_time)
            });
        }
    });

    // Add approved/scheduled appointments for the day
    appointments.forEach(a => {
        if (a.day_of_week.toLowerCase() === day.toLowerCase() && a.status === 'Scheduled') {
            occupied.push({
                start: timeToMinutes(a.start_time),
                end: timeToMinutes(a.end_time)
            });
        }
    });

    // 2. Sort and merge occupied intervals
    occupied.sort((a, b) => a.start - b.start);
    const mergedOccupied = [];
    for (const interval of occupied) {
        if (mergedOccupied.length === 0) {
            mergedOccupied.push(interval);
        } else {
            const last = mergedOccupied[mergedOccupied.length - 1];
            if (interval.start <= last.end) {
                last.end = Math.max(last.end, interval.end);
            } else {
                mergedOccupied.push(interval);
            }
        }
    }

    // 3. Find complementary free intervals
    const freeIntervals = [];
    let currentStart = dayStart;

    for (const block of mergedOccupied) {
        if (block.start > currentStart) {
            // There's a free interval before this block
            const fStart = Math.max(dayStart, currentStart);
            const fEnd = Math.min(dayEnd, block.start);
            if (fEnd - fStart > 0) {
                freeIntervals.push({ start: fStart, end: fEnd });
            }
        }
        currentStart = Math.max(currentStart, block.end);
    }

    if (currentStart < dayEnd) {
        freeIntervals.push({ start: currentStart, end: dayEnd });
    }

    // 4. Generate recommended slots for each free interval
    // To preserve the largest continuous free block, slots should align to the boundaries.
    const recommendations = [];
    freeIntervals.forEach(interval => {
        const duration = interval.end - interval.start;
        if (duration >= slotDuration) {
            // Option 1: Start-aligned slot
            const slot1Start = interval.start;
            const slot1End = interval.start + slotDuration;
            recommendations.push({
                start_time: minutesToTime(slot1Start),
                end_time: minutesToTime(slot1End),
                remaining_continuous_mins: duration - slotDuration
            });

            // Option 2: End-aligned slot (only if it doesn't completely overlap with slot1)
            const slot2Start = interval.end - slotDuration;
            const slot2End = interval.end;
            if (slot2Start > slot1Start) {
                recommendations.push({
                    start_time: minutesToTime(slot2Start),
                    end_time: minutesToTime(slot2End),
                    remaining_continuous_mins: duration - slotDuration
                });
            }
        }
    });

    // Sort recommended slots by start time
    return recommendations.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
}

module.exports = {
    scheduleAppointments,
    getRecommendedQuickMeetSlots,
    timeToMinutes
};
