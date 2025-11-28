    // --- View Switching ---
    function switchView(viewName) {
      document.getElementById('view-queues').classList.add('hidden');
      document.getElementById('view-gantt').classList.add('hidden');
      document.getElementById('view-metrics').classList.add('hidden');
      document.getElementById('tab-queues').classList.remove('active');
      document.getElementById('tab-gantt').classList.remove('active');
      document.getElementById('tab-metrics').classList.remove('active');

      document.getElementById(`view-${viewName}`).classList.remove('hidden');
      document.getElementById(`tab-${viewName}`).classList.add('active');
    }

    // --- Menu Logic ---
    function toggleMenu(e, menuId) {
      e.stopPropagation();
      document.querySelectorAll('.neo-dropdown').forEach(d => {
        if (d.id !== menuId) d.classList.remove('show');
      });
      document.getElementById(menuId).classList.toggle('show');
    }

    function closeMenu(e) {
      if (!e.target.closest('.neo-title') && !e.target.closest('.neo-btn') && !e.target.closest('.neo-dropdown')) {
        document.querySelectorAll('.neo-dropdown').forEach(d => d.classList.remove('show'));
      }
    }

    // --- Scenario UI Toggle ---
    function toggleScenarioUIMode(useLegacy) {
      const libraryBtn = document.getElementById('scenario-library-btn');
      const legacyDropdown = document.getElementById('legacy-scenario-dropdown');

      if (useLegacy) {
        libraryBtn.style.display = 'none';
        legacyDropdown.style.display = 'block';
        localStorage.setItem('useLegacyScenarios', 'true');
      } else {
        libraryBtn.style.display = 'block';
        legacyDropdown.style.display = 'none';
        localStorage.setItem('useLegacyScenarios', 'false');
      }
    }

    // Load saved preference on page load
    window.addEventListener('DOMContentLoaded', () => {
      const useLegacy = localStorage.getItem('useLegacyScenarios') === 'true';
      document.getElementById('config-legacy-scenarios').checked = useLegacy;
      if (useLegacy) {
        toggleScenarioUIMode(true);
      }

      // Load saved background pattern
      const savedPattern = localStorage.getItem('backgroundPattern') || 'dots';
      setBackgroundPattern(savedPattern);
      const patternRadio = document.querySelector(`input[name="bg-pattern"][value="${savedPattern}"]`);
      if (patternRadio) patternRadio.checked = true;

      // Load saved pattern opacity
      const savedOpacity = localStorage.getItem('patternOpacity') || '10';
      document.getElementById('config-pattern-opacity').value = savedOpacity;
      setPatternOpacity(savedOpacity);

      // Load saved Gemini API key
      loadGeminiKey();
    });

