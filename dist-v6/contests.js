/* ============================================================
   ThatDailyDeal — Contests feature
   Per-feature module (classic script, loaded after v6.js).
   Owns everything inside the `contests` tab: renders its markup
   into #contestsRoot and manages its own state. Keeps index.html a
   thin skeleton and v6.js focused on the app shell.

   Convention (see dist-v6/CLAUDE.md):
   - index.html provides only the mount point: <div id="contestsRoot">
   - shared visuals must come from components.css classes
     (here: the .challenge-mini family)
   - feature-only positioning goes in v6.css (.contests-page)
   ============================================================ */
(() => {
  const root = document.getElementById('contestsRoot');
  if (!root) return;

  // Active contests. The "weekly-trivia" entry reuses the loopmoney hero;
  // add more entries as the feature grows. An entry with a `cta` renders an
  // action band; incoming friend challenges (added later) will omit it.
  const CONTESTS = [
    {
      hero: 'loopmoney',
      eyebrow: 'Weekly Trivia',
      title: 'Win real money!',
      sub: 'Challenge friends & win cash.',
      rewards: [
        { amount: '$5.00', label: 'for new users' },
        { amount: '$2.00', label: 'for existing' },
      ],
      cta: 'Create Challenge',
      learnMore: true,
    },
  ];

  const miniCard = (c) => `
    <article class="challenge-mini">
      <div class="challenge-mini-top">
        ${c.hero === 'loopmoney' ? `
        <span class="challenge-mini-hero" aria-hidden="true">
          <lottie-player class="challenge-mini-anim" autoplay loop background="transparent"></lottie-player>
        </span>` : ''}
        <div class="challenge-mini-text">
          <span class="challenge-mini-eyebrow">${c.eyebrow}</span>
          <h3 class="challenge-mini-title">${c.title}</h3>
          <p class="challenge-mini-sub">${c.sub}</p>
        </div>
      </div>
      <div class="challenge-mini-rewards">
        ${c.rewards.map((r) => `
        <div class="challenge-mini-reward">
          <span class="challenge-mini-get">Get</span>
          <span class="challenge-mini-amount">${r.amount}</span>
          <span class="challenge-mini-label">${r.label}</span>
        </div>`).join('')}
      </div>
      ${c.cta ? `
      <div class="challenge-mini-cta">
        <button class="btn btn-primary btn-md" data-action="create">${c.cta}</button>
        ${c.learnMore ? `<button class="challenge-mini-learn" data-action="learn">Learn more</button>` : ''}
      </div>` : ''}
    </article>`;

  // Weekly usage against the cap (1 send + 1 accept per week). Demo values;
  // the subline flips to "resets Mon" once a count hits its cap.
  const WEEK = {
    sent:     { used: 1, cap: 1 },
    accepted: { used: 0, cap: 1 },
  };
  const statCell = (label, s) => `
    <div class="weekly-stat">
      <span class="weekly-stat-label">${label}</span>
      <span class="weekly-stat-value">${s.used}<span class="wk-cap">/${s.cap}</span></span>
      <span class="weekly-stat-sub">${s.used >= s.cap ? 'resets Mon' : `${s.cap - s.used} left`}</span>
    </div>`;
  const weeklyStats = `
    <div class="weekly-stats">
      <span class="weekly-stats-title">This week</span>
      <div class="weekly-stats-row">
        ${statCell('Sent', WEEK.sent)}
        ${statCell('Accepted', WEEK.accepted)}
      </div>
    </div>`;

  // Peek (half-open sheet): action-focused — promo card(s) + a way out to the
  // full Challenges page. "See all" opens that page (built as a placeholder
  // below; its Current/Finished contents are designed later).
  root.innerHTML = `
    <div class="contests-page">
      <div class="contests-head">
        <h2 class="contests-title">Challenges</h2>
        <button class="btn btn-secondary btn-ghost btn-sm contests-more" id="challengesSeeAll">See all &rarr;</button>
      </div>
      ${CONTESTS.map(miniCard).join('')}
      ${weeklyStats}
    </div>`;

  // Hand each mini card's hero the inlined Lottie data (shared loader in
  // assets/loopmoney.js; a fetched src would be blocked under file://).
  root.querySelectorAll('.challenge-mini-anim').forEach((p) => window.playLoopmoney(p));

  // Create Challenge — flow designed later; acknowledge for now (mirrors the
  // settings.js "tutorial" placeholder).
  root.querySelectorAll('[data-action="create"]').forEach((btn) => {
    btn.addEventListener('click', () => showToast('Challenge creation coming soon'));
  });

  /* ---- Full Challenges page (placeholder) ----
     Reuses the Settings `.subpage` slide-in chrome. Header shape mirrors
     settings.js headerHTML(); the body is a placeholder until the
     Current/Finished tabs + explainer cards are designed. */
  const page = document.getElementById('challengesPage');
  const pageRoot = document.getElementById('challengesRoot');
  if (page && pageRoot) {
    const backIcon = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18"/></svg>';
    pageRoot.innerHTML = `
      <header class="subpage-header">
        <button class="btn btn-glass btn-icon-only btn-md subpage-back" id="challengesBack" aria-label="Back">${backIcon}</button>
        <h1 class="subpage-title">Challenges</h1>
        <span aria-hidden="true"></span>
      </header>
      <div class="subpage-body">
        <p class="contests-placeholder">Current &amp; finished challenges coming soon.</p>
      </div>`;

    const open = () => { document.body.classList.add('challenges-open'); page.setAttribute('aria-hidden', 'false'); };
    const close = () => { document.body.classList.remove('challenges-open'); page.setAttribute('aria-hidden', 'true'); };
    root.querySelector('#challengesSeeAll').addEventListener('click', open);
    pageRoot.querySelector('#challengesBack').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('challenges-open')) close();
    });
  }

  /* ---- How-it-works sheet (placeholder) ----
     Bottom sheet opened by "Learn more" on a challenge card. Inner layout
     reuses the contests-page/-head/-title/-placeholder classes. The real
     START/ACCEPT explainer content is designed later. */
  const howto = document.getElementById('howtoSheet');
  const howtoRoot = document.getElementById('howtoRoot');
  const howtoBackdrop = document.getElementById('howtoBackdrop');
  if (howto && howtoRoot) {
    const closeIcon = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>';
    howtoRoot.innerHTML = `
      <div class="contests-page">
        <div class="contests-head">
          <h2 class="contests-title">How it works</h2>
          <button class="btn btn-glass btn-icon-only btn-md" id="howtoClose" aria-label="Close">${closeIcon}</button>
        </div>
        <p class="contests-placeholder">Challenge rules &amp; rewards explained here soon.</p>
      </div>`;

    const openHowto = () => { document.body.classList.add('howto-open'); howto.setAttribute('aria-hidden', 'false'); };
    const closeHowto = () => { document.body.classList.remove('howto-open'); howto.setAttribute('aria-hidden', 'true'); };
    root.querySelectorAll('[data-action="learn"]').forEach((btn) => btn.addEventListener('click', openHowto));
    howtoRoot.querySelector('#howtoClose').addEventListener('click', closeHowto);
    if (howtoBackdrop) howtoBackdrop.addEventListener('click', closeHowto);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('howto-open')) closeHowto();
    });
  }
})();
