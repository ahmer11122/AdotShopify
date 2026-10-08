/**
 * THREADLINE: Add to Bag Motion System (Desktop + Mobile)
 * Native Web Animations API (WAAPI) + SVG Quadratic Path Interpolation
 * Zero Dependencies. Tailoring Motifs for Luxury Menswear.
 */

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const EASE_MORPH = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const EASE_SHEET = 'cubic-bezier(0.32, 0.72, 0, 1)';

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const easeInOutQuad = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const isCoarse = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 990;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const inViewport = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  };

  const onDone = (anim, fn) => {
    if (!anim) return fn();
    anim.addEventListener('finish', fn, { once: true });
    anim.addEventListener('cancel', fn, { once: true });
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

  const config = {
    maxFlights: 3,
    awaitMs: 4000,
    holdLabelMs: 1700,
  };

  let activeFlights = 0;
  let chain = Promise.resolve();
  const liveNodes = new Set(); // Global registry of transient DOM elements for leak-free disposal

  function enqueue(fn) {
    const p = chain.then(fn);
    chain = p.catch(() => {});
    return p;
  }

  /* ---------------------------------------------------------------------------
     Shopify & ADOT Theme Adapters
     --------------------------------------------------------------------------- */
  const adapters = {
    getTarget() {
      const coarse = isCoarse();
      const dockBag = document.querySelector('[data-tl-dock-bag]');
      if (coarse && dockBag && inViewport(dockBag)) {
        return dockBag;
      }
      return document.querySelector('[data-tl-bag]') || document.querySelector('.header__cart-btn');
    },

    async addToCart(form) {
      const formData = form instanceof FormData ? form : new FormData(form);
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      if (!res.ok) {
        let errDesc = 'Unable to add item';
        try {
          const errData = await res.json();
          errDesc = errData.description || errData.message || errDesc;
        } catch (_) {}
        throw new Error(errDesc);
      }
      const itemData = await res.json();
      
      // Fetch updated cart totals
      let cartData = null;
      try {
        const cartRes = await fetch('/cart.js');
        if (cartRes.ok) cartData = await cartRes.json();
      } catch (_) {}

      return {
        item: itemData,
        item_count: cartData ? cartData.item_count : (itemData.item_count || 1),
        cart: cartData
      };
    },

    getThumbUrl(form, cta) {
      if (form) {
        const imgInput = form.querySelector('input[name="properties[_adot_image]"]');
        if (imgInput && imgInput.value) return imgInput.value;
      }
      if (cta) {
        const card = cta.closest('.product-card');
        if (card) {
          const img = card.querySelector('.product-card__image');
          if (img && img.src) return img.currentSrc || img.src;
        }
        const dock = cta.closest('.pdp-dock');
        if (dock) {
          const img = dock.querySelector('.pdp-dock__img');
          if (img && img.src) return img.currentSrc || img.src;
        }
      }
      const mainImg = document.querySelector('.product-gallery__item.is-active img, .product-gallery img, .pdp-gallery img');
      if (mainImg && mainImg.src) return mainImg.currentSrc || mainImg.src;
      return '';
    },

    getVariantLabel(form, cta) {
      if (cta && cta.getAttribute('data-variant-title')) {
        const t = cta.getAttribute('data-variant-title').trim();
        if (t && t.toLowerCase() !== 'add' && t.toLowerCase() !== 'add to bag') {
          return t.length > 3 ? t.slice(0, 3) : t;
        }
      }
      if (form) {
        const szProp = form.querySelector('input[name="properties[Size]"]');
        if (szProp && szProp.value) return szProp.value.slice(0, 3);
      }
      const selOpt = document.querySelector('.pdp-opt [data-option-selected-label]');
      if (selOpt && selOpt.textContent && selOpt.textContent.trim() !== 'Select') {
        const text = selOpt.textContent.trim();
        return text.length > 3 ? text.slice(0, 3) : text;
      }
      return '';
    },

    getProductTitle(form, cta) {
      if (form) {
        const titleProp = form.querySelector('input[name="properties[_adot_title]"]');
        if (titleProp && titleProp.value) return titleProp.value;
      }
      if (cta) {
        const card = cta.closest('.product-card');
        if (card) {
          const t = card.querySelector('.product-card__title');
          if (t && t.textContent) return t.textContent.trim();
        }
      }
      const pdpTitle = document.querySelector('.product-title, .pdp-head__title, h1');
      if (pdpTitle && pdpTitle.textContent) return pdpTitle.textContent.trim();
      return 'Tailored Garment';
    },

    getPriceFormatted(form, cta, cartResult) {
      if (cartResult && cartResult.item && cartResult.item.final_price) {
        if (window.AdotCart && typeof window.AdotCart.formatMoney === 'function') {
          return window.AdotCart.formatMoney(cartResult.item.final_price);
        }
        return 'Rs. ' + Math.floor(cartResult.item.final_price / 100).toLocaleString('en-PK');
      }
      if (form) {
        const prProp = form.querySelector('input[name="properties[_adot_price]"]');
        if (prProp && prProp.value) return prProp.value;
      }
      const pdpPrice = document.querySelector('.pdp-price__current, [data-btn-price], .price__item');
      if (pdpPrice && pdpPrice.textContent) return pdpPrice.textContent.trim();
      return '';
    },

    getItemCount(cartResult) {
      if (!cartResult) return 1;
      if (typeof cartResult.item_count === 'number') return cartResult.item_count;
      if (cartResult.cart && typeof cartResult.cart.item_count === 'number') return cartResult.cart.item_count;
      return 1;
    },

    getDock() {
      return document.querySelector('[data-tl-dock]') || document.querySelector('.pdp-dock');
    },

    openCart() {
      const drawer = document.querySelector('cart-drawer');
      if (drawer && typeof drawer.open === 'function') {
        drawer.open();
      }
      window.dispatchEvent(new CustomEvent('cart:open'));
    },

    refreshCart(cartResult) {
      const vId = cartResult && cartResult.item ? cartResult.item.variant_id : undefined;
      window.dispatchEvent(new CustomEvent('cart:refresh', { detail: { variantId: vId } }));
      if (cartResult && cartResult.cart) {
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cartResult.cart } }));
      }
    }
  };

  /* ---------------------------------------------------------------------------
     Main Execution Pipeline: addWithThreadline
     --------------------------------------------------------------------------- */
  async function addWithThreadline(options) {
    const { cta, form } = options;
    if (!cta || !form) return;

    const requestP = enqueue(() => adapters.addToCart(form));
    requestP.catch(() => {}); // prevent uncaught console noise, handled below

    const target = adapters.getTarget();
    const canFly = !reduceMotion() &&
                   target &&
                   inViewport(target) &&
                   activeFlights < config.maxFlights &&
                   (!window.visualViewport || window.visualViewport.scale === 1);

    const thumbUrl = options.thumbUrl || adapters.getThumbUrl(form, cta);
    const variantLabel = options.variantLabel || adapters.getVariantLabel(form, cta);
    const productTitle = options.title || adapters.getProductTitle(form, cta);
    const priceFormatted = options.price || adapters.getPriceFormatted(form, cta);

    if (!canFly) {
      try {
        const cartResult = await requestP;
        calmConfirm(cta, target, cartResult, { thumbUrl, variantLabel, productTitle, priceFormatted });
      } catch (err) {
        failLabel(cta);
      }
      return;
    }

    activeFlights++;
    const flight = createFlight(cta, target, thumbUrl, variantLabel);

    try {
      if (navigator.vibrate) navigator.vibrate(8);
      await flight.fly(); // morph + parabolic arc + thread unspool

      const cartResult = await Promise.race([requestP, timeout(config.awaitMs)]);
      await flight.land(cartResult); // absorb into bag + stitch ring + odometer roll + retract

      if (navigator.vibrate) navigator.vibrate(12);
      announce(cartResult);
      adapters.refreshCart(cartResult);

      showPeek(cartResult, target, {
        thumbUrl,
        variantLabel,
        productTitle,
        priceFormatted: adapters.getPriceFormatted(form, cta, cartResult)
      });

      cta.dataset.tlState = 'done';
      await sleep(config.holdLabelMs);
      cta.dataset.tlState = 'idle';
    } catch (err) {
      console.warn('Threadline flight rollback:', err);
      await flight.rollback(); // reverse flight, morph back, refusal shake
      failLabel(cta);
    } finally {
      flight.dispose();
      activeFlights--;
    }
  }

  /* ---------------------------------------------------------------------------
     Flight Engine: Parabolic Geometry, WAAPI Synthesis & Rollback
     --------------------------------------------------------------------------- */
  function createFlight(cta, target, thumbUrl, variantLabel) {
    const coarse = isCoarse();
    const a = cta.getBoundingClientRect();
    const b = target.getBoundingClientRect();

    const W = a.width, H = a.height;
    const Sx = a.left + W / 2, Sy = a.top + H / 2;
    const Ex = b.left + b.width / 2, Ey = b.top + b.height / 2;

    const dist = Math.hypot(Ex - Sx, Ey - Sy);
    const dur = Math.round(clamp(340 + dist * 0.3, 420, 640));
    const arcRise = clamp(dist * 0.28, 64, coarse ? 120 : 220);
    const D = Math.min(W, Math.max(H, coarse ? 52 : 56));
    const N = coarse ? 20 : 28;

    const ctaComputed = window.getComputedStyle(cta);
    const radius = parseFloat(ctaComputed.borderTopLeftRadius) || 0;
    const bg = ctaComputed.backgroundColor !== 'rgba(0, 0, 0, 0)' ? ctaComputed.backgroundColor : '#111111';
    const dir = Math.sign(Ex - Sx) || 1;

    const anims = [];
    const nodes = [];

    // 1. Thread (SVG overlay)
    const Cx = (Sx + Ex) / 2;
    const Cy = (Sy + Ey) / 2 - 2 * arcRise;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'tl-thread');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M${Sx} ${Sy} Q${Cx} ${Cy} ${Ex} ${Ey}`);
    svg.appendChild(path);
    document.body.appendChild(svg);
    nodes.push(svg);

    const L = path.getTotalLength();
    path.style.strokeDasharray = `${L} ${L}`;
    path.style.strokeDashoffset = String(L);

    // 2. Token box (matches exact CTA size & position)
    const token = document.createElement('div');
    token.className = 'tl-token';
    Object.assign(token.style, {
      left: `${a.left}px`,
      top: `${a.top}px`,
      width: `${W}px`,
      height: `${H}px`,
    });
    token.style.setProperty('--tl-d', `${D}px`);

    const disc = document.createElement('div');
    disc.className = 'tl-token__disc';
    disc.style.background = bg;
    disc.style.clipPath = `inset(0px round ${radius}px)`;

    const img = document.createElement('div');
    img.className = 'tl-token__img';
    if (thumbUrl) {
      img.style.backgroundImage = `url("${thumbUrl.replace(/"/g, '%22')}")`;
    }

    const tag = document.createElement('span');
    tag.className = 'tl-token__tag';
    tag.textContent = variantLabel || '';

    disc.appendChild(img);
    token.appendChild(disc);
    if (variantLabel) {
      token.appendChild(tag);
    }

    document.body.appendChild(token);
    nodes.push(token);
    nodes.forEach((n) => liveNodes.add(n));

    // 3. Pre-eased mathematical sampling along the path
    const samples = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const s = L * easeInOutQuad(u);
      const p = path.getPointAtLength(s);
      samples.push({ u, s, x: p.x, y: p.y });
    }

    const endT = (k) => `translate3d(${Ex - Sx}px, ${Ey - Sy}px, 0) rotate(0deg) scale(${k})`;

    let flightAnim, threadAnim, morphAnim;

    async function fly() {
      cta.dataset.tlState = 'lifted';

      // Crossfade disc appearance over CTA
      anims.push(disc.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90, easing: 'linear', fill: 'forwards' }));

      // Morph from CTA pill shape to pure circle (paint-only, zero reflow)
      const insetX = Math.max(0, (W - D) / 2);
      const insetY = Math.max(0, (H - D) / 2);
      morphAnim = disc.animate(
        [
          { clipPath: `inset(0px round ${radius}px)` },
          { clipPath: `inset(${insetY}px ${insetX}px round ${D / 2}px)` },
        ],
        { duration: coarse ? 180 : 200, easing: EASE_MORPH, fill: 'forwards' }
      );
      anims.push(morphAnim);

      // Fade in product image and hang-tag
      anims.push(img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 100, easing: 'linear', fill: 'forwards' }));
      if (variantLabel) {
        anims.push(tag.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 120, easing: 'linear', fill: 'forwards' }));
      }

      // Parabolic flight (starts 80ms before morph finishes)
      const delay = coarse ? 90 : 120;
      flightAnim = token.animate(
        samples.map(({ u, x, y }) => ({
          offset: u,
          transform: `translate3d(${x - Sx}px, ${y - Sy}px, 0) rotate(${Math.sin(Math.PI * u) * 9 * dir}deg) scale(${1 - 0.64 * Math.pow(u, 0.7)})`,
        })),
        { duration: dur, delay, easing: 'linear', fill: 'both' }
      );

      threadAnim = path.animate(
        samples.map(({ u, s }) => ({ offset: u, strokeDashoffset: `${L - s}` })),
        { duration: dur, delay, easing: 'linear', fill: 'both' }
      );
      anims.push(flightAnim, threadAnim);

      // Size tag pendulum swing
      if (variantLabel) {
        anims.push(
          tag.animate(
            [
              { transform: 'rotate(-24deg)', easing: 'ease-out' },
              { transform: 'rotate(14deg)', offset: 0.45, easing: 'ease-in-out' },
              { transform: 'rotate(-5deg)', offset: 0.75, easing: 'ease-out' },
              { transform: 'rotate(0deg)' },
            ],
            { duration: dur + 200, delay, fill: 'both' }
          )
        );
      }

      await flightAnim.finished;
    }

    async function land(cartResult) {
      // Absorb token into bag target
      const absorb = token.animate(
        [
          { transform: endT(0.36), opacity: 1, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' },
          { transform: endT(0.12), opacity: 0 },
        ],
        { duration: coarse ? 130 : 140, fill: 'forwards' }
      );
      anims.push(absorb);

      // Retract thread into bag
      const retract = path.animate(
        [{ strokeDashoffset: '0' }, { strokeDashoffset: `${-L}` }],
        { duration: 280, easing: EASE_OUT, fill: 'forwards' }
      );
      anims.push(retract);

      bagCatch(target);
      stitchRing(target);

      const badgeEl = target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]');
      setTimeout(() => {
        rollBadge(badgeEl, adapters.getItemCount(cartResult));
      }, 60);

      await Promise.all([absorb.finished, retract.finished]);
    }

    async function rollback() {
      if (!flightAnim) return;
      try {
        if (flightAnim.updatePlaybackRate) flightAnim.updatePlaybackRate(1.25);
        if (threadAnim.updatePlaybackRate) threadAnim.updatePlaybackRate(1.25);
        flightAnim.reverse();
        threadAnim.reverse();
        await flightAnim.finished;

        if (morphAnim) {
          morphAnim.reverse();
          await morphAnim.finished;
        }
      } catch (_) {}

      // Button refusal shake
      const shake = cta.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-6px)', offset: 0.2 },
          { transform: 'translateX(5px)', offset: 0.45 },
          { transform: 'translateX(-3px)', offset: 0.7 },
          { transform: 'translateX(0)' },
        ],
        { duration: 320, easing: 'ease-out' }
      );
      try {
        await shake.finished;
      } catch (_) {}
    }

    function dispose() {
      anims.forEach((x) => {
        try { x.cancel(); } catch (_) {}
      });
      nodes.forEach((n) => {
        n.remove();
        liveNodes.delete(n);
      });
    }

    return { fly, land, rollback, dispose };
  }

  /* ---------------------------------------------------------------------------
     Landing Feedback Micro-Interactions
     --------------------------------------------------------------------------- */
  function bagCatch(el) {
    if (!el) return;
    el.animate(
      [
        { transform: 'scale(1)', easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        { transform: 'scale(1.14)', offset: 0.35, easing: 'ease-in-out' },
        { transform: 'scale(0.97)', offset: 0.7, easing: 'ease-out' },
        { transform: 'scale(1)' },
      ],
      { duration: 360 }
    );
  }

  function stitchRing(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) + 16;

    const ring = document.createElement('div');
    ring.className = 'tl-ring';
    Object.assign(ring.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${r.left + r.width / 2 - size / 2}px`,
      top: `${r.top + r.height / 2 - size / 2}px`,
    });

    document.body.appendChild(ring);
    liveNodes.add(ring);

    const a = ring.animate(
      [
        { transform: 'rotate(0deg) scale(0.82)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'rotate(70deg) scale(1.35)', opacity: 0 },
      ],
      { duration: 520, easing: EASE_OUT }
    );

    onDone(a, () => {
      ring.remove();
      liveNodes.delete(ring);
    });
  }

  function rollBadge(badge, nextCount) {
    if (!badge) return;
    const raw = badge.textContent.replace(/[^\d]/g, '');
    const prev = raw ? parseInt(raw, 10) : 0;
    const next = typeof nextCount === 'number' ? nextCount : parseInt(nextCount, 10) || 0;

    badge.hidden = false;
    const formattedNext = `[${next}]`;

    if (reduceMotion()) {
      badge.textContent = formattedNext;
      return;
    }

    badge.textContent = '';
    badge.classList.add('tl-badge');

    const roll = document.createElement('span');
    roll.className = 'tl-badge__roll';

    const sPrev = document.createElement('span');
    sPrev.textContent = `[${prev}]`;
    const sNext = document.createElement('span');
    sNext.textContent = formattedNext;

    roll.appendChild(sPrev);
    roll.appendChild(sNext);
    badge.appendChild(roll);

    const a = roll.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }],
      { duration: 260, easing: EASE_OUT, fill: 'forwards' }
    );

    onDone(a, () => {
      badge.textContent = formattedNext;
      badge.classList.remove('tl-badge');
    });
  }

  function calmConfirm(cta, target, cartResult, meta) {
    cta.dataset.tlState = 'done';
    if (target) {
      bagCatch(target);
      const badgeEl = target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]');
      rollBadge(badgeEl, adapters.getItemCount(cartResult));
    }
    announce(cartResult);
    adapters.refreshCart(cartResult);
    showPeek(cartResult, target, meta);
    setTimeout(() => {
      cta.dataset.tlState = 'idle';
    }, config.holdLabelMs);
  }

  function failLabel(cta) {
    cta.dataset.tlState = 'error';
    const live = document.querySelector('[data-tl-live]');
    if (live) live.textContent = "Couldn't add to bag. Try again.";
    setTimeout(() => {
      cta.dataset.tlState = 'idle';
    }, 2600);
  }

  function announce(cartResult) {
    const n = adapters.getItemCount(cartResult);
    const live = document.querySelector('[data-tl-live]');
    if (live) {
      live.textContent = `Added to bag. ${n} ${n === 1 ? 'item' : 'items'} in bag.`;
    }
  }

  /* ---------------------------------------------------------------------------
     Tailored Receipt Card (Peek) Engine
     --------------------------------------------------------------------------- */
  let peekEl = null;
  let peekTimer = 0;
  let peekHardTimer = 0;
  let peekCleanupFns = [];

  function showPeek(cartResult, anchor, meta) {
    dismissPeek(true);

    const coarse = isCoarse();
    meta = meta || {};

    const item = cartResult && cartResult.item ? cartResult.item : {};
    const title = meta.productTitle || item.title || 'Added to Bag';
    const variantTitle = meta.variantLabel || item.variant_title || '';
    const imgUrl = meta.thumbUrl || item.featured_image?.url || item.image || '';
    const priceStr = meta.priceFormatted || (item.final_price ? `Rs. ${(item.final_price / 100).toLocaleString('en-PK')}` : '');

    const el = document.createElement('div');
    el.className = 'tl-peek';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Added to bag confirmation');

    // Close Button (×)
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tl-peek__close';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPeek();
    });
    el.appendChild(closeBtn);

    // Mobile pull handle
    const handle = document.createElement('div');
    handle.className = 'tl-peek__handle';
    el.appendChild(handle);

    // Row: img | meta (title, variant, seam) | price
    const row = document.createElement('div');
    row.className = 'tl-peek__row';

    const imgEl = document.createElement('div');
    imgEl.className = 'tl-peek__img';
    if (imgUrl) imgEl.style.backgroundImage = `url("${imgUrl.replace(/"/g, '%22')}")`;

    const metaCol = document.createElement('div');
    metaCol.className = 'tl-peek__meta';

    const nameEl = document.createElement('h4');
    nameEl.className = 'tl-peek__name';
    nameEl.textContent = title;

    metaCol.appendChild(nameEl);

    if (variantTitle) {
      const varEl = document.createElement('p');
      varEl.className = 'tl-peek__variant';
      varEl.textContent = `Size ${variantTitle}`;
      metaCol.appendChild(varEl);
    }

    const seamEl = document.createElement('div');
    seamEl.className = 'tl-peek__seam';
    metaCol.appendChild(seamEl);

    const priceEl = document.createElement('div');
    priceEl.className = 'tl-peek__price';
    priceEl.textContent = priceStr;

    row.appendChild(imgEl);
    row.appendChild(metaCol);
    row.appendChild(priceEl);
    el.appendChild(row);

    // Actions: View bag (secondary) | Checkout (primary)
    const actions = document.createElement('div');
    actions.className = 'tl-peek__actions';

    const viewBagBtn = document.createElement('button');
    viewBagBtn.type = 'button';
    viewBagBtn.className = 'tl-peek__btn tl-peek__btn--secondary';
    viewBagBtn.textContent = 'View bag';
    viewBagBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPeek(true);
      adapters.openCart();
    });

    const checkoutBtn = document.createElement('a');
    checkoutBtn.href = '/checkout';
    checkoutBtn.className = 'tl-peek__btn tl-peek__btn--primary';
    checkoutBtn.textContent = 'Checkout';

    actions.appendChild(viewBagBtn);
    actions.appendChild(checkoutBtn);
    el.appendChild(actions);

    // Dynamic Positioning
    if (coarse) {
      const dock = adapters.getDock();
      const dockH = dock && inViewport(dock) ? dock.getBoundingClientRect().height : 0;
      el.style.bottom = `calc(env(safe-area-inset-bottom, 0px) + ${dockH + 12}px)`;
    } else if (anchor && inViewport(anchor)) {
      const r = anchor.getBoundingClientRect();
      el.style.top = `${r.bottom + 10}px`;
      el.style.right = `${Math.max(16, window.innerWidth - r.right - 8)}px`;
      el.style.transformOrigin = 'top right';
    } else {
      el.style.top = '80px';
      el.style.right = '20px';
    }

    document.body.appendChild(el);
    peekEl = el;
    liveNodes.add(el);

    // Card Entrance Animation
    const enterKeyframes = coarse
      ? [{ transform: 'translateY(120%)', opacity: 1 }, { transform: 'translateY(0)', opacity: 1 }]
      : [{ transform: 'translateY(-8px) scale(0.96)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }];

    el.animate(enterKeyframes, {
      duration: coarse ? 440 : 380,
      easing: coarse ? EASE_SHEET : EASE_OUT,
      fill: 'both'
    });

    // Dashed Seam Drawing
    seamEl.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: 520, delay: 140, easing: EASE_OUT, fill: 'forwards' }
    );

    // Auto-Dismissal Timer (3.5s desktop, 3.8s mobile)
    const ms = coarse ? 3800 : 3500;
    const arm = (delayMs) => {
      clearTimeout(peekTimer);
      peekTimer = setTimeout(() => dismissPeek(), delayMs || ms);
    };
    const hold = () => clearTimeout(peekTimer);

    el.addEventListener('pointerenter', hold);
    el.addEventListener('pointerleave', () => arm(1800));
    el.addEventListener('focusin', hold);
    el.addEventListener('focusout', () => arm(1800));

    // Hard ceiling timeout (never stay open beyond 7s even if hovered)
    clearTimeout(peekHardTimer);
    peekHardTimer = setTimeout(() => dismissPeek(), 7000);

    // Click outside to dismiss immediately
    const onDocPointerDown = (e) => {
      if (el && !el.contains(e.target) && !e.target.closest('[data-tl-cta], [data-tl-bag], [data-tl-dock-bag], .product-card__size-pill')) {
        dismissPeek();
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown, { capture: true });

    // Scroll threshold to dismiss
    const startScroll = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startScroll) > 60) {
        dismissPeek();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Escape key
    const onEsc = (e) => {
      if (e.key === 'Escape') dismissPeek();
    };
    window.addEventListener('keydown', onEsc);

    // Cart drawer open listener
    const onCartOpen = () => dismissPeek(true);
    window.addEventListener('cart:open', onCartOpen, { once: true });

    peekCleanupFns.push(() => {
      document.removeEventListener('pointerdown', onDocPointerDown, { capture: true });
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('cart:open', onCartOpen);
    });

    arm();

    if (coarse) enableSwipe(el);
  }

  function dismissPeek(instant = false) {
    clearTimeout(peekTimer);
    clearTimeout(peekHardTimer);

    peekCleanupFns.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
    peekCleanupFns = [];

    const el = peekEl;
    if (!el) return;
    peekEl = null;

    if (instant || reduceMotion()) {
      el.remove();
      liveNodes.delete(el);
      return;
    }

    try {
      el.getAnimations().forEach((a) => a.cancel());
    } catch (_) {}

    const coarse = isCoarse();
    const outKeyframes = coarse
      ? [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(120%)', opacity: 0 }]
      : [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(-6px) scale(0.96)' }];

    const a = el.animate(outKeyframes, { duration: coarse ? 220 : 180, easing: 'ease-in', fill: 'forwards' });
    onDone(a, () => {
      el.remove();
      liveNodes.delete(el);
    });
  }

  /* ---------------------------------------------------------------------------
     Mobile Touch Swipe Gestures
     --------------------------------------------------------------------------- */
  function enableSwipe(el) {
    let startY = 0;
    let currentY = 0;
    let startTime = 0;
    let dragging = false;

    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      dragging = true;
      startY = e.clientY;
      currentY = startY;
      startTime = Date.now();
      el.setPointerCapture(e.pointerId);
      clearTimeout(peekTimer);
    }, { passive: true });

    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      currentY = e.clientY;
      const dy = currentY - startY;

      // Downward is 1:1, upward is 0.18 rubber-band resistance
      const appliedY = dy > 0 ? dy : dy * 0.18;
      el.style.transform = `translateY(${appliedY}px)`;
    }, { passive: true });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}

      const dy = currentY - startY;
      const dt = Math.max(1, Date.now() - startTime);
      const vy = dy / dt; // px per ms

      if (dy > 60 || vy > 0.5) {
        // Swiped down -> Dismiss
        dismissPeek();
      } else if (dy < -30) {
        // Swiped up -> Open Cart Drawer
        dismissPeek(true);
        adapters.openCart();
      } else {
        // Spring back
        const a = el.animate(
          [{ transform: el.style.transform }, { transform: 'translateY(0)' }],
          { duration: 280, easing: EASE_SHEET, fill: 'forwards' }
        );
        onDone(a, () => {
          el.style.transform = '';
          peekTimer = setTimeout(() => dismissPeek(), 3500);
        });
      }
    };

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  }

  /* ---------------------------------------------------------------------------
     Absolute Memory Hygiene & Lifecycle Cleanup
     --------------------------------------------------------------------------- */
  const killAll = () => {
    liveNodes.forEach((n) => {
      try { n.remove(); } catch (_) {}
    });
    liveNodes.clear();
  };

  window.addEventListener('pagehide', killAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) killAll();
  });

  /* ---------------------------------------------------------------------------
     Global Window API & Event Listener Hooks
     --------------------------------------------------------------------------- */
  window.Threadline = {
    add: addWithThreadline,
    adapters: adapters,
    showPeek: showPeek,
    dismissPeek: dismissPeek,
    killAll: killAll
  };

  // Auto-bind to forms with data-tl-cta or product card size forms if needed
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure screen reader live region exists
    if (!document.querySelector('[data-tl-live]')) {
      const live = document.createElement('div');
      live.className = 'tl-sr';
      live.setAttribute('data-tl-live', '');
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
  });

})();
