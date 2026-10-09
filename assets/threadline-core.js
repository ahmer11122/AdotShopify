/** THREADLINE 3.1 — core (config, helpers, springs, haptics, origin) */
(function () {
  'use strict';
  var TL = (window.__ADOT_TL = window.__ADOT_TL || {});
  if (TL.__core) return;
  TL.__core = true;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DEG = 180 / Math.PI;

  /* ---------------------------------------------------------------------------
     Config
     --------------------------------------------------------------------------- */
  const config = {
    brandMark: 'ADOT',
    logoUrl: '',
    maxFlights: 3,
    awaitMs: 8000,
    holdLabelMs: 1700,
    expressWindowMs: 8000,
    expressFactor: 0.7,
    imageLiftBonus: 40,   // a big photo needs longer to condense than a button needs to lift
    // VERIFY against the real cart drawer markup. Used to find the new line for the brass sweep.
    lineSelector: (id) => '[data-variant-id="' + id + '"], .cart-drawer__item[data-id="' + id + '"]',
    gallerySelector: 'product-gallery img, .pdp-plates img, .pdp-plate__img img, .section-product__gallery img, .product-gallery__item.is-active img, .product-gallery img, .pdp-gallery img, [data-tf-product-image] img',
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

  function photoFor(cta, originEl) {
    if (originEl && originEl.isConnected) return originEl;
    const card = cta.closest('.product-card, [data-product-card]');
    if (card) return card.querySelector('.product-card__media-wrapper, .product-card__image, img');
    const sheet = cta.closest('.mobile-quick-sheet');
    if (sheet) {
      if (sheet._activeImg && sheet._activeImg.isConnected) return sheet._activeImg;
      if (sheet._activeCard && sheet._activeCard.isConnected) {
        return sheet._activeCard.querySelector('.product-card__media-wrapper, .product-card__image, img');
      }
    }
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
      const minDim = isCoarse() ? 40 : 80;
      const minCov = isCoarse() ? 0.15 : 0.35;
      if (coverage >= minCov && w >= minDim && h >= minDim) {
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

  TL.SVG_NS = SVG_NS;
  TL.DEG = DEG;
  TL.config = config;
  TL.EASE = EASE;
  TL.FLIGHT_EASE = FLIGHT_EASE;
  TL.clamp = clamp;
  TL.sleep = sleep;
  TL.done = done;
  TL.HAS_WAAPI = HAS_WAAPI;
  TL.isCoarse = isCoarse;
  TL.reduceMotion = reduceMotion;
  TL.isLite = isLite;
  TL.inViewport = inViewport;
  TL.el = el;
  TL.onDone = onDone;
  TL.bt = bt;
  TL.SPRING_OK = SPRING_OK;
  TL.springCache = springCache;
  TL.spring = spring;
  TL.SPRINGS = SPRINGS;
  TL.sp = sp;
  TL.haptics = haptics;
  TL.photoFor = photoFor;
  TL.resolveOrigin = resolveOrigin;
  TL.scaled = scaled;
})();
