    // --- Configuration ---
    const config = {
      nodeRadius: 30, // Slightly larger for paper feel
      colors: {
        ready: '#a3ffac',
        running: '#FFD700',
        blocked: '#FF6B9D',
        terminated: '#C0C0C0',
        resource: '#5D9CEC',
        highlight: '#FFD700',
        deadlock: '#FF3366',
        starvation: '#FF9800' // Orange for starvation
      },
      totalMemory: 1024
    };

    // System Configuration
    let lastDeadlockInfo = null; // Store last deadlock analysis for AI fix
    let systemConfig = {
      maxMemory: 1024,
      cpuCores: 1,
      contextSwitchTime: 5,
      simSpeed: 200,
      edgeLabelSize: 10,
      showEdgeLabels: true,
      edgeThickness: 3,
      uiScale: 0.8
    };

    // --- State ---
    let nodes = [];
    let edges = [];
    let nextId = 1;
    let isRunning = false;
    let simInterval = null;
    let currentRunningNodeId = null;
    let simSpeed = 200;
    let mode = 'process';
    let selectedNode = null;
    let draggingNode = null;
    let deadlockSet = new Set();
    let starvingSet = new Set(); // Processes experiencing starvation
    let processWaitTimes = {}; // Track how long each process has been waiting
    let starvationThreshold = 50; // Cycles before considering starvation
    let tempLinkPos = null; // Track mouse position in link mode

    // Drag-to-connect
    let dragLinkStart = null; // Starting node for drag-to-connect
    let dragLinkEnd = null; // Current mouse position or target node
    let dragStartPos = null; // Initial mouse position to detect movement threshold

    // Batch operations
    let selectedNodes = new Set(); // Set of selected node IDs
    let isSelectionMode = false;
    let selectionBox = null; // {x1, y1, x2, y2} for box selection

    // Copy/Paste
    let clipboard = null; // Stores copied nodes and edges
    let pasteOffset = 40; // Offset for pasted nodes
    let lastPastePosition = null; // Track last paste position

    // Zoom & Pan
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;

    // Scheduling State
    let schedulingAlgorithm = 'fcfs';
    let timeQuantum = 20;
    let quantumRemaining = 20;
    let processStartTimes = {}; // Track when process first starts for response time

    // Simulation Control
    let stepSize = 1; // Number of cycles to step forward/backward
    let simulationHistory = []; // Store simulation states for step back
    let maxHistorySize = 100; // Limit history to prevent memory issues
    let showClearWarning = true; // Show warning before clearing board

    // Gantt Data
    let ganttData = [];
    let lastGanttEntry = null;

    // Process Metrics
    let processMetrics = {}; // Stores timing metrics for each process
    let contextSwitchCount = 0;

    // Flow Animation State
    let flowParticles = []; // Array of {edge, progress, direction}
    let animationFrame = 0;

    // Context Switch Animation State
    let contextSwitchAnimations = []; // Array of {nodeId, startTime, duration}

    // Additional Animation States
    let nodeCreationAnimations = []; // Node spawn animations
    let processTerminationAnimations = []; // Process completion effects
    let buttonClickAnimations = []; // Button press effects
    let nodeHoverEffects = new Map(); // nodeId -> hover intensity
    let pulseAnimations = []; // Background pulse effects

    // Undo/Redo System
    let history = [];
    let historyIndex = -1;
    const MAX_HISTORY = 50;

    // Stats tracking
    let simulationTime = 0;
    let simulationStartTime = 0;

    // --- DOM Elements ---
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    const cliOutput = document.getElementById('cli-output');
    const cliInput = document.getElementById('cli-input');
    const propPanel = document.getElementById('prop-panel');

