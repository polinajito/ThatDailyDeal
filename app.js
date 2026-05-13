/* ============================================================
   ThatDailyDeal — Prototype Logic
   ============================================================ */

const DEALS = [
  {
    id: 'pack',
    title: 'Travel Backpack — Daily Carry',
    video: 'assets/pack.mp4',
    oldPrice: 49.99,
    nowPrice: 14.99,
    discount: 70,
  },
  {
    id: 'neck-fan',
    title: 'Hands-Free Neck Fan',
    video: 'assets/neck_fan.mp4',
    oldPrice: 29.99,
    nowPrice: 9.99,
    discount: 67,
  },
  {
    id: 'lumbar',
    title: 'Lumbar Support Cushion',
    video: 'assets/lumbar_support.mp4',
    oldPrice: 39.99,
    nowPrice: 12.99,
    discount: 68,
  },
];

const SHIPPING = 1.89;

const state = {
  index: 0,
  liked: new Set(),
  paused: new Set(),
  muted: true,        // start muted (videos autoplay best when muted)
  cart: [],
  qty: 1,
  pendingDealId: null,
  actionSide: localStorage.getItem('tdd.actionSide') || 'right',
};

document.body.dataset.actionSide = state.actionSide;

/* ---------- DOM ---------- */
const deck = document.getElementById('deck');
const emptyState = document.getElementById('emptyState');
const cartCountEl = document.getElementById('cartCount');
const detailsSheet = document.getElementById('detailsSheet');
const cartSheet = document.getElementById('cartSheet');
const settingsPopover = document.getElementById('settingsPopover');
const toast = document.getElementById('toast');
const avatarBtn = document.getElementById('avatarBtn');
const actionSideSeg = document.getElementById('actionSideSeg');

/* ---------- Helpers ---------- */
const fmt = (n) => `$${n.toFixed(2)}`;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 1400);
}

/* ============================================================
   RENDER DECK
   ============================================================ */
function renderDeck() {
  deck.innerHTML = '';
  const top = DEALS[state.index];
  const under = DEALS[state.index + 1];

  if (under) deck.appendChild(buildCard(under, true));
  if (top) {
    const topCard = buildCard(top, false);
    deck.appendChild(topCard);
    bindSwipe(topCard, top);
  } else {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
}

function buildCard(deal, isUnder) {
  const card = document.createElement('div');
  card.className = 'card' + (isUnder ? ' under' : ' top');
  card.dataset.dealId = deal.id;
  card.innerHTML = `
    <video src="${deal.video}" autoplay loop playsinline ${state.muted ? 'muted' : ''}></video>
    <div class="deal-counter">Deal ${state.index + (isUnder ? 2 : 1)} of ${DEALS.length} for today</div>
    <div class="actions">
      <button class="act-btn" data-act="pause" aria-label="Pause/Play">
        <svg width="26" height="26"><use href="#i-pause"/></svg>
        <span class="act-label">Pause</span>
      </button>
      <button class="act-btn ${state.liked.has(deal.id) ? 'is-on' : ''}" data-act="like" aria-label="Like">
        <svg width="26" height="26"><use href="${state.liked.has(deal.id) ? '#i-heart-filled' : '#i-heart'}"/></svg>
        <span class="act-label">Like</span>
      </button>
      <button class="act-btn" data-act="share" aria-label="Share">
        <svg width="26" height="26"><use href="#i-share"/></svg>
        <span class="act-label">Share</span>
      </button>
      <button class="act-btn ${state.muted ? '' : 'is-on'}" data-act="mute" aria-label="Mute/Unmute">
        <svg width="26" height="26"><use href="${state.muted ? '#i-volume-off' : '#i-volume'}"/></svg>
        <span class="act-label">${state.muted ? 'Unmute' : 'Mute'}</span>
      </button>
    </div>
    <div class="price-pill">
      <div class="pp-name">${deal.title}</div>
      <div class="pp-prices">
        <span class="pp-old">${fmt(deal.oldPrice)}</span>
        <span class="pp-now">${fmt(deal.nowPrice)}</span>
        <span class="pp-discount">−${deal.discount}%</span>
      </div>
    </div>
    <div class="swipe-stamp stamp-add">Add</div>
    <div class="swipe-stamp stamp-skip">Skip</div>
  `;

  // Action button handlers (stop bubbling so swipe/tap don't fire)
  card.querySelectorAll('.act-btn').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAction(btn.dataset.act, card, deal);
    });
  });

  return card;
}

/* ============================================================
   CARD ACTIONS (pause / like / share / mute)
   ============================================================ */
function handleAction(act, card, deal) {
  const video = card.querySelector('video');
  const btn = card.querySelector(`[data-act="${act}"]`);

  if (act === 'pause') {
    if (video.paused) {
      video.play();
      btn.querySelector('use').setAttribute('href', '#i-pause');
      btn.querySelector('.act-label').textContent = 'Pause';
      btn.classList.remove('is-on');
    } else {
      video.pause();
      btn.querySelector('use').setAttribute('href', '#i-play');
      btn.querySelector('.act-label').textContent = 'Play';
      btn.classList.add('is-on');
    }
  } else if (act === 'like') {
    const liked = state.liked.has(deal.id);
    if (liked) state.liked.delete(deal.id); else state.liked.add(deal.id);
    btn.classList.toggle('is-on', !liked);
    btn.querySelector('use').setAttribute('href', !liked ? '#i-heart-filled' : '#i-heart');
    showToast(!liked ? 'Liked' : 'Unliked');
  } else if (act === 'share') {
    if (navigator.share) {
      navigator.share({ title: deal.title, text: `Check out ${deal.title}` }).catch(() => {});
    } else {
      showToast('Share link copied');
    }
  } else if (act === 'mute') {
    state.muted = !state.muted;
    document.querySelectorAll('.card video').forEach((v) => { v.muted = state.muted; });
    btn.classList.toggle('is-on', !state.muted);
    btn.querySelector('use').setAttribute('href', state.muted ? '#i-volume-off' : '#i-volume');
    btn.querySelector('.act-label').textContent = state.muted ? 'Unmute' : 'Mute';
  }
}

/* ============================================================
   SWIPE GESTURES
   ============================================================ */
function bindSwipe(card, deal) {
  let startX = 0, startY = 0, dx = 0, dy = 0;
  let startTime = 0;
  let dragging = false;
  let pointerId = null;
  const stampAdd = card.querySelector('.stamp-add');
  const stampSkip = card.querySelector('.stamp-skip');
  const threshold = window.innerWidth * 0.28;

  card.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.act-btn')) return;
    pointerId = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    dx = 0; dy = 0;
    startTime = Date.now();
    dragging = true;
    card.classList.add('dragging');
    card.setPointerCapture(pointerId);
  });

  card.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dx = e.clientX - startX;
    dy = e.clientY - startY;
    const rot = dx / 20;
    card.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${rot}deg)`;
    stampAdd.style.opacity  = Math.max(0, Math.min(1, dx / threshold));
    stampSkip.style.opacity = Math.max(0, Math.min(1, -dx / threshold));
  });

  card.addEventListener('pointerup', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    card.classList.remove('dragging');
    card.releasePointerCapture(pointerId);
    const dt = Date.now() - startTime;
    const isFlick = Math.abs(dx) > 80 && dt < 300 && Math.abs(dx) > Math.abs(dy);

    // Tap (no significant move) → open details
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 350) {
      card.style.transform = '';
      stampAdd.style.opacity = stampSkip.style.opacity = 0;
      openDetails(deal);
      return;
    }

    if (dx > threshold || (isFlick && dx > 0)) {
      // Right swipe → add to cart
      flyOff(card, 'right');
      openCartSheet(deal);
    } else if (dx < -threshold || (isFlick && dx < 0)) {
      // Left swipe → reject
      flyOff(card, 'left');
      advance();
    } else {
      // Snap back
      card.style.transform = '';
      stampAdd.style.opacity = stampSkip.style.opacity = 0;
    }
  });

  card.addEventListener('pointercancel', () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    card.style.transform = '';
    stampAdd.style.opacity = stampSkip.style.opacity = 0;
  });
}

function flyOff(card, dir) {
  card.classList.add(dir === 'right' ? 'fly-right' : 'fly-left');
}

function advance() {
  state.index += 1;
  setTimeout(renderDeck, 280);
}

/* ============================================================
   PRODUCT DETAILS OVERLAY
   ============================================================ */
function openDetails(deal) {
  const v = document.getElementById('detailsVideo');
  v.src = deal.video; v.play().catch(() => {});
  document.getElementById('detailsTitle').textContent = deal.title;
  document.getElementById('detailsOld').textContent = fmt(deal.oldPrice);
  document.getElementById('detailsNow').textContent = fmt(deal.nowPrice);
  document.getElementById('detailsBadge').textContent = `${deal.discount}% off`;
  detailsSheet.setAttribute('aria-hidden', 'false');
  // Pause deck video while details are open
  document.querySelectorAll('.card.top video').forEach((vid) => vid.pause());
}
function closeDetails() {
  detailsSheet.setAttribute('aria-hidden', 'true');
  document.getElementById('detailsVideo').pause();
  document.querySelectorAll('.card.top video').forEach((vid) => vid.play().catch(() => {}));
}

/* ============================================================
   CART SHEET
   ============================================================ */
function openCartSheet(deal) {
  state.pendingDealId = deal.id;
  state.qty = 1;
  document.getElementById('cartTitle').textContent = deal.title;
  const tv = document.getElementById('cartThumbVideo');
  tv.src = deal.video; tv.play().catch(() => {});
  recalcCartSheet();
  cartSheet.setAttribute('aria-hidden', 'false');
}

function closeCartSheet({ confirmed = false } = {}) {
  cartSheet.setAttribute('aria-hidden', 'true');
  document.getElementById('cartThumbVideo').pause();

  if (confirmed) {
    advance();
  } else {
    // Dismiss → snap card back into the deck
    state.pendingDealId = null;
    setTimeout(renderDeck, 200);
  }
}

function recalcCartSheet() {
  const deal = DEALS.find((d) => d.id === state.pendingDealId);
  if (!deal) return;
  document.getElementById('qtyVal').textContent = state.qty;
  document.getElementById('qtyPlural').textContent = state.qty === 1 ? '' : 's';
  const itemTotal = deal.nowPrice * state.qty;
  const ship = state.qty >= 4 ? 0 : SHIPPING;
  document.getElementById('cartItemTotal').textContent = fmt(itemTotal);
  document.getElementById('cartShipping').textContent = ship === 0 ? 'FREE' : fmt(ship);
  document.getElementById('cartTotal').textContent = fmt(itemTotal + ship);
}

document.getElementById('qtyMinus').addEventListener('click', () => {
  if (state.qty > 1) { state.qty--; recalcCartSheet(); }
});
document.getElementById('qtyPlus').addEventListener('click', () => {
  state.qty++; recalcCartSheet();
});

document.getElementById('confirmCartBtn').addEventListener('click', () => {
  const deal = DEALS.find((d) => d.id === state.pendingDealId);
  if (deal) {
    state.cart.push({ id: deal.id, title: deal.title, qty: state.qty, price: deal.nowPrice });
    showToast(`Added ${state.qty} × ${deal.title.split(' — ')[0]} to cart`);
    updateCartCount();
  }
  state.pendingDealId = null;
  closeCartSheet({ confirmed: true });
});

function updateCartCount() {
  const total = state.cart.reduce((s, i) => s + i.qty, 0);
  cartCountEl.textContent = `${total} item${total === 1 ? '' : 's'}`;
}

/* ============================================================
   GENERIC SHEET CLOSE HANDLERS
   ============================================================ */
document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', () => {
    const what = el.dataset.close;
    if (what === 'details') closeDetails();
    if (what === 'cart')    closeCartSheet({ confirmed: false });
  });
});

/* ============================================================
   BOTTOM NAV
   ============================================================ */
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.body.dataset.screen = tab;
    closePopover();
    if (tab !== 'deals') {
      // Pause deck video when leaving deals
      document.querySelectorAll('.card video').forEach((v) => v.pause());
    } else {
      document.querySelectorAll('.card.top video').forEach((v) => v.play().catch(() => {}));
    }
  });
});

/* ============================================================
   SETTINGS POPOVER
   ============================================================ */
avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = settingsPopover.getAttribute('aria-hidden') === 'false';
  settingsPopover.setAttribute('aria-hidden', open ? 'true' : 'false');
});
document.addEventListener('click', (e) => {
  if (!settingsPopover.contains(e.target) && e.target !== avatarBtn) {
    closePopover();
  }
});
function closePopover() {
  settingsPopover.setAttribute('aria-hidden', 'true');
}

actionSideSeg.querySelectorAll('button').forEach((b) => {
  if (b.dataset.side === state.actionSide) b.classList.add('active'); else b.classList.remove('active');
  b.addEventListener('click', () => {
    state.actionSide = b.dataset.side;
    document.body.dataset.actionSide = state.actionSide;
    localStorage.setItem('tdd.actionSide', state.actionSide);
    actionSideSeg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
  });
});

/* ============================================================
   INIT
   ============================================================ */
renderDeck();
updateCartCount();
