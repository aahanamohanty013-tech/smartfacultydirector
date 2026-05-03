class IntervalScheduler {
    static parseTime(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    static formatTime(minutes) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    /**
     * Flexible Scheduler that shifts meeting times instead of outright rejecting them.
     * 
     * @param {Array} requests - Array of meeting requests: [{ id, start, end, title }]
     * @param {Array} existingBlocks - Array of existing blocked times: [{ start, end }]
     * @returns {Object} - { accepted: [], adjusted: [], rejected: [] }
     */
    static optimizeMeetings(requests, existingBlocks = []) {
        const accepted = [];
        const adjusted = [];
        const rejected = [];

        // Convert existing blocks to minutes
        const blockedIntervals = existingBlocks.map(b => ({
            start: this.parseTime(b.start),
            end: this.parseTime(b.end)
        }));

        // Sort requests by their original finish time
        const sortedRequests = [...requests].sort((a, b) => {
            const endA = this.parseTime(a.end);
            const endB = this.parseTime(b.end);
            if (endA !== endB) return endA - endB;
            return this.parseTime(a.start) - this.parseTime(b.start);
        });

        // Function to check if a specific time slot overlaps with ANY blocked interval
        const hasOverlap = (startMin, endMin) => {
            return blockedIntervals.some(block => {
                return startMin < block.end && endMin > block.start;
            });
        };

        for (const req of sortedRequests) {
            const reqStart = this.parseTime(req.start);
            const reqEnd = this.parseTime(req.end);
            const duration = reqEnd - reqStart;

            // 1. Try to schedule at the requested time
            if (!hasOverlap(reqStart, reqEnd)) {
                accepted.push(req);
                blockedIntervals.push({ start: reqStart, end: reqEnd });
            } else {
                // 2. Overlap found! Try to shift forward to the next available gap
                // Start searching from the requested start time up until end of day (e.g., 18:00 = 1080 mins)
                const END_OF_DAY = 18 * 60; 
                let searchStart = reqStart;
                let foundGap = false;

                // Sort blocked intervals to find gaps easily
                blockedIntervals.sort((a, b) => a.start - b.start);

                for (const block of blockedIntervals) {
                    // Only consider blocks that end after our searchStart
                    if (block.end <= searchStart) continue;

                    // Is there a gap between searchStart and this block's start?
                    if (block.start - searchStart >= duration) {
                        // We found a gap!
                        foundGap = true;
                        break; // Exit loop, searchStart is the valid new start
                    }

                    // Otherwise, jump our search start to the end of this block
                    searchStart = Math.max(searchStart, block.end);
                }

                // If no gap found between blocks, check if there's space after the LAST block until END_OF_DAY
                if (!foundGap && (END_OF_DAY - searchStart >= duration)) {
                    foundGap = true;
                }

                if (foundGap && searchStart + duration <= END_OF_DAY) {
                    // Shift the meeting
                    const newStartStr = this.formatTime(searchStart);
                    const newEndStr = this.formatTime(searchStart + duration);
                    
                    adjusted.push({
                        ...req,
                        start: newStartStr,
                        end: newEndStr,
                        original_start: req.start,
                        original_end: req.end
                    });
                    blockedIntervals.push({ start: searchStart, end: searchStart + duration });
                } else {
                    // No space left in the day
                    rejected.push(req);
                }
            }
        }

        return { accepted, adjusted, rejected };
    }
}

module.exports = IntervalScheduler;
