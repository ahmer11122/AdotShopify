/** Hanger Rail — shared helpers */
(function () {
  'use strict';
  var HR = (window.__ADOT_HR = window.__ADOT_HR || {});
  if (HR.__helpers) return;
  HR.__helpers = true;

    // ----- Tuning knobs (safe to change) -----
    var FILL = 0.78; // visible garment width / image canvas width
    var MAX_PITCH = 132; // px: widest gap between hangers on desktop
    var MIN_PITCH = 54; // px: below this, switch to swipe mode
    var REST_TURN = 84; // deg: how far a hanger is turned at rest
    var SPRING_K = 170; // turn spring: stiffness
    var SPRING_C = 20; // turn spring: damping
    var SWAY_K = 60; // sway spring: stiffness
    var SWAY_C = 7; // sway spring: damping (low = more wobble)
    var EASE = 'cubic-bezier(0.2, 0.85, 0.2, 1)';

    function clamp(v, a, b) {
      return Math.min(b, Math.max(a, v));
    }
    function lerp(a, b, t) {
      return a + (b - a) * t;
    }
    function smooth(e0, e1, x) {
      var t = clamp((x - e0) / (e1 - e0), 0, 1);
      return t * t * (3 - 2 * t);
    }
    function pad2(n) {
      return n < 10 ? '0' + n : String(n);
    }

  Object.assign(HR, { FILL:FILL, MAX_PITCH:MAX_PITCH, MIN_PITCH:MIN_PITCH, REST_TURN:REST_TURN,
    SPRING_K:SPRING_K, SPRING_C:SPRING_C, SWAY_K:SWAY_K, SWAY_C:SWAY_C, EASE:EASE,
    clamp:clamp, lerp:lerp, smooth:smooth, pad2:pad2 });
})();
