    function resizeCanvas() {
      // High DPI Fix
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Set display size (css pixels)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Normalize coordinate system to use css pixels
      ctx.scale(dpr, dpr);

      draw();
    }
    window.addEventListener('resize', resizeCanvas);

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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        } else if (e.key === 'c') {
          e.preventDefault();
          copyNodes();
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteNodes(false);
        } else if (e.key === 'd') {
          e.preventDefault();
          duplicateNodes();
        } else if (e.key === 'a') {
          e.preventDefault();
          // Select all nodes
          clearSelection();
          nodes.forEach(n => selectedNodes.add(n.id));
          printToCli(`Selected all ${nodes.length} nodes`, 'info');
          draw();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedNodes.size > 0) {
          batchDelete();
        } else if (selectedNode) {
          deleteNode(selectedNode.id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        selectedNode = null;
        dragLinkStart = null;
        dragLinkEnd = null;
        printToCli('Selection cleared', 'info');
        draw();
      }
    });


    resizeCanvas();
    loadClearWarningPreference(); // Load user preference for clear warning

    // Load state from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('s') || urlParams.get('state');
    if (shareParam) {
      try {
        const jsonStr = decodeURIComponent(escape(atob(shareParam)));
        const data = JSON.parse(jsonStr);
        nodes = data.nodes.map(n => ({ ...n, rotation: (Math.random() - 0.5) * 0.25, pinColor: '#333' }));
        edges = data.edges;
        nextId = data.nextId || (nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1);
        updateSystemStats();
        draw();
        printToCli('Loaded shared state from URL', 'success');
      } catch (err) {
        console.error('Load error:', err);
        printToCli('Error loading shared state', 'error');
      }
    }

    // Initialize first state for undo/redo
    saveState();
    updateUndoRedoButtons();

    // --- Challenge Mode Logic ---
    let currentChallenge = null;
    let currentDifficulty = null;


    // Continuous animation loop for smooth flow
    function animate() {
      if (isRunning) {
        draw();
        // Update stats if pane is open
        const statsPane = document.getElementById('stats-pane');
        if (statsPane && statsPane.classList.contains('open')) {
          updateStats();
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
