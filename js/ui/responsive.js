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
