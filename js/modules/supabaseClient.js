
const SupabaseService = {
    client: null,
    url: localStorage.getItem('supabase_url') || 'https://hcebfrrqyveyxhalajaa.supabase.co',
    key: localStorage.getItem('supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZWJmcnJxeXZleXhoYWxhamFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE2NjksImV4cCI6MjA3OTk4NzY2OX0.2m8EJ1mG5X3S_5wh_44gGlxuFy5zY33sAiUZl5V-9B4',

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
