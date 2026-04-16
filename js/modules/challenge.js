    function openChallengeModal() {
      const modal = document.getElementById('challenge-modal');
      const content = document.getElementById('challenge-modal-content');

      modal.style.display = 'flex';

      // Reset animation
      content.style.animation = 'none';
      void content.offsetHeight; // Force reflow
      content.style.animation = 'slideFromTop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }

    function closeChallengeModal() {
      const modal = document.getElementById('challenge-modal');
      const content = document.getElementById('challenge-modal-content');

      // Animate out
      content.style.animation = 'slideToTop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

      // Hide modal after animation completes
      setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('challenge-loading').style.display = 'none';
        // Reset animation for next time
        content.style.animation = '';
      }, 400);
    }

    function _generateProceduralChallenge(difficulty) {
      function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }

      const pCountBase = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5;
      const rCountBase = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5;
      
      const numProcesses = pCountBase + Math.floor(Math.random() * (difficulty === 'hard' ? 3 : 2));
      const numResources = rCountBase + Math.floor(Math.random() * (difficulty === 'hard' ? 3 : 2));
      
      const nodes = [];
      const edges = [];
      
      let idCounter = 1;
      const pIds = [];
      const rIds = [];
      for (let i = 0; i < numProcesses; i++) pIds.push(idCounter++);
      for (let i = 0; i < numResources; i++) rIds.push(idCounter++);

      const totalNodes = numProcesses + numResources;
      const radius = difficulty === 'easy' ? 120 : (difficulty === 'medium' ? 160 : 220);
      
      // Shuffle subsets for random placement
      const allIds = shuffleArray([...pIds, ...rIds]);

      // Distribute nodes randomly around a circle
      allIds.forEach((id, i) => {
         const angle = ((i) / totalNodes) * 2 * Math.PI - Math.PI / 2;
         const isProc = pIds.includes(id);
         const lbl = isProc ? "P" + (pIds.indexOf(id)+1) : "R" + (rIds.indexOf(id)+1);
         nodes.push({ id, type: isProc ? "process" : "resource", label: lbl, x: Math.round(Math.cos(angle)*radius), y: Math.round(Math.sin(angle)*radius) });
      });
      
      const maxCycle = Math.min(numProcesses, numResources);
      let cycleLength = difficulty === 'easy' ? 2 : difficulty === 'medium' ? (Math.random() > 0.5 ? 2 : 3) : 3 + Math.floor(Math.random() * 3);
      cycleLength = Math.min(cycleLength, maxCycle);
      
      // Pick random cycle participants
      const pCycle = shuffleArray(pIds).slice(0, cycleLength);
      const rCycle = shuffleArray(rIds).slice(0, cycleLength);

      for (let i = 0; i < cycleLength; i++) {
        edges.push({ source: pCycle[i], target: rCycle[i] }); // P requests R
        edges.push({ source: rCycle[i], target: pCycle[(i + 1) % cycleLength] }); // R allocated to next P
      }

      // Connect any unused nodes to the main graph so they aren't awkwardly floating
      const usedNodes = new Set([...pCycle, ...rCycle]);
      const unusedNodes = [...pIds, ...rIds].filter(id => !usedNodes.has(id));
      
      unusedNodes.forEach(nodeId => {
         const isProc = pIds.includes(nodeId);
         const targetCycleNode = isProc ? rCycle[Math.floor(Math.random() * rCycle.length)] : pCycle[Math.floor(Math.random() * pCycle.length)];
         const isRequest = Math.random() > 0.5;
         
         if (isProc && isRequest) edges.push({ source: nodeId, target: targetCycleNode });
         else if (isProc && !isRequest) edges.push({ source: targetCycleNode, target: nodeId });
         else if (!isProc && isRequest) edges.push({ source: targetCycleNode, target: nodeId });
         else edges.push({ source: nodeId, target: targetCycleNode });
      });

      // Inject extra random decoy edges
      const extraEdges = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 6;
      for (let i = 0; i < extraEdges; i++) {
         const p = pIds[Math.floor(Math.random() * pIds.length)];
         const r = rIds[Math.floor(Math.random() * rIds.length)];
         const isRequest = Math.random() > 0.5;
         const source = isRequest ? p : r;
         const target = isRequest ? r : p;
         
         if (!edges.some(e => e.source === source && e.target === target) && 
             !edges.some(e => e.source === target && e.target === source)) { 
             edges.push({ source, target });
         }
      }

      const titles = ["Tangled Threads", "Resource Gridlock", "Circular Wait", "The Missing Release", "Lock Conflict", "Dependency Hell", "Deadlock Roulette", "Unsafe State Shift"];
      const title = titles[Math.floor(Math.random() * titles.length)];

      return {
        title: title + (difficulty !== 'easy' ? ' (Advanced)' : ''),
        description: "Analyze the graph and resolve the deadlock cycle by removing or rerouting an unsafe resource request.",
        initialState: { nodes, edges },
        successCriteria: "Break the circular wait."
      };
    }

    async function startChallenge(difficulty) {
      const provider = localStorage.getItem('narratorProvider') || 'gemini';
      const apiKey = localStorage.getItem('geminiApiKey');
      if (provider !== 'lmstudio' && !apiKey) {
        if (window.Session) Session.showNotification('Please configure Gemini API key in Settings first!', 'error');
        else alert('Please configure Gemini API key in Settings first!');
        return;
      }

      const loading = document.getElementById('challenge-loading');
      loading.style.display = 'block';

      // 1. Mathematically generate a perfect graph
      const baseChallenge = _generateProceduralChallenge(difficulty);

      // 2. Fetch the natural language story from AI
      const prompt = `You are a creative OS Professor designing a deadlock puzzle for a student.
      The scenario involves an operating system with ${baseChallenge.initialState.nodes.length} processes/resources and ${baseChallenge.initialState.edges.length} allocations.
      There are ${baseChallenge.initialState.nodes.filter(n => n.type === 'process').length} processes and ${baseChallenge.initialState.nodes.filter(n => n.type === 'resource').length} resources.
      The student must ${difficulty === 'easy' ? 'fix a simple deadlock' : difficulty === 'medium' ? 'prevent an imminent deadlock' : 'resolve a complex circular wait'}.
      
      CRITICAL: Give it a fun, immersive theme (like Database Locks, Server Threads, Spaceship AI cores, etc.) relating to this specific network of processes and resources.
      
      Respond EXACTLY with 2 lines of plain text and nothing else:
      Line 1: A creative fun title (MAX 5 WORDS)
      Line 2: 2-3 short sentences describing the theme and instructing the student to break the circular wait.
      
      Rules:
      - Do NOT include labels like "TITLE:" or "DESCRIPTION:".
      - Do NOT include any extra notes or parentheses. Just Line 1 and Line 2.`;

      try {
        let text = await window.fetchAI(prompt, false, null, 250, 0.9, 80);
        
        // Clean up markdown and literal \n from model quirks
        let cleanText = text.replace(/\*/g, '').replace(/\\n/g, '\n');
        
        // Split into lines, removing empty ones
        let lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // Sometimes the AI puts everything on one line anyway, split by first period if needed
        if (lines.length === 1 && lines[0].includes('.')) {
           const periodIdx = lines[0].indexOf('.');
           const titlePart = lines[0].substring(0, periodIdx);
           const descPart = lines[0].substring(periodIdx + 1);
           lines = [titlePart, descPart].filter(l => l.trim().length > 0);
        }

        if (lines.length > 0) {
          // Clean up AI trying to be "helpful" by prefixing
          let t = lines[0].replace(/^(title|line 1)[\s:-]+/i, '').replace(/\(.*?\)/g, '').trim();
          const words = t.split(/\s+/);
          if (words.length > 5) {
             t = words.slice(0, 5).join(' '); // Hard cap at 5 words
          }
          baseChallenge.title = t;
        }
        if (lines.length > 1) {
          let desc = lines.slice(1).join(' ');
          desc = desc.replace(/^(description|line 2)[\s:-]+/i, '').trim();
          if (desc.length > 0) {
            baseChallenge.description = desc;
          }
        }
      } catch (error) {
        console.warn('AI Story Generation Failed. Falling back to procedural defaults.', error);
        // Fallback uses the titles/descriptions from _generateProceduralChallenge
      } finally {
        loading.style.display = 'none';
      }

      // 3. Load the hybrid challenge
      loadChallenge(baseChallenge, difficulty);
    }

    function minimizeChallenge() {
      document.getElementById('challenge-active-panel').classList.add('minimized');
      document.getElementById('challenge-restore-btn').classList.add('visible');
    }

    function restoreChallenge() {
      document.getElementById('challenge-active-panel').classList.remove('minimized');
      document.getElementById('challenge-restore-btn').classList.remove('visible');
    }

    function loadChallenge(challenge, difficulty) {
      currentChallenge = challenge;
      closeChallengeModal();

      // Hide Challenge Mode menu item
      const challengeItem = document.getElementById('challenge-mode-item');
      if (challengeItem) challengeItem.style.display = 'none';

      // Reset minimized state
      restoreChallenge();

      // Reset board
      nodes = [];
      edges = [];
      nextId = 1;

      // Load nodes
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      challenge.initialState.nodes.forEach(n => {
        const node = {
          id: n.id,
          type: n.type,
          label: n.label,
          x: cx + (n.x || 0), // Offset from center
          y: cy + (n.y || 0),
          vx: 0, vy: 0,
          radius: config.nodeRadius,
          state: n.type === 'process' ? 'READY' : null,
          instances: n.instances || 1,
          burstTime: 100,
          maxBurst: 100,
          originalBurst: 100
        };
        nodes.push(node);
        nextId = Math.max(nextId, n.id + 1);
      });

      // Load edges
      challenge.initialState.edges.forEach(e => {
        edges.push({
          source: e.source,
          target: e.target,
          label: '1'
        });
      });

      draw();

      // Show Active Panel
      const panel = document.getElementById('challenge-active-panel');
      document.getElementById('challenge-title').innerHTML = `<span style="background: white; padding: 8px 14px; border: 3px solid black; box-shadow: 4px 4px 0 black; display: inline-block; font-family: 'Courier New', monospace;">${challenge.title}</span>`;
      document.getElementById('challenge-difficulty').innerText = difficulty.toUpperCase();

      // Restore content area
      const contentArea = document.getElementById('challenge-content-area');
      if (contentArea) {
        contentArea.innerHTML = `
          <p id="challenge-description" style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; font-weight: 600; color: #333; background: white; padding: 12px 16px; border: 3px solid black; box-shadow: 4px 4px 0 rgba(0,0,0,0.1);">
            ${challenge.description}
          </p>
          <div style="display: flex; gap: 15px;">
            <button onclick="submitChallenge()" class="neo-btn" style="flex: 2; background: #4ecdc4; font-weight: 900; border: 3px solid black; box-shadow: 4px 4px 0 black; font-size: 14px; padding: 12px;">
              <i class="fas fa-check-circle"></i> SUBMIT SOLUTION
            </button>
            <button onclick="quitChallenge()" class="neo-btn danger" style="flex: 1; font-weight: 900; border: 3px solid black; box-shadow: 4px 4px 0 black; font-size: 14px; padding: 12px;">
              QUIT
            </button>
          </div>
          <div style="margin-top: 15px; border-top: 2px dashed #ccc; padding-top: 10px;">
            <label style="display: block; font-weight: bold; font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">Need a Hint?</label>
            <div style="display: flex; gap: 8px;">
               <input type="text" id="hint-input" placeholder="Type 'help' for commands..." class="neo-input"
                 style="flex: 1; font-size: 13px; padding: 10px 12px; border: 3px solid black; box-shadow: 4px 4px 0 rgba(0,0,0,0.2); font-family: 'Courier New', monospace; font-weight: 600;" onkeydown="if(event.key==='Enter') askAIHint()">
               <button onclick="askAIHint()" class="neo-btn" style="background: #ffe600; font-weight: 900; border: 3px solid black; font-size: 13px; padding: 10px 16px; box-shadow: 4px 4px 0 black;">
                 <i class="fas fa-lightbulb"></i> ASK
               </button>
            </div>
            <div id="hint-display" style="margin-top: 8px; font-size: 12px; font-style: italic; color: #555; display: none; padding: 8px; background: #f0f0f0; border-left: 3px solid #ffe600;"></div>
          </div>
        `;
      }

      document.getElementById('challenge-feedback').style.display = 'none';

      // Trigger animation by resetting and showing panel
      panel.style.display = 'none';
      panel.style.animation = 'none';

      // Force reflow
      void panel.offsetHeight;

      panel.style.display = 'block';
      panel.style.animation = 'slideDown 0.5s ease-out';

      // Show reset button in sim controls
      document.getElementById('challenge-reset-btn').style.display = 'inline-block';
      currentDifficulty = difficulty;
    }

    function resetToChallengeStart() {
      if (currentChallenge && currentDifficulty) {
        if (confirm('Reset the board to the start of the challenge?')) {
          loadChallenge(currentChallenge, currentDifficulty);
        }
      }
    }

    async function submitChallenge() {
      if (!currentChallenge) return;

      const apiKey = localStorage.getItem('geminiApiKey');
      const contentArea = document.getElementById('challenge-content-area');

      // Show loading state in the content area
      contentArea.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 32px; margin-bottom: 20px;"></i>
          <p style="font-weight: bold;">AI is validating your answer...</p>
        </div>
      `;

      try {
        // Evaluate purely programmatically to guarantee instant, error-free scoring.
        const currentDeadlocks = await detectDeadlock(true);
        const solved = currentDeadlocks.size === 0;
        
        let result = {
          solved: solved,
          feedback: solved ? "Excellent! You restructured the graph into a completely safe state." : "The graph still contains a deadlock cycle! Track the dependencies and try again."
        };

        // Replace content with result
        contentArea.innerHTML = `
          <div style="background: ${result.solved ? '#d1fae5' : '#fee2e2'}; border: 4px solid ${result.solved ? '#10b981' : '#ef4444'}; padding: 20px; box-shadow: 6px 6px 0 black;">
            <h3 style="font-weight: 900; font-size: 20px; color: ${result.solved ? '#047857' : '#b91c1c'}; margin-bottom: 10px;">
              ${result.solved ? 'SUCCESS!' : 'TRY AGAIN'}
            </h3>
            <p style="font-weight: bold; font-size: 14px; line-height: 1.5;">${result.feedback}</p>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
               ${!result.solved ? `<button onclick="loadChallenge(currentChallenge, currentDifficulty)" class="neo-btn" style="flex: 1; background: white; border: 2px solid black; font-weight: bold; box-shadow: 3px 3px 0 black;">RETRY</button>` :
            `<button onclick="quitChallenge()" class="neo-btn" style="flex: 1; background: #a3ffac; border: 2px solid black; font-weight: 900; box-shadow: 3px 3px 0 black; animation: pulse 1s infinite;"><i class="fas fa-flag-checkered"></i> FINISH CHALLENGE</button>`}
               ${!result.solved ? `<button onclick="quitChallenge()" class="neo-btn danger" style="flex: 1; font-weight: bold; border: 2px solid black; box-shadow: 3px 3px 0 black;">QUIT</button>` : ''}
            </div>
          </div>
          </div>
        `;

        if (result.solved) {
          printToCli("Challenge Completed: " + currentChallenge.title, 'success');
        }

      } catch (error) {
        console.error('Eval Error:', error);
        contentArea.innerHTML = `
          <div style="background: #fee2e2; border: 4px solid #ef4444; padding: 20px; box-shadow: 6px 6px 0 black;">
             <h3 style="font-weight: 900; font-size: 20px; color: #b91c1c; margin-bottom: 10px;">EVALUATION ERROR</h3>
             <p style="font-weight: bold; font-size: 14px; line-height: 1.5;">An error occurred while evaluating your graph, but you can retry it.</p>
             <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="loadChallenge(currentChallenge, currentDifficulty)" class="neo-btn" style="flex: 1; background: white; border: 2px solid black; font-weight: bold; box-shadow: 3px 3px 0 black;">RETRY CHALLENGE</button>
                <button onclick="quitChallenge()" class="neo-btn danger" style="flex: 1; font-weight: bold; border: 2px solid black; box-shadow: 3px 3px 0 black;">QUIT</button>
             </div>
          </div>
        `;
      }
    }

    function quitChallenge() {
      currentChallenge = null;
      currentDifficulty = null;
      document.getElementById('challenge-active-panel').style.display = 'none';
      document.getElementById('challenge-reset-btn').style.display = 'none';

      // Show Challenge Mode menu item
      const challengeItem = document.getElementById('challenge-mode-item');
      if (challengeItem) challengeItem.style.display = 'block';

      printToCli("Challenge aborted.", 'info');
    }
