/* ============================================================
   ThatDailyDeal — Events feature
   Per-feature module (classic script, loaded after v6.js).
   Owns everything inside the `events` tab: it renders its markup
   into #eventsRoot and manages its own state. Keeps index.html a
   thin skeleton and v6.js focused on the app shell.

   Convention (see dist-v6/CLAUDE.md):
   - index.html provides only the mount point: <div id="eventsRoot">
   - shared visuals must come from components.css classes
   - feature-only positioning goes in v6.css (or a future events.css)
   ============================================================ */
(() => {
  const root = document.getElementById('eventsRoot');
  if (!root) return;

  // Placeholder — same content the static markup used to carry.
  // Replace with the real events UI as the feature is built out.
  root.innerHTML = `
    <div class="cs-placeholder">
      <span class="cs-placeholder-icon">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </span>
      <h2>Events</h2>
      <p>Coming soon</p>
    </div>`;
})();
