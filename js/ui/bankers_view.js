
/**
 * Banker's Algorithm Visualization
 * Renders the matrix and safe sequence.
 */

const BankersView = {
    togglePanel() {
        const panel = document.getElementById('bankers-panel');
        if (panel) {
            const isHidden = panel.style.transform === 'translateX(100%)' || panel.style.transform === '';
            panel.style.transform = isHidden ? 'translateX(0)' : 'translateX(100%)';

            if (isHidden) {
                this.renderTable();
                // Auto-run safety check when opening
                setTimeout(() => this.runSafetyCheck(), 300);
            }
        }
    },

    renderTable() {
        const container = document.getElementById('bankers-matrix-container');
        const processes = nodes.filter(n => n.type === 'process');
        const resources = nodes.filter(n => n.type === 'resource');

        if (processes.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 text-xl mt-10">No processes found. Add processes to the graph.</div>';
            return;
        }

        const need = Bankers.calculateNeed();
        const available = Bankers.calculateAvailable();

        let html = `
        <table class="w-full border-collapse text-sm">
            <thead>
                <tr>
                    <th class="border-2 border-black p-2 bg-gray-200" rowspan="2">Process</th>
                    <th class="border-2 border-black p-2 bg-blue-100" colspan="${resources.length}">Allocation</th>
                    <th class="border-2 border-black p-2 bg-purple-100" colspan="${resources.length}">Max Claim</th>
                    <th class="border-2 border-black p-2 bg-red-100" colspan="${resources.length}">Need</th>
                    <th class="border-2 border-black p-2 bg-green-100" colspan="${resources.length}">Available</th>
                </tr>
                <tr>
                    ${resources.map(r => `<th class="border-2 border-black p-1 bg-blue-50 text-xs">${r.label}</th>`).join('')}
                    ${resources.map(r => `<th class="border-2 border-black p-1 bg-purple-50 text-xs">${r.label}</th>`).join('')}
                    ${resources.map(r => `<th class="border-2 border-black p-1 bg-red-50 text-xs">${r.label}</th>`).join('')}
                    ${resources.map(r => `<th class="border-2 border-black p-1 bg-green-50 text-xs">${r.label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
        `;

        processes.forEach((p, index) => {
            html += `<tr class="hover:bg-yellow-50 transition-colors" id="row-${p.id}">`;
            html += `<td class="border-2 border-black p-2 font-bold text-center">${p.label}</td>`;

            // Allocation
            resources.forEach(r => {
                const alloc = edges.filter(e => e.source === r.id && e.target === p.id).length;
                html += `<td class="border-2 border-black p-2 text-center">${alloc}</td>`;
            });

            // Max
            resources.forEach(r => {
                const max = (p.maxClaim && p.maxClaim[r.id]) || 0;
                html += `<td class="border-2 border-black p-2 text-center font-mono">${max}</td>`;
            });

            // Need
            resources.forEach(r => {
                const n = need[p.id][r.id];
                html += `<td class="border-2 border-black p-2 text-center font-bold text-red-600">${n}</td>`;
            });

            // Available (Only show on first row for initial state)
            if (index === 0) {
                resources.forEach(r => {
                    html += `<td class="border-2 border-black p-2 text-center font-bold text-green-600 bg-green-50" rowspan="${processes.length}">${available[r.id]}</td>`;
                });
            }

            html += `</tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    runSafetyCheck() {
        const resultDiv = document.getElementById('safety-result');
        resultDiv.innerHTML = '<span class="text-blue-600">CALCULATING...</span>';
        resultDiv.className = 'text-center font-bold text-sm min-h-[40px] flex items-center justify-center border-2 border-black bg-white';

        printToCli("> Starting Banker's Safety Algorithm...", 'info');

        const result = Bankers.checkSafety();

        // Simulate step-by-step logging to CLI
        let delay = 0;
        result.log.forEach(msg => {
            setTimeout(() => {
                printToCli(`> ${msg}`);
            }, delay);
            delay += 300;
        });

        setTimeout(() => {
            if (result.safe) {
                resultDiv.innerHTML = '<span class="text-green-700">SYSTEM IS SAFE</span> <i class="fas fa-check ml-2 text-green-600"></i>';
                resultDiv.className = 'text-center font-bold text-sm min-h-[40px] flex items-center justify-center border-2 border-green-600 bg-green-100 shadow-[2px_2px_0_#16a34a]';
                printToCli(`> SAFE SEQUENCE: < ${result.sequence.map(p => p.label).join(', ')} >`, 'success');

                // Animate rows
                result.sequence.forEach((p, i) => {
                    setTimeout(() => {
                        const row = document.getElementById(`row-${p.id}`);
                        if (row) {
                            row.style.backgroundColor = '#a3ffac';
                            // Removed scale transform to avoid table layout glitches
                        }
                    }, i * 500);
                });

            } else {
                resultDiv.innerHTML = '<span class="text-red-700">DEADLOCK POSSIBLE</span> <i class="fas fa-exclamation-triangle ml-2 text-red-600"></i>';
                resultDiv.className = 'text-center font-bold text-sm min-h-[40px] flex items-center justify-center border-2 border-red-600 bg-red-100 shadow-[2px_2px_0_#dc2626]';
                printToCli("> SYSTEM IS UNSAFE! Deadlock is possible.", 'error');
            }
        }, delay);
    },
    downloadTableAsPNG() {
        const element = document.getElementById('bankers-matrix-container');
        if (!element) return;

        // Visual feedback
        const btn = document.querySelector('button[onclick="BankersView.downloadTableAsPNG()"]');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        if (typeof html2canvas === 'undefined') {
            printToCli("Error: html2canvas library not loaded.", "error");
            btn.innerHTML = originalContent;
            return;
        }

        html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2 // Higher quality
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'bankers-algorithm-table.png';
            link.href = canvas.toDataURL();
            link.click();

            btn.innerHTML = '<i class="fas fa-check text-green-600"></i>';
            setTimeout(() => btn.innerHTML = originalContent, 2000);
            printToCli("Table downloaded successfully.", "success");
        }).catch(err => {
            console.error(err);
            printToCli("Failed to capture table.", "error");
            btn.innerHTML = originalContent;
        });
    }
};

window.BankersView = BankersView;
