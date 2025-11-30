/**
 * Banker's Algorithm Logic
 * Handles safety checks and resource request validation.
 */

const Bankers = {
    /**
     * Calculates the Need matrix for all processes.
     * Need[i][j] = Max[i][j] - Allocation[i][j]
     */
    calculateNeed() {
        const processes = nodes.filter(n => n.type === 'process');
        const resources = nodes.filter(n => n.type === 'resource');
        const need = {}; // Map<ProcessId, Map<ResourceId, Count>>

        processes.forEach(p => {
            need[p.id] = {};
            resources.forEach(r => {
                const max = (p.maxClaim && p.maxClaim[r.id]) || 0;
                // Count current allocation from edges
                const allocation = edges.filter(e => e.source === r.id && e.target === p.id).length;
                need[p.id][r.id] = Math.max(0, max - allocation);
            });
        });

        return need;
    },

    /**
     * Calculates the Available vector.
     * Available[j] = Capacity[j] - TotalAllocation[j]
     */
    calculateAvailable() {
        const resources = nodes.filter(n => n.type === 'resource');
        const available = {}; // Map<ResourceId, Count>

        resources.forEach(r => {
            const totalAllocated = edges.filter(e => e.source === r.id).length;
            available[r.id] = Math.max(0, r.capacity - totalAllocated);
        });

        return available;
    },

    /**
     * Checks if the current system state is safe.
     * Returns { safe: boolean, sequence: [], log: [] }
     */
    checkSafety() {
        const processes = nodes.filter(n => n.type === 'process');
        const resources = nodes.filter(n => n.type === 'resource');

        // 1. Init Work and Finish
        let work = this.calculateAvailable(); // Clone of Available
        const finish = {}; // Map<ProcessId, Boolean>
        processes.forEach(p => finish[p.id] = false);

        const safeSequence = [];
        const log = [];
        let count = 0;

        while (count < processes.length) {
            let found = false;

            for (const p of processes) {
                if (!finish[p.id]) {
                    // Check if Need <= Work for all resources
                    const need = this.calculateNeed()[p.id];
                    let canAllocate = true;

                    for (const r of resources) {
                        if (need[r.id] > work[r.id]) {
                            canAllocate = false;
                            break;
                        }
                    }

                    if (canAllocate) {
                        // "Allocate" resources, process finishes, returns resources to Work
                        const allocation = {};
                        resources.forEach(r => {
                            allocation[r.id] = edges.filter(e => e.source === r.id && e.target === p.id).length;
                            work[r.id] += allocation[r.id];
                        });

                        safeSequence.push(p);
                        finish[p.id] = true;
                        found = true;
                        count++;
                        log.push(`Process ${p.label} can finish. Work updated.`);
                    }
                }
            }

            if (!found) {
                log.push("No process can satisfy its needs with available resources.");
                break;
            }
        }

        const isSafe = count === processes.length;
        return {
            safe: isSafe,
            sequence: safeSequence,
            log: log
        };
    }
};

// Expose to window
window.Bankers = Bankers;
