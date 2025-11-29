    // --- Copy/Paste/Duplicate Functions ---
    function copyNodes() {
      const nodesToCopy = selectedNodes.size > 0 ? Array.from(selectedNodes) : (selectedNode ? [selectedNode.id] : []);

      if (nodesToCopy.length === 0) {
        printToCli('No nodes selected to copy', 'error');
        return;
      }

      const copiedNodes = [];
      const copiedEdges = [];

      // Copy nodes
      nodesToCopy.forEach(nodeId => {
        const node = getNodeById(nodeId);
        if (node) {
          copiedNodes.push({
            id: node.id,
            type: node.type,
            label: node.label,
            x: node.x,
            y: node.y,
            state: node.state,
            burstTime: node.burstTime,
            maxBurst: node.maxBurst,
            originalBurst: node.originalBurst,
            instances: node.instances,
            customColor: node.customColor,
            priority: node.priority || 1
          });
        }
      });

      // Copy edges between selected nodes
      edges.forEach(edge => {
        if (nodesToCopy.includes(edge.source) && nodesToCopy.includes(edge.target)) {
          copiedEdges.push({
            source: edge.source,
            target: edge.target,
            label: edge.label,
            isAllocation: edge.isAllocation
          });
        }
      });

      clipboard = { nodes: copiedNodes, edges: copiedEdges };
      printToCli(`Copied ${copiedNodes.length} node(s) and ${copiedEdges.length} edge(s)`, 'success');
    }

    function pasteNodes(atMousePosition = false, mouseX = 0, mouseY = 0) {
      if (!clipboard || clipboard.nodes.length === 0) {
        printToCli('Clipboard is empty', 'error');
        return;
      }

      saveState();

      const idMapping = {}; // Map old IDs to new IDs
      const newNodeIds = [];

      // Calculate offset
      let offsetXPaste = pasteOffset;
      let offsetYPaste = pasteOffset;

      if (atMousePosition && lastPastePosition) {
        // Calculate center of copied nodes
        const centerX = clipboard.nodes.reduce((sum, n) => sum + n.x, 0) / clipboard.nodes.length;
        const centerY = clipboard.nodes.reduce((sum, n) => sum + n.y, 0) / clipboard.nodes.length;

        offsetXPaste = mouseX - centerX;
        offsetYPaste = mouseY - centerY;
        lastPastePosition = { x: mouseX, y: mouseY };
      } else {
        lastPastePosition = null;
      }

      // Paste nodes
      clipboard.nodes.forEach(nodeToCopy => {
        const newNode = {
          id: nextId++,
          type: nodeToCopy.type,
          label: nodeToCopy.label + "'",
          x: nodeToCopy.x + offsetXPaste,
          y: nodeToCopy.y + offsetYPaste,
          state: nodeToCopy.type === 'process' ? 'READY' : undefined,
          burstTime: nodeToCopy.burstTime || 100,
          maxBurst: nodeToCopy.maxBurst || 100,
          originalBurst: nodeToCopy.originalBurst || 100,
          instances: nodeToCopy.instances || 1,
          customColor: nodeToCopy.customColor,
          priority: nodeToCopy.priority || 1,
          rotation: (Math.random() - 0.5) * 0.25,
          pinColor: '#333'
        };

        nodes.push(newNode);
        idMapping[nodeToCopy.id] = newNode.id;
        newNodeIds.push(newNode.id);

        // Add creation animation
        nodeCreationAnimations.push({
          x: newNode.x,
          y: newNode.y,
          startTime: Date.now(),
          duration: 400
        });
      });

      // Paste edges
      clipboard.edges.forEach(edgeToCopy => {
        if (idMapping[edgeToCopy.source] && idMapping[edgeToCopy.target]) {
          edges.push({
            source: idMapping[edgeToCopy.source],
            target: idMapping[edgeToCopy.target],
            label: edgeToCopy.label,
            isAllocation: edgeToCopy.isAllocation
          });
        }
      });

      // Select pasted nodes
      clearSelection();
      newNodeIds.forEach(id => selectedNodes.add(id));
      if (newNodeIds.length === 1) {
        selectedNode = getNodeById(newNodeIds[0]);
      }

      updateSystemStats();
      draw();
      printToCli(`Pasted ${clipboard.nodes.length} node(s)`, 'success');

      if (window.Session) Session.broadcast('graph_update', { nodes, edges });
    }

    function duplicateNodes() {
      if (selectedNodes.size === 0 && !selectedNode) {
        printToCli('No nodes selected to duplicate', 'error');
        return;
      }

      copyNodes();
      pasteNodes(false);
    }

    function addNode(type, x, y) {
      const prefix = type === 'process' ? 'P' : 'R';
      const count = nodes.filter(n => n.type === type).length + 1;
      const newNode = {
        id: nextId++,
        type: type,
        label: `${prefix}${count}`,
        x: x, y: y,
        burstTime: type === 'process' ? 100 : 0,
        maxBurst: 100,
        originalBurst: type === 'process' ? 100 : 0,
        memory: type === 'process' ? Math.floor(Math.random() * 224) + 32 : 0,
        priority: type === 'process' ? 1 : 0,
        state: type === 'process' ? 'READY' : 'RESOURCE',
        arrivalTime: 0, // Will be set when simulation starts
        // Resource capacity (number of instances)
        capacity: type === 'resource' ? 1 : 0,
        allocated: type === 'resource' ? 0 : 0, // How many instances currently allocated
        // New Visual Props
        rotation: (Math.random() - 0.5) * 0.25, // +/- ~7 degrees
        pinColor: ['#ff4d4d', '#2d2d2d', '#4a90e2', '#silver'][Math.floor(Math.random() * 4)]
      };
      nodes.push(newNode);

      // Mark process as created - actual arrival time will be set when simulation starts
      if (type === 'process') {
        processMetrics[newNode.id] = {
          label: newNode.label,
          arrivalTime: null, // Will be set when simulation starts
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
      // Trigger creation animation
      nodeCreationAnimations.push({
        x: x,
        y: y,
        startTime: Date.now(),
        duration: 400
      });
      updateSystemStats();
      draw();
      saveState();

      if (window.Session) Session.broadcast('graph_update', { nodes, edges });

      return newNode;
    }

    function getNodeById(id) { return nodes.find(n => n.id === id); }

    function deleteNode(node) {
      edges = edges.filter(e => e.source !== node.id && e.target !== node.id);
      nodes = nodes.filter(n => n.id !== node.id);
      if (currentRunningNodeId === node.id) currentRunningNodeId = null;
      selectedNode = null;
      closeProps();
      updateSystemStats();
      draw();
      saveState();

      if (window.Session) Session.broadcast('graph_update', { nodes, edges });
    }

    function addEdge(source, target) {
      if (source.type === target.type) {
        printToCli(`Error: Cannot link ${source.type} to ${target.type}.`, 'error');
        return;
      }
      if (edges.some(e => e.source === source.id && e.target === target.id)) return;

      // Check resource capacity
      if (source.type === 'resource') {
        const allocated = edges.filter(e => e.source === source.id).length;
        if (allocated >= source.capacity) {
          printToCli(`Resource ${source.label} at full capacity (${source.capacity})!`, 'error');
          return;
        }
      }

      edges.push({ source: source.id, target: target.id, label: '1' });
      // Pulse both connected nodes
      pulseAnimations.push(
        {
          nodeId: source.id,
          startTime: Date.now(),
          duration: 500
        },
        {
          nodeId: target.id,
          startTime: Date.now(),
          duration: 500
        }
      );
      updateProcessStates();
      draw();
      saveState();

      if (window.Session) Session.broadcast('graph_update', { nodes, edges });
    }
    function resetGraph() {
      nodes = []; edges = []; nextId = 1;
      deadlockSet.clear();
      ganttData = [];
      lastGanttEntry = null;
      currentRunningNodeId = null;
      quantumRemaining = timeQuantum;
      processStartTimes = {};
      processMetrics = {};
      contextSwitchCount = 0;
      simulationTime = 0;
      simulationStartTime = 0;
      history = [];
      historyIndex = -1;
      simulationHistory = []; // Clear step history

      // Hide simulation controls
      const simControls = document.getElementById('sim-controls');
      if (simControls) {
        simControls.style.opacity = '0';
        simControls.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
          simControls.style.display = 'none';
        }, 300);
      }

      document.getElementById('gantt-chart').innerHTML = '<div class="text-gray-400 text-xs italic">Start Simulation to see data...</div>';
      const metricsDisplay = document.getElementById('metrics-display');
      if (metricsDisplay) {
        metricsDisplay.innerHTML = '<div style="color: #666; font-style: italic; padding: 16px; border: 2px dashed #ccc; text-align: center;">No completed processes yet. Start simulation to see metrics.</div>';
      }
      if (isRunning) toggleSimulation();
      updateSystemStats();
      updateStats();
      draw();
      printToCli("System Reset.");
      saveState();
      updateUndoRedoButtons();

      if (window.Session) Session.broadcast('graph_update', { nodes, edges });
    }

    function deleteEdge(edge) {
      if (!edge) return;

      const index = edges.indexOf(edge);
      if (index > -1) {
        saveState();
        edges.splice(index, 1);
        printToCli(`Deleted edge from ${getNodeById(edge.source).label} to ${getNodeById(edge.target).label}`, 'success');

        // Check for deadlock/starvation resolution
        if (deadlockSet.size > 0) detectDeadlock(false);
        if (starvingSet.size > 0) detectStarvation();

        draw();

        if (window.Session) Session.broadcast('graph_update', { nodes, edges });
      }
    }
