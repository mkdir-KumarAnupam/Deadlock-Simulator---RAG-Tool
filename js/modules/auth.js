/**
 * Auth Module
 * Handles user authentication via Supabase.
 */

const Auth = {
    user: null,
    saveTimeouts: {}, // For debouncing saves

    async init() {
        if (!SupabaseService.isConfigured()) {
            console.warn("Supabase not configured");
            this.updateUI(null);
            this.injectModal();
            return;
        }

        const supabase = SupabaseService.getClient();

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            this.user = session.user;
            this.fetchPreferences();
            this.updateUI(this.user);
            console.log("Auth: User restored from Supabase", this.user);
        } else {
            this.updateUI(null);
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(`Auth Event: ${event}`);

            if (event === 'SIGNED_IN') {
                // Only fetch if user changed or was null
                if (!this.user || (session.user && this.user.id !== session.user.id)) {
                    this.user = session.user;
                    this.fetchPreferences();
                    this.updateUI(this.user);
                    this.closeModal();
                }
            } else if (event === 'SIGNED_OUT') {
                this.user = null;
                this.updateUI(null);
            } else if (event === 'TOKEN_REFRESHED') {
                // Just update the user object, don't re-fetch prefs
                if (session) this.user = session.user;
            }
        });

        // Inject Modal HTML if not present
        if (!document.getElementById('auth-modal')) {
            this.injectModal();
        }
    },

    async login(email, password) {
        if (!SupabaseService.isConfigured()) {
            alert("Please configure Supabase in Settings first.");
            return;
        }

        const supabase = SupabaseService.getClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert(error.message);
        }
    },

    async register(email, password, username) {
        if (!SupabaseService.isConfigured()) {
            alert("Please configure Supabase in Settings first.");
            return;
        }

        const supabase = SupabaseService.getClient();
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
                }
            }
        });

        if (error) {
            alert(error.message);
        } else {
            alert("Registration successful! Please check your email to confirm.");
        }
    },

    async logout() {
        if (!SupabaseService.isConfigured()) return;
        const supabase = SupabaseService.getClient();
        await supabase.auth.signOut();

        // Clear local storage but keep Supabase config
        const sbUrl = localStorage.getItem('supabase_url');
        const sbKey = localStorage.getItem('supabase_key');
        localStorage.clear();
        if (sbUrl) localStorage.setItem('supabase_url', sbUrl);
        if (sbKey) localStorage.setItem('supabase_key', sbKey);

        window.location.reload();
    },

    async fetchPreferences() {
        if (!this.user) return;
        console.log("Fetching preferences for user:", this.user.id);
        const supabase = SupabaseService.getClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', this.user.id)
            .single();

        if (error) {
            console.error("Error fetching preferences:", error);
            return;
        }

        if (data && data.preferences) {
            console.log("Preferences fetched:", data.preferences);
            this.applyPreferences(data.preferences);
        } else {
            console.log("No preferences found in database.");
        }
    },

    applyPreferences(prefs) {
        if (prefs.backgroundPattern) {
            localStorage.setItem('backgroundPattern', prefs.backgroundPattern);
            if (window.setBackgroundPattern) window.setBackgroundPattern(prefs.backgroundPattern);
        }
        if (prefs.patternOpacity) {
            localStorage.setItem('patternOpacity', prefs.patternOpacity);
            if (window.setPatternOpacity) window.setPatternOpacity(prefs.patternOpacity);
        }
        if (prefs.useLegacyScenarios) {
            localStorage.setItem('useLegacyScenarios', prefs.useLegacyScenarios);
            if (window.toggleScenarioUIMode) window.toggleScenarioUIMode(prefs.useLegacyScenarios === 'true');
        }
        if (prefs.geminiApiKey) {
            localStorage.setItem('geminiApiKey', prefs.geminiApiKey);
            if (window.loadGeminiKey) window.loadGeminiKey();
        }
        if (prefs.theme) {
            if (window.changeTheme) window.changeTheme(prefs.theme);
        }
        if (prefs.uiScale) {
            if (window.updateUIScale) window.updateUIScale(prefs.uiScale);
        }
        if (prefs.edgeLabelSize) {
            if (window.updateEdgeLabelSize) window.updateEdgeLabelSize(prefs.edgeLabelSize);
        }
        if (prefs.edgeThickness) {
            if (window.updateEdgeThickness) window.updateEdgeThickness(prefs.edgeThickness);
        }
        if (prefs.showEdgeLabels !== undefined) {
            if (window.toggleEdgeLabels) window.toggleEdgeLabels(prefs.showEdgeLabels);
        }
        console.log("Preferences applied from cloud", prefs);
    },

    savePreference(key, value) {
        // 1. Update LocalStorage immediately for responsiveness
        localStorage.setItem(key, value);

        // 2. If not logged in, we are done
        if (!this.user) return;

        // 3. Debounce the database update
        if (this.saveTimeouts[key]) {
            clearTimeout(this.saveTimeouts[key]);
        }

        this.saveTimeouts[key] = setTimeout(async () => {
            console.log(`Saving preference '${key}' to cloud...`);
            const supabase = SupabaseService.getClient();

            // Fetch current preferences first to merge
            const { data: currentData } = await supabase
                .from('profiles')
                .select('preferences')
                .eq('id', this.user.id)
                .single();

            const currentPrefs = currentData?.preferences || {};
            const newPrefs = { ...currentPrefs, [key]: value };

            const { error } = await supabase
                .from('profiles')
                .update({ preferences: newPrefs })
                .eq('id', this.user.id);

            if (error) {
                console.error("Error saving preference:", error);
            } else {
                console.log("Preference saved to cloud:", key);
            }

            delete this.saveTimeouts[key];
        }, 1000); // 1 second debounce
    },

    async testCloudSave() {
        if (!this.user) {
            alert("Not logged in! Please login first.");
            return;
        }
        console.log("Testing cloud save...");
        const supabase = SupabaseService.getClient();
        const { error } = await supabase
            .from('profiles')
            .update({ preferences: { 'test_key': 'test_value_' + Date.now() } })
            .eq('id', this.user.id);

        if (error) {
            console.error("Test save failed:", error);
            alert("Save Failed: " + error.message);
        } else {
            console.log("Test save successful!");
            alert("Save Successful! Check your database for 'test_key'.");
        }
    },

    updateUI(user) {
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');

        if (!profileBtn || !profileMenu) return;

        if (user) {
            // Logged In State
            const username = user.user_metadata.username || user.email.split('@')[0];
            const avatar = user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

            profileBtn.innerHTML = `<img src="${avatar}" alt="Profile" class="w-full h-full object-cover">`;
            profileBtn.onclick = (e) => toggleMenu(e, 'profile-menu');

            profileMenu.innerHTML = `
                <div class="flex flex-col items-center p-4 border-b-2 border-black bg-blue-50">
                  <div class="w-16 h-16 rounded-full border-2 border-black overflow-hidden mb-2 bg-white">
                     <img src="${avatar}" alt="Profile" class="w-full h-full object-cover">
                  </div>
                  <span class="font-bold text-lg">${username}</span>
                  <span class="text-xs text-gray-600 font-mono">${user.email}</span>
                </div>
                <div class="neo-dropdown-item hover:bg-yellow-50" onclick="Session.createSession()">
                  <i class="fas fa-broadcast-tower mr-2"></i> Host Session
                </div>
                <div class="neo-dropdown-item hover:bg-yellow-50" onclick="Session.openJoinPanel()">
                  <i class="fas fa-plug mr-2"></i> Join Session
                </div>
                <div class="neo-dropdown-item text-red-600 hover:bg-red-50" onclick="Auth.logout()">
                  <i class="fas fa-sign-out-alt mr-2"></i> Logout
                </div>
            `;
        } else {
            // Logged Out State
            profileBtn.innerHTML = `<i class="fas fa-user"></i>`;
            profileBtn.onclick = () => Auth.showLoginModal();

            profileMenu.innerHTML = `
                 <div class="neo-dropdown-item" onclick="Auth.showLoginModal()">
                  <i class="fas fa-sign-in-alt mr-2"></i> Login
                </div>
            `;
        }
    },

    injectModal() {
        const modalHtml = `
        <div id="auth-modal" onclick="if(event.target===this) Auth.closeModal()"
            style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10002; font-family: 'Courier New', monospace;">
            <div style="background: white; border: 4px solid black; box-shadow: 10px 10px 0 black; padding: 24px; max-width: 400px; margin: 100px auto; transform: rotate(1deg);">
                <div class="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                    <h2 class="text-2xl font-black uppercase">Identity</h2>
                    <button onclick="Auth.closeModal()" class="text-xl font-bold hover:text-red-600">X</button>
                </div>

                <div id="auth-form-login">
                    <div class="mb-4">
                        <label class="block font-bold mb-2">EMAIL</label>
                        <input type="email" id="auth-email" class="neo-input w-full p-3 text-lg" placeholder="user@example.com">
                    </div>
                    <div class="mb-4">
                        <label class="block font-bold mb-2">PASSWORD</label>
                        <input type="password" id="auth-password" class="neo-input w-full p-3 text-lg" placeholder="••••••">
                    </div>

                    <div class="flex gap-2 mb-4">
                        <button onclick="Auth.handleLogin()" class="neo-btn primary flex-1 justify-center py-3 text-lg">
                            <i class="fas fa-sign-in-alt"></i> LOGIN
                        </button>
                    </div>
                    <div class="text-center text-xs">
                        <span class="text-gray-500">New here?</span>
                        <button onclick="Auth.toggleMode()" class="font-bold underline ml-1">Create Account</button>
                    </div>
                </div>

                <div id="auth-form-register" style="display: none;">
                     <div class="mb-4">
                        <label class="block font-bold mb-2">EMAIL</label>
                        <input type="email" id="reg-email" class="neo-input w-full p-3 text-lg" placeholder="user@example.com">
                    </div>
                    <div class="mb-4">
                        <label class="block font-bold mb-2">USERNAME</label>
                        <input type="text" id="reg-username" class="neo-input w-full p-3 text-lg" placeholder="username">
                    </div>
                    <div class="mb-4">
                        <label class="block font-bold mb-2">PASSWORD</label>
                        <input type="password" id="reg-password" class="neo-input w-full p-3 text-lg" placeholder="••••••">
                    </div>

                    <div class="flex gap-2 mb-4">
                        <button onclick="Auth.handleRegister()" class="neo-btn flex-1 justify-center py-3 text-lg" style="background: #ffe600;">
                            <i class="fas fa-user-plus"></i> REGISTER
                        </button>
                    </div>
                    <div class="text-center text-xs">
                        <span class="text-gray-500">Have an account?</span>
                        <button onclick="Auth.toggleMode()" class="font-bold underline ml-1">Login</button>
                    </div>
                </div>

            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    showLoginModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('auth-form-login').style.display = 'block';
            document.getElementById('auth-form-register').style.display = 'none';
        }
    },

    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'none';
    },

    toggleMode() {
        const loginForm = document.getElementById('auth-form-login');
        const regForm = document.getElementById('auth-form-register');
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            regForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            regForm.style.display = 'block';
        }
    },

    handleLogin() {
        const e = document.getElementById('auth-email').value;
        const p = document.getElementById('auth-password').value;
        if (e && p) this.login(e, p);
    },

    handleRegister() {
        const e = document.getElementById('reg-email').value;
        const u = document.getElementById('reg-username').value;
        const p = document.getElementById('reg-password').value;
        if (e && u && p) this.register(e, p, u);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Explicitly expose to window to ensure accessibility from other scripts
window.Auth = Auth;
