/**
 * Responsive UI Logic
 * Handles dynamic scaling of the toolbar to fit within the viewport.
 */

const ResponsiveUI = {
    init() {
        this.adjustToolbarScale();
        window.addEventListener('resize', () => this.adjustToolbarScale());

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
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ResponsiveUI.init();
});

// Expose globally if needed
window.ResponsiveUI = ResponsiveUI;
