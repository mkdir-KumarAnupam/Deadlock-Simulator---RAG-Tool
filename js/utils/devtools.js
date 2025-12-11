// js/utils/devtools.js
// QuickDev: generate nodes, apply circular layout, create NO edges.
// This prevents linking errors entirely.

(function () {
  function findFn(names) {
    for (const n of names) if (typeof window[n] === "function") return window[n];
    return null;
  }

  const addNode = findFn(["addNode", "createNode", "newNode", "create_node"]);
  const refreshCanvas = findFn([
    "refreshCanvas",
    "render",
    "rerender",
    "redraw",
    "refresh",
    "renderCanvas",
  ]);

  window.DevTools = {
    /**
     * generateCircular(numP, numR, options)
     * Creates nodes only (no edges!).
     * Then applies builtin applyCircularLayout() if available.
     */
    generateCircular: function (numP = 5, numR = 4, options = {}) {
      if (!addNode) {
        console.error("DevTools: addNode() not found — cannot create nodes.");
        return;
      }

      const w = window.innerWidth || 1200;
      const h = window.innerHeight || 700;

      const centerX = options.centerX || Math.floor(w * 0.5);
      const centerY = options.centerY || Math.floor(h * 0.45);

      const created = { processes: [], resources: [] };

      // Create Processes
      for (let i = 0; i < numP; i++) {
        let node = null;
        try {
          node = addNode("process", {
            x: centerX,
            y: centerY,
            label: `P${i + 1}`,
          });
        } catch (_) {}

        const id =
          node &&
          (node.id || node._id || node.uid || node.uuid)
            ? node.id || node._id || node.uid || node.uuid
            : null;

        created.processes.push({ id, node });
      }

      // Create Resources
      for (let j = 0; j < numR; j++) {
        let node = null;
        try {
          node = addNode("resource", {
            x: centerX,
            y: centerY,
            label: `R${j + 1}`,
          });
        } catch (_) {}

        const id =
          node &&
          (node.id || node._id || node.uid || node.uuid)
            ? node.id || node._id || node.uid || node.uuid
            : null;

        created.resources.push({ id, node });
      }

      // Apply built-in circular layout if present
      if (typeof window.applyCircularLayout === "function") {
        try {
          window.applyCircularLayout();
          console.log("DevTools: Applied builtin applyCircularLayout()");
        } catch (e) {
          console.warn("DevTools: applyCircularLayout failed.", e);
        }
      }

      // Refresh
      if (refreshCanvas) {
        try {
          refreshCanvas();
        } catch (_) {}
      }

      window.lastDevCreated = created;
      console.log(
        `DevTools: generated ${numP} processes + ${numR} resources (no edges).`
      );

      return created;
    },
  };
})();
