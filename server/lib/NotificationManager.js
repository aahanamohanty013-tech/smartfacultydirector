/* server/lib/NotificationManager.js */

class NotificationManager {
    constructor() {
        this.heap = [];
    }

    schedule(message, dueTime) {
        // dueTime: unix timestamp or date string converted to timestamp
        const notification = { message, dueTime: new Date(dueTime).getTime() };
        this.heap.push(notification);
        this._bubbleUp(this.heap.length - 1);
        return notification;
    }

    // Get all notifications that are due now (<= currentTime)
    getDueNotifications() {
        const now = Date.now();
        const due = [];

        while (!this.isEmpty() && this.peek().dueTime <= now) {
            due.push(this.dequeue());
        }
        return due;
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

    _bubbleUp(index) {
        // ... same MinHeap logic as PriorityQueue but comparing dueTime
        while (index > 0) {
            const pIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].dueTime < this.heap[pIndex].dueTime) {
                [this.heap[index], this.heap[pIndex]] = [this.heap[pIndex], this.heap[index]];
                index = pIndex;
            } else {
                break;
            }
        }
    }

    _bubbleDown(index) {
        const size = this.heap.length;
        while (true) {
            let smallest = index;
            const l = 2 * index + 1;
            const r = 2 * index + 2;

            if (l < size && this.heap[l].dueTime < this.heap[smallest].dueTime) {
                smallest = l;
            }
            if (r < size && this.heap[r].dueTime < this.heap[smallest].dueTime) {
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
}

module.exports = new NotificationManager();
