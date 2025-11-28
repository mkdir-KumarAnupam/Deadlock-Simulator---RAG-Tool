    let currentAlgorithm = null;
    let currentAlgoTab = 'demo';

    function showAlgorithmDemo(algorithm) {
      currentAlgorithm = algorithm;
      currentAlgoTab = 'demo';
      const modal = document.getElementById('algo-demo-modal');
      const panel = document.getElementById('algo-demo-panel');
      renderAlgorithmModal(algorithm);
      modal.style.display = 'block';
      setTimeout(() => {
        panel.style.transform = 'translateY(0)';
      }, 10);
      resetAlgoDemo();
    }
    function switchAlgoTab(tab) {
      // If clicking the already active tab, do nothing
      if (currentAlgoTab === tab) return;

      const prevTab = currentAlgoTab;
      currentAlgoTab = tab;
      const contentEl = document.getElementById('algo-tab-content');

      // Begin page-open animation
      if (contentEl) {
        contentEl.classList.remove('page-turn-finish');
        // trigger reflow to ensure animation restarts
        contentEl.classList.add('page-turn-start');
      }

      // Update tab button visuals immediately
      const algoColorMap = {
        'fcfs': '#ffe082',
        'sjf': '#a3ffac',
        'srtf': '#ffa3a3',
        'priority': '#b5a3ff',
        'priority_np': '#ff9ff3',
        'priority_p': '#54a0ff',
        'rr': '#e1bee7'
      };
      const currentColor = algoColorMap[currentAlgorithm] || '#e8e6e0';
      const tabs = ['demo', 'advantages', 'disadvantages', 'problems', 'usecases'];
      tabs.forEach(tabName => {
        const button = document.querySelector(`[onclick="switchAlgoTab('${tabName}')"]`);
        if (!button) return;
        const isActive = tabName === tab;
        if (isActive) button.classList.add('active-tab'); else button.classList.remove('active-tab');
        button.style.background = isActive ? currentColor : '#ffffff';
        button.style.fontWeight = isActive ? '900' : 'bold';
        button.style.borderRight = isActive ? 'none' : '3px solid black';
        button.style.borderBottom = '3px solid black';
        button.style.boxShadow = 'none';
        button.style.marginRight = isActive ? '0' : '-3px';
        button.style.marginBottom = '-3px';
        button.style.zIndex = isActive ? '10' : '1';
        button.style.color = 'black';
        button.style.paddingLeft = isActive ? '30px' : '20px';
        button.style.textShadow = 'none';
        button.style.letterSpacing = isActive ? '1px' : '0.5px';
      });

      // Swap content mid-flip to create page-turn illusion
      const midFlip = 100; // ms - should match page turn half-duration
      setTimeout(() => {
        updateTabContent(currentAlgorithm);

        // Finish the page turn (closing)
        if (contentEl) {
          contentEl.classList.remove('page-turn-start');
          // trigger reflow
          void contentEl.offsetWidth;
          contentEl.classList.add('page-turn-finish');
          // remove finish class after animation completes
          setTimeout(() => contentEl.classList.remove('page-turn-finish'), 320);
        }

        if (tab === 'demo') {
          resetAlgoDemo();
        }
      }, midFlip);
    }
    function updateTabContent(algorithm) {
      const contentArea = document.getElementById('algo-tab-content');
      if (!contentArea) return;

      const algoInfo = {
        'fcfs': {
          name: 'First Come First Served',
          color: '#ffe082',
          desc: 'Non-preemptive. Processes execute in arrival order.',
          advantages: [
            'Simple and easy to understand',
            'Easy to implement with FIFO queue',
            'Fair in terms of arrival order',
            'No starvation - every process gets CPU eventually'
          ],
          disadvantages: [
            'Poor average waiting time',
            'Convoy effect - short processes wait for long ones',
            'Not suitable for time-sharing systems',
            'No priority consideration'
          ],
          problems: [
            '<strong>Convoy Effect:</strong> When a long process arrives first, all subsequent shorter processes must wait, leading to poor average waiting time. Like being stuck behind a slow truck on a single-lane road.'
          ],
          useCases: [
            'Batch processing systems where order matters',
            'Print queue management',
            'Simple embedded systems with predictable workloads',
            'First-come-first-served customer service systems'
          ]
        },
        'sjf': {
          name: 'Shortest Job First',
          color: '#a3ffac',
          desc: 'Non-preemptive. Selects process with shortest burst time.',
          advantages: [
            'Optimal average waiting time',
            'Minimizes average turnaround time',
            'Better throughput than FCFS',
            'Efficient for batch systems'
          ],
          disadvantages: [
            'Requires knowing burst time in advance (often impossible)',
            'Can cause starvation of long processes',
            'Not practical for interactive systems',
            'Difficult to predict exact CPU burst times'
          ],
          problems: [
            '<strong>Starvation:</strong> Long processes may never execute if short processes keep arriving. A process with burst time of 100 might wait indefinitely while processes with burst time 5 keep coming.'
          ],
          useCases: [
            'Batch processing where execution times are known',
            'Background task scheduling',
            'Systems with predictable workload patterns',
            'Non-interactive computational tasks'
          ]
        },
        'srtf': {
          name: 'Shortest Remaining Time First',
          color: '#ffa3a3',
          desc: 'Preemptive SJF. Can interrupt currently running process.',
          advantages: [
            'Better average waiting time than SJF',
            'More responsive to new short processes',
            'Optimal for minimizing waiting time',
            'Good for time-sharing systems'
          ],
          disadvantages: [
            'High context switching overhead',
            'Even worse starvation than SJF',
            'Requires continuous burst time estimation',
            'Complex to implement efficiently'
          ],
          problems: [
            '<strong>Severe Starvation:</strong> Long processes can be perpetually preempted by arriving shorter processes. A process might start execution but never finish if shorter processes keep arriving.',
            '<strong>High Overhead:</strong> Frequent context switches when new processes arrive, consuming CPU time for switching rather than actual work.'
          ],
          useCases: [
            'Real-time systems with priority on quick tasks',
            'Interactive systems requiring responsiveness',
            'Systems where burst times can be predicted accurately',
            'Environments where minimizing response time is critical'
          ]
        },

        'priority_np': {
          name: 'Priority (Non-Preemptive)',
          color: '#ff9ff3',
          desc: 'CPU assigned to process with highest priority (lowest number).',
          advantages: [
            'Handles important tasks first',
            'Good for real-time systems',
            'Flexible - can mimic other algorithms',
            'Simple priority logic'
          ],
          disadvantages: [
            'Indefinite blocking (Starvation)',
            'Low priority processes may never run',
            'No preemption for urgent tasks',
            'Priority assignment can be complex'
          ],
          problems: [
            '<strong>Starvation:</strong> Low priority processes may wait indefinitely if high priority processes keep arriving.',
            '<strong>Priority Inversion:</strong> High priority process waits for resource held by low priority process.'
          ],
          useCases: [
            'Batch systems with job classes',
            'Real-time systems (soft)',
            'Environments with clear task hierarchy',
            'System processes vs User processes'
          ]
        },
        'priority_p': {
          name: 'Priority (Preemptive)',
          color: '#54a0ff',
          desc: 'CPU assigned to highest priority. Preempts if higher priority arrives.',
          advantages: [
            'Most responsive for high priority',
            'Urgent tasks run immediately',
            'Good for hard real-time systems',
            'Dynamic priority handling'
          ],
          disadvantages: [
            'Context switching overhead',
            'Starvation still possible',
            'Complex to implement',
            'Race conditions more likely'
          ],
          problems: [
            '<strong>Starvation:</strong> Low priority processes suffer even more than in non-preemptive if high priority tasks are frequent.',
            '<strong>Thrashing:</strong> If priorities change frequently or many high priority tasks arrive, system spends time switching.'
          ],
          useCases: [
            'Real-time operating systems (RTOS)',
            'Interrupt handling',
            'Device driver execution',
            'Mission-critical systems'
          ]
        },
        'rr': {
          name: 'Round Robin',
          color: '#e1bee7',
          desc: 'Preemptive. Each process gets fixed time slice (quantum).',
          advantages: [
            'Fair allocation of CPU time',
            'No starvation - all processes progress',
            'Good response time for interactive systems',
            'Simple and widely used'
          ],
          disadvantages: [
            'Average waiting time can be high',
            'Performance depends heavily on quantum size',
            'Context switching overhead',
            'Not optimal for batch processing'
          ],
          problems: [
            '<strong>Quantum Size Dilemma:</strong> If quantum is too large, RR behaves like FCFS (unfair). If too small, excessive context switching wastes CPU time on overhead rather than actual work.'
          ],
          useCases: [
            'Time-sharing operating systems',
            'Interactive multi-user systems',
            'General-purpose operating systems',
            'Systems requiring fairness and responsiveness'
          ]
        }
      };

      const info = algoInfo[algorithm];
      let tabContent = '';

      if (currentAlgoTab === 'demo') {
        tabContent = `
                    <style>
                        @keyframes fadeInUp {
                            from {
                                opacity: 0;
                                transform: translateY(20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .demo-section {
                            animation: fadeInUp 0.5s ease-out forwards;
                            opacity: 0;
                        }
                        .demo-button:hover {
                            transform: translateY(-3px);
                            box-shadow: 8px 8px 0 black !important;
                        }
                        .demo-button:active {
                            transform: translateY(2px);
                            box-shadow: 3px 3px 0 black !important;
                        }
                    </style>
                    <div class="demo-section" style="border: 3px solid black; padding: 16px; background: white; box-shadow: 4px 4px 0 black; margin-bottom: 20px; animation-delay: 0s;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 14px; margin: 0; text-transform: uppercase;">Process Queue</h3>
                            <div style="display: flex; gap: 16px; align-items: center;">
                                <div style="font-size: 12px;">TIME: <span id="demo-time" style="font-weight: bold; color: #ff006e;">0</span></div>
                                <div id="demo-quantum-box" style="font-size: 12px; display: ${algorithm === 'rr' ? 'block' : 'none'};">QUANTUM: <span id="demo-quantum" style="font-weight: bold; color: #ff6b6b;">4</span></div>
                            </div>
                        </div>
                        <div id="demo-queue" style="min-height: 200px; display: flex; flex-direction: column; gap: 8px;"></div>
                    </div>

                    <div class="demo-section" style="border: 3px solid black; padding: 16px; background: white; box-shadow: 4px 4px 0 black; margin-bottom: 20px; animation-delay: 0.1s;">
                        <h3 style="font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase;">Gantt Chart</h3>
                        <div id="demo-gantt" style="display: flex; min-height: 60px; border: 2px solid black; background: #f5f5f5;"></div>
                    </div>

                    <div class="demo-section" style="text-align: center; animation-delay: 0.2s;">
                        <button onclick="startAlgoDemo('${algorithm}')" class="demo-button" style="padding: 16px 48px; background: #4ecdc4; border: 3px solid black; cursor: pointer; font-weight: bold; box-shadow: 6px 6px 0 black; font-family: 'Courier New', monospace; font-size: 16px; margin-right: 12px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">START DEMO</button>
                        <button onclick="resetAlgoDemo()" class="demo-button" style="padding: 16px 48px; background: #ff6b6b; border: 3px solid black; cursor: pointer; font-weight: bold; box-shadow: 6px 6px 0 black; font-family: 'Courier New', monospace; font-size: 16px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">RESET</button>
                    </div>
                `;
      } else if (currentAlgoTab === 'advantages') {
        const rotations = ['rotate(-2deg)', 'rotate(1.5deg)', 'rotate(-1deg)', 'rotate(2deg)'];
        tabContent = `
                    <style>
                        @keyframes slideInAdvCard {
                            0% {
                                opacity: 0;
                                transform: translateY(30px);
                            }
                            100% {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .advantage-card {
                            animation: slideInAdvCard 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                            opacity: 0;
                        }
                        .advantage-card:hover {
                            transform: translateY(-4px) rotate(0deg) !important;
                            box-shadow: 6px 8px 0 black !important;
                        }
                    </style>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        ${info.advantages.map((adv, idx) => `
                            <div class="advantage-card" style="border: 3px solid black; padding: 20px; background: #e8f8f5; box-shadow: 4px 4px 0 black; position: relative; transform: ${rotations[idx % rotations.length]}; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation-delay: ${idx * 0.15}s;">
                                <div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; background: #333; border: 2px solid black; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; background: #666; border-radius: 50%;"></div>
                                </div>
                                <div style="position: absolute; top: -12px; left: 12px; background: #2ecc71; border: 3px solid black; padding: 4px 12px; font-weight: bold; font-size: 16px; transition: transform 0.2s;">
                                    ${idx + 1}
                                </div>
                                <div style="margin-top: 8px; display: flex; gap: 12px; align-items: start;">
                                    <div style="min-width: 40px; height: 40px; background: #2ecc71; border: 3px solid black; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; transition: transform 0.2s;">
                                        +
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px; font-weight: bold; line-height: 1.6;">
                                            ${adv}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
      } else if (currentAlgoTab === 'disadvantages') {
        const rotations = ['rotate(1.5deg)', 'rotate(-2deg)', 'rotate(2deg)', 'rotate(-1deg)'];
        tabContent = `
                    <style>
                        @keyframes slideInDisCard {
                            0% {
                                opacity: 0;
                                transform: translateY(30px);
                            }
                            100% {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .disadvantage-card {
                            animation: slideInDisCard 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                            opacity: 0;
                        }
                        .disadvantage-card:hover {
                            transform: translateY(-4px) rotate(0deg) !important;
                            box-shadow: 6px 8px 0 black !important;
                        }
                    </style>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        ${info.disadvantages.map((dis, idx) => `
                            <div class="disadvantage-card" style="border: 3px solid black; padding: 20px; background: #ffe6e6; box-shadow: 4px 4px 0 black; position: relative; transform: ${rotations[idx % rotations.length]}; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation-delay: ${idx * 0.15}s;">
                                <div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; background: #333; border: 2px solid black; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; background: #666; border-radius: 50%;"></div>
                                </div>
                                <div style="position: absolute; top: -12px; left: 12px; background: #e74c3c; color: white; border: 3px solid black; padding: 4px 12px; font-weight: bold; font-size: 16px;">
                                    ${idx + 1}
                                </div>
                                <div style="margin-top: 8px; display: flex; gap: 12px; align-items: start;">
                                    <div style="min-width: 40px; height: 40px; background: #e74c3c; color: white; border: 3px solid black; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold;">
                                        -
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px; font-weight: bold; line-height: 1.6;">
                                            ${dis}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
      } else if (currentAlgoTab === 'problems') {
        const problemGantt = getProblemGanttChart(algorithm);
        tabContent = `
                    <style>
                        @keyframes fadeInScaleProblem {
                            0% {
                                opacity: 0;
                                transform: scale(0.95);
                            }
                            100% {
                                opacity: 1;
                                transform: scale(1);
                            }
                        }
                        .problem-section {
                            animation: fadeInScaleProblem 0.5s ease-out forwards;
                            opacity: 0;
                        }
                    </style>
                    <div class="problem-section" style="border: 3px solid black; padding: 24px; background: #ffe6e6; box-shadow: 4px 4px 0 black; margin-bottom: 20px; animation-delay: 0s;">
                        <div style="display: inline-block; background: #ff6b6b; border: 3px solid black; padding: 8px 20px; box-shadow: 3px 3px 0 black; margin-bottom: 20px;">
                            <h3 style="font-size: 18px; margin: 0; text-transform: uppercase; color: white; font-weight: bold;">PROBLEM SPOTLIGHT</h3>
                        </div>
                        ${info.problems.map((prob, idx) => {
          const problemName = prob.match(/<strong>(.*?):<\/strong>/)?.[1] || 'Problem';
          const problemDesc = prob.replace(/<strong>.*?<\/strong>\s*/, '');
          return `
                                <div style="margin-bottom: 16px; background: white; border: 3px solid black; box-shadow: 4px 4px 0 black; overflow: hidden;">
                                    <div style="background: #ff6b6b; padding: 12px 16px; border-bottom: 3px solid black;">
                                        <div style="font-size: 16px; font-weight: bold; color: white; letter-spacing: 1px;">${problemName}</div>
                                    </div>
                                    <div style="padding: 16px; font-size: 14px; line-height: 1.7; font-weight: 500;">
                                        ${problemDesc}
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>

                    <div class="problem-section" style="border: 3px solid black; padding: 24px; background: white; box-shadow: 4px 4px 0 black; animation-delay: 0.15s;">
                        <div style="display: inline-block; background: black; border: 3px solid black; padding: 8px 20px; box-shadow: 3px 3px 0 black; margin-bottom: 20px;">
                            <h3 style="font-size: 16px; margin: 0; text-transform: uppercase; color: white; font-weight: bold;">VISUAL PROOF</h3>
                        </div>
                        <div style="margin-bottom: 16px; padding: 16px; background: #f8f9fa; border: 3px solid black; font-size: 13px; font-weight: 600; line-height: 1.6;">
                            ${problemGantt.description}
                        </div>
                        <div style="background: #f8f9fa; border: 3px solid black; padding: 16px; margin-bottom: 16px;">
                            ${problemGantt.chart}
                        </div>
                        <div style="padding: 16px; background: #ff6b6b; border: 3px solid black; font-size: 13px; font-weight: bold; color: white; box-shadow: 4px 4px 0 black;">
                            ${problemGantt.impact}
                        </div>
                    </div>
                `;
      } else if (currentAlgoTab === 'usecases') {
        const icons = ['A', 'B', 'C', 'D'];
        const colors = ['#e3f2fd', '#f3e5f5', '#fff9c4', '#e0f2f1'];
        tabContent = `
                    <style>
                        @keyframes bounceInUsecase {
                            0% {
                                opacity: 0;
                                transform: scale(0.8);
                            }
                            60% {
                                transform: scale(1.05);
                            }
                            100% {
                                opacity: 1;
                                transform: scale(1);
                            }
                        }
                        .usecase-card {
                            animation: bounceInUsecase 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                            opacity: 0;
                        }
                        .usecase-card:hover {
                            transform: translateY(-4px) scale(1.02) !important;
                            box-shadow: 6px 8px 0 black !important;
                        }
                    </style>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        ${info.useCases.map((uc, idx) => `
                            <div class="usecase-card" style="border: 3px solid black; padding: 20px; background: ${colors[idx % colors.length]}; box-shadow: 4px 4px 0 black; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation-delay: ${idx * 0.15}s;">
                                <div style="display: flex; gap: 16px; align-items: start;">
                                    <div style="min-width: 60px; height: 60px; background: #3498db; border: 3px solid black; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; box-shadow: 3px 3px 0 black; transition: transform 0.3s;">
                                        ${icons[idx % icons.length]}
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 6px;">
                                            USE CASE ${idx + 1}
                                        </div>
                                        <div style="font-size: 14px; font-weight: bold; line-height: 1.6;">
                                            ${uc}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
      }

      contentArea.innerHTML = tabContent;
    }

    function renderAlgorithmModal(algorithm) {
      const content = document.getElementById('algo-demo-content');

      const algoInfo = {
        'fcfs': {
          name: 'First Come First Served',
          color: '#ffe082',
          desc: 'Non-preemptive. Processes execute in arrival order.',
          advantages: [
            'Simple and easy to understand',
            'Easy to implement with FIFO queue',
            'Fair in terms of arrival order',
            'No starvation - every process gets CPU eventually'
          ],
          disadvantages: [
            'Poor average waiting time',
            'Convoy effect - short processes wait for long ones',
            'Not suitable for time-sharing systems',
            'No priority consideration'
          ],
          problems: [
            '<strong>Convoy Effect:</strong> When a long process arrives first, all subsequent shorter processes must wait, leading to poor average waiting time. Like being stuck behind a slow truck on a single-lane road.'
          ],
          useCases: [
            'Batch processing systems where order matters',
            'Print queue management',
            'Simple embedded systems with predictable workloads',
            'First-come-first-served customer service systems'
          ]
        },
        'sjf': {
          name: 'Shortest Job First',
          color: '#a3ffac',
          desc: 'Non-preemptive. Selects process with shortest burst time.',
          advantages: [
            'Optimal average waiting time',
            'Minimizes average turnaround time',
            'Better throughput than FCFS',
            'Efficient for batch systems'
          ],
          disadvantages: [
            'Requires knowing burst time in advance (often impossible)',
            'Can cause starvation of long processes',
            'Not practical for interactive systems',
            'Difficult to predict exact CPU burst times'
          ],
          problems: [
            '<strong>Starvation:</strong> Long processes may never execute if short processes keep arriving. A process with burst time of 100 might wait indefinitely while processes with burst time 5 keep coming.'
          ],
          useCases: [
            'Batch processing where execution times are known',
            'Background task scheduling',
            'Systems with predictable workload patterns',
            'Non-interactive computational tasks'
          ]
        },
        'srtf': {
          name: 'Shortest Remaining Time First',
          color: '#ffa3a3',
          desc: 'Preemptive SJF. Can interrupt currently running process.',
          advantages: [
            'Better average waiting time than SJF',
            'More responsive to new short processes',
            'Optimal for minimizing waiting time',
            'Good for time-sharing systems'
          ],
          disadvantages: [
            'High context switching overhead',
            'Even worse starvation than SJF',
            'Requires continuous burst time estimation',
            'Complex to implement efficiently'
          ],
          problems: [
            '<strong>Severe Starvation:</strong> Long processes can be perpetually preempted by arriving shorter processes. A process might start execution but never finish if shorter processes keep arriving.',
            '<strong>High Overhead:</strong> Frequent context switches when new processes arrive, consuming CPU time for switching rather than actual work.'
          ],
          useCases: [
            'Real-time systems with priority on quick tasks',
            'Interactive systems requiring responsiveness',
            'Systems where burst times can be predicted accurately',
            'Environments where minimizing response time is critical'
          ]
        },
        'rr': {
          name: 'Round Robin',
          color: '#e1bee7',
          desc: 'Preemptive time-sharing. Each process gets fixed time quantum.',
          advantages: [
            'Fair allocation of CPU time',
            'No starvation - every process gets turns',
            'Good for time-sharing systems',
            'Responsive for interactive processes'
          ],
          disadvantages: [
            'Average waiting time often high',
            'Performance depends heavily on quantum size',
            'Context switching overhead',
            'Not optimal for varying burst times'
          ],
          problems: [
            '<strong>Quantum Size Dilemma:</strong> Too large quantum → behaves like FCFS with poor response time. Too small quantum → excessive context switching overhead wastes CPU cycles.',
            '<strong>Inefficient for I/O:</strong> Processes waiting for I/O still consume quantum slices, leading to wasted CPU time.'
          ],
          useCases: [
            'Time-sharing operating systems (Linux, Windows)',
            'Interactive multi-user systems',
            'Systems requiring fair CPU distribution',
            'General-purpose operating systems'
          ]
        },
        'priority_np': {
          name: 'Priority (Non-Preemptive)',
          color: '#ff9ff3',
          desc: 'CPU assigned to process with highest priority (lowest number).',
          advantages: [
            'Handles important tasks first',
            'Good for real-time systems',
            'Flexible - can mimic other algorithms',
            'Simple priority logic'
          ],
          disadvantages: [
            'Indefinite blocking (Starvation)',
            'Low priority processes may never run',
            'No preemption for urgent tasks',
            'Priority assignment can be complex'
          ],
          problems: [
            '<strong>Starvation:</strong> Low priority processes may wait indefinitely if high priority processes keep arriving.',
            '<strong>Priority Inversion:</strong> High priority process waits for resource held by low priority process.'
          ],
          useCases: [
            'Batch systems with job classes',
            'Real-time systems (soft)',
            'Environments with clear task hierarchy',
            'System processes vs User processes'
          ]
        },
        'priority_p': {
          name: 'Priority (Preemptive)',
          color: '#54a0ff',
          desc: 'CPU assigned to highest priority. Preempts if higher priority arrives.',
          advantages: [
            'Most responsive for high priority',
            'Urgent tasks run immediately',
            'Good for hard real-time systems',
            'Dynamic priority handling'
          ],
          disadvantages: [
            'Context switching overhead',
            'Starvation still possible',
            'Complex to implement',
            'Race conditions more likely'
          ],
          problems: [
            '<strong>Starvation:</strong> Low priority processes suffer even more than in non-preemptive if high priority tasks are frequent.',
            '<strong>Thrashing:</strong> If priorities change frequently or many high priority tasks arrive, system spends time switching.'
          ],
          useCases: [
            'Real-time operating systems (RTOS)',
            'Interrupt handling',
            'Device driver execution',
            'Mission-critical systems'
          ]
        }
      };

      const info = algoInfo[algorithm];

      const tabStyle = (tab) => `
                padding: 14px 20px 14px 30px;
                background: ${currentAlgoTab === tab ? info.color : '#ffffff'};
                border: 3px solid black;
                border-right: ${currentAlgoTab === tab ? 'none' : '3px solid black'};
                border-bottom: 3px solid black;
                cursor: pointer;
                font-weight: ${currentAlgoTab === tab ? '900' : 'bold'};
                font-family: 'Courier New', monospace;
                font-size: 13px;
                margin-right: ${currentAlgoTab === tab ? '0' : '-3px'};
                margin-bottom: -3px;
                width: 100%;
                text-align: left;
                position: relative;
                z-index: ${currentAlgoTab === tab ? '10' : '1'};
                color: black;
                text-shadow: none;
                letter-spacing: ${currentAlgoTab === tab ? '1px' : '0.5px'};
                transition: transform 0.2s;
            `;

      let tabContent = '';

      if (currentAlgoTab === 'demo') {
        tabContent = `
                    <style>
                        @keyframes fadeInUp {
                            from {
                                opacity: 0;
                                transform: translateY(20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .demo-section {
                            animation: fadeInUp 0.5s ease-out forwards;
                            opacity: 0;
                        }
                        .demo-button:hover {
                            transform: translateY(-3px);
                            box-shadow: 8px 8px 0 black !important;
                        }
                        .demo-button:active {
                            transform: translateY(2px);
                            box-shadow: 3px 3px 0 black !important;
                        }
                    </style>
                    <div class="demo-section" style="border: 3px solid black; padding: 16px; background: white; box-shadow: 4px 4px 0 black; margin-bottom: 20px; animation-delay: 0s;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 14px; margin: 0; text-transform: uppercase;">Process Queue</h3>
                            <div style="display: flex; gap: 16px; align-items: center;">
                                <div style="font-size: 12px;">TIME: <span id="demo-time" style="font-weight: bold; color: #ff006e;">0</span></div>
                                <div id="demo-quantum-box" style="font-size: 12px; display: ${algorithm === 'rr' ? 'block' : 'none'};">QUANTUM: <span id="demo-quantum" style="font-weight: bold; color: #ff6b6b;">4</span></div>
                            </div>
                        </div>
                        <div id="demo-queue" style="min-height: 200px; display: flex; flex-direction: column; gap: 8px;"></div>
                    </div>

                    <div class="demo-section" style="border: 3px solid black; padding: 16px; background: white; box-shadow: 4px 4px 0 black; margin-bottom: 20px; animation-delay: 0.1s;">
                        <h3 style="font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase;">Gantt Chart</h3>
                        <div id="demo-gantt" style="display: flex; min-height: 60px; border: 2px solid black; background: #f5f5f5;"></div>
                    </div>

                    <div class="demo-section" style="text-align: center; animation-delay: 0.2s;">
                        <button onclick="startAlgoDemo('${algorithm}')" class="demo-button" style="padding: 16px 48px; background: ${info.color}; border: 3px solid black; cursor: pointer; font-weight: bold; box-shadow: 6px 6px 0 black; font-family: 'Courier New', monospace; font-size: 16px; margin-right: 12px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">START DEMO</button>
                        <button onclick="resetAlgoDemo()" class="demo-button" style="padding: 16px 48px; background: #ff6b6b; border: 3px solid black; cursor: pointer; font-weight: bold; box-shadow: 6px 6px 0 black; font-family: 'Courier New', monospace; font-size: 16px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">RESET</button>
                    </div>
                `;
      } else if (currentAlgoTab === 'advantages') {
        const rotations = ['rotate(-2deg)', 'rotate(1.5deg)', 'rotate(-1deg)', 'rotate(2deg)'];
        tabContent = `
                    <style>
                        .advantage-card {
                            animation: slideInCard 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                        }
                        @keyframes slideInCard {
                            from {
                                opacity: 0;
                                transform: translateY(30px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .advantage-card:hover {
                            transform: translateY(-4px) rotate(0deg) !important;
                            box-shadow: 6px 8px 0 black !important;
                        }
                    </style>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        ${info.advantages.map((adv, idx) => `
                            <div class="advantage-card" style="border: 3px solid black; padding: 20px; background: #e8f8f5; box-shadow: 4px 4px 0 black; position: relative; transform: ${rotations[idx % rotations.length]}; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation-delay: ${idx * 0.1}s; will-change: transform;">
                                <div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; background: #333; border: 2px solid black; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; background: #666; border-radius: 50%;"></div>
                                </div>
                                <div style="position: absolute; top: -12px; left: 12px; background: #2ecc71; border: 3px solid black; padding: 4px 12px; font-weight: bold; font-size: 16px; transition: transform 0.2s;">
                                    ${idx + 1}
                                </div>
                                <div style="margin-top: 8px; display: flex; gap: 12px; align-items: start;">
                                    <div style="min-width: 40px; height: 40px; background: #2ecc71; border: 3px solid black; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; transition: transform 0.2s;">
                                        +
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px; font-weight: bold; line-height: 1.6;">
                                            ${adv}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
      } else if (currentAlgoTab === 'disadvantages') {
        const rotations = ['rotate(1.5deg)', 'rotate(-2deg)', 'rotate(2deg)', 'rotate(-1deg)'];
        tabContent = `
                    <style>
                        .disadvantage-card {
                            animation: slideInCard 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                        }
                        @keyframes slideInCard {
                            from {
                                opacity: 0;
                                transform: translateY(30px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        .disadvantage-card:hover {
                            transform: translateY(-4px) rotate(0deg) !important;
                            box-shadow: 6px 8px 0 black !important;
                        }
                    </style>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        ${info.disadvantages.map((dis, idx) => `
                            <div class="disadvantage-card" style="border: 3px solid black; padding: 20px; background: #ffe6e6; box-shadow: 4px 4px 0 black; position: relative; transform: ${rotations[idx % rotations.length]}; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation-delay: ${idx * 0.1}s; will-change: transform;">
                                <div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; background: #333; border: 2px solid black; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2); z-index: 10;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; background: #666; border-radius: 50%;"></div>
                                </div>
                                <div style="position: absolute; top: -12px; left: 12px; background: #e74c3c; color: white; border: 3px solid black; padding: 4px 12px; font-weight: bold; font-size: 16px;">
                                    ${idx + 1}
                                </div>
                                <div style="margin-top: 8px; display: flex; gap: 12px; align-items: start;">
                                    <div style="min-width: 40px; height: 40px; background: #e74c3c; color: white; border: 3px solid black; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold;">
                                        -
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px; font-weight: bold; line-height: 1.6;">
                                            ${dis}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
      } else if (currentAlgoTab === 'problems') {
        const problemGantt = getProblemGanttChart(algorithm);
        tabContent = `
                    <style>
                        @keyframes fadeInScale {
                            from {
                                opacity: 0;
                                transform: scale(0.95);
                            }
                            to {
                                opacity: 1;
                                transform: scale(1);
                            }
                        }
                        .problem-section {
                            animation: fadeInScale 0.5s ease-out forwards;
                        }
                    </style>
                    <div class="problem-section" style="border: 3px solid black; padding: 24px; background: #ffe6e6; box-shadow: 4px 4px 0 black; margin-bottom: 20px; animation-delay: 0s;">
                        <div style="display: inline-block; background: #ff6b6b; border: 3px solid black; padding: 8px 20px; box-shadow: 3px 3px 0 black; margin-bottom: 20px;">
                            <h3 style="font-size: 18px; margin: 0; text-transform: uppercase; color: white; font-weight: bold;">PROBLEM SPOTLIGHT</h3>
                        </div>
                        ${info.problems.map((prob, idx) => {
          const problemName = prob.match(/<strong>(.*?):<\/strong>/)?.[1] || 'Problem';
          const problemDesc = prob.replace(/<strong>.*?<\/strong>\s*/, '');
          return `
                                <div style="margin-bottom: 16px; background: white; border: 3px solid black; box-shadow: 4px 4px 0 black; overflow: hidden;">
                                    <div style="background: #ff6b6b; padding: 12px 16px; border-bottom: 3px solid black;">
                                        <div style="font-size: 16px; font-weight: bold; color: white; letter-spacing: 1px;">${problemName}</div>
                                    </div>
                                    <div style="padding: 16px; font-size: 14px; line-height: 1.7; font-weight: 500;">
                                        ${problemDesc}
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>

                    <div class="problem-section" style="border: 3px solid black; padding: 24px; background: white; box-shadow: 4px 4px 0 black; animation-delay: 0.15s;">
                        <div style="display: inline-block; background: black; border: 3px solid black; padding: 8px 20px; box-shadow: 3px 3px 0 black; margin-bottom: 20px;">
                            <h3 style="font-size: 16px; margin: 0; text-transform: uppercase; color: white; font-weight: bold;">VISUAL PROOF</h3>
                        </div>
                        <div style="margin-bottom: 16px; padding: 16px; background: #f8f9fa; border: 3px solid black; font-size: 13px; font-weight: 600; line-height: 1.6;">
                            ${problemGantt.description}
                        </div>
                        <div style="background: #f8f9fa; border: 3px solid black; padding: 16px; margin-bottom: 16px;">
                            ${problemGantt.chart}
                        </div>
                        <div style="padding: 16px; background: #ff6b6b; border: 3px solid black; font-size: 13px; font-weight: bold; color: white; box-shadow: 4px 4px 0 black;">
                            ${problemGantt.impact}
                        </div>
                    </div>
                `;
      } else if (currentAlgoTab === 'usecases') {
        const icons = ['A', 'B', 'C', 'D'];
        const colors = ['#e3f2fd', '#f3e5f5', '#fff9c4', '#e0f2f1'];
        tabContent = `
                    <style>
                        .usecase-card {
                            animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                        }
                        @keyframes bounceIn {
                            0% {
                                opacity: 0;
                                transform: scale(0.8);
                            }
                            60% {
                                opacity: 1;
                                transform: scale(1.05);
                            }
                            100% {
                                opacity: 1;
                                transform: scale(1);
                            }
                        }
                        .usecase-card:hover {
                            transform: translateY(-4px) scale(1.02);
                            box-shadow: 6px 8px 0 black !important;
                        }
                    </style>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        ${info.useCases.map((uc, idx) => `
                            <div class="usecase-card" style="border: 3px solid black; padding: 20px; background: ${colors[idx % colors.length]}; box-shadow: 4px 4px 0 black; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); animation-delay: ${idx * 0.1}s;">
                                <div style="display: flex; gap: 16px; align-items: start;">
                                    <div style="min-width: 60px; height: 60px; background: #3498db; border: 3px solid black; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; box-shadow: 3px 3px 0 black; transition: transform 0.3s;">
                                        ${icons[idx % icons.length]}
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 6px;">
                                            USE CASE ${idx + 1}
                                        </div>
                                        <div style="font-size: 14px; font-weight: bold; line-height: 1.6;">
                                            ${uc}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
      }

      content.innerHTML = `
                <style>
                    @keyframes headerSlideIn { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes tabPulse { 0%, 100% { box-shadow: inset 6px 0 12px rgba(0,0,0,0.15); } 50% { box-shadow: inset 8px 0 16px rgba(0,0,0,0.2); } }
                    @keyframes tabSlideIn { from { transform: translateX(-10px); opacity: 0.8; } to { transform: translateX(0); opacity: 1; } }

                    /* Page turn animations */
                    @keyframes pageTurnOpen {
                        0% { transform: rotateY(0deg); opacity: 1; box-shadow: inset 0 0 0 rgba(0,0,0,0); }
                        100% { transform: rotateY(-82deg) translateX(-6%); opacity: 0.8; box-shadow: inset 20px 0 30px rgba(0,0,0,0.15); }
                    }
                    @keyframes pageTurnClose {
                        0% { transform: rotateY(82deg) translateX(6%); opacity: 0.8; box-shadow: inset -20px 0 30px rgba(0,0,0,0.15); }
                        100% { transform: rotateY(0deg); opacity: 1; box-shadow: inset 0 0 0 rgba(0,0,0,0); }
                    }

                    #algo-tab-content { perspective: 1200px; -webkit-perspective: 1200px; transform-style: preserve-3d; }
                    .page-turn-start { transform-origin: left center; backface-visibility: hidden; animation: pageTurnOpen 200ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                    .page-turn-finish { transform-origin: right center; backface-visibility: hidden; animation: pageTurnClose 200ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

                    .algo-tab-button { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; }
                    .algo-tab-button:hover:not(.active-tab) { background: #f0f0f0 !important; padding-left: 28px !important; border-left: 6px solid black !important; transform: translateX(3px); }
                    .algo-tab-button.active-tab { animation: tabSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), tabPulse 2s ease-in-out infinite; }
                    .algo-tab-button.active-tab::before { content: ''; position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 6px; height: 6px; background: black; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.5); animation: dotPulse 1.5s ease-in-out infinite; }
                    @keyframes dotPulse { 0%,100% { transform: translateY(-50%) scale(1); opacity: 1; } 50% { transform: translateY(-50%) scale(1.3); opacity: 0.7; } }
                    .algo-tab-button.active-tab::after { content: ''; position: absolute; right: -4px; top: 0; bottom: 0; width: 12px; background: linear-gradient(to right, transparent, rgba(0,0,0,0.05)); pointer-events: none; }

                    .try-button { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                    .try-button:hover { background: #ffffff !important; padding: 24px !important; box-shadow: 4px 4px 0 black !important; }
                    .try-button:active { transform: translateY(2px); box-shadow: 1px 1px 0 black !important; }

                    .header-badge { animation: headerSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
                    .header-text { animation: headerSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); animation-delay: 0.1s; opacity: 0; animation-fill-mode: forwards; }
                </style>
                <div style="background: ${info.color}; padding: 40px 48px; border-bottom: 4px solid black; margin-bottom: 0; display: flex; align-items: center; gap: 32px; overflow: hidden;">
                    <div class="header-badge" style="display: inline-block; padding: 16px 32px; background: black; border: 4px solid black; box-shadow: 8px 8px 0 black; transform: rotate(-3deg);">
                        <h2 style="font-size: 48px; font-weight: 900; margin: 0; letter-spacing: 4px; color: ${info.color}; font-family: 'Courier New', monospace;">${algorithm.toUpperCase()}</h2>
                    </div>
                    <div class="header-text" style="flex: 1;">
                        <div style="margin-bottom: 16px;">
                            <p style="font-size: 28px; margin: 0; font-weight: 900; color: white; background: black; padding: 8px 16px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; transform: rotate(1deg); box-shadow: 4px 4px 0 rgba(255,255,255,0.4); border: 2px solid black;">${info.name}</p>
                        </div>
                        <div style="background: white; border: 3px solid black; padding: 12px 16px; display: inline-block; box-shadow: 6px 6px 0 black; max-width: 800px;">
                            <p style="font-size: 16px; margin: 0; color: black; font-weight: 700; line-height: 1.5; font-family: 'Courier New', monospace;">${info.desc}</p>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 0; width: 100%; position: relative;">
                    <div style="display: flex; flex-direction: column; background: white; border-right: 3px solid black; width: 220px; position: relative; z-index: 1;">
                        <div style="display: flex; flex-direction: column; gap: 0; flex: 1; padding-top: 8px;">
                            <button onclick="switchAlgoTab('demo')" class="algo-tab-button ${currentAlgoTab === 'demo' ? 'active-tab' : ''}" style="${tabStyle('demo')}">
                                DEMO
                            </button>
                            <button onclick="switchAlgoTab('advantages')" class="algo-tab-button ${currentAlgoTab === 'advantages' ? 'active-tab' : ''}" style="${tabStyle('advantages')}">
                                ADVANTAGES
                            </button>
                            <button onclick="switchAlgoTab('disadvantages')" class="algo-tab-button ${currentAlgoTab === 'disadvantages' ? 'active-tab' : ''}" style="${tabStyle('disadvantages')}">
                                DISADVANTAGES
                            </button>
                            <button onclick="switchAlgoTab('problems')" class="algo-tab-button ${currentAlgoTab === 'problems' ? 'active-tab' : ''}" style="${tabStyle('problems')}">
                                PROBLEMS
                            </button>
                            <button onclick="switchAlgoTab('usecases')" class="algo-tab-button ${currentAlgoTab === 'usecases' ? 'active-tab' : ''}" style="${tabStyle('usecases')}">
                                USE CASES
                            </button>
                        </div>
                        <button onclick="tryAlgorithm('${algorithm}')" class="try-button" style="padding: 20px; background: ${info.color}; border: 3px solid black; border-right: none; cursor: pointer; font-weight: bold; font-family: 'Courier New', monospace; font-size: 14px; box-shadow: none; margin-top: auto; text-align: center;">TRY THIS</button>
                    </div>

                    <div id="algo-tab-content" style="flex: 1; padding: 32px 32px 32px 72px; background: repeating-linear-gradient(transparent, transparent 29px, #e0d9ce 29px, #e0d9ce 30px), linear-gradient(to right, #fff8f0 0%, #fefdfb 20%, #fefdfb 80%, #fff8f0 100%); position: relative; box-shadow: inset 6px 0 12px rgba(0,0,0,0.08);">
                        <!-- Red margin line -->
                        <div style="position: absolute; left: 52px; top: 0; bottom: 0; width: 2px; background: #ff6b6b; opacity: 0.5;"></div>
                    </div>
                </div>
            `;

      updateTabContent(algorithm);
    }
    function updateDemoQueue(processes, currentTime, executingProcess) {
      const queue = document.getElementById('demo-queue');
      queue.innerHTML = processes.map(p => {
        const isExecuting = executingProcess && executingProcess.id === p.id && p.remaining > 0;
        const status = p.remaining === 0 ? 'DONE' : (isExecuting ? '▶ EXECUTING' : (p.arrived ? 'READY' : `Arrives at t=${p.arrival}`));
        const bgColor = p.remaining === 0 ? '#ddd' : (isExecuting ? '#4ecdc4' : (p.arrived ? p.color : '#f0f0f0'));
        const fontWeight = isExecuting ? 'bold' : 'normal';
        return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: ${bgColor}; border: ${isExecuting ? '3px' : '2px'} solid black; box-shadow: ${isExecuting ? '4px 4px 0 black' : '2px 2px 0 black'};">
                        <span style="font-weight: bold;">${p.id}</span>
                        <span style="font-size: 11px; font-weight: ${fontWeight};">${status} | Burst: ${p.burst} | Remaining: ${p.remaining}</span>
                    </div>
                `;
      }).join('');
    }

    function updateDemoGantt(gantt) {
      const ganttEl = document.getElementById('demo-gantt');
      ganttEl.innerHTML = gantt.map(g => `
                <div style="flex: 1; background: ${g.color}; border-right: 1px solid black; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px;">${g.process}</div>
            `).join('');
    }
    function closeAlgorithmDemo() {
      const modal = document.getElementById('algo-demo-modal');
      const panel = document.getElementById('algo-demo-panel');
      panel.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 400);
      if (demoInterval) clearInterval(demoInterval);
      demoState = null;
    }
