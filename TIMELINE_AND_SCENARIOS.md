# Process Timeline & Scenario Generator Guide

## 🎯 New Features

### 1. **Process Timeline / Gantt Chart**
Real-time visualization of process execution history showing when each process was Running, Ready, or Blocked.

#### Features:
- **Color-coded bars**:
  - 🟢 Green = Running (executing on CPU)
  - 🔵 Cyan = Ready (waiting for CPU)
  - 🔴 Red = Blocked (waiting for resources)
  - ⚫ Gray = Terminated

- **Time scale**: Shows elapsed time in seconds
- **Process rows**: One row per process showing complete execution history
- **Real-time updates**: Updates every tick during simulation

#### How to Use:
1. Start simulation (processes begin executing)
2. Watch the Gantt chart grow as time progresses
3. Each bar segment shows process state during that time period
4. Click **Clear** button to reset timeline (useful for new scenarios)

#### What You Can Learn:
- **Process starvation**: See if any process waits too long
- **Context switches**: Visualize when processes switch
- **Blocking periods**: See when processes wait for resources
- **CPU utilization**: Empty spaces = CPU idle time
- **Scheduling effectiveness**: Compare algorithms visually

---

### 2. **Automatic Scenario Generator**
One-click setup of classic OS synchronization problems with pre-configured processes and resources.

## 📚 Available Scenarios

### **1. Producer-Consumer**
**Classic bounded buffer problem**

**Setup:**
- 1 Producer process (30s burst time)
- 1 Consumer process (30s burst time)
- Mutex (1 instance) - for critical section
- Empty slots (5 instances) - available buffer space
- Full slots (0 instances) - items in buffer

**What It Demonstrates:**
- Synchronization between producer and consumer
- Bounded buffer management
- Wait/signal operations for coordination

**Try This:**
```bash
# After loading scenario:
wait P1 R2     # Producer waits for empty slot
wait P1 R1     # Producer enters critical section
signal R1 P1   # Producer exits critical section
signal R3 P1   # Producer signals item ready

wait P2 R3     # Consumer waits for item
wait P2 R1     # Consumer enters critical section
signal R1 P2   # Consumer exits critical section
signal R2 P2   # Consumer signals empty slot
```

---

### **2. Readers-Writers**
**Multiple readers, single writer problem**

**Setup:**
- 2 Reader processes (20s each)
- 1 Writer process (25s)
- Write lock (1 instance) - exclusive access for writers
- Read count lock (1 instance) - protects reader count

**What It Demonstrates:**
- Multiple readers can read simultaneously
- Writers need exclusive access
- Priority handling (readers vs writers)

**Behavior:**
- Readers can share the resource
- Writer must wait for all readers to finish
- Shows potential writer starvation

---

### **3. Dining Philosophers**
**Classic deadlock demonstration**

**Setup:**
- 5 Philosophers (P1-P5)
- 5 Forks/Chopsticks (R1-R5)
- Each philosopher needs 2 forks to eat

**What It Demonstrates:**
- Circular wait conditions
- Deadlock scenario (if all pick up left fork simultaneously)
- Resource ordering solution

**Deadlock Scenario:**
```bash
wait P1 R1     # Phil 1 picks up fork 1 (left)
wait P2 R2     # Phil 2 picks up fork 2 (left)
wait P3 R3     # Phil 3 picks up fork 3 (left)
wait P4 R4     # Phil 4 picks up fork 4 (left)
wait P5 R5     # Phil 5 picks up fork 5 (left)

# Now everyone waits for right fork...
wait P1 R2     # BLOCKS (P2 has it)
wait P2 R3     # BLOCKS (P3 has it)
wait P3 R4     # BLOCKS (P4 has it)
wait P4 R5     # BLOCKS (P5 has it)
wait P5 R1     # BLOCKS (P1 has it) → DEADLOCK!
```

**Solution:**
Make one philosopher pick up forks in reverse order to break circular wait.

---

### **4. Simple Deadlock**
**Intentional deadlock for learning**

**Setup:**
- 2 Processes (P1, P2)
- 2 Resources (R1, R2)
- Minimal scenario for easy understanding

**What It Demonstrates:**
- Circular wait condition
- Hold and wait condition
- Deadlock detection using `check` command

**Auto-executed:**
The scenario automatically runs these commands:
```bash
wait P1 R1     # P1 acquires R1
wait P2 R2     # P2 acquires R2
wait P1 R2     # P1 blocks waiting for R2
wait P2 R1     # P2 blocks waiting for R1 → DEADLOCK
```

Then use `check` to detect the circular wait!

---

### **5. Resource Pool**
**Resource contention demonstration**

**Setup:**
- 4 Processes (P1-P4)
- 1 Resource Pool with 3 instances
- Shows multiple processes sharing limited resources

**What It Demonstrates:**
- Resource pooling
- Process blocking when resources exhausted
- Automatic wake-up when resources released

**Auto-executed:**
```bash
wait P1 R1     # P1 gets instance (2 left)
wait P2 R1     # P2 gets instance (1 left)
wait P3 R1     # P3 gets instance (0 left)
wait P4 R1     # P4 BLOCKS (no instances available)
```

**Then try:**
```bash
signal R1 P1   # P1 releases → P4 automatically acquires!
```

---

### **6. Critical Section**
**Mutual exclusion demonstration**

**Setup:**
- 3 Processes (P1, P2, P3)
- 1 Mutex (binary semaphore)
- Only one process can be in critical section

**What It Demonstrates:**
- Binary semaphore usage
- Mutual exclusion
- FIFO queue for fairness

**Auto-executed:**
```bash
wait P1 R1     # P1 enters critical section
wait P2 R1     # P2 blocks (mutex held)
wait P3 R1     # P3 blocks (queue: [P2, P3])
```

**Then:**
```bash
signal R1 P1   # P1 exits → P2 automatically enters
signal R1 P2   # P2 exits → P3 automatically enters
signal R1 P3   # P3 exits → All done!
```

---

## 🎮 How to Use Scenarios

### Method 1: UI Loading
1. In sidebar, find **SCENARIOS** section
2. Select scenario from dropdown
3. Click **Load Scenario** button
4. Read instructions in console
5. Click **Start Simulation**
6. Follow suggested commands to interact

### Method 2: Understanding Auto-Commands
Some scenarios auto-execute setup commands to demonstrate the problem immediately. Watch the console for:
- ✓ Success messages (resource acquired)
- ⏸ Blocked messages (process waiting)
- → Wake-up messages (process unblocked)

### Method 3: Experimentation
After loading a scenario:
- Try different command sequences
- Intentionally create deadlocks
- Test recovery strategies
- Compare with different schedulers

---

## 📊 Using Timeline with Scenarios

The Gantt chart is especially powerful with scenarios:

1. **Load scenario** (e.g., "Simple Deadlock")
2. **Start simulation**
3. **Execute wait/signal commands**
4. **Watch timeline** show:
   - When processes transition between states
   - How long processes wait (blocked = red bars)
   - CPU utilization (gaps = idle)
   - Context switches (state changes)

### Example: Analyzing Simple Deadlock

After loading Simple Deadlock scenario:
```bash
[Start Simulation]
```

**Timeline shows:**
- **Tick 0-2**: Both processes running (green) - FCFS alternates
- **Tick 3**: P1 blocks (turns red) after `wait P1 R2`
- **Tick 4**: P2 blocks (turns red) after `wait P2 R1`
- **Tick 5+**: Both stay red (blocked) - DEADLOCK!

```bash
check          # Confirms deadlock
```

---

## 💡 Pro Tips

### 1. **Compare Schedulers**
Load same scenario, try different algorithms:
- FCFS: Processes execute in order
- SJF: Shortest remaining time first
- Round Robin: Time-sharing with quantum

Watch how timeline changes!

### 2. **Measure Performance**
After running scenario:
```bash
stats
```
Compare:
- Turnaround time
- Waiting time
- Context switches
- CPU utilization

### 3. **Create Variants**
Load scenario, then modify:
- Add more processes: `ap 15`
- Add more resources: `ar 2`
- Change time quantum for Round Robin
- Experiment with different allocation orders

### 4. **Teaching Tool**
Scenarios are perfect for:
- Demonstrating concepts in class
- Homework assignments
- Understanding deadlock conditions
- Learning synchronization primitives

### 5. **Debugging**
Use timeline to:
- Identify which process is starving
- See blocking patterns
- Find inefficient resource usage
- Optimize allocation strategies

---

## 🎓 Learning Progression

### Beginner:
1. Start with **Critical Section** (simplest)
2. Understand wait/signal operations
3. See mutex in action

### Intermediate:
1. Try **Resource Pool** (multiple instances)
2. Try **Simple Deadlock** (intentional circular wait)
3. Practice deadlock detection

### Advanced:
1. **Producer-Consumer** (full synchronization)
2. **Readers-Writers** (complex coordination)
3. **Dining Philosophers** (classic problem)

---

## 🔧 Timeline Controls

| Action | How To |
|--------|--------|
| **View timeline** | Automatically visible during simulation |
| **Clear timeline** | Click "Clear" button above Gantt chart |
| **Zoom/Scroll** | Timeline auto-scales to fit all data |
| **Pause** | Click "⏸ Pause Simulation" button |
| **Step through** | Pause, then wait/signal commands tick-by-tick |

---

## 🎯 Quick Reference

### Scenario Quick Commands

**Producer-Consumer:**
```bash
wait P1 R2; wait P1 R1; signal R1 P1; signal R3 P1
wait P2 R3; wait P2 R1; signal R1 P2; signal R2 P2
```

**Simple Deadlock:**
```bash
wait P1 R1; wait P2 R2; wait P1 R2; wait P2 R1; check
```

**Resource Pool:**
```bash
wait P1 R1; wait P2 R1; wait P3 R1; wait P4 R1; signal R1 P1
```

**Critical Section:**
```bash
wait P1 R1; wait P2 R1; wait P3 R1; signal R1 P1; signal R1 P2
```

---

**Enjoy exploring OS resource allocation with visual feedback!** 🚀
