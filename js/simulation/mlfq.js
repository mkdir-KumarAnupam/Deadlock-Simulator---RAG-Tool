/**
 * Multilevel Feedback Queue (MLFQ) Scheduler
 *
 * Rules:
 * 1. Three Queues:
 *    - Q1: High Priority (RR, Quantum = 4)
 *    - Q2: Medium Priority (RR, Quantum = 8)
 *    - Q3: Low Priority (FCFS)
 *
 * 2. Process Lifecycle:
 *    - All new processes enter Q1.
 *    - If a process uses its entire quantum in Q1, it is demoted to Q2.
 *    - If a process uses its entire quantum in Q2, it is demoted to Q3.
 *    - Q3 is FCFS (non-preemptive relative to itself, but preemptable by Q1/Q2).
 *
 * 3. Preemption:
 *    - If a process arrives in a higher priority queue, it preempts any running process in a lower queue.
 *
 * 4. Priority Boost:
 *    - Every 50 cycles, all processes are moved back to Q1 to prevent starvation.
 */

const MLFQ = {
    // Configuration
    config: {
        q1Quantum: 4,
        q2Quantum: 8,
        boostInterval: 50
    },

    queues: {
        Q1: { id: 1, label: 'Q1 (High)', color: '#ff9ff3' }, // Pink
        Q2: { id: 2, label: 'Q2 (Med)', color: '#4ecdc4' }, // Teal
        Q3: { id: 3, label: 'Q3 (Low)', color: '#ffe600' } // Yellow
    },

    // State
    lastBoostTime: 0,
    cycleCount: 0,

    updateConfig: function(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log("[MLFQ] Config updated:", this.config);
    },

    /**
     * Initialize or Reset MLFQ State
     */
    reset: function() {
        this.lastBoostTime = Date.now();
        console.log("[MLFQ] System Reset");
    },

    /**
     * Initialize a new process for MLFQ
     * @param {Object} process - The process node
     */
    initProcess: function(process) {
        if (!process.mlfq) {
            process.mlfq = {
                priority: 1, // Start in Q1
                timeUsedInQuantum: 0,
                totalTimeInQueue: 0
            };
            // Map internal priority to visual priorityGroup for existing MLQ rendering if needed
            process.priorityGroup = 0; // 0 = High (Q1), will map others later
        }
    },

    /**
     * Check for Priority Boost
     * @param {Array} processes - All active processes
     * @param {number} currentTime - Current simulation time (or just use Date.now())
     * @returns {boolean} - True if boost occurred
     */
    checkBoost: function(processes) {
        // In this sim, we might use a cycle counter or real time.
        // Let's use a simple counter incremented by the scheduler loop or rely on time.
        // For simplicity in this event-driven sim, we'll check against a global cycle counter if available,
        // or just use a timestamp diff if the sim speed is constant.

        // Assuming scheduler calls this every step.
        // We need a way to track "cycles". Let's assume 1 step = 1 cycle for now.

        // Actually, let's use the simulation time if accessible, or maintain our own counter.
        // Since we don't have easy access to a global "cycle" count passed in, let's use a static counter here.
        if (typeof this.cycleCount === 'undefined') this.cycleCount = 0;
        this.cycleCount++;

        if (this.cycleCount >= this.config.boostInterval) {
            this.cycleCount = 0;
            this.boostPriorities(processes);
            return true;
        }
        return false;
    },

    /**
     * Boost all processes to Q1
     */
    boostPriorities: function(processes) {
        let boostedCount = 0;
        processes.forEach(p => {
            if (p.state !== 'TERMINATED' && p.mlfq && p.mlfq.priority > 1) {
                p.mlfq.priority = 1;
                p.mlfq.timeUsedInQuantum = 0;
                p.priorityGroup = 0; // Visual sync
                boostedCount++;
            }
        });
        if (boostedCount > 0) {
            printToCli(`[MLFQ] Priority Boost! Moved ${boostedCount} processes to Q1.`, 'warning');
        }
    },

    /**
     * Update process state after a run step
     * @param {Object} process - The running process
     * @param {number} stepSize - Time units consumed (usually 1 or 5)
     */
    updateProcess: function(process, stepSize) {
        if (!process.mlfq) this.initProcess(process);

        process.mlfq.timeUsedInQuantum += stepSize;
        process.mlfq.totalTimeInQueue += stepSize;

        const currentQ = this.queues[`Q${process.mlfq.priority}`];

        // Check for Demotion
        let quantum = Infinity;
        if (process.mlfq.priority === 1) quantum = this.config.q1Quantum;
        else if (process.mlfq.priority === 2) quantum = this.config.q2Quantum;

        if (quantum !== Infinity && process.mlfq.timeUsedInQuantum >= quantum) {
            // Demote if not already in lowest queue
            if (process.mlfq.priority < 3) {
                const oldQ = process.mlfq.priority;
                process.mlfq.priority++;
                process.mlfq.timeUsedInQuantum = 0; // Reset for new queue

                // Visual Sync
                process.priorityGroup = (process.mlfq.priority === 1) ? 0 : 1; // Simplistic mapping for now

                printToCli(`[MLFQ] ${process.label} demoted Q${oldQ} -> Q${process.mlfq.priority}`, 'info');
                return true; // Demoted
            } else {
                // In Q3 (FCFS), just reset quantum tracker purely for book-keeping, though not strictly needed
                process.mlfq.timeUsedInQuantum = 0;
                // RR behavior in lowest queue? Requirement says Q3 is FCFS.
                // So we don't preempt ourselves in Q3 unless higher prio comes.
            }
        }
        return false;
    },

    /**
     * Select the next process to run
     * @param {Array} readyProcesses - List of READY processes
     * @returns {Object|null} - The selected process
     */
    getNextProcess: function(readyProcesses) {
        // Filter and Sort
        // 1. Q1
        // 2. Q2
        // 3. Q3

        const q1 = readyProcesses.filter(p => !p.mlfq || p.mlfq.priority === 1);
        const q2 = readyProcesses.filter(p => p.mlfq && p.mlfq.priority === 2);
        const q3 = readyProcesses.filter(p => p.mlfq && p.mlfq.priority === 3);

        // Q1 is RR
        if (q1.length > 0) {
            // Standard RR: pick the one that hasn't run recently or just FIFO
            // We can use the existing 'lastPreemptTime' or arrival time
            return q1[0]; // The list is usually already sorted by arrival/re-entry in the main scheduler
        }

        // Q2 is RR
        if (q2.length > 0) {
            return q2[0];
        }

        // Q3 is FCFS
        if (q3.length > 0) {
            return q3[0];
        }

        return null;
    },

    /**
     * Get visual color for a process based on its queue
     */
    getColor: function(process) {
        if (!process.mlfq) return this.queues.Q1.color;
        return this.queues[`Q${process.mlfq.priority}`].color;
    },

    /**
     * Get label for Gantt chart
     */
    getLabel: function(process) {
        if (!process.mlfq) return `Q1`;
        return `Q${process.mlfq.priority}`;
    }
};

// Expose to window
window.MLFQ = MLFQ;
