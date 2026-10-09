/**
 * THREADLINE 3.1 — "The Sartorial Hybrid" (fixed)
 * Lift -> 3D suiting fold x2 -> continuous brass thread flight -> vector bag hit -> dual finish.
 *
 * 3.1 changes vs 3.0 (see spec for the full list):
 *  1. ORIGIN: the flyer now condenses out of THE PHOTO OF THE CARD THE SHOPPER TAPPED, never out of
 *     the size pill and never out of an unrelated gallery. New option `originEl` to force it.
 *  2. onStart hook: the size sheet closes AFTER the origin is captured and the flyer is mounted.
 *  3. Thread head and bundle are sampled by ARC LENGTH, so they stay in lockstep.
 *  4. Flight slot accounting: one idempotent release (3.0 could decrement twice and overshoot the cap).
 *  5. Flyer + thread are removed right after landing, not 1.7s later; label reset is independent.
 *  6. Absorb "pierce" now travels along the arrival heading (3.0 offset was scaled to ~0.6px).
 *  7. Restored from 2.0: receipt stagger, swipe-to-dismiss, iOS haptic, pending-safe cleanup.
 *  8. highlightLine waits for the drawer to render the new line (3.0 ran too early).
 *
 * Public API: Threadline.add({ cta, form, variantLabel, title, price, thumbUrl, context, originEl, onStart })
 */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DEG = 180 / Math.PI;

  /* ---------------------------------------------------------------------------
     Config
     --------------------------------------------------------------------------- */
  const config = {
    brandMark: 'ADOT',
    maxFlights: 3,
    awaitMs: 8000,
    holdLabelMs: 1700,
    expressWindowMs: 8000,
    expressFactor: 0.7,
    imageLiftBonus: 40,   // a big photo needs longer to condense than a button needs to lift
    // VERIFY against the real cart drawer markup. Used to find the new line for the brass sweep.
    lineSelector: (id) => '[data-variant-id="' + id + '"], .cart-drawer__item[data-id="' + id + '"]',
    gallerySelector: '.product-gallery__item.is-active img, .product-gallery img, .pdp-gallery img, [data-tf-product-image] img',
    desktop: { w: 96, h: 120, lift: 110, fold1: 170, fold2: 150, flight: 380, catch: 340 },
    mobile:  { w: 80, h: 100, lift: 100, fold1: 150, fold2: 130, flight: 340, catch: 320 },
  };

  const EASE = {
    out:    'cubic-bezier(0.16, 1, 0.3, 1)',
    fold:   'cubic-bezier(0.65, 0, 0.35, 1)',
    in:     'cubic-bezier(0.55, 0, 1, 0.45)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    sheet:  'cubic-bezier(0.32, 0.72, 0, 1)',
  };
  const FLIGHT_EASE = 'cubic-bezier(0.5, 0, 0.3, 0.92)';

  /* ---------------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------------- */
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const done = (anim) => (anim && anim.finished ? anim.finished.then(() => {}, () => {}) : Promise.resolve());

  const HAS_WAAPI = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  const isCoarse = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 768;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLite = () => {
    try {
      return (
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        window.matchMedia('(prefers-reduced-data: reduce)').matches
      );
    } catch (_) { return false; }
  };

  const inViewport = (node) => {
    if (!node) return false;
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  };

  function el(tag, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  // Idempotent: 'finish' and 'cancel' can both fire.
  const onDone = (anim, fn) => {
    let called = false;
    const once = () => { if (called) return; called = true; fn(); };
    if (!anim) return once();
    anim.addEventListener('finish', once, { once: true });
    anim.addEventListener('cancel', once, { once: true });
  };

  // translate -> scale -> rotate about the folded bundle's own centre. Never reorder.
  const bt = (tx, ty, s, r) => 'rotate(' + r + 'deg) scale(' + s + ') translate3d(' + tx + 'px, ' + ty + 'px, 0)';

  /* ---------------------------------------------------------------------------
     Springs -> CSS linear()
     --------------------------------------------------------------------------- */
  const SPRING_OK = (() => {
    try { return !!(window.CSS && CSS.supports && CSS.supports('animation-timing-function', 'linear(0, 1)')); }
    catch (_) { return false; }
  })();
  const springCache = {};
  function spring(stiffness, damping, mass) {
    mass = mass || 1;
    const key = stiffness + '|' + damping + '|' + mass;
    if (springCache[key]) return springCache[key];
    const w0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    const step = (t) => {
      if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
      }
      if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      const s = Math.sqrt(zeta * zeta - 1);
      const r1 = -w0 * (zeta - s), r2 = -w0 * (zeta + s);
      return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
    };
    const FRAME = 1 / 60, MAX = 180, vals = [];
    let lastLoud = 0;
    for (let i = 0; i <= MAX; i++) {
      const v = step(i * FRAME);
      vals.push(v);
      if (Math.abs(1 - v) > 0.002) lastLoud = i;
    }
    const end = Math.min(vals.length - 1, lastLoud + 2);
    const pts = vals.slice(0, end + 1);
    pts[pts.length - 1] = 1;
    const duration = Math.round(end * FRAME * 1000);
    const out = SPRING_OK
      ? { easing: 'linear(' + pts.map((v) => +v.toFixed(4)).join(', ') + ')', duration }
      : { easing: zeta < 0.95 ? 'cubic-bezier(0.34, 1.4, 0.64, 1)' : EASE.out, duration: Math.min(duration, 480) };
    springCache[key] = out;
    return out;
  }
  const SPRINGS = {
    catch: [560, 24, 1], peek: [380, 30, 1], sheet: [300, 34, 1],
    roll: [520, 40, 1], release: [420, 34, 1], knot: [600, 22, 1],
  };
  const sp = (name) => spring.apply(null, SPRINGS[name]);

  /* ---------------------------------------------------------------------------
     Haptics (Android vibrate; iOS 17.4+ best effort)
     --------------------------------------------------------------------------- */
  let iosSwitch = null;
  const haptics = {
    tick(ms) {
      try {
        if (navigator.vibrate) { navigator.vibrate(ms || 8); return; }
        if (!('ontouchstart' in window)) return;
        if (!iosSwitch) {
          iosSwitch = el('label');
          iosSwitch.setAttribute('aria-hidden', 'true');
          iosSwitch.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
          const input = el('input');
          input.type = 'checkbox';
          input.setAttribute('switch', '');
          iosSwitch.appendChild(input);
          document.body.appendChild(iosSwitch);
        }
        iosSwitch.click();
      } catch (_) {}
    },
  };

  /* ---------------------------------------------------------------------------
     Theme adapters
     --------------------------------------------------------------------------- */
  const adapters = {
    getTarget() {
      const coarse = isCoarse();
      const dockBag = document.querySelector('[data-tl-dock-bag], [data-bag-dock]');
      if (coarse && dockBag && inViewport(dockBag)) return dockBag;
      const preferred = document.querySelector('[data-tl-bag]') || document.querySelector('[data-bag-target]') || document.querySelector('.header__cart-btn');
      if (preferred) return preferred;
      // Last resort: a visible cart link that is NOT inside the drawer or the receipt card.
      const links = document.querySelectorAll('a[href*="/cart"]');
      for (const a of links) {
        if (a.closest('cart-drawer, .cart-drawer, .tl-peek')) continue;
        if (inViewport(a)) return a;
      }
      return null;
    },
    async addToCart(form) {
      const formData = form instanceof FormData ? form : new FormData(form);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), config.awaitMs);
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: formData,
          signal: ctrl.signal,
        });
        if (!res.ok) {
          let errDesc = 'Unable to add item';
          try { const e = await res.json(); errDesc = e.description || e.message || errDesc; } catch (_) {}
          throw new Error(errDesc);
        }
        const itemData = await res.json();
        let cartData = null;
        try {
          const cartRes = await fetch('/cart.js', { signal: ctrl.signal });
          if (cartRes.ok) cartData = await cartRes.json();
        } catch (_) {}
        return {
          item: itemData,
          item_count: cartData ? cartData.item_count : (itemData.item_count || 1),
          cart: cartData,
        };
      } finally {
        clearTimeout(timer);
      }
    },
    async resync() {
      try {
        const r = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
        if (!r.ok) return;
        const cart = await r.json();
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
      } catch (_) {}
    },
    getThumbUrl(form, cta) {
      if (form) {
        const imgInput = form.querySelector('input[name="properties[_adot_image]"]');
        if (imgInput && imgInput.value) return imgInput.value;
      }
      if (cta) {
        const card = cta.closest('.product-card');
        if (card) {
          const img = card.querySelector('.product-card__image, img');
          if (img && (img.currentSrc || img.src)) return img.currentSrc || img.src;
        }
        const dock = cta.closest('.pdp-dock');
        if (dock) {
          const img = dock.querySelector('.pdp-dock__img, img');
          if (img && (img.currentSrc || img.src)) return img.currentSrc || img.src;
        }
      }
      const mainImg = document.querySelector(config.gallerySelector);
      if (mainImg && (mainImg.currentSrc || mainImg.src)) return mainImg.currentSrc || mainImg.src;
      return '';
    },
    getVariantLabel(form, cta) {
      if (cta && cta.getAttribute('data-variant-title')) {
        const t = cta.getAttribute('data-variant-title').trim();
        if (t && t.toLowerCase() !== 'add' && t.toLowerCase() !== 'add to bag') return t.length > 3 ? t.slice(0, 3) : t;
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
        if (window.AdotCart && typeof window.AdotCart.formatMoney === 'function') return window.AdotCart.formatMoney(cartResult.item.final_price);
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
    getDock() { return document.querySelector('[data-tl-dock]') || document.querySelector('.pdp-dock'); },
    openCart() {
      const drawer = document.querySelector('cart-drawer, #HeaderCartDrawer, .cart-drawer');
      if (drawer && typeof drawer.open === 'function') drawer.open();
      window.dispatchEvent(new CustomEvent('cart:open'));
      document.documentElement.setAttribute('data-tf-opening', '');
      setTimeout(() => document.documentElement.removeAttribute('data-tf-opening'), 900);
    },
    refreshCart(cartResult) {
      const vId = cartResult && cartResult.item ? cartResult.item.variant_id : undefined;
      window.dispatchEvent(new CustomEvent('cart:refresh', { detail: { variantId: vId } }));
      if (cartResult && cartResult.cart) window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cartResult.cart } }));
    },
  };

  /* ---------------------------------------------------------------------------
     ORIGIN (the 3.0 bug). Scope the photo to the CTA's own product, in this order:
       1. explicit options.originEl
       2. the photo of the .product-card that contains the CTA   <- grid / related products
       3. the PDP gallery, ONLY when the CTA is not inside a card
       4. the CTA itself (sticky dock, no visible photo)
     3.0 skipped 2 entirely: on a collection page it fell to the size pill (inside a closing sheet),
     and on a PDP's related-products card it grabbed the main gallery photo.
     --------------------------------------------------------------------------- */
  function photoFor(cta, originEl) {
    if (originEl && originEl.isConnected) return originEl;
    const card = cta.closest('.product-card');
    if (card) return card.querySelector('.product-card__image') || card.querySelector('img');
    return document.querySelector(config.gallerySelector);
  }

  function resolveOrigin(cta, originEl, T) {
    const photo = photoFor(cta, originEl);
    if (photo) {
      const r = photo.getBoundingClientRect();
      const left = Math.max(r.left, 0), top = Math.max(r.top, 0);
      const right = Math.min(r.right, window.innerWidth), bottom = Math.min(r.bottom, window.innerHeight);
      const w = Math.max(0, right - left), h = Math.max(0, bottom - top);
      const coverage = (w * h) / Math.max(1, r.width * r.height);
      if (coverage >= 0.35 && w >= 90 && h >= 90) {
        return { mode: 'image', cx: (left + right) / 2, cy: (top + bottom) / 2, s0: clamp((w * 0.75) / T.w, 1.1, 2.2) };
      }
    }
    const b = cta.getBoundingClientRect();
    return { mode: 'button', cx: b.left + b.width / 2, cy: b.top + b.height / 2, s0: 0.55 };
  }

  function scaled(T, factor) {
    if (factor === 1) return T;
    const out = Object.assign({}, T);
    ['lift', 'fold1', 'fold2', 'flight', 'catch'].forEach((k) => { out[k] = Math.round(T[k] * factor); });
    return out;
  }

  /* ---------------------------------------------------------------------------
     3D flyer (lift -> fold I -> fold II -> woven label)
     --------------------------------------------------------------------------- */
  function buildFlyer(T, imageSrc, variantLabel) {
    const root = el('div', 'tl-flyer');
    root.setAttribute('aria-hidden', 'true');
    root.style.setProperty('--tl-w', T.w + 'px');
    root.style.setProperty('--tl-h', T.h + 'px');
    root.innerHTML =
      '<div class="tl-body' + (isLite() ? ' tl-body--lite' : '') + '">' +
        '<div class="tl-stage tl-stage--1">' +
          '<div class="tl-base"><div class="tl-img tl-img--bottom"></div><div class="tl-cast"></div></div>' +
          '<div class="tl-flap">' +
            '<div class="tl-face tl-face--front"><div class="tl-img tl-img--top"></div></div>' +
            '<div class="tl-face tl-face--back tl-lining"></div>' +
          '</div>' +
        '</div>' +
        '<div class="tl-stage tl-stage--2">' +
          '<div class="tl-base2 tl-lining tl-lining--right"><div class="tl-cast tl-cast--h"></div></div>' +
          '<div class="tl-flap2">' +
            '<div class="tl-face tl-face--front tl-lining"></div>' +
            '<div class="tl-face tl-face--back tl-label"><span class="tl-brand-mark"></span><span class="tl-tag-size"></span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    // textContent, never innerHTML, for anything that came from the page
    root.querySelector('.tl-brand-mark').textContent = config.brandMark;
    const tagEl = root.querySelector('.tl-tag-size');
    if (variantLabel) tagEl.textContent = variantLabel; else tagEl.remove();
    if (imageSrc) {
      const css = 'url("' + String(imageSrc).replace(/\\/g, '%5C').replace(/"/g, '%22') + '")';
      root.querySelectorAll('.tl-img').forEach((n) => { n.style.backgroundImage = css; });
    }
    return {
      el: root,
      body: root.querySelector('.tl-body'),
      stage1: root.querySelector('.tl-stage--1'),
      stage2: root.querySelector('.tl-stage--2'),
      flap1: root.querySelector('.tl-flap'),
      flap2: root.querySelector('.tl-flap2'),
      cast1: root.querySelector('.tl-base .tl-cast'),
      cast2: root.querySelector('.tl-base2 .tl-cast'),
    };
  }

  function scheduleFolds(anims, f, T, origin) {
    const H = T.h, W = T.w;
    const t1 = T.lift, t2 = T.lift + T.fold1;
    const fromY = origin.mode === 'button' ? 14 : 0;

    anims.push(f.body.animate([
      { transform: bt(0, fromY, origin.s0, 0), opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.45 },
      { transform: bt(0, 0, 1, 0), opacity: 1, offset: 1 },
    ], { duration: T.lift, easing: EASE.out, fill: 'forwards' }));

    const flap1 = f.flap1.animate(
      [{ transform: 'translateZ(0.6px) rotateX(0deg)' }, { transform: 'translateZ(0.6px) rotateX(-180deg)' }],
      { delay: t1, duration: T.fold1, easing: EASE.fold, fill: 'forwards' });
    anims.push(flap1);
    anims.push(f.cast1.animate([{ opacity: 0 }, { opacity: 1, offset: 0.6 }, { opacity: 0.3 }],
      { delay: t1, duration: T.fold1, easing: 'linear', fill: 'forwards' }));
    anims.push(f.body.animate([{ transform: bt(0, 0, 1, 0) }, { transform: bt(0, -H / 4, 1, 0) }],
      { delay: t1, duration: T.fold1, easing: EASE.fold, fill: 'forwards' }));

    anims.push(f.stage1.animate([{ opacity: 1 }, { opacity: 0 }], { delay: t2, duration: 1, fill: 'forwards' }));
    anims.push(f.stage2.animate([{ opacity: 0 }, { opacity: 1 }], { delay: t2, duration: 1, fill: 'forwards' }));

    const flap2 = f.flap2.animate(
      [{ transform: 'translateZ(0.6px) rotateY(0deg)' }, { transform: 'translateZ(0.6px) rotateY(180deg)' }],
      { delay: t2, duration: T.fold2, easing: EASE.fold, fill: 'forwards' });
    anims.push(flap2);
    anims.push(f.cast2.animate([{ opacity: 0 }, { opacity: 1, offset: 0.6 }, { opacity: 0.3 }],
      { delay: t2, duration: T.fold2, easing: 'linear', fill: 'forwards' }));
    anims.push(f.body.animate([{ transform: bt(0, -H / 4, 1, 0) }, { transform: bt(-W / 4, -H / 4, 1, 0) }],
      { delay: t2, duration: T.fold2, easing: EASE.fold, fill: 'forwards' }));

    done(flap1).then(() => haptics.tick(6));
    done(flap2).then(() => haptics.tick(8));
    return flap2;
  }

  /* ---------------------------------------------------------------------------
     Flight + continuous thread. Bundle AND thread head are sampled by ARC LENGTH
     (getPointAtLength), so the brass line always ends exactly under the bundle.
     --------------------------------------------------------------------------- */
  function controlPoint(p0, end, mobile) {
    const dx = end.x - p0.x, dy = end.y - p0.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    let nx = dy / dist, ny = -dx / dist;
    if (ny > 0 || (Math.abs(ny) < 0.001 && nx < 0)) { nx = -nx; ny = -ny; }
    const bulge = clamp(dist * 0.30, mobile ? 40 : 60, mobile ? 130 : 200);
    return {
      dist,
      x: clamp((p0.x + end.x) / 2 + nx * bulge, 12, window.innerWidth - 12),
      y: clamp((p0.y + end.y) / 2 + ny * bulge, 12, window.innerHeight - 12),
    };
  }

  function playFlight(f, T, p0, target, anims, nodes) {
    const W = T.w, H = T.h;
    const tr = target.getBoundingClientRect();
    const end = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
    const cp = controlPoint(p0, end, isCoarse());

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'tl-thread');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M ' + p0.x.toFixed(1) + ' ' + p0.y.toFixed(1) + ' Q ' + cp.x.toFixed(1) + ' ' + cp.y.toFixed(1) + ' ' + end.x.toFixed(1) + ' ' + end.y.toFixed(1));
    svg.appendChild(path);
    document.body.appendChild(svg);
    nodes.push(svg);

    const L = path.getTotalLength();
    path.style.strokeDasharray = L + 'px ' + L + 'px';
    path.style.strokeDashoffset = L + 'px';

    // Same effect-level easing on both => same arc-length fraction at every instant.
    anims.push(path.animate(
      [{ strokeDashoffset: L + 'px' }, { strokeDashoffset: '0px' }],
      { duration: T.flight, easing: FLIGHT_EASE, fill: 'forwards' }));

    const N = isLite() ? 20 : 32;
    const frames = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const pt = path.getPointAtLength(L * u);
      frames.push({ transform: 'translate3d(' + (pt.x - W / 2).toFixed(2) + 'px, ' + (pt.y - H / 2).toFixed(2) + 'px, 0)', offset: u });
    }
    const flightAnim = f.el.animate(frames, { duration: T.flight, easing: FLIGHT_EASE, fill: 'forwards' });
    anims.push(flightAnim);

    const tilt = clamp(((end.x - p0.x) / cp.dist) * 16, -16, 16);
    const endScale = clamp((tr.width * 0.52) / (W / 2), 0.18, 0.58);
    const bx = -W / 4, by = -H / 4;
    anims.push(f.body.animate([
      { transform: bt(bx, by, 1, 0), opacity: 1, offset: 0 },
      { transform: bt(bx, by, 0.94, tilt), opacity: 1, offset: 0.3 },
      { transform: bt(bx, by, endScale * 1.3, -tilt * 0.5), opacity: 1, offset: 0.8 },
      { transform: bt(bx, by, endScale, 0), opacity: 1, offset: 1 },
    ], { duration: T.flight, easing: FLIGHT_EASE, fill: 'forwards' }));

    // Arrival heading from the real end of the path
    const a = path.getPointAtLength(L), b = path.getPointAtLength(Math.max(0, L - 3));
    const hl = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    return { flightAnim, path, L, end, endScale, hx: (a.x - b.x) / hl, hy: (a.y - b.y) / hl };
  }

  /* ---------------------------------------------------------------------------
     Landing micro-interactions
     --------------------------------------------------------------------------- */
  function bagCatch(target, hx, hy) {
    if (!target || reduceMotion()) return;
    const s = sp('catch');
    const rest = 'translate(0px, 0px) scale(1, 1)';
    const hit = 'translate(' + (hx * 3.5).toFixed(2) + 'px, ' + (hy * 3.5).toFixed(2) + 'px) scale(1.16, 0.86)';
    const rebound = 'translate(' + (-hx * 1.5).toFixed(2) + 'px, ' + (-hy * 1.5).toFixed(2) + 'px) scale(0.94, 1.08)';
    target.animate([
      { transform: rest, easing: 'ease-out' },
      { transform: hit, offset: 0.20, easing: s.easing },
      { transform: rebound, offset: 0.55, easing: s.easing },
      { transform: rest },
    ], { duration: s.duration, composite: 'add' });
  }

  function makeRing(target, pad) {
    const r = target.getBoundingClientRect();
    const size = Math.max(r.width, r.height) + pad;
    const ring = el('div', 'tl-ring');
    Object.assign(ring.style, {
      width: size + 'px', height: size + 'px',
      left: (r.left + r.width / 2 - size / 2) + 'px', top: (r.top + r.height / 2 - size / 2) + 'px',
    });
    document.body.appendChild(ring);
    return ring;
  }
  function stitchRing(target) {
    if (!target || reduceMotion()) return;
    const ring = makeRing(target, 16);
    const a = ring.animate([
      { transform: 'rotate(0deg) scale(0.65)', opacity: 0.9 },
      { transform: 'rotate(70deg) scale(1.6)', opacity: 0 },
    ], { duration: 520, easing: EASE.out });
    onDone(a, () => ring.remove());
  }
  function knot(target) {
    if (!target || reduceMotion()) return;
    const r = target.getBoundingClientRect();
    const k = el('div', 'tl-knot');
    k.style.left = (r.left + r.width / 2) + 'px';
    k.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(k);
    const s = sp('knot');
    k.animate([{ transform: 'translate(-50%, -50%) scale(0)' }, { transform: 'translate(-50%, -50%) scale(1)' }],
      { duration: s.duration, easing: s.easing, fill: 'forwards' });
    const fade = k.animate([{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }],
      { duration: 520, easing: 'linear', fill: 'forwards' });
    onDone(fade, () => k.remove());
  }
  function rollBadge(badge, nextCount) {
    if (!badge) return;
    const raw = badge.textContent.replace(/[^\d]/g, '');
    const prev = raw ? parseInt(raw, 10) : 0;
    const next = typeof nextCount === 'number' ? nextCount : parseInt(nextCount, 10) || 0;
    badge.hidden = false;
    const formattedNext = '[' + next + ']';
    if (reduceMotion() || prev === next) { badge.textContent = formattedNext; return; }
    badge.textContent = '';
    badge.classList.add('tl-badge');
    const roll = el('span', 'tl-badge__roll');
    ['[' + prev + ']', formattedNext, formattedNext].forEach((txt) => {
      const row = el('span');
      row.textContent = txt;
      roll.appendChild(row);
    });
    badge.appendChild(roll);
    const s = sp('roll');
    const a = roll.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-33.3333%)' }],
      { duration: s.duration, easing: s.easing, fill: 'forwards' });
    onDone(a, () => { badge.textContent = formattedNext; badge.classList.remove('tl-badge'); });
  }

  function highlightLine(line) {
    if (!line || reduceMotion()) return;
    if (getComputedStyle(line).position === 'static') line.style.position = 'relative';
    const s = el('span', 'tl-sweep');
    s.setAttribute('aria-hidden', 'true');
    line.appendChild(s);
    const a = s.animate([
      { transform: 'scaleX(0)', opacity: 1 },
      { transform: 'scaleX(1)', opacity: 1, offset: 0.6 },
      { transform: 'scaleX(1)', opacity: 0 },
    ], { duration: 850, easing: EASE.out });
    onDone(a, () => s.remove());
  }
  // The drawer renders its lines asynchronously after cart:refresh. Wait for the new one (max ~0.9s).
  function highlightWhenReady(selector, tries) {
    const line = document.querySelector(selector);
    if (line) return highlightLine(line);
    if (tries > 0) setTimeout(() => highlightWhenReady(selector, tries - 1), 60);
  }

  /* ---------------------------------------------------------------------------
     Receipt card (grid quick-add finish): stagger, countdown thread, swipe
     --------------------------------------------------------------------------- */
  let peekEl = null, peekTimerAnim = null, peekHardTimer = 0, peekCleanupFns = [];

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

  function enableSwipe(card, pauseTimer, resumeTimer) {
    let startY = 0, currentY = 0, startTime = 0, dragging = false;
    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      dragging = true; startY = currentY = e.clientY; startTime = Date.now();
      try { card.setPointerCapture(e.pointerId); } catch (_) {}
      pauseTimer();
    }, { passive: true });
    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      currentY = e.clientY;
      const dy = currentY - startY;
      card.style.transform = 'translateY(' + (dy > 0 ? dy : dy * 0.18) + 'px)';
    }, { passive: true });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      try { card.releasePointerCapture(e.pointerId); } catch (_) {}
      const dy = currentY - startY, vy = dy / Math.max(1, Date.now() - startTime);
      if (dy > 60 || vy > 0.5) dismissPeek(false, 'swipe');
      else if (dy < -30) { dismissPeek(true); adapters.openCart(); }
      else {
        const from = card.style.transform || 'translateY(0px)';
        card.style.transform = '';
        const s = sp('release');
        card.animate([{ transform: from }, { transform: 'translateY(0px)' }], { duration: s.duration, easing: s.easing });
        resumeTimer();
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  }

  /* ---------------------------------------------------------------------------
     Failure / calm paths
     --------------------------------------------------------------------------- */
  function playReject(f, T) {
    const bx = -T.w / 4, by = -T.h / 4;
    const shake = f.body.animate([
      { transform: bt(bx, by, 1, 0), offset: 0 },
      { transform: bt(bx - 8, by, 1, -3), offset: 0.18 },
      { transform: bt(bx + 8, by, 1, 3), offset: 0.40 },
      { transform: bt(bx - 5, by, 1, -2), offset: 0.62 },
      { transform: bt(bx + 3, by, 1, 1), offset: 0.82 },
      { transform: bt(bx, by, 1, 0), offset: 1 },
    ], { duration: 340, easing: 'ease-in-out', fill: 'forwards' });
    return done(shake).then(() => done(f.body.animate([
      { transform: bt(bx, by, 1, 0), opacity: 1 },
      { transform: bt(bx, by - 24, 0.8, 0), opacity: 0 },
    ], { duration: 200, easing: EASE.in, fill: 'forwards' })));
  }
  function announce(cartResult) {
    const n = adapters.getItemCount(cartResult);
    const live = document.querySelector('[data-tl-live], [data-adot-live]');
    if (live) live.textContent = 'Added to bag. ' + n + ' ' + (n === 1 ? 'item' : 'items') + ' in bag.';
  }
  function failLabel(cta) {
    cta.dataset.tlState = 'error';
    const live = document.querySelector('[data-tl-live], [data-adot-live]');
    if (live) live.textContent = "Couldn't add to bag. Try again.";
    setTimeout(() => { cta.dataset.tlState = 'idle'; }, 2400);
  }
  function calmConfirm(cta, target, cartResult, meta) {
    cta.dataset.tlState = 'done';
    if (target) {
      bagCatch(target, 0, 1);
      rollBadge(target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]'), adapters.getItemCount(cartResult));
    }
    announce(cartResult);
    adapters.refreshCart(cartResult);
    showPeek(cartResult, target, meta);
    setTimeout(() => { cta.dataset.tlState = 'idle'; }, config.holdLabelMs);
  }

  /* ---------------------------------------------------------------------------
     Orchestration
     --------------------------------------------------------------------------- */
  let activeFlights = 0;
  let chain = Promise.resolve();
  let lastAddAt = 0;
  function enqueue(fn) { const p = chain.then(fn); chain = p.catch(() => {}); return p; }

  async function addWithThreadline(options) {
    const cta = options.cta, form = options.form;
    if (!cta || !form) return;
    const fireStart = () => { try { if (typeof options.onStart === 'function') options.onStart(); } catch (_) {} };

    cta.setAttribute('data-tl-pressed', '');
    setTimeout(() => cta.removeAttribute('data-tl-pressed'), 120);

    const now = Date.now();
    const express = now - lastAddAt < config.expressWindowMs;
    lastAddAt = now;

    const requestP = enqueue(() => adapters.addToCart(form));
    requestP.catch(() => {});
    let settled = false;
    requestP.then(() => { settled = true; }, () => { settled = true; });

    const target = adapters.getTarget();
    const canFly = HAS_WAAPI && !reduceMotion() && target && inViewport(target) &&
      activeFlights < config.maxFlights && (!window.visualViewport || window.visualViewport.scale === 1);

    const thumbUrl = options.thumbUrl || adapters.getThumbUrl(form, cta);
    const variantLabel = options.variantLabel || adapters.getVariantLabel(form, cta);
    const productTitle = options.title || adapters.getProductTitle(form, cta);
    const priceFormatted = options.price || adapters.getPriceFormatted(form, cta);
    const meta = { thumbUrl, variantLabel, productTitle, priceFormatted };
    const isGrid = !!cta.closest('.product-card') || options.context === 'grid';

    if (!canFly) {
      fireStart();
      try {
        calmConfirm(cta, target, await requestP, meta);
      } catch (err) {
        failLabel(cta);
        adapters.resync();
      }
      return;
    }

    // Everything geometric is measured NOW, synchronously, before onStart() can close the size sheet.
    let T = scaled(isCoarse() ? config.mobile : config.desktop, express ? config.expressFactor : 1);
    const origin = resolveOrigin(cta, options.originEl, T);
    if (origin.mode === 'image') T = Object.assign({}, T, { lift: T.lift + Math.round(config.imageLiftBonus * (express ? config.expressFactor : 1)) });
    const p0 = { x: origin.cx, y: origin.cy };

    const f = buildFlyer(T, thumbUrl, variantLabel);
    f.el.style.transform = 'translate3d(' + (p0.x - T.w / 2).toFixed(2) + 'px, ' + (p0.y - T.h / 2).toFixed(2) + 'px, 0)';
    document.body.appendChild(f.el);

    activeFlights++;
    cta.dataset.tlState = 'lifted';
    fireStart();   // size sheet / popover may close now: the flyer already owns its start position

    const anims = [], nodes = [f.el];
    let released = false;
    const dispose = () => {
      anims.forEach((a) => { try { a.cancel(); } catch (_) {} });
      nodes.forEach((n) => { try { n.remove(); } catch (_) {} });
      if (!released) { released = true; activeFlights = Math.max(0, activeFlights - 1); }
    };
    const resetLabel = () => setTimeout(() => { cta.dataset.tlState = 'idle'; }, config.holdLabelMs);

    try {
      await done(scheduleFolds(anims, f, T, origin));

      let breathe = null;
      if (!settled) {
        const bx = -T.w / 4, by = -T.h / 4;
        breathe = f.body.animate([{ transform: bt(bx, by, 1, 0) }, { transform: bt(bx, by, 1.05, 0) }, { transform: bt(bx, by, 1, 0) }],
          { duration: 740, iterations: Infinity, easing: 'ease-in-out' });
        anims.push(breathe);
      }

      let cartResult;
      try {
        cartResult = await requestP;
      } catch (reqErr) {
        if (breathe) breathe.cancel();
        await playReject(f, T);
        failLabel(cta);
        adapters.resync();
        dispose();
        return;
      }
      if (breathe) breathe.cancel();
      cta.dataset.tlState = 'done';

      const fl = playFlight(f, T, { x: p0.x, y: p0.y }, target, anims, nodes);
      await done(fl.flightAnim);

      // Pierce INTO the bag along the arrival heading (translate the flyer root, not the scaled body)
      const endT = (dx, dy) => 'translate3d(' + (fl.end.x - T.w / 2 + dx).toFixed(2) + 'px, ' + (fl.end.y - T.h / 2 + dy).toFixed(2) + 'px, 0)';
      anims.push(f.el.animate([{ transform: endT(0, 0) }, { transform: endT(fl.hx * 9, fl.hy * 9) }],
        { duration: 140, easing: EASE.in, fill: 'forwards' }));
      const bx = -T.w / 4, by = -T.h / 4;
      const absorb = f.body.animate([
        { transform: bt(bx, by, fl.endScale, 0), opacity: 1 },
        { transform: bt(bx, by, 0.08, 0), opacity: 0 },
      ], { duration: 140, easing: EASE.in, fill: 'forwards' });
      anims.push(absorb);
      const retract = fl.path.animate([{ strokeDashoffset: '0px' }, { strokeDashoffset: -fl.L + 'px' }],
        { duration: 260, easing: EASE.out, fill: 'forwards' });
      anims.push(retract);

      haptics.tick(14);
      bagCatch(target, fl.hx, fl.hy);
      stitchRing(target);
      knot(target);
      const badgeEl = target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]');
      setTimeout(() => rollBadge(badgeEl, adapters.getItemCount(cartResult)), 50);
      announce(cartResult);
      adapters.refreshCart(cartResult);

      await Promise.all([done(absorb), done(retract)]);
      dispose();          // flyer + thread are gone NOW; the slot is free for the next tap
      resetLabel();       // label timing is independent of the flight slot

      if (isGrid) {
        showPeek(cartResult, target, { thumbUrl, variantLabel, productTitle, priceFormatted: adapters.getPriceFormatted(form, cta, cartResult) });
      } else {
        adapters.openCart();
        const vId = cartResult && cartResult.item ? cartResult.item.variant_id : null;
        if (vId) highlightWhenReady(config.lineSelector(vId), 14);
      }
    } catch (err) {
      console.warn('Threadline error:', err);
      failLabel(cta);
      adapters.resync();
    } finally {
      dispose();   // idempotent
    }
  }

  /* ---------------------------------------------------------------------------
     Lifecycle + public API
     --------------------------------------------------------------------------- */
  const killAll = () => {
    dismissPeek(true);
    document.querySelectorAll('.tl-flyer, .tl-thread, .tl-ring, .tl-knot').forEach((n) => n.remove());
  };
  window.addEventListener('pagehide', killAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) killAll(); });

  window.Threadline = {
    version: '3.1.0',
    add: addWithThreadline,
    config: config,
    adapters: adapters,
    showPeek: showPeek,
    dismissPeek: dismissPeek,
    highlightLine: highlightLine,
    killAll: killAll,
    spring: spring,
    debug: { activeFlights: () => activeFlights, resolveOrigin: resolveOrigin },
  };

  const initLive = () => {
    if (document.querySelector('[data-tl-live]')) return;
    const live = el('div', 'tl-sr');
    live.setAttribute('data-tl-live', '');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLive);
  else initLive();
})();
