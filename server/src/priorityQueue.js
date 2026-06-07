// Min-Heap Priority Queue & Queueing Theory Calculations

class PriorityQueue {
    constructor(comparator) {
        this.heap = [];
        this.comparator = comparator || ((a, b) => a - b);
    }

    size() {
        return this.heap.length;
    }

    peek() {
        return this.heap[0];
    }

    push(val) {
        this.heap.push(val);
        this.bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.size() === 0) return null;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.size() > 0) {
            this.heap[0] = bottom;
            this.sinkDown(0);
        }
        return top;
    }

    bubbleUp(idx) {
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2);
            if (this.comparator(this.heap[idx], this.heap[parentIdx]) >= 0) break;
            // Swap
            const temp = this.heap[idx];
            this.heap[idx] = this.heap[parentIdx];
            this.heap[parentIdx] = temp;
            idx = parentIdx;
        }
    }

    sinkDown(idx) {
        const length = this.heap.length;
        const element = this.heap[idx];
        while (true) {
            let leftChildIdx = 2 * idx + 1;
            let rightChildIdx = 2 * idx + 2;
            let leftChild, rightChild;
            let swapIdx = null;

            if (leftChildIdx < length) {
                leftChild = this.heap[leftChildIdx];
                if (this.comparator(leftChild, element) < 0) {
                    swapIdx = leftChildIdx;
                }
            }
            if (rightChildIdx < length) {
                rightChild = this.heap[rightChildIdx];
                if (
                    (swapIdx === null && this.comparator(rightChild, element) < 0) ||
                    (swapIdx !== null && this.comparator(rightChild, leftChild) < 0)
                ) {
                    swapIdx = rightChildIdx;
                }
            }

            if (swapIdx === null) break;
            this.heap[idx] = this.heap[swapIdx];
            this.heap[swapIdx] = element;
            idx = swapIdx;
        }
    }
}

// Map urgency to priority values (lower is higher priority)
const urgencyScores = {
    'High': 1,
    'Medium': 2,
    'Low': 3
};

// Map urgency to expected meeting duration (in minutes)
const serviceTimes = {
    'High': 20,
    'Medium': 15,
    'Low': 10
};

// Comparator for student queue entries
// Primary: Urgency (High > Medium > Low)
// Secondary: Check-in time (First-Come, First-Served)
const queueComparator = (a, b) => {
    const scoreA = urgencyScores[a.urgency] || 3;
    const scoreB = urgencyScores[b.urgency] || 3;
    if (scoreA !== scoreB) {
        return scoreA - scoreB;
    }
    return new Date(a.check_in_time) - new Date(b.check_in_time);
};

/**
 * Sorts active queue entries using the Heap and computes wait times.
 * Returns { sortedQueue, totalWaitTime, crowdLevel }
 */
function processQueue(entries) {
    const pq = new PriorityQueue(queueComparator);

    // Push all active entries to the priority queue
    entries.forEach(entry => pq.push(entry));

    const sortedQueue = [];
    let currentWait = 0;

    // Pop elements from heap one-by-one to get sorted order
    while (pq.size() > 0) {
        const item = pq.pop();
        item.wait_time_before = currentWait;
        // Service time for this item
        const duration = serviceTimes[item.urgency] || 15;
        currentWait += duration;
        sortedQueue.push(item);
    }

    // Determine crowd level
    let crowdLevel = 'Low';
    if (sortedQueue.length >= 4) {
        crowdLevel = 'High';
    } else if (sortedQueue.length >= 2) {
        crowdLevel = 'Moderate';
    }

    return {
        sortedQueue,
        totalWaitTime: currentWait,
        crowdLevel
    };
}

module.exports = {
    PriorityQueue,
    processQueue,
    serviceTimes
};
