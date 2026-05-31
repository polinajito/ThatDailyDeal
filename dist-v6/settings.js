/* ============================================================
   ThatDailyDeal — Settings feature
   Per-feature module (classic script, loaded after v6.js).
   Owns the Settings sub-page: renders its markup into
   #settingsRoot, opens from the header avatar, and manages its
   toggles + destructive-action confirmation.

   Reuses (see dist-v6/CLAUDE.md):
   - .list-card / .list-row family + .ns-switch toggle (components.css)
   - .ns-section header type, .subpage / .confirm-sheet chrome (v6.css)
   - global state.muted + applyVideoState() + showToast() (v6.js)
   ============================================================ */
(() => {
  const root = document.getElementById('settingsRoot');
  const page = document.getElementById('settingsPage');
  if (!root || !page) return;

  /* ---- Persistence (mirrors tdd.subscriptions in v6.js) ---- */
  const SETTINGS_KEY = 'tdd.settings';
  // muteVideo defaults to the app's real initial state (videos start muted).
  const DEFAULTS = { muteVideo: true, push: true };
  function loadSettings() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return { ...DEFAULTS }; }
  }
  function saveSettings(patch) {
    const next = { ...loadSettings(), ...patch };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  }

  /* ---- Icons (inline SVG, sized by .list-row-icon svg) ---- */
  const ICONS = {
    contact:  '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    shipping: '<rect x="1" y="6" width="14" height="11" rx="1.5"/><path d="M15 9h4l3 3v5h-7z"/><circle cx="6" cy="18.5" r="1.6"/><circle cx="18" cy="18.5" r="1.6"/>',
    account:  '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    mute:     '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
    bell:     '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    tutorial: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
    logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    trash:    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    chevron:  '<polyline points="9 18 15 12 9 6"/>',
    back:     '<polyline points="15 6 9 12 15 18"/>',
  };
  const icon = (name, w = 24) =>
    `<svg viewBox="0 0 ${w} ${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  /* ---- Row builders (DRY — one shape per row type) ---- */
  function rowIcon(name) { return `<span class="list-row-icon" aria-hidden="true">${icon(name)}</span>`; }
  function rowText(label, sub) {
    return `<span class="list-row-text"><span class="list-row-label">${label}</span>${sub ? `<span class="list-row-sub">${sub}</span>` : ''}</span>`;
  }
  function chevronRow({ name, label, sub, action }) {
    return `<button class="list-row" data-action="${action}">${rowIcon(name)}${rowText(label, sub)}<svg class="list-row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS.chevron}</svg></button>`;
  }
  function toggleRow({ name, label, sub, setting, on }) {
    return `<div class="list-row is-static" data-toggle="${setting}" role="switch" aria-checked="${on}" tabindex="0">${rowIcon(name)}${rowText(label, sub)}<span class="ns-switch" data-on="${on}"><span class="ns-switch-track" aria-hidden="true"><span class="ns-switch-thumb"></span></span></span></div>`;
  }
  function destructiveRow({ name, label, action }) {
    return `<button class="list-row list-row-destructive" data-action="${action}">${rowIcon(name)}${rowText(label)}</button>`;
  }

  /* ---- Render ---- */
  const s = loadSettings();
  root.innerHTML = `
    <header class="subpage-header">
      <button class="btn btn-glass btn-icon-only btn-md subpage-back" id="settingsBack" aria-label="Back">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS.back}</svg>
      </button>
      <h1 class="subpage-title">Settings</h1>
      <span aria-hidden="true"></span>
    </header>

    <div class="subpage-body">
      <div class="settings-profile">
        <span class="settings-profile-avatar" aria-hidden="true">JM</span>
        <span class="settings-profile-text">
          <span class="settings-profile-name">Jordan Miller</span>
          <span class="settings-profile-email">jordan.miller@email.com</span>
        </span>
      </div>

      <section class="subpage-section">
        <h2 class="ns-section">Account Settings</h2>
        <div class="list-card">
          ${chevronRow({ name: 'contact',  label: 'Contact Information',  action: 'contact'  })}
          ${chevronRow({ name: 'shipping', label: 'Shipping Information', action: 'shipping' })}
          ${chevronRow({ name: 'account',  label: 'Account Information',  action: 'account'  })}
        </div>
      </section>

      <section class="subpage-section">
        <h2 class="ns-section">App Settings</h2>
        <div class="list-card">
          ${toggleRow({ name: 'mute', label: 'Mute Video by Default', sub: 'Videos start muted when opened', setting: 'muteVideo', on: s.muteVideo })}
          ${toggleRow({ name: 'bell', label: 'Push Notifications', sub: 'Deals and restock alerts', setting: 'push', on: s.push })}
          ${chevronRow({ name: 'tutorial', label: 'Watch Tutorial Video', sub: 'Learn how to use the app', action: 'tutorial' })}
        </div>
      </section>

      <section class="subpage-section">
        <h2 class="ns-section">Account Actions</h2>
        <div class="list-card">
          ${destructiveRow({ name: 'logout', label: 'Log Out', action: 'logout' })}
          ${destructiveRow({ name: 'trash',  label: 'Request Account Deletion', action: 'delete' })}
        </div>
      </section>
    </div>

    <div class="confirm-backdrop" id="confirmBackdrop"></div>
    <div class="confirm-sheet" id="confirmSheet" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
      <div class="confirm-title" id="confirmTitle"></div>
      <div class="confirm-sub" id="confirmSub"></div>
      <div class="confirm-actions">
        <button class="btn btn-destructive btn-lg" id="confirmOk"></button>
        <button class="btn btn-secondary btn-ghost btn-lg" id="confirmCancel">Cancel</button>
      </div>
    </div>`;

  /* ---- Apply the persisted mute default to live playback ---- */
  function applyMute(on) {
    if (typeof state !== 'undefined') state.muted = on;
    document.body.classList.toggle('is-muted', on);
    if (typeof applyVideoState === 'function') applyVideoState();
  }
  applyMute(s.muteVideo);

  /* ---- Open / close the sub-page ---- */
  const avatar = document.querySelector('.avatar');
  function openSettings() { document.body.classList.add('settings-open'); page.setAttribute('aria-hidden', 'false'); }
  function closeSettings() { closeConfirm(); document.body.classList.remove('settings-open'); page.setAttribute('aria-hidden', 'true'); }
  if (avatar) avatar.addEventListener('click', openSettings);
  root.querySelector('#settingsBack').addEventListener('click', closeSettings);

  /* ---- Toggles ---- */
  function flipToggle(rowEl) {
    const setting = rowEl.dataset.toggle;
    const sw = rowEl.querySelector('.ns-switch');
    const on = sw.dataset.on !== 'true';
    sw.dataset.on = String(on);
    rowEl.setAttribute('aria-checked', String(on));
    saveSettings({ [setting]: on });
    if (setting === 'muteVideo') applyMute(on);
    if (setting === 'push') showToast(on ? 'Notifications on' : 'Notifications off');
  }
  root.querySelectorAll('[data-toggle]').forEach((rowEl) => {
    rowEl.addEventListener('click', () => flipToggle(rowEl));
    rowEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipToggle(rowEl); }
    });
  });

  /* ---- Confirm sheet (reused for destructive actions) ---- */
  const confirmSheet = root.querySelector('#confirmSheet');
  const confirmBackdrop = root.querySelector('#confirmBackdrop');
  const confirmTitle = root.querySelector('#confirmTitle');
  const confirmSub = root.querySelector('#confirmSub');
  const confirmOk = root.querySelector('#confirmOk');
  const confirmCancel = root.querySelector('#confirmCancel');
  let onConfirm = null;

  function openConfirm({ title, sub, okLabel, onOk }) {
    confirmTitle.textContent = title;
    confirmSub.textContent = sub;
    confirmOk.textContent = okLabel;
    onConfirm = onOk;
    document.body.classList.add('confirm-open');
  }
  function closeConfirm() { document.body.classList.remove('confirm-open'); onConfirm = null; }
  confirmBackdrop.addEventListener('click', closeConfirm);
  confirmCancel.addEventListener('click', closeConfirm);
  confirmOk.addEventListener('click', () => { const fn = onConfirm; closeConfirm(); if (fn) fn(); });

  /* ---- Row actions ---- */
  const ACTIONS = {
    contact:  () => showToast('Contact Information'),
    shipping: () => showToast('Shipping Information'),
    account:  () => showToast('Account Information'),
    tutorial: () => showToast('Tutorial coming soon'),
    logout:   () => openConfirm({
      title: 'Log out?',
      sub: 'You’ll need to sign in again to see your deals.',
      okLabel: 'Log Out',
      onOk: () => { closeSettings(); showToast('Logged out'); },
    }),
    delete:   () => openConfirm({
      title: 'Request account deletion?',
      sub: 'This starts the process to permanently delete your account and data.',
      okLabel: 'Request Deletion',
      onOk: () => showToast('Deletion requested'),
    }),
  };
  root.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => { const fn = ACTIONS[btn.dataset.action]; if (fn) fn(); });
  });

  /* ---- Escape closes confirm first, then the sub-page ---- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('confirm-open')) closeConfirm();
    else if (document.body.classList.contains('settings-open')) closeSettings();
  });
})();
