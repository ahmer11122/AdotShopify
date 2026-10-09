/** THREADLINE 3.1 — flyer build + fold schedule */
(function () {
  'use strict';
  var TL = window.__ADOT_TL;
  if (!TL || !TL.__adapters) throw new Error('[Threadline] adapters must load first');
  if (TL.__flyer) return;
  TL.__flyer = true;
  var SVG_NS = TL.SVG_NS;
  var config = TL.config;
  var EASE = TL.EASE;
  var el = TL.el;
  var bt = TL.bt;
  var onDone = TL.onDone;
  var done = TL.done;
  var sp = TL.sp;
  var HAS_WAAPI = TL.HAS_WAAPI;
  var adapters = TL.adapters;
  var haptics = TL.haptics;
  var isLite = TL.isLite;

  function buildFlyer(T, imageSrc, variantLabel) {
    const root = el('div', 'tl-flyer');
    root.setAttribute('aria-hidden', 'true');
    root.style.setProperty('--tl-w', T.w + 'px');
    root.style.setProperty('--tl-h', T.h + 'px');

    const logoUrl = config.logoUrl || adapters.getLogoUrl();
    if (logoUrl) {
      root.style.setProperty('--tl-logo-url', 'url("' + String(logoUrl).replace(/\\/g, '%5C').replace(/"/g, '%22') + '")');
    }

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
            '<div class="tl-face tl-face--back tl-label">' +
              (logoUrl ? '<span class="tl-brand-logo" role="img" aria-label="' + config.brandMark + '"></span>' : '<span class="tl-brand-mark"></span>') +
              '<span class="tl-tag-size"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    // textContent, never innerHTML, for anything that came from the page
    const brandEl = root.querySelector('.tl-brand-mark');
    if (brandEl) brandEl.textContent = config.brandMark;
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

  TL.buildFlyer = buildFlyer;
  TL.scheduleFolds = scheduleFolds;
})();
