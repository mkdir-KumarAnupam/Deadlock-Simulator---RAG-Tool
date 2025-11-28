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

    async function startChallenge(difficulty) {
      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) {
        alert('Please configure Gemini API key in Settings first!');
        return;
      }

      const loading = document.getElementById('challenge-loading');
      loading.style.display = 'block';

      let promptContext = "";
      if (difficulty === 'easy') {
        promptContext = "Create a simple Resource Allocation Graph scenario with 3-4 nodes that contains a deadlock or is in an unsafe state. The goal should be to identify it or make a simple move to fix it.";
      } else if (difficulty === 'medium') {
        promptContext = "Create a scenario with 5-6 nodes where a deadlock is imminent but can be avoided by careful resource allocation. The goal is to reach a safe state.";
      } else {
        promptContext = "Create a complex scenario with 7+ nodes involving multiple resource types and processes. It should have a subtle race condition or deadlock potential. The goal is to restructure the graph to be permanently safe.";
      }

      const prompt = `You are an OS Professor creating a challenge for a student.
      ${promptContext}

      CRITICAL: JSON ONLY. SHORT.
      GOAL: ${difficulty === 'easy' ? 'Fix deadlock' : difficulty === 'medium' ? 'Prevent deadlock' : 'Fix race condition'}.
      SOLVABLE: Yes.
      NO FLUFF.

      Respond ONLY with valid JSON in this format:
      {
        "title": "Short Title",
        "description": "Concise instructions.",
        "initialState": {
          "nodes": [{"id": 1, "type": "process", "label": "P1", "x": 0, "y": 0}, ...],
          "edges": [{"source": 1, "target": 2}, ...]
        },
        "successCriteria": "Hidden instructions for the AI evaluator."
      }

      Ensure coordinates (x, y) are spread out reasonably around 0,0 (center).
      Do not include any markdown formatting or explanations outside the JSON.`;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'API Error');

        let text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        } else {
          throw new Error("Invalid AI response format: No JSON found");
        }

        const challenge = JSON.parse(text);
        loadChallenge(challenge, difficulty);

      } catch (error) {
        console.error('Challenge Gen Error:', error);
        alert('Failed to generate challenge: ' + error.message);
      } finally {
        loading.style.display = 'none';
      }
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

      const currentGraph = {
        nodes: nodes.map(n => ({ id: n.id, type: n.type, label: n.label })),
        edges: edges.map(e => ({
          source: getNodeById(e.source).label,
          target: getNodeById(e.target).label
        }))
      };

      const prompt = `You are evaluating a student's solution to an OS challenge.

      Keep feedback SHORT and DIRECT.

      CHALLENGE: "${currentChallenge.title}"
      GOAL: "${currentChallenge.description}"
      SUCCESS CRITERIA: "${currentChallenge.successCriteria}"

      STUDENT'S FINAL GRAPH STATE:
      ${JSON.stringify(currentGraph, null, 2)}

      Did the student solve the challenge correctly?
      Respond with a JSON object:
      {
        "solved": true/false,
        "feedback": "Short explanation."
      }`;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) text = jsonMatch[0];

        const result = JSON.parse(text);

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
        contentArea.innerHTML = `<div style="color: red; font-weight: bold;">Error evaluating solution. Please try again.</div>`;
      }
    }

    function quitChallenge() {
      currentChallenge = null;
      currentDifficulty = null;
      document.getElementById('challenge-active-panel').style.display = 'none';
      document.getElementById('challenge-reset-btn').style.display = 'none';
      printToCli("Challenge aborted.", 'info');
    }
