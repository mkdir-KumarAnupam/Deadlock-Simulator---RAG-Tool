/**
 * Session Module
 * Handles real-time collaboration via Supabase.
 */

const Session = {
    activeSession: null,
    isHost: false,
    channel: null,
    isMinimized: false,

    // Generate a random 6-digit code
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    async createSession() {
        if (!Auth.user) {
            this.showNotification("You must be logged in to host.", "error");
            return;
        }

        const code = this.generateCode();
        const initialState = {
            nodes: nodes,
            edges: edges,
            systemConfig: systemConfig
        };

        const supabase = SupabaseService.getClient();
        const { data, error } = await supabase
            .from('sessions')
            .insert({
                code: code,
                host_id: Auth.user.id,
                state: initialState,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating session:", error);
            this.showNotification("Failed to create session.", "error");
            return;
        }

        this.activeSession = data;
        this.isHost = true;
        this.subscribeToSession(code);

        this.showPanel('active');
        this.showNotification("Session Created!", "success");
    },

    async joinSession(code) {
        if (!code) return;

        const supabase = SupabaseService.getClient();

        // 1. Fetch session
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            this.showNotification("Session not found or inactive.", "error");
            return;
        }

        // 2. Load initial state
        this.loadState(data.state);

        // 3. Subscribe
        this.activeSession = data;
        this.isHost = (Auth.user && Auth.user.id === data.host_id);
        this.subscribeToSession(code);

        this.showPanel('active');
        this.showNotification("Joined Session!", "success");
    },

    handleJoin() {
        const code = document.getElementById('session-code-input').value;
        if (code && code.length === 6) {
            this.joinSession(code);
        } else {
            this.showNotification("Invalid code.", "error");
        }
    },

    subscribeToSession(code) {
        const supabase = SupabaseService.getClient();

        // Unsubscribe if existing
        if (this.channel) supabase.removeChannel(this.channel);

        this.channel = supabase.channel(`session:${code}`)
            .on('broadcast', { event: 'graph_update' }, (payload) => {
                if (!this.isHost) this.handleGraphUpdate(payload.payload);
            })
            .on('broadcast', { event: 'sim_update' }, (payload) => {
                if (!this.isHost) this.handleSimUpdate(payload.payload);
            })
            .subscribe((status) => {
                console.log(`Session subscription status: ${status}`);
            });
    },

    broadcast(event, payload) {
        if (!this.activeSession || !this.isHost || !this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: event,
            payload: payload
        });
    },

    handleGraphUpdate(data) {
        console.log("Received graph update:", data);
        if (data.nodes && data.edges) {
            nodes = data.nodes;
            edges = data.edges;
            draw();
        }
    },

    handleSimUpdate(data) {
        console.log("Received sim update:", data);
        if (data.type === 'start') {
            // Ensure we have controls loaded
            if (typeof toggleSimulation === 'function' && !isRunning) toggleSimulation();
        } else if (data.type === 'stop') {
            if (typeof toggleSimulation === 'function' && isRunning) toggleSimulation();
        } else if (data.type === 'step') {
            if (typeof scheduler === 'function') scheduler();
        }
    },

    loadState(state) {
        if (!state) return;
        if (state.nodes) nodes = state.nodes;
        if (state.edges) edges = state.edges;
        if (state.systemConfig) {
            Object.assign(systemConfig, state.systemConfig);
        }
        draw();
    },

    leaveSession() {
        if (this.channel) SupabaseService.getClient().removeChannel(this.channel);
        this.activeSession = null;
        this.isHost = false;
        this.channel = null;

        // Reset UI
        const panel = document.getElementById('session-panel');
        panel.classList.remove('panel-slide-in');
        panel.classList.add('panel-slide-out');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('panel-slide-out');
        }, 300);

        document.body.classList.remove('session-guest');

        this.showNotification("Left session.", "info");
    },

    // UI Functions
    openJoinPanel() {
        this.showPanel('join');
    },

    showPanel(mode) {
        const panel = document.getElementById('session-panel');
        const joinView = document.getElementById('session-join-view');
        const activeView = document.getElementById('session-active-view');
        const codeDisplay = document.getElementById('display-session-code');
        const spectatorBadge = document.getElementById('spectator-badge');

        panel.style.display = 'block';
        panel.classList.remove('panel-slide-out');
        panel.classList.add('panel-slide-in');

        this.isMinimized = false;
        this.updatePanelState();

        if (mode === 'join') {
            joinView.classList.remove('hidden');
            activeView.classList.add('hidden');
            spectatorBadge.classList.add('hidden'); // Ensure badge is hidden in join mode
        } else if (mode === 'active') {
            joinView.classList.add('hidden');
            activeView.classList.remove('hidden');

            if (this.activeSession) {
                codeDisplay.textContent = this.activeSession.code;
            }

            if (!this.isHost) {
                spectatorBadge.classList.remove('hidden');
                document.body.classList.add('session-guest');
            } else {
                spectatorBadge.classList.add('hidden');
                document.body.classList.remove('session-guest');
            }

            // Minimize Legend Pane
            const legendBox = document.getElementById('legend-box');
            const toggleBtn = document.getElementById('legend-toggle-btn');
            if (legendBox && !legendBox.classList.contains('minimized')) {
                legendBox.classList.add('minimized');
                if (toggleBtn) toggleBtn.classList.add('visible');
            }
        }
    },

    togglePanel() {
        this.isMinimized = !this.isMinimized;
        this.updatePanelState();
    },

    updatePanelState() {
        const content = document.getElementById('session-content');
        const minTab = document.getElementById('session-minimized');
        const panel = document.getElementById('session-panel');

        if (this.isMinimized) {
            // Animate content out? For now just hide
            content.style.display = 'none';
            minTab.classList.remove('hidden');
            minTab.classList.add('panel-slide-in'); // Reuse slide in for tab
            panel.style.transform = 'translate(0, -50%)';
            panel.style.width = 'auto';
        } else {
            content.style.display = 'flex';
            content.classList.add('panel-slide-in');
            minTab.classList.add('hidden');
            panel.style.transform = 'translate(0, -50%)';
        }
    },

    copyCode() {
        if (this.activeSession) {
            navigator.clipboard.writeText(this.activeSession.code);
            this.showNotification("Code copied!", "success");
        }
    },

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notif = document.createElement('div');
        notif.className = `neo-notification ${type}`;

        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-triangle';

        notif.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;

        container.appendChild(notif);

        // Remove after 3 seconds
        setTimeout(() => {
            notif.classList.add('hiding');
            notif.addEventListener('animationend', () => {
                notif.remove();
            });
        }, 3000);
    }
};

// Expose
window.Session = Session;
