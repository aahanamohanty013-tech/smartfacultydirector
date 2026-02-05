/* server/lib/Graph.js */

class Graph {
    constructor() {
        this.adjacencyList = new Map();
    }

    addNode(id) {
        if (!this.adjacencyList.has(id)) {
            this.adjacencyList.set(id, new Set());
        }
    }

    addEdge(source, destination) {
        this.addNode(source);
        this.addNode(destination);
        this.adjacencyList.get(source).add(destination);
        this.adjacencyList.get(destination).add(source); // Undirected
    }

    // Recommendation Algorithm (Similar Faculty)
    // Basic idea: If A is connected to B (shared specialization), and B is connected to C,
    // then C might be relevant to A's user interactions?
    // OR simpler: Return neighbors (direct matches)
    recommend(id) {
        if (!this.adjacencyList.has(id)) return [];
        return Array.from(this.adjacencyList.get(id));
    }

    clear() {
        this.adjacencyList.clear();
    }

    // Build graph based on shared specializations
    buildFromFaculty(facultyList) {
        this.clear();
        // Create nodes
        facultyList.forEach(f => this.addNode(f.id));

        // Connect faculty with same/overlapping specializations
        for (let i = 0; i < facultyList.length; i++) {
            for (let j = i + 1; j < facultyList.length; j++) {
                const f1 = facultyList[i];
                const f2 = facultyList[j];

                // Check specialization overlap
                if (this._hasOverlap(f1.specialization, f2.specialization)) {
                    this.addEdge(f1.id, f2.id);
                }
            }
        }
    }

    _hasOverlap(spec1, spec2) {
        if (!spec1 || !spec2) return false;
        const s1 = spec1.toLowerCase().split(/[\s,]+/);
        const s2 = spec2.toLowerCase().split(/[\s,]+/);
        return s1.some(item => s2.includes(item));
    }
}

module.exports = new Graph();
