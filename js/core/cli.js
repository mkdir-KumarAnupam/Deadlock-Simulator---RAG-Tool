
    // --- Stats & CLI ---
    function updateSystemStats() {
      const dot = (n) => `<div class="queue-item" style="background:${config.colors[n.state.toLowerCase()] || '#fff'}">${n.label}</div>`;
      document.getElementById('queue-ready').innerHTML = nodes.filter(n => n.type === 'process' && n.state === 'READY').map(dot).join('');
      document.getElementById('queue-running').innerHTML = nodes.filter(n => n.type === 'process' && n.state === 'RUNNING').map(dot).join('');
      document.getElementById('queue-blocked').innerHTML = nodes.filter(n => n.type === 'process' && n.state === 'BLOCKED').map(dot).join('');

      const activeProcs = nodes.filter(n => n.type === 'process' && n.state !== 'TERMINATED');
      const usedMem = activeProcs.reduce((acc, n) => acc + n.memory, 0);
      const pct = Math.min((usedMem / config.totalMemory) * 100, 100);
      document.getElementById('mem-bar').style.width = `${pct}%`;
      document.getElementById('mem-bar').className = `h-full transition-all duration-300 ${pct > 90 ? 'bg-red-600' : 'bg-blue-500'}`;
      document.getElementById('mem-text').innerText = `${usedMem}/${config.totalMemory} MB`;
    }

    function printToCli(text, type = 'normal') {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timestamp = `${hours}:${minutes}`;

      const div = document.createElement('div');
      div.textContent = `${timestamp} ${text}`;
      if (type === 'error') div.style.color = 'red';
      if (type === 'success') div.style.color = 'green';
      if (type === 'info') div.style.color = 'blue';
      cliOutput.appendChild(div);
      cliOutput.scrollTop = cliOutput.scrollHeight;
    }

    cliInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const cmd = this.value.trim();
        if (cmd) {
          printToCli(`user@sys:~$ ${cmd}`);
          executeCommand(cmd);
        }
        this.value = '';
      }
    });

    function executeCommand(cmdStr) {
      const parts = cmdStr.split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (cmd) {
        case 'help':
          printToCli("gencircle <P> <R> : Generate P processes and R resources in circular layout");
          printToCli("ap [burst]    : Add Process");
          printToCli("ar            : Add Resource");
          printToCli("link [u] [v]  : Link Nodes");
          printToCli("dealloc [p] [r]: Remove Allocation");
          printToCli("run / stop    : Control Sim");
          printToCli("check         : Deadlock Check");
          printToCli("clear         : Reset");
          printToCli("load [name]   : Load Scenario");
          printToCli("sched [algo]  : Set Scheduler (fcfs/sjf/srtf/rr)");
          printToCli("quantum [n]   : Set RR Quantum");
          break;
        case 'dealloc':
          if (args.length < 2) printToCli("Usage: dealloc [process] [resource]", 'error');
          else {
            const pName = args[0];
            const rName = args[1];
            const pNode = nodes.find(n => n.label.toLowerCase() === pName.toLowerCase() && n.type === 'process');
            const rNode = nodes.find(n => n.label.toLowerCase() === rName.toLowerCase() && n.type === 'resource');

            if (!pNode) printToCli(`Process '${pName}' not found`, 'error');
            else if (!rNode) printToCli(`Resource '${rName}' not found`, 'error');
            else {
              // Find allocation edge (Resource -> Process)
              const edge = edges.find(e => e.source === rNode.id && e.target === pNode.id);
              if (edge) {
                deleteEdge(edge);
                printToCli(`Deallocated ${rNode.label} from ${pNode.label}`, 'success');
              } else {
                printToCli(`No allocation found between ${rNode.label} and ${pNode.label}`, 'error');
              }
            }
          }
          break;
        case 'ap':
          addNode('process', 100 + Math.random() * 200, 100 + Math.random() * 200).burstTime = args[0] || 100;
          break;
        case 'ar':
          addNode('resource', 100 + Math.random() * 200, 100 + Math.random() * 200);
          break;
        case 'gencircle':
          // usage: gencircle <P> <R>
          (function(){
            const p = parseInt(args[0], 10) || 5;
            const r = parseInt(args[1], 10) || 4;

            if (typeof window.DevTools === 'undefined' || typeof window.DevTools.generateCircular !== 'function') {
              printToCli("DevTools.generateCircular not found. Make sure js/utils/devtools.js is loaded.", 'error');
              return;
            }

            try {
              const created = window.DevTools.generateCircular(p, r);
              printToCli(`gencircle: created ${p} processes and ${r} resources.`, 'success');
              // Also set lastDevCreated in case code expects it
              window.lastDevCreated = created;
            } catch (e) {
              console.error(e);
              printToCli("gencircle: failed to generate nodes. See console for details.", 'error');
            }
          })();
          break;

        case 'link':
          if (args.length < 2) printToCli("Need 2 labels", 'error');
          else {
            const n1 = nodes.find(n => n.label.toLowerCase() === args[0].toLowerCase());
            const n2 = nodes.find(n => n.label.toLowerCase() === args[1].toLowerCase());
            if (n1 && n2) addEdge(n1, n2);
            else printToCli("Nodes not found", 'error');
          }
          break;
        case 'run': if (!isRunning) toggleSimulation(); break;
        case 'check': detectDeadlock(false); break;
        case 'clear': resetGraph(); break;
        case 'load':
          if (args[0]) loadScenario(args[0]);
          else printToCli("Available: simple_deadlock, circular_wait, safe_state", 'info');
          break;
        case 'sched':
        case 'scheduler':
          if (args[0]) {
            const algo = args[0].toLowerCase();
            const labelMap = { 'fcfs': 'FCFS', 'sjf': 'SJF', 'srtf': 'SRTF', 'rr': 'Round Robin' };
            if (['fcfs', 'sjf', 'srtf', 'rr'].includes(algo)) {
              selectScheduler(algo, labelMap[algo]);
            } else {
              printToCli("Invalid algorithm. Use: fcfs, sjf, srtf, or rr", 'error');
            }
          } else {
            printToCli(`Current: ${schedulingAlgorithm.toUpperCase()}`, 'info');
          }
          break;
        case 'quantum':
          if (args[0]) {
            const q = parseInt(args[0]);
            if (q >= 5 && q <= 100) {
              document.getElementById('quantum-input').value = q;
              timeQuantum = q;
              quantumRemaining = q;
              printToCli(`Quantum set to: ${q}`, 'success');
            } else {
              printToCli("Quantum must be between 5 and 100", 'error');
            }
          } else {
            printToCli(`Current quantum: ${timeQuantum}`, 'info');
          }
          break;
        default: printToCli("Unknown command", 'error');
      }
    }
