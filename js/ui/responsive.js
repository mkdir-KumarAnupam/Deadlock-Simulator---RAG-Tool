/**
 * Responsive UI Logic
 * Handles dynamic scaling of the toolbar to fit within the viewport.
 */

const ResponsiveUI = {
    init() {
        this.adjustToolbarScale();
        this.handleTabletTerminal();
        this.handleTabletStats();
        window.addEventListener('resize', () => {
            this.adjustToolbarScale();
            this.handleTabletTerminal();
            this.handleTabletStats();
        });

        // Also adjust when toolbar position changes (if we add that feature dynamically)
        // or when other UI elements might shift
        setInterval(() => {
            this.adjustToolbarScale();
            this.handleTabletStats(); // Keep stats button synced
        }, 2000);
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

        // Dynamic top offset based on device
        const isTablet = window.innerWidth <= 1024 || config.isTouchDevice;
        const topOffset = isTablet ? 10 : 80; // 10px for tablet, 80px for desktop
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
    },

    handleTabletStats() {
        const isTablet = window.innerWidth <= 1024 || config.isTouchDevice;
        const statsBtn = document.querySelector('.stats-toggle-btn');
        const zoomControls = document.getElementById('zoom-controls');

        if (!statsBtn || !zoomControls) return;

        if (isTablet) {
            // Get zoom controls bottom position
            // We need to compute it because it might be set via style or class
            const zoomStyle = window.getComputedStyle(zoomControls);
            const zoomBottom = parseInt(zoomStyle.bottom);
            const zoomHeight = zoomControls.offsetHeight;

            // Calculate new bottom for stats button
            // 20px gap above zoom controls
            const newBottom = zoomBottom + zoomHeight + 20;

            // Use absolute positioning relative to the pane so it moves with it
            statsBtn.style.position = 'absolute';
            statsBtn.style.left = '370px'; // 350px (pane width) + 20px gap
            statsBtn.style.right = 'auto';
            statsBtn.style.top = 'auto';
            statsBtn.style.bottom = `${newBottom}px`;
            statsBtn.style.zIndex = '10006';
        } else {
            // Reset to desktop defaults (let CSS handle it)
            statsBtn.style.position = '';
            statsBtn.style.left = '';
            statsBtn.style.right = '';
            statsBtn.style.top = '';
            statsBtn.style.bottom = '';
            statsBtn.style.zIndex = '';
        }
    }
};

function toggleTabletTerminal() {
    const footer = document.querySelector('footer');
    const zoomControls = document.getElementById('zoom-controls');
    const simControls = document.getElementById('sim-controls');
    const sidebar = document.getElementById('sidebar-tools');

    const isTablet = window.innerWidth <= 1024 || config.isTouchDevice;
    const topOffset = isTablet ? '10px' : '80px';

    if (footer.style.display === 'none') {
        // Expand
        footer.style.display = 'flex';
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.left = '0';
        footer.style.right = '0';
        footer.style.zIndex = '90';
        footer.style.height = '35vh'; // Increased height as requested
        footer.classList.add('tablet-expanded');

        // Move controls up
        if (zoomControls) zoomControls.style.bottom = '37vh';
        if (simControls) simControls.style.bottom = '37vh';

        // Enforce positions to prevent moving up
        if (sidebar) sidebar.style.top = topOffset;
        const legend = document.getElementById('legend-box');
        if (legend) legend.style.top = '20px';

    } else {
        // Collapse
        footer.style.display = 'none';
        footer.classList.remove('tablet-expanded');

        // Move controls down
        if (zoomControls) zoomControls.style.bottom = '20px';
        if (simControls) simControls.style.bottom = '80px';

        // Reset positions (though they should be same)
        if (sidebar) sidebar.style.top = topOffset;
        const legend = document.getElementById('legend-box');
        if (legend) legend.style.top = '20px';
    }

    // Update stats button position immediately after toggling
    // Small delay to allow transition if any, but mainly to ensure DOM update
    setTimeout(() => {
        ResponsiveUI.handleTabletStats();
    }, 50);
}

window.toggleTabletTerminal = toggleTabletTerminal;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ResponsiveUI.init();
});

// Expose globally if needed
window.ResponsiveUI = ResponsiveUI;
