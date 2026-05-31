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
  const detailRoot = document.getElementById('settingsDetailRoot');
  const detailPage = document.getElementById('settingsDetailPage');
  const confirmRoot = document.getElementById('confirmRoot');
  if (!root || !page || !confirmRoot) return;

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

  /* ---- Profile persistence for the detail pages (tdd.profile, keyed by page) ---- */
  const PROFILE_KEY = 'tdd.profile';
  function loadProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
  }
  function saveProfile(key, data) {
    const all = loadProfile();
    all[key] = { ...(all[key] || {}), ...data };
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(all)); } catch { /* ignore */ }
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

  const escAttr = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  /* ---- Shared sub-page header (back button + centered title) ---- */
  function headerHTML(title, backId) {
    return `<header class="subpage-header">
      <button class="btn btn-glass btn-icon-only btn-md subpage-back" id="${backId}" aria-label="Back">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS.back}</svg>
      </button>
      <h1 class="subpage-title">${title}</h1>
      <span aria-hidden="true"></span>
    </header>`;
  }

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
    ${headerHTML('Settings', 'settingsBack')}

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
    </div>`;

  /* ---- Confirm sheet — rendered at top level so it overlays both sub-pages ---- */
  if (confirmRoot) {
    confirmRoot.innerHTML = `
      <div class="confirm-backdrop" id="confirmBackdrop"></div>
      <div class="confirm-sheet" id="confirmSheet" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
        <div class="confirm-title" id="confirmTitle"></div>
        <div class="confirm-sub" id="confirmSub"></div>
        <div class="confirm-actions">
          <button class="btn btn-destructive btn-lg" id="confirmOk"></button>
          <button class="btn btn-secondary btn-ghost btn-lg" id="confirmCancel">Cancel</button>
        </div>
      </div>`;
  }

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
  function closeSettings() { closeConfirm(); closeDetail(); document.body.classList.remove('settings-open'); page.setAttribute('aria-hidden', 'true'); }
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

  /* ---- Confirm sheet (reused for destructive actions + discard prompt) ---- */
  const confirmTitle = confirmRoot.querySelector('#confirmTitle');
  const confirmSub = confirmRoot.querySelector('#confirmSub');
  const confirmOk = confirmRoot.querySelector('#confirmOk');
  const confirmCancel = confirmRoot.querySelector('#confirmCancel');
  const confirmBackdrop = confirmRoot.querySelector('#confirmBackdrop');
  let onConfirm = null;

  function openConfirm({ title, sub, okLabel, okClass = 'btn-destructive', onOk }) {
    confirmTitle.textContent = title;
    confirmSub.textContent = sub;
    confirmOk.textContent = okLabel;
    confirmOk.className = `btn ${okClass} btn-lg`;
    onConfirm = onOk;
    document.body.classList.add('confirm-open');
  }
  function closeConfirm() { document.body.classList.remove('confirm-open'); onConfirm = null; }
  confirmBackdrop.addEventListener('click', closeConfirm);
  confirmCancel.addEventListener('click', closeConfirm);
  confirmOk.addEventListener('click', () => { const fn = onConfirm; closeConfirm(); if (fn) fn(); });

  /* ---- Detail pages (drill-in editable forms) ----
     Each page is a list of fields; values prefill from tdd.profile,
     else from the `value` default. Rendered into #settingsDetailRoot. */
  const PAGES = {
    contact: { title: 'Contact Information', fields: [
      { key: 'name',  label: 'Full name', type: 'text',  value: 'Jordan Miller' },
      { key: 'email', label: 'Email',     type: 'email', value: 'jordan.miller@email.com' },
      { key: 'phone', label: 'Phone',     type: 'tel',   value: '(555) 012-3456' },
    ] },
    shipping: { title: 'Shipping Information', fields: [
      { key: 'recipient', label: 'Recipient name',        type: 'text', value: 'Jordan Miller' },
      { key: 'street',    label: 'Street address',        type: 'text', value: '1200 Market St' },
      { key: 'unit',      label: 'Apt / Suite (optional)', type: 'text', value: '', placeholder: 'Apt, suite, unit' },
      { key: 'city',      label: 'City',                  type: 'text', value: 'San Francisco' },
      { key: 'state',     label: 'State',                 type: 'text', value: 'CA' },
      { key: 'zip',       label: 'ZIP code',              type: 'text', value: '94102' },
    ] },
    account: { title: 'Account Information', fields: [
      { key: 'username',   label: 'Username',     type: 'text',     value: 'jordanm' },
      { key: 'loginEmail', label: 'Login email',  type: 'email',    value: 'jordan.miller@email.com' },
      { key: 'password',   label: 'Password',     type: 'password', value: '', placeholder: '••••••••' },
      { key: 'since',      label: 'Member since', type: 'text',     value: 'March 2024', readonly: true },
    ] },
  };

  function fieldHTML(f, saved) {
    const val = saved && saved[f.key] != null ? saved[f.key] : (f.value || '');
    return `<label class="field">
      <span class="field-label">${f.label}</span>
      <input class="field-input" type="${f.type || 'text'}" name="${f.key}" value="${escAttr(val)}"${f.placeholder ? ` placeholder="${escAttr(f.placeholder)}"` : ''}${f.readonly ? ' readonly' : ''}>
    </label>`;
  }

  function openDetail(key) {
    const pg = PAGES[key];
    if (!pg || !detailRoot || !detailPage) return;
    const saved = loadProfile()[key];
    detailRoot.innerHTML = `
      ${headerHTML(pg.title, 'detailBack')}
      <div class="subpage-body">
        <section class="subpage-section">
          <h2 class="ns-section">${pg.title}</h2>
          <form class="list-card" id="detailForm">${pg.fields.map((f) => fieldHTML(f, saved)).join('')}</form>
        </section>
      </div>
      <div class="subpage-footer">
        <button class="btn btn-primary btn-lg dd-btn" id="detailSave">Save</button>
      </div>
      <img class="keyboard-mock" src="assets/keyboard.png" alt="" aria-hidden="true" draggable="false">`;
    document.body.classList.add('settings-detail-open');
    detailPage.setAttribute('aria-hidden', 'false');

    const form = detailRoot.querySelector('#detailForm');
    const keyboard = detailRoot.querySelector('.keyboard-mock');
    const saveBtn = detailRoot.querySelector('#detailSave');
    const inputs = [...form.querySelectorAll('.field-input[name]')];

    // Dirty tracking — Save is enabled only when a value differs from its
    // initial state (typing then reverting counts as clean again).
    const initial = {};
    inputs.forEach((i) => { initial[i.name] = i.value; });
    const isDirty = () => inputs.some((i) => !i.readOnly && i.value !== initial[i.name]);
    function refreshSave() {
      const clean = !isDirty();
      saveBtn.classList.toggle('is-disabled', clean);
      saveBtn.setAttribute('aria-disabled', String(clean));
    }
    refreshSave(); // starts disabled — nothing changed yet
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', refreshSave);

    /* Keyboard mockup: slide up while a (non-readonly) field is focused. */
    // Tapping the keyboard image keeps the field focused (don't blur).
    keyboard.addEventListener('mousedown', (e) => e.preventDefault());
    form.addEventListener('focusin', (e) => {
      if (!e.target.classList.contains('field-input') || e.target.readOnly) return;
      // Sync the footer/scroll offset to the keyboard's actual rendered height.
      const kbH = keyboard.offsetHeight || Math.round(keyboard.clientWidth * 293 / 375);
      if (kbH) document.body.style.setProperty('--kb-h', kbH + 'px');
      document.body.classList.add('keyboard-up');
      setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    });
    form.addEventListener('focusout', () => {
      // Hide unless focus moved to another editable field.
      setTimeout(() => {
        const a = document.activeElement;
        if (!a || !a.classList || !a.classList.contains('field-input')) {
          document.body.classList.remove('keyboard-up');
        }
      }, 0);
    });

    // Save — tapping while disabled explains why; otherwise persist + return.
    saveBtn.addEventListener('click', () => {
      if (!isDirty()) { showToast("You haven't changed anything — nothing to save"); return; }
      const data = {};
      inputs.forEach((i) => { if (!i.readOnly) data[i.name] = i.value; });
      saveProfile(key, data);
      showToast('Saved');
      closeDetail();
    });

    // Back / Escape — warn before discarding unsaved edits.
    requestCloseDetail = () => {
      if (isDirty()) {
        openConfirm({
          title: 'Discard changes?',
          sub: "Your edits will be lost if you leave without saving.",
          okLabel: 'Discard',
          onOk: closeDetail,
        });
      } else {
        closeDetail();
      }
    };
    detailRoot.querySelector('#detailBack').addEventListener('click', () => requestCloseDetail());
  }
  function closeDetail() {
    document.body.classList.remove('settings-detail-open');
    document.body.classList.remove('keyboard-up');
    if (detailPage) detailPage.setAttribute('aria-hidden', 'true');
  }
  // Reassigned per detail page (dirty-aware); defaults to a plain close.
  let requestCloseDetail = closeDetail;

  /* ---- Row actions ---- */
  const ACTIONS = {
    contact:  () => openDetail('contact'),
    shipping: () => openDetail('shipping'),
    account:  () => openDetail('account'),
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

  /* ---- Escape unwinds the stack: confirm → detail (dirty-aware) → settings ---- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('confirm-open')) closeConfirm();
    else if (document.body.classList.contains('settings-detail-open')) requestCloseDetail();
    else if (document.body.classList.contains('settings-open')) closeSettings();
  });
})();
