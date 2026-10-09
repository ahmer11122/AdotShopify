/** THREADLINE 3.1 — flight path + bag catch effects */
(function () {
  'use strict';
  var TL = window.__ADOT_TL;
  if (!TL || !TL.__core) throw new Error('[Threadline] core must load first');
  if (TL.__path) return;
  TL.__path = true;
  var SVG_NS = TL.SVG_NS;
  var DEG = TL.DEG;
  var EASE = TL.EASE;
  var FLIGHT_EASE = TL.FLIGHT_EASE;
  var el = TL.el;
  var bt = TL.bt;
  var onDone = TL.onDone;
  var done = TL.done;
  var sp = TL.sp;
  var HAS_WAAPI = TL.HAS_WAAPI;
  var clamp = TL.clamp;
  var haptics = TL.haptics;
  var config = TL.config;

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

  TL.controlPoint = controlPoint;
  TL.playFlight = playFlight;
  TL.bagCatch = bagCatch;
  TL.makeRing = makeRing;
  TL.stitchRing = stitchRing;
  TL.knot = knot;
  TL.rollBadge = rollBadge;
  TL.highlightLine = highlightLine;
  TL.highlightWhenReady = highlightWhenReady;
})();
