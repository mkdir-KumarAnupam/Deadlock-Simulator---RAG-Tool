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

      if (window.Auth && Auth.savePreference) {
          Auth.savePreference('theme', themeName);
      } else {
          localStorage.setItem('theme', themeName);
      }
    }

    function updateEdgeThickness(value) {
      const thickness = parseInt(value);
      if (thickness >= 1 && thickness <= 10) {
        systemConfig.edgeThickness = thickness;
        draw();
        printToCli(`Edge thickness set to: ${thickness}px`, 'success');
        if (window.Auth && Auth.savePreference) {
            Auth.savePreference('edgeThickness', thickness);
        } else {
            localStorage.setItem('edgeThickness', thickness);
        }
      } else {
        printToCli('Edge thickness must be between 1-10', 'error');
        document.getElementById('config-edge-thickness').value = systemConfig.edgeThickness;
      }
    }

    function updateStarvationThreshold(value) {
      const threshold = parseInt(value);
      if (threshold >= 10 && threshold <= 1000) {
        starvationThreshold = threshold;
        printToCli(`Starvation threshold set to: ${threshold} cycles`, 'success');
        if (window.Auth && Auth.savePreference) {
            Auth.savePreference('starvationThreshold', threshold);
        } else {
            localStorage.setItem('starvationThreshold', threshold);
        }
      } else {
        printToCli('Threshold must be between 10-1000', 'error');
        document.getElementById('config-starvation').value = starvationThreshold;
      }
    }

    function updateSimSpeed(value) {
        const speed = parseInt(value);
        if (speed >= 50 && speed <= 2000) {
            simSpeed = speed;
            systemConfig.simSpeed = speed;

            // Restart interval if running
            if (isRunning) {
                clearInterval(simInterval);
                simInterval = setInterval(scheduler, simSpeed);
            }

            printToCli(`Simulation speed set to: ${speed}ms`, 'success');

            if (window.Auth && Auth.savePreference) {
                Auth.savePreference('simSpeed', speed);
            } else {
                localStorage.setItem('simSpeed', speed);
            }
        } else {
            printToCli('Speed must be between 50-2000ms', 'error');
            document.getElementById('config-sim-speed').value = simSpeed;
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
      if (window.Auth && Auth.savePreference) {
          Auth.savePreference('uiScale', scale);
      } else {
          localStorage.setItem('uiScale', scale);
      }
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
        // Let's stick to size scaling first as per request.
      }
    }
    function updateAutosaveFrequency(value) {
      const freq = parseInt(value);
      if (window.startAutosave) {
        startAutosave(freq);
      }
      printToCli(`Autosave frequency set to: ${freq === 0 ? 'Off' : (freq / 1000) + 's'}`, 'success');
      if (window.Auth && Auth.savePreference) Auth.savePreference('autosaveFrequency', freq);
      else localStorage.setItem('autosaveFrequency', freq);
    }
    // Expose for other modules
    window.updateBackgroundScale = updateBackgroundScale;
    window.updateAutosaveFrequency = updateAutosaveFrequency;

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

    function toggleToolsLayout(useDropdown) {
      const dropdownContainer = document.getElementById('tools-dropdown-container');
      const buttonsContainer = document.getElementById('tools-buttons-container');
      const checkbox = document.getElementById('config-use-tools-dropdown');

      if (useDropdown) {
        dropdownContainer.classList.remove('hidden');
        buttonsContainer.classList.add('hidden');
      } else {
        dropdownContainer.classList.add('hidden');
        buttonsContainer.classList.remove('hidden');
      }

      if (checkbox) checkbox.checked = useDropdown;

      printToCli(`Tools layout changed to: ${useDropdown ? 'Dropdown' : 'Buttons'}`, 'info');

      if (window.Auth && Auth.savePreference) {
        Auth.savePreference('useToolsDropdown', useDropdown);
      } else {
        localStorage.setItem('useToolsDropdown', useDropdown);
      }
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
    window.updateStarvationThreshold = updateStarvationThreshold;
    window.fitToScreen = fitToScreen;
    window.resetZoom = resetZoom;
    window.toggleToolsLayout = toggleToolsLayout;
