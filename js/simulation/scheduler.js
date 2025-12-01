    // MLQ Configuration
    let mlqConfig = {
      fgAlgo: 'fcfs',
      bgAlgo: 'fcfs',
      fgQuantum: 20,
      bgQuantum: 20
    };

    function selectScheduler(algo, label) {
      console.log('selectScheduler called with:', algo, label);
      schedulingAlgorithm = algo;
      document.getElementById('scheduler-label').textContent = label;

      const quantumContainer = document.getElementById('quantum-container');

      // Handle RR Quantum Input Visibility
      if (algo === 'rr') {
        quantumContainer.classList.remove('hidden');
      } else {
        quantumContainer.classList.add('hidden');
      }

      // Handle MLFQ Reset
      if (algo === 'mlfq') {
          if (window.MLFQ) window.MLFQ.reset();
      }

      timeQuantum = parseInt(document.getElementById('quantum-input').value) || 20;
      quantumRemaining = timeQuantum;
      printToCli(`Scheduler changed to: ${label}`, 'info');
      if (isRunning) {
        printToCli('Note: Changes take effect on next scheduling decision', 'info');
      }

      // Refresh Properties Panel if open to update enabled/disabled states
      if (window.currentPropNode && typeof openProps === 'function') {
          openProps(window.currentPropNode);
      }
    }

    // MLQ Settings Functions
    // Helper for Modal Animations
    function toggleModalWithAnimation(modalId) {
        const modal = document.getElementById(modalId);
        const content = modal.firstElementChild; // The inner box

        if (modal.classList.contains('hidden')) {
            // Open
            modal.classList.remove('hidden');
            content.classList.remove('modal-exit');
            content.classList.add('modal-enter');
        } else {
            // Close
            content.classList.remove('modal-enter');
            content.classList.add('modal-exit');

            // Wait for animation to finish
            content.addEventListener('animationend', function() {
                if (content.classList.contains('modal-exit')) {
                    modal.classList.add('hidden');
                    content.classList.remove('modal-exit');
                }
            }, { once: true });
        }
    }

    // MLQ Settings Functions
    window.toggleMLQInfo = function() {
        toggleModalWithAnimation('mlq-info-modal');
    };

    window.switchMLQTab = function(tab) {
        // Reset Tabs (Inactive State)
        const inactiveClass = 'flex-1 py-2 font-black text-sm border-2 border-black shadow-[2px_2px_0_black] bg-white hover:bg-gray-50 hover:translate-y-[-2px] transition-all';
        const activeClass = 'flex-1 py-2 font-black text-sm border-2 border-black shadow-[4px_4px_0_black] bg-[#4ecdc4] hover:translate-y-[-2px] transition-all';

        document.getElementById('tab-mlq-arch').className = inactiveClass;
        document.getElementById('tab-mlq-settings').className = inactiveClass;

        // Reset Content
        document.getElementById('content-mlq-arch').classList.add('hidden');
        document.getElementById('content-mlq-settings').classList.add('hidden');

        // Activate Selected
        if (tab === 'arch') {
            document.getElementById('tab-mlq-arch').className = activeClass;
            document.getElementById('content-mlq-arch').classList.remove('hidden');
        } else {
            document.getElementById('tab-mlq-settings').className = activeClass;
            document.getElementById('content-mlq-settings').classList.remove('hidden');
        }
    };

    window.toggleMLFQInfo = function() {
        toggleModalWithAnimation('mlfq-info-modal');
    };

    window.switchMLFQTab = function(tab) {
        // Reset Tabs (Inactive State)
        const inactiveClass = 'flex-1 py-2 font-black text-sm border-2 border-black shadow-[2px_2px_0_black] bg-white hover:bg-gray-50 hover:translate-y-[-2px] transition-all';
        const activeClass = 'flex-1 py-2 font-black text-sm border-2 border-black shadow-[4px_4px_0_black] bg-[#ffe600] hover:translate-y-[-2px] transition-all';

        document.getElementById('tab-mlfq-arch').className = inactiveClass;
        document.getElementById('tab-mlfq-settings').className = inactiveClass;

        // Reset Content
        document.getElementById('content-mlfq-arch').classList.add('hidden');
        document.getElementById('content-mlfq-settings').classList.add('hidden');

        // Activate Selected
        if (tab === 'arch') {
            document.getElementById('tab-mlfq-arch').className = activeClass;
            document.getElementById('content-mlfq-arch').classList.remove('hidden');
        } else {
            document.getElementById('tab-mlfq-settings').className = activeClass;
            document.getElementById('content-mlfq-settings').classList.remove('hidden');
        }
    };

    window.updateMLFQSettings = function() {
        if (!window.MLFQ) return;

        const q1 = parseInt(document.getElementById('mlfq-q1-quantum').value) || 4;
        const q2 = parseInt(document.getElementById('mlfq-q2-quantum').value) || 8;
        const boost = parseInt(document.getElementById('mlfq-boost-interval').value) || 50;

        window.MLFQ.updateConfig({
            q1Quantum: q1,
            q2Quantum: q2,
            boostInterval: boost
        });

        // Update Display in Architecture Tab
        const dispQ1 = document.getElementById('disp-q1');
        const dispQ2 = document.getElementById('disp-q2');
        const dispBoost = document.getElementById('disp-boost');

        if(dispQ1) dispQ1.textContent = q1;
        if(dispQ2) dispQ2.textContent = q2;
        if(dispBoost) dispBoost.textContent = boost;

        printToCli(`MLFQ Updated: Q1=${q1}, Q2=${q2}, Boost=${boost}`);
    };

    window.updateMLQSettings = function() {
        mlqConfig.fgAlgo = document.getElementById('mlq-fg-algo').value;
        mlqConfig.bgAlgo = document.getElementById('mlq-bg-algo').value;
        mlqConfig.fgQuantum = parseInt(document.getElementById('mlq-fg-quantum').value) || 20;
        mlqConfig.bgQuantum = parseInt(document.getElementById('mlq-bg-quantum').value) || 20;

        // Toggle Quantum inputs based on algo selection
        const fgContainer = document.getElementById('mlq-fg-quantum-container');
        const bgContainer = document.getElementById('mlq-bg-quantum-container');

        if (fgContainer) fgContainer.classList.toggle('hidden', mlqConfig.fgAlgo !== 'rr');
        if (bgContainer) bgContainer.classList.toggle('hidden', mlqConfig.bgAlgo !== 'rr');

        // Update Architecture Display
        const dispFgAlgo = document.getElementById('disp-mlq-fg-algo');
        const dispFgQuantum = document.getElementById('disp-mlq-fg-quantum');
        const valFgQuantum = document.getElementById('val-mlq-fg-quantum');

        if (dispFgAlgo) dispFgAlgo.textContent = mlqConfig.fgAlgo.toUpperCase();
        if (dispFgQuantum) dispFgQuantum.classList.toggle('hidden', mlqConfig.fgAlgo !== 'rr');
        if (valFgQuantum) valFgQuantum.textContent = mlqConfig.fgQuantum;

        const dispBgAlgo = document.getElementById('disp-mlq-bg-algo');
        const dispBgQuantum = document.getElementById('disp-mlq-bg-quantum');
        const valBgQuantum = document.getElementById('val-mlq-bg-quantum');

        if (dispBgAlgo) dispBgAlgo.textContent = mlqConfig.bgAlgo.toUpperCase();
        if (dispBgQuantum) dispBgQuantum.classList.toggle('hidden', mlqConfig.bgAlgo !== 'rr');
        if (valBgQuantum) valBgQuantum.textContent = mlqConfig.bgQuantum;

        printToCli(`MLQ Settings Updated: FG=${mlqConfig.fgAlgo}, BG=${mlqConfig.bgAlgo}`);
    };

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

    function attemptAllocation() {
      // Find all request edges (Process -> Resource)
      const requests = edges.filter(e => {
        const source = getNodeById(e.source);
        const target = getNodeById(e.target);
        return source && target && source.type === 'process' && target.type === 'resource';
      });

      // Sort requests by arrival time or priority if needed (FCFS for now)
      // We iterate and try to fulfill each request
      requests.forEach(req => {
        const process = getNodeById(req.source);
        const resource = getNodeById(req.target);

        if (!process || !resource) return;

        // Check availability
        const allocatedCount = edges.filter(e => e.source === resource.id).length;
        if (allocatedCount < resource.capacity) {
           // Allocate!
           // Remove request edge
           const reqIndex = edges.indexOf(req);
           if (reqIndex > -1) {
             edges.splice(reqIndex, 1);
             // Add allocation edge (Resource -> Process)
             edges.push({ source: resource.id, target: process.id, label: '1' });
             printToCli(`Auto-Allocated ${resource.label} to ${process.label}`, 'success');

             // Pulse animation
             pulseAnimations.push(
                { nodeId: resource.id, startTime: Date.now(), duration: 500 },
                { nodeId: process.id, startTime: Date.now(), duration: 500 }
             );

             // Update process state will happen in next updateProcessStates call
           }
        }
      });

      // Update states immediately after allocation to unblock processes
      updateProcessStates();
    }

    function scheduler() {
      // Try to allocate resources to blocked processes first
      attemptAllocation();

      // MLFQ Priority Boost Check
      if (schedulingAlgorithm === 'mlfq' && window.MLFQ) {
          window.MLFQ.checkBoost(nodes);
      }

      let activeLabel = "IDLE";
      let activeColor = "#eee";
      let preempted = false;


      // Update quantum input if changed (Standard RR)
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

          // MLQ Color Override
          if (schedulingAlgorithm === 'mlq') {
              activeColor = (p.priorityGroup === 1) ? '#ff9ff3' : '#4ecdc4'; // BG=Pink, FG=Teal
          }

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
          // MLQ Logic for Running Process
          else if (schedulingAlgorithm === 'mlq') {
              const queueAlgo = (p.priorityGroup === 1) ? mlqConfig.bgAlgo : mlqConfig.fgAlgo;

              // RR in MLQ
              if (queueAlgo === 'rr' && quantumRemaining <= 0) {
                  p.state = 'READY';
                  p.lastPreemptTime = Date.now();
                  triggerContextSwitch(p.id);
                  currentRunningNodeId = null;
                  printToCli(`[MLQ] ${p.label} quantum expired (${p.priorityGroup === 1 ? 'BG' : 'FG'})`, 'info');
              }
              // SRTF in MLQ (Only preempts within same queue)
              else if (queueAlgo === 'srtf') {
                  const readySameQueue = nodes.filter(n =>
                      n.type === 'process' && n.state === 'READY' && n.burstTime > 0 && (n.priorityGroup || 0) === (p.priorityGroup || 0)
                  );
                  const shorter = readySameQueue.find(n => n.burstTime < p.burstTime);
                  if (shorter) {
                      p.state = 'READY';
                      triggerContextSwitch(p.id);
                      currentRunningNodeId = null;
                      printToCli(`[MLQ] ${p.label} preempted by ${shorter.label} (SRTF)`, 'info');
                  }
              }
              // Priority Preemptive in MLQ (Only preempts within same queue)
              else if (queueAlgo === 'priority_p') {
                   const readySameQueue = nodes.filter(n =>
                      n.type === 'process' && n.state === 'READY' && n.burstTime > 0 && (n.priorityGroup || 0) === (p.priorityGroup || 0)
                  );
                  const higherPrio = readySameQueue.find(n => (n.priority || 1) < (p.priority || 1));
                  if (higherPrio) {
                      p.state = 'READY';
                      triggerContextSwitch(p.id);
                      currentRunningNodeId = null;
                      printToCli(`[MLQ] ${p.label} preempted by ${higherPrio.label} (Priority)`, 'info');
                  }
              }
          }
          // MLFQ Logic for Running Process
          else if (schedulingAlgorithm === 'mlfq' && window.MLFQ) {
              activeColor = window.MLFQ.getColor(p);

              // Update Process (returns true if demoted)
              const demoted = window.MLFQ.updateProcess(p, 1); // 1 cycle

              // Check for Preemption
              // 1. Demoted (Quantum Expired)
              // 2. Higher Priority Process Arrived

              const readyProcesses = nodes.filter(n => n.type === 'process' && n.state === 'READY' && n.burstTime > 0);
              const currentPriority = p.mlfq ? p.mlfq.priority : 1;
              const betterProcess = readyProcesses.find(n => n.mlfq && n.mlfq.priority < currentPriority);

              if (demoted || betterProcess) {
                  p.state = 'READY';
                  p.lastPreemptTime = Date.now();
                  triggerContextSwitch(p.id);
                  currentRunningNodeId = null;

                  if (demoted) {
                      // Log handled in updateProcess
                  } else if (betterProcess) {
                      printToCli(`[MLFQ] ${p.label} (Q${currentPriority}) preempted by ${betterProcess.label} (Q${betterProcess.mlfq.priority})`, 'info');
                  }
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

            case 'mlq':
                // Multilevel Queue Logic
                const fgQueue = candidates.filter(p => (p.priorityGroup || 0) === 0);
                const bgQueue = candidates.filter(p => (p.priorityGroup || 0) === 1);

                let selectedQueue = null;
                let algo = 'fcfs';
                let quantum = 20;

                // Priority to Foreground
                if (fgQueue.length > 0) {
                    selectedQueue = fgQueue;
                    algo = mlqConfig.fgAlgo;
                    quantum = mlqConfig.fgQuantum;
                } else if (bgQueue.length > 0) {
                    selectedQueue = bgQueue;
                    algo = mlqConfig.bgAlgo;
                    quantum = mlqConfig.bgQuantum;
                }

                if (selectedQueue && selectedQueue.length > 0) {
                    // Apply selected algorithm to the chosen queue
                    switch (algo) {
                        case 'fcfs':
                             nextP = selectedQueue[0];
                             break;
                        case 'sjf':
                             nextP = selectedQueue.reduce((s, p) => p.originalBurst < s.originalBurst ? p : s);
                             break;
                        case 'srtf':
                             nextP = selectedQueue.reduce((s, p) => p.burstTime < s.burstTime ? p : s);
                             break;
                        case 'rr':
                             selectedQueue.sort((a, b) => {
                                const timeA = a.lastPreemptTime || a.arrivalTime || 0;
                                const timeB = b.lastPreemptTime || b.arrivalTime || 0;
                                return timeA - timeB;
                             });
                             nextP = selectedQueue[0];
                             break;
                        case 'priority_np':
                        case 'priority_p':
                             nextP = selectedQueue.reduce((h, p) => (p.priority || 1) < (h.priority || 1) ? p : h);
                             break;
                        default:
                             nextP = selectedQueue[0];
                    }

                    // Set Quantum if RR
                    if (algo === 'rr') {
                        quantumRemaining = quantum;
                    }

                    // Log Queue Switch if applicable
                    // (Optional: track last queue to log switches)
                }
                break;

            case 'mlfq':
                if (window.MLFQ) {
                    nextP = window.MLFQ.getNextProcess(candidates);
                } else {
                    nextP = candidates[0];
                }
                break;

            default:
              nextP = candidates[0];
          }

          if (nextP) {
            nextP.state = 'RUNNING';
            currentRunningNodeId = nextP.id;
            activeLabel = nextP.label;
            activeColor = config.colors.running;

            // MLQ Color Override
            if (schedulingAlgorithm === 'mlq') {
                activeColor = (nextP.priorityGroup === 1) ? '#ff9ff3' : '#4ecdc4';
            }
            // MLFQ Color Override
            else if (schedulingAlgorithm === 'mlfq' && window.MLFQ) {
                activeColor = window.MLFQ.getColor(nextP);
            }

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

      // MLFQ Label Override
      if (schedulingAlgorithm === 'mlfq' && window.MLFQ && lastGanttEntry) {
          // Add small Q label
          const p = getNodeById(currentRunningNodeId);
          if (p) {
              const qLabel = window.MLFQ.getLabel(p);
              // Check if label already exists
              if (!lastGanttEntry.querySelector('.q-label')) {
                  const qSpan = document.createElement('span');
                  qSpan.className = 'q-label';
                  qSpan.style.position = 'absolute';
                  qSpan.style.bottom = '0';
                  qSpan.style.right = '0';
                  qSpan.style.fontSize = '8px';
                  qSpan.style.color = 'black';
                  qSpan.style.fontWeight = 'bold';
                  qSpan.style.opacity = '0.7';
                  qSpan.innerText = qLabel;
                  lastGanttEntry.style.position = 'relative';
                  lastGanttEntry.appendChild(qSpan);
              }
          }
      }
      detectDeadlock(true);
      updateStarvationTracking(); // Track starvation during simulation
      updateSystemStats();
      updateSystemStats();
      draw();

      if (window.Session) Session.broadcast('sim_update', { type: 'step' });
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
