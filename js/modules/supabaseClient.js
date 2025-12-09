
const SupabaseService = {
    client: null,
    url: localStorage.getItem('supabase_url') || 'https://hcebfrrqyveyxhalajaa.supabase.co',
    key: localStorage.getItem('supabase_key') || '',

    init() {
        if (this.url && this.key && window.supabase) {
            try {
                this.client = window.supabase.createClient(this.url, this.key);
                console.log("Supabase initialized");
            } catch (e) {
                console.error("Failed to initialize Supabase:", e);
            }
        }
    },

    updateConfig(url, key) {
        this.url = url;
        this.key = key;
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
        this.init();
        // Reload to ensure all modules pick up the new client
        if (confirm("Configuration saved. Reload now to apply changes?")) {
            window.location.reload();
        }
    },

    getClient() {
        return this.client;
    },

    isConfigured() {
        return !!this.client;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase script to load if it's async
    if (window.supabase) {
        SupabaseService.init();
    } else {
        // Poll or wait for load event if needed, but usually script tag order handles this
        setTimeout(() => SupabaseService.init(), 500);
    }
});

