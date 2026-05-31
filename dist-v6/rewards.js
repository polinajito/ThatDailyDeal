/* ============================================================
   ThatDailyDeal — Rewards feature
   Per-feature module (classic script, loaded after v6.js).
   Owns everything inside the `rewards` tab: renders its markup
   into #rewardsRoot and manages its own state. Keeps index.html a
   thin skeleton and v6.js focused on the app shell.

   Convention (see dist-v6/CLAUDE.md):
   - index.html provides only the mount point: <div id="rewardsRoot">
   - shared visuals must come from components.css classes
     (here: the .coupon / .gold-pill / .progress families)
   - feature-only positioning goes in rewards.css
     (.screen-rewards, .rewards-tabs, .points-hero, .rewards-list)

   The stub tap flips a coupon to .is-active and relabels it
   "Activated" (backend wiring deferred), firing the shared toast.
   The rewards-tabs segmented control switches between the live
   "Rewards" list and the placeholder "My Rewards" empty state.
   ============================================================ */
(() => {
  const root = document.getElementById('rewardsRoot');
  if (!root) return;

  // Available coupons. `earned` < `points` renders the locked state
  // (disabled stub + progress bar toward unlock).
  const REWARDS = [
    { id: 'r5',  amount: '$5',  title: '$5 Coupon Code',  sub: 'TDD Store credit · never expires', points: 1000, earned: 3118 },
    { id: 'r10', amount: '$10', title: '$10 Coupon Code', sub: 'TDD Store credit · never expires', points: 1750, earned: 3118 },
    { id: 'r25', amount: '$25', title: '$25 Coupon Code', sub: 'So close — keep earning!',         points: 3250, earned: 3118 },
  ];

  const AVAILABLE_POINTS = 3118;
  const NEXT_REWARD_PTS  = 132;

  const COIN_SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor"/>
      <path d="M12 6l1.6 3.4 3.7.4-2.8 2.6.8 3.6L12 14.2 8.7 16l.8-3.6L6.7 9.8l3.7-.4L12 6z" fill="#fff" opacity=".9"/>
    </svg>`;

  // ----- Screen chrome: header / tabs / points hero / list -----
  root.innerHTML = `
    <header class="half-sheet-header">
      <h2 class="half-sheet-title">Rewards</h2>
      <p class="half-sheet-sub">Earn points, redeem coupons.</p>
    </header>

    <div class="rewards-tabs" role="tablist">
      <button class="rewards-tab is-active" role="tab" aria-selected="true" data-rewards-tab="available">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="6"/>
          <path d="M9 14l-2 8 5-3 5 3-2-8"/>
        </svg>
        Rewards
      </button>
      <button class="rewards-tab" role="tab" aria-selected="false" data-rewards-tab="mine">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/>
        </svg>
        My Rewards
      </button>
    </div>

    <div class="points-hero">
      <span class="points-hero-coin" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6l1.6 3.4 3.7.4-2.8 2.6.8 3.6L12 14.2 8.7 16l.8-3.6L6.7 9.8l3.7-.4L12 6z" fill="#fff" opacity=".9"/>
        </svg>
      </span>
      <div class="points-hero-meta">
        <div class="points-hero-label">Available points</div>
        <div class="points-hero-value" id="rewardsPoints">${AVAILABLE_POINTS.toLocaleString()}</div>
      </div>
      <div class="points-hero-next">
        <span>Next reward</span>
        <b>${NEXT_REWARD_PTS} pts</b>
      </div>
    </div>

    <div class="rewards-list" id="rewardsList"></div>
    <div class="rewards-empty" id="rewardsEmpty" hidden>
      <p>Your activated rewards will appear here.</p>
    </div>`;

  // ----- Coupon rendering -----
  function buildCouponCard(c) {
    const locked = c.earned < c.points;
    const pct    = Math.min(100, Math.round((c.earned / c.points) * 100));
    const el     = document.createElement('div');
    el.className = `coupon coupon-classic${locked ? ' is-locked' : ''}`;
    el.dataset.id = c.id;
    const [dollar, num] = c.amount.startsWith('$') ? ['$', c.amount.slice(1)] : ['', c.amount];
    el.innerHTML = `
      <div class="coupon-body">
        <div class="coupon-art">
          <span class="coupon-amount"><span class="coupon-amount-sup">${dollar}</span>${num}</span>
        </div>
        <div class="coupon-info">
          <h3 class="coupon-title">${c.title}</h3>
          <div class="coupon-sub">${c.sub}</div>
          ${locked ? `<div class="progress" aria-hidden="true"><i style="width: ${pct}%"></i></div>` : ''}
          <div class="coupon-meta">
            <span class="gold-pill points-pill">
              ${COIN_SVG}
              ${locked ? `${c.earned.toLocaleString()}/${c.points.toLocaleString()} pts` : `${c.points.toLocaleString()} pts`}
            </span>
          </div>
        </div>
      </div>
      <button class="stub" ${locked ? 'disabled aria-label="Locked — not enough points"' : `aria-label="Activate ${c.title}"`}>
        <span class="perf" aria-hidden="true"></span>
        <span class="notch top" aria-hidden="true"></span>
        <span class="notch bottom" aria-hidden="true"></span>
        <span class="stub-text">${locked ? 'Locked' : 'Activate'}</span>
      </button>`;
    const stub = el.querySelector('.stub');
    if (!locked) {
      stub.addEventListener('click', (e) => {
        e.stopPropagation();
        activateCoupon(c.id, el);
      });
    }
    return el;
  }

  function activateCoupon(id, el) {
    if (el.classList.contains('is-active')) return;
    el.classList.add('is-active');
    const label = el.querySelector('.stub-text');
    if (label) label.textContent = 'Activated';
    if (typeof showToast === 'function') showToast('Coupon activated');
  }

  function renderRewards() {
    const list = root.querySelector('#rewardsList');
    if (!list) return;
    list.innerHTML = '';
    REWARDS.forEach((c) => list.appendChild(buildCouponCard(c)));
  }

  // ----- Tab switcher: live list vs. "My Rewards" empty state -----
  const rewardsTabBtns = root.querySelectorAll('.rewards-tab');
  const rewardsList    = root.querySelector('#rewardsList');
  const rewardsEmpty   = root.querySelector('#rewardsEmpty');
  rewardsTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      rewardsTabBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      const showAvailable = btn.dataset.rewardsTab === 'available';
      if (rewardsList)  rewardsList.hidden  = !showAvailable;
      if (rewardsEmpty) rewardsEmpty.hidden =  showAvailable;
    });
  });

  renderRewards();
})();
