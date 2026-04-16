    // --- Core Functions ---
    function toggleSimulation() {
      const btn = document.getElementById('btn-play');
      const simControlBtn = document.getElementById('sim-control-play');
      const simControls = document.getElementById('sim-controls');

      if (isRunning) {
        clearInterval(simInterval);
        isRunning = false;
        btn.innerHTML = '<i class="fas fa-play"></i> Run OS';
        btn.classList.remove('danger');
        btn.classList.add('primary');
        if (simControlBtn) {
          simControlBtn.innerHTML = '<i class="fas fa-play"></i>';
          simControlBtn.classList.remove('danger');
          simControlBtn.classList.add('primary');
        }
        printToCli("Simulation Paused.");
        if (window.pushNarratorEvent) pushNarratorEvent('pause', {});

        if (window.Session) Session.broadcast('sim_update', { type: 'stop' });
      } else {
        // Only set simulationStartTime on first start, not on resume
        if (simulationStartTime === 0) {
          simulationStartTime = Date.now();
          simulationTime = 0;

          // Initialize arrival time for all existing processes at simulation start
          nodes.filter(n => n.type === 'process').forEach(p => {
            if (!processMetrics[p.id]) {
              processMetrics[p.id] = {
                label: p.label,
                arrivalTime: 0,
                firstRunTime: null,
                completionTime: null,
                totalExecutionTime: 0,
                turnaroundTime: 0,
                waitingTime: 0,
                responseTime: 0,
                executionSegments: [],
                created: true
              };
            } else if (processMetrics[p.id].arrivalTime === null) {
              processMetrics[p.id].arrivalTime = 0;
            }
          });

          // Show simulation controls with animation
          if (simControls) {
            simControls.style.display = 'block';
            setTimeout(() => {
              simControls.style.opacity = '1';
              simControls.style.transform = 'translateX(-50%) translateY(0)';
            }, 10);
          }
        }

        simInterval = setInterval(scheduler, simSpeed);
        isRunning = true;
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        btn.classList.remove('primary');
        btn.classList.add('danger');
        if (simControlBtn) {
          simControlBtn.innerHTML = '<i class="fas fa-pause"></i>';
          simControlBtn.classList.remove('primary');
          simControlBtn.classList.add('danger');
        }
        const algoName = { 'fcfs': 'FCFS', 'sjf': 'SJF', 'srtf': 'SRTF', 'rr': 'Round Robin' }[schedulingAlgorithm];
        const quantumInfo = schedulingAlgorithm === 'rr' ? ` (Q=${timeQuantum})` : '';

        printToCli(`Simulation Running... [${algoName}${quantumInfo}]`);
        if (window.pushNarratorEvent) pushNarratorEvent('start', {
          processes: nodes.filter(n => n.type === 'process').length,
          algo: (schedulingAlgorithm || 'fcfs').toUpperCase()
        });

        if (window.Session) Session.broadcast('sim_update', { type: 'start' });
      }
    }

    // Save current state to history
    function saveSimulationState() {
      const state = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        simulationTime: simulationTime,
        ganttData: JSON.parse(JSON.stringify(ganttData)),
        processMetrics: JSON.parse(JSON.stringify(processMetrics)),
        processWaitTimes: JSON.parse(JSON.stringify(processWaitTimes)),
        quantumRemaining: quantumRemaining
      };

      simulationHistory.push(state);

      // Limit history size
      if (simulationHistory.length > maxHistorySize) {
        simulationHistory.shift();
      }
    }

    // Restore state from history
    function restoreSimulationState(state) {
      nodes = JSON.parse(JSON.stringify(state.nodes));
      edges = JSON.parse(JSON.stringify(state.edges));
      simulationTime = state.simulationTime;
      ganttData = JSON.parse(JSON.stringify(state.ganttData));
      processMetrics = JSON.parse(JSON.stringify(state.processMetrics));
      processWaitTimes = JSON.parse(JSON.stringify(state.processWaitTimes));
      quantumRemaining = state.quantumRemaining;

      updateDisplay();
      draw();
    }

    // Step simulation forward or backward
    function stepSimulation(direction) {
      if (direction > 0) {
        // Step forward
        const wasRunning = isRunning;
        if (wasRunning) {
          toggleSimulation(); // Pause
        }

        for (let i = 0; i < stepSize; i++) {
          saveSimulationState();
          scheduler();
        }

        printToCli(`Stepped forward ${stepSize} cycle(s). Time: ${simulationTime}`);
      } else if (direction < 0) {
        // Step backward
        if (simulationHistory.length === 0) {
          printToCli('Cannot step back: No history available', 'error');
          return;
        }

        const wasRunning = isRunning;
        if (wasRunning) {
          toggleSimulation(); // Pause
        }

        // Go back by stepSize or available history
        const stepsBack = Math.min(stepSize, simulationHistory.length);
        for (let i = 0; i < stepsBack; i++) {
          if (simulationHistory.length > 0) {
            simulationHistory.pop(); // Remove current state
          }
        }

        if (simulationHistory.length > 0) {
          const previousState = simulationHistory[simulationHistory.length - 1];
          restoreSimulationState(previousState);
          printToCli(`Stepped back ${stepsBack} cycle(s). Time: ${simulationTime}`);
        } else {
          printToCli('Cannot step back further', 'error');
        }
      }
    }

    // Change simulation speed
    function changeSimSpeed(mode) {
      const speedIndicator = document.getElementById('sim-speed-indicator');

      if (mode === 'slow') {
        simSpeed = Math.min(simSpeed * 2, 2000); // Slower = higher interval
        systemConfig.simSpeed = simSpeed;
        document.getElementById('config-sim-speed').value = simSpeed;
      } else if (mode === 'fast') {
        simSpeed = Math.max(simSpeed / 2, 50); // Faster = lower interval
        systemConfig.simSpeed = simSpeed;
        document.getElementById('config-sim-speed').value = simSpeed;
      }

      // Update speed indicator
      if (simSpeed <= 100) {
        speedIndicator.textContent = 'FAST';
        speedIndicator.style.color = '#00ff00';
      } else if (simSpeed <= 200) {
        speedIndicator.textContent = 'NORMAL';
        speedIndicator.style.color = '#000';
      } else if (simSpeed <= 500) {
        speedIndicator.textContent = 'SLOW';
        speedIndicator.style.color = '#ff9800';
      } else {
        speedIndicator.textContent = 'VERY SLOW';
        speedIndicator.style.color = '#ff0000';
      }

      // Restart interval if running
      if (isRunning) {
        clearInterval(simInterval);
        simInterval = setInterval(scheduler, simSpeed);
      }

      printToCli(`Simulation speed: ${simSpeed}ms`);
    }

    // Update step size from settings
    function updateStepSize(value) {
      stepSize = parseInt(value) || 1;
      printToCli(`Step size set to ${stepSize} cycle(s)`);
    }
