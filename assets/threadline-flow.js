/** THREADLINE 3.1 — add-to-bag orchestration */
(function () {
  'use strict';
  var TL = window.__ADOT_TL;
  if (!TL || !TL.__swipe) throw new Error('[Threadline] swipe must load first');
  if (TL.__flow) return;
  TL.__flow = true;
  var config = TL.config;
  var EASE = TL.EASE;
  var HAS_WAAPI = TL.HAS_WAAPI;
  var isCoarse = TL.isCoarse;
  var reduceMotion = TL.reduceMotion;
  var inViewport = TL.inViewport;
  var el = TL.el;
  var done = TL.done;
  var bt = TL.bt;
  var adapters = TL.adapters;
  var scaled = TL.scaled;
  var resolveOrigin = TL.resolveOrigin;
  var buildFlyer = TL.buildFlyer;
  var scheduleFolds = TL.scheduleFolds;
  var playFlight = TL.playFlight;
  var bagCatch = TL.bagCatch;
  var stitchRing = TL.stitchRing;
  var knot = TL.knot;
  var rollBadge = TL.rollBadge;
  var haptics = TL.haptics;
  var showPeek = TL.showPeek;
  var dismissPeek = TL.dismissPeek;
  var sp = TL.sp;
  var onDone = TL.onDone;

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

      showPeek(cartResult, target, {
        thumbUrl,
        variantLabel,
        productTitle,
        priceFormatted: adapters.getPriceFormatted(form, cta, cartResult)
      });
    } catch (err) {
      console.warn('Threadline error:', err);
      failLabel(cta);
      adapters.resync();
    } finally {
      dispose();   // idempotent
    }
  }

  TL.addWithThreadline = addWithThreadline;
  TL.playReject = playReject;
  TL.announce = announce;
  TL.failLabel = failLabel;
  TL.calmConfirm = calmConfirm;
  TL.debugActiveFlights = () => activeFlights;
})();
