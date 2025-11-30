
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

    async function analyzeWithGemini(graphData, deadlockInfo) {
      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) {
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error?.message || `HTTP ${response.status}`;
          console.error('Gemini API Error Details:', data);
          printToCli(`AI Error: ${errorMsg}`, 'error');
          return {
            error: true,
            message: `API Error: ${errorMsg}<br><br><strong>Common issues:</strong><br>• Invalid or expired API key<br>• API key not activated (takes a few minutes after creation)<br>• Rate limit exceeded<br>• Billing not enabled<br><br>Press F12 → Console tab to see full error details`
          };
        }

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          console.error('Unexpected Gemini API response:', data);
          return {
            error: true,
            message: 'Invalid API response format. The API returned unexpected data. Press F12 → Console for details.'
          };
        }

        printToCli('✓ AI Analysis complete', 'success');
        return {
          error: false,
          analysis: data.candidates[0].content.parts[0].text
        };
      } catch (error) {
        console.error('Gemini API Network Exception:', error);
        printToCli(`AI Network Error: ${error.message}`, 'error');
        return {
          error: true,
          message: `Network error: ${error.message}<br><br>• Check your internet connection<br>• Verify API key is correct<br>• Try again in a moment`
        };
      }
    }

    async function requestAIFix() {
      if (!lastDeadlockInfo || !lastDeadlockInfo.hasDeadlock) {
        printToCli('No deadlock to fix!', 'error');
        return;
      }

      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) {
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || `HTTP ${response.status}`);
        }

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid API response');
        }

        let fixText = data.candidates[0].content.parts[0].text;
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

      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) {
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();

        if (!response.ok || !data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('Failed to get AI response');
        }

        const answer = data.candidates[0].content.parts[0].text;
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

      if (!question) return;

      const apiKey = localStorage.getItem('geminiApiKey');
      if (!apiKey) {
        if (window.Session) Session.showNotification('Please configure Gemini API key in Settings', 'error');
        return;
      }

      display.style.display = 'block';
      display.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';

      const prompt = `You are a helpful TA.
          CHALLENGE: "${currentChallenge.title}"
        DESCRIPTION: "${currentChallenge.description}"
      STUDENT QUESTION: "${question}"

      Give a SHORT, helpful hint.Do not give the full answer.Max 2 sentences.`;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        const hint = data.candidates[0].content.parts[0].text;
        display.innerHTML = `<strong>Hint:</strong> ${hint}`;

      } catch (error) {
        display.innerText = "Error getting hint.";
      }
    }
