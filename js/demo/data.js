    function getProblemGanttChart(algorithm) {
      if (algorithm === 'fcfs') {
        // Convoy Effect: Long process blocks short ones
        const processes = [
          { id: 'P1', burst: 20, color: '#ff6b6b', arrival: 0 },
          { id: 'P2', burst: 2, color: '#4ecdc4', arrival: 1 }
        ];

        let chart = '';
        let time = 0;
        processes.forEach(p => {
          const width = p.burst * 12; // Reduced scale
          chart += `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="font-weight: bold; width: 30px; font-size: 12px;">${p.id}</span>
                            <div style="display: flex; align-items: center;">
                                <div style="width: ${width}px; height: 24px; background: ${p.color}; border: 2px solid black; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px;">
                                    ${p.burst}
                                </div>
                            </div>
                        </div>
                    `;
          time += p.burst;
        });

        return {
          description: '<strong>Scenario:</strong> P1 (20 units) arrives first. P2 (2 units) stuck waiting.',
          chart: chart,
          impact: 'CONVOY EFFECT: P2 waits 20 units! Avg wait: 10. If swapped: Avg wait: 1.'
        };
      } else if (algorithm === 'sjf') {
        // Starvation: Long process never runs
        const timeline = [
          { time: '0-2', process: 'P2', burst: 2, color: '#4ecdc4' },
          { time: '2-4', process: 'P3', burst: 2, color: '#95e1d3' },
          { time: '4-?', process: 'P1 WAITING', burst: 0, color: '#ddd' }
        ];

        let chart = timeline.map(entry => `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-weight: bold; width: 80px; font-size: 11px;">${entry.time}</span>
                        <div style="flex: 1; height: 24px; background: ${entry.color}; border: 2px solid black; display: flex; align-items: center; padding: 0 8px; font-weight: bold; font-size: 10px;">
                            ${entry.process}
                        </div>
                    </div>
                `).join('');

        return {
          description: '<strong>Scenario:</strong> P1 (20 units) waiting. Short jobs (2 units) keep arriving.',
          chart: chart,
          impact: 'STARVATION: P1 never executes because short processes keep jumping ahead.'
        };
      } else if (algorithm === 'srtf') {
        // Severe Starvation + Context Switching
        const timeline = [
          { time: '0-2', process: 'P1', remaining: 10, color: '#ff6b6b' },
          { time: '2-4', process: 'P2', remaining: 2, color: '#4ecdc4', preempt: true },
          { time: '4-6', process: 'P1', remaining: 8, color: '#ff6b6b', resume: true },
          { time: '6-8', process: 'P3', remaining: 2, color: '#95e1d3', preempt: true }
        ];

        let chart = timeline.map(entry => `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-weight: bold; width: 60px; font-size: 11px;">${entry.time}</span>
                        <div style="flex: 1; height: 24px; background: ${entry.color}; border: 2px solid black; display: flex; align-items: center; padding: 0 8px; font-weight: bold; font-size: 10px;">
                            ${entry.process} ${entry.preempt ? '[PREEMPT]' : ''}
                        </div>
                    </div>
                `).join('');

        return {
          description: '<strong>Scenario:</strong> P1 trying to run. Short processes keep preempting it.',
          chart: chart,
          impact: 'OVERHEAD: Frequent context switches waste CPU cycles. P1 makes slow progress.'
        };
      } else if (algorithm === 'rr') {
        // Quantum size dilemma
        const largeQuantum = [
          { process: 'P1', width: 80, color: '#ff6b6b' },
          { process: 'P2', width: 80, color: '#4ecdc4' }
        ];

        const smallQuantum = [
          { process: 'P1', width: 15, color: '#ff6b6b' },
          { process: 'P2', width: 15, color: '#4ecdc4' },
          { process: 'P1', width: 15, color: '#ff6b6b' },
          { process: 'P2', width: 15, color: '#4ecdc4' }
        ];

        let chart = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">`;

        // Large Quantum Column
        chart += `<div><div style="font-weight: bold; margin-bottom: 4px; font-size: 11px; color: #e74c3c;">Too Large (Q=10)</div>`;
        chart += largeQuantum.map(p => `
            <div style="height: 20px; background: ${p.color}; border: 2px solid black; margin-bottom: 2px; font-size: 9px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${p.process}</div>
        `).join('');
        chart += `<div style="font-size: 10px; margin-top: 4px;">Behaves like FCFS.</div></div>`;

        // Small Quantum Column
        chart += `<div><div style="font-weight: bold; margin-bottom: 4px; font-size: 11px; color: #e74c3c;">Too Small (Q=1)</div>`;
        chart += smallQuantum.map(p => `
            <div style="height: 20px; background: ${p.color}; border: 2px solid black; margin-bottom: 2px; font-size: 9px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${p.process}</div>
        `).join('');
        chart += `<div style="font-size: 10px; margin-top: 4px;">High Overhead.</div></div>`;

        chart += `</div>`;

        return {
          description: '<strong>Scenario:</strong> Comparing Quantum sizes.',
          chart: chart,
          impact: 'DILEMMA: Large = Unfair (FCFS). Small = Inefficient (Overhead).'
        };
      }
    }
