/**
 * Tutorial Manager
 * Guides users through the application features with an interactive overlay.
 */

class TutorialManager {
    constructor() {
        console.log("TutorialManager initialized");
        this.currentStep = 0;
        this.isActive = false;
        this.steps = [
            {
                target: '.neo-title',
                title: 'Welcome to Deadlock Sim!',
                description: 'This is a graphical simulator for Resource Allocation Graphs. You can visualize processes, resources, and detect deadlocks.',
                position: 'bottom'
            },
            {
                target: '#canvas-container',
                title: 'The Canvas',
                description: 'This is your workspace. Click "Add Process" or "Add Resource" in the toolbar, then click here to place them. Drag to move nodes around.',
                position: 'center'
            },
            {
                target: '#sidebar-tools',
                title: 'Toolbar',
                description: 'Use these tools to switch modes: Add Process, Add Resource, or Link mode. You can also Select, Delete, and Clear the board.',
                position: 'left'
            },
            {
                target: '#tools-dropdown-container',
                title: 'Tools Menu',
                description: 'Access advanced tools here: <b>Detect Deadlock</b>, <b>Detect Starvation</b>, and the <b>Banker\'s Algorithm</b> visualizer.',
                position: 'left'
            },
            {
                target: 'button[onclick="takeSnapshot()"]',
                title: 'Snapshot',
                description: 'Click this <b>Camera</b> button to save an image of your current graph.',
                position: 'bottom'
            },
            {
                target: '#prop-panel',
                title: 'Properties Panel',
                description: 'When a Process is selected, use this panel to set its <b>Burst Time</b> (CPU needed) and <b>Priority</b>. These affect how the OS schedules it.',
                position: 'left'
            },
            {
                target: '#sim-controls',
                title: 'Simulation Controls',
                description: '<b>Start:</b> Run the OS scheduler.<br><b>Step:</b> Execute one cycle at a time.<br><b>Speed:</b> Slow down to watch the graph updates.',
                position: 'top'
            },
            {
                target: 'button[onclick*="scheduler-menu"]', // Target the scheduler button
                title: 'Algorithms',
                description: 'Choose a scheduling algorithm (FCFS, SJF, Round Robin, etc.). Click the <b>Eye Icon</b> next to an algorithm to see a demo of how it works!',
                position: 'bottom'
            },
            {
                target: '#canvas-container', // Point back to canvas for deadlock
                title: 'Identifying Deadlocks',
                description: 'If processes form a <b>Cycle</b> (circular dependency) and resources are exhausted, the cycle turns <b>RED</b>. This indicates a Deadlock!',
                position: 'center'
            },
            {
                target: '#scenario-ui-container',
                title: 'Scenario Library',
                description: 'Explore pre-built scenarios like "Simple Deadlock" or "Starvation" to learn common OS concepts.',
                position: 'bottom'
            },
            {
                target: '.stats-toggle-btn',
                title: 'Live Stats',
                description: 'Click this bar to open the <b>Live Stats Pane</b>. Monitor CPU utilization, process states, and resource allocation in real-time.',
                position: 'top'
            },
            {
                target: '#zoom-controls',
                title: 'Zoom Controls',
                description: 'Use these buttons to <b>Zoom In/Out</b>, <b>Fit to Screen</b>, or <b>Pan</b> around large graphs.',
                position: 'right'
            },
            {
                target: '#ai-panel-toggle',
                title: 'AI Assistant',
                description: 'Stuck? Open the AI Assistant to ask: "Why is there a deadlock?" or "How do I fix this?".',
                position: 'left'
            },
            {
                target: '.neo-title',
                title: 'Explore More',
                description: 'Check the menu for Saving/Loading, Cloud Storage, and more. Have fun exploring!',
                position: 'bottom'
            }
        ];
    }

    start() {
        console.log("Tutorial started");
        try {
            if (this.isActive) return;
            this.isActive = true;
            this.currentStep = 0;
            this.createOverlay();
            this.showStep();

            const menu = document.getElementById('main-menu');
            if (menu) menu.classList.remove('show');
        } catch (e) {
            console.error("Error starting tutorial:", e);
        }
    }

    createOverlay() {
        if (!document.getElementById('tutorial-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'tutorial-overlay';
            overlay.className = 'tutorial-overlay';
            document.body.appendChild(overlay);

            const tooltip = document.createElement('div');
            tooltip.id = 'tutorial-tooltip';
            tooltip.className = 'tutorial-tooltip';
            document.body.appendChild(tooltip);
        }

        document.getElementById('tutorial-overlay').style.display = 'block';
        document.getElementById('tutorial-tooltip').style.display = 'block';
    }

    showStep() {
        const tooltip = document.getElementById('tutorial-tooltip');
        const step = this.steps[this.currentStep];
        const target = document.querySelector(step.target);

        // Remove previous highlights and restore styles
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            if (el.dataset.tutorialOriginalPosition !== undefined) {
                el.style.position = el.dataset.tutorialOriginalPosition;
                delete el.dataset.tutorialOriginalPosition;
            } else {
                el.style.position = '';
            }

            if (el.dataset.tutorialOriginalZIndex !== undefined) {
                el.style.zIndex = el.dataset.tutorialOriginalZIndex;
                delete el.dataset.tutorialOriginalZIndex;
            } else {
                el.style.zIndex = '';
            }
        });

        // 1. Update Content immediately (or after a very short fade out if desired)
        // To fix jank, we avoid the 'await' delay. We just update content and position.
        // If we want a transition, we can use a simple opacity fade.

        tooltip.style.opacity = '0';

        setTimeout(() => {
             if (target) {
                // Save original styles BEFORE modifying
                target.dataset.tutorialOriginalPosition = target.style.position;
                target.dataset.tutorialOriginalZIndex = target.style.zIndex;

                target.classList.add('tutorial-highlight');
                const computedStyle = window.getComputedStyle(target);
                if (computedStyle.position === 'static') {
                    target.style.position = 'relative';
                }
                target.style.zIndex = '10010';
                this.positionTooltip(target, tooltip, step.position);
            } else {
                tooltip.style.top = '50%';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translate(-50%, -50%)';
            }

            tooltip.innerHTML = `
                <div class="tutorial-header">
                    <h3>${step.title}</h3>
                    <span class="tutorial-step-count">${this.currentStep + 1}/${this.steps.length}</span>
                </div>
                <div class="tutorial-body">
                    <p>${step.description}</p>
                </div>
                <div class="tutorial-footer">
                    <button onclick="Tutorial.end()" class="neo-btn-sm text-gray-500">Skip</button>
                    <div class="flex gap-2">
                        ${this.currentStep > 0 ? `<button onclick="Tutorial.prev()" class="neo-btn-sm">Prev</button>` : ''}
                        <button onclick="Tutorial.next()" class="neo-btn-sm primary">${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}</button>
                    </div>
                </div>
            `;

            // Fade back in
            tooltip.style.transition = 'opacity 0.2s ease';
            tooltip.style.opacity = '1';
        }, 150); // Short delay for fade out
    }

    positionTooltip(target, tooltip, position) {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 300;
        const tooltipHeight = tooltip.offsetHeight || 200;
        const gap = 15;
        const padding = 10;

        let top, left;

        tooltip.style.transform = '';

        const fitsTop = (y) => y >= padding;
        const fitsBottom = (y) => y + tooltipHeight <= window.innerHeight - padding;

        switch (position) {
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'top':
                top = rect.top - gap - tooltipHeight;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'left':
                top = rect.top;
                left = rect.left - gap - tooltipWidth;
                break;
            case 'right':
                top = rect.top;
                left = rect.right + gap;
                break;
            case 'center':
            default:
                top = (window.innerHeight / 2) - (tooltipHeight / 2);
                left = (window.innerWidth / 2) - (tooltipWidth / 2);
                break;
        }

        if (left < padding) left = padding;
        if (left + tooltipWidth > window.innerWidth - padding) left = window.innerWidth - tooltipWidth - padding;

        if (position === 'top' && !fitsTop(top)) top = rect.bottom + gap;
        else if (position === 'bottom' && !fitsBottom(top)) top = rect.top - gap - tooltipHeight;

        if (top < padding) top = padding;
        if (top + tooltipHeight > window.innerHeight - padding) top = window.innerHeight - tooltipHeight - padding;

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep();
        } else {
            this.end();
        }
    }

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }

    end() {
        this.isActive = false;
        const overlay = document.getElementById('tutorial-overlay');
        const tooltip = document.getElementById('tutorial-tooltip');

        if (overlay) overlay.style.display = 'none';
        if (tooltip) tooltip.style.display = 'none';

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            if (el.dataset.tutorialOriginalPosition !== undefined) {
                el.style.position = el.dataset.tutorialOriginalPosition;
                delete el.dataset.tutorialOriginalPosition;
            } else {
                el.style.position = '';
            }

            if (el.dataset.tutorialOriginalZIndex !== undefined) {
                el.style.zIndex = el.dataset.tutorialOriginalZIndex;
                delete el.dataset.tutorialOriginalZIndex;
            } else {
                el.style.zIndex = '';
            }
        });
    }
}

const Tutorial = new TutorialManager();
window.Tutorial = Tutorial;
console.log("Tutorial module loaded");
if (typeof TutorialManager === 'undefined') {
    console.error("TutorialManager class not defined!");
}
