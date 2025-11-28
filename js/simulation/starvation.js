    function detectStarvation() {
      starvingSet.clear();
      const blockedProcesses = nodes.filter(n => {
        const state = (n.state || '').toUpperCase();
        return n.type === 'process' && (state === 'BLOCKED' || state === 'READY');
      });

      if (blockedProcesses.length === 0) {
        printToCli('✓ No processes waiting for resources. No starvation detected.', 'success');
        return;
      }

      // For manual detection, only use actual wait times from simulation
      // Don't artificially inflate wait times
      blockedProcesses.forEach(p => {
        if (!processWaitTimes[p.id]) {
          processWaitTimes[p.id] = 0;
        }
      });

      // Check for starvation patterns
      const starvationReasons = [];

      // Only detect starvation if simulation has actually run
      const hasSimulationRun = Object.keys(processWaitTimes).length > 0 &&
        Object.values(processWaitTimes).some(t => t > 0);

      if (!hasSimulationRun) {
        printToCli('⚠ Starvation can only be detected after running simulation for 50+ cycles', 'error');
        printToCli('Click "Run OS" and wait, then check again', 'info');
        return;
      }

      blockedProcesses.forEach(process => {
        const waitTime = processWaitTimes[process.id] || 0;

        // Check if process has been waiting too long
        if (waitTime >= starvationThreshold) {
          starvingSet.add(process.id);

          // Determine reason for starvation
          const requestedResources = edges.filter(e =>
            e.source === process.id &&
            nodes.find(n => n.id === e.target && n.type === 'resource')
          );

          const resourceNames = requestedResources.map(e => {
            const res = nodes.find(n => n.id === e.target);
            return res ? res.label : 'Unknown';
          });

          // Check if resources are constantly allocated to others
          const resourcesFullyAllocated = requestedResources.every(reqEdge => {
            const resource = nodes.find(n => n.id === reqEdge.target);
            return resource && resource.allocated >= resource.instances;
          });

          let reason = '';
          if (resourcesFullyAllocated) {
            reason = `constantly denied access to ${resourceNames.join(', ')} (held by other processes)`;
          } else {
            reason = `waiting indefinitely for ${resourceNames.join(', ')} due to unfair scheduling`;
          }

          starvationReasons.push({
            process: process.label,
            waitTime: waitTime,
            reason: reason
          });
        }
      });

      draw();

      if (starvingSet.size > 0) {
        printToCli(`⚠ Starvation detected in ${starvingSet.size} process(es)!`, 'error');

        // Show starvation details in CLI
        starvationReasons.forEach(sr => {
          printToCli(`  → ${sr.process}: ${sr.reason} (waited ${sr.waitTime} cycles)`, 'error');
        });

        // Show in modal
        const modalContent = `
                    <style>
                        @keyframes dotMove {
                            0% { background-position: 0 0, 10px 10px; }
                            100% { background-position: 20px 20px, 30px 30px; }
                        }
                        @keyframes slideDown {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                        }
                        @keyframes slideInFromRight {
                            from { transform: translateX(100%); }
                            to { transform: translateX(0); }
                        }
                        .starvation-card {
                            opacity: 0;
                            transform: translateY(20px);
                            transition: all 0.3s ease-out;
                        }
                        .starvation-card.animate-in {
                            opacity: 1;
                            transform: translateY(0);
                        }
                        .starvation-close-btn {
                            opacity: 0;
                            transform: translateY(20px);
                            transition: all 0.3s ease-out;
                        }
                        .starvation-close-btn.animate-in {
                            opacity: 1;
                            transform: translateY(0);
                        }
                        .info-tooltip {
                            display: none;
                            position: absolute;
                            top: 50px;
                            right: 20px;
                            width: 280px;
                            background: #FFF3E0;
                            border: 3px solid black;
                            padding: 14px;
                            font-size: 13px;
                            line-height: 1.6;
                            box-shadow: 6px 6px 0 rgba(0,0,0,0.3);
                            font-weight: 600;
                            z-index: 10003;
                        }
                        .info-btn:hover + .info-tooltip {
                            display: block;
                        }
                    </style>
                    <div class="starvation-panel-content" style="background: white; background-image: radial-gradient(circle, #000 1px, transparent 1px), radial-gradient(circle, #000 1px, transparent 1px); background-size: 20px 20px; background-position: 0 0, 10px 10px; animation: dotMove 4s linear infinite, slideInFromRight 0.4s ease-out; border-left: 8px solid black; box-shadow: -12px 0 0 black; width: 50%; height: 100vh; overflow-y: auto; padding: 50px; position: fixed; top: 0; right: 0; font-family: 'Courier New', monospace;">
                        <button onclick="closeStarvationModal()" class="neo-btn starvation-close-btn" style="position: fixed; top: 20px; left: calc(50% + 20px); background: #ff4757; color: white; font-weight: 900; padding: 10px 20px; font-size: 14px; border: 3px solid black; box-shadow: 4px 4px 0 black; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; z-index: 10002;" onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='6px 6px 0 black'" onmouseout="this.style.transform=''; this.style.boxShadow='4px 4px 0 black'">
                            <i class="fas fa-times"></i> CLOSE
                        </button>

                        <button class="info-btn" style="position: fixed; top: 20px; right: 20px; width: 32px; height: 32px; border: 3px solid black; background: #4ecdc4; color: black; font-weight: 900; font-size: 16px; cursor: pointer; box-shadow: 3px 3px 0 rgba(0,0,0,0.3); font-family: 'Courier New', monospace; border-radius: 50%; z-index: 10003; display: flex; align-items: center; justify-content: center; padding: 0;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            i
                        </button>
                        <div class="info-tooltip">
                            <strong style="text-decoration: underline;">What is Starvation?</strong><br>
                            A process is continuously prevented from accessing resources, even though the system is not in deadlock. Unlike deadlock where <em>nobody</em> can proceed, in starvation <em>one unlucky process</em> never gets to proceed.
                        </div>

                        <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 40px; color: white; border: 4px solid black; padding: 14px 18px; background: #FF5722; letter-spacing: 1.5px; box-shadow: 6px 6px 0 black; text-transform: uppercase; animation: pulse 2s ease-in-out infinite; transform-origin: center; margin-top: 60px; position: relative;">
                            <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 26px; height: 26px; background: #ff4757; border: 4px solid black; border-radius: 50%; box-shadow: inset 0 0 0 4px white, 4px 4px 0 rgba(0,0,0,0.4); z-index: 1;"></div>
                            <span style="display: inline-block; margin-right: 8px; font-size: 26px;">⚠</span>SOME PROCESSES ARE STARVING:
                        </h2>

                        <div style="margin-bottom: 30px;">
                            ${starvationReasons.map((sr, index) => `
                                <div class="starvation-card" style="background: #fffef7; border: 4px solid black; padding: 16px; margin-bottom: 16px; box-shadow: 6px 6px 0 black; position: relative; transition: all 0.2s;">
                                    <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; background: #ff4757; border: 3px solid black; border-radius: 50%; box-shadow: inset 0 0 0 3px white, 3px 3px 0 rgba(0,0,0,0.4); z-index: 1;"></div>
                                    <div style="position: absolute; top: -10px; left: 16px; background: #FF5252; color: white; padding: 4px 10px; font-size: 10px; font-weight: 900; border: 3px solid black; box-shadow: 3px 3px 0 rgba(0,0,0,0.3); letter-spacing: 0.5px;">BLOCKED</div>
                                    <div style="margin-top: 10px; border-left: 4px solid #FF5252; padding-left: 10px;">
                                        <strong style="color: #FF5252; font-size: 16px; display: block; font-weight: 900; letter-spacing: 0.3px;">${sr.process}</strong>
                                    </div>
                                    <div style="background: #f9f9f9; border: 2px solid black; padding: 10px; margin-top: 10px; border-left: 4px solid #666;">
                                        <div style="font-size: 11px; color: #999; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Reason</div>
                                        <span style="font-size: 13px; display: block; line-height: 1.5; font-weight: 600;">${sr.reason}</span>
                                    </div>
                                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
                                        <div style="background: #FFD700; border: 3px solid black; padding: 6px 10px; font-size: 12px; font-weight: 900; box-shadow: 3px 3px 0 rgba(0,0,0,0.2); display: flex; align-items: center; gap: 6px;">
                                            <span style="font-size: 14px;">⏱</span>
                                            <span>${sr.waitTime} cycles</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

        const modal = document.createElement('div');
        modal.id = 'starvation-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10001;';
        modal.innerHTML = modalContent;
        modal.onclick = (e) => { if (e.target === modal) closeStarvationModal(); };
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Animate cards in sequence after container finishes sliding in (400ms)
        setTimeout(() => {
          const cards = document.querySelectorAll('.starvation-card');
          cards.forEach((card, index) => {
            // Apply rotation after adding animate-in class
            const rotation = index % 2 === 0 ? '1deg' : '-1deg';
            setTimeout(() => {
              card.classList.add('animate-in');
              card.style.transform = `translateY(0) rotate(${rotation})`;
            }, index * 60);
          });

          // Animate close button last
          const closeBtn = document.querySelector('.starvation-close-btn');
          setTimeout(() => {
            closeBtn.classList.add('animate-in');
          }, cards.length * 60 + 100);
        }, 400);
      } else {
        printToCli('✓ No starvation detected. All blocked processes are waiting reasonably.', 'success');
      }
    }

    function closeStarvationModal() {
      const modal = document.getElementById('starvation-modal');
      if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
      }
    }

    // Update wait times during simulation
    function updateStarvationTracking() {
      nodes.filter(n => n.type === 'process').forEach(process => {
        const state = (process.state || '').toUpperCase();
        if (state === 'BLOCKED') {
          if (!processWaitTimes[process.id]) processWaitTimes[process.id] = 0;
          processWaitTimes[process.id]++;

          // Auto-detect severe starvation during simulation
          if (processWaitTimes[process.id] >= starvationThreshold && !starvingSet.has(process.id)) {
            starvingSet.add(process.id);
            printToCli(`⚠ ${process.label} is experiencing starvation! (waited ${processWaitTimes[process.id]} cycles)`, 'error');
          }
        } else if (state === 'RUNNING' || state === 'READY') {
          // Reset wait time when process gets to run or becomes ready
          processWaitTimes[process.id] = 0;
          starvingSet.delete(process.id);
        }
      });
    }
