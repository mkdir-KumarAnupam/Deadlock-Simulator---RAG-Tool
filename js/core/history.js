
    // --- Undo/Redo Functions ---
    function saveState() {
      const state = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        nextId: nextId
      };

      // Remove future history if we're not at the end
      if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
      }

      history.push(state);

      // Limit history size
      if (history.length > MAX_HISTORY) {
        history.shift();
      } else {
        historyIndex++;
      }

      updateUndoRedoButtons();
    }

    function undo() {
      if (historyIndex > 0) {
        historyIndex--;
        restoreState(history[historyIndex]);
        printToCli('Undo', 'info');
      }
    }

    function redo() {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreState(history[historyIndex]);
        printToCli('Redo', 'info');
      }
    }

    function restoreState(state) {
      nodes = JSON.parse(JSON.stringify(state.nodes));
      edges = JSON.parse(JSON.stringify(state.edges));
      nextId = state.nextId;
      selectedNode = null;
      currentRunningNodeId = null;
      updateSystemStats();
      updateStats();
      draw();
      updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
      const undoBtn = document.getElementById('btn-undo');
      const redoBtn = document.getElementById('btn-redo');

      if (undoBtn) {
        undoBtn.disabled = historyIndex <= 0;
        undoBtn.style.opacity = historyIndex <= 0 ? '0.5' : '1';
        undoBtn.style.cursor = historyIndex <= 0 ? 'not-allowed' : 'pointer';
      }

      if (redoBtn) {
        redoBtn.disabled = historyIndex >= history.length - 1;
        redoBtn.style.opacity = historyIndex >= history.length - 1 ? '0.5' : '1';
        redoBtn.style.cursor = historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer';
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
