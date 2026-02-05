/* server/lib/PriorityQueue.js */
class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    // Helper to get parent index
    parent(i) { return Math.floor((i - 1) / 2); }
    // Helper to get left child
    left(i) { return 2 * i + 1; }
    // Helper to get right child
    right(i) { return 2 * i + 2; }

    enqueue(studentName, urgency) {
        // urgency: lower number = higher priority (1: High, 2: Medium, 3: Low)
        const node = { studentName, urgency, timestamp: Date.now() };
        this.heap.push(node);
        this._bubbleUp(this.heap.length - 1);
        return node;
    }

    dequeue() {
        if (this.isEmpty()) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const root = this.heap[0];
        this.heap[0] = this.heap.pop();
        this._bubbleDown(0);
        return root;
    }

    peek() {
        return this.isEmpty() ? null : this.heap[0];
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    // Move element up to maintain heap property
    _bubbleUp(index) {
        while (index > 0) {
            const pIndex = this.parent(index);
            if (this._compare(this.heap[index], this.heap[pIndex]) < 0) {
                [this.heap[index], this.heap[pIndex]] = [this.heap[pIndex], this.heap[index]];
                index = pIndex;
            } else {
                break;
            }
        }
    }

    // Move element down to maintain heap property
    _bubbleDown(index) {
        const size = this.heap.length;
        while (true) {
            let smallest = index;
            const l = this.left(index);
            const r = this.right(index);

            if (l < size && this._compare(this.heap[l], this.heap[smallest]) < 0) {
                smallest = l;
            }
            if (r < size && this._compare(this.heap[r], this.heap[smallest]) < 0) {
                smallest = r;
            }

            if (smallest !== index) {
                [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
                index = smallest;
            } else {
                break;
            }
        }
    }

    // Custom comparator: Prioritize urgency (asc), then timestamp (asc)
    _compare(a, b) {
        if (a.urgency !== b.urgency) {
            return a.urgency - b.urgency;
        }
        return a.timestamp - b.timestamp; // FIFO for same priority
    }
}

module.exports = new PriorityQueue(); // Singleton for simplicity
