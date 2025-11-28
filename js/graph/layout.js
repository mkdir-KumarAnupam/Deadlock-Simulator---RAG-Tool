    // --- Auto-Layout Functions ---
    function toggleLayoutMenu() {
      const menu = document.getElementById('layout-menu');
      const isVisible = menu.style.display !== 'none';
      menu.style.display = isVisible ? 'none' : 'block';

      if (!isVisible) {
        const layoutBtn = document.getElementById('btn-layout');
        const rect = layoutBtn.getBoundingClientRect();
        menu.style.top = `${rect.top + window.scrollY}px`;
        menu.style.right = `${window.innerWidth - rect.left + 10}px`;
      }
    }

    function applyLayout(type) {
      if (nodes.length === 0) {
        printToCli('No nodes to layout', 'error');
        return;
      }

      saveState();

      switch (type) {
        case 'force':
          applyForceDirectedLayout();
          break;
        case 'tree':
          applyTreeLayout();
          break;
        case 'circular':
          applyCircularLayout();
          break;
      }

      draw();
      printToCli(`Applied ${type} layout`, 'success');
    }

    function applyForceDirectedLayout() {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const iterations = 100;
      const k = Math.sqrt((rect.width * rect.height) / nodes.length);
      const repulsionStrength = k * k;
      const attractionStrength = 0.1;

      // Initialize random positions if needed
      nodes.forEach(node => {
        if (!node.x || !node.y) {
          node.x = centerX + (Math.random() - 0.5) * 100;
          node.y = centerY + (Math.random() - 0.5) * 100;
        }
      });

      // Run force-directed iterations
      for (let iter = 0; iter < iterations; iter++) {
        const forces = new Map();
        nodes.forEach(n => forces.set(n.id, { x: 0, y: 0 }));

        // Repulsion between all nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsionStrength / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            forces.get(n1.id).x -= fx;
            forces.get(n1.id).y -= fy;
            forces.get(n2.id).x += fx;
            forces.get(n2.id).y += fy;
          }
        }

        // Attraction along edges
        edges.forEach(edge => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = attractionStrength * dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          forces.get(source.id).x += fx;
          forces.get(source.id).y += fy;
          forces.get(target.id).x -= fx;
          forces.get(target.id).y -= fy;
        });

        // Apply forces with cooling
        const cooling = 1 - (iter / iterations);
        nodes.forEach(node => {
          const force = forces.get(node.id);
          node.x += force.x * cooling;
          node.y += force.y * cooling;

          // Keep within bounds
          node.x = Math.max(60, Math.min(rect.width - 60, node.x));
          node.y = Math.max(60, Math.min(rect.height - 60, node.y));
        });
      }
    }

    function applyTreeLayout() {
      if (nodes.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const startX = rect.width / 2;
      const startY = 80;
      const levelHeight = 120;
      const minSpacing = 100;

      // Build adjacency list
      const children = new Map();
      const parents = new Map();
      nodes.forEach(n => {
        children.set(n.id, []);
        parents.set(n.id, []);
      });
      edges.forEach(e => {
        children.get(e.source).push(e.target);
        parents.get(e.target).push(e.source);
      });

      // Find root nodes (no incoming edges or processes)
      const roots = nodes.filter(n =>
        parents.get(n.id).length === 0 || n.type === 'process'
      );

      if (roots.length === 0) {
        // Fallback: use first node as root
        roots.push(nodes[0]);
      }

      const visited = new Set();
      const levels = [];

      // BFS to assign levels
      const queue = roots.map(r => ({ node: r, level: 0 }));
      roots.forEach(r => visited.add(r.id));

      while (queue.length > 0) {
        const { node, level } = queue.shift();

        if (!levels[level]) levels[level] = [];
        levels[level].push(node);

        children.get(node.id).forEach(childId => {
          if (!visited.has(childId)) {
            visited.add(childId);
            const childNode = nodes.find(n => n.id === childId);
            if (childNode) queue.push({ node: childNode, level: level + 1 });
          }
        });
      }

      // Handle unvisited nodes (disconnected)
      nodes.forEach(node => {
        if (!visited.has(node.id)) {
          if (!levels[levels.length]) levels[levels.length] = [];
          levels[levels.length - 1].push(node);
        }
      });

      // Position nodes
      levels.forEach((levelNodes, level) => {
        const totalWidth = levelNodes.length * minSpacing;
        const startXLevel = startX - totalWidth / 2;

        levelNodes.forEach((node, index) => {
          node.x = startXLevel + (index + 0.5) * minSpacing;
          node.y = startY + level * levelHeight;
        });
      });
    }

    function applyCircularLayout() {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.35;

      // Separate processes and resources
      const processes = nodes.filter(n => n.type === 'process');
      const resources = nodes.filter(n => n.type === 'resource');

      // Arrange processes on outer circle
      processes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / processes.length - Math.PI / 2;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });

      // Arrange resources on inner circle
      const innerRadius = radius * 0.5;
      resources.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / resources.length - Math.PI / 2;
        node.x = centerX + innerRadius * Math.cos(angle);
        node.y = centerY + innerRadius * Math.sin(angle);
      });

      // If only one type, arrange all on single circle
      if (processes.length === 0 || resources.length === 0) {
        nodes.forEach((node, index) => {
          const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
          node.x = centerX + radius * Math.cos(angle);
          node.y = centerY + radius * Math.sin(angle);
        });
      }
    }
