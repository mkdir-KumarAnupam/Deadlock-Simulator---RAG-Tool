"""
Scenario Generator for Resource Allocation Simulator
Provides pre-built classic OS synchronization scenarios
"""

class ScenarioGenerator:
    """Generate classic OS synchronization scenarios"""

    @staticmethod
    def producer_consumer(graph_manager):
        """
        Producer-Consumer Problem
        - 1 Producer process
        - 1 Consumer process
        - Mutex for critical section
        - Empty/Full semaphores for buffer
        """
        # Create processes
        producer = graph_manager.add_process(burst_time=50, priority=5)
        consumer = graph_manager.add_process(burst_time=50, priority=5)

        # Create resources (semaphores)
        mutex = graph_manager.add_resource(instances=1, is_sharable=False)  # Binary semaphore
        empty = graph_manager.add_resource(instances=5, is_sharable=False)  # Buffer slots (5 empty initially)
        full = graph_manager.add_resource(instances=0, is_sharable=False)   # Items in buffer (0 initially)

        return {
            'name': 'Producer-Consumer',
            'description': 'Bounded buffer with 5 slots - demonstrates synchronization',
            'processes': {
                'Producer': producer,
                'Consumer': consumer
            },
            'resources': {
                'Mutex': mutex,
                'Empty_Slots': empty,
                'Full_Slots': full
            },
            'instructions': [
                "Buffer has 5 slots: Empty=5, Full=0",
                "",
                "AUTO-EXECUTED: Producer produces 1 item:",
                f"  1. wait {producer} {empty} → Gets empty slot (Empty: 5→4) ✓",
                f"  2. wait {producer} {mutex} → Locks critical section ✓",
                f"  3. [Produce item into buffer]",
                f"  4. signal {mutex} {producer} → Unlocks ✓",
                f"  5. signal {full} {producer} → Signals item ready (Full: 0→1) ✓",
                "",
                "Now Consumer tries to consume:",
                f"  1. wait {consumer} {full} → Gets full slot (Full: 1→0) ✓",
                f"  2. wait {consumer} {mutex} → Locks critical section ✓",
                f"  3. [Consume item from buffer]",
                f"  4. signal {mutex} {consumer} → Unlocks ✓",
                f"  5. signal {empty} {consumer} → Signals empty slot (Empty: 4→5) ✓",
                "",
                "Try more cycles! Producer will BLOCK if buffer full (Empty=0)",
                "Consumer will BLOCK if buffer empty (Full=0)"
            ],
            'auto_commands': [
                # Producer produces ONE item
                ('wait', producer, empty),     # Get empty slot (5→4)
                ('wait', producer, mutex),     # Lock critical section
                ('signal', mutex, producer),   # Unlock critical section
                ('signal', full, producer),    # Signal item produced (0→1)
                # Consumer consumes that item
                ('wait', consumer, full),      # Get full slot (1→0)
                ('wait', consumer, mutex),     # Lock critical section
                ('signal', mutex, consumer),   # Unlock critical section
                ('signal', empty, consumer),   # Signal empty slot (4→5)
            ]
        }

    @staticmethod
    def readers_writers(graph_manager):
        """
        Readers-Writers Problem
        - 2 Reader processes
        - 1 Writer process
        - Demonstrates reader priority and writer starvation
        """
        # Create processes
        reader1 = graph_manager.add_process(burst_time=30, priority=5)
        reader2 = graph_manager.add_process(burst_time=30, priority=5)
        writer = graph_manager.add_process(burst_time=40, priority=5)

        # Create resources
        write_lock = graph_manager.add_resource(instances=1, is_sharable=False)
        read_count_lock = graph_manager.add_resource(instances=1, is_sharable=False)

        return {
            'name': 'Readers-Writers',
            'description': 'Multiple readers can read simultaneously, writer needs exclusive access',
            'processes': {
                'Reader1': reader1,
                'Reader2': reader2,
                'Writer': writer
            },
            'resources': {
                'WriteLock': write_lock,
                'ReadCountLock': read_count_lock
            },
            'instructions': [
                "Simplified readers-writers with reader priority",
                "",
                "AUTO-EXECUTED: Reader1 starts reading:",
                f"  1. wait {reader1} {read_count_lock} → Lock read counter ✓",
                f"  2. wait {reader1} {write_lock} → First reader locks DB ✓",
                f"  3. signal {read_count_lock} {reader1} → Unlock counter ✓",
                "",
                "Now Writer tries to write:",
                f"  wait {writer} {write_lock} → BLOCKS! (Reader1 has it) ⏸",
                "",
                "Reader2 can still read (readers share):",
                f"  wait {reader2} {read_count_lock} → Lock counter ✓",
                f"  [Check read count, don't lock DB - already locked for reading]",
                f"  signal {read_count_lock} {reader2} → Unlock counter ✓",
                "",
                "When all readers finish:",
                f"  signal {write_lock} {reader1} → Last reader releases DB",
                f"  → Writer AUTOMATICALLY wakes up and gets exclusive access! ✓",
                "",
                "This shows:",
                "  • Multiple readers can read simultaneously",
                "  • Writer must wait for ALL readers",
                "  • Writer gets exclusive access (no readers during write)",
                "  • Potential writer starvation if readers keep coming"
            ],
            'auto_commands': [
                # Reader1 starts reading
                ('wait', reader1, read_count_lock),  # Lock counter
                ('wait', reader1, write_lock),       # First reader locks DB
                ('signal', read_count_lock, reader1), # Unlock counter
                # Writer tries to write - BLOCKS!
                ('wait', writer, write_lock),         # BLOCKS (reader1 has write_lock)
                # Reader2 also starts reading (simplified - just shows blocking concept)
                ('wait', reader2, read_count_lock),  # Lock counter
                ('signal', read_count_lock, reader2), # Unlock counter
            ]
        }

    @staticmethod
    def dining_philosophers(graph_manager):
        """
        Dining Philosophers Problem
        - 5 Philosophers
        - 5 Forks (chopsticks)
        """
        philosophers = []
        for i in range(5):
            phil = graph_manager.add_process(burst_time=40, priority=5)
            philosophers.append(phil)

        forks = []
        for i in range(5):
            fork = graph_manager.add_resource(instances=1, is_sharable=False)
            forks.append(fork)

        phil_names = {f'Phil{i+1}': philosophers[i] for i in range(5)}
        fork_names = {f'Fork{i+1}': forks[i] for i in range(5)}

        return {
            'name': 'Dining Philosophers',
            'description': '5 philosophers, 5 forks - all pick up left fork simultaneously → DEADLOCK!',
            'processes': phil_names,
            'resources': fork_names,
            'instructions': [
                "Each philosopher needs 2 forks (left and right) to eat",
                "AUTO-EXECUTED: All pick up their LEFT fork:",
                f"  Phil1 picks Fork1, Phil2 picks Fork2, Phil3 picks Fork3, Phil4 picks Fork4, Phil5 picks Fork5",
                "",
                "Now try to pick up RIGHT forks:",
                f"  wait {philosophers[0]} {forks[1]} → Phil1 wants Fork2 (held by Phil2) BLOCKS!",
                f"  wait {philosophers[1]} {forks[2]} → Phil2 wants Fork3 (held by Phil3) BLOCKS!",
                f"  wait {philosophers[2]} {forks[3]} → Phil3 wants Fork4 (held by Phil4) BLOCKS!",
                f"  wait {philosophers[3]} {forks[4]} → Phil4 wants Fork5 (held by Phil5) BLOCKS!",
                f"  wait {philosophers[4]} {forks[0]} → Phil5 wants Fork1 (held by Phil1) BLOCKS!",
                "",
                "→ CIRCULAR WAIT: Everyone holds 1 fork and wants neighbor's fork!",
                "Click 'Check Deadlock' to see the circular dependency!"
            ],
            'auto_commands': [
                # All philosophers pick up their LEFT fork (counterclockwise)
                ('wait', philosophers[0], forks[0]),  # Phil1 gets Fork1
                ('wait', philosophers[1], forks[1]),  # Phil2 gets Fork2
                ('wait', philosophers[2], forks[2]),  # Phil3 gets Fork3
                ('wait', philosophers[3], forks[3]),  # Phil4 gets Fork4
                ('wait', philosophers[4], forks[4]),  # Phil5 gets Fork5
                # Now try to get RIGHT fork - creates circular wait!
                ('wait', philosophers[0], forks[1]),  # Phil1 wants Fork2 (BLOCKS - Phil2 has it)
                ('wait', philosophers[1], forks[2]),  # Phil2 wants Fork3 (BLOCKS - Phil3 has it)
                ('wait', philosophers[2], forks[3]),  # Phil3 wants Fork4 (BLOCKS - Phil4 has it)
                ('wait', philosophers[3], forks[4]),  # Phil4 wants Fork5 (BLOCKS - Phil5 has it)
                ('wait', philosophers[4], forks[0]),  # Phil5 wants Fork1 (BLOCKS - Phil1 has it)
                # DEADLOCK! Circular dependency: P1→F2→P2→F3→P3→F4→P4→F5→P5→F1→P1
            ]
        }

    @staticmethod
    def simple_deadlock(graph_manager):
        """
        Simple Deadlock Scenario
        - 2 Processes
        - 2 Resources
        - Circular wait condition
        """
        p1 = graph_manager.add_process(burst_time=50, priority=5)
        p2 = graph_manager.add_process(burst_time=50, priority=5)

        r1 = graph_manager.add_resource(instances=1, is_sharable=False)
        r2 = graph_manager.add_resource(instances=1, is_sharable=False)

        return {
            'name': 'Simple Deadlock',
            'description': 'Intentional deadlock with 2 processes and 2 resources - CIRCULAR WAIT',
            'processes': {'P1': p1, 'P2': p2},
            'resources': {'R1': r1, 'R2': r2},
            'instructions': [
                f"AUTO-EXECUTED:",
                f"  1. P1 acquires R1 ✓",
                f"  2. P2 acquires R2 ✓",
                f"  3. P1 requests R2 (held by P2) → P1 BLOCKS ⏸",
                f"  4. P2 requests R1 (held by P1) → P2 BLOCKS ⏸",
                f"  → DEADLOCK! Both waiting for each other in circular dependency",
                "",
                "Click 'Check Deadlock' button to detect the cycle!",
                "Graph will show: P1→R2→P2→R1→P1 (circular wait)"
            ],
            'auto_commands': [
                ('wait', p1, r1),  # P1 locks R1
                ('wait', p2, r2),  # P2 locks R2
                ('wait', p1, r2),  # P1 blocks on R2 (held by P2)
                ('wait', p2, r1),  # P2 blocks on R1 (held by P1) → DEADLOCK!
            ]
        }

    @staticmethod
    def circular_deadlock(graph_manager):
        """
        Circular Deadlock Scenario (3-Process Chain)
        - 3 Processes
        - 3 Resources
        - Circular wait: P1→R2→P2→R3→P3→R1→P1
        """
        p1 = graph_manager.add_process(burst_time=50, priority=5)
        p2 = graph_manager.add_process(burst_time=50, priority=5)
        p3 = graph_manager.add_process(burst_time=50, priority=5)

        r1 = graph_manager.add_resource(instances=1, is_sharable=False)
        r2 = graph_manager.add_resource(instances=1, is_sharable=False)
        r3 = graph_manager.add_resource(instances=1, is_sharable=False)

        return {
            'name': 'Circular Deadlock (3-Way)',
            'description': '3 processes in circular wait chain - demonstrates complex deadlock',
            'processes': {'P1': p1, 'P2': p2, 'P3': p3},
            'resources': {'R1': r1, 'R2': r2, 'R3': r3},
            'instructions': [
                f"AUTO-EXECUTED:",
                f"  1. P1 acquires R1 ✓",
                f"  2. P2 acquires R2 ✓",
                f"  3. P3 acquires R3 ✓",
                f"  4. P1 requests R2 (held by P2) → P1 BLOCKS ⏸",
                f"  5. P2 requests R3 (held by P3) → P2 BLOCKS ⏸",
                f"  6. P3 requests R1 (held by P1) → P3 BLOCKS ⏸",
                f"  → DEADLOCK! All three processes form a circular chain",
                "",
                "Circular dependency: P1→R2→P2→R3→P3→R1→P1",
                "This is more complex than 2-process deadlock!",
                "",
                "Click 'Check Deadlock' to detect the cycle."
            ],
            'auto_commands': [
                ('wait', p1, r1),  # P1 locks R1
                ('wait', p2, r2),  # P2 locks R2
                ('wait', p3, r3),  # P3 locks R3
                ('wait', p1, r2),  # P1 blocks on R2 (held by P2)
                ('wait', p2, r3),  # P2 blocks on R3 (held by P3)
                ('wait', p3, r1),  # P3 blocks on R1 (held by P1) → DEADLOCK!
            ]
        }

    @staticmethod
    def resource_pool(graph_manager):
        """
        Resource Pool Scenario
        - 4 Processes
        - 1 Resource with 3 instances
        - Demonstrates resource contention and automatic wake-up
        """
        processes = []
        for i in range(4):
            p = graph_manager.add_process(burst_time=30, priority=5)
            processes.append(p)

        pool = graph_manager.add_resource(instances=3, is_sharable=False)

        return {
            'name': 'Resource Pool',
            'description': '4 processes competing for 3 instances (like DB connection pool)',
            'processes': {f'Process{i+1}': p for i, p in enumerate(processes)},
            'resources': {'ConnectionPool': pool},
            'instructions': [
                "Connection pool has 3 instances available",
                "",
                "AUTO-EXECUTED:",
                f"  1. P1 acquires connection (Available: 3→2) ✓",
                f"  2. P2 acquires connection (Available: 2→1) ✓",
                f"  3. P3 acquires connection (Available: 1→0) ✓",
                f"  4. P4 tries to acquire → BLOCKS! (No connections available) ⏸",
                "",
                "P4 is waiting in the queue. Now try releasing:",
                f"  signal {pool} {processes[0]} → P1 releases connection",
                f"  → P4 AUTOMATICALLY wakes up and acquires it! ✓",
                "",
                "This demonstrates:",
                "  • Resource contention (4 processes, 3 resources)",
                "  • Blocking when pool exhausted",
                "  • Automatic wake-up when resource becomes available",
                "  • FIFO queue fairness"
            ],
            'auto_commands': [
                ('wait', processes[0], pool),  # P1 gets instance 1 (2 left)
                ('wait', processes[1], pool),  # P2 gets instance 2 (1 left)
                ('wait', processes[2], pool),  # P3 gets instance 3 (0 left)
                ('wait', processes[3], pool),  # P4 BLOCKS (no instances available)
            ]
        }

    @staticmethod
    def critical_section(graph_manager):
        """
        Critical Section Problem
        - 3 Processes
        - 1 Mutex
        - Mutual exclusion demonstration with FIFO queue
        """
        p1 = graph_manager.add_process(burst_time=25, priority=5)
        p2 = graph_manager.add_process(burst_time=25, priority=5)
        p3 = graph_manager.add_process(burst_time=25, priority=5)

        mutex = graph_manager.add_resource(instances=1, is_sharable=False)

        return {
            'name': 'Critical Section',
            'description': 'Mutual exclusion - only ONE process in critical section at a time',
            'processes': {'Process1': p1, 'Process2': p2, 'Process3': p3},
            'resources': {'Mutex': mutex},
            'instructions': [
                "Mutex ensures only 1 process can access shared data at a time",
                "",
                "AUTO-EXECUTED:",
                f"  1. P1 locks mutex → ENTERS critical section ✓",
                f"  2. P2 tries to lock → BLOCKS (mutex held by P1) ⏸",
                f"  3. P3 tries to lock → BLOCKS (queue: [P2, P3]) ⏸",
                "",
                "Now execute in sequence:",
                f"  signal {mutex} {p1} → P1 exits, P2 automatically enters ✓",
                f"  signal {mutex} {p2} → P2 exits, P3 automatically enters ✓",
                f"  signal {mutex} {p3} → P3 exits, all done! ✓",
                "",
                "This demonstrates:",
                "  • Mutual exclusion (only 1 in critical section)",
                "  • FIFO queue fairness (P2 before P3)",
                "  • Automatic wake-up on signal",
                "  • No race conditions!"
            ],
            'auto_commands': [
                ('wait', p1, mutex),  # P1 enters critical section
                ('wait', p2, mutex),  # P2 blocks (waits in queue)
                ('wait', p3, mutex),  # P3 blocks (waits behind P2)
            ]
        }

    @staticmethod
    def get_all_scenarios():
        """Get list of all available scenarios"""
        return [
            ('producer_consumer', 'Producer-Consumer', 'Bounded buffer synchronization'),
            ('readers_writers', 'Readers-Writers', 'Multiple readers, single writer'),
            ('dining_philosophers', 'Dining Philosophers', 'Classic deadlock demonstration'),
            ('simple_deadlock', 'Simple Deadlock', 'Intentional circular wait'),
            ('circular_deadlock', 'Circular Deadlock (3-Way)', '3 processes in circular chain'),
            ('resource_pool', 'Resource Pool', 'Multiple instances contention'),
            ('critical_section', 'Critical Section', 'Mutual exclusion demo'),
        ]

    @staticmethod
    def load_scenario(graph_manager, scenario_name):
        """Load a scenario by name"""
        scenarios = {
            'producer_consumer': ScenarioGenerator.producer_consumer,
            'readers_writers': ScenarioGenerator.readers_writers,
            'dining_philosophers': ScenarioGenerator.dining_philosophers,
            'simple_deadlock': ScenarioGenerator.simple_deadlock,
            'circular_deadlock': ScenarioGenerator.circular_deadlock,
            'resource_pool': ScenarioGenerator.resource_pool,
            'critical_section': ScenarioGenerator.critical_section,
        }

        if scenario_name in scenarios:
            return scenarios[scenario_name](graph_manager)
        else:
            return None
