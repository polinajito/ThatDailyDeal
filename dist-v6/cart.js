/* ============================================================
   ThatDailyDeal — Cart feature
   Per-feature module (classic script, loaded after v6.js).
   Owns everything inside the `cart` tab: renders its markup into
   #cartRoot and re-renders whenever the cart changes. Keeps
   index.html a thin skeleton and v6.js focused on the app shell.

   Convention (see dist-v6/CLAUDE.md):
   - index.html provides only the mount point: <div id="cartRoot">
   - shared visuals come from components.css (.cart-line / .stepper /
     .cart-summary / .cart-empty families, plus .pp-discount + .btn)
   - feature-only layout (header / scroll / footer) lives in v6.css
   - cart state is owned by v6.js and exposed via window.TDDCart; this
     file reads/edits through that surface and listens for 'cart:change'
   ============================================================ */
(() => {
  const root = document.getElementById('cartRoot');
  const Cart = window.TDDCart;
  if (!root || !Cart) return;

  const { fmt, calcPrices, isOnSale, constants } = Cart;
  const { FREE_SHIP_AT, BULK_AT } = constants;

  const icon = {
    minus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    plus:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    cart:  '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  };

  // Pre-deal reference unit price: the struck "old" price for on-sale items,
  // otherwise the regular price. Used to size each line's discount + savings.
  const listUnit = (deal) => deal.old || deal.now;

  const lineHTML = ({ deal, qty, dealIdx }) => {
    const { unit } = calcPrices(deal, qty);
    const onSale = isOnSale(deal);
    const bulkActive = qty >= BULK_AT;
    return `
      <article class="cart-line">
        <video class="cart-line-thumb" src="${deal.video}" muted loop playsinline autoplay></video>
        <div class="cart-line-body">
          <div class="cart-line-top">
            <span class="cart-line-name">${deal.name}</span>
            <button class="cart-line-remove" data-act="remove" data-idx="${dealIdx}" aria-label="Remove ${deal.name}">
              ${icon.trash}
            </button>
          </div>
          <div class="cart-line-prices">
            <span class="cart-line-now">${fmt(unit)}</span>
            ${onSale ? `<span class="cart-line-old">${fmt(deal.old)}</span>` : ''}
            ${onSale ? `<span class="pp-discount">-${deal.off}%</span>` : ''}
            ${bulkActive ? `<span class="cart-line-tag">Bulk price</span>` : ''}
          </div>
          <div class="cart-line-foot">
            <div class="stepper">
              <button class="stepper-btn" data-act="dec" data-idx="${dealIdx}" aria-label="Decrease quantity" ${qty <= 1 ? 'disabled' : ''}>${icon.minus}</button>
              <span class="stepper-value">${qty}</span>
              <button class="stepper-btn" data-act="inc" data-idx="${dealIdx}" aria-label="Increase quantity">${icon.plus}</button>
            </div>
            <span class="cart-line-total">${fmt(unit * qty)}</span>
          </div>
        </div>
      </article>`;
  };

  // Cart-level totals. Shipping is computed across the whole cart (free once
  // the combined quantity clears FREE_SHIP_AT), while each line's unit price
  // applies its own bulk discount via calcPrices. Subtotal − You saved +
  // Shipping reconciles to Total.
  const summaryHTML = (items) => {
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    let listTotal = 0;
    let discTotal = 0;
    items.forEach(({ deal, qty }) => {
      listTotal += listUnit(deal) * qty;
      discTotal += calcPrices(deal, qty).unit * qty;
    });
    const saved = listTotal - discTotal;
    const shipping = totalQty >= FREE_SHIP_AT ? 0 : constants.SHIPPING_BASE;
    const total = discTotal + shipping;
    return `
      <div class="cart-summary">
        <div class="cart-sum-row">
          <span>Subtotal (${totalQty} ${totalQty === 1 ? 'item' : 'items'})</span>
          <span>${fmt(listTotal)}</span>
        </div>
        ${saved > 0 ? `
        <div class="cart-sum-row is-saved">
          <span>You saved</span>
          <span>−${fmt(saved)}</span>
        </div>` : ''}
        <div class="cart-sum-row">
          <span>Shipping</span>
          <span>${shipping === 0 ? 'Free' : fmt(shipping)}</span>
        </div>
        <div class="cart-sum-row is-total">
          <span>Total</span>
          <span>${fmt(total)}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-lg cart-checkout" id="cartCheckout">Checkout · ${fmt(total)}</button>`;
  };

  const emptyHTML = () => `
    <div class="cart-empty">
      <span class="cart-empty-icon" aria-hidden="true">${icon.cart}</span>
      <h3 class="cart-empty-title">Your cart is empty</h3>
      <p class="cart-empty-sub">Swipe right on a deal to add it here.</p>
    </div>`;

  function render() {
    const items = Cart.getItems();
    if (!items.length) {
      root.innerHTML = `
        <div class="cart-page">
          <header class="tab-head"><h2 class="tab-head-title">Cart</h2></header>
          ${emptyHTML()}
        </div>`;
      return;
    }
    root.innerHTML = `
      <div class="cart-page">
        <header class="tab-head"><h2 class="tab-head-title">Cart</h2></header>
        <div class="cart-scroll">
          <div class="cart-list">
            ${items.map(lineHTML).join('')}
          </div>
        </div>
        <div class="cart-foot">
          ${summaryHTML(items)}
        </div>
      </div>`;
  }

  // One delegated handler for every stepper / remove tap. Each mutation
  // dispatches 'cart:change', which re-renders below.
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const item = Cart.getItems().find((i) => i.dealIdx === idx);
    if (!item) return;
    if (btn.dataset.act === 'inc')         Cart.setQty(idx, item.qty + 1);
    else if (btn.dataset.act === 'dec')    Cart.setQty(idx, item.qty - 1);
    else if (btn.dataset.act === 'remove') Cart.remove(idx);
  });

  window.addEventListener('cart:change', render);
  render();
})();
