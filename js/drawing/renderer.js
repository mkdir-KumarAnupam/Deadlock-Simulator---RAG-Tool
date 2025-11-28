    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom and pan transforms
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Update flow animation
      if (isRunning) {
        updateFlowParticles();
      }

      // Draw preview line in link mode
      if (mode === 'link' && selectedNode && tempLinkPos) {
        ctx.save();
        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(selectedNode.x, selectedNode.y);
        ctx.lineTo(tempLinkPos.x, tempLinkPos.y);
        ctx.stroke();

        // Animated dots along preview line
        const distance = Math.sqrt(
          Math.pow(tempLinkPos.x - selectedNode.x, 2) +
          Math.pow(tempLinkPos.y - selectedNode.y, 2)
        );
        const numDots = Math.floor(distance / 30);
        for (let i = 0; i < numDots; i++) {
          const t = (i / numDots) + (animationFrame * 0.01 % 1);
          const x = selectedNode.x + (tempLinkPos.x - selectedNode.x) * (t % 1);
          const y = selectedNode.y + (tempLinkPos.y - selectedNode.y) * (t % 1);
          ctx.fillStyle = '#4a90e2';
          ctx.fillRect(x - 3, y - 3, 6, 6);
        }
        ctx.restore();
      }

      // Draw drag-to-connect preview
      if (dragLinkStart && dragLinkEnd) {
        ctx.save();
        ctx.setLineDash([6, 3]);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(dragLinkStart.x, dragLinkStart.y);
        if (dragLinkEnd.id) {
          // Dragging to a node
          ctx.lineTo(dragLinkEnd.x, dragLinkEnd.y);
        } else {
          // Dragging to mouse position
          ctx.lineTo(dragLinkEnd.x, dragLinkEnd.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw selection box
      if (selectionBox) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        const { x1, y1, x2, y2 } = selectionBox;
        const width = x2 - x1;
        const height = y2 - y1;
        ctx.fillRect(x1, y1, width, height);
        ctx.strokeRect(x1, y1, width, height);
        ctx.restore();
      }

      // Edges (Drawn first so they are behind cards)
      edges.forEach(e => {
        const s = getNodeById(e.source);
        const t = getNodeById(e.target);
        if (s && t) {
          let c = 'black';
          if (deadlockSet.has(s.id) && deadlockSet.has(t.id)) c = config.colors.deadlock;
          drawArrow(s, t, c);

          // Draw edge label
          if (e.label && systemConfig.showEdgeLabels && systemConfig.edgeLabelSize > 0) {
            const midX = (s.x + t.x) / 2;
            const midY = (s.y + t.y) / 2;
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.font = `${systemConfig.edgeLabelSize}px Courier New`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(e.label, midX, midY - 10);
            ctx.fillStyle = 'black';
            ctx.fillText(e.label, midX, midY - 10);
            ctx.restore();
          }
        }
      });

      // Draw flow particles on top of edges
      if (isRunning) {
        drawFlowParticles();
      }

      // Draw all animations
      drawContextSwitchAnimations();
      drawNodeCreationAnimations();
      drawProcessTerminationAnimations();
      drawPulseAnimations();

      // Nodes (Cards)
      nodes.forEach(n => {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rotation || 0);

        const isP = n.type === 'process';
        let color = n.customColor || (isP ? config.colors[n.state.toLowerCase()] : config.colors.resource);

        // Running process bounce
        let bounceOffset = 0;
        if (n.state === 'RUNNING' && isRunning) {
          bounceOffset = Math.sin(animationFrame * 0.15) * 3;
        }
        ctx.translate(0, bounceOffset);

        // Highlight states with simple glow
        if (deadlockSet.has(n.id)) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'red';
        } else if (starvingSet.has(n.id)) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = config.colors.starvation;
        } else if (selectedNode && selectedNode.id === n.id) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        } else if (selectedNodes.has(n.id)) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#6366f1';
        }

        // Shape Background
        ctx.fillStyle = color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;

        if (isP) {
          // Process - Clean elegant circle
          ctx.beginPath();
          ctx.arc(0, 0, config.nodeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Subtle inner accent line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(-2, -2, config.nodeRadius - 6, Math.PI * 0.9, Math.PI * 1.6);
          ctx.stroke();

          // Clean state indicator (top-right)
          if (n.state !== 'TERMINATED') {
            const dotX = config.nodeRadius * 0.65;
            const dotY = -config.nodeRadius * 0.65;
            let dotColor = '#10B981'; // green for ready
            if (n.state === 'RUNNING') dotColor = '#F59E0B'; // amber
            else if (n.state === 'BLOCKED') dotColor = '#EF4444'; // red

            // Simple dot - no shadow
            ctx.fillStyle = dotColor;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Elegant progress arc
          if (n.state !== 'TERMINATED' && n.maxBurst > 0) {
            const pct = n.burstTime / n.maxBurst;
            const startAngle = Math.PI * 0.7;
            const totalAngle = Math.PI * 1.6;

            // Background track
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, config.nodeRadius - 9, startAngle, startAngle + totalAngle);
            ctx.stroke();

            // Progress fill
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, config.nodeRadius - 9, startAngle, startAngle + (totalAngle * pct));
            ctx.stroke();
          }
        } else {
          // Resource - Clean elegant square
          const s = config.nodeRadius * 1.85;
          const cornerRadius = 6;

          // Main rounded square
          ctx.beginPath();
          ctx.moveTo(-s / 2 + cornerRadius, -s / 2);
          ctx.arcTo(s / 2, -s / 2, s / 2, -s / 2 + cornerRadius, cornerRadius);
          ctx.arcTo(s / 2, s / 2, s / 2 - cornerRadius, s / 2, cornerRadius);
          ctx.arcTo(-s / 2, s / 2, -s / 2, s / 2 - cornerRadius, cornerRadius);
          ctx.arcTo(-s / 2, -s / 2, -s / 2 + cornerRadius, -s / 2, cornerRadius);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Minimal diagonal pattern
          ctx.save();
          ctx.clip();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
          ctx.lineWidth = 1.5;
          for (let i = -s * 1.5; i < s * 1.5; i += 14) {
            ctx.beginPath();
            ctx.moveTo(i - s, -s);
            ctx.lineTo(i + s, s);
            ctx.stroke();
          }
          ctx.restore();

          // Subtle highlight accent
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-s / 2 + cornerRadius + 4, -s / 2 + 4);
          ctx.lineTo(s / 2 - 20, -s / 2 + 4);
          ctx.stroke();

          // Clean instance count badge
          if (n.instances > 1) {
            const badgeX = s / 2 - 13;
            const badgeY = -s / 2 + 13;
            const badgeRadius = 10;

            // Simple badge - no shadow
            ctx.fillStyle = '#3B82F6';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Count text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(n.instances, badgeX, badgeY + 1);
          }
        }

        // Clean elegant typography
        ctx.shadowColor = 'transparent';
        ctx.font = 'bold 15px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Simple white outline for contrast
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(n.label, 0, 0);

        // Main text
        ctx.fillStyle = 'black';
        ctx.fillText(n.label, 0, 0);

        // Minimal state indicator
        if (isP && n.state && n.state !== 'TERMINATED') {
          ctx.font = 'bold 9px Courier New';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillText(n.state.charAt(0), 0, 14);
        }

        // Starvation indicator
        if (starvingSet.has(n.id)) {
          const waitTime = processWaitTimes[n.id] || 0;
          ctx.font = 'bold 10px Courier New';
          ctx.fillStyle = config.colors.starvation;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.strokeText('⚠', 0, config.nodeRadius + 18);
          ctx.fillText('⚠', 0, config.nodeRadius + 18);

          // Wait time below warning
          ctx.font = 'bold 8px Courier New';
          ctx.fillStyle = 'rgba(255, 152, 0, 0.8)';
          ctx.fillText(`${waitTime}`, 0, config.nodeRadius + 28);
        }

        // Clean minimal pin
        const pinY = -config.nodeRadius + (isP ? 10 : 8);
        const pinRadius = 6;

        // Pin body
        ctx.fillStyle = '#374151';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, pinY, pinRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center hole
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(0, pinY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Single subtle highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-1.5, pinY - 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Restore transform
      ctx.restore();
    }

    function drawArrow(sourceNode, targetNode, color) {
      // Arrows are drawn normally between centers
      // The visual rotation doesn't change the logical connection point much for circles
      const fromX = sourceNode.x;
      const fromY = sourceNode.y;
      const toX = targetNode.x;
      const toY = targetNode.y;

      const headLength = 12;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const offset = config.nodeRadius + 6; // Clear the pin/border

      const ex = toX - offset * Math.cos(angle);
      const ey = toY - offset * Math.sin(angle);
      const sx = fromX + offset * Math.cos(angle);
      const sy = fromY + offset * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = color;
      ctx.lineWidth = systemConfig.edgeThickness;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLength * Math.cos(angle - Math.PI / 6), ey - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ex - headLength * Math.cos(angle + Math.PI / 6), ey - headLength * Math.sin(angle + Math.PI / 6));
      ctx.fillStyle = color;
      ctx.fill();
    }
