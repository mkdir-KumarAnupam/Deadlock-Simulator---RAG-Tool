    // --- Export/Snapshot ---
    function exportJSON() {
      const data = { nodes, edges, nextId };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'deadlock_sim.json';
      a.click();
      document.getElementById('main-menu').classList.remove('show');
      printToCli("State exported.", 'success');
    }

    function shareWithQR() {
      const data = { nodes, edges, nextId };
      const jsonStr = JSON.stringify(data);

      // Compress using base64 and create URL
      const compressed = btoa(unescape(encodeURIComponent(jsonStr)));
      const shareUrl = `${window.location.origin}${window.location.pathname}?s=${compressed}`;
      const jsonStrFormatted = JSON.stringify(data, null, 2);

      // Create modal for QR code
      const modal = document.createElement('div');
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;';
      modal.innerHTML = `
                <div class="neo-box bg-white p-6" style="max-width: 600px; max-height: 80vh; overflow-y: auto; transform: rotate(-1deg);">
                    <div class="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                        <h3 class="font-black text-lg">SHARE GRAPH</h3>
                        <button onclick="this.closest('[style*=fixed]').remove()" class="text-2xl font-bold hover:text-red-500">&times;</button>
                    </div>
                    <div class="text-center mb-4">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}"
                             alt="QR Code" class="border-4 border-black mx-auto" style="box-shadow: 6px 6px 0px black;">
                        <p class="text-xs mt-2 text-gray-600">Scan to load graph</p>
                    </div>
                    <div class="mb-3">
                        <label class="block text-xs font-bold mb-2">SHARE URL:</label>
                        <input readonly value="${shareUrl}"
                               class="w-full p-2 border-2 border-black font-mono text-xs bg-gray-50"
                               onclick="this.select()">
                        <button onclick="navigator.clipboard.writeText('${shareUrl}'); printToCli('Link copied!', 'success');"
                                class="neo-btn mt-2 w-full">
                            <i class="fas fa-link mr-2"></i> Copy Share Link
                        </button>
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-2">OR COPY JSON:</label>
                        <textarea readonly class="w-full h-32 p-2 border-2 border-black font-mono text-xs bg-gray-50"
                                  onclick="this.select()">${jsonStrFormatted.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                        <button onclick="navigator.clipboard.writeText(\`${jsonStrFormatted.replace(/`/g, '\\`')}\`); printToCli('JSON copied!', 'success');"
                                class="neo-btn mt-2 w-full">
                            <i class="fas fa-copy mr-2"></i> Copy JSON
                        </button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      document.getElementById('main-menu').classList.remove('show');
      printToCli('Share modal opened', 'success');
    }

    window.importJSON = (input) => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          nodes = data.nodes.map(n => ({ ...n, rotation: (Math.random() - 0.5) * 0.25, pinColor: '#333' })); // Re-hydrate props
          edges = data.edges;
          nextId = data.nextId || (nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1);
          if (isRunning) toggleSimulation();
          updateSystemStats();
          draw();
          printToCli('Loaded file.', 'success');
          document.getElementById('main-menu').classList.remove('show');
        } catch (err) { printToCli('Error loading file.', 'error'); }
      };
      reader.readAsText(file);
    };

    function takeSnapshot() {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');

      // Draw Background Pattern
      tCtx.fillStyle = '#fffdf5';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.fillStyle = '#555';
      for (let x = 0; x < tempCanvas.width; x += 20) {
        for (let y = 0; y < tempCanvas.height; y += 20) tCtx.fillRect(x, y, 1, 1);
      }

      tCtx.drawImage(canvas, 0, 0);

      // Overlay
      const lines = Array.from(cliOutput.children).slice(-5).map(el => el.textContent);
      const boxW = 300; const boxH = 100;
      const boxX = tempCanvas.width - boxW - 20;
      const boxY = tempCanvas.height - boxH - 20;

      tCtx.save();
      tCtx.shadowColor = 'rgba(0,0,0,0.5)'; tCtx.shadowBlur = 10;
      tCtx.fillStyle = '#fff';
      tCtx.fillRect(boxX, boxY, boxW, boxH);
      tCtx.restore();

      tCtx.strokeStyle = '#000'; tCtx.lineWidth = 3;
      tCtx.strokeRect(boxX, boxY, boxW, boxH);
      tCtx.fillStyle = '#000'; tCtx.fillRect(boxX, boxY, boxW, 20);
      tCtx.fillStyle = '#fff'; tCtx.font = "bold 10px Courier New";
      tCtx.fillText("TERMINAL_SNAPSHOT", boxX + 5, boxY + 14);
      tCtx.fillStyle = '#000'; tCtx.font = "12px Courier New";
      lines.forEach((line, i) => tCtx.fillText(line.substring(0, 40), boxX + 10, boxY + 35 + (i * 14)));

      const link = document.createElement('a');
      link.download = `rag_snapshot_${Date.now()}.png`;
      link.href = tempCanvas.toDataURL();
      link.click();
      printToCli("Snapshot saved.", 'success');
    }
