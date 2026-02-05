/* server/lib/SegmentTree.js */

class SegmentTree {
    constructor(size) {
        this.size = size; // e.g., minutes in a day (24 * 60 = 1440)
        this.tree = new Array(4 * size).fill(0);
        this.lazy = new Array(4 * size).fill(0);
    }

    // Update range [l, r] with value
    update(l, r, val) {
        this._update(1, 0, this.size - 1, l, r, val);
    }

    _update(node, start, end, l, r, val) {
        if (this.lazy[node] !== 0) {
            this.tree[node] += this.lazy[node];
            if (start !== end) {
                this.lazy[node * 2] += this.lazy[node];
                this.lazy[node * 2 + 1] += this.lazy[node];
            }
            this.lazy[node] = 0;
        }

        if (start > end || start > r || end < l) return;

        if (start >= l && end <= r) {
            this.tree[node] += val;
            if (start !== end) {
                this.lazy[node * 2] += val;
                this.lazy[node * 2 + 1] += val;
            }
            return;
        }

        const mid = Math.floor((start + end) / 2);
        this._update(node * 2, start, mid, l, r, val);
        this._update(node * 2 + 1, mid + 1, end, l, r, val);
        this.tree[node] = Math.max(this.tree[node * 2], this.tree[node * 2 + 1]);
    }

    // Query max value in range [l, r]
    // If max > 0, it means occupied (if we treat 1 as occupied)
    query(l, r) {
        return this._query(1, 0, this.size - 1, l, r);
    }

    _query(node, start, end, l, r) {
        if (start > end || start > r || end < l) return 0;

        if (this.lazy[node] !== 0) {
            this.tree[node] += this.lazy[node];
            if (start !== end) {
                this.lazy[node * 2] += this.lazy[node];
                this.lazy[node * 2 + 1] += this.lazy[node];
            }
            this.lazy[node] = 0;
        }

        if (start >= l && end <= r) return this.tree[node];

        const mid = Math.floor((start + end) / 2);
        const p1 = this._query(node * 2, start, mid, l, r);
        const p2 = this._query(node * 2 + 1, mid + 1, end, l, r);
        return Math.max(p1, p2);
    }
}

module.exports = SegmentTree;
