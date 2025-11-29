    // --- Canvas Interactions ---
    function setMode(m) {
      mode = m;
      selectedNode = null;
      dragLinkStart = null;
      dragLinkEnd = null;
      if (m !== 'select') {
        clearSelection();
      }
      // Change cursor for pan mode
      if (m === 'pan') {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'default';
      }
      document.querySelectorAll('.neo-btn').forEach(b => b.classList.remove('active'));
      const map = {
        process: 'btn-process',
        resource: 'btn-resource',
        link: 'btn-link',
        delete: 'btn-delete',
        select: 'btn-select',
        pan: 'btn-pan'
      };
      const topMap = {
        process: 'btn-process-top',
        resource: 'btn-resource-top',
        link: 'btn-link-top',
        delete: 'btn-delete-top'
      };
      if (map[m]) {
        const btn = document.getElementById(map[m]);
        if (btn) btn.classList.add('active');
      }
      if (topMap[m]) {
        const btn = document.getElementById(topMap[m]);
        if (btn) btn.classList.add('active');
      }
    }

    function getMousePos(e) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left - offsetX) / scale;
      const y = (e.clientY - r.top - offsetY) / scale;
      return { x, y };
    }

    function getNodeAt(x, y) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dist = Math.sqrt((x - n.x) ** 2 + (y - n.y) ** 2);
        if (dist < config.nodeRadius + 5) return n;
      }
      return null;
    }

    function getEdgeAt(x, y) {
      const threshold = 10; // Detection radius
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        const s = getNodeById(e.source);
        const t = getNodeById(e.target);
        if (s && t) {
          // Calculate distance from point (x,y) to line segment (s)-(t)
          const A = x - s.x;
          const B = y - s.y;
          const C = t.x - s.x;
          const D = t.y - s.y;

          const dot = A * C + B * D;
          const len_sq = C * C + D * D;
          let param = -1;
          if (len_sq !== 0) // in case of 0 length line
              param = dot / len_sq;

          let xx, yy;

          if (param < 0) {
            xx = s.x;
            yy = s.y;
          }
          else if (param > 1) {
            xx = t.x;
            yy = t.y;
          }
          else {
            xx = s.x + param * C;
            yy = s.y + param * D;
          }

          const dx = x - xx;
          const dy = y - yy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < threshold) return e;
        }
      }
      return null;
    }

    function updateBatchOpsPosition() {
      const batchOps = document.getElementById('batch-ops');
      const sidebar = document.getElementById('sidebar-tools');
      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        batchOps.style.top = (rect.bottom + 10) + 'px';
      }
    }

    function clearSelection() {
      selectedNodes.clear();
      document.getElementById('batch-ops').style.display = 'none';
      draw();
    }

    function batchDelete() {
      selectedNodes.forEach(nodeId => {
        const node = getNodeById(nodeId);
        if (node) deleteNode(node);
      });
      clearSelection();
      saveState();
    }

    canvas.addEventListener('mousedown', e => {
      const pos = getMousePos(e);
      const node = getNodeAt(pos.x, pos.y);

      // Spectator Mode Check
      if (window.Session && window.Session.activeSession && !window.Session.isHost) {
          // Allow panning (middle click or ctrl+click)
          if (e.button === 1 || (e.button === 0 && e.ctrlKey) || (mode === 'pan' && e.button === 0)) {
             isPanning = true;
             panStartX = e.clientX - offsetX;
             panStartY = e.clientY - offsetY;
             canvas.style.cursor = 'grabbing';
             e.preventDefault();
             return;
          }
          // Block everything else
          return;
      }

      // Pan mode: left-click to pan
      if (mode === 'pan' && e.button === 0) {
        isPanning = true;
        panStartX = e.clientX - offsetX;
        panStartY = e.clientY - offsetY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }

      // Middle mouse button or Ctrl+Click for panning
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        isPanning = true;
        panStartX = e.clientX - offsetX;
        panStartY = e.clientY - offsetY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }

      // Handle selection mode
      if (mode === 'select') {
        if (node) {
          if (e.shiftKey) {
            // Shift+Click: toggle selection
            if (selectedNodes.has(node.id)) selectedNodes.delete(node.id);
            else selectedNodes.add(node.id);
          } else {
            // Regular click: select only this node
            selectedNodes.clear();
            selectedNodes.add(node.id);
          }
          // Show batch ops if nodes selected
          document.getElementById('batch-ops').style.display = selectedNodes.size > 0 ? 'block' : 'none';
          if (selectedNodes.size > 0) updateBatchOpsPosition();
        } else {
          // Start selection box
          if (!e.shiftKey) clearSelection();
          selectionBox = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
        }
        draw();
        return;
      }

      // Drag-to-connect: detect if starting a drag from a node
      // Drag-to-connect: detect if starting a drag from a node
      if (node && mode !== 'delete' && mode !== 'link' && mode !== 'select') {
        dragLinkStart = node;
        dragStartPos = { x: pos.x, y: pos.y };
      }

      if (mode === 'process' || mode === 'resource') {
        if (!node) addNode(mode, pos.x, pos.y);
        else draggingNode = node;
      }
      else if (mode === 'link') {
        if (node) {
          if (!selectedNode) selectedNode = node;
          else {
            if (selectedNode.id !== node.id) addEdge(selectedNode, node);
            selectedNode = null;
          }
        } else selectedNode = null;
      }
      else if (mode === 'delete') {
        if (node) {
          deleteNode(node);
          hoveredNode = null; // Clear hover after delete
        } else {
          const edge = getEdgeAt(pos.x, pos.y);
          if (edge) {
            deleteEdge(edge);
            hoveredEdge = null; // Clear hover after delete
          }
        }
      }

      if (node && mode !== 'delete' && mode !== 'link') openProps(node);
      else if (!node) closeProps();

      draw();
    });

    canvas.addEventListener('mousemove', e => {
      // Spectator Mode Check
      if (window.Session && window.Session.activeSession && !window.Session.isHost) {
          if (isPanning) {
            offsetX = e.clientX - panStartX;
            offsetY = e.clientY - panStartY;
            draw();
          }
          return;
      }
      // Handle panning
      if (isPanning) {
        offsetX = e.clientX - panStartX;
        offsetY = e.clientY - panStartY;
        draw();
        return;
      }

      const pos = getMousePos(e);

      // Update selection box
      if (selectionBox) {
        selectionBox.x2 = pos.x;
        selectionBox.y2 = pos.y;
        draw();
        return;
      }

      // Drag-to-connect preview (only after movement threshold)
      if (dragLinkStart && !draggingNode && dragStartPos) {
        const dx = pos.x - dragStartPos.x;
        const dy = pos.y - dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Activate drag-to-connect only if moved more than 10 pixels
        if (distance > 10) {
          const hoveredNode = getNodeAt(pos.x, pos.y);
          if (hoveredNode && hoveredNode.id !== dragLinkStart.id) {
            dragLinkEnd = hoveredNode;
          } else {
            dragLinkEnd = pos; // Just mouse position for preview
          }
          draw();
          return;
        }
      }

      // Track position for link mode preview
      if (mode === 'link' && selectedNode) {
        tempLinkPos = pos;
        draw();
      } else if (tempLinkPos) {
        tempLinkPos = null;
        draw();
      }

      // Update hover effects
      const hoveredNode = getNodeAt(pos.x, pos.y);
      nodeHoverEffects.clear();

      // Handle delete mode highlighting
      if (mode === 'delete') {
        const node = getNodeAt(pos.x, pos.y);
        const edge = !node ? getEdgeAt(pos.x, pos.y) : null;

        let needsRedraw = false;
        if (window.hoveredNode !== node) {
          window.hoveredNode = node;
          needsRedraw = true;
        }
        if (window.hoveredEdge !== edge) {
          window.hoveredEdge = edge;
          needsRedraw = true;
        }

        if (needsRedraw) {
          draw();
          canvas.style.cursor = (window.hoveredNode || window.hoveredEdge) ? 'pointer' : 'default';
        }
      } else {
        // Reset hover states if not in delete mode
        if (window.hoveredNode || window.hoveredEdge) {
          window.hoveredNode = null;
          window.hoveredEdge = null;
          draw();
        }

        if (hoveredNode && !draggingNode) {
          applyNodeHoverEffect(hoveredNode.id, 1);
          canvas.style.cursor = 'pointer';
        } else {
          canvas.style.cursor = draggingNode ? 'grabbing' : (mode === 'link' && selectedNode ? 'crosshair' : 'default');
        }
      }

      if (draggingNode) {
        draggingNode.x = pos.x;
        draggingNode.y = pos.y;
      }
      draw();
    });

    canvas.addEventListener('mouseup', e => {
      // Spectator Mode Check
      if (window.Session && window.Session.activeSession && !window.Session.isHost) {
          if (isPanning) {
              isPanning = false;
              canvas.style.cursor = (mode === 'pan') ? 'grab' : 'default';
          }
          return;
      }
      if (isPanning) {
        isPanning = false;
        // Restore cursor based on current mode
        canvas.style.cursor = (mode === 'pan') ? 'grab' : 'default';
        return;
      }

      const pos = getMousePos(e);

      // Complete drag-to-connect
      if (dragLinkStart && dragLinkEnd) {
        if (typeof dragLinkEnd === 'object' && dragLinkEnd.id) {
          // dragLinkEnd is a node
          if (dragLinkStart.id !== dragLinkEnd.id) {
            addEdge(dragLinkStart, dragLinkEnd);
            saveState();
          }
        }
      }

      // Reset drag-to-connect state
      dragLinkStart = null;
      dragLinkEnd = null;
      dragStartPos = null;

      // Complete selection box
      if (selectionBox) {
        const { x1, y1, x2, y2 } = selectionBox;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        nodes.forEach(node => {
          if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
            selectedNodes.add(node.id);
          }
        });

        selectionBox = null;
        document.getElementById('batch-ops').style.display = selectedNodes.size > 0 ? 'block' : 'none';
        if (selectedNodes.size > 0) updateBatchOpsPosition();
      }

      draggingNode = null;
      draw();
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate mouse position in world coordinates before zoom
      const worldX = (mouseX - offsetX) / scale;
      const worldY = (mouseY - offsetY) / scale;

      // Update scale
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      scale = Math.max(0.1, Math.min(5, scale * delta));

      // Adjust offset to zoom toward mouse position
      offsetX = mouseX - worldX * scale;
      offsetY = mouseY - worldY * scale;

      draw();
      if (window.updateBackgroundScale) {
        window.updateBackgroundScale(scale);
      }
    }, { passive: false });

    canvas.addEventListener('contextmenu', e => {
      // Spectator Mode Check
      if (window.Session && window.Session.activeSession && !window.Session.isHost) {
          e.preventDefault();
          return;
      }
      e.preventDefault();
      const pos = getMousePos(e);
      const clickedNode = getNodeAt(pos.x, pos.y);
      if (clickedNode) {
        selectedNode = clickedNode;
        openProps(clickedNode);
        draw();
      }
    });
