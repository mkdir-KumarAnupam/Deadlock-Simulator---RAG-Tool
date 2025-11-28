    function selectScheduler(algo, label) {
      schedulingAlgorithm = algo;
      document.getElementById('scheduler-label').textContent = label;
      const quantumContainer = document.getElementById('quantum-container');
      if (algo === 'rr') {
        quantumContainer.classList.remove('hidden');
      } else {
        quantumContainer.classList.add('hidden');
      }
      timeQuantum = parseInt(document.getElementById('quantum-input').value) || 20;
      quantumRemaining = timeQuantum;
      printToCli(`Scheduler changed to: ${label}`, 'info');
      if (isRunning) {
        printToCli('Note: Changes take effect on next scheduling decision', 'info');
      }
    }

    // --- Simulation & Scheduler ---

    function updateProcessStates() {
      nodes.filter(n => n.type === 'process' && n.state !== 'TERMINATED').forEach(p => {
        const requests = edges.filter(e => e.source === p.id);
        if (requests.length > 0) {
          if (p.state !== 'BLOCKED') {
            p.state = 'BLOCKED';
            if (currentRunningNodeId === p.id) currentRunningNodeId = null;
          }
        } else {
          if (p.state === 'BLOCKED') p.state = 'READY';
          if (!p.state) p.state = 'READY';
        }
      });
      updateSystemStats();
    }

    function scheduler() {
      let activeLabel = "IDLE";
      let activeColor = "#eee";
      let preempted = false;

      // Update quantum input if changed
      if (schedulingAlgorithm === 'rr') {
        const newQuantum = parseInt(document.getElementById('quantum-input').value) || 20;
        if (newQuantum !== timeQuantum && !currentRunningNodeId) {
          timeQuantum = newQuantum;
          quantumRemaining = timeQuantum;
        }
      }

      // Execute current running process
      if (currentRunningNodeId) {
        const p = getNodeById(currentRunningNodeId);
        if (p && p.state === 'RUNNING') {
          p.burstTime -= 5;
          quantumRemaining -= 5;
          activeLabel = p.label;
          activeColor = config.colors.running;

          // Check if process completed
          if (p.burstTime <= 0) {
            terminateProcess(p);
          }
          // Round Robin: Check quantum expiry
          else if (schedulingAlgorithm === 'rr' && quantumRemaining <= 0) {
            p.state = 'READY';
            // Move to back of queue by updating a priority timestamp
            p.lastPreemptTime = Date.now();
            triggerContextSwitch(p.id); // Visual animation
            currentRunningNodeId = null;
            quantumRemaining = timeQuantum;
            preempted = true;
            printToCli(`${p.label} quantum expired - context switch`, 'info');
          }
          // SRTF: Check for preemption
          else if (schedulingAlgorithm === 'srtf') {
            const readyProcesses = nodes.filter(n =>
              n.type === 'process' &&
              n.state === 'READY' &&
              n.burstTime > 0
            );
            const shorterProcess = readyProcesses.find(n => n.burstTime < p.burstTime);
            if (shorterProcess) {
              p.state = 'READY';
              triggerContextSwitch(p.id); // Visual animation
              currentRunningNodeId = null;
              preempted = true;
              printToCli(`${p.label} preempted by ${shorterProcess.label} (SRTF)`, 'info');
            }
            if (shorterProcess) {
              p.state = 'READY';
              triggerContextSwitch(p.id); // Visual animation
              currentRunningNodeId = null;
              preempted = true;
              printToCli(`${p.label} preempted by ${shorterProcess.label} (SRTF)`, 'info');
            }
          }
          // Priority (Preemptive): Check for preemption
          else if (schedulingAlgorithm === 'priority_p') {
            const readyProcesses = nodes.filter(n =>
              n.type === 'process' &&
              n.state === 'READY' &&
              n.burstTime > 0
            );
            // Find if any ready process has strictly higher priority (lower value)
            const higherPriorityProcess = readyProcesses.find(n => (n.priority || 1) < (p.priority || 1));
            if (higherPriorityProcess) {
              p.state = 'READY';
              triggerContextSwitch(p.id); // Visual animation
              currentRunningNodeId = null;
              preempted = true;
              printToCli(`${p.label} (Prio ${p.priority || 1}) preempted by ${higherPriorityProcess.label} (Prio ${higherPriorityProcess.priority || 1})`, 'info');
            }
          }
          // Update properties panel if open
          else if (!propPanel.classList.contains('hidden')) {
            const content = document.getElementById('prop-content');
            if (content.innerText.includes(`ID: ${p.label}`)) openProps(p);
          }
        } else {
          currentRunningNodeId = null;
        }
      }

      // Select next process based on algorithm
      if (!currentRunningNodeId) {
        const candidates = nodes.filter(n =>
          n.type === 'process' &&
          n.state === 'READY' &&
          n.burstTime > 0
        );

        if (candidates.length > 0) {
          let nextP = null;

          switch (schedulingAlgorithm) {
            case 'fcfs':
              // First Come First Served - first in ready queue
              nextP = candidates[0];
              break;

            case 'sjf':
              // Shortest Job First - process with shortest original burst time
              nextP = candidates.reduce((shortest, p) =>
                p.originalBurst < shortest.originalBurst ? p : shortest
              );
              break;

            case 'srtf':
              // Shortest Remaining Time First - process with shortest remaining time
              nextP = candidates.reduce((shortest, p) =>
                p.burstTime < shortest.burstTime ? p : shortest
              );
              break;

            case 'rr':
              // Round Robin - first in ready queue (FIFO order), reset quantum
              // Sort by last preempt time to ensure proper queue order
              candidates.sort((a, b) => {
                const timeA = a.lastPreemptTime || a.arrivalTime || 0;
                const timeB = b.lastPreemptTime || b.arrivalTime || 0;
                return timeA - timeB;
              });
              nextP = candidates[0];
              quantumRemaining = timeQuantum;
              break;

            case 'priority_np':
              // Priority Non-Preemptive - process with lowest priority value
              nextP = candidates.reduce((highest, p) =>
                (p.priority || 1) < (highest.priority || 1) ? p : highest
              );
              break;

            case 'priority_p':
              // Priority Preemptive - process with lowest priority value
              nextP = candidates.reduce((highest, p) =>
                (p.priority || 1) < (highest.priority || 1) ? p : highest
              );
              break;

            default:
              nextP = candidates[0];
          }

          if (nextP) {
            nextP.state = 'RUNNING';
            currentRunningNodeId = nextP.id;
            activeLabel = nextP.label;
            activeColor = config.colors.running;

            // Initialize metrics for new process
            if (!processMetrics[nextP.id]) {
              // If process was created before simulation started, arrival time is 0
              // If created during simulation, arrival time is current time
              const arrivalTime = processMetrics[nextP.id]?.created ? 0 : (Date.now() - simulationStartTime);
              processMetrics[nextP.id] = {
                label: nextP.label,
                arrivalTime: arrivalTime,
                firstRunTime: null,
                completionTime: null,
                totalExecutionTime: 0,
                turnaroundTime: 0,
                waitingTime: 0,
                responseTime: 0,
                executionSegments: [],
                created: true
              };
            }

            // Set arrival time if not set yet
            if (processMetrics[nextP.id].arrivalTime === null) {
              processMetrics[nextP.id].arrivalTime = 0;
            }

            // Track first start time for response time calculation
            if (!processStartTimes[nextP.id]) {
              processStartTimes[nextP.id] = Date.now();
              processMetrics[nextP.id].firstRunTime = Date.now() - simulationStartTime;
              // Pulse animation on first start
              pulseAnimations.push({
                nodeId: nextP.id,
                startTime: Date.now(),
                duration: 800
              });
            }

            // Track context switch
            if (currentRunningNodeId && currentRunningNodeId !== nextP.id) {
              contextSwitchCount++;
              // Close previous process execution segment
              const prevMetrics = processMetrics[currentRunningNodeId];
              if (prevMetrics && prevMetrics.executionSegments.length > 0) {
                const lastSeg = prevMetrics.executionSegments[prevMetrics.executionSegments.length - 1];
                if (lastSeg.end === null) {
                  lastSeg.end = Date.now() - simulationStartTime;
                }
              }
            }

            // Start new execution segment
            processMetrics[nextP.id].executionSegments.push({
              start: Date.now() - simulationStartTime,
              end: null
            });
          }
        }
      }

      updateGantt(activeLabel, activeColor);
      detectDeadlock(true);
      updateStarvationTracking(); // Track starvation during simulation
      updateSystemStats();
      draw();
    }

    function terminateProcess(p) {
      p.state = 'TERMINATED';
      p.burstTime = 0;
      currentRunningNodeId = null;

      // Complete metrics tracking
      if (processMetrics[p.id]) {
        const currentTime = Date.now() - simulationStartTime;
        processMetrics[p.id].completionTime = currentTime;

        // Close last execution segment
        const segments = processMetrics[p.id].executionSegments;
        if (segments.length > 0 && segments[segments.length - 1].end === null) {
          segments[segments.length - 1].end = currentTime;
        }

        // Calculate total execution time
        const totalExecution = segments.reduce((sum, seg) => sum + ((seg.end || currentTime) - seg.start), 0);
        processMetrics[p.id].totalExecutionTime = totalExecution;

        // Calculate turnaround and waiting times
        const arrivalTime = processMetrics[p.id].arrivalTime || 0;
        const turnaroundTime = currentTime - arrivalTime;
        const waitingTime = turnaroundTime - totalExecution;

        processMetrics[p.id].turnaroundTime = turnaroundTime;
        processMetrics[p.id].waitingTime = waitingTime;
        processMetrics[p.id].responseTime = (processMetrics[p.id].firstRunTime || currentTime) - arrivalTime;

        updateGanttMetrics();
      }

      // Trigger completion animation
      processTerminationAnimations.push({
        x: p.x,
        y: p.y,
        startTime: Date.now(),
        duration: 600
      });
      printToCli(`Process ${p.label} FINISHED.`, 'success');

      const heldEdges = edges.filter(e => e.target === p.id);
      edges = edges.filter(e => e.target !== p.id);

      heldEdges.forEach(releasedEdge => {
        const rId = releasedEdge.source;
        const requestEdge = edges.find(e => e.target === rId && getNodeById(e.source).type === 'process');

        if (requestEdge) {
          const requesterId = requestEdge.source;
          const requester = getNodeById(requesterId);
          edges = edges.filter(e => e !== requestEdge);
          edges.push({ source: rId, target: requesterId });
          printToCli(`  -> Auto-Allocated ${getNodeById(rId).label} to ${requester.label}`, 'success');
        }
      });

      updateProcessStates();
    }

    function updateGantt(label, color) {
      const chart = document.getElementById('gantt-chart');
      const currentTimeMs = simulationStartTime ? (Date.now() - simulationStartTime) : 0;
      const currentTime = (currentTimeMs / 1000).toFixed(1); // Convert to seconds with 1 decimal

      if (chart.children.length === 1 && chart.children[0].innerText.includes('Start')) {
        chart.innerHTML = '';
      }

      // If switching from one process to another (not extending current block)
      if (lastGanttEntry && lastGanttEntry.dataset.label !== label) {
        // This is a context switch - mark the end time of previous block
        lastGanttEntry.dataset.endTime = currentTime;
        // Time label removed
      }
      if (lastGanttEntry && lastGanttEntry.dataset.label === label) {
        const w = parseInt(lastGanttEntry.style.width) || 20;
        lastGanttEntry.style.width = (w + 2) + 'px';
        // Update end time
        lastGanttEntry.dataset.endTime = currentTime;
        // Time label removed
      } else {
        const container = document.createElement('div');
        container.style.display = 'inline-block';
        container.style.verticalAlign = 'top';
        container.style.marginRight = '2px';

        const div = document.createElement('div');
        div.className = 'gantt-block';
        div.style.background = color;
        div.style.width = '20px';
        div.innerText = label;
        div.dataset.label = label;
        div.dataset.startTime = currentTime;
        div.dataset.endTime = currentTime;

        // Tooltip logic is handled by CSS via data attributes

        container.appendChild(div);
        chart.appendChild(container);
        lastGanttEntry = div;
        chart.scrollLeft = chart.scrollWidth;
      }
    }

    function updateGanttMetrics() {
      const metricsHtml = Object.values(processMetrics)
        .filter(m => m.completionTime !== null)
        .map(m => {
          const contextSwitches = Math.max(0, (m.executionSegments?.length || 1) - 1);
          return `
                        <div style="border: 3px solid black; padding: 12px; background: white; font-family: 'Courier New', monospace; font-size: 11px; box-shadow: 6px 6px 0 black; margin-bottom: 12px;">
                            <div style="font-weight: bold; border: 2px solid black; margin-bottom: 8px; background: #ffe600; padding: 8px; box-shadow: 3px 3px 0 black; font-size: 13px; text-transform: uppercase;">
                                ${m.label} - PROCESS METRICS
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                                <div style="border: 2px solid black; padding: 6px; background: #f5f5f5;"><strong>ARRIVAL:</strong> ${m.arrivalTime}ms</div>
                                <div style="border: 2px solid black; padding: 6px; background: #f5f5f5;"><strong>FIRST RUN:</strong> ${m.firstRunTime}ms</div>
                                <div style="border: 2px solid black; padding: 6px; background: #f5f5f5;"><strong>COMPLETION:</strong> ${m.completionTime}ms</div>
                                <div style="border: 2px solid black; padding: 6px; background: #ffeaa7;"><strong>BURST TIME:</strong> ${m.totalExecutionTime}ms</div>
                                <div style="border: 3px solid black; padding: 6px; background: #a3ffac; box-shadow: 3px 3px 0 black;"><strong>TURNAROUND:</strong> ${m.turnaroundTime}ms</div>
                                <div style="border: 3px solid black; padding: 6px; background: #ff9aa2; box-shadow: 3px 3px 0 black;"><strong>WAITING:</strong> ${m.waitingTime}ms</div>
                                <div style="border: 2px solid black; padding: 6px; background: #e8f4f8;"><strong>RESPONSE:</strong> ${m.responseTime}ms</div>
                                <div style="border: 2px solid black; padding: 6px; background: #d6e4ff;"><strong>CTX SWITCHES:</strong> ${contextSwitches}</div>
                            </div>
                        </div>
                    `;
        }).join('');

      const metricsDisplay = document.getElementById('metrics-display');
      if (metricsDisplay) {
        metricsDisplay.innerHTML = metricsHtml || '<div style="color: #666; font-style: italic; padding: 16px; border: 2px dashed #ccc; text-align: center;">No completed processes yet. Start simulation to see metrics.</div>';
      }
    }
