# Real-World OS Features Guide

## 🌟 Overview

This simulator now includes **real-world operating system features** to provide a more authentic OS kernel experience:

- **Virtual Memory Management** with paging and swapping
- **File Descriptor Management** (stdin/stdout/stderr + custom files)
- **System Call Interface** (fork, open, close, nice)
- **Priority Scheduling** with nice values (-20 to 19)
- **Process Control Blocks (PCB)** with registers, program counter, stack pointer
- **Page Fault Handling** and swap space management
- **Memory Statistics** showing utilization and page faults

---

## 💾 Memory Management

### Virtual Memory & Paging

Each process is allocated **virtual memory** divided into pages (4KB each):

**Default Configuration:**
- Total Physical Memory: **4 MB** (1024 pages × 4KB)
- Page Size: **4 KB**
- Memory Segments per Process:
  - 25% Code Segment (executable instructions)
  - 25% Data Segment (global/static variables)
  - 25% Heap (dynamic allocations)
  - 25% Stack (function calls, local vars)

### Creating Process with Memory

```bash
# Syntax: ap [burst_time] [nice_value] [memory_mb]
ap 20 0 1        # Process with 20s burst, nice=0, 1MB memory
ap 30 5 2        # Process with 30s burst, nice=5, 2MB memory
```

### Page Faults & Swapping

When physical memory is full:
1. System **swaps out** pages from non-running processes
2. Uses **LRU** (Least Recently Used) strategy
3. Swapped pages stored in **swap space** (simulated disk)
4. **Page faults** occur when accessing swapped pages
5. System brings pages back to physical memory

### View Memory Stats

```bash
memstats
```

**Output:**
```
=== MEMORY STATISTICS ===
Total Memory: 4.00 MB
Used Memory: 2.56 MB
Free Memory: 1.44 MB
Utilization: 64%
Total Page Faults: 15
Swapped Processes: 2
```

**Real-time Display:**
- Top panel shows: `💾 MEMORY MANAGEMENT`
- Updates automatically each tick

---

## 📂 File Descriptor Management

### Standard File Descriptors

Every process starts with 3 standard file descriptors:
- **fd 0**: `stdin` (read mode)
- **fd 1**: `stdout` (write mode)
- **fd 2**: `stderr` (write mode)

### Opening Files

```bash
# Syntax: open [Process] [filepath] [mode]
open P1 /data/config.txt r      # Read mode
open P1 /logs/output.log w      # Write mode
open P2 /tmp/cache.dat rw       # Read-write mode
```

**Returns:** File descriptor number (3, 4, 5, ...)

**Limit:** Max 1024 file descriptors per process

### Closing Files

```bash
# Syntax: close [Process] [fd]
close P1 3       # Close fd 3 for P1
close P2 5       # Close fd 5 for P2
```

### View File Descriptors

```bash
# Syntax: fdinfo [Process]
fdinfo P1
```

**Output:**
```
=== FILE DESCRIPTORS for P1 ===
Open FDs: 5/1024
  fd 0: stdin (mode: r)
  fd 1: stdout (mode: w)
  fd 2: stderr (mode: w)
  fd 3: /data/config.txt (mode: r)
  fd 4: /logs/output.log (mode: w)
```

---

## 📞 System Call Interface

### fork() - Create Child Process

```bash
# Syntax: fork [Parent_Process]
fork P1
```

**What happens:**
1. Creates **child process** (copy of parent)
2. Child inherits:
   - Remaining burst time
   - Priority & nice value
   - File descriptors (copied, not shared)
   - Memory allocation (1MB)
3. Child gets new **PID** (e.g., P4)
4. Parent PID recorded in child's **PCB**

**Example:**
```bash
ap 30 0 1        # Creates P1
fork P1          # Creates P2 (child of P1)
fork P1          # Creates P3 (another child of P1)
```

**Real-World Analogy:**
- Like Linux `fork()` system call
- Used to spawn new processes (e.g., shell executing commands)

### nice() - Change Process Priority

```bash
# Syntax: nice [Process] [delta]
nice P1 -5       # Increase priority (lower nice = higher priority)
nice P2 10       # Decrease priority (higher nice = lower priority)
```

**Nice Value Range:** -20 (highest priority) to +19 (lowest priority)

**Priority Calculation:**
- Linux CFS-style: `priority = 120 + nice`
- Lower priority number = runs first
- Nice value affects scheduling order

**Example:**
```bash
ap 30 0 1        # P1 with nice=0 (default)
ap 30 5 1        # P2 with nice=5 (lower priority)
nice P1 -10      # P1 now has nice=-10 (highest priority!)
```

**Real-World Analogy:**
- Like Linux `nice` command
- Used to give CPU priority to important tasks
- Background jobs typically run with nice=19

### open() - Open File Descriptor

```bash
# Syntax: open [Process] [filepath] [mode]
open P1 /etc/passwd r
```

**Modes:**
- `r` - Read only
- `w` - Write only
- `rw` - Read-write

**Returns:** File descriptor number or -1 on error

**Errors:**
- "Too many open files" (exceeded 1024 limit)
- "Process does not exist"

### close() - Close File Descriptor

```bash
# Syntax: close [Process] [fd]
close P1 3
```

**What happens:**
1. Removes fd from process's fd table
2. Decrements global reference count
3. If ref count = 0, file is fully closed

---

## 🎯 Process Control Block (PCB)

Each process has a **PCB** (like real OS):

```python
PCB = {
    'registers': {'ax': 0, 'bx': 0, 'cx': 0, 'dx': 0},
    'pc': 0,        # Program Counter
    'sp': 0,        # Stack Pointer
    'pid': 1,       # Process ID
    'ppid': 0,      # Parent PID (0 = init)
    'cpu_time': 0,  # Total CPU time used
    'io_time': 0    # Total I/O time
}
```

**Context Switches:**
- When process switches, PCB saves state
- New process's PCB is loaded
- Simulates real CPU register save/restore

---

## 📊 Real-World Statistics

### Memory Panel (UI)

**Location:** Below graph, left panel

**Displays:**
- Total Memory: 4.00 MB
- Used Memory: 2.56 MB
- Free Memory: 1.44 MB
- Utilization: 64%
- Page Faults: 15
- Swapped: 2

**Updates:** Real-time on every simulation tick

### System Call Panel (UI)

**Location:** Below graph, right panel

**Displays:**
- Total syscalls made
- Top 3 syscall types with counts
- Example: `fork(5), open(12), close(8)`

**Updates:** Real-time as syscalls are executed

---

## 🎮 Example Workflows

### Workflow 1: Memory-Intensive Application

```bash
# Create process with large memory footprint
ap 50 0 3         # P1: 3MB memory

# Create more processes to trigger swapping
ap 40 0 2         # P2: 2MB memory
ap 30 0 1         # P3: 1MB memory (may trigger swapping)

# Check memory stats
memstats

# Start simulation to see page faults
[Click Start Simulation]
```

**Expected:**
- Some pages swapped to disk
- Page faults increase as processes access swapped pages
- Memory utilization approaches 100%

---

### Workflow 2: File I/O Operations

```bash
# Create process
ap 30 0 1         # P1

# Open multiple files
open P1 /data/input.txt r
open P1 /logs/output.log w
open P1 /tmp/cache.dat rw

# Check open file descriptors
fdinfo P1

# Close files when done
close P1 3
close P1 4

# Check again
fdinfo P1
```

**Expected:**
- FDs allocated: 3, 4, 5
- After closing: only 0, 1, 2, 5 remain

---

### Workflow 3: Process Hierarchy with fork()

```bash
# Create parent process
ap 40 -5 1        # P1 (high priority)

# Fork children
fork P1           # Creates P2 (child of P1)
fork P1           # Creates P3 (another child of P1)
fork P2           # Creates P4 (grandchild - child of P2)

# Adjust priorities
nice P2 5         # Lower priority for P2
nice P3 10        # Even lower for P3

# Start simulation
[Click Start Simulation]
```

**Expected:**
- P1 runs first (highest priority)
- P2 runs second
- P3 runs last (lowest priority)
- Timeline shows execution order based on priority

---

### Workflow 4: Priority Scheduling

```bash
# Create processes with different priorities
ap 30 10 1        # P1: nice=10 (low priority)
ap 20 0 1         # P2: nice=0 (normal)
ap 25 -10 1       # P3: nice=-10 (high priority)

# Start simulation with SJF or FCFS
[Select SJF or FCFS]
[Click Start Simulation]
```

**Expected (SJF):**
- P3 runs first (shortest + highest priority)
- P2 runs second
- P1 runs last

---

## 🔬 Advanced Concepts

### 1. Page Replacement (LRU)

When memory is full:
```
Physical Memory: [P1, P1, P2, P2, P3, P3, ...]
All frames occupied.
New process P4 needs memory.
System swaps out P3 pages (not running).
P4 allocated to freed frames.
```

### 2. Virtual Address Translation

```
Virtual Address → Page Table → Physical Address
Process P1 wants page 5.
Page Table[5] = Frame 42
Access physical frame 42.
```

If page not in memory:
```
Page Table[5] = SWAPPED
→ Page Fault!
→ Load from disk
→ Update page table
→ Retry access
```

### 3. File Descriptor Inheritance (fork)

```bash
open P1 /data/config.txt r   # P1 opens fd 3
fork P1                       # Creates P2
fdinfo P1                     # Shows fd 3
fdinfo P2                     # Also shows fd 3 (copied, not shared)
close P1 3                    # P1 closes fd 3
fdinfo P2                     # P2 still has fd 3 open
```

Like real UNIX: Child gets **copy** of parent's fd table.

### 4. Priority Inversion (Demonstration)

```bash
# Low priority holds resource
ap 50 10 1        # P1: low priority
ar 1              # R1: mutex

wait P1 R1        # P1 acquires mutex

# High priority blocked by low priority!
ap 20 -10 1       # P2: high priority
wait P2 R1        # P2 blocks (priority inversion!)

[Start Simulation]
# P1 runs despite P2 having higher priority
# Demonstrates classic priority inversion problem
```

---

## 🎓 Learning Objectives

### Beginner
1. ✅ Understand **virtual memory** vs physical memory
2. ✅ Learn **page faults** and their cost
3. ✅ Explore **file descriptors** (stdin/stdout/stderr)
4. ✅ Practice **fork()** to create child processes

### Intermediate
1. ✅ Experiment with **priority scheduling** (nice values)
2. ✅ Handle **out-of-memory** conditions
3. ✅ Manage **limited resources** (FDs, memory)
4. ✅ Understand **context switch** overhead

### Advanced
1. ✅ Analyze **page replacement** algorithms (LRU)
2. ✅ Study **priority inversion** problem
3. ✅ Implement **resource hierarchies** with fork()
4. ✅ Optimize **memory usage** and **I/O operations**

---

## 📈 Performance Metrics

### Memory Efficiency

**Good:**
- Low page faults
- High memory utilization (70-90%)
- Few swapped processes

**Bad:**
- Frequent page faults (thrashing)
- Memory utilization 100% + many swapped
- OOM errors

### Syscall Overhead

**Track:**
- Total syscalls executed
- Most frequent syscalls
- Syscall distribution per process

**Optimize:**
- Reduce unnecessary `open/close` cycles
- Reuse file descriptors
- Batch operations

---

## 🚀 Quick Reference

### Commands Summary

| Command | Syntax | Description |
|---------|--------|-------------|
| `ap` | `ap [burst] [nice] [mem_mb]` | Add process with memory |
| `fork` | `fork [Parent]` | Create child process |
| `nice` | `nice [Process] [delta]` | Change priority |
| `open` | `open [P] [file] [mode]` | Open file descriptor |
| `close` | `close [P] [fd]` | Close file descriptor |
| `fdinfo` | `fdinfo [Process]` | Show open FDs |
| `memstats` | `memstats` | Show memory statistics |
| `stats` | `stats` | Show process statistics |

### Default Values

| Parameter | Default | Range |
|-----------|---------|-------|
| Burst Time | 10 | 1-100 |
| Nice Value | 0 | -20 to +19 |
| Memory (MB) | 1 | 1-4 |
| Total Memory | 4 MB | Fixed |
| Page Size | 4 KB | Fixed |
| Max FDs | 1024 | Per process |

---

## 🎯 Real-World Comparisons

| Simulator Feature | Real OS Equivalent | Example |
|-------------------|-------------------|---------|
| Virtual Memory | Linux Virtual Memory | Each process isolated |
| Page Faults | Page Fault Handler | Swap in from disk |
| File Descriptors | POSIX FDs | `open()`, `close()` |
| fork() | Linux `fork()` | Shell spawning commands |
| nice() | Linux `nice/renice` | Adjust process priority |
| PCB | task_struct (Linux) | Process metadata |
| Swap Space | Linux Swap Partition | /dev/sda2 swap |

---

**Now you're simulating a real OS kernel!** 🎉

Experiment with memory limits, create process trees with fork(), and see how real-world resource management works!
