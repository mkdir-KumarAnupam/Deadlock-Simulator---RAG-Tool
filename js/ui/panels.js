    function openAIPanel() {
      const panel = document.getElementById('ai-panel');
      panel.style.right = '150px';
      closeProps();
    }

    function closeAIPanel() {
      document.getElementById('ai-panel').style.right = '-450px';
    }

    // --- Scenario Library Functions ---
    function openScenarioLibrary() {
      const modal = document.getElementById('scenario-library-modal');

      // Build modal content dynamically
      const scenarios = getScenarioData();
      let html = `
                <div class="scenario-library-content" style="background: #f8f8f8; background-image: radial-gradient(circle, #d0d0d0 2px, transparent 2px); background-size: 24px 24px; background-position: 0 0; border-right: 8px solid black; box-shadow: 12px 0 0 black; width: 60%; height: 100vh; overflow-y: auto; padding: 50px; position: fixed; top: 0; left: 0;">
                    <button onclick="closeScenarioLibrary()" class="neo-btn library-close-btn" style="position: sticky; top: 10px; float: right; background: #ff4757; color: white; font-weight: bold; z-index: 10001; margin-bottom: 20px; margin-right: -10px;">
                        <i class="fas fa-times"></i> CLOSE
                    </button>

                    <div style="border: 6px solid black; box-shadow: 8px 8px 0 black; padding: 32px; margin-bottom: 32px; transform: rotate(-1deg); position: relative; transform-origin: top right; background: white; animation: titleWobble 4s ease-in-out infinite;">
                        <h1 style="font-family: 'Courier New', monospace; font-size: 3rem; font-weight: 900; border: 5px solid black; background: #ffe600; padding: 20px; box-shadow: 8px 8px 0 black; text-align: center; margin: 0 0 20px 0; letter-spacing: 2px; position: relative;">
                            <div class="title-pin" style="top: -10px; right: 2%; position: absolute; width: 26px; height: 26px; box-shadow: inset 0 0 0 4px white, 4px 4px 0 black;"></div>
                            SCENARIO LIBRARY
                        </h1>
                        <p style="font-family: 'Courier New', monospace; font-size: 15px; text-align: center; padding: 16px; background: white; border: 3px solid black; margin: 0; line-height: 1.6;">
                            <strong>Learn Operating System concepts through interactive scenarios.</strong><br>
                            Click any card to load the scenario and start exploring.
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
            `;

      scenarios.forEach(s => {
        html += `
                    <div class="scenario-card" onclick="loadScenarioFromLibrary('${s.id}')">
                        <div class="card-pin card-pin-top-left"></div>
                        <div class="scenario-category" style="background: ${s.categoryColor};">${s.category}</div>
                        <div class="scenario-number">${s.number}</div>
                        <h3 class="scenario-title">${s.title}</h3>
                        <p class="scenario-description">${s.description}</p>
                        <div class="scenario-outcome bg-white ">
                            <strong class"bg-white">LEARNING OUTCOME:</strong><br>
                            ${s.outcome}
                        </div>
                        <div class="scenario-config">
                            ${s.config.map(c => `<span><i class="${c.icon}"></i> ${c.text}</span>`).join('')}
                        </div>
                    </div>
                `;
      });

      html += `
                    </div>
                    <div style="background: #4ecdc4; border: 4px solid black; box-shadow: 8px 8px 0 black; padding: 20px; margin-top: 32px; text-align: center; transform: rotate(1deg);">
                        <p style="font-family: 'Courier New', monospace; font-size: 14px; color: black; margin: 0; font-weight: bold;">
                            PRO TIP: After loading a scenario, use the Settings menu to adjust simulation speed and observe behavior in detail!
                        </p>
                    </div>
                </div>
            `;

      modal.innerHTML = html;
      modal.style.display = 'block';
      modal.style.animation = 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.overflow = 'hidden';

      // Animate cards in sequence after container finishes (600ms for smoother panel slide)
      setTimeout(() => {
        const cards = document.querySelectorAll('.scenario-card');
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('animate-in');
          }, index * 80); // Slightly slower stagger for smoother effect
        });

        // Animate close button last
        const closeBtn = document.querySelector('.library-close-btn');
        setTimeout(() => {
          closeBtn.classList.add('animate-in');
        }, cards.length * 80 + 150);
      }, 600);
    }

    function closeScenarioLibrary() {
      document.getElementById('scenario-library-modal').style.display = 'none';
      document.body.style.overflow = 'auto';
    }

    function loadScenarioFromLibrary(type) {
      closeScenarioLibrary();
      loadScenario(type);
    }
    // --- Legend Functions ---
    function toggleLegend() {
      const legendBox = document.getElementById('legend-box');
      const toggleBtn = document.getElementById('legend-toggle-btn');

      legendBox.classList.toggle('minimized');
      toggleBtn.classList.toggle('visible');
    }

    // --- Stats Pane Functions ---
    function toggleStatsPane() {
      const pane = document.getElementById('stats-pane');
      const toolsPanel = document.getElementById('sidebar-tools');
      pane.classList.toggle('open');
      toolsPanel.classList.toggle('shift-left');
      updateStats();
    }

    function updateStats() {
      // System Overview
      document.getElementById('stat-processes').textContent = nodes.filter(n => n.type === 'process').length;
      document.getElementById('stat-resources').textContent = nodes.filter(n => n.type === 'resource').length;
      const runningNode = getNodeById(currentRunningNodeId);
      document.getElementById('stat-running').textContent = runningNode ? runningNode.label : 'IDLE';
      document.getElementById('stat-scheduler').textContent = document.getElementById('scheduler-label').textContent;
      document.getElementById('stat-cpu-cores').textContent = systemConfig.cpuCores;
      document.getElementById('stat-max-memory').textContent = systemConfig.maxMemory + ' MB';

      // Process States
      const processes = nodes.filter(n => n.type === 'process');
      document.getElementById('stat-ready').textContent = processes.filter(p => p.state === 'READY').length;
      document.getElementById('stat-state-running').textContent = processes.filter(p => p.state === 'RUNNING').length;
      document.getElementById('stat-blocked').textContent = processes.filter(p => p.state === 'BLOCKED').length;
      document.getElementById('stat-terminated').textContent = processes.filter(p => p.state === 'TERMINATED').length;

      // Performance Metrics
      if (isRunning && simulationStartTime) {
        simulationTime = Math.floor((Date.now() - simulationStartTime) / 1000);
      }
      document.getElementById('stat-time').textContent = simulationTime + 's';
      document.getElementById('stat-deadlock').textContent = deadlockSet.size > 0 ? 'DEADLOCK!' : 'SAFE';

      // CPU Utilization
      const totalProcesses = processes.length;
      const runningCount = processes.filter(p => p.state === 'RUNNING').length;
      const cpuUtil = totalProcesses > 0 ? Math.round((runningCount / 1) * 100) : 0;
      document.getElementById('stat-cpu').textContent = cpuUtil + '%';

      // Resource Allocation
      const resourceStats = document.getElementById('resource-stats-container');
      const resources = nodes.filter(n => n.type === 'resource');
      if (resources.length === 0) {
        resourceStats.innerHTML = '<div class="text-gray-500 italic">No resources</div>';
      } else {
        resourceStats.innerHTML = resources.map(r => {
          const holders = edges.filter(e => e.source === r.id).map(e => getNodeById(e.target));
          const allocated = holders.length;
          return `
                        <div class="stat-item">
                            <span>${r.label} (${allocated}/${r.capacity}):</span>
                            <span class="text-[10px]">${holders.length > 0 ? holders.map(h => h.label).join(', ') : 'Free'}</span>
                        </div>
                    `;
        }).join('');
      }
    }
    // --- Props Panel ---
    function openProps(node) {
      propPanel.style.right = '120px';
      const content = document.getElementById('prop-content');

      let html = `
                <div class="mt-3">
                    <label class="block text-xs font-bold mb-1">LABEL:</label>
                    <input type="text" class="neo-input" value="${node.label}"
                        onchange="updateLabel(${node.id}, this.value)">
                </div>
                <div class="text-sm mt-2"><strong>Type:</strong> ${node.type}</div>
                <div class="mt-3">
                    <label class="block text-xs font-bold mb-1">COLOR (HEX):</label>
                    <div class="flex gap-2">
                        <input type="text" class="neo-input" value="${node.customColor || ''}" placeholder="#RRGGBB"
                            onchange="updateNodeColor(${node.id}, this.value)" style="flex: 1;">
                        <input type="color" value="${node.customColor || (node.type === 'process' ? config.colors.ready : config.colors.resource)}"
                            onchange="updateNodeColor(${node.id}, this.value)" style="width: 40px; height: 30px; border: 2px solid black;">
                    </div>
                </div>
            `;

      if (node.type === 'process') {
        html += `
                    <div class="mt-3">
                        <label class="block text-xs font-bold mb-1">BURST TIME:</label>
                        <input type="number" class="neo-input" value="${node.burstTime}"
                            onchange="updateBurst(${node.id}, this.value)">
                    </div>
                    <div class="mt-3">
                        <label class="block text-xs font-bold mb-1">RAM (MB):</label>
                        <input type="number" class="neo-input" value="${node.memory}"
                            onchange="updateMemory(${node.id}, this.value)">
                    </div>
                    <div class="mt-2 text-xs font-bold">State: ${node.state}</div>
                `;
      } else {
        const holders = edges.filter(e => e.source === node.id);
        const allocated = holders.length;
        html += `
                    <div class="mt-3">
                        <label class="block text-xs font-bold mb-1">CAPACITY:</label>
                        <input type="number" min="1" class="neo-input" value="${node.capacity}"
                            onchange="updateCapacity(${node.id}, this.value)">
                    </div>
                    <div class="mt-3 text-sm">
                        <strong>Allocated: ${allocated} / ${node.capacity}</strong>
                    </div>
                    <div class="mt-2 text-xs">
                        ${holders.length > 0 ?
            `Held by: <strong>${holders.map(e => getNodeById(e.target).label).join(', ')}</strong>`
            : `<span class="text-green-600">Free</span>`}
                    </div>
                `;
      }
      content.innerHTML = html;
    }

    function closeProps() {
      propPanel.style.right = '-280px';
    }
    window.updateLabel = (id, val) => {
      const n = getNodeById(id);
      if (n) {
        n.label = val.trim() || n.label;
        printToCli(`Renamed to ${n.label}`);
        draw();
        saveState();
      }
    };
    window.updateNodeColor = (id, val) => {
      const n = getNodeById(id);
      if (n) {
        const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
        if (hexRegex.test(val) || val === '') {
          n.customColor = val || null;
          draw();
          printToCli(`Updated ${n.label} color`);
          saveState();
        } else {
          printToCli('Invalid hex color format. Use #RRGGBB', 'error');
        }
      }
    };
    window.updateBurst = (id, val) => {
      const n = getNodeById(id);
      if (n) { n.burstTime = parseInt(val); if (n.burstTime > n.maxBurst) n.maxBurst = n.burstTime; draw(); }
    };
    window.updateMemory = (id, val) => {
      const n = getNodeById(id);
      if (n) { n.memory = parseInt(val); updateSystemStats(); printToCli(`Updated ${n.label} memory`); }
    };
    window.updateCapacity = (id, val) => {
      const n = getNodeById(id);
      if (n && n.type === 'resource') {
        n.capacity = Math.max(1, parseInt(val));
        updateSystemStats();
        updateStats();
        draw();
        printToCli(`Updated ${n.label} capacity to ${n.capacity}`);
        saveState();
      }
    };

    // Confirm clear board
    function confirmClearBoard() {
      if (!showClearWarning) {
        executeClearBoard();
        return;
      }

      const modal = document.getElementById('clear-board-modal');
      modal.style.display = 'block';
      // Reset checkbox state
      document.getElementById('dont-show-clear-warning').checked = false;
    }

    // Execute clear board
    function executeClearBoard() {
      // Check if user wants to hide warning
      const dontShowAgain = document.getElementById('dont-show-clear-warning').checked;
      if (dontShowAgain) {
        showClearWarning = false;
        localStorage.setItem('showClearWarning', 'false');
      }

      closeClearModal();
      resetGraph();
    }

    // Close clear modal
    function closeClearModal() {
      const modal = document.getElementById('clear-board-modal');
      modal.style.display = 'none';
    }

    // Load clear warning preference on startup
    function loadClearWarningPreference() {
      const stored = localStorage.getItem('showClearWarning');
      if (stored === 'false') {
        showClearWarning = false;
      }
    }
