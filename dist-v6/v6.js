/* ============================================================
   ThatDailyDeal — v6
   Same as v5 (swipe-only deck, tap-to-open product details), with
   a persistent "Today's deals end in HH:MM:SS" countdown banner
   sitting just below the brand bar.
   ============================================================ */

// Preview controls — variant toggles.
// Each entry maps a URL param to a body class (applied when value="off").
// URL param drives initial state (so library iframes and shared links
// work); the on-page segmented control mirrors and updates it. Controls
// are auto-hidden when the page is embedded in an iframe so design
// library previews stay clean.
(() => {
  // Each toggle adds `bodyClass` to <body> when its selected segment's
  // data-value matches `activeValue`. URL syncs to `?<param>=<activeValue>`
  // when active, omits it when default.
  const TOGGLES = [
    { param: 'banner', bodyClass: 'no-banner',    activeValue: 'off',   defaultValue: 'on'      },
    { param: 'scrim',  bodyClass: 'no-scrim',     activeValue: 'off',   defaultValue: 'on'      },
    { param: 'header', bodyClass: 'header-solid', activeValue: 'solid', defaultValue: 'default' },
  ];

  const params = new URLSearchParams(location.search);
  TOGGLES.forEach(({ param, bodyClass, activeValue }) => {
    if (params.get(param) === activeValue) document.body.classList.add(bodyClass);
  });

  const inIframe = window.self !== window.top;
  const controls = document.getElementById('previewControls');
  if (!controls || inIframe) return;
  controls.hidden = false;

  const setState = (cfg, value) => {
    const { param, bodyClass, activeValue } = cfg;
    document.body.classList.toggle(bodyClass, value === activeValue);
    controls.querySelectorAll(`[data-toggle="${param}"]`).forEach((btn) => {
      const active = btn.dataset.value === value;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    const next = new URLSearchParams(location.search);
    if (value === activeValue) next.set(param, activeValue);
    else next.delete(param);
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}${location.hash}` : `${location.pathname}${location.hash}`);
  };

  TOGGLES.forEach((cfg) => {
    const initial = params.get(cfg.param) === cfg.activeValue ? cfg.activeValue : cfg.defaultValue;
    setState(cfg, initial);
  });

  controls.querySelectorAll('.preview-segment').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cfg = TOGGLES.find((t) => t.param === btn.dataset.toggle);
      if (cfg) setState(cfg, btn.dataset.value);
    });
  });
})();

const DEALS = [
  {
    video: 'assets/pack.mp4',
    name: 'Travel Backpack — Daily Carry',
    now: 14.99, old: 49.99, off: 70,
    description: 'Lightweight, water-resistant carry-on built for daily commutes and weekend trips. Padded laptop sleeve, hidden anti-theft pocket, and a luggage pass-through strap. Holds up to 22 liters without bulking out.',
    photos: [
      { type: 'placeholder', label: 'Main view' },
      { type: 'placeholder', label: 'Front view' },
      { type: 'placeholder', label: 'In use' },
    ],
  },
  {
    video: 'assets/neck_fan.mp4',
    name: 'Hands-Free Neck Fan',
    now: 9.99, old: 29.99, off: 67,
    description: 'Wraps comfortably around your neck and pushes 360° airflow without messing up your hair. Three speeds, USB-C rechargeable, runs up to 8 hours on a charge. Whisper-quiet at 28 dB.',
    photos: [
      { type: 'placeholder', label: 'Main view' },
      { type: 'placeholder', label: 'Worn view' },
      { type: 'placeholder', label: 'Charging port' },
    ],
  },
  {
    video: 'assets/pack.mp4',
    name: 'Travel Backpack — Carbon Edition',
    now: 39.99,
    description: 'Premium carbon-weave shell, YKK zippers, and a magnetic chest clip that keeps the straps in place on the move. Fits a 16" laptop, a full change of clothes, and a slim toiletry kit. Lifetime warranty against manufacturing defects.',
    photos: [
      { type: 'placeholder', label: 'Main view' },
      { type: 'placeholder', label: 'Carbon shell detail' },
      { type: 'placeholder', label: 'Interior layout' },
    ],
  },
  {
    video: 'assets/lumbar_support.mp4',
    name: 'Lumbar Support Cushion',
    now: 19.99, old: 59.99, off: 67,
    available: false,
    restockAt: '2026-05-15',
    description: 'Memory foam contoured for your lower back. Adjustable strap fits car seats, office chairs, and gaming chairs. Breathable mesh cover unzips for machine washing.',
    photos: [
      { type: 'placeholder', label: 'Main view' },
      { type: 'placeholder', label: 'On a chair' },
      { type: 'placeholder', label: 'Foam profile' },
    ],
  },
];

const isAvailable = (deal) => deal && deal.available !== false;
const isOnSale    = (deal) => !!(deal && deal.off && deal.old && deal.old > deal.now);

/* ============================================================
   Deck sequence — the order cards appear in the filmstrip: real deals
   with a "challenge" interstitial spliced in as the 3rd card.
   state.index addresses THIS sequence (the track position); each deal
   keeps its own DEALS index for identity (likes, subscriptions, the
   "Deal X of N" counter), so inserting the challenge never renumbers
   the deals.
   ============================================================ */
const CHALLENGE_AFTER = 2;  // challenge appears after the 2nd deal (3rd card)
const SEQUENCE = DEALS.map((deal, dealIdx) => ({ kind: 'deal', deal, dealIdx }));
SEQUENCE.splice(CHALLENGE_AFTER, 0, { kind: 'challenge' });

const seqAt          = (i) => SEQUENCE[i] || null;
const currentDeal    = () => { const s = seqAt(state.index); return s && s.kind === 'deal' ? s.deal : null; };
const currentDealIdx = () => { const s = seqAt(state.index); return s && s.kind === 'deal' ? s.dealIdx : -1; };
const isChallengeCard = (el) => !!el && el.classList.contains('challenge-card');

function formatRestockDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getSubscriptions() {
  try { return JSON.parse(localStorage.getItem('tdd.subscriptions') || '{}'); }
  catch { return {}; }
}
function getSubscription(idx) {
  return getSubscriptions()[idx] || null;
}
function saveSubscription(idx, payload) {
  const all = getSubscriptions();
  all[idx] = payload;
  localStorage.setItem('tdd.subscriptions', JSON.stringify(all));
}
function clearSubscription(idx) {
  const all = getSubscriptions();
  delete all[idx];
  localStorage.setItem('tdd.subscriptions', JSON.stringify(all));
}

const SHIPPING_BASE = 1.89;
const FREE_SHIP_AT  = 4;
const BULK_AT       = 12;
const BULK_RATIO    = 0.4;

const fmt = (n) => `$${n.toFixed(2)}`;

const deck       = document.getElementById('deck');
const cartBadge  = document.getElementById('cartBadge');
const toast      = document.getElementById('toast');

// Cart sheet refs
const sheet       = document.getElementById('cartSheet');
const backdrop    = document.getElementById('sheetBackdrop');
const csThumb     = document.getElementById('csThumb');
const csName      = document.getElementById('csName');
const csQtyLabel  = document.getElementById('csQtyLabel');
const csMinus     = document.getElementById('csMinus');
const csPlus      = document.getElementById('csPlus');
const csSubtotal  = document.getElementById('csSubtotal');
const csShipping  = document.getElementById('csShipping');
const csTotal     = document.getElementById('csTotal');
const csTier1     = document.getElementById('csTier1');
const csTier2     = document.getElementById('csTier2');
const csTier2Perk = document.getElementById('csTier2Perk');
const csConfirm   = document.getElementById('csConfirm');
const csDismiss   = document.getElementById('csDismiss');

// Details sheet refs
const dtSheet     = document.getElementById('detailsSheet');
const dtBackdrop  = document.getElementById('detailsBackdrop');
const dtScroll    = document.getElementById('dtScroll');
const dtCarousel  = document.getElementById('dtCarousel');
const dtDots      = document.getElementById('dtDots');
const dtTitle     = document.getElementById('dtTitle');
const dtNow       = document.getElementById('dtNow');
const dtOld       = document.getElementById('dtOld');
const dtDiscount  = document.getElementById('dtDiscount');
const dtDesc      = document.getElementById('dtDesc');
const dtClose     = document.getElementById('dtClose');
const dtLike      = document.getElementById('dtLike');
const dtShare     = document.getElementById('dtShare');
const dtBuyNow    = document.getElementById('dtBuyNow');
const dtBuyNowPrice = document.getElementById('dtBuyNowPrice');
const dtBuyOldPrice = document.getElementById('dtBuyOldPrice');
const dtBuyLabel  = document.getElementById('dtBuyLabel');
const dtRestock   = document.getElementById('dtRestock');
const dtRestockDate = document.getElementById('dtRestockDate');

// Notify sheet refs
const notifySheet     = document.getElementById('notifySheet');
const notifyBackdrop  = document.getElementById('notifyBackdrop');
const nsThumb         = document.getElementById('nsThumb');
const nsName          = document.getElementById('nsName');
const nsClose         = document.getElementById('nsClose');
const nsPushRow       = document.getElementById('nsPushRow');
const nsPushSub       = document.getElementById('nsPushSub');
const nsEmailRow      = document.getElementById('nsEmailRow');
const nsSubmit        = document.getElementById('nsSubmit');
const nsSkip          = document.getElementById('nsSkip');

const state = {
  index: 0,
  muted: true,
  paused: false,
  liked: new Set(),
  qty: 1,
  notifyOpenForIdx: null,
};

/* ============================================================
   Card builder — includes side buttons so they fly with the card
   ============================================================ */
function buildCard(deal, dealIdx, isUnder) {
  const card = document.createElement('article');
  const soldOut = !isAvailable(deal);
  const onSale = isOnSale(deal);
  const subscribed = !!getSubscription(dealIdx);
  card.className = 'deal-card ' + (isUnder ? 'under' : 'top') + (soldOut ? ' sold-out' : '') + (subscribed ? ' is-subscribed' : '');
  card.dataset.dealIdx = String(dealIdx);
  const isLiked = state.liked.has(dealIdx);
  card.innerHTML = `
    <video class="card-video" src="${deal.video}" autoplay loop playsinline ${state.muted ? 'muted' : ''}></video>
    <div class="card-overlay"></div>
    <div class="deal-counter">Deal ${dealIdx + 1} of ${DEALS.length} for today</div>
    <div class="swipe-stamp stamp-add">Add</div>
    <div class="swipe-stamp stamp-back">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6 -6l6 -6"/>
      </svg>
      Back
    </div>
    <div class="swipe-stamp stamp-next">
      Next
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 6l6 6l-6 6"/>
      </svg>
    </div>
    <div class="swipe-stamp stamp-soldout">Sold Out</div>
    <div class="swipe-stamp stamp-notify">
      <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      Notify
    </div>

    <div class="actions-right">
      <button class="btn btn-glass btn-icon-only btn-md act-btn ${isLiked ? 'is-liked' : ''}" data-act="like" aria-label="Like">
        <svg class="ic-outline" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <svg class="ic-filled" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <button class="btn btn-glass btn-icon-only btn-md act-btn" data-act="share" aria-label="Share">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
      <button class="btn btn-glass btn-icon-only btn-md act-btn" data-act="mute" aria-label="Mute / Unmute">
        <svg class="ic-mute" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
        <svg class="ic-unmute" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      </button>
      <button class="btn btn-glass btn-icon-only btn-md act-btn" data-act="pause" aria-label="Pause / Play">
        <svg class="ic-pause" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <rect x="6"  y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
        <svg class="ic-play" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <polygon points="6 4 20 12 6 20 6 4"/>
        </svg>
      </button>
      <button class="btn btn-glass btn-icon-only btn-md act-btn" data-act="info" aria-label="Product details">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>
    </div>

    <div class="card-top-stack">
      <div class="price-pill">
        <div class="pp-info">
          <div class="pp-name">${deal.name}</div>
          <div class="pp-prices">
            <span class="pp-now">${fmt(deal.now)}</span>
            ${onSale && !soldOut ? `<span class="pp-old">${fmt(deal.old)}</span>` : ''}
            ${onSale && !soldOut ? `<span class="pp-discount">-${deal.off}%</span>` : ''}
          </div>
        </div>
      </div>

      <div class="deals-banner" role="status" aria-live="polite">
        <svg class="deals-banner-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="13" r="8"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="13" x2="15" y2="15"/>
          <line x1="9" y1="2" x2="15" y2="2"/>
        </svg>
        <span>Today's deals end in</span>
        <span class="deals-banner-time">00:00:00</span>
      </div>
    </div>
  `;

  // Wire up all interactive elements inside this card.
  // stopPropagation on pointerdown prevents the swipe gesture from starting.
  card.querySelectorAll('[data-act]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
  });

  const likeBtn = card.querySelector('[data-act="like"]');
  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const liked = toggleLike(dealIdx);
    likeBtn.classList.toggle('is-liked', liked);
    // Keep the details-sheet heart in sync if it's open for this deal.
    if (currentDealIdx() === dealIdx) dtLike.classList.toggle('is-active', liked);
  });

  card.querySelector('[data-act="share"]').addEventListener('click', (e) => {
    e.stopPropagation();
    shareDeal(deal);
  });

  card.querySelector('[data-act="mute"]').addEventListener('click', (e) => {
    e.stopPropagation();
    state.muted = !state.muted;
    document.body.classList.toggle('is-muted', state.muted);
    applyVideoState();
    showToast(state.muted ? 'Muted' : 'Sound on');
  });

  card.querySelector('[data-act="pause"]').addEventListener('click', (e) => {
    e.stopPropagation();
    state.paused = !state.paused;
    document.body.classList.toggle('is-paused', state.paused);
    applyVideoState();
    showToast(state.paused ? 'Paused' : 'Playing');
  });

  card.querySelector('[data-act="info"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openDetails();
  });

  return card;
}

/* ============================================================
   Challenge card — a non-deal interstitial that rides the same
   card stack. Pure promo/CTA card: no video, price, banner, or
   add/skip actions (those are guarded off in bindSwipe — any
   horizontal swipe simply advances past it). Visual lives in
   components.css (.challenge-*).
   ============================================================ */
function buildChallengeCard(isUnder) {
  const card = document.createElement('article');
  card.className = 'challenge-card ' + (isUnder ? 'under' : 'top');
  card.innerHTML = `
    <span class="challenge-badge">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 21H16M12 17V21M12 17C13.33 17 14.6 16.47 15.54 15.54C16.47 14.6 17 13.33 17 12V4H7V12C7 13.33 7.53 14.6 8.46 15.54C9.4 16.47 10.67 17 12 17ZM3 9C3 9.53 3.21 10.04 3.59 10.41C3.96 10.79 4.47 11 5 11C5.53 11 6.04 10.79 6.41 10.41C6.79 10.04 7 9.53 7 9C7 8.47 6.79 7.96 6.41 7.59C6.04 7.21 5.53 7 5 7C4.47 7 3.96 7.21 3.59 7.59C3.21 7.96 3 8.47 3 9ZM17 9C17 9.53 17.21 10.04 17.59 10.41C17.96 10.79 18.47 11 19 11C19.53 11 20.04 10.79 20.41 10.41C20.79 10.04 21 9.53 21 9C21 8.47 20.79 7.96 20.41 7.59C20.04 7.21 19.53 7 19 7C18.47 7 17.96 7.21 17.59 7.59C17.21 7.96 17 8.47 17 9Z"/>
      </svg>
      Play &amp; Win
    </span>

    <span class="challenge-hero" aria-hidden="true">
      <lottie-player class="challenge-anim" autoplay loop background="transparent"></lottie-player>
    </span>

    <h2 class="challenge-title">Win Real Money</h2>
    <p class="challenge-sub">Challenge friends to weekly trivia — winner gets cash toward orders.</p>

    <div class="challenge-rewards">
      <div class="challenge-reward">
        <span class="challenge-reward-get">Get</span>
        <span class="challenge-reward-amount">$5.00</span>
        <span class="challenge-reward-label">for new users</span>
      </div>
      <div class="challenge-reward">
        <span class="challenge-reward-get">Get</span>
        <span class="challenge-reward-amount">$2.00</span>
        <span class="challenge-reward-label">for existing</span>
      </div>
    </div>

    <button class="btn btn-primary btn-lg challenge-cta" data-act="challenge">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      Start a Challenge
    </button>

    <p class="challenge-foot">Swipe to keep browsing deals →</p>
  `;

  // Buttons stop the swipe from starting; the CTA shows a placeholder toast
  // (no challenge flow yet).
  card.querySelectorAll('[data-act]').forEach((el) =>
    el.addEventListener('pointerdown', (e) => e.stopPropagation()));
  card.querySelector('[data-act="challenge"]').addEventListener('click', (e) => {
    e.stopPropagation();
    showToast('Challenge coming soon');
  });

  // Feed the player the inlined animation data rather than a fetched src
  // (a local .json is blocked by CORS under file://). Shared loader lives
  // in assets/loopmoney.js so contests.js + the library reuse it.
  window.playLoopmoney(card.querySelector('.challenge-anim'));

  return card;
}

// Build the card at the given SEQUENCE position — a deal card or the
// challenge interstitial — in top or under state.
function buildSeqCard(seqIndex, isUnder) {
  const item = SEQUENCE[seqIndex];
  if (!item) return null;
  return item.kind === 'challenge'
    ? buildChallengeCard(isUnder)
    : buildCard(item.deal, item.dealIdx, isUnder);
}

function mountDeck() {
  deck.innerHTML = '';

  if (state.index < 0) state.index = 0;
  if (state.index >= SEQUENCE.length) {
    showDealsDone();
    return;
  }
  hideDealsDone();

  // Two-card stack: the current card on top, the next one peeking behind.
  // Swiping the top card flies it off and promotes the under card (flyOff).
  const under = buildSeqCard(state.index + 1, true);
  if (under) deck.appendChild(under);
  const top = buildSeqCard(state.index, false);
  if (top) {
    deck.appendChild(top);
    bindSwipe(top);
  }

  tickBanner();
  applyVideoState();
}

// The card currently on top of the stack (deal or challenge interstitial).
function currentCard() {
  return deck.querySelector('.deal-card.top, .challenge-card.top');
}

function applyVideoState() {
  const topVideo = deck.querySelector('.deal-card.top .card-video');
  if (topVideo) {
    topVideo.muted = state.muted;
    if (state.paused) topVideo.pause();
    else topVideo.play().catch(() => {});
  }
  const underVideo = deck.querySelector('.deal-card.under .card-video');
  if (underVideo) underVideo.muted = true;
}

/* ============================================================
   Swipe gestures
   left  → go back (previous card sweeps in from the right; bounces on
           the first card)
   right → dismiss / advance (current card flies off right, next card
           emerges from behind; last card → "All Deals Viewed!" screen)
   up    → add-to-cart (available) / notify back-in-stock (sold-out)
   tap   → product details
   The challenge interstitial has no add/details actions — left goes
   back, right advances, up does nothing.
   ============================================================ */
const SWIPE_COMMIT  = 80;   // px to commit a swipe (either axis)
const SHOW_THRESH   = 30;   // px before a swipe stamp appears

const STAMP_CLASSES = ['show-add', 'show-notify', 'show-back', 'show-next'];

function bindSwipe(card) {
  let drag = null;
  const challenge = isChallengeCard(card);
  const cardSoldOut = card.classList.contains('sold-out');
  const upStamp = cardSoldOut ? 'show-notify' : 'show-add';

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    drag = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
    card.classList.add('dragging');
    card.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x0;
    drag.dy = e.clientY - drag.y0;
    card.classList.remove(...STAMP_CLASSES);

    if (Math.abs(drag.dx) > Math.abs(drag.dy)) {
      // Horizontal: follow the finger; right = advance, left = back.
      const rot = drag.dx * 0.05;
      card.style.transform = `translate(${drag.dx}px, ${drag.dy * 0.4}px) rotate(${rot}deg)`;
      if (!challenge) {
        if (drag.dx >  SHOW_THRESH) card.classList.add('show-next');
        else if (drag.dx < -SHOW_THRESH) card.classList.add('show-back');
      }
    } else if (drag.dy < 0) {
      // Upward: lift the card; commits to add-to-cart (or notify).
      card.style.transform = `translateY(${drag.dy}px)`;
      if (!challenge && drag.dy < -SHOW_THRESH) card.classList.add(upStamp);
    } else {
      // Downward drag has no action — just track it.
      card.style.transform = `translateY(${drag.dy * 0.4}px)`;
    }
  };

  const onUp = () => {
    if (!drag) return;
    card.classList.remove('dragging', ...STAMP_CLASSES);
    const horizontal = Math.abs(drag.dx) > Math.abs(drag.dy);

    if (horizontal && Math.abs(drag.dx) > SWIPE_COMMIT) {
      if (drag.dx > 0) {
        flyOff('right', card);               // dismiss / advance (last card → end screen)
      } else if (state.index <= 0) {
        bounce(card);                         // nothing behind the first card
      } else {
        goBack();                             // previous card sweeps in from the right
      }
    } else if (!horizontal && drag.dy < -SWIPE_COMMIT) {
      card.style.transform = '';              // snap back, stay on the card
      if (!challenge) {
        if (cardSoldOut) openNotifySheet();
        else openCartSheet();
      }
    } else {
      card.style.transform = '';
      // No meaningful drag → treat as a tap and open the details sheet.
      // Buttons inside the card stop propagation on pointerdown, so taps
      // on like/share/mute/pause never reach this handler. The challenge
      // card has no details sheet.
      if (!challenge && Math.abs(drag.dx) < 6 && Math.abs(drag.dy) < 6) {
        openDetails();
      }
    }
    drag = null;
  };

  card.addEventListener('pointerdown', onDown);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerup', onUp);
  card.addEventListener('pointercancel', () => {
    card.classList.remove('dragging', ...STAMP_CLASSES);
    if (drag) card.style.transform = '';
    drag = null;
  });
}

/* ============================================================
   Fly-off / advance helpers
   Smoothly animate: top flies off, under glides forward, new under
   slips in behind. No hard rebuild of the deck — the under card is
   reused, so the CSS transition carries it from under-state to
   top-state in one continuous motion. Walks SEQUENCE, so the next
   card may be a deal or the challenge interstitial.
   ============================================================ */
const TRANSITION_MS = 420;

function flyOff(direction, cardEl) {
  const oldTop = cardEl || currentCard();
  if (!oldTop) return;

  // Old top: animate off-screen.
  oldTop.style.transform = '';
  oldTop.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');

  const oldUnder = deck.querySelector('.deal-card.under, .challenge-card.under');

  if (oldUnder) {
    // Promote under → top (transition animates from under-state to identity).
    oldUnder.classList.remove('under');
    oldUnder.classList.add('top');
    bindSwipe(oldUnder);

    state.index += 1;
    state.paused = false;
    document.body.classList.remove('is-paused');

    // Build the new under card (the item after the new top), if any.
    const newUnder = buildSeqCard(state.index + 1, true);
    if (newUnder) deck.insertBefore(newUnder, deck.firstChild);

    tickBanner();
    applyVideoState();
  } else {
    // No more cards — show the "All Deals Viewed!" screen after the fly-off.
    state.index = SEQUENCE.length;
    setTimeout(showDealsDone, TRANSITION_MS - 80);
  }

  // Clean up the flown-off card after its animation completes.
  setTimeout(() => oldTop.remove(), TRANSITION_MS);
}

/* A back-swipe on the first card has nothing behind it — nudge the card
   and spring it back (keyframes live in v6.css). */
function bounce(cardEl) {
  const el = cardEl || currentCard();
  if (!el) return;
  el.style.transform = '';
  el.classList.add('bounce');
  setTimeout(() => el.classList.remove('bounce'), 320);
}

/* ============================================================
   Go back — the mirror of flyOff. The current top demotes to the
   under (next) slot and the previous card sweeps back in from the
   left, over it. state.index is the source of truth, so the demoted
   card stays correctly addressed for a later forward swipe.
   ============================================================ */
function goBack() {
  if (state.index <= 0) return;

  const oldTop   = currentCard();
  const oldUnder = deck.querySelector('.deal-card.under, .challenge-card.under');
  if (oldUnder) oldUnder.remove();          // old "next" — no longer adjacent

  if (oldTop) {                             // demote current top → under
    oldTop.classList.remove('top');
    oldTop.classList.add('under');
    oldTop.style.transform = '';
  }

  state.index -= 1;
  state.paused = false;
  document.body.classList.remove('is-paused');

  // Build the previous card and slide it in from the left (reverse of a
  // left fly-off) so it sweeps over the current card.
  const prev = buildSeqCard(state.index, false);
  prev.style.transition = 'none';
  prev.style.transform  = 'translateX(-140vw) rotate(-22deg)';
  prev.style.opacity    = '0';
  deck.appendChild(prev);
  bindSwipe(prev);
  void prev.offsetWidth;                    // force reflow so the next change animates
  prev.style.transition = '';
  prev.style.transform  = '';
  prev.style.opacity    = '';

  tickBanner();
  applyVideoState();
}

/* ============================================================
   Product details sheet
   Built on top of the current top-card deal. Slides up from the
   bottom with a horizontally-snapping photo carousel, description,
   and a sticky Add-to-Cart CTA that always stays in view.
   ============================================================ */
function buildSlide(photo) {
  const slide = document.createElement('div');
  slide.className = 'dt-slide';
  if (photo.src) {
    // Real product photo (none yet — placeholders are used until assets land).
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label || '';
    slide.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'dt-slide-placeholder';
    ph.textContent = photo.label || '';
    slide.appendChild(ph);
  }
  return slide;
}

function updateDots() {
  const slideWidth = dtCarousel.clientWidth;
  if (!slideWidth) return;
  const idx = Math.round(dtCarousel.scrollLeft / slideWidth);
  dtDots.querySelectorAll('.dt-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });
}

/* Shared like/share behavior — used by both the deck card action stack and
   the details-sheet CTA bar so the two stay in sync and we avoid duplication. */
function toggleLike(idx) {
  const liked = !state.liked.has(idx);
  if (liked) state.liked.add(idx);
  else state.liked.delete(idx);
  showToast(liked ? 'Liked' : 'Unliked');
  return liked;
}

async function shareDeal(deal) {
  const priceText = isOnSale(deal)
    ? `${fmt(deal.now)} (was ${fmt(deal.old)})`
    : fmt(deal.now);
  const data = {
    title: deal.name,
    text: `Check out this deal: ${deal.name} for ${priceText}`,
    url: location.href,
  };
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* user cancelled */ }
  } else {
    try {
      await navigator.clipboard.writeText(`${data.text} ${data.url}`);
      showToast('Link copied');
    } catch {
      showToast('Share unavailable');
    }
  }
}

function openDetails() {
  const d = currentDeal();
  if (!d) return;

  dtTitle.textContent    = d.name;
  dtNow.textContent      = fmt(d.now);
  const dOnSale          = isOnSale(d);
  if (dOnSale) {
    dtOld.textContent      = fmt(d.old);
    dtDiscount.textContent = `-${d.off}%`;
    dtOld.hidden = false;
    dtDiscount.hidden = false;
  } else {
    dtOld.textContent = '';
    dtDiscount.textContent = '';
    dtOld.hidden = true;
    dtDiscount.hidden = true;
  }
  dtDesc.textContent     = d.description || '';

  dtCarousel.innerHTML = '';
  dtDots.innerHTML = '';
  (d.photos || []).forEach((photo, i) => {
    dtCarousel.appendChild(buildSlide(photo));
    const dot = document.createElement('span');
    dot.className = 'dt-dot' + (i === 0 ? ' active' : '');
    dtDots.appendChild(dot);
  });
  dtCarousel.scrollLeft = 0;
  dtScroll.scrollTop = 0;

  // Swap CTA copy + behavior when the deal is sold out
  const soldOut = !isAvailable(d);
  document.body.classList.toggle('dt-sold-out', soldOut);

  // Show restock date row when sold-out and we have a date
  const restockText = soldOut ? formatRestockDate(d.restockAt) : '';
  if (restockText) {
    dtRestockDate.textContent = restockText;
    dtRestock.hidden = false;
  } else {
    dtRestock.hidden = true;
  }
  // Buy-now CTA: "Buy now  $now  $old" (old struck through). When sold out it
  // becomes a notify prompt with no price.
  if (soldOut) {
    dtBuyLabel.textContent = 'Notify me when back in stock';
    dtBuyNowPrice.hidden = true;
    dtBuyOldPrice.hidden = true;
    dtBuyNow.setAttribute('aria-label', 'Notify me when back in stock');
  } else {
    dtBuyLabel.textContent = 'Buy now';
    dtBuyNowPrice.textContent = fmt(d.now);
    dtBuyNowPrice.hidden = false;
    if (dOnSale) {
      dtBuyOldPrice.textContent = fmt(d.old);
      dtBuyOldPrice.hidden = false;
    } else {
      dtBuyOldPrice.hidden = true;
    }
    dtBuyNow.setAttribute('aria-label', `Buy now ${fmt(d.now)}`);
  }

  // Reflect this deal's like state on the heart toggle.
  const liked = state.liked.has(currentDealIdx());
  dtLike.classList.toggle('is-active', liked);
  dtLike.setAttribute('aria-pressed', String(liked));

  document.body.classList.add('details-open');

  const topVideo = currentCard()?.querySelector('.card-video');
  if (topVideo) topVideo.pause();
}

function closeDetails() {
  document.body.classList.remove('details-open');
  dtCarousel.querySelectorAll('video').forEach((v) => v.pause());
  if (!state.paused) applyVideoState();
}

dtCarousel.addEventListener('scroll', updateDots);
dtClose.addEventListener('click', closeDetails);
dtBackdrop.addEventListener('click', closeDetails);

dtLike.addEventListener('click', () => {
  const idx = currentDealIdx();
  if (idx < 0) return;
  const liked = toggleLike(idx);
  dtLike.classList.toggle('is-active', liked);
  dtLike.setAttribute('aria-pressed', String(liked));
  // Keep the deck card heart in sync.
  currentCard()?.querySelector('[data-act="like"]')?.classList.toggle('is-liked', liked);
});

dtShare.addEventListener('click', () => {
  const d = currentDeal();
  if (d) shareDeal(d);
});

dtBuyNow.addEventListener('click', () => {
  const soldOut = !isAvailable(currentDeal());
  closeDetails();
  if (soldOut) openNotifySheet();
  else openCartSheet();
});

/* ============================================================
   Cart sheet
   ============================================================ */
function calcPrices(deal, qty) {
  const bulkPrice = deal.now * BULK_RATIO;
  const unit      = qty >= BULK_AT ? bulkPrice : deal.now;
  const subtotal  = unit * qty;
  const shipping  = qty >= FREE_SHIP_AT ? 0 : SHIPPING_BASE;
  return { unit, subtotal, shipping, total: subtotal + shipping, bulkPrice };
}

/* ----- Cart store -----------------------------------------------------
   One entry per distinct deal: { dealIdx, qty }. The add-to-cart sheet
   (this file) writes here; the Cart tab (cart.js, a separate classic
   script) reads + edits here. Both go through window.TDDCart so the
   feature file stays decoupled from these module-scoped helpers. Every
   mutation fires a 'cart:change' event the Cart tab re-renders on, and
   keeps the nav badge in sync. */
const cart = [];

const cartTotalQty = () => cart.reduce((sum, item) => sum + item.qty, 0);

function syncCartBadge(animate) {
  cartBadge.textContent = String(cartTotalQty());
  if (animate) {
    cartBadge.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' }
    );
  }
}

function emitCartChange() {
  window.dispatchEvent(new CustomEvent('cart:change'));
}

function addToCart(dealIdx, qty) {
  if (dealIdx < 0 || qty < 1) return;
  const existing = cart.find((item) => item.dealIdx === dealIdx);
  if (existing) existing.qty += qty;
  else cart.push({ dealIdx, qty });
  syncCartBadge(true);
  emitCartChange();
}

function setCartQty(dealIdx, qty) {
  const item = cart.find((i) => i.dealIdx === dealIdx);
  if (!item) return;
  if (qty < 1) { removeFromCart(dealIdx); return; }
  item.qty = qty;
  syncCartBadge(false);
  emitCartChange();
}

function removeFromCart(dealIdx) {
  const i = cart.findIndex((it) => it.dealIdx === dealIdx);
  if (i === -1) return;
  cart.splice(i, 1);
  syncCartBadge(false);
  emitCartChange();
}

// Public surface for cart.js — getItems hands over deal objects already
// resolved from DEALS so the feature file never touches the catalog.
window.TDDCart = {
  getItems: () => cart.map((item) => ({ dealIdx: item.dealIdx, qty: item.qty, deal: DEALS[item.dealIdx] })),
  totalQty: cartTotalQty,
  setQty: setCartQty,
  remove: removeFromCart,
  calcPrices,
  fmt,
  isOnSale,
  constants: { SHIPPING_BASE, FREE_SHIP_AT, BULK_AT, BULK_RATIO },
};

function refreshSheet() {
  const d = currentDeal();
  const { subtotal, shipping, total, bulkPrice } = calcPrices(d, state.qty);
  csQtyLabel.textContent = `${state.qty} ${state.qty === 1 ? 'piece' : 'pieces'}`;
  csSubtotal.textContent = fmt(subtotal);
  csShipping.textContent = shipping === 0 ? 'Free' : fmt(shipping);
  csTotal.textContent    = fmt(total);
  csTier2Perk.textContent = `Free shipping + ${fmt(bulkPrice)} each`;
  csMinus.disabled = state.qty <= 1;

  // Highlight whichever bundle the current qty falls into, mirroring the
  // FREE_SHIP_AT / BULK_AT thresholds used by calcPrices.
  const tier1Active = state.qty >= FREE_SHIP_AT && state.qty < BULK_AT;
  const tier2Active = state.qty >= BULK_AT;
  csTier1.classList.toggle('is-active', tier1Active);
  csTier2.classList.toggle('is-active', tier2Active);
  csTier1.setAttribute('aria-pressed', String(tier1Active));
  csTier2.setAttribute('aria-pressed', String(tier2Active));
}

function openCartSheet() {
  const d = currentDeal();
  if (!d) return;
  state.qty = 1;
  csName.textContent = d.name;
  csThumb.src = d.video;
  csThumb.play().catch(() => {});
  refreshSheet();
  document.body.classList.add('sheet-open');
}

function closeCartSheet() {
  document.body.classList.remove('sheet-open');
  csThumb.pause();
}

csMinus.addEventListener('click', () => {
  if (state.qty > 1) { state.qty -= 1; refreshSheet(); }
});
csPlus.addEventListener('click', () => {
  state.qty += 1; refreshSheet();
});
// Tapping a bundle jumps qty to that tier's entry point — the exact
// threshold that unlocks its perk. The stepper still handles fine-tuning.
csTier1.addEventListener('click', () => { state.qty = FREE_SHIP_AT; refreshSheet(); });
csTier2.addEventListener('click', () => { state.qty = BULK_AT; refreshSheet(); });
csDismiss.addEventListener('click', closeCartSheet);
backdrop.addEventListener('click', closeCartSheet);

csConfirm.addEventListener('click', () => {
  const qty = state.qty;
  addToCart(currentDealIdx(), qty);
  showToast(`Added ×${qty}`);
  closeCartSheet();
  // Stay on the current deal — the user can keep scrubbing the deck.
});

/* ============================================================
   "All Deals Viewed!" overlay + countdown to next reset (midnight)
   The persistent banner below the brand bar shares the same
   midnight target — see startBannerTicker below.
   ============================================================ */
const dealsDoneEl = document.getElementById('dealsDone');
const ddHrs = document.getElementById('ddHrs');
const ddMin = document.getElementById('ddMin');
const ddSec = document.getElementById('ddSec');
let countdownTimer = null;

function pad2(n) { return String(n).padStart(2, '0'); }

function midnightDiff() {
  const target = new Date();
  target.setHours(24, 0, 0, 0); // next midnight
  return Math.max(0, target.getTime() - Date.now());
}

function tickCountdown() {
  const diff = midnightDiff();
  ddHrs.textContent = pad2(Math.floor(diff / 3600000));
  ddMin.textContent = pad2(Math.floor((diff % 3600000) / 60000));
  ddSec.textContent = pad2(Math.floor((diff % 60000) / 1000));
}

function tickBanner() {
  const diff = midnightDiff();
  const h = pad2(Math.floor(diff / 3600000));
  const m = pad2(Math.floor((diff % 3600000) / 60000));
  const s = pad2(Math.floor((diff % 60000) / 1000));
  const text = `${h}:${m}:${s}`;
  document.querySelectorAll('.deals-banner-time').forEach(el => { el.textContent = text; });
}

tickBanner();
setInterval(tickBanner, 1000);

function showDealsDone() {
  dealsDoneEl.hidden = false;
  document.body.classList.add('deals-complete');
  // Pause every deck video while the overlay covers the deck.
  deck.querySelectorAll('.card-video').forEach((v) => v.pause());
  tickCountdown();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(tickCountdown, 1000);
}

function hideDealsDone() {
  dealsDoneEl.hidden = true;
  document.body.classList.remove('deals-complete');
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

document.getElementById('ddRestart').addEventListener('click', () => {
  state.index = 0;
  hideDealsDone();
  mountDeck();
});

document.getElementById('ddCheckout').addEventListener('click', () => {
  showToast('Checkout — coming soon');
});

/* ============================================================
   Toast
   ============================================================ */
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1300);
}

const richToast      = document.getElementById('richToast');
const richToastTitle = document.getElementById('richToastTitle');
const richToastSub   = document.getElementById('richToastSub');
let   richToastTimer;
function showRichToast({ title, subtitle, duration = 2800 }) {
  richToastTitle.textContent = title;
  richToastSub.textContent   = subtitle;
  richToast.classList.add('show');
  clearTimeout(richToastTimer);
  richToastTimer = setTimeout(() => richToast.classList.remove('show'), duration);
}

/* ============================================================
   Bottom nav — selected tab + "Coming soon" for non-Deals
   ============================================================ */
const navBtns = document.querySelectorAll('.bottom-nav .menu-item');

function setHidePosition(screen, x, y) {
  screen.style.setProperty('--hide-x', x);
  screen.style.setProperty('--hide-y', y);
}

function preposition(screen, x, y) {
  screen.style.transition = 'none';
  setHidePosition(screen, x, y);
  void screen.offsetWidth;
  screen.style.transition = '';
}

function switchTab(newTab) {
  const prev = document.body.dataset.tab;
  if (newTab === prev) return;

  // Sheets always travel vertically: the open sheet slides back down to the
  // bottom while the new one rises from the bottom. Switching between two
  // sheets runs both at once (old closes, new opens) rather than swapping
  // them horizontally.
  if (prev !== 'deals') {
    const outgoing = document.querySelector(`.screen[data-tab="${prev}"]`);
    if (outgoing) setHidePosition(outgoing, '0', '120%');
  }
  if (newTab !== 'deals') {
    const incoming = document.querySelector(`.screen[data-tab="${newTab}"]`);
    if (incoming) preposition(incoming, '0', '120%');
  }

  document.body.dataset.tab = newTab;
}

// Select a tab and sync the nav highlight + video state. The highlight is the
// "you are here" cue that makes re-tap-to-close a natural guess.
function selectTab(tab) {
  navBtns.forEach((b) => b.classList.toggle('is-selected', b.dataset.tab === tab));
  switchTab(tab);
  applyVideoState();
}

// Closing any sheet just routes back to the Deals home screen.
function closeSheet() {
  selectTab('deals');
}

navBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const tab = btn.dataset.tab;
    // Re-tap the tab whose sheet is already open → close back to Deals.
    if (tab !== 'deals' && tab === document.body.dataset.tab) {
      closeSheet();
    } else {
      selectTab(tab);
    }
  });
});

/* ============================================================
   Notify-me sheet (sold-out flow)
   ============================================================ */
const pushSupported = typeof window !== 'undefined' && 'Notification' in window;

function setSwitch(rowEl, on) {
  rowEl.querySelector('.ns-switch').dataset.on = on ? 'true' : 'false';
  const input = rowEl.querySelector('input[type="checkbox"]');
  if (input) input.checked = !!on;
}
function getSwitch(rowEl) {
  return rowEl.querySelector('.ns-switch').dataset.on === 'true';
}

function refreshNotifyCTA() {
  const pushOn  = getSwitch(nsPushRow);
  const emailOn = getSwitch(nsEmailRow);
  nsSubmit.disabled = !(pushOn || emailOn);
}

function applyPushSupportUI() {
  const denied = pushSupported && Notification.permission === 'denied';
  if (!pushSupported) {
    nsPushRow.classList.add('is-disabled');
    nsPushSub.textContent = 'Not available on this device';
    setSwitch(nsPushRow, false);
  } else if (denied) {
    nsPushRow.classList.add('is-disabled');
    nsPushSub.textContent = 'Blocked — enable in browser settings';
    setSwitch(nsPushRow, false);
  } else {
    nsPushRow.classList.remove('is-disabled');
    nsPushSub.textContent = 'Instant alert, one tap';
  }
}

function openNotifySheet() {
  const idx = currentDealIdx();
  const d = DEALS[idx];
  if (!d) return;

  state.notifyOpenForIdx = idx;
  nsName.textContent = d.name;
  nsThumb.src = d.video;
  nsThumb.play().catch(() => {});

  // Pre-fill switches from any saved subscription so users can edit/turn off.
  const existing = getSubscription(idx);
  setSwitch(nsPushRow, !!existing?.push);
  setSwitch(nsEmailRow, !!existing?.email);
  applyPushSupportUI();
  refreshNotifyCTA();

  document.body.classList.add('notify-open');

  const topVideo = currentCard()?.querySelector('.card-video');
  if (topVideo) topVideo.pause();
}

function closeNotifySheet() {
  document.body.classList.remove('notify-open');
  nsThumb.pause();
  state.notifyOpenForIdx = null;
  if (!state.paused) applyVideoState();
}

async function requestPushPermission() {
  if (!pushSupported) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

nsPushRow.addEventListener('click', async (e) => {
  if (nsPushRow.classList.contains('is-disabled')) return;
  e.preventDefault();
  const next = !getSwitch(nsPushRow);
  if (next) {
    const granted = await requestPushPermission();
    if (!granted) {
      setSwitch(nsPushRow, false);
      applyPushSupportUI();
      refreshNotifyCTA();
      return;
    }
  }
  setSwitch(nsPushRow, next);
  refreshNotifyCTA();
});

nsEmailRow.addEventListener('click', (e) => {
  e.preventDefault();
  setSwitch(nsEmailRow, !getSwitch(nsEmailRow));
  refreshNotifyCTA();
});

nsSubmit.addEventListener('click', () => {
  const idx = state.notifyOpenForIdx;
  if (idx == null) return;
  const pushOn = getSwitch(nsPushRow);
  const emailOn = getSwitch(nsEmailRow);
  if (!pushOn && !emailOn) return;

  saveSubscription(idx, {
    push: pushOn,
    email: emailOn,
    createdAt: new Date().toISOString(),
  });

  // Flip the badge on the corresponding card to gold "On the list".
  const cardEl = deck.querySelector(`.deal-card[data-deal-idx="${idx}"]`);
  if (cardEl) {
    cardEl.classList.add('is-subscribed');
  }

  // Prototype-only: fire a local push confirmation so the channel feels real.
  if (pushOn && pushSupported && Notification.permission === 'granted') {
    try {
      new Notification("You're on the list", {
        body: `We'll let you know when ${DEALS[idx].name} is back.`,
      });
    } catch { /* some browsers only allow Notification from a SW */ }
  }

  const channels = [pushOn && 'push', emailOn && 'email'].filter(Boolean).join(' & ');
  const restock  = formatRestockDate(DEALS[idx].restockAt);
  const subtitle = restock
    ? `We'll notify you via ${channels} when it's back on ${restock}.`
    : `We'll notify you via ${channels} the moment it's back.`;
  showRichToast({ title: "You're on the list", subtitle });
  closeNotifySheet();
});

nsSkip.addEventListener('click', () => {
  closeNotifySheet();
  flyOff('left', currentCard());
});

nsClose.addEventListener('click', closeNotifySheet);
notifyBackdrop.addEventListener('click', closeNotifySheet);

/* ============================================================
   Flag info popup — taps open the centred "America based" modal.
   ============================================================ */
const flagBtn = document.getElementById('flagBtn');
const flagPopup = document.getElementById('flagPopup');
const flagBackdrop = document.getElementById('flagBackdrop');

function hideFlagPopup() {
  document.body.classList.remove('flag-popup-open');
  flagBtn.setAttribute('aria-expanded', 'false');
}
function showFlagPopup() {
  document.body.classList.add('flag-popup-open');
  flagBtn.setAttribute('aria-expanded', 'true');
}

flagBtn.addEventListener('click', (e) => {
  e.stopPropagation();   // don't let the document handler instantly re-close it
  if (document.body.classList.contains('flag-popup-open')) hideFlagPopup();
  else showFlagPopup();
});
// Tap the close X, the "Okay, cool" CTA, the backdrop, anywhere else, or
// press Escape to dismiss.
document.getElementById('flagClose').addEventListener('click', hideFlagPopup);
document.getElementById('flagOk').addEventListener('click', hideFlagPopup);
flagBackdrop.addEventListener('click', hideFlagPopup);
flagPopup.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => hideFlagPopup());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideFlagPopup();
});

/* ============================================================
   Boot
   ============================================================ */
document.body.classList.add('is-muted');
document.body.dataset.tab = 'deals';
mountDeck();
