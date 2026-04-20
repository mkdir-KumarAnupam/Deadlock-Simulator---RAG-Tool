    // --- View Switching ---
    function switchView(viewName) {
      document.getElementById('view-queues').classList.add('hidden');
      document.getElementById('view-gantt').classList.add('hidden');
      document.getElementById('view-metrics').classList.add('hidden');
      document.getElementById('tab-queues').classList.remove('active');
      document.getElementById('tab-gantt').classList.remove('active');
      document.getElementById('tab-metrics').classList.remove('active');

      document.getElementById(`view-${viewName}`).classList.remove('hidden');
      document.getElementById(`tab-${viewName}`).classList.add('active');
    }

    // --- Menu Logic ---
    function toggleMenu(e, menuId) {
      e.stopPropagation();
      document.querySelectorAll('.neo-dropdown').forEach(d => {
        if (d.id !== menuId) d.classList.remove('show');
      });
      document.getElementById(menuId).classList.toggle('show');
    }

    function closeMenu(e) {
      if (!e.target.closest('.neo-title') && !e.target.closest('.neo-btn') && !e.target.closest('.neo-dropdown')) {
        document.querySelectorAll('.neo-dropdown').forEach(d => d.classList.remove('show'));
      }
    }

    // --- Scenario UI Toggle ---
    function toggleScenarioUIMode(useLegacy) {
      const legacyOptions = document.getElementById('legacy-scenario-options');

      if (useLegacy) {
        if (legacyOptions) legacyOptions.style.display = 'block';
        if (window.Auth && Auth.savePreference) Auth.savePreference('useLegacyScenarios', 'true');
        else localStorage.setItem('useLegacyScenarios', 'true');
      } else {
        if (legacyOptions) legacyOptions.style.display = 'none';
        if (window.Auth && Auth.savePreference) Auth.savePreference('useLegacyScenarios', 'false');
        else localStorage.setItem('useLegacyScenarios', 'false');
      }
    }

    // Load saved preference on page load
    window.addEventListener('DOMContentLoaded', () => {
      const useLegacy = localStorage.getItem('useLegacyScenarios') === 'true';
      document.getElementById('config-legacy-scenarios').checked = useLegacy;
      if (useLegacy) {
        toggleScenarioUIMode(true);
      }

      // Load saved background pattern
      const savedPattern = localStorage.getItem('backgroundPattern') || 'dots';
      setBackgroundPattern(savedPattern);
      const patternRadio = document.querySelector(`input[name="bg-pattern"][value="${savedPattern}"]`);
      if (patternRadio) patternRadio.checked = true;

      // Load saved pattern opacity
      const savedOpacity = localStorage.getItem('patternOpacity') || '10';
      document.getElementById('config-pattern-opacity').value = savedOpacity;
      setPatternOpacity(savedOpacity);

      // Load saved Gemini API key
      loadGeminiKey();
    });

    // --- Hardware View Toggle ---
    window.toggleHardwareView = function() {
        const hwPanel = document.getElementById('hardware-panel');
        if (hwPanel) {
            hwPanel.classList.toggle('hidden');
            if (!hwPanel.classList.contains('hidden')) {
                hwPanel.style.display = 'flex';
            } else {
                hwPanel.style.display = 'none';
            }
        }
    };

    // --- Cloud / OS Mode Toggle ---
    window.isCloudMode = false;
    window.toggleCloudMode = function(toCloud) {
        window.isCloudMode = toCloud;
        const toolsOs = document.getElementById('tools-os');
        const toolsCloud = document.getElementById('tools-cloud');
        const labelOs = document.getElementById('label-mode-os');
        const labelCloud = document.getElementById('label-mode-cloud');
        const chaosPanel = document.getElementById('chaos-panel');

        // Update settings checkbox state if toggled programmatically
        const cloudCheckbox = document.getElementById('config-cloud-mode');
        if (cloudCheckbox) cloudCheckbox.checked = toCloud;

        if (toCloud) {
            toolsOs.classList.add('hidden');
            toolsCloud.classList.remove('hidden');
            if (labelCloud) {
                labelCloud.classList.add('bg-[#ffe600]', 'text-black');
                labelCloud.classList.remove('bg-white', 'text-gray-400');
            }
            if (labelOs) {
                labelOs.classList.add('bg-white', 'text-gray-400');
                labelOs.classList.remove('bg-[#ffe600]', 'text-black');
            }
            if (chaosPanel) { chaosPanel.classList.remove('hidden'); chaosPanel.classList.add('flex'); }
            if (typeof setMode === 'function') setMode('microservice');
        } else {
            toolsCloud.classList.add('hidden');
            toolsOs.classList.remove('hidden');
            if (labelOs) {
                labelOs.classList.add('bg-[#ffe600]', 'text-black');
                labelOs.classList.remove('bg-white', 'text-gray-400');
            }
            if (labelCloud) {
                labelCloud.classList.add('bg-white', 'text-gray-400');
                labelCloud.classList.remove('bg-[#ffe600]', 'text-black');
            }
            if (chaosPanel) { chaosPanel.classList.add('hidden'); chaosPanel.classList.remove('flex'); }
            if (typeof setMode === 'function') setMode('process');
        }
    };

    // --- Chaos Engineering Controls ---
    window.updateRPS = function(val) {
        document.getElementById('val-rps').innerText = val;
        if (typeof nodes !== 'undefined') {
            nodes.filter(n => n.type === 'gateway').forEach(n => {
                n.rps = parseInt(val);
            });
        }
    };

    window.globalPacketLoss = 0;
    window.updatePacketLoss = function(val) {
        document.getElementById('val-ploss').innerText = val;
        window.globalPacketLoss = parseInt(val) / 100.0;
    };

    window.injectChaos = function(type) {
        if (typeof nodes === 'undefined') return;
        if (type === 'latency') {
            const dbs = nodes.filter(n => n.type === 'database');
            if (dbs.length > 0) {
                const db = dbs[Math.floor(Math.random() * dbs.length)];
                db.queueCapacity = 2; // severe bottleneck
                db.droppedRequests += 10;
                printToCli('⚡ CHAOS: Latency spiked on ' + db.label, 'warning');
            } else {
                printToCli('No databases to stress!', 'error');
            }
        } else if (type === 'kill') {
            const svcs = nodes.filter(n => n.type === 'microservice');
            if (svcs.length > 0) {
                const svc = svcs[Math.floor(Math.random() * svcs.length)];
                svc.state = 'FAILING';
                svc.breakerState = 'OPEN';
                svc.droppedRequests = 100; // Insta kill
                printToCli('💀 CHAOS: Killed ' + svc.label, 'error');
            } else {
                 printToCli('No microservices to kill!', 'error');
            }
        } else if (type === 'leak') {
            const svcs = nodes.filter(n => n.type === 'microservice');
            if (svcs.length > 0) {
                const svc = svcs[Math.floor(Math.random() * svcs.length)];
                svc.memoryLeak = true;
                svc.memLeakFactor = 1.0;
                printToCli('⚠️ CHAOS: Memory leak injected into ' + svc.label, 'warning');
            } else { printToCli('No microservices to leak!', 'error'); }
        } else if (type === 'partition') {
            const trafficEdges = edges.filter(e => {
                const source = getNodeById(e.source);
                return source && (source.type === 'gateway' || source.type === 'microservice' || source.type === 'balancer');
            });
            if (trafficEdges.length > 0) {
                const edgeToKill = trafficEdges[Math.floor(Math.random() * trafficEdges.length)];
                deleteEdge(edgeToKill);
                printToCli('✂️ CHAOS: Network Partition! Connection severed.', 'error');
            } else { printToCli('No active connections to partition!', 'error'); }
        }
    };
