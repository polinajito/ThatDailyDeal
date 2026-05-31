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

  // The shared feature block — promo card(s) + weekly stats. Used by both the
  // peek sheet and the top of the full page.
  const featureHTML = `${CONTESTS.map(miniCard).join('')}${weeklyStats}`;

  /* ---- Challenge history (rough demo data) ----
     "Sent" = challenges you started; "Accepted" = ones you joined. Each is a
     past matchup: you vs an opponent, plus who won. */
  const ME = { initials: 'JM' };
  const MATCHES = {
    sent: [
      { opp: { initials: 'SL', name: 'Sarah L.' }, won: true,  reward: '$5.00', topic: 'Weekly Trivia', date: 'May 24' },
      { opp: { initials: 'DR', name: 'Devin R.' }, won: false, reward: '$2.00', topic: 'Weekly Trivia', date: 'May 17' },
      { opp: { initials: 'AK', name: 'Amir K.'  }, won: true,  reward: '$5.00', topic: 'Weekly Trivia', date: 'May 10' },
    ],
    accepted: [
      { opp: { initials: 'MC', name: 'Maya C.'  }, won: false, reward: '$2.00', topic: 'Weekly Trivia', date: 'May 22' },
      { opp: { initials: 'TP', name: 'Theo P.'  }, won: true,  reward: '$5.00', topic: 'Weekly Trivia', date: 'May 12' },
    ],
  };

  const player = (initials, name, winner) => `
    <div class="match-player${winner ? ' is-winner' : ''}">
      <span class="match-avatar">${initials}</span>
      <span class="match-name">${name}</span>
    </div>`;
  const matchCard = (m) => `
    <article class="match-card">
      <div class="match-players">
        ${player(ME.initials, 'You', m.won)}
        <span class="match-vs">vs</span>
        ${player(m.opp.initials, m.opp.name, !m.won)}
      </div>
      <div class="match-meta">
        <span class="match-outcome ${m.won ? 'is-win' : 'is-loss'}">${m.won ? 'You won' : `${m.opp.name} won`} &middot; ${m.reward}</span>
        <span class="match-sub">${m.topic} &middot; ${m.date}</span>
      </div>
    </article>`;

  // Sent/Accepted segmented control + the two match lists (Sent shown first).
  const historyHTML = `
    <div class="seg" role="tablist" aria-label="Challenge history">
      <button class="seg-tab is-active" data-seg="sent" role="tab">Sent</button>
      <button class="seg-tab" data-seg="accepted" role="tab">Accepted</button>
    </div>
    <div class="match-list" data-seg-panel="sent">${MATCHES.sent.map(matchCard).join('')}</div>
    <div class="match-list" data-seg-panel="accepted" hidden>${MATCHES.accepted.map(matchCard).join('')}</div>`;

  // Peek (half-open sheet): action-focused — promo card(s) + a way out to the
  // full Challenges page. "See all" opens that page (built as a placeholder
  // below; its Current/Finished contents are designed later).
  root.innerHTML = `
    <div class="contests-page">
      <div class="contests-head">
        <h2 class="contests-title">Contests</h2>
        <button class="btn btn-glass btn-sm contests-more" id="challengesSeeAll">See all &rarr;</button>
      </div>
      ${featureHTML}
    </div>`;

  /* ---- Full Challenges page ----
     Reuses the Settings `.subpage` slide-in chrome. Shows the same promo card
     + weekly stats as the peek, then Sent/Accepted history tabs. */
  const page = document.getElementById('challengesPage');
  const pageRoot = document.getElementById('challengesRoot');
  if (page && pageRoot) {
    const backIcon = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18"/></svg>';
    pageRoot.innerHTML = `
      <header class="subpage-header">
        <button class="btn btn-glass btn-icon-only btn-md subpage-back" id="challengesBack" aria-label="Back">${backIcon}</button>
        <h1 class="subpage-title">Contests</h1>
        <span aria-hidden="true"></span>
      </header>
      <div class="subpage-body challenges-scroll">
        ${featureHTML}
        ${historyHTML}
      </div>`;

    const open = () => { document.body.classList.add('challenges-open'); page.setAttribute('aria-hidden', 'false'); };
    const close = () => { document.body.classList.remove('challenges-open'); page.setAttribute('aria-hidden', 'true'); };
    root.querySelector('#challengesSeeAll').addEventListener('click', open);
    pageRoot.querySelector('#challengesBack').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('challenges-open')) close();
    });

    // Sent / Accepted tabs — toggle the active pill + which match list shows.
    const seg = pageRoot.querySelector('.seg');
    if (seg) {
      seg.querySelectorAll('.seg-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          seg.querySelectorAll('.seg-tab').forEach((t) => t.classList.toggle('is-active', t === tab));
          pageRoot.querySelectorAll('[data-seg-panel]').forEach((p) => {
            p.hidden = p.dataset.segPanel !== tab.dataset.seg;
          });
        });
      });
    }
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
    // Document-scoped so the promo card on BOTH the peek and the full page wire up.
    document.querySelectorAll('[data-action="learn"]').forEach((btn) => btn.addEventListener('click', openHowto));
    howtoRoot.querySelector('#howtoClose').addEventListener('click', closeHowto);
    if (howtoBackdrop) howtoBackdrop.addEventListener('click', closeHowto);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('howto-open')) closeHowto();
    });
  }

  /* ---- Shared card wiring (peek + page) ----
     Run after every promo card is in the DOM so both instances animate and
     respond. Hand each Lottie hero its inlined data (a fetched src is blocked
     under file://); Create Challenge is acknowledged with a toast for now. */
  document.querySelectorAll('.challenge-mini-anim').forEach((p) => window.playLoopmoney(p));
  document.querySelectorAll('[data-action="create"]').forEach((btn) => {
    btn.addEventListener('click', () => showToast('Challenge creation coming soon'));
  });
})();
