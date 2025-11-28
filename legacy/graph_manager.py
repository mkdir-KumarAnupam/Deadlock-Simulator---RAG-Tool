import networkx as nx
from collections import deque
import copy

class GraphManager:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.process_count = 0
        self.resource_count = 0
        self.resource_instances = {}  # {resource: {"total": int, "available": int}}
        self.allocations = {}  # {process: {resource: allocated_count}}
        self.requests = {}    # {process: {resource: requested_count}}
        self.wait_times = {}  # {process: ticks_waiting_for_resource}

        # --- SCHEDULER ATTRIBUTES ---
        self.process_info = {} # {pid: {'burst': int, 'remaining': int, 'arrival': int, 'state': str, 'priority': int}}
        self.scheduler_mode = 'FCFS' # FCFS, SJF, RR
        self.time_quantum = 2

        # STRICT QUEUES
        self.ready_queue = []   # List of pids [P1, P2, P3] - Ready to execute
        self.running_queue = [] # List of pids [P1] (Max 1) - Currently executing
        self.blocked_queue = [] # List of pids - Waiting for resources
        self.waiting_queue = {} # {resource_id: [list of waiting process ids]}

        # --- SEMAPHORE & SYNCHRONIZATION ---
        self.semaphores = {}    # {resource_id: {'value': int, 'queue': deque}}
        self.resource_locks = {} # {resource_id: process_id or None}
        self.max_needs = {}     # {process: {resource: max_needed}} - For Banker's Algorithm

        # --- PROCESS STATES ---
        # States: 'new', 'ready', 'running', 'blocked', 'terminated'
        self.process_states = {}

        # --- STATISTICS ---
        self.turnaround_times = {}
        self.waiting_times = {}
        self.response_times = {}
        self.context_switches = 0

        # --- TIMELINE TRACKING ---
        self.timeline = []  # List of {tick, process, state, event} records
        self.process_timeline = {}  # {pid: [(start_tick, end_tick, state)]}
        self.gantt_data = {}  # {pid: [(start, duration, state)]}

        self.current_running_process = None
        self.rr_quantum_timer = 0
        self.global_tick_counter = 0

        # SNAPSHOT FOR RESTART
        self.initial_snapshot = None

        # ========== REAL-WORLD OS FEATURES ==========

        # --- MEMORY MANAGEMENT (Virtual Memory & Paging) ---
        self.total_physical_memory = 1024  # 1024 pages (4KB each = 4MB total)
        self.page_size = 4  # 4KB pages
        self.physical_memory = [None] * self.total_physical_memory  # Page frames
        self.free_pages = list(range(self.total_physical_memory))  # Free page list
        self.page_tables = {}  # {pid: {virtual_page: physical_page}}
        self.process_memory = {}  # {pid: {'code': pages, 'data': pages, 'heap': pages, 'stack': pages}}
        self.page_faults = {}  # {pid: count}
        self.swap_space = {}  # Simulated disk swap {pid: {virtual_page: data}}

        # --- MULTI-CORE CPU SIMULATION ---
        self.num_cores = 2  # Default 2 CPU cores
        self.cpu_cores = [None] * self.num_cores  # [pid_on_core0, pid_on_core1]
        self.core_quantum_timers = [0] * self.num_cores
        self.cpu_affinity = {}  # {pid: preferred_core}
        self.per_core_ready_queues = [[] for _ in range(self.num_cores)]  # Per-core queues

        # --- FILE DESCRIPTORS & I/O ---
        self.file_descriptor_table = {}  # {pid: {fd: {'file': str, 'mode': str, 'offset': int}}}
        self.open_files = {}  # Global open file table {file_path: ref_count}
        self.max_fd_per_process = 1024
        self.io_queue = []  # Processes waiting for I/O
        self.io_devices = {'disk': {'busy': False, 'queue': deque()}}

        # --- PRIORITY & NICE VALUES ---
        self.nice_values = {}  # {pid: nice_value} (-20 to 19, lower = higher priority)
        self.dynamic_priority = {}  # {pid: calculated_priority}
        self.priority_boost_counter = {}  # Prevent starvation

        # --- CONTEXT SWITCH OVERHEAD ---
        self.context_switch_cost = 1  # Ticks of overhead per context switch
        self.context_switch_penalty_remaining = 0
        self.last_running_process = None

        # --- SYSTEM CALL INTERFACE ---
        self.syscall_log = []  # Log of all system calls
        self.syscall_stats = {}  # {syscall_name: count}
        self.blocked_on_syscall = {}  # {pid: syscall_name}

        # --- PROCESS CONTROL BLOCK (PCB) ---
        self.pcb = {}  # {pid: {'registers': {}, 'pc': int, 'sp': int, 'pid': int, 'ppid': int}}

    def create_snapshot(self):
        """Saves the current state of the graph to allow restarting."""
        self.initial_snapshot = {
            'graph': self.graph.copy(),
            'process_count': self.process_count,
            'resource_count': self.resource_count,
            'resource_instances': copy.deepcopy(self.resource_instances),
            'allocations': copy.deepcopy(self.allocations),
            'requests': copy.deepcopy(self.requests),
            'process_info': copy.deepcopy(self.process_info),
            'scheduler_mode': self.scheduler_mode,
            'time_quantum': self.time_quantum,
            'semaphores': copy.deepcopy(self.semaphores),
            'max_needs': copy.deepcopy(self.max_needs),
            'process_states': copy.deepcopy(self.process_states),
            # We don't save queues because restart implies resetting them to initial state
        }

    def restore_snapshot(self):
        """Restores the graph to the saved snapshot state."""
        if not self.initial_snapshot:
            return False

        snap = self.initial_snapshot
        self.graph = snap['graph'].copy()
        self.process_count = snap['process_count']
        self.resource_count = snap['resource_count']
        self.resource_instances = copy.deepcopy(snap['resource_instances'])
        self.allocations = copy.deepcopy(snap['allocations'])
        self.requests = copy.deepcopy(snap['requests'])
        self.process_info = copy.deepcopy(snap['process_info'])
        self.scheduler_mode = snap['scheduler_mode']
        self.time_quantum = snap['time_quantum']

        # Reset Runtime attributes
        self.wait_times = {pid: 0 for pid in self.process_info.keys()}
        self.current_running_process = None
        self.rr_quantum_timer = 0
        self.global_tick_counter = 0
        self.running_queue = []
        self.blocked_queue = []
        self.waiting_queue = {}
        self.context_switches = 0

        # Restore semaphores and synchronization
        self.semaphores = copy.deepcopy(snap.get('semaphores', {}))
        self.max_needs = copy.deepcopy(snap.get('max_needs', {}))
        self.process_states = copy.deepcopy(snap.get('process_states', {}))

        # Re-populate Ready Queue with all unfinished processes
        # In a restart, we assume all processes are back to 'Ready'
        self.ready_queue = [pid for pid in self.process_info.keys()]
        for pid in self.ready_queue:
            self.process_states[pid] = 'ready'
        self._sort_ready_queue()

        return True

    def add_process(self, burst_time=10, priority=5, nice=0, memory_mb=1):
        """Add process with real-world OS properties"""
        self.process_count += 1
        process_id = f"P{self.process_count}"
        self.graph.add_node(process_id, type='process')
        self.allocations[process_id] = {}
        self.requests[process_id] = {}
        self.wait_times[process_id] = 0
        self.max_needs[process_id] = {}  # For Banker's algorithm

        self.process_info[process_id] = {
            'burst': burst_time,
            'remaining': burst_time,
            'arrival': self.global_tick_counter,
            'state': 'ready',
            'priority': priority,
            'start_time': None,
            'completion_time': None
        }

        self.process_states[process_id] = 'ready'

        # Allocate memory pages (simulate virtual memory)
        pages_needed = (memory_mb * 1024) // self.page_size  # Convert MB to pages
        if self._allocate_memory(process_id, pages_needed):
            # Initialize file descriptor table
            self.file_descriptor_table[process_id] = {
                0: {'file': 'stdin', 'mode': 'r', 'offset': 0},
                1: {'file': 'stdout', 'mode': 'w', 'offset': 0},
                2: {'file': 'stderr', 'mode': 'w', 'offset': 0}
            }

            # Set nice value and calculate priority
            self.nice_values[process_id] = max(-20, min(19, nice))
            self._calculate_dynamic_priority(process_id)

            # Initialize page fault counter
            self.page_faults[process_id] = 0

            # Create Process Control Block (PCB)
            self.pcb[process_id] = {
                'registers': {'ax': 0, 'bx': 0, 'cx': 0, 'dx': 0},
                'pc': 0,  # Program counter
                'sp': 0,  # Stack pointer
                'pid': self.process_count,
                'ppid': 0,  # Parent PID (0 = init)
                'cpu_time': 0,
                'io_time': 0
            }

            # Add to ready queue (will be load-balanced across cores)
            self.ready_queue.append(process_id)
            self._sort_ready_queue()

            return process_id
        else:
            # Memory allocation failed - out of memory
            self.process_count -= 1
            return None

    def add_resource(self, instances, is_sharable=False):
        self.resource_count += 1
        resource_id = f"R{self.resource_count}"
        self.graph.add_node(resource_id, type='resource')
        self.resource_instances[resource_id] = {
            "total": instances,
            "available": instances,
            "sharable": is_sharable
        }

        # Initialize semaphore for this resource
        self.semaphores[resource_id] = {
            'value': instances,
            'queue': deque(),
            'max': instances
        }
        self.waiting_queue[resource_id] = []
        self.resource_locks[resource_id] = None

        return resource_id

    def allocate_resource(self, process, resource, max_need=None):
        """Request resource allocation - implements wait() operation"""
        if resource not in self.resource_instances or process not in self.allocations:
            return "error", "Process or Resource does not exist"

        # Set max need for Banker's algorithm
        if max_need is not None:
            self.max_needs[process][resource] = max_need

        # Check if allocation is safe (Banker's Algorithm check)
        if not self._is_safe_allocation(process, resource):
            return "unsafe", f"Allocation would lead to unsafe state. Request denied."

        # Try to acquire resource (wait operation)
        return self._wait(process, resource)

    def _wait(self, process, resource):
        """Semaphore wait() operation - P(S)"""
        semaphore = self.semaphores[resource]

        if semaphore['value'] > 0:
            # Resource available - grant immediately
            semaphore['value'] -= 1
            self.resource_instances[resource]["available"] -= 1
            self.allocations[process][resource] = self.allocations[process].get(resource, 0) + 1

            # Update graph
            self.graph.add_edge(resource, process, type='allocation')

            # Remove any pending requests
            if resource in self.requests[process]:
                del self.requests[process][resource]
                if self.graph.has_edge(process, resource):
                    self.graph.remove_edge(process, resource)

            self.wait_times[process] = 0

            # Set start time if first execution
            if self.process_info[process]['start_time'] is None:
                self.process_info[process]['start_time'] = self.global_tick_counter

            # Keep process in current queue (don't move to ready if blocked)
            if process in self.blocked_queue:
                self.blocked_queue.remove(process)
                if process not in self.ready_queue and process not in self.running_queue:
                    self.ready_queue.append(process)
                    self.process_states[process] = 'ready'
                    self._sort_ready_queue()

            return "success", f"✓ {process} acquired {resource} [Available: {semaphore['value']}]"

        else:
            # Resource not available - block process
            self.requests[process][resource] = self.requests[process].get(resource, 0) + 1
            self.graph.add_edge(process, resource, type='request')

            # Add to semaphore's waiting queue
            if process not in semaphore['queue']:
                semaphore['queue'].append(process)

            # Add to resource's waiting queue
            if process not in self.waiting_queue[resource]:
                self.waiting_queue[resource].append(process)

            # Move process to blocked state
            if process in self.running_queue:
                self.running_queue.remove(process)
                self.current_running_process = None
                self.rr_quantum_timer = 0
                self.context_switches += 1

            if process in self.ready_queue:
                self.ready_queue.remove(process)

            if process not in self.blocked_queue:
                self.blocked_queue.append(process)

            self.process_states[process] = 'blocked'
            self.process_info[process]['state'] = 'blocked'

            return "blocked", f"⏸ {process} blocked waiting for {resource} [Queue: {len(semaphore['queue'])}]"

    def release_resource(self, resource, process):
        """Release resource - implements signal() operation"""
        if resource not in self.allocations.get(process, {}) or self.allocations[process][resource] == 0:
            return False, "⚠ Allocation not found - process doesn't hold this resource"

        return self._signal(resource, process)

    def _signal(self, resource, process):
        """Semaphore signal() operation - V(S)"""
        semaphore = self.semaphores[resource]

        # Release the resource
        semaphore['value'] += 1
        self.resource_instances[resource]["available"] += 1
        self.allocations[process][resource] -= 1

        if self.allocations[process][resource] == 0:
            del self.allocations[process][resource]
            if self.graph.has_edge(resource, process):
                self.graph.remove_edge(resource, process)

        msg = f"✓ {process} released {resource} [Available: {semaphore['value']}]"

        # Wake up waiting process (FIFO order from semaphore queue)
        if semaphore['queue']:
            next_process = semaphore['queue'].popleft()

            # Remove from waiting queue
            if next_process in self.waiting_queue[resource]:
                self.waiting_queue[resource].remove(next_process)

            # Automatically allocate to the waiting process
            status, alloc_msg = self._wait(next_process, resource)

            if status == "success":
                msg += f" → Granted to {next_process} (woken from blocked state)"
            else:
                msg += f" → Failed to wake {next_process}: {alloc_msg}"

        return True, msg

    def _is_safe_allocation(self, process, resource):
        """Banker's Algorithm - Check if allocation leads to safe state"""
        # Simple safety check - can be extended for full Banker's algorithm
        # For now, check if granting resource won't cause immediate deadlock

        if resource not in self.resource_instances:
            return False

        # If resource is available, it's safe
        if self.resource_instances[resource]["available"] > 0:
            return True

        # Check if this would create a circular wait
        # Simulate allocation and check for cycles
        temp_graph = self.graph.copy()
        temp_graph.add_edge(process, resource, type='request')

        try:
            nx.find_cycle(temp_graph, orientation='original')
            # Cycle exists - not safe
            return False
        except nx.NetworkXNoCycle:
            # No cycle - safe
            return True

    def terminate_process(self, pid):
        """Terminate process and release all held resources"""
        # Release all held resources
        if pid in self.allocations:
            held_resources = list(self.allocations[pid].keys())
            for rid in held_resources:
                count = self.allocations[pid][rid]
                for _ in range(count):
                    self.release_resource(rid, pid)

        # Remove from all queues
        if pid in self.running_queue:
            self.running_queue.remove(pid)
        if pid in self.ready_queue:
            self.ready_queue.remove(pid)
        if pid in self.blocked_queue:
            self.blocked_queue.remove(pid)

        # Remove from waiting queues
        for resource, waiting_list in self.waiting_queue.items():
            if pid in waiting_list:
                waiting_list.remove(pid)

        # Remove from semaphore queues
        for resource, semaphore in self.semaphores.items():
            if pid in semaphore['queue']:
                semaphore['queue'].remove(pid)

        # Update state
        self.process_states[pid] = 'terminated'
        self.process_info[pid]['state'] = 'terminated'
        self.process_info[pid]['completion_time'] = self.global_tick_counter

        # Calculate turnaround time
        arrival = self.process_info[pid]['arrival']
        completion = self.process_info[pid]['completion_time']
        self.turnaround_times[pid] = completion - arrival

        self.current_running_process = None

    def set_scheduler(self, mode, quantum=2):
        self.scheduler_mode = mode
        self.time_quantum = quantum
        if self.current_running_process:
             self.ready_queue.append(self.current_running_process)
             self.current_running_process = None
             self.running_queue.clear()
        self._sort_ready_queue()

    def is_blocked(self, pid):
        return len(self.requests.get(pid, {})) > 0

    def tick(self):
        """Main simulation tick - advances time by 1 unit"""
        self.global_tick_counter += 1

        # Record timeline snapshot before state changes
        self._record_timeline_tick()

        # Update wait times for blocked processes
        for process in self.blocked_queue:
            self.wait_times[process] = self.wait_times.get(process, 0) + 1

        # Update wait times for processes with pending requests
        for process, reqs in self.requests.items():
            if reqs and self.process_states.get(process) == 'blocked':
                self.wait_times[process] = self.wait_times.get(process, 0) + 1

        # Schedule next process if CPU is idle
        if not self.running_queue and self.ready_queue:
             self._schedule_next()

        # Handle running process
        elif self.running_queue:
             # Time quantum expiration (Round Robin)
             if self.scheduler_mode == 'RR':
                 self.rr_quantum_timer += 1
                 if self.rr_quantum_timer >= self.time_quantum:
                     self._rotate_rr()
             # Preemption check (SJF)
             elif self.scheduler_mode == 'SJF':
                 self._check_sjf_preemption()

        # Execute current process
        if self.running_queue:
            pid = self.running_queue[0]
            self.current_running_process = pid
            self.process_states[pid] = 'running'
            self.process_info[pid]['state'] = 'running'

            # Record start time on first execution
            if self.process_info[pid]['start_time'] is None:
                self.process_info[pid]['start_time'] = self.global_tick_counter
                self.response_times[pid] = self.global_tick_counter - self.process_info[pid]['arrival']

            # Decrement remaining time
            self.process_info[pid]['remaining'] -= 1

            # Check for completion
            if self.process_info[pid]['remaining'] <= 0:
                self.process_info[pid]['remaining'] = 0
                self.terminate_process(pid)
        else:
            self.current_running_process = None

    def _schedule_next(self):
        """Schedule next process from ready queue"""
        self._sort_ready_queue()
        if self.ready_queue:
            next_proc = self.ready_queue.pop(0)
            self.running_queue.append(next_proc)
            self.process_states[next_proc] = 'running'
            self.process_info[next_proc]['state'] = 'running'
            self.rr_quantum_timer = 0
            self.context_switches += 1

    def _rotate_rr(self):
        old = self.running_queue.pop(0)
        if self.process_info[old]['remaining'] > 0:
            self.ready_queue.append(old)
        self._schedule_next()

    def _check_sjf_preemption(self):
        current = self.running_queue[0]
        self._sort_ready_queue()
        if self.ready_queue:
            candidate = self.ready_queue[0]
            if self.process_info[candidate]['remaining'] < self.process_info[current]['remaining']:
                old = self.running_queue.pop(0)
                self.ready_queue.append(old)
                self._schedule_next()

    def _sort_ready_queue(self):
        if self.scheduler_mode == 'SJF':
            self.ready_queue.sort(key=lambda p: self.process_info[p]['remaining'])

    def get_resource_utilization(self):
        stats = {}
        for r_id, info in self.resource_instances.items():
            total = info['total']
            avail = info['available']
            percent = ((total - avail) / total) * 100 if total > 0 else 0
            stats[r_id] = percent
        return stats

    def get_deadlock_cycle(self):
        """
        Detect deadlock using cycle detection in RAG.
        A deadlock exists if there's a cycle in the wait-for graph where:
        Process → Resource (request) → Process (holding) → Resource (request) → ...
        """
        try:
            # Method 1: Direct cycle detection in the RAG
            # This works because RAG has both allocation (R->P) and request (P->R) edges
            cycles = []

            # Try to find all cycles
            try:
                # For directed graphs, find_cycle finds one cycle starting from any node
                for node in self.graph.nodes():
                    try:
                        cycle = nx.find_cycle(self.graph, source=node, orientation="original")
                        if cycle:
                            # Verify this is a deadlock cycle (involves blocked processes)
                            blocked_in_cycle = False
                            for edge in cycle:
                                if edge[0].startswith('P') and self.process_states.get(edge[0]) == 'blocked':
                                    blocked_in_cycle = True
                                    break

                            if blocked_in_cycle:
                                return cycle
                    except nx.NetworkXNoCycle:
                        continue
            except:
                pass

            # Method 2: Build explicit wait-for graph for blocked processes only
            # More reliable for detecting actual deadlocks
            wait_for_graph = nx.DiGraph()

            # DEBUG: Print current state
            print("\n=== DEADLOCK DETECTION DEBUG ===")
            print(f"Blocked queue: {list(self.blocked_queue)}")
            print(f"Requests: {dict(self.requests)}")
            print(f"Allocations: {dict(self.allocations)}")

            # For each blocked process, find what it's waiting for
            for process in self.blocked_queue:
                print(f"\nAnalyzing blocked process: {process}")
                # Process is blocked, find what resources it's requesting
                for resource in self.requests.get(process, {}):
                    print(f"  {process} requests {resource}")
                    # Find which processes currently hold this resource
                    for holder_process in self.allocations:
                        if resource in self.allocations[holder_process] and self.allocations[holder_process][resource] > 0:
                            # Process is waiting for resource held by holder_process
                            # Create wait-for edge: process waits-for holder_process
                            wait_for_graph.add_edge(process, holder_process)
                            print(f"    {resource} held by {holder_process} → Added edge: {process} waits for {holder_process}")

            print(f"\nWait-for graph edges: {list(wait_for_graph.edges())}")
            print(f"Wait-for graph nodes: {list(wait_for_graph.nodes())}")

            # Detect cycle in wait-for graph
            if wait_for_graph.number_of_nodes() > 0:
                try:
                    # Find cycle in the simplified wait-for graph
                    wf_cycle = nx.find_cycle(wait_for_graph, orientation="original")
                    if wf_cycle:
                        print(f"CYCLE FOUND: {wf_cycle}")
                        # Convert back to RAG format for display
                        # Expand wait-for edges back to P->R->P format
                        expanded_cycle = []
                        for edge in wf_cycle:
                            p_waiting = edge[0]
                            p_holding = edge[1]
                            # Find the resource connecting them
                            for resource in self.requests.get(p_waiting, {}):
                                if resource in self.allocations.get(p_holding, {}):
                                    expanded_cycle.append((p_waiting, resource, 'forward'))
                                    expanded_cycle.append((resource, p_holding, 'forward'))
                                    break
                        return expanded_cycle if expanded_cycle else wf_cycle
                except nx.NetworkXNoCycle:
                    print("No cycle found in wait-for graph")
                    pass

            return None

        except Exception as e:
            # Fallback: if any error occurs, return None (no deadlock detected)
            return None

    def get_process_state(self, pid):
        """Get current state of process"""
        return self.process_states.get(pid, 'unknown')

    def get_blocked_processes(self):
        """Get list of all blocked processes with reasons"""
        blocked_info = {}
        for pid in self.blocked_queue:
            waiting_for = [r for r in self.requests.get(pid, {}).keys()]
            blocked_info[pid] = waiting_for
        return blocked_info

    def get_statistics(self):
        """Get simulation statistics"""
        completed = [p for p, state in self.process_states.items() if state == 'terminated']

        avg_turnaround = sum(self.turnaround_times.values()) / len(self.turnaround_times) if self.turnaround_times else 0
        avg_waiting = sum(self.waiting_times.values()) / len(self.waiting_times) if self.waiting_times else 0
        avg_response = sum(self.response_times.values()) / len(self.response_times) if self.response_times else 0

        return {
            'total_processes': self.process_count,
            'completed': len(completed),
            'running': len(self.running_queue),
            'ready': len(self.ready_queue),
            'blocked': len(self.blocked_queue),
            'context_switches': self.context_switches,
            'avg_turnaround_time': round(avg_turnaround, 2),
            'avg_waiting_time': round(avg_waiting, 2),
            'avg_response_time': round(avg_response, 2),
            'cpu_utilization': self._calculate_cpu_utilization()
        }

    def _calculate_cpu_utilization(self):
        """Calculate CPU utilization percentage"""
        if self.global_tick_counter == 0:
            return 0
        # Simple calculation: time with running process / total time
        return round((self.context_switches / max(1, self.global_tick_counter)) * 100, 2)

    def get_resource_info(self, resource_id):
        """Get detailed information about a resource"""
        if resource_id not in self.resource_instances:
            return None

        info = self.resource_instances[resource_id]
        semaphore = self.semaphores.get(resource_id, {})
        waiting = self.waiting_queue.get(resource_id, [])

        allocated_to = []
        for pid, allocs in self.allocations.items():
            if resource_id in allocs and allocs[resource_id] > 0:
                allocated_to.append((pid, allocs[resource_id]))

        return {
            'total': info['total'],
            'available': info['available'],
            'allocated': info['total'] - info['available'],
            'semaphore_value': semaphore.get('value', 0),
            'waiting_count': len(waiting),
            'waiting_processes': waiting,
            'allocated_to': allocated_to
        }

    def _record_timeline_tick(self):
        """Record current state for timeline/Gantt chart"""
        tick = self.global_tick_counter

        # Record event for each process
        for pid in self.process_info.keys():
            state = self.process_states.get(pid, 'unknown')

            # Initialize process timeline if needed
            if pid not in self.gantt_data:
                self.gantt_data[pid] = []

            # Check if state changed from last tick
            if self.gantt_data[pid]:
                last_entry = self.gantt_data[pid][-1]
                if last_entry['state'] == state:
                    # Continue current state
                    last_entry['end'] = tick
                else:
                    # State changed - start new entry
                    self.gantt_data[pid].append({
                        'start': tick,
                        'end': tick,
                        'state': state
                    })
            else:
                # First entry for this process
                self.gantt_data[pid].append({
                    'start': tick,
                    'end': tick,
                    'state': state
                })

            # Record in detailed timeline
            self.timeline.append({
                'tick': tick,
                'process': pid,
                'state': state,
                'queue': self._get_queue_for_process(pid)
            })

    def _get_queue_for_process(self, pid):
        """Get which queue a process is in"""
        if pid in self.running_queue:
            return 'running'
        elif pid in self.ready_queue:
            return 'ready'
        elif pid in self.blocked_queue:
            return 'blocked'
        else:
            return 'none'

    def get_gantt_data(self):
        """Get Gantt chart data for visualization"""
        return self.gantt_data

    def get_timeline_data(self):
        """Get detailed timeline data"""
        return self.timeline

    def clear_timeline(self):
        """Clear timeline data"""
        self.timeline = []
        self.gantt_data = {}
        self.process_timeline = {}

    # ========== REAL-WORLD OS IMPLEMENTATION ==========

    def _allocate_memory(self, pid, num_pages):
        """Allocate virtual memory pages for process"""
        if len(self.free_pages) < num_pages:
            # Try to free pages via swapping
            if not self._swap_out_pages(num_pages - len(self.free_pages)):
                return False  # OOM - Out of Memory

        # Allocate pages
        allocated = []
        for _ in range(num_pages):
            if self.free_pages:
                page = self.free_pages.pop(0)
                self.physical_memory[page] = pid
                allocated.append(page)

        # Create page table for process
        self.page_tables[pid] = {}
        for i, physical_page in enumerate(allocated):
            self.page_tables[pid][i] = physical_page  # Virtual page i -> Physical page

        # Track memory segments
        self.process_memory[pid] = {
            'code': num_pages // 4,    # 25% code
            'data': num_pages // 4,    # 25% data
            'heap': num_pages // 4,    # 25% heap
            'stack': num_pages // 4    # 25% stack
        }

        return True

    def _swap_out_pages(self, needed):
        """Swap pages to disk (simplified LRU)"""
        swapped = 0
        for page_idx, pid in enumerate(self.physical_memory):
            if pid and pid in self.process_states and self.process_states[pid] != 'running':
                # Swap out this page
                if pid not in self.swap_space:
                    self.swap_space[pid] = {}
                # Find virtual page for this physical page
                for vpage, ppage in self.page_tables.get(pid, {}).items():
                    if ppage == page_idx:
                        self.swap_space[pid][vpage] = True
                        del self.page_tables[pid][vpage]
                        break
                self.physical_memory[page_idx] = None
                self.free_pages.append(page_idx)
                swapped += 1
                if swapped >= needed:
                    return True
        return swapped >= needed

    def _handle_page_fault(self, pid, virtual_page):
        """Handle page fault - bring page from swap"""
        self.page_faults[pid] = self.page_faults.get(pid, 0) + 1

        if not self.free_pages:
            self._swap_out_pages(1)

        if self.free_pages:
            physical_page = self.free_pages.pop(0)
            self.physical_memory[physical_page] = pid
            self.page_tables[pid][virtual_page] = physical_page
            if pid in self.swap_space and virtual_page in self.swap_space[pid]:
                del self.swap_space[pid][virtual_page]
            return True
        return False

    def _calculate_dynamic_priority(self, pid):
        """Calculate dynamic priority from nice value and aging"""
        # Linux CFS-style: priority = 120 + nice (0-139 range)
        base_priority = 120 + self.nice_values.get(pid, 0)

        # Apply aging bonus (prevent starvation)
        aging_bonus = self.priority_boost_counter.get(pid, 0) // 10

        self.dynamic_priority[pid] = max(0, base_priority - aging_bonus)
        return self.dynamic_priority[pid]

    def syscall_open(self, pid, filepath, mode='r'):
        """System call: open file descriptor"""
        if pid not in self.file_descriptor_table:
            return -1, "Process does not exist"

        # Find next available FD
        used_fds = set(self.file_descriptor_table[pid].keys())
        for fd in range(3, self.max_fd_per_process):
            if fd not in used_fds:
                self.file_descriptor_table[pid][fd] = {
                    'file': filepath,
                    'mode': mode,
                    'offset': 0
                }
                self.open_files[filepath] = self.open_files.get(filepath, 0) + 1
                self.syscall_log.append({
                    'tick': self.global_tick_counter,
                    'pid': pid,
                    'syscall': 'open',
                    'details': f'fd={fd} file={filepath} mode={mode}'
                })
                self.syscall_stats['open'] = self.syscall_stats.get('open', 0) + 1
                return fd, f"Opened {filepath} as fd {fd}"

        return -1, "Too many open files"

    def syscall_close(self, pid, fd):
        """System call: close file descriptor"""
        if pid not in self.file_descriptor_table or fd not in self.file_descriptor_table[pid]:
            return False, "Invalid file descriptor"

        filepath = self.file_descriptor_table[pid][fd]['file']
        del self.file_descriptor_table[pid][fd]
        self.open_files[filepath] = max(0, self.open_files.get(filepath, 1) - 1)

        self.syscall_log.append({
            'tick': self.global_tick_counter,
            'pid': pid,
            'syscall': 'close',
            'details': f'fd={fd} file={filepath}'
        })
        self.syscall_stats['close'] = self.syscall_stats.get('close', 0) + 1
        return True, f"Closed fd {fd}"

    def syscall_fork(self, parent_pid):
        """System call: fork child process"""
        if parent_pid not in self.process_info:
            return None, "Parent process does not exist"

        # Create child process (copy parent's properties)
        parent_info = self.process_info[parent_pid]
        child_burst = parent_info['remaining']
        child_priority = parent_info['priority']
        child_nice = self.nice_values.get(parent_pid, 0)

        child_pid = self.add_process(
            burst_time=child_burst,
            priority=child_priority,
            nice=child_nice,
            memory_mb=1
        )

        if child_pid:
            # Update child's parent PID
            self.pcb[child_pid]['ppid'] = int(parent_pid[1:])

            # Copy file descriptors
            self.file_descriptor_table[child_pid] = copy.deepcopy(
                self.file_descriptor_table.get(parent_pid, {})
            )

            self.syscall_log.append({
                'tick': self.global_tick_counter,
                'pid': parent_pid,
                'syscall': 'fork',
                'details': f'Created child {child_pid}'
            })
            self.syscall_stats['fork'] = self.syscall_stats.get('fork', 0) + 1
            return child_pid, f"Forked child process {child_pid}"

        return None, "Fork failed - out of memory"

    def syscall_nice(self, pid, nice_increment):
        """System call: change process priority (nice value)"""
        if pid not in self.nice_values:
            return False, "Process does not exist"

        old_nice = self.nice_values[pid]
        new_nice = max(-20, min(19, old_nice + nice_increment))
        self.nice_values[pid] = new_nice
        self._calculate_dynamic_priority(pid)

        self.syscall_log.append({
            'tick': self.global_tick_counter,
            'pid': pid,
            'syscall': 'nice',
            'details': f'Changed from {old_nice} to {new_nice}'
        })
        self.syscall_stats['nice'] = self.syscall_stats.get('nice', 0) + 1
        return True, f"Nice value changed to {new_nice}"

    def get_memory_stats(self):
        """Get memory statistics"""
        used_pages = self.total_physical_memory - len(self.free_pages)
        used_mb = (used_pages * self.page_size) / 1024
        total_mb = (self.total_physical_memory * self.page_size) / 1024

        return {
            'total_memory_mb': round(total_mb, 2),
            'used_memory_mb': round(used_mb, 2),
            'free_memory_mb': round(total_mb - used_mb, 2),
            'utilization_percent': round((used_pages / self.total_physical_memory) * 100, 2),
            'total_page_faults': sum(self.page_faults.values()),
            'swapped_processes': len(self.swap_space)
        }

    def get_fd_stats(self, pid):
        """Get file descriptor statistics for process"""
        if pid not in self.file_descriptor_table:
            return None

        fds = self.file_descriptor_table[pid]
        return {
            'open_fds': len(fds),
            'max_fds': self.max_fd_per_process,
            'descriptors': list(fds.keys())
        }

    def get_syscall_stats(self):
        """Get system call statistics"""
        return {
            'total_syscalls': len(self.syscall_log),
            'by_type': dict(self.syscall_stats),
            'recent': self.syscall_log[-10:] if self.syscall_log else []
        }
