/** THREADLINE 3.1 — receipt peek card */
(function () {
  'use strict';
  var TL = window.__ADOT_TL;
  if (!TL || !TL.__adapters) throw new Error('[Threadline] adapters must load first');
  if (TL.__peek) return;
  TL.__peek = true;
  var el = TL.el;
  var clamp = TL.clamp;
  var isCoarse = TL.isCoarse;
  var reduceMotion = TL.reduceMotion;
  var HAS_WAAPI = TL.HAS_WAAPI;
  var inViewport = TL.inViewport;
  var adapters = TL.adapters;
  var sp = TL.sp;
  var EASE = TL.EASE;
  var onDone = TL.onDone;

  let peekEl = null, peekTimerAnim = null, peekHardTimer = 0, peekCleanupFns = [];

  function dismissPeek(instant, via) {
    clearTimeout(peekHardTimer);
    if (peekTimerAnim) { try { peekTimerAnim.cancel(); } catch (_) {} peekTimerAnim = null; }
    peekCleanupFns.forEach((fn) => { try { fn(); } catch (_) {} });
    peekCleanupFns = [];
    const card = peekEl;
    if (!card) return;
    peekEl = null;
    if (instant || reduceMotion() || !HAS_WAAPI) { card.remove(); return; }
    const cs = window.getComputedStyle(card);
    const fromT = cs.transform === 'none' ? 'translateY(0px)' : cs.transform;
    const fromO = cs.opacity;
    try { card.getAnimations().forEach((x) => x.cancel()); } catch (_) {}
    const coarse = isCoarse();
    const swipe = via === 'swipe';
    const toT = swipe ? 'translateY(130%)' : coarse ? 'translateY(24px) scale(0.92)' : 'translateY(-8px) scale(0.96)';
    const a = card.animate([{ transform: fromT, opacity: fromO }, { transform: toT, opacity: 0 }],
      { duration: swipe ? 240 : coarse ? 200 : 160, easing: EASE.in, fill: 'forwards' });
    onDone(a, () => card.remove());
  }



  // enableSwipe provided by threadline.js (orchestration); call via TL for late bind
  function enableSwipe(card, pauseTimer, resumeTimer) {
    if (typeof TL.enableSwipe === 'function' && TL.enableSwipe !== enableSwipe) {
      return TL.enableSwipe(card, pauseTimer, resumeTimer);
    }
  }

  function showPeek(cartResult, anchor, meta) {
    dismissPeek(true);
    const coarse = isCoarse();
    const calm = reduceMotion() || !HAS_WAAPI;
    meta = meta || {};
    const item = cartResult && cartResult.item ? cartResult.item : {};
    const title = meta.productTitle || item.title || 'Added to Bag';
    const variantTitle = meta.variantLabel || item.variant_title || '';
    const imgUrl = meta.thumbUrl || (item.featured_image && item.featured_image.url) || item.image || '';
    const priceStr = meta.priceFormatted || (item.final_price ? 'Rs. ' + (item.final_price / 100).toLocaleString('en-PK') : '');

    const card = el('div', 'tl-peek');
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', 'Added to bag confirmation');

    const closeBtn = el('button', 'tl-peek__close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); dismissPeek(); });
    card.appendChild(closeBtn);
    card.appendChild(el('div', 'tl-peek__handle'));

    const row = el('div', 'tl-peek__row');
    const imgBox = el('div', 'tl-peek__img');
    if (imgUrl) imgBox.style.backgroundImage = 'url("' + imgUrl.replace(/"/g, '%22') + '")';
    const metaCol = el('div', 'tl-peek__meta');
    const nameEl = el('h4', 'tl-peek__name');
    nameEl.textContent = title;
    metaCol.appendChild(nameEl);
    let varEl = null;
    if (variantTitle) {
      varEl = el('p', 'tl-peek__variant');
      varEl.textContent = 'Size ' + variantTitle;
      metaCol.appendChild(varEl);
    }
    const seamEl = el('div', 'tl-peek__seam');
    metaCol.appendChild(seamEl);
    const priceEl = el('div', 'tl-peek__price');
    priceEl.textContent = priceStr;
    row.appendChild(imgBox); row.appendChild(metaCol); row.appendChild(priceEl);
    card.appendChild(row);

    const actions = el('div', 'tl-peek__actions');
    const viewBagBtn = el('button', 'tl-peek__btn tl-peek__btn--secondary');
    viewBagBtn.type = 'button';
    viewBagBtn.textContent = 'View bag';
    viewBagBtn.addEventListener('click', (e) => { e.stopPropagation(); dismissPeek(true); adapters.openCart(); });
    const checkoutBtn = el('a', 'tl-peek__btn tl-peek__btn--primary');
    checkoutBtn.href = '/checkout';
    checkoutBtn.textContent = 'Checkout';
    actions.appendChild(viewBagBtn); actions.appendChild(checkoutBtn);
    card.appendChild(actions);

    const timerEl = el('div', 'tl-peek__timer');
    card.appendChild(timerEl);

    if (coarse) {
      const dock = adapters.getDock();
      const dockH = dock && inViewport(dock) ? dock.getBoundingClientRect().height : 0;
      card.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + ' + (dockH + 12) + 'px)';
    } else if (anchor && inViewport(anchor)) {
      const r = anchor.getBoundingClientRect();
      card.style.top = (r.bottom + 10) + 'px';
      card.style.right = Math.max(16, window.innerWidth - r.right - 8) + 'px';
    } else {
      card.style.top = '80px';
      card.style.right = '20px';
    }

    document.body.appendChild(card);
    peekEl = card;

    const box = card.getBoundingClientRect();
    if (anchor && inViewport(anchor)) {
      const ar = anchor.getBoundingClientRect();
      card.style.transformOrigin = clamp(ar.left + ar.width / 2 - box.left, 0, box.width) + 'px ' + (coarse ? '100%' : '0px');
    } else {
      card.style.transformOrigin = coarse ? '50% 100%' : '100% 0px';
    }

    if (calm) {
      seamEl.style.clipPath = 'none';
      if (HAS_WAAPI) card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, fill: 'backwards' });
    } else {
      const s = sp(coarse ? 'sheet' : 'peek');
      // fill:'backwards' only, so the swipe gesture can own the transform afterwards
      card.animate([{ transform: coarse ? 'translateY(28px) scale(0.9)' : 'translateY(-10px) scale(0.92)' }, { transform: 'translateY(0px) scale(1)' }],
        { duration: s.duration, easing: s.easing, fill: 'backwards' });
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'backwards' });
      seamEl.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 520, delay: 160, easing: EASE.out, fill: 'forwards' });
      [imgBox, nameEl, varEl, priceEl, viewBagBtn, checkoutBtn].forEach((n, i) => {
        if (!n) return;
        n.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }],
          { duration: 320, delay: 50 + i * 38, easing: EASE.out, fill: 'backwards' });
      });
    }

    const total = coarse ? 3800 : 3500;
    try {
      peekTimerAnim = timerEl.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
        { duration: total, easing: 'linear', fill: 'forwards' });
      peekTimerAnim.addEventListener('finish', () => dismissPeek(), { once: true });
    } catch (_) {
      peekTimerAnim = null;
      const t = setTimeout(() => dismissPeek(), total);
      peekCleanupFns.push(() => clearTimeout(t));
    }
    const pauseTimer = () => { try { if (peekTimerAnim) peekTimerAnim.pause(); } catch (_) {} };
    const resumeTimer = () => {
      try {
        if (!peekTimerAnim) return;
        peekTimerAnim.currentTime = Math.min(peekTimerAnim.currentTime || 0, total - 1200);
        peekTimerAnim.play();
      } catch (_) {}
    };
    card.addEventListener('pointerenter', pauseTimer);
    card.addEventListener('pointerleave', resumeTimer);
    card.addEventListener('focusin', pauseTimer);
    card.addEventListener('focusout', resumeTimer);

    clearTimeout(peekHardTimer);
    peekHardTimer = setTimeout(() => dismissPeek(), 9000);

    const onDocPointerDown = (e) => {
      if (card && !card.contains(e.target) && !e.target.closest('[data-tl-cta], [data-tl-bag], [data-tl-dock-bag], .product-card__size-pill')) dismissPeek();
    };
    document.addEventListener('pointerdown', onDocPointerDown, { capture: true });
    const startScroll = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - startScroll) > 60) dismissPeek(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    const onEsc = (e) => { if (e.key === 'Escape') dismissPeek(); };
    window.addEventListener('keydown', onEsc);
    const onCartOpen = () => dismissPeek(true);
    window.addEventListener('cart:open', onCartOpen, { once: true });
    peekCleanupFns.push(() => {
      document.removeEventListener('pointerdown', onDocPointerDown, { capture: true });
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('cart:open', onCartOpen);
    });

    if (coarse) enableSwipe(card, pauseTimer, resumeTimer);
  }

  TL.showPeek = showPeek;
  TL.dismissPeek = dismissPeek;
})();
