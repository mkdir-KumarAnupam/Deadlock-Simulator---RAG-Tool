
    // --- Gemini AI Integration ---
    function saveGeminiKey(key) {
      if (window.Auth && Auth.savePreference) {
        Auth.savePreference('geminiApiKey', key);
      } else {
        localStorage.setItem('geminiApiKey', key);
      }
      printToCli('Gemini API key saved', 'success');
    }

    function loadGeminiKey() {
      const key = localStorage.getItem('geminiApiKey') || '';
      const input = document.getElementById('config-gemini-key');
      if (input) input.value = key;
      return key;
    }

    async function fetchAI(prompt, expectJson = false, onChunk = null, maxTokens = 800, temperature = 0.7, topK = 40) {
      const provider = localStorage.getItem('narratorProvider') || 'gemini';

      if (provider === 'lmstudio') {
        const lmPort = localStorage.getItem('lmstudioPort') || '1234';
        try {
          const res = await fetch(`http://127.0.0.1:${lmPort}/v1/chat/completions`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: localStorage.getItem('lmstudioModel') || 'google/gemma-3-4b',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: maxTokens,
              temperature: temperature,
              top_k: topK,
              stream: !!onChunk
            })
          });

          if (!res.ok) {
            const data = await res.json().catch(()=>({}));
            throw new Error(data?.error?.message || `LM Studio HTTP ${res.status}`);
          }

          if (onChunk) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              for (const line of chunk.split('\n')) {
                if (!line.startsWith('data:')) continue;
                const raw = line.slice(5).trim();
                if (raw === '[DONE]') break;
                try {
                  const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullText += delta;
                    onChunk(fullText);
                  }
                } catch (_) {}
              }
            }
            return fullText.trim() || '';
          } else {
            const data = await res.json();
            return data?.choices?.[0]?.message?.content?.trim() || '';
          }
        } catch (error) {
          console.error('LM Studio Error:', error);
          throw new Error('LM Studio unreachable or failed: ' + error.message);
        }
      } else {
        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) throw new Error('Please configure Gemini API key in Settings');
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: temperature,
                topK: topK,
                ...(expectJson ? { responseMimeType: "application/json" } : {})
              }
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
          if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
             throw new Error('Invalid Gemini response format');
          }
          let text = data.candidates[0].content.parts[0].text;
          return text.trim();
        } catch (error) {
          console.error('Gemini Error:', error);
          throw error;
        }
      }
    }

    async function analyzeWithGemini(graphData, deadlockInfo) {
      const provider = localStorage.getItem('narratorProvider') || 'gemini';
      const apiKey = localStorage.getItem('geminiApiKey');
      if (provider !== 'lmstudio' && !apiKey) {
        if (window.Session) Session.showNotification('Please configure Gemini API key in Settings', 'error');
        return {
          error: true,
          message: 'Please configure Gemini API key in Settings'
        };
      }

      const prompt = `You are a tutor. Analyze this Resource Allocation Graph:

GRAPH: ${JSON.stringify(graphData, null, 2)}
STATUS: ${deadlockInfo.hasDeadlock ? 'DEADLOCK' : 'SAFE'}
${deadlockInfo.hasDeadlock ? `CYCLE: ${deadlockInfo.cycle.join(' → ')}` : ''}

Give ONLY 2 SHORT paragraphs (2-3 sentences each):

${deadlockInfo.hasDeadlock ?
          `1. **Problem**: Which processes/resources form the cycle and why it's stuck
2. **Fix**: ONE specific action to break it` :
          `1. **Status**: Why it's safe (key reason only)
2. **Tip**: One thing to learn from this`}

Be extremely brief. No fluff.`;

      try {
        const text = await window.fetchAI(prompt);
        printToCli('✓ AI Analysis complete', 'success');
        return {
          error: false,
          analysis: text
        };
      } catch (error) {
        console.error('AI Network Exception:', error);
        printToCli(`AI Error: ${error.message}`, 'error');
        return {
          error: true,
          message: `Error: ${error.message}<br><br>• Check your internet connection or LM Studio server<br>• Verify settings<br>• Try again in a moment`
        };
      }
    }

    async function requestAIFix() {
      if (!lastDeadlockInfo || !lastDeadlockInfo.hasDeadlock) {
        printToCli('No deadlock to fix!', 'error');
        return;
      }

      const provider = localStorage.getItem('narratorProvider') || 'gemini';
      const apiKey = localStorage.getItem('geminiApiKey');
      if (provider !== 'lmstudio' && !apiKey) {
        printToCli('Please configure Gemini API key in Settings', 'error');
        if (window.Session) Session.showNotification('Please configure Gemini API key in Settings', 'error');
        return;
      }

      printToCli('Requesting AI fix...', 'info');
      const content = document.getElementById('ai-content');
      content.innerHTML = `
                <div class="bg-blue-100 border-2 border-blue-500 p-3 text-center" style="line-height: 1.8; padding: 30px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto; background: #FFD700; border: 4px solid black; box-shadow: 6px 6px 0 black; position: relative; animation: robotThink 1s ease-in-out infinite;">
                        <div style="position: absolute; top: 15px; left: 15px; width: 15px; height: 15px; background: black; border: 2px solid black;"></div>
                        <div style="position: absolute; top: 15px; right: 15px; width: 15px; height: 15px; background: black; border: 2px solid black;"></div>
                        <div style="position: absolute; bottom: 15px; left: 20px; right: 20px; height: 8px; background: black; border: 2px solid black;"></div>
                    </div>
                    <strong style="display: block; margin-top: 20px; font-size: 14px;">AI is thinking...</strong>
                    <p style="margin-top: 8px; font-size: 12px; color: #555;">Analyzing deadlock and generating solution</p>
                </div>
                <style>
                    @keyframes robotThink {
                        0%, 100% { transform: rotate(0deg) translateY(0); }
                        25% { transform: rotate(-3deg) translateY(-5px); box-shadow: 8px 8px 0 black; }
                        50% { transform: rotate(0deg) translateY(0); }
                        75% { transform: rotate(3deg) translateY(-5px); box-shadow: 8px 8px 0 black; }
                    }
                </style>
            `;

      // Build current graph structure
      const graphData = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label
        })),
        edges: edges.map(e => ({
          source: e.source,
          target: e.target,
          sourceLabel: getNodeById(e.source).label,
          targetLabel: getNodeById(e.target).label
        }))
      };

      const prompt = `You are a deadlock resolution expert. The following Resource Allocation Graph has a deadlock.

CURRENT GRAPH:
${JSON.stringify(graphData, null, 2)}

DEADLOCK CYCLE: ${lastDeadlockInfo.cycle.join(' → ')}

Provide a fixed version of the graph that breaks the deadlock. Respond ONLY with valid JSON in this exact format:
{
  "edges": [
    {"source": nodeId, "target": nodeId}
  ]
}

Rules:
- Keep all nodes (don't remove any)
- Remove or reorder edges to break the circular wait
- Ensure the result is a valid, safe resource allocation
- Only output the JSON, no explanations`;

      try {
        let fixText = await window.fetchAI(prompt, true);
        // Extract JSON from markdown code blocks if present
        const jsonMatch = fixText.match(/```(?:json)?\s*([\s\S]*?)```/) || fixText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          fixText = jsonMatch[1] || jsonMatch[0];
        }

        const fixedGraph = JSON.parse(fixText.trim());

        if (!fixedGraph.edges || !Array.isArray(fixedGraph.edges)) {
          throw new Error('Invalid fix format - missing edges array');
        }

        const fixSummary = applyAIFix(fixedGraph);
        printToCli('✓ AI fix applied successfully!', 'success');

        content.innerHTML = `
                    <div class="bg-green-100 border-2 border-green-500 p-3" style="line-height: 1.6;">
                        <strong style="color: #16a34a; font-size: 15px;">✓ Solution Implemented!</strong><br><br>
                        <strong>What was fixed:</strong><br>
                        ${fixSummary}
                    </div>
                `;

      } catch (error) {
        console.error('AI Fix Error:', error);
        printToCli(`AI Fix failed: ${error.message}`, 'error');
        content.innerHTML = `
                    <div class="bg-red-100 border-2 border-red-500 p-3 text-red-700" style="line-height: 1.8;">
                        <strong>⚠ Fix Failed:</strong><br><br>${error.message}
                    </div>
                `;
      }
    }

    function applyAIFix(fixedGraph) {
      saveState(); // Save for undo

      // Track what changed
      const oldEdgeCount = edges.length;
      const oldEdges = edges.map(e => `${getNodeById(e.source).label}→${getNodeById(e.target).label}`);

      // Clear existing edges
      edges = [];

      // Apply new edges from AI fix
      let newEdges = [];
      fixedGraph.edges.forEach(edge => {
        const sourceNode = getNodeById(edge.source);
        const targetNode = getNodeById(edge.target);

        if (sourceNode && targetNode) {
          edges.push({
            source: edge.source,
            target: edge.target,
            label: '1'
          });
          newEdges.push(`${sourceNode.label}→${targetNode.label}`);
        }
      });

      // Generate explanation
      const removedEdges = oldEdges.filter(e => !newEdges.includes(e));
      const addedEdges = newEdges.filter(e => !oldEdges.includes(e));

      let explanation = '';
      if (removedEdges.length > 0) {
        explanation += `• <strong>Removed edges:</strong> ${removedEdges.join(', ')}<br>`;
      }
      if (addedEdges.length > 0) {
        explanation += `• <strong>Added edges:</strong> ${addedEdges.join(', ')}<br>`;
      }
      if (removedEdges.length === 0 && addedEdges.length === 0) {
        explanation = '• <strong>Reordered connections</strong> to break circular wait<br>';
      }
      explanation += `<br>The <strong>circular wait condition</strong> has been eliminated, allowing processes to complete.`;

      updateProcessStates();
      detectDeadlock(true);
      draw();
      printToCli('Graph restructured by AI', 'success');

      return explanation;
    }

    async function askAIQuestion() {
      const input = document.getElementById('ai-question-input');
      const question = input.value.trim();

      if (!question) {
        printToCli('Please enter a question', 'error');
        return;
      }

      const provider = localStorage.getItem('narratorProvider') || 'gemini';
      const apiKey = localStorage.getItem('geminiApiKey');
      if (provider !== 'lmstudio' && !apiKey) {
        printToCli('Please configure Gemini API key in Settings', 'error');
        if (window.Session) Session.showNotification('Please configure Gemini API key in Settings', 'error');
        return;
      }

      input.value = '';
      const content = document.getElementById('ai-content');

      // Show thinking animation
      content.innerHTML = `
                <div class="bg-blue-100 border-2 border-blue-500 p-3 text-center" style="line-height: 1.8; padding: 30px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto; background: #FFD700; border: 4px solid black; box-shadow: 6px 6px 0 black; position: relative; animation: robotThink 1s ease-in-out infinite;">
                        <div style="position: absolute; top: 15px; left: 15px; width: 15px; height: 15px; background: black; border: 2px solid black;"></div>
                        <div style="position: absolute; top: 15px; right: 15px; width: 15px; height: 15px; background: black; border: 2px solid black;"></div>
                        <div style="position: absolute; bottom: 15px; left: 20px; right: 20px; height: 8px; background: black; border: 2px solid black;"></div>
                    </div>
                    <strong style="display: block; margin-top: 20px; font-size: 14px;">AI is thinking...</strong>
                </div>
                <style>
                    @keyframes robotThink {
                        0%, 100% { transform: rotate(0deg) translateY(0); }
                        25% { transform: rotate(-3deg) translateY(-5px); box-shadow: 8px 8px 0 black; }
                        50% { transform: rotate(0deg) translateY(0); }
                        75% { transform: rotate(3deg) translateY(-5px); box-shadow: 8px 8px 0 black; }
                    }
                </style>
            `;

      const prompt = `You are a helpful OS tutor. Answer this question about the current resource allocation graph briefly and clearly:

QUESTION: ${question}

CONTEXT: The graph has ${nodes.length} nodes (${nodes.filter(n => n.type === 'process').length} processes, ${nodes.filter(n => n.type === 'resource').length} resources) and ${edges.length} edges.

Provide a concise, educational answer in 2-3 short paragraphs. Be friendly and helpful.`;

      try {
        const answer = await window.fetchAI(prompt);
        const formatted = answer
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-black">$1</strong>')
          .replace(/\n\n/g, '</p><p class="mb-3">')
          .replace(/\n/g, '<br>')
          .replace(/- /g, '<br>• ');

        content.innerHTML = `
                    <div class="space-y-3">
                        <div class="bg-purple-100 border-2 border-black p-3" style="line-height: 1.6;">
                            <strong style="font-size: 12px; display: block; margin-bottom: 8px; color: #7c3aed;">Q: ${question}</strong>
                            <p class="mb-3" style="font-size: 12px;">${formatted}</p>
                        </div>
                        <div style="margin-top: 12px; padding: 12px; background: white; border: 3px solid black; box-shadow: 4px 4px 0 black;">
                            <label style="display: block; font-weight: bold; font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">Ask AI:</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="ai-question-input" placeholder="Type your question..." class="neo-input" style="flex: 1; font-size: 12px; padding: 8px;" onkeydown="if(event.key==='Enter') askAIQuestion()">
                                <button onclick="askAIQuestion()" class="neo-btn" style="padding: 8px 12px; font-size: 11px; background: #a3ffac;">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;

        printToCli('AI answered your question', 'success');

      } catch (error) {
        console.error('Ask AI Error:', error);
        content.innerHTML = `
                    <div class="bg-red-100 border-2 border-red-500 p-3 text-red-700" style="line-height: 1.8;">
                        <strong>⚠ Error:</strong><br><br>${error.message}
                    </div>
                `;
        printToCli('Failed to get AI response', 'error');
      }
    }

    function displayAIAnalysis(result, deadlockInfo = null) {
      const content = document.getElementById('ai-content');

      if (result.error) {
        content.innerHTML = `
                    <div class="bg-red-100 border-2 border-red-500 p-3 text-red-700" style="line-height: 1.8;">
                        <strong style="font-size: 14px;">⚠ Error:</strong><br><br>${result.message}
                    </div>
                `;
        return;
      }

      // Store deadlock info for AI fix feature
      if (deadlockInfo && deadlockInfo.hasDeadlock) {
        lastDeadlockInfo = deadlockInfo;
      }

      // Parse and format the analysis
      const analysis = result.analysis;
      const formatted = analysis
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-black">$1</strong>')
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br>')
        .replace(/- /g, '<br>• ');

      const askAISection = `
                <div style="margin-top: 12px; padding: 12px; background: white; border: 3px solid black; box-shadow: 4px 4px 0 black;">
                    <label style="display: block; font-weight: bold; font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">Ask AI:</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="ai-question-input" placeholder="Type your question..." class="neo-input" style="flex: 1; font-size: 12px; padding: 8px;" onkeydown="if(event.key==='Enter') askAIQuestion()">
                        <button onclick="askAIQuestion()" class="neo-btn" style="padding: 8px 12px; font-size: 11px; background: #a3ffac;">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            `;

      const fixButton = (deadlockInfo && deadlockInfo.hasDeadlock) ? `
                <button onclick="requestAIFix()" class="neo-btn" style="width: 100%; margin-top: 12px; background: #4ecdc4; color: black; font-weight: bold; font-size: 13px;">
                    <i class="fas fa-cogs"></i> IMPLEMENT THIS SOLUTION
                </button>
            ` : '';

      content.innerHTML = `
                <div class="space-y-3">
                    <div class="bg-yellow-100 border-2 border-black p-3" style="line-height: 1.6;">
                        <p class="mb-3">${formatted}</p>
                    </div>
                    ${askAISection}
                    ${fixButton}
                </div>
            `;
    }

    async function askAIHint() {
      if (!currentChallenge) return;
      const input = document.getElementById('hint-input');
      const display = document.getElementById('hint-display');
      const question = input.value.trim();

      if (!question) return;

      display.style.display = 'block';
      display.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';

      const prompt = `You are a helpful TA.
          CHALLENGE: "${currentChallenge.title}"
        DESCRIPTION: "${currentChallenge.description}"
      STUDENT QUESTION: "${question}"

      Give a SHORT, helpful hint.Do not give the full answer.Max 2 sentences.`;

      try {
        const hint = await window.fetchAI(prompt);
        display.innerHTML = `<strong>Hint:</strong> ${hint}`;
      } catch (error) {
        console.error('Ask AI Hint Error:', error);
        display.innerText = "Error getting hint: " + error.message;
      }
    }
    // --- AI Scenario Narrator ---

    let narratorEvents = [];
    let narratorLog = [];
    let narratorInterval = null;
    let narratorDebounceTimer = null;
    let narratorActive = false;
    let narratorPending = false;
    let narratorLastCallTime = 0;
    let narratorLastScheduled = null;
    let narratorLastScheduleNarratedTime = 0; // for LM Studio: re-narrate schedule every N ms

    // Provider-aware timing helpers — read live from localStorage so toggling in Settings is instant
    function _isLMStudio() { return (localStorage.getItem('narratorProvider') || 'gemini') === 'lmstudio'; }
    function _getNarratorDebounce()  { return _isLMStudio() ? 300  : 800;  }  // LM: snappier
    function _getNarratorCooldown()  { return _isLMStudio() ? 1500 : 8000; }  // LM: ~40 RPM headroom

    // High-value events always trigger narration regardless of provider
    const NARRATOR_HIGH_VALUE = new Set(['deadlock', 'terminate', 'preempt', 'block', 'start', 'allocate']);
    const LM_SCHEDULE_REPEAT_MS = 4000; // LM Studio: re-narrate same process every 4s for step-by-step

    function pushNarratorEvent(type, detail) {
      if (!narratorActive) return;

      const lm = _isLMStudio();

      if (type === 'schedule') {
        const now = Date.now();
        if (lm) {
          // LM Studio: allow re-narrating the same process every few seconds for step-by-step guidance
          const repeatOk = (now - narratorLastScheduleNarratedTime) >= LM_SCHEDULE_REPEAT_MS;
          if (narratorLastScheduled === detail?.label && !repeatOk) return;
          narratorLastScheduleNarratedTime = now;
        } else {
          // Gemini: skip if same process (conserve API quota)
          if (narratorLastScheduled === detail?.label) return;
        }
        narratorLastScheduled = detail?.label;
      } else if (NARRATOR_HIGH_VALUE.has(type)) {
        narratorLastScheduled = null;
        narratorLastScheduleNarratedTime = 0;
      }

      narratorEvents.push({ type, detail, ts: Date.now() });

      const sinceLastCall = Date.now() - narratorLastCallTime;
      const cooldownRemaining = Math.max(0, _getNarratorCooldown() - sinceLastCall);
      const delay = Math.max(_getNarratorDebounce(), cooldownRemaining);

      clearTimeout(narratorDebounceTimer);
      narratorDebounceTimer = setTimeout(narratorTick, delay);
    }

    // Map algo codes to plain-English descriptions of what they are designed to demonstrate
    const _algoDescriptions = {
      fcfs:        'First-Come First-Served (FCFS) — processes run in arrival order with no preemption. This demonstrates the convoy effect, where long processes block shorter ones.',
      sjf:         'Shortest Job First (SJF) — the process with the shortest total burst runs next. This demonstrates optimal average waiting time but can starve long processes.',
      srtf:        'Shortest Remaining Time First (SRTF) — preemptive SJF. A newly arriving shorter process immediately takes the CPU, demonstrating frequent context switching.',
      rr:          'Round Robin (RR) — each process gets a fixed time quantum before yielding. This demonstrates fair CPU sharing and the trade-off with context switch overhead.',
      priority_np: 'Non-Preemptive Priority — the highest-priority process runs to completion. This demonstrates potential starvation of low-priority processes.',
      priority_p:  'Preemptive Priority — a higher-priority arrival immediately preempts the running process. This demonstrates responsiveness at the cost of frequent interruptions.',
      mlq:         'Multilevel Queue (MLQ) — processes are fixed in foreground or background queues with separate algorithms, demonstrating rigid priority separation.',
      mlfq:        'Multilevel Feedback Queue (MLFQ) — processes start high-priority and get demoted as they consume CPU, demonstrating adaptive scheduling to prevent starvation.'
    };

    function _buildNarratorPrompt(events) {
      // Deduplicate: for repeated type+label combos keep only the last occurrence,
      // so 10x "P1 scheduled" in one window becomes 1 line in the prompt.
      const seen = new Map();
      events.forEach(e => {
        const key = e.type + '|' + (e.detail?.label || '');
        seen.set(key, e); // later events overwrite earlier ones
      });
      const deduped = [...seen.values()];

      const lines = deduped.map(e => {
        switch (e.type) {
          case 'start':     return `SIMULATION STARTED (algorithm: ${e.detail.algo}, processes: ${e.detail.processes})`;
          case 'pause':     return 'SIMULATION PAUSED';
          case 'schedule':  return `${e.detail.label} was scheduled and is now RUNNING`;
          case 'preempt':   return `${e.detail.label} was PREEMPTED${e.detail.by ? ' by ' + e.detail.by : ''}`;
          case 'block':     return `${e.detail.label} became BLOCKED waiting for ${e.detail.resource || 'a resource'}`;
          case 'terminate': return `${e.detail.label} COMPLETED and terminated`;
          case 'deadlock':  return `DEADLOCK DETECTED — cycle: ${e.detail.cycle}`;
          case 'allocate':  return `${e.detail.resource} was ALLOCATED to ${e.detail.label}`;
          default:          return `EVENT: ${e.type}`;
        }
      }).join('\n');

      // Collect live graph snapshot
      const algo = (typeof schedulingAlgorithm !== 'undefined' ? schedulingAlgorithm : 'fcfs');
      const algoDesc = _algoDescriptions[algo] || algo.toUpperCase();

      const allNodes  = (typeof nodes !== 'undefined' ? nodes : []);
      const allEdges  = (typeof edges !== 'undefined' ? edges : []);

      const processLines = allNodes.filter(n => n.type === 'process').map(n => {
        const heldResources = allEdges
          .filter(e => e.source !== undefined && allNodes.find(r => r.id === e.source && r.type === 'resource') && e.target === n.id)
          .map(e => { const r = allNodes.find(x => x.id === e.source); return r ? r.label : '?'; });
        const wantedResources = allEdges
          .filter(e => e.source === n.id)
          .map(e => { const r = allNodes.find(x => x.id === e.target); return r ? r.label : '?'; });
        const burst    = n.burstTime !== undefined ? `, burst left: ${n.burstTime}` : '';
        const holds    = heldResources.length  ? `, holds: ${heldResources.join('+')}` : '';
        const wants    = wantedResources.length ? `, waiting for: ${wantedResources.join('+')}` : '';
        return `  ${n.label} [${n.state || 'READY'}${burst}${holds}${wants}]`;
      }).join('\n');

      const resourceLines = allNodes.filter(n => n.type === 'resource').map(n => {
        const allocCount = allEdges.filter(e => e.source === n.id).length;
        const cap = n.capacity || n.instances || 1;
        return `  ${n.label} [capacity: ${cap}, in use: ${allocCount}/${cap}]`;
      }).join('\n');

      // Active scenario / challenge context
      let scenarioContext = '';
      if (typeof currentChallenge !== 'undefined' && currentChallenge) {
        scenarioContext = `\nACTIVE CHALLENGE: "${currentChallenge.title}"\nCHALLENGE GOAL: ${currentChallenge.description}`;
      }

      return `You are an OS tutor narrating a Resource Allocation Graph simulator in real time for a student.

ALGORITHM IN USE: ${algoDesc}${scenarioContext}

CURRENT GRAPH STATE:
Processes:
${processLines || '  (none yet)'}
Resources:
${resourceLines || '  (none yet)'}

RECENT EVENTS:
${lines}

Write 1-2 short sentences (max 40 words):
1. Explain what just happened specifically in terms of what this algorithm/scenario is meant to demonstrate
2. Tell the student what to look at on the graph right now and what insight they should be gaining

Tone: friendly tutor. Plain language — define any OS term you use. No bullet points. No markdown.`;
    }

    // Compact prompt for LM Studio — shorter = faster first token on local hardware
    function _buildLMPrompt(events) {
      const algo = (typeof schedulingAlgorithm !== 'undefined' ? schedulingAlgorithm : 'fcfs').toUpperCase();
      const allNodes = (typeof nodes !== 'undefined' ? nodes : []);
      const procs = allNodes.filter(n => n.type === 'process')
        .map(n => `${n.label}[${n.state || 'READY'}]`).join(', ');
      const evtLines = events.map(e => {
        switch (e.type) {
          case 'start':     return `Simulation started (${e.detail.algo})`;
          case 'schedule':  return `${e.detail.label} is RUNNING`;
          case 'preempt':   return `${e.detail.label} preempted${e.detail.by ? ' by '+e.detail.by : ''}`;
          case 'terminate': return `${e.detail.label} finished`;
          case 'deadlock':  return `DEADLOCK: ${e.detail.cycle}`;
          case 'allocate':  return `${e.detail.resource} → ${e.detail.label}`;
          case 'block':     return `${e.detail.label} blocked on ${e.detail.resource || 'resource'}`;
          default:          return e.type;
        }
      }).join('; ');
      return `You are an OS tutor. Algorithm: ${algo}. State: ${procs || 'empty'}. Event: ${evtLines}.
In exactly 1-2 sentences, tell the student what happened and what to observe on screen. Be specific and educational. No markdown.`;
    }

    async function _narratorFetch(prompt, onChunk) {
      const provider = localStorage.getItem('narratorProvider') || 'gemini';

      if (provider === 'lmstudio') {
        try {
          const lmPort = localStorage.getItem('lmstudioPort') || '1234';
          const res = await fetch(`http://127.0.0.1:${lmPort}/v1/chat/completions`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: localStorage.getItem('lmstudioModel') || 'google/gemma-3-4b',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 70,
              temperature: 0.5,
              stream: true
            })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { error: `LM Studio error ${res.status}: ${err?.error?.message || 'is the server running?'}` };
          }
          // Stream SSE chunks into the panel in real-time
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const raw = line.slice(5).trim();
              if (raw === '[DONE]') break;
              try {
                const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  if (onChunk) onChunk(fullText); // update panel live
                }
              } catch (_) {}
            }
          }
          return fullText.trim() || null;
        } catch (e) {
          return { error: `LM Studio unreachable — is it running on port 1234? (${e.message})` };
        }
      }

      // Default: Gemini (no streaming — API doesn't need it at cloud speeds)
      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) return { error: 'No API key set. Go to Settings → Gemini API Key, or switch provider to LM Studio.' };
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        if (!res.ok) return { error: `API error ${res.status}: ${data?.error?.message || 'check your API key'}` };
        return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
      } catch (e) {
        return { error: `Network error: ${e.message}` };
      }
    }

    async function narratorTick() {
      if (!narratorActive || narratorPending) return;
      if (narratorEvents.length === 0) return;

      const batch = narratorEvents.splice(0);
      narratorPending = true;
      _setNarratorThinking(true);

      const lm = _isLMStudio();
      const prompt = lm ? _buildLMPrompt(batch) : _buildNarratorPrompt(batch);

      // For LM Studio streaming: inject a live entry immediately so text appears as it arrives
      const now = new Date();
      const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      let streamEntry = null;
      if (lm) {
        streamEntry = { ts, text: '▮▮▮' }; // placeholder dots
        narratorLog.unshift(streamEntry);
        _renderNarratorLog();
      }

      const onChunk = lm ? (partial) => {
        if (streamEntry) {
          streamEntry.text = partial + ' ▮'; // trailing cursor
          const activeTextEl = document.getElementById('narrator-active-chunk-text');
          if (activeTextEl) {
             activeTextEl.innerText = streamEntry.text;
          } else {
             _renderNarratorLog(); // Fallback if missing
          }
        }
      } : null;

      const result = await _narratorFetch(prompt, onChunk);

      narratorPending = false;
      _setNarratorThinking(false);
      narratorLastCallTime = Date.now();

      if (result && typeof result === 'object' && result.error) {
        if (streamEntry) narratorLog.shift(); // remove the streaming placeholder
        const log = document.getElementById('narrator-log');
        if (log) log.innerHTML = `<div style="color:#c00;font-size:12px;padding:10px;border:2px dashed #f99;background:#fff5f5;">⚠ ${result.error}</div>`;
      } else if (result) {
        if (streamEntry) {
          streamEntry.text = result; // replace streaming placeholder with final clean text
        } else {
          narratorLog.unshift({ ts, text: result });
        }
        if (narratorLog.length > 50) narratorLog.pop();
        _renderNarratorLog();
      }

      // Drain queued events, respecting cooldown
      if (narratorActive && narratorEvents.length > 0) {
        narratorDebounceTimer = setTimeout(narratorTick, _getNarratorCooldown());
      }
    }

    function _renderNarratorLog() {
      const log = document.getElementById('narrator-log');
      if (!log) return;
      if (narratorLog.length === 0) {
        log.innerHTML = `
          <div style="padding:20px 12px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">🎙️</div>
            <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#999;font-family:'Courier New',monospace;">Waiting for simulation events...</div>
          </div>`;
        return;
      }
      log.innerHTML = narratorLog.map((entry, i) => `
        <div style="
          border-left: 4px solid ${i === 0 ? '#ffe600' : '#eee'};
          margin-bottom: 10px;
          padding: 8px 10px;
          background: ${i === 0 ? '#fffdf0' : 'white'};
          animation: ${i === 0 ? 'narratorSlideIn 0.35s cubic-bezier(0.22,1,0.36,1)' : 'none'};
          border-top: ${i === 0 ? '2px solid black' : '1px solid #eee'};
          border-right: 1px solid #eee;
          border-bottom: 1px solid #eee;
        ">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span style="
              background:black;color:#ffe600;
              font-size:9px;font-weight:900;font-family:'Courier New',monospace;
              padding:1px 5px;letter-spacing:0.5px;text-transform:uppercase;
            ">${entry.ts}</span>
            ${i === 0 ? '<span style="background:#ffe600;color:black;font-size:9px;font-weight:900;font-family:\'Courier New\',monospace;padding:1px 5px;border:1.5px solid black;">NEW</span>' : ''}
          </div>
          <div id="${i === 0 ? 'narrator-active-chunk-text' : ''}" style="font-size:12.5px;line-height:1.6;font-weight:${i===0 ? 600 : 500};font-family:system-ui,sans-serif;color:#111;">${entry.text}</div>
        </div>
      `).join('');
    }

    function _setNarratorThinking(active) {
      const dot = document.getElementById('narrator-live-dot');
      const label = document.getElementById('narrator-status-label');
      if (dot) dot.style.background = active ? '#ff6b6b' : '#22c55e';
      if (dot) dot.style.animation = active ? 'narratorPulse 0.7s ease-in-out infinite' : 'narratorPulse 2s ease-in-out infinite';
      if (label) label.textContent = active ? 'THINKING' : 'LIVE';
    }

    function _ensureNarratorPanel() {
      if (document.getElementById('narrator-panel')) return;

      const panel = document.createElement('div');
      panel.id = 'narrator-panel';
      panel.style.cssText = [
        'position:fixed', 'bottom:20px', 'left:20px', 'width:320px',
        'background:white', 'border:4px solid black',
        'box-shadow:8px 8px 0 black',
        'z-index:9000', 'font-family:\'Courier New\',monospace',
        'transition:transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.15s ease',
        'transform:translateX(0)'
      ].join(';');

      panel.innerHTML = `
        <style>
          @keyframes narratorSlideIn {
            from { opacity:0; transform:translateX(-12px); }
            to   { opacity:1; transform:translateX(0); }
          }
          @keyframes narratorPulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:0.4; transform:scale(0.7); }
          }
          @keyframes narratorPanelIn {
            from { opacity:0; transform:translateX(-340px); }
            to   { opacity:1; transform:translateX(0); }
          }
          #narrator-panel { animation: narratorPanelIn 0.35s cubic-bezier(0.22,1,0.36,1); }
          #narrator-panel:hover { box-shadow: 10px 10px 0 black; }
          #narrator-clear-btn:hover { background:#ffe600 !important; }
          #narrator-close-btn:hover { background:#c0392b !important; }
        </style>

        <!-- Header bar -->
        <div style="background:black;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:900;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:white;">AI NARRATOR_</span>
            <div style="display:flex;align-items:center;gap:4px;background:#1a1a1a;padding:2px 7px;border:1.5px solid #444;">
              <div id="narrator-live-dot" style="width:7px;height:7px;border-radius:50%;background:#22c55e;animation:narratorPulse 2s ease-in-out infinite;"></div>
              <span id="narrator-status-label" style="font-size:9px;font-weight:900;letter-spacing:1.5px;color:#aaa;">LIVE</span>
            </div>
          </div>
          <div style="display:flex;gap:5px;">
            <button id="narrator-clear-btn" onclick="clearNarrator()" title="Clear"
              style="background:white;border:2px solid white;color:black;padding:2px 7px;font-size:11px;font-weight:900;cursor:pointer;font-family:'Courier New',monospace;transition:background 0.1s;">
              CLR
            </button>
            <button id="narrator-close-btn" onclick="stopNarrator()" title="Close"
              style="background:#ff6b6b;border:2px solid white;color:white;padding:2px 8px;font-size:11px;font-weight:900;cursor:pointer;font-family:'Courier New',monospace;transition:background 0.1s;">
              ✕
            </button>
          </div>
        </div>

        <!-- Log area -->
        <div id="narrator-log" style="max-height:240px;overflow-y:auto;padding:10px 12px 4px;"></div>

        <!-- Bottom status bar -->
        <div style="border-top:2px solid black;background:#f5f5f5;padding:5px 12px;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:9px;font-weight:900;letter-spacing:1px;color:#888;">POWERED BY GEMINI</span>
          <span style="font-size:9px;font-weight:900;letter-spacing:1px;color:#888;">RAG-SIM v1.8</span>
        </div>
      `;

      document.body.appendChild(panel);
      _renderNarratorLog();
    }

    function startNarrator() {
      // Only require Gemini key when using Gemini as provider
      if (!_isLMStudio()) {
        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
          if (window.Session) Session.showNotification('Please configure Gemini API key in Settings to use the Narrator', 'error');
          return;
        }
      }
      if (narratorActive) return;

      narratorActive = true;
      narratorEvents = [];
      narratorLastScheduled = null;
      narratorLastScheduleNarratedTime = 0;
      _ensureNarratorPanel();

      narratorInterval = null; // debounce handles timing now

      // Update toggle button state
      const btn = document.getElementById('btn-narrator');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
        btn.style.cssText += ';background:#ffe600;color:black;border-color:black;box-shadow:4px 4px 0 black;';
        btn.title = 'AI Narrator — ON (click to stop)';
      }
      const toolsIcon = document.getElementById('tools-narrator-icon');
      if (toolsIcon) { toolsIcon.className = 'fas fa-microphone mr-2'; }

      printToCli('🎙️ AI Narrator started', 'success');
      pushNarratorEvent('start', {
        processes: nodes.filter(n => n.type === 'process').length,
        algo: (typeof schedulingAlgorithm !== 'undefined' ? schedulingAlgorithm : 'fcfs').toUpperCase()
      });
    }

    function stopNarrator() {
      if (!narratorActive && !document.getElementById('narrator-panel')) return;

      narratorActive = false;
      clearTimeout(narratorDebounceTimer);
      clearInterval(narratorInterval);
      narratorInterval = null;

      const panel = document.getElementById('narrator-panel');
      if (panel) {
        panel.style.transform = 'translateX(-340px)';
        setTimeout(() => panel.remove(), 320);
      }

      const btn = document.getElementById('btn-narrator');
      if (btn) {
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        btn.style.cssText = btn.style.cssText
          .replace(/background:[^;]+;/, '')
          .replace(/color:[^;]+;/, '')
          .replace(/box-shadow:[^;]+;/, '');
        btn.title = 'AI Narrator (click to start)';
      }
      const toolsIcon = document.getElementById('tools-narrator-icon');
      if (toolsIcon) { toolsIcon.className = 'fas fa-microphone-slash mr-2'; }

      printToCli('🎙️ AI Narrator stopped', 'info');
    }

    function clearNarrator() {
      narratorLog = [];
      _renderNarratorLog();
    }

    function toggleNarrator() {
      if (narratorActive) {
        stopNarrator();
      } else {
        startNarrator();
      }
    }

    // Explicitly expose functions to window
    window.saveGeminiKey = saveGeminiKey;
    window.loadGeminiKey = loadGeminiKey;
    window.analyzeWithGemini = analyzeWithGemini;
    window.requestAIFix = requestAIFix;
    window.askAIQuestion = askAIQuestion;
    window.askAIHint = askAIHint;
    window.displayAIAnalysis = displayAIAnalysis;
    window.pushNarratorEvent = pushNarratorEvent;
    window.startNarrator = startNarrator;
    window.stopNarrator = stopNarrator;
    window.clearNarrator = clearNarrator;
    window.toggleNarrator = toggleNarrator;
    window.fetchAI = fetchAI;

    async function generateGraphCode() {
      // 1. Get graph data
      if (typeof nodes === 'undefined' || !nodes || nodes.length === 0) {
        if (window.Session) Session.showNotification('Graph is empty. Draw some processes and resources first!', 'error');
        else alert('Graph is empty!');
        return;
      }

      const procs = nodes.filter(n => n.type === 'process').map(n => n.label).join(', ');
      const resTypes = nodes.filter(n => n.type === 'resource').map(n => n.label).join(', ');

      let edgesList = '';
      if (typeof edges !== 'undefined' && edges) {
         edgesList = edges.map(e => {
            const s = nodes.find(n => n.id === e.source)?.label;
            const t = nodes.find(n => n.id === e.target)?.label;
            return `  ${s} -> ${t}`;
         }).join('\n');
      }

      const modal = document.getElementById('code-translator-modal');
      const loader = document.getElementById('code-translator-loading');
      const output = document.getElementById('code-translator-output');

      modal.classList.remove('hidden');
      loader.classList.remove('hidden');
      output.textContent = '';

      const prompt = `You are an expert Systems Programming tutor.
I have a Resource Allocation Graph:
Processes: ${procs}
Resources: ${resTypes}
Edges (Allocations and Requests):
${edgesList || '(No edges)'}

Write a complete, compilable C program using pthreads and pthread_mutex_t (or semaphores) that perfectly replicates the concurrency state of this graph.
- Model each Process as a pthread.
- Model each Resource as a global mutex or semaphore.
- Threads should attempt to lock resources in the exact order requested by the edges.
- Add printfs so the user can run it and see the deadlock (or success) happen in the terminal!

Respond with ONLY the C code wrapped in a \`\`\`c codeblock. No markdown explanations.`;

      try {
        let onChunk = null;
        if ((localStorage.getItem('narratorProvider') || 'gemini') === 'lmstudio') {
          // Live stream rendering
          onChunk = (partial) => {
             // Basic regex cleanup for markdown formatting live
             let liveText = partial.replace(/^\`\`\`(?:c|cpp|c\+\+)?\n/i, '');
             liveText = liveText.replace(/\`*$/i, ''); // Strip trailing backticks gracefully
             output.textContent = liveText + ' ▮'; // Add blinking cursor feel
          };
          // Immediately hide loader when using Local LLMs so the user sees the start of streaming
          loader.classList.add('hidden');
        }

        let text = await fetchAI(prompt, false, onChunk);

        // Final layout cleanup after completely streamed
        const codeMatch = text.match(/\`\`\`(?:c|cpp|c\+\+)?\n([\s\S]*?)\`\`\`/i);
        if (codeMatch) text = codeMatch[1];
        else text = text.replace(/^\`\`\`(?:c|cpp|c\+\+)?\n/i, '').replace(/\`\`\`$/i, '');

        output.textContent = text.trim() || '// Error parsing AI response';
      } catch (err) {
        output.textContent = '// Failed to generate code: ' + err.message;
      } finally {
        loader.classList.add('hidden');
      }
    }

    function closeCodeTranslator() {
      document.getElementById('code-translator-modal').classList.add('hidden');
    }

    function copyTranslatorCode() {
      const text = document.getElementById('code-translator-output').textContent;
      navigator.clipboard.writeText(text).then(() => {
        if (window.Session) Session.showNotification('Code copied to clipboard!', 'success');
        else alert('Copied!');
      });
    }

    window.generateGraphCode = generateGraphCode;
    window.closeCodeTranslator = closeCodeTranslator;
    window.copyTranslatorCode = copyTranslatorCode;
