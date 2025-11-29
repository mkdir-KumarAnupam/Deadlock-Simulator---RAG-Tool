    function setBackgroundPattern(pattern) {
      // Remove all pattern classes
      document.body.classList.remove('bg-pattern-none', 'bg-pattern-dots', 'bg-pattern-grid');
      // Add selected pattern class
      document.body.classList.add(`bg-pattern-${pattern}`);
      // Save preference
      if (window.Auth && Auth.savePreference) {
        Auth.savePreference('backgroundPattern', pattern);
      } else {
        localStorage.setItem('backgroundPattern', pattern);
      }
    }

    function setPatternOpacity(value) {
      const opacity = value / 100;
      document.documentElement.style.setProperty('--pattern-opacity', opacity);
      document.getElementById('pattern-opacity-value').textContent = value + '%';
      document.getElementById('pattern-opacity-value').textContent = value + '%';

      if (window.Auth && Auth.savePreference) {
        Auth.savePreference('patternOpacity', value);
      } else {
        localStorage.setItem('patternOpacity', value);
      }
    }
    // --- Settings Functions ---
    function setToolbarPosition(position) {
      const sidebarTools = document.getElementById('sidebar-tools');
      const topbarTools = document.getElementById('topbar-tools');

      if (position === 'sidebar') {
        sidebarTools.classList.remove('hidden');
        topbarTools.classList.add('hidden');
      } else {
        sidebarTools.classList.add('hidden');
        topbarTools.classList.remove('hidden');
      }

      document.getElementById('settings-menu').classList.remove('show');
      printToCli(`Toolbar moved to: ${position}`, 'info');
    }

    function changeTheme(themeName) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      if (themeName !== 'default') {
        document.body.classList.add(`theme-${themeName}`);
      }
      document.getElementById('settings-menu').classList.remove('show');
      printToCli(`Theme changed to: ${themeName}`, 'info');
      draw();
      printToCli(`Theme changed to: ${themeName}`, 'info');
      draw();
      if (window.Auth && Auth.savePreference) Auth.savePreference('theme', themeName);
    }

    // --- System Configuration Functions ---
    function updateMaxMemory(value) {
      const mem = parseInt(value);
      if (mem >= 256 && mem <= 8192) {
        systemConfig.maxMemory = mem;
        config.totalMemory = mem;
        updateSystemStats();
        printToCli(`Max memory set to: ${mem} MB`, 'success');
      } else {
        printToCli('Memory must be between 256-8192 MB', 'error');
        document.getElementById('config-max-memory').value = systemConfig.maxMemory;
      }
    }

    function updateCPUCores(value) {
      const cores = parseInt(value);
      if (cores >= 1 && cores <= 8) {
        systemConfig.cpuCores = cores;
        printToCli(`CPU cores set to: ${cores}`, 'success');
        updateStats();
      } else {
        printToCli('CPU cores must be between 1-8', 'error');
        document.getElementById('config-cpu-cores').value = systemConfig.cpuCores;
      }
    }

    function updateContextSwitchTime(value) {
      const time = parseInt(value);
      if (time >= 1 && time <= 100) {
        systemConfig.contextSwitchTime = time;
        printToCli(`Context switch time set to: ${time} ms`, 'success');
      } else {
        printToCli('Context switch time must be between 1-100 ms', 'error');
        document.getElementById('config-context-switch').value = systemConfig.contextSwitchTime;
      }
    }

    function updateSimSpeed(value) {
      const speed = parseInt(value);
      if (speed >= 50 && speed <= 2000) {
        systemConfig.simSpeed = speed;
        simSpeed = speed;
        if (isRunning) {
          clearInterval(simInterval);
          simInterval = setInterval(scheduler, simSpeed);
        }
        printToCli(`Simulation speed set to: ${speed} ms`, 'success');
      } else {
        printToCli('Sim speed must be between 50-2000 ms', 'error');
        document.getElementById('config-sim-speed').value = systemConfig.simSpeed;
      }
    }

    function updateEdgeLabelSize(value) {
      const size = parseInt(value);
      if (size >= 0 && size <= 20) {
        systemConfig.edgeLabelSize = size;
        draw();
        printToCli(`Edge label size set to: ${size}px`, 'success');
        if (window.Auth && Auth.savePreference) Auth.savePreference('edgeLabelSize', size);
      } else {
        printToCli('Edge label size must be between 0-20', 'error');
        document.getElementById('config-edge-label-size').value = systemConfig.edgeLabelSize;
      }
    }

    function toggleEdgeLabels(show) {
      systemConfig.showEdgeLabels = show;
      draw();
      printToCli(`Edge labels ${show ? 'shown' : 'hidden'}`, 'info');
      if (window.Auth && Auth.savePreference) Auth.savePreference('showEdgeLabels', show);
    }

    function updateEdgeThickness(value) {
      const thickness = parseInt(value);
      if (thickness >= 1 && thickness <= 10) {
        systemConfig.edgeThickness = thickness;
        draw();
        printToCli(`Edge thickness set to: ${thickness}px`, 'success');
        if (window.Auth && Auth.savePreference) Auth.savePreference('edgeThickness', thickness);
      } else {
        printToCli('Edge thickness must be between 1-10', 'error');
        document.getElementById('config-edge-thickness').value = systemConfig.edgeThickness;
      }
    }

    function updateUIScale(value) {
      const scale = parseFloat(value);
      systemConfig.uiScale = scale;

      // Update the display value
      document.getElementById('ui-scale-value').textContent = Math.round(scale * 100) + '%';

      // Update toolbar elements
      const undoRedoBox = document.getElementById('undo-redo-box');
      const toolsBox = document.getElementById('tools-box');
      const batchOps = document.getElementById('batch-ops');

      // Calculate sizes based on scale
      const undoRedoWidth = Math.round(23 * scale);
      const undoRedoHeight = Math.round(35 * scale);
      const toolButtonSize = Math.round(40 * scale);
      const batchButtonWidth = Math.round(40 * scale);
      const batchButtonHeight = Math.round(32 * scale);
      const iconSizeTool = Math.round(14 * scale);
      const iconSizeUndo = Math.round(11 * scale);
      const iconSizeBatch = Math.round(12 * scale);

      // Update undo/redo buttons
      const undoBtn = document.getElementById('btn-undo');
      const redoBtn = document.getElementById('btn-redo');
      undoBtn.style.width = undoRedoWidth + 'px';
      undoBtn.style.height = undoRedoHeight + 'px';
      redoBtn.style.width = undoRedoWidth + 'px';
      redoBtn.style.height = undoRedoHeight + 'px';
      undoBtn.querySelector('i').style.fontSize = iconSizeUndo + 'px';
      redoBtn.querySelector('i').style.fontSize = iconSizeUndo + 'px';

      // Update tool buttons
      const toolButtons = ['btn-process', 'btn-resource', 'btn-link', 'btn-delete', 'btn-select'];
      toolButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.style.width = toolButtonSize + 'px';
          btn.style.height = toolButtonSize + 'px';
          const icon = btn.querySelector('i');
          if (icon) icon.style.fontSize = iconSizeTool + 'px';
        }
      });

      // Update batch buttons
      const batchButtons = batchOps.querySelectorAll('button');
      batchButtons.forEach(btn => {
        btn.style.width = batchButtonWidth + 'px';
        btn.style.height = batchButtonHeight + 'px';
        const icon = btn.querySelector('i');
        if (icon) icon.style.fontSize = iconSizeBatch + 'px';
      });

      printToCli(`UI scale set to: ${Math.round(scale * 100)}%`, 'success');
      if (window.Auth && Auth.savePreference) Auth.savePreference('uiScale', scale);
    }

    // --- Zoom & Pan Functions ---
    function updateBackgroundScale(currentScale) {
      const baseSize = 20;
      const newSize = baseSize * currentScale;
      const bgElement = document.querySelector('.flex-grow.flex');
      if (bgElement) {
        bgElement.style.backgroundSize = `${newSize}px ${newSize}px`;
        // Also scale the position to match the pan offset so dots stay "pinned" to the canvas space
        // Note: The background-position is relative to the container, while offsetX/Y are canvas transforms.
        // To make it look like the background is part of the canvas, we need to sync the phase.
        // However, simple scaling of size is often enough for the visual effect requested.
        // Let's stick to size scaling first as per request.
      }
    }
    // Expose for other modules
    window.updateBackgroundScale = updateBackgroundScale;

    function resetZoom() {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      draw();
      updateBackgroundScale(1);
      printToCli('Zoom reset to 100%', 'info');
    }

    function fitToScreen() {
      if (nodes.length === 0) return;

      // Find bounds
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        minX = Math.min(minX, n.x - config.nodeRadius);
        maxX = Math.max(maxX, n.x + config.nodeRadius);
        minY = Math.min(minY, n.y - config.nodeRadius);
        maxY = Math.max(maxY, n.y + config.nodeRadius);
      });

      const padding = 50;
      const graphWidth = maxX - minX + padding * 2;
      const graphHeight = maxY - minY + padding * 2;

      const scaleX = canvas.width / graphWidth;
      const scaleY = canvas.height / graphHeight;
      scale = Math.min(scaleX, scaleY, 2); // Max 2x zoom

      // Center the graph
      const graphCenterX = (minX + maxX) / 2;
      const graphCenterY = (minY + maxY) / 2;
      offsetX = canvas.width / 2 - graphCenterX * scale;
      offsetY = canvas.height / 2 - graphCenterY * scale;

      draw();
      updateBackgroundScale(scale);
      printToCli('Fitted to screen', 'info');
    }

    // Explicitly expose functions to window for Auth module
    window.setBackgroundPattern = setBackgroundPattern;
    window.setPatternOpacity = setPatternOpacity;
    window.setToolbarPosition = setToolbarPosition;
    window.changeTheme = changeTheme;
    window.updateMaxMemory = updateMaxMemory;
    window.updateCPUCores = updateCPUCores;
    window.updateContextSwitchTime = updateContextSwitchTime;
    window.updateSimSpeed = updateSimSpeed;
    window.updateEdgeLabelSize = updateEdgeLabelSize;
    window.toggleEdgeLabels = toggleEdgeLabels;
    window.updateEdgeThickness = updateEdgeThickness;
    window.updateUIScale = updateUIScale;
    window.fitToScreen = fitToScreen;
    window.resetZoom = resetZoom;
