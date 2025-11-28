let demoState = null;
let demoInterval = null;

function tryAlgorithm(algorithm) {
  // Close the tutorial pane
  closeAlgorithmDemo();

  // Map algorithm to scheduler name
  const schedulerMap = {
    'fcfs': 'FCFS',
    'sjf': 'SJF',
    'srtf': 'SRTF',
    'rr': 'Round Robin'
  };

  // Set the scheduler
  const schedulerName = schedulerMap[algorithm] || 'FCFS';
  selectScheduler(algorithm, schedulerName);

  // Load the corresponding test scenario from the library
  const scenarioMap = {
    'fcfs': 'fcfs_test',
    'sjf': 'sjf_test',
    'srtf': 'srtf_test',
    'rr': 'rr_test'
  };

  const scenario = scenarioMap[algorithm] || 'fcfs_test';
  loadScenario(scenario);
}
function startAlgoDemo(algorithm) {
  if (demoInterval) clearInterval(demoInterval);

  if (!demoState) {
    // Different arrival times for SRTF to show preemption
    const isSRTF = algorithm === 'srtf';
    demoState = {
      algorithm: algorithm,
      time: 0,
      processes: [
        { id: 'P1', burst: 8, remaining: 8, color: '#ffe600', arrival: 0, status: 'ready', arrived: false },
        { id: 'P2', burst: 4, remaining: 4, color: '#a3ffac', arrival: isSRTF ? 2 : 0, status: 'ready', arrived: false },
        { id: 'P3', burst: 9, remaining: 9, color: '#ffa3a3', arrival: isSRTF ? 4 : 0, status: 'ready', arrived: false },
        { id: 'P4', burst: 5, remaining: 5, color: '#d4a3ff', arrival: isSRTF ? 5 : 0, status: 'ready', arrived: false }
      ],
      gantt: [],
      quantum: 4,
      quantumRemaining: 4,
      currentProcess: null
    };
  }

  demoInterval = setInterval(() => runDemoStep(demoState), 400);
}

function runDemoStep(state) {
  // Mark processes as arrived and track arrivals
  let arrivals = [];
  state.processes.forEach(p => {
    if (state.time >= p.arrival && !p.arrived) {
      p.arrived = true;
      p.status = 'ready';
      arrivals.push(p);
    }
  });



  const readyProcesses = state.processes.filter(p => p.remaining > 0 && p.arrived);

  if (readyProcesses.length === 0) {
    // Check if all processes are done
    const allDone = state.processes.every(p => p.remaining === 0);
    if (allDone) {
      clearInterval(demoInterval);
      updateDemoQueue(state.processes, state.time, null);
      return;
    }
    // Wait for next process to arrive
    state.time++;
    state.gantt.push({ process: 'IDLE', color: '#cccccc' });
    document.getElementById('demo-time').textContent = state.time;
    updateDemoGantt(state.gantt);
    updateDemoQueue(state.processes, state.time, null);
    return;
  }

  let selected = null;

  if (state.algorithm === 'fcfs') {
    // FCFS: First arrived, first served
    selected = readyProcesses.sort((a, b) => a.arrival - b.arrival)[0];
  } else if (state.algorithm === 'sjf') {
    // SJF: Non-preemptive, select shortest burst time
    if (!state.currentProcess || state.currentProcess.remaining === 0) {
      selected = readyProcesses.sort((a, b) => a.burst - b.burst)[0];
    } else {
      selected = state.currentProcess;
    }
  } else if (state.algorithm === 'srtf') {
    // SRTF: Preemptive, always select shortest remaining time
    selected = readyProcesses.sort((a, b) => a.remaining - b.remaining)[0];
  } else if (state.algorithm === 'rr') {
    if (!state.currentProcess || state.quantumRemaining <= 0 || state.currentProcess.remaining <= 0) {
      const idx = state.currentProcess ? readyProcesses.findIndex(p => p.id === state.currentProcess.id) : -1;
      selected = readyProcesses[(idx + 1) % readyProcesses.length];
      state.quantumRemaining = state.quantum;
    } else {
      selected = state.currentProcess;
    }
  }

  if (selected) {
    selected.remaining--;
    state.time++;
    state.quantumRemaining--;
    state.currentProcess = selected;

    // Check if process just completed
    if (selected.remaining === 0) {
      selected.status = 'done';
    }

    state.gantt.push({ process: selected.id, color: selected.color });

    document.getElementById('demo-time').textContent = state.time;
    if (state.algorithm === 'rr') {
      document.getElementById('demo-quantum').textContent = state.quantumRemaining;
    }

    updateDemoGantt(state.gantt);
    updateDemoQueue(state.processes, state.time, selected);
  }
}
function resetAlgoDemo() {
  if (demoInterval) clearInterval(demoInterval);
  demoState = null;
  document.getElementById('demo-time').textContent = '0';
  if (document.getElementById('demo-quantum')) {
    document.getElementById('demo-quantum').textContent = '4';
  }
  document.getElementById('demo-gantt').innerHTML = '';
  document.getElementById('demo-queue').innerHTML = '<div style="color: #999; text-align: center; padding: 40px;">Click START DEMO to begin</div>';
}
