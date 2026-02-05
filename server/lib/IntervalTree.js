/* server/lib/IntervalTree.js */

class IntervalNode {
    constructor(start, end, data) {
        this.start = start;
        this.end = end;
        this.max = end; // max end time in subtree
        this.data = data; // e.g., course name or null for free slot logic
        this.left = null;
        this.right = null;
    }
}

class IntervalTree {
    constructor() {
        this.root = null;
    }

    insert(start, end, data = null) {
        this.root = this._insert(this.root, start, end, data);
    }

    _insert(node, start, end, data) {
        if (!node) {
            return new IntervalNode(start, end, data);
        }

        // Standard BST insert on 'start'
        if (start < node.start) {
            node.left = this._insert(node.left, start, end, data);
        } else {
            node.right = this._insert(node.right, start, end, data);
        }

        // Update max end time in subtree
        if (node.max < end) {
            node.max = end;
        }

        return node;
    }

    // Find all intervals that overlap with [start, end]
    query(start, end) {
        const result = [];
        this._query(this.root, start, end, result);
        return result;
    }

    _query(node, start, end, result) {
        if (!node) return;

        // Overlap condition: start < node.end && end > node.start
        if (start < node.end && end > node.start) {
            result.push({ start: node.start, end: node.end, data: node.data });
        }

        // Optimization: if left child's max is less than query start, no need to search left
        if (node.left && node.left.max > start) {
            this._query(node.left, start, end, result);
        }

        // Search right if query end is greater than node start (standard BST logic)
        // Actually, just always search right if we haven't ruled it out?
        // Simpler: standard interval tree logic
        if (node.right && node.start < end) {
            this._query(node.right, start, end, result);
        }
    }

    // Find gaps (free slots) between [dayStart, dayEnd] given existing intervals
    findGaps(dayStart, dayEnd) {
        // Flatten tree to sorted list
        const intervals = [];
        this._inOrder(this.root, intervals);
        intervals.sort((a, b) => a.start - b.start);

        const gaps = [];
        let current = dayStart;

        for (const interval of intervals) {
            // If there is space between current time and next interval start
            if (current < interval.start) {
                gaps.push({ start: current, end: interval.start });
            }
            // Move current pointer forward to end of this interval if it's further
            if (interval.end > current) {
                current = interval.end;
            }
        }

        // Final gap
        if (current < dayEnd) {
            gaps.push({ start: current, end: dayEnd });
        }

        return gaps;
    }

    _inOrder(node, list) {
        if (!node) return;
        this._inOrder(node.left, list);
        list.push({ start: node.start, end: node.end });
        this._inOrder(node.right, list);
    }
}

module.exports = IntervalTree;
