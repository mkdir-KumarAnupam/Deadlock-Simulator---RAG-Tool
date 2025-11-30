

    function getScenarioData() {
      return [
        {
          id: 'simple_deadlock', number: '01', category: 'DEADLOCK', categoryColor: '#ff6b6b', title: 'Simple Deadlock',
          description: 'Two processes and two resources in a classic mutual hold-and-wait situation. Both processes hold one resource and request the other.',
          outcome: 'Understand the four necessary conditions for deadlock: mutual exclusion, hold and wait, no preemption, and circular wait.',
          config: [{ icon: 'fas fa-circle', text: '2 Processes' }, { icon: 'fas fa-square', text: '2 Resources' }]
        },

        {
          id: 'circular_wait', number: '02', category: 'DEADLOCK', categoryColor: '#ff6b6b', title: 'Circular Wait (3 Processes)',
          description: 'Three processes form a circular chain where each holds one resource and waits for another, creating a cycle in the resource allocation graph.',
          outcome: 'Visualize how circular wait condition manifests in RAG. Learn cycle detection algorithms and deadlock prevention strategies.',
          config: [{ icon: 'fas fa-circle', text: '3 Processes' }, { icon: 'fas fa-square', text: '3 Resources' }]
        },

        {
          id: 'safe_state', number: '03', category: 'SAFE STATE', categoryColor: '#4ecdc4', title: 'Safe State Example',
          description: 'Linear resource dependency chain without cycles. Demonstrates a safe allocation where processes can complete sequentially without deadlock.',
          outcome: 'Distinguish between safe and unsafe states. Understand how proper resource ordering prevents deadlock formation.',
          config: [{ icon: 'fas fa-circle', text: '3 Processes' }, { icon: 'fas fa-square', text: '2 Resources' }]
        },

        {
          id: 'starvation', number: '04', category: 'STARVATION', categoryColor: '#feca57', title: 'Resource Starvation',
          description: 'One process monopolizes a resource with long burst time while five other processes compete endlessly for access, demonstrating indefinite postponement.',
          outcome: 'Understand starvation vs deadlock. Learn aging techniques and fair scheduling to prevent indefinite blocking.',
          config: [{ icon: 'fas fa-circle', text: '6 Processes' }, { icon: 'fas fa-square', text: '1 Resource' }]
        },

        {
          id: 'fcfs_test', number: '05', category: 'SCHEDULING', categoryColor: '#a29bfe', title: 'FCFS Scheduling Test',
          description: 'First-Come-First-Served: Four processes with varying burst times executed in arrival order. Non-preemptive, simple but can cause convoy effect.',
          outcome: 'Analyze average waiting time in FCFS. Identify convoy effect where short processes wait behind long ones.',
          config: [{ icon: 'fas fa-clock', text: 'Algorithm: FCFS' }, { icon: 'fas fa-circle', text: '4 Processes' }]
        },

        {
          id: 'sjf_test', number: '06', category: 'SCHEDULING', categoryColor: '#a29bfe', title: 'SJF Scheduling Test',
          description: 'Shortest Job First: Processes with intentionally varied burst times to demonstrate optimal average waiting time when executed shortest-first.',
          outcome: 'Prove SJF minimizes average waiting time. Understand the challenge of predicting burst times in real systems.',
          config: [{ icon: 'fas fa-clock', text: 'Algorithm: SJF' }, { icon: 'fas fa-circle', text: '4 Processes' }]
        },

        {
          id: 'srtf_test', number: '07', category: 'SCHEDULING', categoryColor: '#a29bfe', title: 'SRTF Preemptive Test',
          description: 'Shortest Remaining Time First: Long-running process repeatedly preempted by incoming short processes. Shows context switching overhead.',
          outcome: 'Compare preemptive vs non-preemptive scheduling. Observe context switching costs and response time improvements.',
          config: [{ icon: 'fas fa-clock', text: 'Algorithm: SRTF' }, { icon: 'fas fa-circle', text: '4 Processes' }]
        },

        {
          id: 'rr_test', number: '08', category: 'SCHEDULING', categoryColor: '#a29bfe', title: 'Round Robin Test',
          description: 'Time-sharing with quantum=30ms. Four processes with similar burst times take turns executing, providing fair CPU time distribution.',
          outcome: 'Understand time quantum trade-offs: too small increases overhead, too large reduces responsiveness. Balance fairness and efficiency.',
          config: [{ icon: 'fas fa-clock', text: 'Algorithm: RR (Q=30)' }, { icon: 'fas fa-circle', text: '4 Processes' }]
        },

        {
          id: 'priority_test', number: '09', category: 'SCHEDULING', categoryColor: '#a29bfe', title: 'Priority Scheduling Test',
          description: 'Processes with different priorities (1=High, 10=Low). Demonstrates execution order based on priority rather than arrival time.',
          outcome: 'Observe high priority processes executing first. Switch between Preemptive and Non-Preemptive modes to see differences.',
          config: [{ icon: 'fas fa-sort-numeric-down', text: 'Priorities: 1, 5, 10' }, { icon: 'fas fa-circle', text: '3 Processes' }]
        },

        {
          id: 'priority_preemptive_test', number: '10', category: 'SCHEDULING', categoryColor: '#a29bfe', title: 'Priority Preemptive Demo',
          description: 'Demonstrates preemption. Start simulation, then add a new process with Priority 0 to see the current running process get preempted.',
          outcome: 'Witness immediate context switch when a higher priority (lower value) process becomes ready.',
          config: [{ icon: 'fas fa-bolt', text: 'Algorithm: Priority (P)' }, { icon: 'fas fa-plus-circle', text: 'Add Process to Test' }]
        },

        {
          id: 'dining_philosophers', number: '11', category: 'CLASSIC PROBLEM', categoryColor: '#ee5a6f', title: 'Dining Philosophers',
          description: 'Five philosophers alternately think and eat. Each needs two chopsticks (shared resources) to eat, but only five chopsticks exist.',
          outcome: 'Study classic synchronization problem. Learn solutions: resource hierarchy, arbitrator, or asymmetric approach.',
          config: [{ icon: 'fas fa-circle', text: '5 Philosophers' }, { icon: 'fas fa-square', text: '5 Chopsticks' }]
        },

        {
          id: 'producer_consumer', number: '12', category: 'CLASSIC PROBLEM', categoryColor: '#ee5a6f', title: 'Producer-Consumer',
          description: 'Producers generate data and consumers process it. Shared buffer with limited capacity requires synchronization to prevent overflow/underflow.',
          outcome: 'Master bounded-buffer problem. Understand semaphores, mutexes, and condition variables for synchronization.',
          config: [{ icon: 'fas fa-circle', text: '2 Producers' }, { icon: 'fas fa-circle', text: '2 Consumers' }]
        },

        {
          id: 'readers_writers', number: '13', category: 'CLASSIC PROBLEM', categoryColor: '#ee5a6f', title: 'Readers-Writers',
          description: 'Multiple readers can access shared data simultaneously, but writers need exclusive access. Demonstrates reader/writer priority trade-offs.',
          outcome: 'Explore reader-writer locks. Compare reader-preference vs writer-preference policies and their starvation implications.',
          config: [{ icon: 'fas fa-circle', text: '4 Readers' }, { icon: 'fas fa-circle', text: '2 Writers' }]
        },

        {
          id: 'priority_inversion', number: '14', category: 'PRIORITY', categoryColor: '#ff9ff3', title: 'Priority Inversion',
          description: 'High-priority process blocked by low-priority process holding a resource. Medium-priority process runs instead, inverting priorities.',
          outcome: 'Identify priority inversion problem. Learn priority inheritance and priority ceiling protocols as solutions.',
          config: [{ icon: 'fas fa-circle', text: '3 Processes' }, { icon: 'fas fa-layer-group', text: 'Different Priorities' }]
        },

        {
          id: 'convoy_effect', number: '15', category: 'PERFORMANCE', categoryColor: '#feca57', title: 'Convoy Effect Demo',
          description: 'One CPU-bound process with very long burst time followed by many I/O-bound processes. All short processes wait, reducing system throughput.',
          outcome: 'Observe convoy effect in FCFS. Understand why preemptive schedulers perform better for mixed workloads.',
          config: [{ icon: 'fas fa-circle', text: '1 CPU-bound' }, { icon: 'fas fa-circle', text: '6 I/O-bound' }]
        },

        {
          id: 'resource_preemption', number: '16', category: 'RECOVERY', categoryColor: '#4ecdc4', title: 'Resource Preemption',
          description: 'Deadlock occurs and must be resolved by preempting resources from victim processes. Demonstrates one recovery strategy.',
          outcome: 'Learn deadlock recovery techniques: victim selection, rollback, and starvation prevention during recovery.',
          config: [{ icon: 'fas fa-circle', text: '3 Processes' }, { icon: 'fas fa-recycle', text: 'Preemption Demo' }]
        },

        {
          id: 'multi_instance', number: '17', category: 'RESOURCES', categoryColor: '#54a0ff', title: 'Multiple Resource Instances',
          description: 'Resources with multiple identical instances. Processes request and release instances dynamically, testing allocation strategies.',
          outcome: 'Understand difference between single and multi-instance resources. Apply Banker\'s Algorithm for safe state checking.',
          config: [{ icon: 'fas fa-circle', text: '4 Processes' }, { icon: 'fas fa-layer-group', text: 'Multi-instance' }]
        },

        {
          id: 'aging_demo', number: '18', category: 'STARVATION FIX', categoryColor: '#feca57', title: 'Aging Mechanism',
          description: 'Low-priority processes gradually increase their priority over time to prevent indefinite postponement in priority scheduling.',
          outcome: 'See how aging prevents starvation. Balance between priority respect and fairness in scheduling algorithms.',
          config: [{ icon: 'fas fa-circle', text: '5 Processes' }, { icon: 'fas fa-chart-line', text: 'Dynamic Priority' }]
        },

        {
          id: 'bankers_demo', number: '19', category: 'DEADLOCK AVOIDANCE', categoryColor: '#a3ffac', title: 'Banker\'s Algorithm Demo',
          description: 'A classic textbook example (Silberschatz) configured with Max Claims to demonstrate the Banker\'s Algorithm safety check.',
          outcome: 'Run the Safety Check to see the Safe Sequence < P1, P3, P4, P0, P2 >. Modify allocations to create an unsafe state.',
          config: [{ icon: 'fas fa-circle', text: '5 Processes' }, { icon: 'fas fa-university', text: 'Max Claims Set' }]
        },

        {
          id: 'unsafe_demo', number: '20', category: 'UNSAFE STATE', categoryColor: '#ff6b6b', title: 'Unsafe State Demo',
          description: 'A system configuration where the Banker\'s Algorithm fails. Available resources are insufficient to satisfy the Max Claim of any process.',
          outcome: 'Run the Safety Check to see "DEADLOCK POSSIBLE". This proves the system is in an Unsafe State.',
          config: [{ icon: 'fas fa-circle', text: '3 Processes' }, { icon: 'fas fa-exclamation-triangle', text: 'Unsafe Config' }]
        }
      ];
    }

    // --- Scenario Logic ---
    function loadScenario(type) {
      resetGraph();
      const cx = (canvas.width / (window.devicePixelRatio || 1)) / 2;
      const cy = (canvas.height / (window.devicePixelRatio || 1)) / 2;

      if (type === 'simple_deadlock') {
        const p1 = addNode('process', cx - 100, cy);
        const p2 = addNode('process', cx + 100, cy);
        const r1 = addNode('resource', cx, cy - 100);
        const r2 = addNode('resource', cx, cy + 100);
        addEdge(r1, p1); addEdge(r2, p2);
        addEdge(p1, r2); addEdge(p2, r1);
        printToCli("Loaded: Simple Deadlock (2P, 2R)", 'info');
      }
      else if (type === 'circular_wait') {
        const p1 = addNode('process', cx, cy - 120);
        const p2 = addNode('process', cx + 120, cy + 80);
        const p3 = addNode('process', cx - 120, cy + 80);
        const r1 = addNode('resource', cx + 60, cy - 60);
        const r2 = addNode('resource', cx, cy + 120);
        const r3 = addNode('resource', cx - 60, cy - 60);
        addEdge(r1, p1); addEdge(p1, r2);
        addEdge(r2, p2); addEdge(p2, r3);
        addEdge(r3, p3); addEdge(p3, r1);
        printToCli("Loaded: Circular Wait (3P Cycle)", 'info');
      }
      else if (type === 'safe_state') {
        const p1 = addNode('process', cx - 150, cy);
        const p2 = addNode('process', cx, cy);
        const p3 = addNode('process', cx + 150, cy);
        const r1 = addNode('resource', cx - 75, cy - 80);
        const r2 = addNode('resource', cx + 75, cy + 80);
        addEdge(r1, p1); addEdge(p2, r1);
        addEdge(r2, p2); addEdge(p3, r2);
        printToCli("Loaded: Safe State (Linear Dependency)", 'info');
      }
      else if (type === 'starvation') {
        selectScheduler('fcfs', 'FCFS'); // Use FCFS to demonstrate unfair scheduling

        // Central shared resource (CPU or critical resource)
        const r1 = addNode('resource', cx, cy);
        r1.label = 'CPU';
        r1.instances = 1;

        // High priority/monopolizing process - allocated to the resource
        const pMonopolizer = addNode('process', cx, cy - 100);
        pMonopolizer.label = 'Hog';
        pMonopolizer.burstTime = 500; // Very long burst time
        pMonopolizer.maxBurst = 500;
        pMonopolizer.originalBurst = 500;
        pMonopolizer.state = 'READY';
        addEdge(r1, pMonopolizer); // Resource allocated to monopolizer

        // Create 5 starving processes requesting the same resource
        const starvingProcesses = [];
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
          const radius = 140;
          const px = cx + radius * Math.cos(angle);
          const py = cy + radius * Math.sin(angle);
          const p = addNode('process', px, py);
          p.label = 'P' + (i + 1);
          p.burstTime = 50 + (i * 10); // Short burst times
          p.maxBurst = 50 + (i * 10);
          p.originalBurst = 50 + (i * 10);
          p.state = 'BLOCKED'; // Start as blocked
          addEdge(p, r1); // All requesting the same resource
          starvingProcesses.push(p);
        }

        printToCli("Loaded: Resource Starvation Scenario", 'info');
        printToCli("One process monopolizes CPU while 5 others wait indefinitely", 'error');
        printToCli("Run simulation for 50+ cycles, then click 'Starvation' button", 'info');
      }
      // FCFS Test: Processes arrive in order, no blocking - shows simple sequential execution
      else if (type === 'fcfs_test') {
        selectScheduler('fcfs', 'FCFS');
        const p1 = addNode('process', cx - 150, cy - 50);
        const p2 = addNode('process', cx - 50, cy - 50);
        const p3 = addNode('process', cx + 50, cy - 50);
        const p4 = addNode('process', cx + 150, cy - 50);
        p1.burstTime = 80; p1.originalBurst = 80;
        p2.burstTime = 120; p2.originalBurst = 120;
        p3.burstTime = 60; p3.originalBurst = 60;
        p4.burstTime = 100; p4.originalBurst = 100;
        printToCli("FCFS Test: Sequential arrival - fair ordering", 'info');
        printToCli("Best for: Batch systems, predictable workloads", 'success');
      }
      // SJF Test: Varied burst times, shows optimal avg waiting time
      else if (type === 'sjf_test') {
        selectScheduler('sjf', 'SJF');
        const p1 = addNode('process', cx - 150, cy);
        const p2 = addNode('process', cx - 50, cy);
        const p3 = addNode('process', cx + 50, cy);
        const p4 = addNode('process', cx + 150, cy);
        // Deliberately unsorted burst times to show SJF optimization
        p1.burstTime = 150; p1.originalBurst = 150;
        p2.burstTime = 40; p2.originalBurst = 40;
        p3.burstTime = 200; p3.originalBurst = 200;
        p4.burstTime = 70; p4.originalBurst = 70;
        printToCli("SJF Test: Varied bursts - minimizes avg wait time", 'info');
        printToCli("Order: P2(40) -> P4(70) -> P1(150) -> P3(200)", 'success');
      }
      // SRTF Test: Mix of long and short processes with arrivals
      else if (type === 'srtf_test') {
        selectScheduler('srtf', 'SRTF');
        const p1 = addNode('process', cx - 100, cy - 80);
        const p2 = addNode('process', cx + 100, cy - 80);
        const p3 = addNode('process', cx - 100, cy + 80);
        const p4 = addNode('process', cx + 100, cy + 80);
        // Long process that will be preempted
        p1.burstTime = 300; p1.originalBurst = 300;
        // Short processes that preempt
        p2.burstTime = 50; p2.originalBurst = 50;
        p3.burstTime = 30; p3.originalBurst = 30;
        p4.burstTime = 80; p4.originalBurst = 80;
        printToCli("SRTF Test: Preemptive shortest remaining time", 'info');
        printToCli("Best for: Responsive systems, mixed workloads", 'success');
      }
      // Round Robin Test: Equal priority processes for fair time-sharing
      else if (type === 'rr_test') {
        selectScheduler('rr', 'Round Robin');
        document.getElementById('quantum-input').value = 30;
        timeQuantum = 30;
        quantumRemaining = 30;
        const p1 = addNode('process', cx, cy - 120);
        const p2 = addNode('process', cx + 120, cy + 40);
        const p3 = addNode('process', cx - 120, cy + 40);
        const p4 = addNode('process', cx, cy + 120);
        // Similar burst times for fair sharing
        p1.burstTime = 140; p1.originalBurst = 140;
        p2.burstTime = 160; p2.originalBurst = 160;
        p3.burstTime = 130; p3.originalBurst = 130;
        p4.burstTime = 150; p4.originalBurst = 150;
        printToCli("Round Robin Test: Q=30, equal priority tasks", 'info');
        printToCli("Best for: Interactive systems, time-sharing", 'success');
      }
      // Priority Scheduling Test
      else if (type === 'priority_test') {
        selectScheduler('priority_np', 'Priority (NP)');
        const p1 = addNode('process', cx - 150, cy);
        const p2 = addNode('process', cx, cy);
        const p3 = addNode('process', cx + 150, cy);

        p1.label = 'Low'; p1.priority = 10; p1.burstTime = 100; p1.originalBurst = 100;
        p2.label = 'High'; p2.priority = 1; p2.burstTime = 100; p2.originalBurst = 100;
        p3.label = 'Med'; p3.priority = 5; p3.burstTime = 100; p3.originalBurst = 100;

        printToCli("Priority Test: High(1) -> Med(5) -> Low(10)", 'info');
        printToCli("Try switching to 'Priority (Preemptive)' to see differences", 'success');

        // Add a visual CPU resource (unconnected to prevent blocking)
        const cpu = addNode('resource', cx, cy - 100);
        cpu.label = 'CPU';
      }
      // Priority Preemptive Test
      else if (type === 'priority_preemptive_test') {
        selectScheduler('priority_p', 'Priority (Preemptive)');
        const p1 = addNode('process', cx - 100, cy);
        const p2 = addNode('process', cx + 100, cy);

        p1.label = 'P1'; p1.priority = 5; p1.burstTime = 200; p1.originalBurst = 200;
        p2.label = 'P2'; p2.priority = 5; p2.burstTime = 200; p2.originalBurst = 200;

        // Visual CPU
        const cpu = addNode('resource', cx, cy - 100);
        cpu.label = 'CPU';

        printToCli("Priority Preemptive: P1 & P2 have Priority 5", 'info');
        printToCli("ACTION: Start simulation, then add a new process with Priority 1", 'success');
        printToCli("Observe how the new high-priority process preempts the running one", 'warning');
      }
      // Advanced scenarios
      else if (type === 'dining_philosophers') {
        const centerX = cx;
        const centerY = cy;
        const radius = 120;
        const philosophers = [];
        const chopsticks = [];

        // Create 5 philosophers in a circle
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
          const px = centerX + radius * Math.cos(angle);
          const py = centerY + radius * Math.sin(angle);
          const p = addNode('process', px, py);
          p.label = 'Phil' + (i + 1);
          philosophers.push(p);
        }

        // Create 5 chopsticks between philosophers
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i - Math.PI / 2 + (Math.PI / 5);
          const rx = centerX + radius * 0.6 * Math.cos(angle);
          const ry = centerY + radius * 0.6 * Math.sin(angle);
          const r = addNode('resource', rx, ry);
          r.label = 'Fork' + (i + 1);
          chopsticks.push(r);
        }

        // Each philosopher requests two adjacent chopsticks
        for (let i = 0; i < 5; i++) {
          addEdge(philosophers[i], chopsticks[i]);
          addEdge(philosophers[i], chopsticks[(i + 1) % 5]);
        }

        printToCli("Dining Philosophers: Classic synchronization problem", 'info');
        printToCli("All trying to pick up two forks - potential deadlock!", 'error');
      }
      else if (type === 'producer_consumer') {
        const buffer = addNode('resource', cx, cy);
        buffer.label = 'Buffer';
        buffer.capacity = 3;
        buffer.instances = 3;

        const prod1 = addNode('process', cx - 120, cy - 80);
        const prod2 = addNode('process', cx - 120, cy + 80);
        const cons1 = addNode('process', cx + 120, cy - 80);
        const cons2 = addNode('process', cx + 120, cy + 80);

        prod1.label = 'Prod1';
        prod2.label = 'Prod2';
        cons1.label = 'Cons1';
        cons2.label = 'Cons2';

        prod1.burstTime = 200; prod1.originalBurst = 200;
        prod2.burstTime = 180; prod2.originalBurst = 180;
        cons1.burstTime = 150; cons1.originalBurst = 150;
        cons2.burstTime = 170; cons2.originalBurst = 170;

        addEdge(prod1, buffer);
        addEdge(prod2, buffer);
        addEdge(buffer, cons1);
        addEdge(buffer, cons2);

        printToCli("Producer-Consumer: Bounded buffer problem", 'info');
        printToCli("Buffer capacity: 3. Producers fill, consumers empty", 'success');
      }
      else if (type === 'readers_writers') {
        const database = addNode('resource', cx, cy);
        database.label = 'DB';

        // Readers can share
        const r1 = addNode('process', cx - 100, cy - 100);
        const r2 = addNode('process', cx + 100, cy - 100);
        const r3 = addNode('process', cx - 150, cy);
        const r4 = addNode('process', cx + 150, cy);

        // Writers need exclusive access
        const w1 = addNode('process', cx - 50, cy + 100);
        const w2 = addNode('process', cx + 50, cy + 100);

        r1.label = 'Read1'; r2.label = 'Read2';
        r3.label = 'Read3'; r4.label = 'Read4';
        w1.label = 'Write1'; w2.label = 'Write2';

        r1.burstTime = 80; r1.originalBurst = 80;
        r2.burstTime = 90; r2.originalBurst = 90;
        r3.burstTime = 70; r3.originalBurst = 70;
        r4.burstTime = 85; r4.originalBurst = 85;
        w1.burstTime = 150; w1.originalBurst = 150;
        w2.burstTime = 160; w2.originalBurst = 160;

        addEdge(r1, database);
        addEdge(r2, database);
        addEdge(r3, database);
        addEdge(r4, database);
        addEdge(w1, database);
        addEdge(w2, database);

        printToCli("Readers-Writers: Multiple readers, exclusive writers", 'info');
        printToCli("Challenge: Balance reader/writer priority", 'error');
      }
      else if (type === 'priority_inversion') {
        selectScheduler('fcfs', 'FCFS');
        const r1 = addNode('resource', cx, cy);
        r1.label = 'Lock';

        const low = addNode('process', cx - 120, cy);
        const med = addNode('process', cx, cy - 100);
        const high = addNode('process', cx + 120, cy);

        low.label = 'Low-P';
        med.label = 'Med-P';
        high.label = 'High-P';

        low.burstTime = 250; low.originalBurst = 250;
        med.burstTime = 150; med.originalBurst = 150;
        high.burstTime = 100; high.originalBurst = 100;

        // Low priority holds resource
        addEdge(r1, low);
        // High priority waits for it
        addEdge(high, r1);
        // Medium priority runs freely (priority inversion!)

        printToCli("Priority Inversion: High waits for low", 'error');
        printToCli("Medium-priority process runs instead!", 'info');
      }
      else if (type === 'convoy_effect') {
        selectScheduler('fcfs', 'FCFS');
        const cpuBound = addNode('process', cx, cy - 100);
        cpuBound.label = 'CPU';
        cpuBound.burstTime = 500;
        cpuBound.originalBurst = 500;

        const radius = 100;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 / 6) * i;
          const px = cx + radius * Math.cos(angle);
          const py = cy + 50 + radius * Math.sin(angle);
          const p = addNode('process', px, py);
          p.label = 'IO' + (i + 1);
          p.burstTime = 40 + i * 10;
          p.originalBurst = 40 + i * 10;
        }

        printToCli("Convoy Effect: Long CPU-bound blocks short I/O", 'error');
        printToCli("All short processes wait unnecessarily", 'info');
      }
      else if (type === 'resource_preemption') {
        const p1 = addNode('process', cx - 100, cy);
        const p2 = addNode('process', cx + 100, cy);
        const p3 = addNode('process', cx, cy + 100);
        const r1 = addNode('resource', cx - 50, cy - 80);
        const r2 = addNode('resource', cx + 50, cy - 80);

        p1.label = 'P1'; p2.label = 'P2'; p3.label = 'P3';
        r1.label = 'R1'; r2.label = 'R2';

        addEdge(r1, p1); addEdge(p1, r2);
        addEdge(r2, p2); addEdge(p2, r1);
        addEdge(p3, r1);

        printToCli("Resource Preemption: Deadlock detected!", 'error');
        printToCli("Solution: Preempt resource from victim process", 'info');
      }
      else if (type === 'multi_instance') {
        const r1 = addNode('resource', cx, cy);
        r1.label = 'Pool';
        r1.capacity = 4;
        r1.instances = 4;

        const p1 = addNode('process', cx - 130, cy - 80);
        const p2 = addNode('process', cx + 130, cy - 80);
        const p3 = addNode('process', cx - 130, cy + 80);
        const p4 = addNode('process', cx + 130, cy + 80);

        p1.label = 'P1'; p2.label = 'P2';
        p3.label = 'P3'; p4.label = 'P4';

        addEdge(p1, r1);
        addEdge(p2, r1);
        addEdge(p3, r1);
        addEdge(p4, r1);

        printToCli("Multi-Instance Resources: 4 instances available", 'info');
        printToCli("Use Banker's Algorithm to check safe states", 'success');
      }
      else if (type === 'aging_demo') {
        selectScheduler('fcfs', 'FCFS');
        const r1 = addNode('resource', cx, cy);
        r1.label = 'CPU';

        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
          const px = cx + 130 * Math.cos(angle);
          const py = cy + 130 * Math.sin(angle);
          const p = addNode('process', px, py);
          p.label = 'P' + (i + 1);
          // Vary burst times to create priority differences
          p.burstTime = 100 + i * 40;
          p.originalBurst = 100 + i * 40;
          addEdge(p, r1);
        }

        printToCli("Aging Demo: Priorities gradually increase", 'info');
        printToCli("Prevents indefinite postponement", 'success');
      }
      else if (type === 'bankers_demo') {
        const rA = addNode('resource', cx - 150, cy - 120); rA.label = 'A'; rA.capacity = 10; rA.instances = 10;
        const rB = addNode('resource', cx, cy - 120);       rB.label = 'B'; rB.capacity = 5;  rB.instances = 5;
        const rC = addNode('resource', cx + 150, cy - 120); rC.label = 'C'; rC.capacity = 7;  rC.instances = 7;

        const p0 = addNode('process', cx - 200, cy + 50); p0.label = 'P0';
        const p1 = addNode('process', cx - 100, cy + 50); p1.label = 'P1';
        const p2 = addNode('process', cx, cy + 50);       p2.label = 'P2';
        const p3 = addNode('process', cx + 100, cy + 50); p3.label = 'P3';
        const p4 = addNode('process', cx + 200, cy + 50); p4.label = 'P4';

        // Allocations
        // P0: B=1
        addEdge(rB, p0);

        // P1: A=2
        addEdge(rA, p1); addEdge(rA, p1);

        // P2: A=3, C=2
        addEdge(rA, p2); addEdge(rA, p2); addEdge(rA, p2);
        addEdge(rC, p2); addEdge(rC, p2);

        // P3: A=2, B=1, C=1
        addEdge(rA, p3); addEdge(rA, p3);
        addEdge(rB, p3);
        addEdge(rC, p3);

        // P4: C=2
        addEdge(rC, p4); addEdge(rC, p4);

        // Max Claims
        p0.maxClaim = { [rA.id]: 7, [rB.id]: 5, [rC.id]: 3 };
        p1.maxClaim = { [rA.id]: 3, [rB.id]: 2, [rC.id]: 2 };
        p2.maxClaim = { [rA.id]: 9, [rB.id]: 0, [rC.id]: 2 };
        p3.maxClaim = { [rA.id]: 2, [rB.id]: 2, [rC.id]: 2 };
        p4.maxClaim = { [rA.id]: 4, [rB.id]: 3, [rC.id]: 3 };

        printToCli("Loaded: Banker's Algo Demo (Silberschatz Ex)", 'info');
        printToCli("Click 'BANKER'S' button to verify Safe State", 'success');
      }
      else if (type === 'unsafe_demo') {
        const r1 = addNode('resource', cx, cy - 100);
        r1.label = 'R1';
        r1.capacity = 12;
        r1.instances = 12;

        const p1 = addNode('process', cx - 150, cy + 50); p1.label = 'P1';
        const p2 = addNode('process', cx, cy + 50);       p2.label = 'P2';
        const p3 = addNode('process', cx + 150, cy + 50); p3.label = 'P3';

        // Allocations (Total = 10, Available = 2)
        // P1: Alloc 4
        addEdge(r1, p1); addEdge(r1, p1); addEdge(r1, p1); addEdge(r1, p1);

        // P2: Alloc 4
        addEdge(r1, p2); addEdge(r1, p2); addEdge(r1, p2); addEdge(r1, p2);

        // P3: Alloc 2
        addEdge(r1, p3); addEdge(r1, p3);

        // Max Claims
        // P1 Need = 10 - 4 = 6. (6 > 2 Avail) -> Wait
        p1.maxClaim = { [r1.id]: 10 };

        // P2 Need = 8 - 4 = 4. (4 > 2 Avail) -> Wait
        p2.maxClaim = { [r1.id]: 8 };

        // P3 Need = 9 - 2 = 7. (7 > 2 Avail) -> Wait
        p3.maxClaim = { [r1.id]: 9 };

        printToCli("Loaded: Unsafe State Demo", 'info');
        printToCli("Available: 2. Needs: P1(6), P2(4), P3(7)", 'warning');
        printToCli("Run Safety Check to confirm UNSAFE state", 'success');
      }

      document.querySelectorAll('.neo-dropdown').forEach(d => d.classList.remove('show'));
      detectDeadlock(true);
    }

    // --- Autosave Logic ---
    let autosaveTimer = null;

    function startAutosave(intervalMs) {
      if (autosaveTimer) clearInterval(autosaveTimer);

      if (!intervalMs || intervalMs <= 0) {
        console.log("Autosave disabled");
        return;
      }

      console.log(`Starting autosave with interval: ${intervalMs}ms`);
      autosaveTimer = setInterval(saveAutosave, intervalMs);
    }

    function saveAutosave() {
      console.log("Attempting autosave...");
      if (typeof nodes === 'undefined') {
        console.error("Autosave error: 'nodes' is undefined");
        return;
      }

      if (nodes.length === 0) {
        console.log("Autosave skipped: Graph is empty");
        return;
      }

      const data = {
        nodes: nodes,
        edges: edges,
        nextId: nextId,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem('autosave_latest', JSON.stringify(data));
        console.log("Autosave success! Timestamp:", data.timestamp);

        // Optional: subtle indicator?
        const saveIcon = document.getElementById('autosave-indicator');
        if (saveIcon) {
            saveIcon.classList.remove('hidden');
            setTimeout(() => saveIcon.classList.add('hidden'), 1000);
        }
      } catch (e) {
        console.error("Autosave failed:", e);
      }
    }

    function loadAutosave() {
      const saved = localStorage.getItem('autosave_latest');
      if (!saved) {
        printToCli("No autosave found.", 'error');
        return;
      }

      try {
        const data = JSON.parse(saved);
        resetGraph();
        nodes = data.nodes;
        edges = data.edges;
        nextId = data.nextId;

        // Restore rotation if missing (legacy support)
        nodes.forEach(n => {
            if (n.rotation === undefined) n.rotation = (Math.random() - 0.5) * 0.25;
            if (n.pinColor === undefined) n.pinColor = '#333';
        });

        draw();
        updateSystemStats();
        const date = new Date(data.timestamp).toLocaleTimeString();
        printToCli(`Restored autosave from ${date}`, 'success');

        // Close menus
        document.querySelectorAll('.neo-dropdown').forEach(d => d.classList.remove('show'));
      } catch (e) {
        printToCli("Failed to load autosave.", 'error');
        console.error(e);
      }
    }

    // Initialize Autosave from Preferences
    setTimeout(() => {
        const savedFreq = localStorage.getItem('autosaveFrequency');
        if (savedFreq) {
            const freq = parseInt(savedFreq);
            if (freq > 0) {
                startAutosave(freq);
                // Update UI if it exists
                const select = document.getElementById('config-autosave');
                if (select) select.value = freq;
            }
        }
    }, 1000);

    window.startAutosave = startAutosave;
    window.saveAutosave = saveAutosave;
    window.loadAutosave = loadAutosave;

    // --- Cloud Storage Logic (Supabase) ---
    async function saveScenarioToCloud(name, isPublic = false) {
      if (!Auth.user) {
        alert("Please login to save scenarios.");
        return;
      }

      if (!SupabaseService.isConfigured()) {
        alert("Please configure Supabase in Settings.");
        return;
      }

      const supabase = SupabaseService.getClient();
      const data = { nodes, edges, nextId };

      const { data: insertedData, error } = await supabase
        .from('scenarios')
        .insert({
          user_id: Auth.user.id,
          name: name,
          data: data,
          thumbnail: null,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) {
        printToCli(`Error saving: ${error.message}`, 'error');
        return null;
      } else {
        printToCli(`Scenario "${name}" saved to cloud.`, 'success');
        return insertedData;
      }
    }

    async function fetchUserScenarios() {
      if (!Auth.user) return [];
      if (!SupabaseService.isConfigured()) return [];

      const supabase = SupabaseService.getClient();
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', Auth.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch scenarios", error);
        return [];
      }
      return data;
    }

    async function loadUserScenario(id) {
       if (!Auth.user) return;
       if (!SupabaseService.isConfigured()) return;

       const supabase = SupabaseService.getClient();
       const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', id)
        .single();

       if (error) {
         printToCli(`Error loading scenario: ${error.message}`, 'error');
         return;
       }

       if (data) {
          const scenarioData = data.data;

          resetGraph();
          nodes = scenarioData.nodes.map(n => ({ ...n, rotation: (Math.random() - 0.5) * 0.25, pinColor: '#333' }));
          edges = scenarioData.edges;
          nextId = scenarioData.nextId || (nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1);

          if (isRunning) toggleSimulation();
          updateSystemStats();
          draw();
          printToCli(`Loaded cloud scenario: ${data.name}`, 'success');

          // Close menus
          document.querySelectorAll('.neo-dropdown').forEach(d => d.classList.remove('show'));
       }
    }

    async function loadPublicScenario(id) {
       if (!SupabaseService.isConfigured()) return;

       const supabase = SupabaseService.getClient();
       const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', id)
        .maybeSingle();

       if (error) {
         printToCli(`Error loading shared scenario: ${error.message}`, 'error');
         return;
       }

       if (!data) {
         printToCli('Scenario not found or access denied (Check RLS policies)', 'error');
         return;
       }

       if (data) {
          const scenarioData = data.data;

          resetGraph();
          nodes = scenarioData.nodes.map(n => ({ ...n, rotation: (Math.random() - 0.5) * 0.25, pinColor: '#333' }));
          edges = scenarioData.edges;
          nextId = scenarioData.nextId || (nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1);

          if (isRunning) toggleSimulation();
          updateSystemStats();
          draw();
          printToCli(`Loaded shared scenario: ${data.name}`, 'success');

          // Close menus
          document.querySelectorAll('.neo-dropdown').forEach(d => d.classList.remove('show'));
       }
    }

    // --- UI Helpers ---
    function promptSaveScenario() {
      if (!Auth.user) {
        if (window.Session) Session.showNotification("Please login to save scenarios.", 'error');
        else alert("Please login to save scenarios.");
        return;
      }

      const modal = document.getElementById('save-scenario-modal');
      const input = document.getElementById('save-scenario-input');

      if (modal && input) {
        input.value = ''; // Clear previous input
        modal.style.display = 'block';

        // Animate content
        const content = modal.firstElementChild;
        content.style.animation = 'none';
        void content.offsetHeight; // Force reflow
        content.style.animation = 'slideFromTop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        setTimeout(() => input.focus(), 100); // Focus input
      } else {
        // Fallback
        const name = prompt("Enter scenario name:");
        if (name) {
          saveScenarioToCloud(name);
        }
      }
    }

    function closeSaveModal() {
      const modal = document.getElementById('save-scenario-modal');
      if (modal) {
        const content = modal.firstElementChild;
        // Animate out
        content.style.animation = 'slideToTop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';

        setTimeout(() => {
          modal.style.display = 'none';
          content.style.animation = ''; // Reset
        }, 400);
      }
    }

    function confirmSaveScenario() {
      const input = document.getElementById('save-scenario-input');
      const name = input.value.trim();

      if (!name) {
        if (window.Session) Session.showNotification("Please enter a scenario name.", 'error');
        else alert("Please enter a scenario name.");
        return;
      }

      closeSaveModal();
      saveScenarioToCloud(name);
    }

    async function openUserScenarios() {
      if (!Auth.user) {
        alert("Please login to view your scenarios.");
        return;
      }

      const scenarios = await fetchUserScenarios();

      // Create a modal to list scenarios
      const modal = document.createElement('div');
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;';

      let listHtml = '';
      if (scenarios.length === 0) {
        listHtml = '<div class="p-4 text-center italic text-gray-500">No saved scenarios found.</div>';
      } else {
        listHtml = scenarios.map(s => `
          <div class="flex justify-between items-center p-3 border-b border-gray-300 hover:bg-yellow-50">
            <div>
              <div class="font-bold">${s.name}</div>
              <div class="text-xs text-gray-500">${new Date(s.created_at).toLocaleDateString()}</div>
            </div>
            <button onclick="loadUserScenario('${s.id}'); this.closest('[style*=fixed]').remove();" class="neo-btn sm" style="background: #4ecdc4;">LOAD</button>
          </div>
        `).join('');
      }

      modal.innerHTML = `
        <div class="neo-box bg-white p-0" style="width: 400px; max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column;">
            <div class="flex justify-between items-center p-4 border-b-4 border-black bg-gray-100">
                <h3 class="font-black text-lg">MY SCENARIOS</h3>
                <button onclick="this.closest('[style*=fixed]').remove()" class="text-xl font-bold hover:text-red-500">&times;</button>
            </div>
            <div class="flex-grow overflow-y-auto">
                ${listHtml}
            </div>
        </div>
      `;

      document.body.appendChild(modal);
      // Close main menu if open
      document.querySelectorAll('.neo-dropdown').forEach(d => d.classList.remove('show'));
    }

    window.promptSaveScenario = promptSaveScenario;
    window.openUserScenarios = openUserScenarios;
    window.saveScenarioToCloud = saveScenarioToCloud;
    window.fetchUserScenarios = fetchUserScenarios;
    window.loadUserScenario = loadUserScenario;
    window.loadPublicScenario = loadPublicScenario;
    window.closeSaveModal = closeSaveModal;
    window.confirmSaveScenario = confirmSaveScenario;
