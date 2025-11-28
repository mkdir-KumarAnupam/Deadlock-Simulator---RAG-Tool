    // --- Flow Animation ---
    function updateFlowParticles() {
      animationFrame++;

      // Add new arrows every 40 frames
      if (animationFrame % 40 === 0) {
        edges.forEach(e => {
          const s = getNodeById(e.source);
          const t = getNodeById(e.target);
          if (s && t) {
            // Determine direction: Resource -> Process (allocation) or Process -> Resource (request)
            const isAllocation = s.type === 'resource';
            flowParticles.push({
              edge: e,
              progress: 0,
              isAllocation: isAllocation,
              birthFrame: animationFrame
            });
          }
        });
      }

      // Update arrow positions
      flowParticles = flowParticles.filter(p => {
        p.progress += 0.025; // Speed of animation
        return p.progress <= 1.0; // Remove completed arrows
      });
    }

    function drawFlowParticles() {
      flowParticles.forEach(p => {
        const s = getNodeById(p.edge.source);
        const t = getNodeById(p.edge.target);
        if (!s || !t) return;

        const offset = config.nodeRadius + 6;
        const angle = Math.atan2(t.y - s.y, t.x - s.x);

        const sx = s.x + offset * Math.cos(angle);
        const sy = s.y + offset * Math.sin(angle);
        const ex = t.x - offset * Math.cos(angle);
        const ey = t.y - offset * Math.sin(angle);

        // Interpolate position (center of arrow)
        const px = sx + (ex - sx) * p.progress;
        const py = sy + (ey - sy) * p.progress;

        // Draw crisp arrow
        ctx.save();

        // Arrow properties
        const arrowLength = 16;
        const arrowWidth = 8;
        const arrowColor = p.isAllocation ? config.colors.running : config.colors.blocked;

        // Fade effect based on progress
        ctx.globalAlpha = 1 - (p.progress * 0.4);

        ctx.translate(px, py);
        ctx.rotate(angle);

        // Draw arrow body (rectangle)
        ctx.fillStyle = arrowColor;
        ctx.fillRect(-arrowLength / 2, -arrowWidth / 4, arrowLength * 0.6, arrowWidth / 2);

        // Draw arrow head (triangle)
        ctx.beginPath();
        ctx.moveTo(arrowLength * 0.1, 0);
        ctx.lineTo(arrowLength * 0.1 - arrowWidth, -arrowWidth / 1.5);
        ctx.lineTo(arrowLength * 0.1 - arrowWidth, arrowWidth / 1.5);
        ctx.closePath();
        ctx.fill();

        // Add border for crispness
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-arrowLength / 2, -arrowWidth / 4, arrowLength * 0.6, arrowWidth / 2);
        ctx.beginPath();
        ctx.moveTo(arrowLength * 0.1, 0);
        ctx.lineTo(arrowLength * 0.1 - arrowWidth, -arrowWidth / 1.5);
        ctx.lineTo(arrowLength * 0.1 - arrowWidth, arrowWidth / 1.5);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      });
    }

    function triggerContextSwitch(nodeId) {
      contextSwitchAnimations.push({
        nodeId: nodeId,
        startTime: Date.now(),
        duration: 600 // milliseconds
      });
    }

    function drawContextSwitchAnimations() {
      const now = Date.now();
      contextSwitchAnimations = contextSwitchAnimations.filter(anim => {
        const elapsed = now - anim.startTime;
        if (elapsed > anim.duration) return false;

        const node = getNodeById(anim.nodeId);
        if (!node) return false;

        const progress = elapsed / anim.duration;

        ctx.save();

        // Subtle rotating circular brackets around the node
        const rotation = progress * Math.PI * 2;
        const radius = config.nodeRadius + 12;
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

        ctx.lineWidth = 3;
        ctx.lineCap = 'square';

        // Four corner brackets rotating
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i + rotation;
          const x = node.x + Math.cos(angle) * radius;
          const y = node.y + Math.sin(angle) * radius;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + Math.PI / 4);

          // Shadow bracket
          ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.moveTo(-6 + 1, -6 + 1);
          ctx.lineTo(-2 + 1, -6 + 1);
          ctx.lineTo(-2 + 1, -2 + 1);
          ctx.moveTo(6 + 1, 6 + 1);
          ctx.lineTo(2 + 1, 6 + 1);
          ctx.lineTo(2 + 1, 2 + 1);
          ctx.stroke();

          // Main bracket
          ctx.strokeStyle = `rgba(255, 140, 0, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.moveTo(-6, -6);
          ctx.lineTo(-2, -6);
          ctx.lineTo(-2, -2);
          ctx.moveTo(6, 6);
          ctx.lineTo(2, 6);
          ctx.lineTo(2, 2);
          ctx.stroke();

          ctx.restore();
        }

        // Small "CS" text at top
        if (progress > 0.2 && progress < 0.8) {
          const textAlpha = progress < 0.4 ? (progress - 0.2) / 0.2 : (progress < 0.6 ? 1 : (0.8 - progress) / 0.2);

          ctx.font = 'bold 11px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Text shadow
          ctx.fillStyle = `rgba(0, 0, 0, ${textAlpha * 0.4})`;
          ctx.fillText('CS', node.x + 1, node.y - config.nodeRadius - 18 + 1);

          // Main text
          ctx.fillStyle = `rgba(255, 140, 0, ${textAlpha})`;
          ctx.fillText('CS', node.x, node.y - config.nodeRadius - 18);
        }

        ctx.restore();
        return true;
      });
    }

    function drawNodeCreationAnimations() {
      const now = Date.now();
      nodeCreationAnimations = nodeCreationAnimations.filter(anim => {
        const elapsed = now - anim.startTime;
        if (elapsed > anim.duration) return false;

        const progress = elapsed / anim.duration;
        const easeOut = 1 - Math.pow(1 - progress, 3);

        ctx.save();

        // Simple fade-in with gentle scale
        const scale = 0.7 + (easeOut * 0.3); // Scale from 70% to 100%
        const alpha = easeOut;

        // Single expanding ring
        const radius = config.nodeRadius * 0.8 + (progress * 15);
        const ringAlpha = (1 - progress) * 0.5;

        // Shadow ring
        ctx.strokeStyle = `rgba(0, 0, 0, ${ringAlpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(anim.x + 2, anim.y + 2, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Main ring
        ctx.strokeStyle = `rgba(163, 255, 172, ${ringAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Subtle plus indicator at center
        if (progress < 0.5) {
          const plusAlpha = (1 - progress / 0.5) * 0.6;
          const plusSize = 8;

          ctx.strokeStyle = `rgba(0, 0, 0, ${plusAlpha * 0.3})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(anim.x - plusSize + 1, anim.y + 1);
          ctx.lineTo(anim.x + plusSize + 1, anim.y + 1);
          ctx.moveTo(anim.x + 1, anim.y - plusSize + 1);
          ctx.lineTo(anim.x + 1, anim.y + plusSize + 1);
          ctx.stroke();

          ctx.strokeStyle = `rgba(163, 255, 172, ${plusAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(anim.x - plusSize, anim.y);
          ctx.lineTo(anim.x + plusSize, anim.y);
          ctx.moveTo(anim.x, anim.y - plusSize);
          ctx.lineTo(anim.x, anim.y + plusSize);
          ctx.stroke();
        }

        ctx.restore();
        return true;
      });
    }

    function drawProcessTerminationAnimations() {
      const now = Date.now();
      processTerminationAnimations = processTerminationAnimations.filter(anim => {
        const elapsed = now - anim.startTime;
        if (elapsed > anim.duration) return false;

        const progress = elapsed / anim.duration;

        ctx.save();

        // Exploding squares outward
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          const distance = progress * 60;
          const x = anim.x + Math.cos(angle) * distance;
          const y = anim.y + Math.sin(angle) * distance;
          const size = 12 * (1 - progress);
          const alpha = 1 - progress;

          // Square particle
          ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);

          // Border
          ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        }

        // "DONE" text
        if (progress < 0.5) {
          ctx.fillStyle = 'black';
          ctx.font = 'bold 14px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('✓', anim.x + 2, anim.y + 2);
          ctx.fillStyle = '#4caf50';
          ctx.fillText('✓', anim.x, anim.y);
        }

        ctx.restore();
        return true;
      });
    }

    function drawPulseAnimations() {
      // Pulse animations removed - no longer used
      pulseAnimations = [];
    }

    function applyNodeHoverEffect(nodeId, intensity) {
      nodeHoverEffects.set(nodeId, intensity);
    }        // --- Drawing ---
