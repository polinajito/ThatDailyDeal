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
  // add more entries as the feature grows.
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
    </article>`;

  root.innerHTML = `
    <div class="contests-page">
      <h2 class="contests-title">Contests</h2>
      ${CONTESTS.map(miniCard).join('')}
    </div>`;

  // Hand each mini card's hero the inlined Lottie data (shared loader in
  // assets/loopmoney.js; a fetched src would be blocked under file://).
  root.querySelectorAll('.challenge-mini-anim').forEach((p) => window.playLoopmoney(p));
})();
