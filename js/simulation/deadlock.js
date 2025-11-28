    async function detectDeadlock(silent = false) {
      deadlockSet.clear();
      const adj = {};
      nodes.forEach(n => adj[n.id] = []);
      edges.forEach(e => adj[e.source].push(e.target));

      const visited = new Set();
      const recStack = new Set();
      let cycleFound = [];

      function dfs(u, path) {
        visited.add(u);
        recStack.add(u);
        path.push(u);
        for (let v of adj[u]) {
          if (!visited.has(v)) { if (dfs(v, path)) return true; }
          else if (recStack.has(v)) {
            let idx = path.indexOf(v);
            cycleFound = path.slice(idx);
            for (let i = idx; i < path.length; i++) deadlockSet.add(path[i]);
            return true;
          }
        }
        recStack.delete(u);
        path.pop();
        return false;
      }

      nodes.forEach(n => { if (!visited.has(n.id)) dfs(n.id, []); });

      const hasDeadlock = deadlockSet.size > 0;

      if (hasDeadlock) {
        if (!silent || !isRunning) {
          printToCli("⚠ Deadlock Found! Analyzing with AI...", 'error');
          canvas.classList.add('shake-effect');
          setTimeout(() => canvas.classList.remove('shake-effect'), 500);
        }
        if (isRunning && !silent) toggleSimulation();
      } else {
        if (!silent) printToCli("✓ System Safe. Running AI analysis...", 'success');
      }

      draw();

      // Trigger AI Analysis
      if (!silent) {
        openAIPanel();
        document.getElementById('ai-content').innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p class="text-gray-600">Analyzing with Gemini AI...</p>
                    </div>
                `;

        const cycleNames = cycleFound.map(id => {
          const node = nodes.find(n => n.id === id);
          return node ? node.label : id;
        });

        const graphData = {
          nodes: nodes.map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            state: n.state,
            instances: n.instances,
            allocated: n.allocated
          })),
          edges: edges.map(e => ({
            source: e.source,
            target: e.target,
            type: e.type
          }))
        };

        const deadlockInfo = {
          hasDeadlock,
          cycle: cycleNames
        };

        const result = await analyzeWithGemini(graphData, deadlockInfo);
        displayAIAnalysis(result, deadlockInfo);
      }

      return deadlockSet;
    }
