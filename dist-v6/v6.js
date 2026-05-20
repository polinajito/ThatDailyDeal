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
  const TOGGLES = [
    { param: 'banner', bodyClass: 'no-banner' },
    { param: 'scrim',  bodyClass: 'no-scrim'  },
  ];

  const params = new URLSearchParams(location.search);
  TOGGLES.forEach(({ param, bodyClass }) => {
    if (params.get(param) === 'off') document.body.classList.add(bodyClass);
  });

  const inIframe = window.self !== window.top;
  const controls = document.getElementById('previewControls');
  if (!controls || inIframe) return;
  controls.hidden = false;

  const setState = (param, bodyClass, value) => {
    document.body.classList.toggle(bodyClass, value === 'off');
    controls.querySelectorAll(`[data-toggle="${param}"]`).forEach((btn) => {
      const active = btn.dataset.value === value;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    const next = new URLSearchParams(location.search);
    if (value === 'off') next.set(param, 'off');
    else next.delete(param);
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}${location.hash}` : `${location.pathname}${location.hash}`);
  };

  TOGGLES.forEach(({ param, bodyClass }) => {
    const initial = params.get(param) === 'off' ? 'off' : 'on';
    setState(param, bodyClass, initial);
  });

  controls.querySelectorAll('.preview-segment').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cfg = TOGGLES.find((t) => t.param === btn.dataset.toggle);
      if (cfg) setState(cfg.param, cfg.bodyClass, btn.dataset.value);
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
      { type: 'video', src: 'assets/pack.mp4' },
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
      { type: 'video', src: 'assets/neck_fan.mp4' },
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
      { type: 'video', src: 'assets/pack.mp4' },
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
      { type: 'video', src: 'assets/lumbar_support.mp4' },
      { type: 'placeholder', label: 'On a chair' },
      { type: 'placeholder', label: 'Foam profile' },
    ],
  },
];

const isAvailable = (deal) => deal && deal.available !== false;
const isOnSale    = (deal) => !!(deal && deal.off && deal.old && deal.old > deal.now);

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
const dtAddToCart = document.getElementById('dtAddToCart');
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
  cartCount: 0,
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
    <div class="swipe-stamp stamp-skip">Skip</div>
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
  `;

  // Wire up all interactive elements inside this card.
  // stopPropagation on pointerdown prevents the swipe gesture from starting.
  card.querySelectorAll('[data-act]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
  });

  const likeBtn = card.querySelector('[data-act="like"]');
  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.liked.has(dealIdx)) state.liked.delete(dealIdx);
    else state.liked.add(dealIdx);
    likeBtn.classList.toggle('is-liked', state.liked.has(dealIdx));
    showToast(state.liked.has(dealIdx) ? 'Liked' : 'Unliked');
  });

  card.querySelector('[data-act="share"]').addEventListener('click', async (e) => {
    e.stopPropagation();
    const priceText = onSale
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

  const notifyBtn = card.querySelector('[data-act="notify"]');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifyBackInStock();
    });
  }

  return card;
}

function mountDeck() {
  deck.innerHTML = '';

  if (state.index >= DEALS.length) {
    showDealsDone();
    return;
  }
  hideDealsDone();

  const top      = DEALS[state.index];
  const underIdx = state.index + 1;
  const under    = underIdx < DEALS.length ? DEALS[underIdx] : null;

  if (under) deck.appendChild(buildCard(under, underIdx, true));
  if (top) {
    const topCard = buildCard(top, state.index, false);
    deck.appendChild(topCard);
    bindSwipe(topCard);
  }

  tickBanner();
  applyVideoState();
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
   left  → skip (fly off)
   right → open add-to-cart sheet (snap card back)
   ============================================================ */
const SWIPE_COMMIT  = 80;
const SHOW_THRESH   = 30;

function bindSwipe(card) {
  let drag = null;
  const cardSoldOut = card.classList.contains('sold-out');
  const rightStamp = cardSoldOut ? 'show-notify' : 'show-add';

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

    if (Math.abs(drag.dx) > Math.abs(drag.dy)) {
      const rot = drag.dx * 0.05;
      card.style.transform = `translate(${drag.dx}px, ${drag.dy * 0.4}px) rotate(${rot}deg)`;

      if (drag.dx >  SHOW_THRESH) {
        card.classList.add(rightStamp);
        card.classList.remove('show-skip');
      } else if (drag.dx < -SHOW_THRESH) {
        card.classList.add('show-skip');
        card.classList.remove(rightStamp);
      } else {
        card.classList.remove('show-add', 'show-notify', 'show-skip');
      }
    }
  };

  const onUp = () => {
    if (!drag) return;
    card.classList.remove('dragging', 'show-add', 'show-notify', 'show-skip');

    if (Math.abs(drag.dx) > SWIPE_COMMIT && Math.abs(drag.dx) > Math.abs(drag.dy)) {
      if (drag.dx > 0) {
        if (cardSoldOut) {
          notifyBackInStock();
          flyOff('right', card);
        } else {
          card.style.transform = '';   // snap back
          openCartSheet();
        }
      } else {
        skipDeal(card);
      }
    } else {
      card.style.transform = '';
      // No meaningful drag → treat as a tap and open the details sheet.
      // Buttons inside the card stop propagation on pointerdown, so taps
      // on like/share/mute/pause never reach this handler.
      if (Math.abs(drag.dx) < 6 && Math.abs(drag.dy) < 6) {
        openDetails();
      }
    }
    drag = null;
  };

  card.addEventListener('pointerdown', onDown);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerup', onUp);
  card.addEventListener('pointercancel', () => {
    card.classList.remove('dragging', 'show-add', 'show-notify', 'show-skip');
    if (drag) card.style.transform = '';
    drag = null;
  });
}

/* ============================================================
   Fly-off / advance helpers
   Smoothly animate: top flies off, under glides forward, new under
   slips in behind. No hard rebuild of the deck — the under-card is
   reused, so the CSS transition carries it from under-state to
   top-state in one continuous motion.
   ============================================================ */
const TRANSITION_MS = 420;

function flyOff(direction, cardEl) {
  const oldTop = cardEl || deck.querySelector('.deal-card.top');
  if (!oldTop) return;

  // Old top: animate off-screen
  oldTop.style.transform = '';
  oldTop.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');

  const oldUnder = deck.querySelector('.deal-card.under');

  if (oldUnder) {
    // Promote under → top (transition animates from under-state to identity)
    oldUnder.classList.remove('under');
    oldUnder.classList.add('top');
    bindSwipe(oldUnder);

    state.index += 1;
    state.paused = false;
    document.body.classList.remove('is-paused');

    // Build new under (deal after the new top), if there is one
    const newUnderIdx = state.index + 1;
    if (newUnderIdx < DEALS.length) {
      const newUnder = buildCard(DEALS[newUnderIdx], newUnderIdx, true);
      deck.insertBefore(newUnder, deck.firstChild);
    }

    tickBanner();
    applyVideoState();
  } else {
    // No more deals — show the "All Deals Viewed!" screen after the fly-off
    state.index = DEALS.length;
    setTimeout(showDealsDone, TRANSITION_MS - 80);
  }

  // Clean up the flown-off card after its animation completes
  setTimeout(() => oldTop.remove(), TRANSITION_MS);
}

function skipDeal(cardEl) {
  showToast('Skipped');
  flyOff('left', cardEl);
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
  if (photo.type === 'video') {
    const v = document.createElement('video');
    v.src = photo.src;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    slide.appendChild(v);
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

function openDetails() {
  const d = DEALS[state.index];
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
  dtAddToCart.innerHTML = soldOut
    ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
         <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
         <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
       </svg>
       Notify me when back in stock`
    : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
         <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
         <line x1="3" y1="6" x2="21" y2="6"/>
         <path d="M16 10a4 4 0 0 1-8 0"/>
       </svg>
       Add to Cart`;
  dtAddToCart.setAttribute('aria-label', soldOut ? 'Notify me when back in stock' : 'Add to cart');

  document.body.classList.add('details-open');

  const topVideo = deck.querySelector('.deal-card.top .card-video');
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
dtAddToCart.addEventListener('click', () => {
  const soldOut = !isAvailable(DEALS[state.index]);
  closeDetails();
  if (soldOut) notifyBackInStock();
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

function refreshSheet() {
  const d = DEALS[state.index];
  const { subtotal, shipping, total, bulkPrice } = calcPrices(d, state.qty);
  csQtyLabel.textContent = `${state.qty} ${state.qty === 1 ? 'piece' : 'pieces'}`;
  csSubtotal.textContent = fmt(subtotal);
  csShipping.textContent = shipping === 0 ? 'Free' : fmt(shipping);
  csTotal.textContent    = fmt(total);
  csTier2Perk.textContent = `Free Shipping + Price drops to ${fmt(bulkPrice)} each`;
  csMinus.disabled = state.qty <= 1;
}

function openCartSheet() {
  const d = DEALS[state.index];
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
csDismiss.addEventListener('click', closeCartSheet);
backdrop.addEventListener('click', closeCartSheet);

csConfirm.addEventListener('click', () => {
  const qty = state.qty;
  state.cartCount += qty;
  cartBadge.textContent = String(state.cartCount);
  cartBadge.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }],
    { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' }
  );
  showToast(`Added ×${qty}`);
  closeCartSheet();
  flyOff('right');
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
  // Pause any video on the (now-removed) top card
  const v = deck.querySelector('.card-video');
  if (v) v.pause();
  tickCountdown();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(tickCountdown, 1000);
}

function hideDealsDone() {
  dealsDoneEl.hidden = true;
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

function notifyBackInStock() {
  showRichToast({
    title: 'Great choice!',
    subtitle: "We'll notify you when this item is back in stock.",
  });
}

/* ============================================================
   Bottom nav — selected tab + "Coming soon" for non-Deals
   ============================================================ */
const navBtns = document.querySelectorAll('.bottom-nav .menu-item');

const TAB_ORDER = ['deals', 'contests', 'rewards', 'events', 'cart'];

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
  const horizontal = prev !== 'deals' && newTab !== 'deals';

  if (horizontal) {
    const goingRight = TAB_ORDER.indexOf(newTab) > TAB_ORDER.indexOf(prev);
    const outgoing = document.querySelector(`.screen[data-tab="${prev}"]`);
    const incoming = document.querySelector(`.screen[data-tab="${newTab}"]`);
    if (outgoing) setHidePosition(outgoing, goingRight ? '-100%' : '100%', '0');
    if (incoming) preposition(incoming, goingRight ? '100%' : '-100%', '0');
  } else if (newTab !== 'deals') {
    const incoming = document.querySelector(`.screen[data-tab="${newTab}"]`);
    if (incoming) preposition(incoming, '0', '120%');
  } else {
    const outgoing = document.querySelector(`.screen[data-tab="${prev}"]`);
    if (outgoing) setHidePosition(outgoing, '0', '120%');
  }

  document.body.dataset.tab = newTab;
}

navBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    navBtns.forEach((b) => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    switchTab(btn.dataset.tab);
    applyVideoState();
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
  const idx = state.index;
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

  const topVideo = deck.querySelector('.deal-card.top .card-video');
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
  const cardEl = deck.querySelector('.deal-card.top');
  closeNotifySheet();
  if (cardEl) skipDeal(cardEl);
});

nsClose.addEventListener('click', closeNotifySheet);
notifyBackdrop.addEventListener('click', closeNotifySheet);

/* ============================================================
   Boot
   ============================================================ */
document.body.classList.add('is-muted');
document.body.dataset.tab = 'deals';
mountDeck();
