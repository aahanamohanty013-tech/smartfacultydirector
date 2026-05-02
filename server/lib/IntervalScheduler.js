class IntervalScheduler {
    /**
     * Finds the maximum number of non-overlapping meetings using the 
     * Greedy Strategy (Earliest Finish Time First).
     * 
     * @param {Array} requests - Array of meeting requests: [{ id, start, end, title }]
     * @param {Array} existingBlocks - Array of existing blocked times: [{ start, end }]
     * @returns {Array} - The selected optimal meeting requests
     */
    static optimizeMeetings(requests, existingBlocks = []) {
        // 1. Filter out requests that overlap with existing blocks
        const validRequests = requests.filter(req => {
            // A request is invalid if it overlaps with ANY existing block
            for (const block of existingBlocks) {
                // Overlap condition: req.start < block.end AND req.end > block.start
                if (req.start < block.end && req.end > block.start) {
                    return false; 
                }
            }
            return true;
        });

        // 2. Sort valid requests by their Finish Time (Earliest Finish Time First)
        const sortedRequests = [...validRequests].sort((a, b) => {
            if (a.end < b.end) return -1;
            if (a.end > b.end) return 1;
            // If end times are the same, prefer the one that starts earlier
            if (a.start < b.start) return -1;
            if (a.start > b.start) return 1;
            return 0;
        });

        const selectedMeetings = [];
        let lastEndTime = "00:00";

        // 3. Greedily select the non-overlapping meetings
        for (const req of sortedRequests) {
            // If the meeting starts after or at the exact time the last one ended
            if (req.start >= lastEndTime) {
                selectedMeetings.push(req);
                lastEndTime = req.end; // Update the last end time
            }
        }

        return selectedMeetings;
    }
}

module.exports = IntervalScheduler;
