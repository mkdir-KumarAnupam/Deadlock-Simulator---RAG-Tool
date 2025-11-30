/**
 * Responsive UI Logic
 * Handles dynamic scaling of the toolbar to fit within the viewport.
 */

const ResponsiveUI = {
    init() {
        this.adjustToolbarScale();
        this.handleTabletTerminal();
        window.addEventListener('resize', () => {
            this.adjustToolbarScale();
            this.handleTabletTerminal();
        });

        // Also adjust when toolbar position changes (if we add that feature dynamically)
        // or when other UI elements might shift
        setInterval(() => this.adjustToolbarScale(), 2000); // Periodic check for safety
    },

    adjustToolbarScale() {
        const toolbar = document.getElementById('sidebar-tools');
        if (!toolbar) return;

        // Reset transform to get natural height
        toolbar.style.transform = 'none';

        const container = toolbar.parentElement;
        if (!container) return;

        const containerHeight = container.clientHeight;
        const toolbarHeight = toolbar.offsetHeight;

        // Default top offset - keep this fixed to avoid overlapping the header
        const topOffset = 80;
        const bottomPadding = 20;

        // Calculate available height
        const availableHeight = containerHeight - topOffset - bottomPadding;

        // If it doesn't fit, scale it down
        if (toolbarHeight > availableHeight && availableHeight > 0) {
            const scale = availableHeight / toolbarHeight;
            // Lower the min scale to 0.25 to handle very small screens
            const safeScale = Math.max(0.25, Math.min(1, scale));

            toolbar.style.transformOrigin = 'top right';
            toolbar.style.transform = `scale(${safeScale})`;
            toolbar.style.top = `${topOffset}px`; // Ensure top is reset
        } else {
            toolbar.style.transform = 'none';
            toolbar.style.top = `${topOffset}px`; // Ensure top is reset
        }
    },

    handleTabletTerminal() {
        const isTablet = window.innerWidth <= 1024 || config.isTouchDevice;
        const footer = document.querySelector('footer');
        const toggleBtn = document.getElementById('terminal-toggle-btn');
        const zoomControls = document.getElementById('zoom-controls');

        if (isTablet) {
            // Collapse terminal by default on tablet
            if (!footer.classList.contains('tablet-expanded')) {
                footer.style.display = 'none'; // Initially hide
                toggleBtn.classList.remove('hidden');
                if (zoomControls) zoomControls.style.bottom = '20px';
            }
        } else {
            // Reset for desktop
            footer.style.display = 'flex';
            toggleBtn.classList.add('hidden');
            if (zoomControls) zoomControls.style.bottom = '280px'; // Reset to default CSS value
        }
    }
};

function toggleTabletTerminal() {
    const footer = document.querySelector('footer');
    const toggleBtn = document.getElementById('terminal-toggle-btn');
    const zoomControls = document.getElementById('zoom-controls');
    const simControls = document.getElementById('sim-controls');

    if (footer.style.display === 'none') {
        // Expand
        footer.style.display = 'flex';
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.left = '0';
        footer.style.right = '0';
        footer.style.zIndex = '90';
        footer.style.height = '40vh';
        footer.classList.add('tablet-expanded');

        toggleBtn.style.bottom = '42vh';

        // Move controls up
        if (zoomControls) zoomControls.style.bottom = '42vh';
        if (simControls) simControls.style.bottom = '42vh';
    } else {
        // Collapse
        footer.style.display = 'none';
        footer.classList.remove('tablet-expanded');

        toggleBtn.style.bottom = '1rem';

        // Move controls down
        if (zoomControls) zoomControls.style.bottom = '20px';
        if (simControls) simControls.style.bottom = '80px'; // Above the toggle button/zoom
    }
}

window.toggleTabletTerminal = toggleTabletTerminal;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ResponsiveUI.init();
});

// Expose globally if needed
window.ResponsiveUI = ResponsiveUI;
