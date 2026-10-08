/**
 * THREADLINE 3.0 — "The Sartorial Hybrid"
 * Award-grade Add to Bag motion system for luxury menswear (Desktop + Mobile).
 * 3D Garment Fold Geometry · Continuous Brass Thread · Apple-grade Physics · Dual-Ending Routing.
 *
 * 1. LIFT & FOLD: Product photo condenses and folds twice (revealing suiting lining + ADOT woven label).
 * 2. PARALLEL GATE: Request fires on press; bundle breathes if network is slow; shakes & dissolves on error.
 * 3. FLIGHT: Continuous brass thread unspools along a quadratic Bezier pulling the suiting bundle.
 * 4. IMPACT: Vector-aware bag catch, tailor's knot pop, dashed stitch ring, odometer badge roll.
 * 5. DUAL FINISH: Floating receipt card for Grid Quick-Add; Cart Drawer / Sheet sweep for PDP.
 *
 * Public API: Threadline.add({ cta, form, variantLabel, title, price, thumbUrl, context })
 */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DEG = 180 / Math.PI;

  /* ---------------------------------------------------------------------------
     Configuration & Master Tokens
     --------------------------------------------------------------------------- */
  const config = {
    brandMark: 'ADOT',
    maxFlights: 3,
    awaitMs: 8000,
    holdLabelMs: 1700,
    expressWindowMs: 8000,
    expressFactor: 0.7,
    desktop: { w: 96, h: 120, lift: 110, fold1: 170, fold2: 150, flight: 380, catch: 340 },
    mobile:  { w: 80, h: 100, lift: 100, fold1: 150, fold2: 130, flight: 340, catch: 320 },
  };

  const EASE = {
    out:    'cubic-bezier(0.16, 1, 0.3, 1)',      // fast start, soft stop
    fold:   'cubic-bezier(0.65, 0, 0.35, 1)',     // crisp suiting fold
    in:     'cubic-bezier(0.55, 0, 1, 0.45)',      // absorb into bag / exit
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // overshoot ONLY on receivers
    sheet:  'cubic-bezier(0.32, 0.72, 0, 1)',    // iOS sheet curve
  };

  const FLIGHT_BEZIER = [0.5, 0, 0.3, 0.92];
  const FLIGHT_EASE   = 'cubic-bezier(' + FLIGHT_BEZIER.join(', ') + ')';

  /* ---------------------------------------------------------------------------
     Helpers & Environment
     --------------------------------------------------------------------------- */
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const done = (anim) => (anim && anim.finished ? anim.finished.then(() => {}, () => {}) : Promise.resolve());

  const HAS_WAAPI = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  const isCoarse = () =>
    (typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
    (typeof window !== 'undefined' && window.innerWidth < 768);
  const reduceMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isLite = () => {
    try {
      return (
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        window.matchMedia('(prefers-reduced-data: reduce)').matches
      );
    } catch (_) { return false; }
  };

  const inViewport = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  };

  function el(tag, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  // Transform order: translate -> scale -> rotate (around bundle center)
  const bt = (tx, ty, s, r) => `rotate(${r}deg) scale(${s}) translate3d(${tx}px, ${ty}px, 0)`;

  // Quadratic Bezier interpolation
  const quad = (p0, p1, p2, t) => {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
  };

  /* ---------------------------------------------------------------------------
     Spring Physics Generator (Apple-grade CSS linear() or cubic fallback)
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
      const r1 = -w0 * (zeta - s);
      const r2 = -w0 * (zeta + s);
      return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
    };

    const FRAME = 1 / 60;
    const MAX = 180;
    const vals = [];
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
    catch:   [560, 24, 1],
    peek:    [380, 30, 1],
    sheet:   [300, 34, 1],
    roll:    [520, 40, 1],
    release: [420, 34, 1],
    knot:    [600, 22, 1],
  };
  const sp = (name) => spring.apply(null, SPRINGS[name]);

  /* ---------------------------------------------------------------------------
     Haptics
     --------------------------------------------------------------------------- */
  const haptics = {
    tick(ms) {
      try {
        if (navigator.vibrate) navigator.vibrate(ms || 8);
      } catch (_) {}
    },
  };

  /* ---------------------------------------------------------------------------
     Shopify & ADOT Theme Adapters
     --------------------------------------------------------------------------- */
  const adapters = {
    getTarget() {
      const coarse = isCoarse();
      const dockBag = document.querySelector('[data-tl-dock-bag], [data-bag-dock]');
      if (coarse && dockBag && inViewport(dockBag)) return dockBag;
      return (
        document.querySelector('[data-tl-bag]') ||
        document.querySelector('[data-bag-target]') ||
        document.querySelector('.header__cart-btn') ||
        document.querySelector('a[href*="/cart"]')
      );
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
          try {
            const errData = await res.json();
            errDesc = errData.description || errData.message || errDesc;
          } catch (_) {}
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
      const mainImg = document.querySelector('.product-gallery__item.is-active img, .product-gallery img, .pdp-gallery img, [data-tf-product-image] img');
      if (mainImg && (mainImg.currentSrc || mainImg.src)) return mainImg.currentSrc || mainImg.src;
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
      const drawer = document.querySelector('cart-drawer, #HeaderCartDrawer, .cart-drawer');
      if (drawer && typeof drawer.open === 'function') drawer.open();
      window.dispatchEvent(new CustomEvent('cart:open'));
      document.documentElement.setAttribute('data-tf-opening', '');
      setTimeout(() => document.documentElement.removeAttribute('data-tf-opening'), 900);
    },
    refreshCart(cartResult) {
      const vId = cartResult && cartResult.item ? cartResult.item.variant_id : undefined;
      window.dispatchEvent(new CustomEvent('cart:refresh', { detail: { variantId: vId } }));
      if (cartResult && cartResult.cart) {
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cartResult.cart } }));
      }
    },
  };

  /* ---------------------------------------------------------------------------
     Origin Resolution
     --------------------------------------------------------------------------- */
  function resolveOrigin(cta, form, T) {
    const mainImg = document.querySelector('.product-gallery__item.is-active img, .product-gallery img, .pdp-gallery img, [data-tf-product-image] img');
    if (mainImg && mainImg.isConnected) {
      const r = mainImg.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const left = Math.max(r.left, 0), top = Math.max(r.top, 0);
      const right = Math.min(r.right, vw), bottom = Math.min(r.bottom, vh);
      const w = Math.max(0, right - left), h = Math.max(0, bottom - top);
      const coverage = (w * h) / Math.max(1, r.width * r.height);
      if (coverage >= 0.35 && w >= 120 && h >= 120) {
        return {
          mode: 'image',
          cx: (left + right) / 2,
          cy: (top + bottom) / 2,
          s0: clamp((w * 0.75) / T.w, 1.1, 2.2),
        };
      }
    }
    const b = cta.getBoundingClientRect();
    return {
      mode: 'button',
      cx: b.left + b.width / 2,
      cy: b.top + b.height / 2,
      s0: 0.55,
    };
  }

  function scaled(T, factor) {
    if (factor === 1) return T;
    const out = { ...T };
    ['lift', 'fold1', 'fold2', 'flight', 'catch'].forEach((k) => {
      out[k] = Math.round(T[k] * factor);
    });
    return out;
  }

  /* ---------------------------------------------------------------------------
     3D Suiting Garment Flyer (Lift -> Fold I -> Fold II -> Woven Label)
     --------------------------------------------------------------------------- */
  function buildFlyer(T, imageSrc, variantLabel) {
    const root = el('div', 'tl-flyer');
    root.setAttribute('aria-hidden', 'true');
    root.style.setProperty('--tl-w', `${T.w}px`);
    root.style.setProperty('--tl-h', `${T.h}px`);

    const lite = isLite();
    root.innerHTML = `
      <div class="tl-body ${lite ? 'tl-body--lite' : ''}">
        <div class="tl-stage tl-stage--1">
          <div class="tl-base">
            <div class="tl-img tl-img--bottom"></div>
            <div class="tl-cast"></div>
          </div>
          <div class="tl-flap">
            <div class="tl-face tl-face--front"><div class="tl-img tl-img--top"></div></div>
            <div class="tl-face tl-face--back tl-lining"></div>
          </div>
        </div>
        <div class="tl-stage tl-stage--2">
          <div class="tl-base2 tl-lining tl-lining--right"><div class="tl-cast tl-cast--h"></div></div>
          <div class="tl-flap2">
            <div class="tl-face tl-face--front tl-lining"></div>
            <div class="tl-face tl-face--back tl-label">
              <span class="tl-brand-mark">${config.brandMark}</span>
              ${variantLabel ? `<span class="tl-tag-size">${variantLabel}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    if (imageSrc) {
      const bgCss = `url("${String(imageSrc).replace(/\\/g, '%5C').replace(/"/g, '%22')}")`;
      root.querySelectorAll('.tl-img').forEach((n) => { n.style.backgroundImage = bgCss; });
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
    const { w: W, h: H } = T;
    const t1 = T.lift;
    const t2 = T.lift + T.fold1;
    const fromY = origin.mode === 'button' ? 14 : 0;

    // 1. Lift & condense from photo (or rise from button)
    const aLift = f.body.animate([
      { transform: bt(0, fromY, origin.s0, 0), opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.45 },
      { transform: bt(0, 0, 1, 0), opacity: 1, offset: 1 },
    ], { duration: T.lift, easing: EASE.out, fill: 'forwards' });
    anims.push(aLift);

    // 2. Fold I: Top half folds down over bottom (revealing oxblood suiting lining)
    const flap1 = f.flap1.animate([
      { transform: 'translateZ(0.6px) rotateX(0deg)' },
      { transform: 'translateZ(0.6px) rotateX(-180deg)' },
    ], { delay: t1, duration: T.fold1, easing: EASE.fold, fill: 'forwards' });
    anims.push(flap1);

    anims.push(f.cast1.animate(
      [{ opacity: 0 }, { opacity: 1, offset: 0.6 }, { opacity: 0.3 }],
      { delay: t1, duration: T.fold1, easing: 'linear', fill: 'forwards' }
    ));

    // Re-center body after Fold 1
    anims.push(f.body.animate(
      [{ transform: bt(0, 0, 1, 0) }, { transform: bt(0, -H / 4, 1, 0) }],
      { delay: t1, duration: T.fold1, easing: EASE.fold, fill: 'forwards' }
    ));

    // Stage hand-off: Stage 2 replaces Stage 1 at t2
    anims.push(f.stage1.animate([{ opacity: 1 }, { opacity: 0 }], { delay: t2, duration: 1, fill: 'forwards' }));
    anims.push(f.stage2.animate([{ opacity: 0 }, { opacity: 1 }], { delay: t2, duration: 1, fill: 'forwards' }));

    // 3. Fold II: Left half folds over right half (revealing woven label)
    const flap2 = f.flap2.animate([
      { transform: 'translateZ(0.6px) rotateY(0deg)' },
      { transform: 'translateZ(0.6px) rotateY(180deg)' },
    ], { delay: t2, duration: T.fold2, easing: EASE.fold, fill: 'forwards' });
    anims.push(flap2);

    anims.push(f.cast2.animate(
      [{ opacity: 0 }, { opacity: 1, offset: 0.6 }, { opacity: 0.3 }],
      { delay: t2, duration: T.fold2, easing: 'linear', fill: 'forwards' }
    ));

    // Re-center bundle to (-W/4, -H/4) so it scales and rotates around its new folded center
    anims.push(f.body.animate(
      [{ transform: bt(0, -H / 4, 1, 0) }, { transform: bt(-W / 4, -H / 4, 1, 0) }],
      { delay: t2, duration: T.fold2, easing: EASE.fold, fill: 'forwards' }
    ));

    done(flap1).then(() => haptics.tick(6));
    done(flap2).then(() => haptics.tick(8));

    return flap2;
  }

  /* ---------------------------------------------------------------------------
     Trajectory & Continuous Thread
     --------------------------------------------------------------------------- */
  function calculateControlPoint(p0, end, isMobile) {
    const dx = end.x - p0.x;
    const dy = end.y - p0.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    let nx = dy / dist;
    let ny = -dx / dist;
    if (ny > 0 || (Math.abs(ny) < 0.001 && nx < 0)) {
      nx = -nx;
      ny = -ny;
    }
    const bulge = clamp(dist * 0.30, isMobile ? 40 : 60, isMobile ? 130 : 200);
    const vw = window.innerWidth, vh = window.innerHeight;
    return {
      dist,
      x: clamp((p0.x + end.x) / 2 + nx * bulge, 12, vw - 12),
      y: clamp((p0.y + end.y) / 2 + ny * bulge, 12, vh - 12),
    };
  }

  function playFlightWithThread(f, T, p0, target, anims, nodes) {
    const { w: W, h: H } = T;
    const tr = target.getBoundingClientRect();
    const end = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
    const cp = calculateControlPoint(p0, end, isCoarse());
    const p1 = { x: cp.x, y: cp.y };

    /* 1. Continuous SVG brass thread */
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'tl-thread');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`);
    svg.appendChild(path);
    document.body.appendChild(svg);
    nodes.push(svg);

    const L = path.getTotalLength();
    path.style.strokeDasharray = `${L}px ${L}px`;
    path.style.strokeDashoffset = `${L}px`;

    // Thread unspools as the bundle flies
    const thAnim = path.animate(
      [{ strokeDashoffset: `${L}px` }, { strokeDashoffset: '0px' }],
      { duration: T.flight, easing: FLIGHT_EASE, fill: 'forwards' }
    );
    anims.push(thAnim);

    /* 2. Bundle 3D Flight Keyframes */
    const N = 32;
    const frames = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const pt = quad(p0, p1, end, t);
      frames.push({
        transform: `translate3d(${(pt.x - W / 2).toFixed(2)}px, ${(pt.y - H / 2).toFixed(2)}px, 0)`,
        offset: t,
      });
    }

    const flightAnim = f.el.animate(frames, { duration: T.flight, easing: FLIGHT_EASE, fill: 'forwards' });
    anims.push(flightAnim);

    // Dynamic tilt & shrink into the target
    const dx = end.x - p0.x;
    const tilt = clamp((dx / cp.dist) * 16, -16, 16);
    const endScale = clamp((tr.width * 0.52) / (W / 2), 0.18, 0.58);
    const bx = -W / 4, by = -H / 4;

    const bodyFlight = f.body.animate([
      { transform: bt(bx, by, 1, 0), opacity: 1, offset: 0 },
      { transform: bt(bx, by, 0.94, tilt), opacity: 1, offset: 0.3 },
      { transform: bt(bx, by, endScale * 1.3, -tilt * 0.5), opacity: 1, offset: 0.8 },
      { transform: bt(bx, by, endScale, 0), opacity: 1, offset: 1 },
    ], { duration: T.flight, easing: FLIGHT_EASE, fill: 'forwards' });
    anims.push(bodyFlight);

    // Compute arrival heading vector for vector-aware bag impact
    const endTangent = {
      x: 2 * (end.x - p1.x),
      y: 2 * (end.y - p1.y),
    };
    const tLen = Math.hypot(endTangent.x, endTangent.y) || 1;
    const hx = endTangent.x / tLen, hy = endTangent.y / tLen;

    return { flightAnim, path, L, end, hx, hy, endScale };
  }

  /* ---------------------------------------------------------------------------
     Landing Micro-Interactions (Vector Catch, Knot, Ring, Odometer)
     --------------------------------------------------------------------------- */
  function bagCatch(target, hx, hy) {
    if (!target || reduceMotion()) return;
    const s = sp('catch');
    const rest = 'translate(0px, 0px) scale(1, 1)';
    const hit = `translate(${(hx * 3.5).toFixed(2)}px, ${(hy * 3.5).toFixed(2)}px) scale(1.16, 0.86)`;
    const rebound = `translate(${(-hx * 1.5).toFixed(2)}px, ${(-hy * 1.5).toFixed(2)}px) scale(0.94, 1.08)`;
    
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
      width: size + 'px',
      height: size + 'px',
      left: (r.left + r.width / 2 - size / 2) + 'px',
      top: (r.top + r.height / 2 - size / 2) + 'px',
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
    done(a).then(() => ring.remove());
  }

  function knot(target) {
    if (!target || reduceMotion()) return;
    const r = target.getBoundingClientRect();
    const k = el('div', 'tl-knot');
    k.style.left = (r.left + r.width / 2) + 'px';
    k.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(k);

    const s = sp('knot');
    k.animate([
      { transform: 'translate(-50%, -50%) scale(0)' },
      { transform: 'translate(-50%, -50%) scale(1)' },
    ], { duration: s.duration, easing: s.easing, fill: 'forwards' });

    const fade = k.animate([
      { opacity: 1 },
      { opacity: 1, offset: 0.55 },
      { opacity: 0 },
    ], { duration: 520, easing: 'linear', fill: 'forwards' });

    done(fade).then(() => k.remove());
  }

  function rollBadge(badge, nextCount) {
    if (!badge) return;
    const raw = badge.textContent.replace(/[^\d]/g, '');
    const prev = raw ? parseInt(raw, 10) : 0;
    const next = typeof nextCount === 'number' ? nextCount : parseInt(nextCount, 10) || 0;
    badge.hidden = false;
    const formattedNext = '[' + next + ']';
    if (reduceMotion() || prev === next) {
      badge.textContent = formattedNext;
      return;
    }
    badge.textContent = '';
    badge.classList.add('tl-badge');
    const roll = el('span', 'tl-badge__roll');
    [('[' + prev + ']'), formattedNext, formattedNext].forEach((txt) => {
      const row = el('span');
      row.textContent = txt;
      roll.appendChild(row);
    });
    badge.appendChild(roll);
    const s = sp('roll');
    const a = roll.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-33.3333%)' },
    ], { duration: s.duration, easing: s.easing, fill: 'forwards' });
    done(a).then(() => {
      badge.textContent = formattedNext;
      badge.classList.remove('tl-badge');
    });
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
    done(a).then(() => s.remove());
  }

  /* ---------------------------------------------------------------------------
     Receipt Card (Peek) for Grid Quick-Add
     --------------------------------------------------------------------------- */
  let peekEl = null;
  let peekTimerAnim = null;
  let peekHardTimer = 0;
  let peekCleanupFns = [];

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

    const handle = el('div', 'tl-peek__handle');
    card.appendChild(handle);

    const row = el('div', 'tl-peek__row');
    const imgBox = el('div', 'tl-peek__img');
    if (imgUrl) imgBox.style.backgroundImage = 'url("' + imgUrl.replace(/"/g, '%22') + '")';

    const metaCol = el('div', 'tl-peek__meta');
    const nameEl = el('h4', 'tl-peek__name');
    nameEl.textContent = title;
    metaCol.appendChild(nameEl);

    if (variantTitle) {
      const varEl = el('p', 'tl-peek__variant');
      varEl.textContent = 'Size ' + variantTitle;
      metaCol.appendChild(varEl);
    }
    const seamEl = el('div', 'tl-peek__seam');
    metaCol.appendChild(seamEl);

    const priceEl = el('div', 'tl-peek__price');
    priceEl.textContent = priceStr;

    row.appendChild(imgBox);
    row.appendChild(metaCol);
    row.appendChild(priceEl);
    card.appendChild(row);

    const actions = el('div', 'tl-peek__actions');
    const viewBagBtn = el('button', 'tl-peek__btn tl-peek__btn--secondary');
    viewBagBtn.type = 'button';
    viewBagBtn.textContent = 'View bag';
    viewBagBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPeek(true);
      adapters.openCart();
    });

    const checkoutBtn = el('a', 'tl-peek__btn tl-peek__btn--primary');
    checkoutBtn.href = '/checkout';
    checkoutBtn.textContent = 'Checkout';

    actions.appendChild(viewBagBtn);
    actions.appendChild(checkoutBtn);
    card.appendChild(actions);

    const timerEl = el('div', 'tl-peek__timer');
    card.appendChild(timerEl);

    if (coarse) {
      const dock = adapters.getDock();
      const dockH = dock && inViewport(dock) ? dock.getBoundingClientRect().height : 0;
      card.style.bottom = `calc(env(safe-area-inset-bottom, 0px) + ${dockH + 12}px)`;
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
      const ox = clamp(ar.left + ar.width / 2 - box.left, 0, box.width);
      card.style.transformOrigin = ox + 'px ' + (coarse ? '100%' : '0px');
    } else {
      card.style.transformOrigin = coarse ? '50% 100%' : '100% 0px';
    }

    if (calm) {
      seamEl.style.clipPath = 'none';
      if (HAS_WAAPI) card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, fill: 'backwards' });
    } else {
      const s = sp(coarse ? 'sheet' : 'peek');
      const from = coarse ? 'translateY(28px) scale(0.9)' : 'translateY(-10px) scale(0.92)';
      card.animate(
        [{ transform: from }, { transform: 'translateY(0px) scale(1)' }],
        { duration: s.duration, easing: s.easing, fill: 'backwards' }
      );
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'backwards' });
      seamEl.animate(
        [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 520, delay: 160, easing: EASE.out, fill: 'forwards' }
      );
    }

    const totalTime = coarse ? 3800 : 3500;
    try {
      peekTimerAnim = timerEl.animate(
        [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
        { duration: totalTime, easing: 'linear', fill: 'forwards' }
      );
      peekTimerAnim.addEventListener('finish', () => dismissPeek(), { once: true });
    } catch (_) {
      peekTimerAnim = null;
      const t = setTimeout(() => dismissPeek(), totalTime);
      peekCleanupFns.push(() => clearTimeout(t));
    }

    const pauseTimer = () => { try { if (peekTimerAnim) peekTimerAnim.pause(); } catch (_) {} };
    const resumeTimer = () => {
      try {
        if (!peekTimerAnim) return;
        peekTimerAnim.currentTime = Math.min(peekTimerAnim.currentTime || 0, totalTime - 1200);
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
      if (card && !card.contains(e.target) && !e.target.closest('[data-tl-cta], [data-tl-bag], [data-tl-dock-bag], .product-card__size-pill')) {
        dismissPeek();
      }
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
  }

  function dismissPeek(instant) {
    clearTimeout(peekHardTimer);
    if (peekTimerAnim) { try { peekTimerAnim.cancel(); } catch (_) {} peekTimerAnim = null; }
    peekCleanupFns.forEach((fn) => { try { fn(); } catch (_) {} });
    peekCleanupFns = [];
    const card = peekEl;
    if (!card) return;
    peekEl = null;
    if (instant || reduceMotion() || !HAS_WAAPI) {
      card.remove();
      return;
    }
    const cs = window.getComputedStyle(card);
    const fromT = cs.transform === 'none' ? 'translateY(0px)' : cs.transform;
    const fromO = cs.opacity;
    try { card.getAnimations().forEach((x) => x.cancel()); } catch (_) {}
    const coarse = isCoarse();
    const toT = coarse ? 'translateY(24px) scale(0.92)' : 'translateY(-8px) scale(0.96)';
    const a = card.animate(
      [{ transform: fromT, opacity: fromO }, { transform: toT, opacity: 0 }],
      { duration: coarse ? 200 : 160, easing: EASE.in, fill: 'forwards' }
    );
    done(a).then(() => card.remove());
  }

  /* ---------------------------------------------------------------------------
     Rejection & Failure Handling
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
      const badgeEl = target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]');
      rollBadge(badgeEl, adapters.getItemCount(cartResult));
    }
    announce(cartResult);
    adapters.refreshCart(cartResult);
    showPeek(cartResult, target, meta);
    setTimeout(() => { cta.dataset.tlState = 'idle'; }, config.holdLabelMs);
  }

  /* ---------------------------------------------------------------------------
     Orchestration Engine (addWithThreadline)
     --------------------------------------------------------------------------- */
  let activeFlights = 0;
  let chain = Promise.resolve();
  let lastAddAt = 0;

  function enqueue(fn) {
    const p = chain.then(fn);
    chain = p.catch(() => {});
    return p;
  }

  async function addWithThreadline(options) {
    const cta = options.cta, form = options.form;
    if (!cta || !form) return;

    // Fast-press feedback
    cta.setAttribute('data-tl-pressed', '');
    setTimeout(() => cta.removeAttribute('data-tl-pressed'), 120);

    const now = Date.now();
    const isExpress = now - lastAddAt < config.expressWindowMs;
    lastAddAt = now;

    // Optimistic network dispatch
    const requestP = enqueue(() => adapters.addToCart(form));
    requestP.catch(() => {});
    let settled = null;
    requestP.then((r) => { settled = { ok: true, val: r }; }, (e) => { settled = { ok: false, err: e }; });

    const target = adapters.getTarget();
    const canFly =
      HAS_WAAPI &&
      !reduceMotion() &&
      target &&
      inViewport(target) &&
      activeFlights < config.maxFlights &&
      (!window.visualViewport || window.visualViewport.scale === 1);

    const thumbUrl = options.thumbUrl || adapters.getThumbUrl(form, cta);
    const variantLabel = options.variantLabel || adapters.getVariantLabel(form, cta);
    const productTitle = options.title || adapters.getProductTitle(form, cta);
    const priceFormatted = options.price || adapters.getPriceFormatted(form, cta);
    const meta = { thumbUrl, variantLabel, productTitle, priceFormatted };

    const isGridQuickAdd = !!cta.closest('.product-card') || options.context === 'grid';

    if (!canFly) {
      try {
        const cartResult = await requestP;
        calmConfirm(cta, target, cartResult, meta);
      } catch (err) {
        failLabel(cta);
        adapters.resync();
      }
      return;
    }

    activeFlights++;
    cta.dataset.tlState = 'lifted';

    const T = scaled(isCoarse() ? config.mobile : config.desktop, isExpress ? config.expressFactor : 1);
    const origin = resolveOrigin(cta, form, T);
    const p0 = { x: origin.cx, y: origin.cy };

    const f = buildFlyer(T, thumbUrl, variantLabel);
    f.el.style.transform = `translate3d(${(p0.x - T.w / 2).toFixed(2)}px, ${(p0.y - T.h / 2).toFixed(2)}px, 0)`;
    document.body.appendChild(f.el);

    const anims = [];
    const nodes = [f.el];

    const cleanup = () => {
      anims.forEach((a) => { try { a.cancel(); } catch (_) {} });
      nodes.forEach((n) => { try { n.remove(); } catch (_) {} });
      activeFlights = Math.max(0, activeFlights - 1);
    };

    try {
      // 1. Execute 3D folds
      const foldEnd = scheduleFolds(anims, f, T, origin);
      await done(foldEnd);

      // 2. Parallel Network Gate: Breathing loop if server is slower than folds
      let breatheAnim = null;
      if (!settled) {
        const bx = -T.w / 4, by = -T.h / 4;
        breatheAnim = f.body.animate([
          { transform: bt(bx, by, 1, 0) },
          { transform: bt(bx, by, 1.05, 0) },
          { transform: bt(bx, by, 1, 0) },
        ], { duration: 740, iterations: Infinity, easing: 'ease-in-out' });
        anims.push(breatheAnim);
      }

      let cartResult;
      try {
        cartResult = await requestP;
      } catch (reqErr) {
        if (breatheAnim) breatheAnim.cancel();
        await playReject(f, T);
        failLabel(cta);
        adapters.resync();
        cleanup();
        return;
      }

      if (breatheAnim) breatheAnim.cancel();
      cta.dataset.tlState = 'done'; // Server confirmed

      // 3. Flight with Continuous SVG Brass Thread
      const flightData = playFlightWithThread(f, T, p0, target, anims, nodes);
      await done(flightData.flightAnim);

      // 4. Absorbed into Bag & Thread Retraction
      const bx = -T.w / 4, by = -T.h / 4;
      const absorb = f.body.animate([
        { transform: bt(bx, by, flightData.endScale, 0), opacity: 1 },
        { transform: bt(bx + flightData.hx * 8, by + flightData.hy * 8, 0.08, 0), opacity: 0 },
      ], { duration: 140, easing: EASE.in, fill: 'forwards' });
      anims.push(absorb);

      const retract = flightData.path.animate([
        { strokeDashoffset: '0px' },
        { strokeDashoffset: `-${flightData.L}px` },
      ], { duration: 260, easing: EASE.out, fill: 'forwards' });
      anims.push(retract);

      // 5. Impact Physics: Vector Catch, Knot, Ring, Odometer
      haptics.tick(14);
      bagCatch(target, flightData.hx, flightData.hy);
      stitchRing(target);
      knot(target);

      const badgeEl = target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]');
      setTimeout(() => rollBadge(badgeEl, adapters.getItemCount(cartResult)), 50);

      announce(cartResult);
      adapters.refreshCart(cartResult);

      await Promise.all([done(absorb), done(retract)]);

      // 6. Dual-Finish Terminal Action
      if (isGridQuickAdd) {
        showPeek(cartResult, target, {
          thumbUrl,
          variantLabel,
          productTitle,
          priceFormatted: adapters.getPriceFormatted(form, cta, cartResult),
        });
      } else {
        // PDP Full Add: Open Drawer / Bottom Sheet & line sweep
        adapters.openCart();
        requestAnimationFrame(() => {
          const vId = cartResult && cartResult.item ? cartResult.item.variant_id : null;
          if (vId) {
            const line = document.querySelector(`[data-variant-id="${vId}"], .cart-drawer__item[data-id="${vId}"]`);
            if (line) highlightLine(line);
          }
        });
      }

      await sleep(config.holdLabelMs);
      cta.dataset.tlState = 'idle';
    } catch (err) {
      console.warn('Threadline hybrid error:', err);
      failLabel(cta);
      adapters.resync();
    } finally {
      cleanup();
    }
  }

  /* ---------------------------------------------------------------------------
     Public API
     --------------------------------------------------------------------------- */
  window.Threadline = {
    version: '3.0.0',
    add: addWithThreadline,
    config: config,
    adapters: adapters,
    showPeek: showPeek,
    dismissPeek: dismissPeek,
    highlightLine: highlightLine,
    spring: spring,
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
