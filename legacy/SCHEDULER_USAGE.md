# Process Scheduler Usage Guide

## Overview
The Resource Allocation Simulator now features a fully functional process scheduler with three scheduling algorithms:

1. **FCFS (First Come First Serve)** - Processes execute in the order they arrive
2. **SJF (Shortest Job First)** - Process with shortest remaining time executes first
3. **RR (Round Robin)** - Each process gets a time quantum before switching

## How to Use

### 1. Select Scheduling Algorithm
In the sidebar under **CONFIGURATION**:
- Use the **Algorithm** dropdown to select: "First Come First Serve", "Shortest Job First", or "Round Robin"
- The current algorithm is displayed in the Process Timeline header (e.g., "FCFS", "SJF", "RR (Q=2)")

### 2. Set Time Quantum (for Round Robin)
- Use the **Time Quantum** spinner to set how many time units each process gets before switching
- Default is 2 time units
- Only affects Round Robin scheduling

### 3. Add Processes
Click **Add Process** button or use CLI command:
```
ap 10
```
This creates a process with burst time of 10 time units.

### 4. Add Resources
Click **Add Resource** button or use CLI command:
```
ar 3
```
This creates a resource with 3 instances.

### 5. Allocate Resources
Click **Allocate Resource** button and select process/resource, or use CLI:
```
alloc P1 R1
```

### 6. Start Simulation
Click **▶ Start Simulation** to begin process execution:
- The running process appears in the **RUNNING** section (green highlight)
- Waiting processes appear in the **WAITING** section (gray blocks)
- Each process shows remaining time (e.g., "5s")
- Progress bar indicates completion percentage

### 7. Monitor Behavior

#### FCFS Behavior
- Processes execute in arrival order
- Once started, a process runs until completion (non-preemptive)
- New processes join the end of the queue

#### SJF Behavior
- Process with shortest remaining time executes
- Preemptive: if a new process arrives with shorter time, it preempts current process
- Minimizes average waiting time

#### Round Robin Behavior
- Each process gets exactly `Time Quantum` seconds
- After quantum expires, process moves to back of queue
- Fair time-sharing, prevents starvation

### 8. Save/Restore State
- **Save State**: Creates a snapshot of current system state
- **Restore State**: Returns to the saved snapshot

### 9. Deadlock Detection
Click **Check Deadlock** to detect circular wait conditions in the resource allocation graph.

### 10. Reset System
Click **Reset System** to clear all processes and resources and start fresh.

## CLI Commands
Type commands in the bottom terminal:

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show available commands | `help` |
| `ap [burst]` | Add process with burst time | `ap 15` |
| `ar [qty]` | Add resource with quantity | `ar 2` |
| `alloc [P] [R]` | Allocate resource to process | `alloc P1 R1` |
| `release [R] [P]` | Release resource from process | `release R1 P1` |
| `check` | Check for deadlocks | `check` |
| `save` | Save current state | `save` |
| `load` | Restore saved state | `load` |
| `reset` | Reset entire system | `reset` |

## Visual Indicators

### Process Timeline
- **Green block with glow**: Currently running process
- **Gray blocks**: Processes waiting in ready queue
- **Progress bar**: Shows completion percentage (white bar at bottom)
- **Number display**: Shows remaining burst time

### Graph View
- **Circles**: Processes
  - Green with white border: Running
  - Cyan: Ready/Waiting
  - Gray: Completed
- **Squares**: Resources
  - Purple border indicates available instances
- **Edges**:
  - Solid cyan arrow (R→P): Resource allocated to process
  - Dashed gray arrow (P→R): Process requesting resource (blocked)

### Resource Utilization
- **Green bar**: < 50% utilized
- **Orange bar**: 50-80% utilized
- **Red bar**: > 80% utilized

## Example Scenarios

### Test FCFS
1. Select "First Come First Serve"
2. Add 3 processes: `ap 5`, `ap 8`, `ap 3`
3. Click Start - they execute in order P1→P2→P3

### Test SJF
1. Select "Shortest Job First"
2. Add 3 processes: `ap 10`, `ap 5`, `ap 15`
3. Click Start - executes P2 (5s) first, then P1 (10s), then P3 (15s)

### Test Round Robin
1. Select "Round Robin"
2. Set Time Quantum to 2
3. Add 3 processes: `ap 6`, `ap 4`, `ap 8`
4. Click Start - switches every 2 seconds: P1→P2→P3→P1→P2→P3...

### Test Resource Blocking
1. Add process: `ap 10`
2. Add resource: `ar 1`
3. Allocate: `alloc P1 R1`
4. Add second process: `ap 5`
5. Try allocate: `alloc P2 R1` - P2 will be blocked
6. Release: `release R1 P1` - R1 auto-allocates to P2

Enjoy experimenting with different scheduling algorithms!
