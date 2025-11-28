# Codebase Structure & Logic Map

This document outlines the organization of the JavaScript modules in the `Deadlock_SIM` project, detailing where specific logic resides and the approximate size of each module.

## Directory Overview

The JavaScript codebase is located in `d:\Deadlock_SIM\js\` and is organized into the following subdirectories:

- **`core/`**: Essential system components (config, main loop, CLI).
- **`simulation/`**: The core simulation engine (scheduler, deadlock detection).
- **`graph/`**: Graph data structure and manipulation logic.
- **`ui/`**: User interface components and interactions.
- **`drawing/`**: Canvas rendering and animation logic.
- **`modules/`**: Independent feature modules (AI, Scenarios, Challenges).
- **`demo/`**: The Algorithm Demonstration feature.

---

## Detailed Breakdown

### 1. Core (`js/core/`)
Foundational logic for the application.

| File | Logic / Responsibility | Approx. Size |
| :--- | :--- | :--- |
| **`config.js`** | Global configuration (`config`, `systemConfig`) and state variables (`nodes`, `edges`, `isRunning`). | ~120 lines |
| **`main.js`** | Application entry point. Handles initialization, window resize, keyboard shortcuts, and the main animation loop. | ~140 lines |
| **`cli.js`** | Terminal emulation logic. Handles commands like `help`, `add`, `run`, and outputs to the CLI pane. | ~150 lines |
| **`history.js`** | Undo/Redo system implementation. Manages the state stack. | ~100 lines |

### 2. Simulation (`js/simulation/`)
The "brain" of the operating system simulator.

| File | Logic / Responsibility | Approx. Size |
| :--- | :--- | :--- |
| **`scheduler.js`** | Core scheduling logic (`scheduler()`), process state updates, and Gantt chart data generation. | ~350 lines |
| **`controls.js`** | Simulation control functions: `toggleSimulation`, `stepSimulation`, `changeSimSpeed`, `save/restoreSimulationState`. | ~190 lines |
| **`deadlock.js`** | Deadlock detection algorithm (`detectDeadlock`) and cycle detection. | ~90 lines |
| **`starvation.js`** | Starvation detection (`detectStarvation`) and handling logic. | ~240 lines |

### 3. Graph (`js/graph/`)
Logic for managing the node-link diagram.

| File | Logic / Responsibility | Approx. Size |
| :--- | :--- | :--- |
| **`ops.js`** | Basic graph operations: `addNode`, `deleteNode`, `addEdge`, `copyNodes`, `pasteNodes`, `duplicateNodes`. | ~280 lines |
| **`interaction.js`** | Canvas mouse event handlers: `mousedown`, `mousemove`, `mouseup`, `wheel` (zoom/pan). Handles dragging and linking. | ~300 lines |
| **`layout.js`** | Auto-layout algorithms: `applyForceDirectedLayout`, `applyTreeLayout`, `applyCircularLayout`. | ~220 lines |

### 4. UI (`js/ui/`)
User interface management (excluding the canvas).

| File | Logic / Responsibility | Approx. Size |
| :--- | :--- | :--- |
| **`menu.js`** | Logic for the top menu bar (`toggleMenu`, `closeMenu`) and view switching. | ~70 lines |
| **`settings.js`** | Configuration panels: Theme switching, background patterns, system resource settings (CPU, Memory). | ~220 lines |
| **`panels.js`** | Side panels: AI panel, Scenario Library, Stats panel, Properties panel (`openProps`), Legend. | ~300 lines |
| **`export.js`** | Data export/import (`exportJSON`, `importJSON`), QR code sharing, and snapshot functionality. | ~125 lines |

### 5. Drawing (`js/drawing/`)
Visual rendering on the HTML5 Canvas.

| File | Logic / Responsibility | Approx. Size |
| :--- | :--- | :--- |
| **`renderer.js`** | Main `draw()` function. Renders nodes, edges, labels, and selection highlights. | ~360 lines |
| **`animations.js`** | Visual effects: Flow particles, context switch flashes, pulse animations, node creation/deletion effects. | ~290 lines |

### 6. Modules (`js/modules/`)
Self-contained features.

| File | Logic / Responsibility | Approx. Size |
| :--- | :--- | :--- |
| **`ai.js`** | Integration with Google Gemini API for deadlock analysis and suggestions. | ~200 lines |
| **`scenarios.js`** | Static data for pre-defined scenarios (Deadlock, Starvation, etc.) and loading logic. | ~500+ lines |
| **`challenge.js`** | Challenge mode logic: Level generation, goal checking, and success/failure states. | ~200 lines |

### 7. Demo (`js/demo/`)
The interactive "Algorithm Demo" modal.

| File | Logic / Responsibility | Approx. Size |
| :--- | :--- | :--- |
| **`logic.js`** | Simulation logic specific to the demo (`runDemoStep`, `tryAlgorithm`). | ~140 lines |
| **`ui.js`** | Rendering the demo modal, tab switching, and educational content (Advantages/Disadvantages). | ~900 lines |
| **`data.js`** | Static data for the "Problems" tab (Gantt charts for specific algorithm flaws). | ~115 lines |
