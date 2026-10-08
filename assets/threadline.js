/**
 * THREADLINE 2.0 — "Cut · Carry · Close"
 * Add to Bag motion system (Desktop + Mobile)
 * Native Web Animations API + SVG quadratic path sampling. Zero dependencies.
 *
 * START  (Cut)   button is cut open -> swatch lifts out, brass cut-line stays behind
 * MIDDLE (Carry) swatch folds into a brass dart, turns along its path, trails the thread
 * END    (Close) dart pierces the bag, knot pops, bag tugs on a spring, count rolls,
 *                receipt card unfurls from the bag, its countdown is the thread running out
 *
 * Public API is unchanged:  Threadline.add({ cta, form, variantLabel, title, price, thumbUrl })
 * New optional option:      vessel: 'dart' | 'swatch' | 'disc'
 */
(function () {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DEG = 180 / Math.PI;
  const THREAD = '#A8864F';
  /* ---------------------------------------------------------------------------
     Easing tokens
     --------------------------------------------------------------------------- */
  const EASE_OUT   = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const EASE_IN    = 'cubic-bezier(0.55, 0, 1, 0.45)';
  const EASE_MORPH = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const EASE_DART  = 'cubic-bezier(0.5, 0, 0.2, 1)';
  /* ---------------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------------- */
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  // Flight progress: a gentle wind-up (the morph happens here), then the dart is
  // thrown and ARRIVES FAST. Nonzero arrival speed is what makes impact read as impact.
  const easeFlight = (u) => 0.1 * u + 0.9 * Math.pow(u, 2.1);
  const HAS_WAAPI = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  const isCoarse = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 990;
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
  const inViewport = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  };
  // Idempotent: 'finish' and 'cancel' can both fire (e.g. dispose() after finish).
  const onDone = (anim, fn) => {
    let called = false;
    const once = () => { if (called) return; called = true; fn(); };
    if (!anim) return once();
    anim.addEventListener('finish', once, { once: true });
    anim.addEventListener('cancel', once, { once: true });
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const config = {
    vessel: 'dart',      // 'dart' | 'swatch' | 'disc'
    maxFlights: 3,
    awaitMs: 8000,       // network abort. Pending state covers the wait; never roll back at 4s while server may succeed.
    holdLabelMs: 1700,
  };
  let activeFlights = 0;
  let chain = Promise.resolve();
  const liveNodes = new Set();
  function enqueue(fn) {
    const p = chain.then(fn);
    chain = p.catch(() => {});
    return p;
  }
  /* ---------------------------------------------------------------------------
     Springs -> CSS linear() easing (Apple-grade physics, zero JS per frame)
     Falls back to a cubic-bezier overshoot where linear() is unsupported.
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
    const MAX = 180; // 3s ceiling
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
      : { easing: zeta < 0.95 ? 'cubic-bezier(0.34, 1.4, 0.64, 1)' : EASE_OUT, duration: Math.min(duration, 480) };
    springCache[key] = out;
    return out;
  }
  const SPRINGS = {
    catch:   [560, 24, 1],  // bag tug: lively but quick, small overshoot on a tiny displacement
    peek:    [380, 30, 1],  // desktop receipt: settles with a whisper of overshoot
    sheet:   [300, 34, 1],  // mobile receipt: near-critically damped, no bounce
    roll:    [520, 40, 1],  // odometer
    release: [420, 34, 1],  // swipe release
    knot:    [600, 22, 1],  // knot pop
  };
  const sp = (name) => spring.apply(null, SPRINGS[name]);
  /* ---------------------------------------------------------------------------
     Shape system: swatch -> dart morph via equal-vertex clip-path polygons.
     Every shape is sampled at the SAME N angles around the centre (ray casting),
     so any two shapes interpolate cleanly. N is a multiple of 12 so the dart's
     nose (0deg), wing tips (+-150deg) and tail notch (180deg) land exactly on
     vertices and stay razor sharp.
     --------------------------------------------------------------------------- */
  const TIP_X = -Math.sqrt(3) / 2; // exactly 150deg on a unit circle, so tips sit on a grid vertex
  const DART_POLY = [[1, 0], [TIP_X, 0.5], [-0.4, 0], [TIP_X, -0.5]]; // nose points +x
  function roundedSquare(h, rc, seg) {
    const c = h - rc;
    const pts = [];
    [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]].forEach((q) => {
      for (let i = 0; i <= seg; i++) {
        const a = (q[2] + (90 * i) / seg) / DEG;
        pts.push([q[0] * c + Math.cos(a) * rc, q[1] * c + Math.sin(a) * rc]);
      }
    });
    return pts;
  }
  function polyRadial(poly, N) {
    const r = new Array(N);
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const dx = Math.cos(th), dy = Math.sin(th);
      let best = Infinity;
      for (let k = 0; k < poly.length; k++) {
        const p = poly[k], q = poly[(k + 1) % poly.length];
        const ex = q[0] - p[0], ey = q[1] - p[1];
        const den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-9) continue;
        const t = (p[0] * ey - p[1] * ex) / den;
        const u = (p[0] * dy - p[1] * dx) / den;
        if (t >= 0 && u >= -1e-9 && u <= 1 + 1e-9 && t < best) best = t;
      }
      r[i] = best;
    }
    return r;
  }
  const shapeCache = {};
  function unitShapes(N) {
    if (shapeCache[N]) return shapeCache[N];
    shapeCache[N] = {
      circle: new Array(N).fill(1),
      swatch: polyRadial(roundedSquare(0.86, 0.3, 8), N),
      dart:   polyRadial(DART_POLY, N),
    };
    return shapeCache[N];
  }
  function polyCss(radii, cx, cy, R) {
    const N = radii.length;
    let s = '';
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const r = radii[i] * R;
      s += (i ? ', ' : '') + (cx + Math.cos(th) * r).toFixed(2) + 'px ' + (cy + Math.sin(th) * r).toFixed(2) + 'px';
    }
    return 'polygon(' + s + ')';
  }
  // Keep keyframe offsets non-decreasing no matter how timings are tuned.
  const mono = (frames) => {
    let last = 0;
    frames.forEach((f) => { f.offset = Math.max(last, f.offset); last = f.offset; });
    return frames;
  };
  /* ---------------------------------------------------------------------------
     Haptics (Android vibrate; iOS 17.4+ best-effort via <input switch>)
     --------------------------------------------------------------------------- */
  let iosSwitch = null;
  const haptics = {
    tick(ms) {
      try {
        if (navigator.vibrate) { navigator.vibrate(ms || 8); return; }
        if (!('ontouchstart' in window)) return;
        if (!iosSwitch) {
          iosSwitch = document.createElement('label');
          iosSwitch.setAttribute('aria-hidden', 'true');
          iosSwitch.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
          const input = document.createElement('input');
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
     Shopify & ADOT theme adapters (unchanged contract, plus abort + resync)
     --------------------------------------------------------------------------- */
  const adapters = {
    getTarget() {
      const coarse = isCoarse();
      const dockBag = document.querySelector('[data-tl-dock-bag]');
      if (coarse && dockBag && inViewport(dockBag)) return dockBag;
      return document.querySelector('[data-tl-bag]') || document.querySelector('.header__cart-btn');
    },
    async addToCart(form) {
      const formData = form instanceof FormData ? form : new FormData(form);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), config.awaitMs);
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
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
    // After any failure/abort the server may still have added the item.
    // Re-read the cart so the badge and drawer tell the truth.
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
      if (drawer && typeof drawer.open === 'function') drawer.open();
      window.dispatchEvent(new CustomEvent('cart:open'));
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
     Main pipeline
     --------------------------------------------------------------------------- */
  async function addWithThreadline(options) {
    const cta = options.cta, form = options.form;
    if (!cta || !form) return;
    const requestP = enqueue(() => adapters.addToCart(form));
    requestP.catch(() => {});
    let settled = false;
    requestP.then(() => { settled = true; }, () => { settled = true; });
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
    const calmPath = async () => {
      try {
        const cartResult = await requestP;
        calmConfirm(cta, target, cartResult, meta);
      } catch (err) {
        failLabel(cta);
        adapters.resync();
      }
    };
    if (!canFly) return calmPath();
    let flight = null;
    try {
      flight = createFlight(cta, target, thumbUrl, variantLabel, options.vessel || config.vessel);
    } catch (err) {
      console.warn('Threadline: flight unavailable, using calm confirm.', err);
    }
    if (!flight) return calmPath();
    activeFlights++;
    let landed = false;
    try {
      haptics.tick(8);
      await flight.fly();
      // Network slower than the flight? Don't park a dead token in mid-air:
      // the stitch ring spins around the bag until the response arrives.
      if (!settled) flight.hold();
      const cartResult = await requestP;
      cta.dataset.tlState = 'done';   // label rolls in exactly on impact
      await flight.land(cartResult);
      landed = true;
      haptics.tick(14);
      announce(cartResult);
      adapters.refreshCart(cartResult);
      showPeek(cartResult, target, {
        thumbUrl,
        variantLabel,
        productTitle,
        priceFormatted: adapters.getPriceFormatted(form, cta, cartResult),
      });
      await sleep(config.holdLabelMs);
      cta.dataset.tlState = 'idle';
    } catch (err) {
      if (landed) {
        console.error('Threadline post-landing error:', err);
        cta.dataset.tlState = 'idle';
      } else {
        console.warn('Threadline rollback:', err);
        await flight.rollback();
        failLabel(cta);
        adapters.resync();
      }
    } finally {
      flight.dispose();
      activeFlights--;
    }
  }
  /* ---------------------------------------------------------------------------
     Flight engine: ONE master timeline (duration T) shared by every layer, so a
     failure rollback is a perfectly mirrored rewind of shape, colour, thread,
     tag and position together.
     --------------------------------------------------------------------------- */
  function createFlight(cta, target, thumbUrl, variantLabel, vessel) {
    const coarse = isCoarse();
    const lite = isLite();
    const useDart = vessel === 'dart';
    const useSwatch = vessel === 'dart' || vessel === 'swatch';
    const a = cta.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const W = a.width, H = a.height;
    const Sx = a.left + W / 2, Sy = a.top + H / 2;
    const Ex = b.left + b.width / 2, Ey = b.top + b.height / 2;
    const dist = Math.hypot(Ex - Sx, Ey - Sy) || 1;
    const D = Math.min(W, Math.max(H, coarse ? 52 : 56));
    const Hb = Math.max(H, D);                         // token box is never shorter than the disc
    const dur = Math.round(coarse ? clamp(320 + dist * 0.34, 420, 560) : clamp(420 + dist * 0.30, 520, 720));
    const delay = coarse ? 90 : 120;                   // flight starts while the morph is still finishing
    const lift = coarse ? 180 : 210;                   // pill -> disc complete
    const T = delay + dur;
    const ms = (t) => clamp(t / T, 0, 1);
    const dir = Math.sign(Ex - Sx) || 1;
    const cs = window.getComputedStyle(cta);
    let radius = parseFloat(cs.borderTopLeftRadius) || 0;
    if (String(cs.borderTopLeftRadius).indexOf('%') > -1) radius = (Math.min(W, H) * radius) / 100;
    radius = Math.min(radius, H / 2);
    const bg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : '#111111';
    const anims = [];
    const master = [];
    const nodes = [];
    let tokenAnim = null, leanAnim = null, holdRing = null;
    /* ---- thread path (apex biased toward the start so the dart dives into the bag) ---- */
    const arcRise = clamp(dist * 0.30, coarse ? 36 : 56, coarse ? 120 : 220);
    const Cx = Sx + (Ex - Sx) * 0.42;
    const Cy = (Sy + Ey) / 2 - 2 * arcRise;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'tl-thread');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M' + Sx + ' ' + Sy + ' Q' + Cx + ' ' + Cy + ' ' + Ex + ' ' + Ey);
    svg.appendChild(path);
    document.body.appendChild(svg);
    nodes.push(svg);
    const L = path.getTotalLength();
    path.style.strokeDasharray = L + 'px ' + L + 'px';
    path.style.strokeDashoffset = L + 'px';
    /* ---- token ---- */
    const token = document.createElement('div');
    token.className = 'tl-token' + (lite ? ' tl-token--lite' : '');
    Object.assign(token.style, {
      left: (Sx - W / 2) + 'px',
      top: (Sy - Hb / 2) + 'px',
      width: W + 'px',
      height: Hb + 'px',
    });
    const disc = document.createElement('div');
    disc.className = 'tl-token__disc';
    disc.style.background = bg;
    disc.style.clipPath = 'inset(' + (Hb - H) / 2 + 'px 0px round ' + radius + 'px)';
    const img = document.createElement('div');
    img.className = 'tl-token__img';
    if (thumbUrl) img.style.backgroundImage = 'url("' + thumbUrl.replace(/"/g, '%22') + '")';
    const fold = document.createElement('div');
    fold.className = 'tl-token__fold';
    disc.appendChild(img);
    disc.appendChild(fold);
    token.appendChild(disc);
    document.body.appendChild(token);
    nodes.push(token);
    /* ---- hang tag (own wrapper: follows the path, never rotates with the dart) ---- */
    let tagWrap = null, tag = null;
    if (variantLabel) {
      tagWrap = document.createElement('div');
      tagWrap.className = 'tl-tagfly';
      tagWrap.style.left = Sx + 'px';
      tagWrap.style.top = Sy + 'px';
      tagWrap.style.setProperty('--tl-d', D + 'px');
      tag = document.createElement('span');
      tag.className = 'tl-token__tag';
      tag.textContent = variantLabel;
      tagWrap.appendChild(tag);
      document.body.appendChild(tagWrap);
      nodes.push(tagWrap);
    }
    nodes.forEach((n) => liveNodes.add(n));
    /* ---- sampling: position, tangent angle (unwrapped), pose ---- */
    const NS = lite ? 16 : coarse ? 22 : 30;
    const samples = [];
    for (let i = 0; i <= NS; i++) {
      const u = i / NS;
      const p = easeFlight(u);
      const pt = path.getPointAtLength(L * p);
      samples.push({ u, p, s: L * p, x: pt.x, y: pt.y, ang: 0 });
    }
    for (let i = 0; i <= NS; i++) {
      const p0 = samples[Math.max(0, i - 1)], p1 = samples[Math.min(NS, i + 1)];
      let ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) * DEG;
      if (i > 0) {
        while (ang - samples[i - 1].ang > 180) ang -= 360;
        while (ang - samples[i - 1].ang < -180) ang += 360;
      }
      samples[i].ang = ang;
    }
    const endSmp = samples[NS];
    const hx = Math.cos(endSmp.ang / DEG), hy = Math.sin(endSmp.ang / DEG); // arrival heading
    const poseAt = (smp) => {
      const rot = useDart ? smp.ang * smoothstep(0.04, 0.34, smp.u) : Math.sin(Math.PI * smp.u) * 9 * dir;
      const sc = 1 - 0.64 * Math.pow(smp.p, 0.8);
      const k = useDart ? smoothstep(0.30, 0.95, smp.u) : 0;      // stretch along heading as it speeds up
      const sx = sc * (1 + 0.2 * k), sy = sc * (1 - 0.08 * k);
      return {
        rot,
        css:
          'translate3d(' + (smp.x - Sx).toFixed(2) + 'px, ' + (smp.y - Sy).toFixed(2) + 'px, 0) ' +
          'rotate(' + rot.toFixed(2) + 'deg) scale(' + sx.toFixed(3) + ', ' + sy.toFixed(3) + ')',
        sc,
      };
    };
    const endPose = poseAt(endSmp);
    const HOME = 'translate3d(0px, 0px, 0) rotate(0deg) scale(1, 1)';
    /* ---- shapes (px polygons, centred in the token box) ---- */
    const NP = lite ? 24 : coarse ? 36 : 48;
    const S = unitShapes(NP);
    const cx = W / 2, cy = Hb / 2;
    const pCircle = polyCss(S.circle, cx, cy, D / 2);
    const pSwatch = polyCss(S.swatch, cx, cy, D / 2);
    const pDart = polyCss(S.dart, cx, cy, (D / 2) * 1.22);
    const cPill = 'inset(' + (Hb - H) / 2 + 'px 0px round ' + radius + 'px)';
    const cDisc = 'inset(' + (Hb - D) / 2 + 'px ' + (W - D) / 2 + 'px round ' + D / 2 + 'px)';
    const finalShape = useDart ? pDart : useSwatch ? pSwatch : pCircle;
    const tSwatch = Math.max(lift + 30, delay + dur * 0.24);
    const tDart = Math.max(tSwatch + 40, delay + dur * 0.52);
    function fly() {
      cta.dataset.tlState = 'lifted';
      const opts = { duration: T, easing: 'linear', fill: 'both' };
      const mk = (el, frames) => {
        try {
          const an = el.animate(frames, opts);
          master.push(an);
          anims.push(an);
          return an;
        } catch (err) { return null; }
      };
      /* token position / orientation / scale */
      const tf = [{ offset: 0, transform: HOME }, { offset: ms(delay), transform: HOME }];
      for (let i = 1; i <= NS; i++) {
        tf.push({ offset: ms(delay + samples[i].u * dur), transform: poseAt(samples[i]).css });
      }
      tokenAnim = mk(token, mono(tf));
      /* thread unspools in lockstep (same samples) */
      const thf = [
        { offset: 0, strokeDashoffset: L + 'px' },
        { offset: ms(delay), strokeDashoffset: L + 'px' },
      ];
      for (let i = 1; i <= NS; i++) {
        thf.push({ offset: ms(delay + samples[i].u * dur), strokeDashoffset: (L - samples[i].s).toFixed(2) + 'px' });
      }
      mk(path, mono(thf));
      /* disc: appear + shape morph (inset pill -> inset disc -> polygons) */
      mk(disc, mono([
        { offset: 0, opacity: 0 },
        { offset: ms(90), opacity: 1 },
        { offset: 1, opacity: 1 },
      ]));
      const clipF = [
        { offset: 0, clipPath: cPill, easing: EASE_MORPH },
        { offset: ms(lift), clipPath: cDisc, easing: 'linear' },
        { offset: ms(lift), clipPath: pCircle, easing: EASE_OUT },
      ];
      if (useSwatch) clipF.push({ offset: ms(tSwatch), clipPath: pSwatch, easing: EASE_DART });
      if (useDart) clipF.push({ offset: ms(tDart), clipPath: pDart, easing: 'linear' });
      clipF.push({ offset: 1, clipPath: finalShape });
      mk(disc, mono(clipF));
      /* disc colour: CTA ink -> brass while it becomes a dart */
      if (useDart) {
        mk(disc, mono([
          { offset: 0, backgroundColor: bg },
          { offset: ms(delay + dur * 0.20), backgroundColor: bg },
          { offset: ms(delay + dur * 0.48), backgroundColor: THREAD },
          { offset: 1, backgroundColor: THREAD },
        ]));
      }
      /* garment photo: in during the lift, out as the swatch folds */
      mk(img, mono([
        { offset: 0, opacity: 0 },
        { offset: ms(100), opacity: 0 },
        { offset: ms(lift + 10), opacity: 1 },
        { offset: ms(delay + dur * 0.26), opacity: 1 },
        { offset: ms(delay + dur * 0.46), opacity: useDart ? 0 : 1 },
        { offset: 1, opacity: useDart ? 0 : 1 },
      ]));
      /* paper-fold crease fades in as the dart forms */
      if (useDart) {
        mk(fold, mono([
          { offset: 0, opacity: 0 },
          { offset: ms(delay + dur * 0.34), opacity: 0 },
          { offset: ms(delay + dur * 0.56), opacity: 1 },
          { offset: 1, opacity: 1 },
        ]));
      }
      /* hang tag: rides the path unrotated, own pendulum on top */
      if (tagWrap) {
        const tw = [
          { offset: 0, transform: 'translate3d(0px, 0px, 0) scale(1)' },
          { offset: ms(delay), transform: 'translate3d(0px, 0px, 0) scale(1)' },
        ];
        for (let i = 1; i <= NS; i++) {
          const s = samples[i];
          tw.push({
            offset: ms(delay + s.u * dur),
            transform: 'translate3d(' + (s.x - Sx).toFixed(2) + 'px, ' + (s.y - Sy).toFixed(2) + 'px, 0) scale(' + (1 - 0.64 * Math.pow(s.p, 0.8)).toFixed(3) + ')',
          });
        }
        mk(tagWrap, mono(tw));
        mk(tagWrap, mono([
          { offset: 0, opacity: 0 },
          { offset: ms(delay), opacity: 0 },
          { offset: ms(delay + 90), opacity: 1 },
          { offset: 1, opacity: 1 },
        ]));
        anims.push(tag.animate(
          [
            { transform: 'rotate(' + -24 * dir + 'deg)', easing: 'ease-out' },
            { transform: 'rotate(' + 14 * dir + 'deg)', offset: 0.45, easing: 'ease-in-out' },
            { transform: 'rotate(' + -5 * dir + 'deg)', offset: 0.75, easing: 'ease-out' },
            { transform: 'rotate(0deg)' },
          ],
          { duration: dur + 200, delay, fill: 'both' }
        ));
      }
      /* magnetic lean: the bag leans toward the incoming dart in the last 40% */
      try {
        leanAnim = target.animate(
          [
            { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
            { transform: 'translate(' + (-hx * 3).toFixed(2) + 'px, ' + (-hy * 3).toFixed(2) + 'px) rotate(0deg) scale(1.04)' },
          ],
          { duration: Math.round(dur * 0.4), delay: Math.round(delay + dur * 0.6), easing: 'ease-in', fill: 'forwards' }
        );
        anims.push(leanAnim);
      } catch (_) {}
      return tokenAnim ? tokenAnim.finished : Promise.reject(new Error('no-animation'));
    }
    function hold() {
      if (holdRing) return;
      holdRing = makeRing(target, 12);
      const spin = holdRing.animate(
        [
          { transform: 'rotate(0deg)', opacity: 0.9 },
          { transform: 'rotate(360deg)', opacity: 0.9 },
        ],
        { duration: 1100, iterations: Infinity, easing: 'linear' }
      );
      anims.push(spin);
    }
    function stopHold() {
      if (!holdRing) return;
      holdRing.remove();
      liveNodes.delete(holdRing);
      holdRing = null;
    }
    async function land(cartResult) {
      stopHold();
      const pierce =
        'translate3d(' + (Ex - Sx + hx * 10).toFixed(2) + 'px, ' + (Ey - Sy + hy * 10).toFixed(2) + 'px, 0) ' +
        'rotate(' + endPose.rot.toFixed(2) + 'deg) scale(0.1, 0.03)';
      // The dart goes IN along its own heading, thinning to a point.
      const absorb = token.animate(
        [
          { transform: endPose.css, opacity: 1, easing: EASE_IN },
          { transform: pierce, opacity: 0 },
        ],
        { duration: coarse ? 120 : 150, fill: 'forwards' }
      );
      anims.push(absorb);
      if (tagWrap) {
        anims.push(tagWrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }));
      }
      // Thread is pulled into the bag, tail first.
      const retract = path.animate(
        [{ strokeDashoffset: '0px' }, { strokeDashoffset: -L + 'px' }],
        { duration: 280, easing: EASE_OUT, fill: 'forwards' }
      );
      anims.push(retract);
      bagCatch(target, hx, hy, leanAnim);
      stitchRing(target);
      knot(target);
      const badgeEl = target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]');
      setTimeout(() => rollBadge(badgeEl, adapters.getItemCount(cartResult)), 60);
      await Promise.all([absorb.finished, retract.finished]);
    }
    async function rollback() {
      stopHold();
      if (!tokenAnim) return;
      try {
        master.forEach((an) => {
          if (an.updatePlaybackRate) an.updatePlaybackRate(1.35);
          an.reverse();
        });
        if (leanAnim) leanAnim.reverse();
        await tokenAnim.finished;
      } catch (_) {}
      // Refusal: a damped shake, quieter than the original
      const shake = cta.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-6px)', offset: 0.18 },
          { transform: 'translateX(5px)', offset: 0.40 },
          { transform: 'translateX(-3px)', offset: 0.62 },
          { transform: 'translateX(1.5px)', offset: 0.82 },
          { transform: 'translateX(0)' },
        ],
        { duration: 340, easing: 'ease-out' }
      );
      try { await shake.finished; } catch (_) {}
    }
    function dispose() {
      stopHold();
      anims.forEach((x) => { try { x.cancel(); } catch (_) {} });
      nodes.forEach((n) => { n.remove(); liveNodes.delete(n); });
    }
    return { fly, hold, land, rollback, dispose };
  }
  /* ---------------------------------------------------------------------------
     Landing micro-interactions
     --------------------------------------------------------------------------- */
  // The bag is HIT by the dart (displaced along the heading), then springs home.
  function bagCatch(el, hx, hy, lean) {
    if (!el || reduceMotion()) { if (lean) try { lean.cancel(); } catch (_) {} return; }
    const s = sp('catch');
    const total = Math.round(s.duration / 0.86);
    const rest = 'translate(0px, 0px) rotate(0deg) scale(1)';
    const from = lean
      ? 'translate(' + (-hx * 3).toFixed(2) + 'px, ' + (-hy * 3).toFixed(2) + 'px) rotate(0deg) scale(1.04)'
      : rest;
    const hit =
      'translate(' + (hx * 4).toFixed(2) + 'px, ' + (hy * 4).toFixed(2) + 'px) rotate(' + (hx * 5).toFixed(2) + 'deg) scale(1.12)';
    el.animate(
      [
        { transform: from, easing: 'ease-out' },
        { transform: hit, offset: 0.14, easing: s.easing },
        { transform: rest },
      ],
      { duration: total }
    );
    if (lean) { try { lean.cancel(); } catch (_) {} }
  }
  function makeRing(el, pad) {
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) + pad;
    const ring = document.createElement('div');
    ring.className = 'tl-ring';
    Object.assign(ring.style, {
      width: size + 'px',
      height: size + 'px',
      left: (r.left + r.width / 2 - size / 2) + 'px',
      top: (r.top + r.height / 2 - size / 2) + 'px',
    });
    document.body.appendChild(ring);
    liveNodes.add(ring);
    return ring;
  }
  function stitchRing(el) {
    if (!el) return;
    const ring = makeRing(el, 16);
    const a = ring.animate(
      [
        { transform: 'rotate(0deg) scale(0.82)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'rotate(70deg) scale(1.35)', opacity: 0 },
      ],
      { duration: 520, easing: EASE_OUT }
    );
    onDone(a, () => { ring.remove(); liveNodes.delete(ring); });
  }
  // The knot a tailor ties when the thread is pulled home.
  function knot(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const k = document.createElement('div');
    k.className = 'tl-knot';
    k.style.left = (r.left + r.width / 2) + 'px';
    k.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(k);
    liveNodes.add(k);
    const s = sp('knot');
    k.animate(
      [{ transform: 'translate(-50%, -50%) scale(0)' }, { transform: 'translate(-50%, -50%) scale(1)' }],
      { duration: s.duration, easing: s.easing, fill: 'forwards' }
    );
    const fade = k.animate(
      [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }],
      { duration: 520, easing: 'linear', fill: 'forwards' }
    );
    onDone(fade, () => { k.remove(); liveNodes.delete(k); });
  }
  // Odometer: [prev] / [next] / [next]. The duplicate row means a spring
  // overshoot reveals the same digits, never a blank sliver.
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
    const roll = document.createElement('span');
    roll.className = 'tl-badge__roll';
    [('[' + prev + ']'), formattedNext, formattedNext].forEach((txt) => {
      const row = document.createElement('span');
      row.textContent = txt;
      roll.appendChild(row);
    });
    badge.appendChild(roll);
    const s = sp('roll');
    const a = roll.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-33.3333%)' }],
      { duration: s.duration, easing: s.easing, fill: 'forwards' }
    );
    onDone(a, () => {
      badge.textContent = formattedNext;
      badge.classList.remove('tl-badge');
    });
  }
  function calmConfirm(cta, target, cartResult, meta) {
    cta.dataset.tlState = 'done';
    if (target) {
      bagCatch(target, 0, 1, null);
      const badgeEl = target.querySelector('[data-tl-badge]') || target.querySelector('[data-cart-count]');
      rollBadge(badgeEl, adapters.getItemCount(cartResult));
    }
    announce(cartResult);
    adapters.refreshCart(cartResult);
    showPeek(cartResult, target, meta);
    setTimeout(() => { cta.dataset.tlState = 'idle'; }, config.holdLabelMs);
  }
  function failLabel(cta) {
    cta.dataset.tlState = 'error';
    const live = document.querySelector('[data-tl-live]');
    if (live) live.textContent = "Couldn't add to bag. Try again.";
    setTimeout(() => { cta.dataset.tlState = 'idle'; }, 2600);
  }
  function announce(cartResult) {
    const n = adapters.getItemCount(cartResult);
    const live = document.querySelector('[data-tl-live]');
    if (live) live.textContent = 'Added to bag. ' + n + ' ' + (n === 1 ? 'item' : 'items') + ' in bag.';
  }
  /* ---------------------------------------------------------------------------
     Tailored receipt card (peek)
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
    const el = document.createElement('div');
    el.className = 'tl-peek';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Added to bag confirmation');
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tl-peek__close';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); dismissPeek(); });
    el.appendChild(closeBtn);
    const handle = document.createElement('div');
    handle.className = 'tl-peek__handle';
    el.appendChild(handle);
    const row = document.createElement('div');
    row.className = 'tl-peek__row';
    const imgEl = document.createElement('div');
    imgEl.className = 'tl-peek__img';
    if (imgUrl) imgEl.style.backgroundImage = 'url("' + imgUrl.replace(/"/g, '%22') + '")';
    const metaCol = document.createElement('div');
    metaCol.className = 'tl-peek__meta';
    const nameEl = document.createElement('h4');
    nameEl.className = 'tl-peek__name';
    nameEl.textContent = title;
    metaCol.appendChild(nameEl);
    let varEl = null;
    if (variantTitle) {
      varEl = document.createElement('p');
      varEl.className = 'tl-peek__variant';
      varEl.textContent = 'Size ' + variantTitle;
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
    const timerEl = document.createElement('div');
    timerEl.className = 'tl-peek__timer';
    el.appendChild(timerEl);
    /* positioning */
    if (coarse) {
      const dock = adapters.getDock();
      const dockH = dock && inViewport(dock) ? dock.getBoundingClientRect().height : 0;
      el.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + ' + (dockH + 12) + 'px)';
    } else if (anchor && inViewport(anchor)) {
      const r = anchor.getBoundingClientRect();
      el.style.top = (r.bottom + 10) + 'px';
      el.style.right = Math.max(16, window.innerWidth - r.right - 8) + 'px';
    } else {
      el.style.top = '80px';
      el.style.right = '20px';
    }
    document.body.appendChild(el);
    peekEl = el;
    liveNodes.add(el);
    /* the card grows OUT OF the bag: transform-origin at the anchor centre */
    const box = el.getBoundingClientRect();
    if (anchor && inViewport(anchor)) {
      const ar = anchor.getBoundingClientRect();
      const ox = clamp(ar.left + ar.width / 2 - box.left, 0, box.width);
      el.style.transformOrigin = ox + 'px ' + (coarse ? '100%' : '0px');
    } else {
      el.style.transformOrigin = coarse ? '50% 100%' : '100% 0px';
    }
    if (calm) {
      seamEl.style.clipPath = 'none';
      if (HAS_WAAPI) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'linear', fill: 'backwards' });
    } else {
      // fill:'backwards' only: after the entrance the element returns to its natural
      // state, so the swipe gesture can drive inline transform (fill:'both' pinned it).
      const s = sp(coarse ? 'sheet' : 'peek');
      const from = coarse ? 'translateY(28px) scale(0.9)' : 'translateY(-10px) scale(0.92)';
      el.animate(
        [{ transform: from }, { transform: 'translateY(0px) scale(1)' }],
        { duration: s.duration, easing: s.easing, fill: 'backwards' }
      );
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'linear', fill: 'backwards' });
      seamEl.animate(
        [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 520, delay: 160, easing: EASE_OUT, fill: 'forwards' }
      );
      [imgEl, nameEl, varEl, priceEl, viewBagBtn, checkoutBtn].forEach((n, i) => {
        if (!n) return;
        n.animate(
          [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }],
          { duration: 320, delay: 50 + i * 38, easing: EASE_OUT, fill: 'backwards' }
        );
      });
    }
    /* the countdown IS the thread running out (pause on hover/focus/drag) */
    const total = coarse ? 3800 : 3500;
    try {
      peekTimerAnim = timerEl.animate(
        [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
        { duration: total, easing: 'linear', fill: 'forwards' }
      );
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
        // never resume with less than 1.2s left, so the leave feels fair
        peekTimerAnim.currentTime = Math.min(peekTimerAnim.currentTime || 0, total - 1200);
        peekTimerAnim.play();
      } catch (_) {}
    };
    el.addEventListener('pointerenter', pauseTimer);
    el.addEventListener('pointerleave', resumeTimer);
    el.addEventListener('focusin', pauseTimer);
    el.addEventListener('focusout', resumeTimer);
    clearTimeout(peekHardTimer);
    peekHardTimer = setTimeout(() => dismissPeek(), 9000);
    const onDocPointerDown = (e) => {
      if (el && !el.contains(e.target) && !e.target.closest('[data-tl-cta], [data-tl-bag], [data-tl-dock-bag], .product-card__size-pill')) {
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
    if (coarse) enableSwipe(el, pauseTimer, resumeTimer);
  }
  function dismissPeek(instant, via) {
    clearTimeout(peekHardTimer);
    if (peekTimerAnim) { try { peekTimerAnim.cancel(); } catch (_) {} peekTimerAnim = null; }
    peekCleanupFns.forEach((fn) => { try { fn(); } catch (_) {} });
    peekCleanupFns = [];
    const el = peekEl;
    if (!el) return;
    peekEl = null;
    if (instant || reduceMotion() || !HAS_WAAPI) {
      el.remove();
      liveNodes.delete(el);
      return;
    }
    // Exit from wherever the card visually IS (mid-entrance, mid-drag), never from 0.
    const cs = window.getComputedStyle(el);
    const fromT = cs.transform === 'none' ? 'translateY(0px)' : cs.transform;
    const fromO = cs.opacity;
    try { el.getAnimations().forEach((x) => x.cancel()); } catch (_) {}
    const coarse = isCoarse();
    const swipe = via === 'swipe';
    const toT = swipe ? 'translateY(130%)' : coarse ? 'translateY(24px) scale(0.92)' : 'translateY(-8px) scale(0.96)';
    const a = el.animate(
      [{ transform: fromT, opacity: fromO }, { transform: toT, opacity: 0 }],
      { duration: swipe ? 240 : coarse ? 200 : 160, easing: EASE_IN, fill: 'forwards' }
    );
    onDone(a, () => { el.remove(); liveNodes.delete(el); });
  }
  /* ---------------------------------------------------------------------------
     Mobile swipe: down = dismiss, up = open bag, otherwise spring home
     --------------------------------------------------------------------------- */
  function enableSwipe(el, pauseTimer, resumeTimer) {
    let startY = 0, currentY = 0, startTime = 0, dragging = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      dragging = true;
      startY = e.clientY;
      currentY = startY;
      startTime = Date.now();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      pauseTimer();
    }, { passive: true });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      currentY = e.clientY;
      const dy = currentY - startY;
      el.style.transform = 'translateY(' + (dy > 0 ? dy : dy * 0.18) + 'px)'; // rubber-band upward
    }, { passive: true });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      const dy = currentY - startY;
      const dt = Math.max(1, Date.now() - startTime);
      const vy = dy / dt;
      if (dy > 60 || vy > 0.5) {
        dismissPeek(false, 'swipe');
      } else if (dy < -30) {
        dismissPeek(true);
        adapters.openCart();
      } else {
        const from = el.style.transform || 'translateY(0px)';
        el.style.transform = '';
        const s = sp('release');
        el.animate([{ transform: from }, { transform: 'translateY(0px)' }], { duration: s.duration, easing: s.easing });
        resumeTimer();
      }
    };
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  }
  /* ---------------------------------------------------------------------------
     Lifecycle hygiene
     --------------------------------------------------------------------------- */
  const killAll = () => {
    dismissPeek(true);
    liveNodes.forEach((n) => { try { n.remove(); } catch (_) {} });
    liveNodes.clear();
  };
  window.addEventListener('pagehide', killAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) killAll(); });
  /* ---------------------------------------------------------------------------
     Public API
     --------------------------------------------------------------------------- */
  window.Threadline = {
    version: '2.0.0',
    add: addWithThreadline,
    config: config,
    adapters: adapters,
    showPeek: showPeek,
    dismissPeek: dismissPeek,
    killAll: killAll,
    // exposed for tuning in DevTools: Threadline.spring(380, 30).duration
    spring: spring,
    shapes: unitShapes,
  };
  const initLive = () => {
    if (document.querySelector('[data-tl-live]')) return;
    const live = document.createElement('div');
    live.className = 'tl-sr';
    live.setAttribute('data-tl-live', '');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLive);
  else initLive();
})();
