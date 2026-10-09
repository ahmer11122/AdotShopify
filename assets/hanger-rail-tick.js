/** Hanger Rail — animation tick */
(function () {
  'use strict';
  if (window.__adotHangerTick) return;
  window.__adotHangerTick = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      tick(now) {
        this.raf = 0;
        var self = this;
        var dt = this.last ? Math.min(0.034, (now - this.last) / 1000) : 0.016;
        if (dt < 0.001) dt = 0.001;
        this.last = now;
        var reduce = this.reduce.matches;
        var animating = false;
        var n = this.n;
        var items = this.items;
        var i, it;

        // 1) how far each piece is turned toward you
        if (this.mode === 'rail') {
          for (i = 0; i < n; i++) {
            it = items[i];
            var tg = i === this.target ? 1 : 0;
            if (reduce) {
              it.a = tg;
              it.v = 0;
            } else {
              it.v += ((tg - it.a) * SPRING_K - it.v * SPRING_C) * dt;
              it.a += it.v * dt;
              if (Math.abs(tg - it.a) < 0.0008 && Math.abs(it.v) < 0.01) {
                it.a = tg;
                it.v = 0;
              } else animating = true;
            }
          }
        } else {
          var cx = this.scroller.scrollLeft + this.scroller.clientWidth / 2;
          for (i = 0; i < n; i++) {
            var dx = this.padStart + (i + 0.5) * this.P - cx;
            items[i].a = smooth(0, 1, 1 - Math.abs(dx) / this.P);
          }
          if (this.scrolling) animating = true;
        }

        // 2) layout: the open piece grows, neighbours step aside
        var total = 0;
        for (i = 0; i < n; i++) total += clamp(items[i].a, 0, 1.08);
        var before = 0;
        var best = -1;
        var bestA = 0.5;
        var swayIdle = this.swayOn && this.mode === 'rail';
        var isScroll = this.mode === 'scroll';
        var vxScroll = 0;
        if (isScroll) {
          var sl = this.scroller.scrollLeft;
          vxScroll = this.lastSL === undefined ? 0 : -(sl - this.lastSL) / dt;
          this.lastSL = sl;
        }

        for (i = 0; i < n; i++) {
          it = items[i];
          var ac = clamp(it.a, 0, 1.08);
          var after = total - before - ac;
          var shift = this.half * (before - after);
          before += ac;
          var tx = (this.mode === 'rail' ? this.M + i * this.P : 0) + shift;
          if (it.a > bestA) {
            bestA = it.a;
            best = i;
          }

          // sway: pieces lean away from the way they move, then swing back
          var vx = isScroll ? vxScroll : it.ptx === null ? 0 : (tx - it.ptx) / dt;
          it.ptx = tx;
          it.tx = tx;
          if (reduce) {
            it.ang = 0;
            it.angV = 0;
          } else {
            // hangers trail behind the move, like real ones on a rod
            var lean = clamp(vx * (isScroll ? 0.0035 : 0.0055), isScroll ? -4 : -5, isScroll ? 4 : 5);
            var idle = swayIdle ? Math.sin((now / 1000) * 0.85 + i * 0.9) * 0.55 : 0;
            it.angV += ((lean + idle - it.ang) * SWAY_K - it.angV * SWAY_C) * dt;
            it.ang += it.angV * dt;
            if (swayIdle) animating = true;
            else if (Math.abs(it.angV) > 0.02 || Math.abs(lean - it.ang) > 0.02) animating = true;
          }

          // tilt toward the pointer (only the open piece)
          var tiltYt = 0;
          var tiltXt = 0;
          if (this.mode === 'rail' && this.ptr && i === this.target && !reduce) {
            tiltYt = clamp((this.ptr.x - this.centerOf(i)) / (this.F / 2), -1, 1) * 7;
            tiltXt = clamp((this.ptr.y - this.H / 2) / (this.H / 2), -1, 1) * -3.5;
          }
          var k = Math.min(1, dt * 9);
          it.tiltY += (tiltYt - it.tiltY) * k;
          it.tiltX += (tiltXt - it.tiltX) * k;
          if (Math.abs(tiltYt - it.tiltY) > 0.02 || Math.abs(tiltXt - it.tiltX) > 0.02) animating = true;

          // write to the page
          // rail mode moves the <li>. Swipe mode moves the inner slide, so scroll-snap points never move.
          (this.mode === 'rail' ? it.el : it.slide).style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)';
          if (it.swing) it.swing.style.transform = 'rotate(' + it.ang.toFixed(3) + 'deg)';

          // rail: turn side-on / face-on. Phone carousel: no turn, the centre piece is bigger and clearer.
          var turn = isScroll ? 0 : clamp(1 - it.a, -0.1, 1);
          var theta = isScroll ? 0 : turn * REST_TURN + it.tiltY;
          var s = lerp(isScroll ? 0.84 : 0.92, 1, clamp(it.a, 0, 1));
          if (it.turn) {
            it.turn.style.transform =
              'perspective(1200px) rotateX(' + it.tiltX.toFixed(2) + 'deg) rotateY(' + theta.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
          }

          var fo = 1;
          var so = 0;
          if (it.side && !isScroll) {
            so = smooth(0.5, 0.82, turn);
            fo = 1 - smooth(0.66, 0.92, turn);
          }
          if (isScroll && it.slide) {
            var op = lerp(0.45, 1, clamp(it.a, 0, 1));
            if (Math.abs(op - it.op) > 0.004) {
              it.slide.style.opacity = op.toFixed(3);
              it.op = op;
            }
          }
          if (it.front && Math.abs(fo - it.fo) > 0.002) {
            it.front.style.opacity = fo.toFixed(3);
            it.fo = fo;
          }
          if (it.side && Math.abs(so - it.so) > 0.002) {
            it.side.style.opacity = so.toFixed(3);
            it.so = so;
          }

          var z = it.a > 0.45 ? 5 : 1;
          if (z !== it.z) {
            it.el.style.zIndex = z;
            it.z = z;
          }

          var hw = isScroll ? Math.round(this.P * 0.92) : Math.round(lerp(Math.max(this.P * 0.78, 30), this.F, clamp(it.a, 0, 1)));
          if (it.hit && hw !== it.hw) {
            it.hit.style.setProperty('--hw', hw + 'px');
            it.hw = hw;
          }
        }

        // 3) spotlight follows the open piece
        if (this.mode === 'rail' && this.spot) {
          var sx = this.spotX;
          var so2 = 0;
          if (this.target >= 0) {
            var cxs = this.centerOf(this.target);
            sx = this.spotO < 0.05 ? cxs : this.spotX + (cxs - this.spotX) * Math.min(1, dt * 7);
            so2 = 1;
          }
          this.spotX = sx;
          this.spotO += (so2 - this.spotO) * Math.min(1, dt * 6);
          this.spot.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,0,0)';
          this.spot.style.opacity = this.spotO.toFixed(3);
          if (Math.abs(so2 - this.spotO) > 0.01 || Math.abs((this.target >= 0 ? this.centerOf(this.target) : sx) - sx) > 0.5) animating = true;
        }

        // 4) which piece is the label talking about?
        var act = this.mode === 'rail' ? this.target : best;
        if (act !== this.active) this.onActive(act);

        if (animating && this.visible) this.request();
      },

      onActive(idx) {
        this.active = idx;
        var it = idx >= 0 ? this.items[idx] : null;
        this.items.forEach(function (o, k) {
          o.el.classList.toggle('is-active', k === idx);
        });
        if (this.dotsEl) {
          Array.prototype.forEach.call(this.dotsEl.children, function (dot, k) {
            var on = k === (idx < 0 ? 0 : idx);
            dot.classList.toggle('is-on', on);
            if (on) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
          });
        }
        this.swap(this.nameEl, it ? it.data.title : this.idleTitle);
        this.swap(this.subEl, it ? it.data.sub : '');
        this.swap(this.priceEl, it ? it.data.price : '');
      },

      swap(el, text) {
        if (!el) return;
        text = text || '';
        if (el.textContent === text) return;
        el.textContent = text;
        if (this.reduce.matches || !text) return;
        el.animate(
          [
            { transform: 'translateY(110%)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          { duration: 460, easing: EASE }
        );
      },

      // =====================================================
      // Quick look
      // =====================================================

  });
})();
