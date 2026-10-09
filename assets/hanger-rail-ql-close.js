/** Hanger Rail — quick look close */
(function () {
  'use strict';
  if (window.__adotHangerQlClose) return;
  window.__adotHangerQlClose = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      closeQL(opts) {
        opts = opts || {};
        if (!this.qOpen || this.qClosing) return;
        var self = this;
        var toBag = !!opts.toBag;
        this.qClosing = true;
        var it = this.items[this.qIndex];
        var done = function () {
          self.cancelQLAnims();
          self.ql.close();
          document.documentElement.classList.remove('hrail-lock');
          it.el.classList.remove('is-lifted');
          self.qOpen = false;
          self.qClosing = false;
          self.qBusy = false;
          if (toBag) {
            var piece = self.items[self.qIndex].link;
            var drawer = document.querySelector('cart-drawer');
            if (drawer && piece) drawer.opener = piece;
            window.dispatchEvent(new CustomEvent('cart:open'));
          } else {
            var op = self.items[self.qIndex].link;
            if (op) op.focus({ preventScroll: true });
          }
          if (self.mode === 'rail' && !self.ptr && !self.focusInside()) self.setTarget(-1);
          self.request();
        };
        if (this.reduce.matches) {
          done();
          return;
        }
        // if we were looking at a product photo, show the hanging piece again so it can fly home
        this.qGarment.classList.remove('is-photo');
        this.ql.classList.remove('is-photo-view');
        var to = (it.front || it.turn).getBoundingClientRect();
        var onScreen = to.bottom > 0 && to.top < window.innerHeight && to.right > 0 && to.left < window.innerWidth;
        this.qWall.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, delay: 120, easing: 'ease-in', fill: 'forwards' });
        this.qThread.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
        this.qFades.forEach(function (el) {
          el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
        });
        var p;
        if (toBag) p = this.flip(to, 'out', true);
        else if (onScreen) p = this.flip(to, 'out');
        else
          p = this.qGarment
            .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })
            .finished.then(
              function () {},
              function () {}
            );
        // safety: always close, even if an animation never reports back
        var finished = false;
        var finish = function () {
          if (finished) return;
          finished = true;
          done();
        };
        p.then(function () {
          setTimeout(finish, 40);
        });
        setTimeout(finish, toBag ? 1400 : 1200);
      },

      // ---------- spin (front / back) ----------
      setSpinDom(a) {
        var s = this.spin;
        this.qSpin.style.transform = 'rotateY(' + a.toFixed(2) + 'deg)';
        var sn = Math.abs(Math.sin((a * Math.PI) / 180));
        var so = s.hasSide ? smooth(0.8, 0.99, sn) : 0;
        this.qSide.style.opacity = so.toFixed(3);
        var fo = s.hasSide ? 1 - smooth(0.93, 0.995, sn) : 1;
        this.qFront.style.opacity = fo.toFixed(3);
        this.qBack.style.opacity = fo.toFixed(3);
        // keep the Front / Back thumbnail in step with the face that is showing
        var face = Math.cos((s.t * Math.PI) / 180) < 0 ? 'back' : 'front';
        var cur = this.qViews && this.qViews[this.qViewIdx];
        if (cur && cur.kind === 'face' && cur.face !== face) {
          for (var k = 0; k < this.qViews.length; k++) {
            if (this.qViews[k].kind === 'face' && this.qViews[k].face === face) {
              this.qViewIdx = k;
              this.markThumb(k);
              break;
            }
          }
        }
      },

      runSpin() {
        var self = this;
        var s = this.spin;
        if (this.reduce.matches) {
          s.a = s.t;
          s.v = 0;
          this.setSpinDom(s.a);
          return;
        }
        if (s.raf) return;
        s.last = 0;
        var step = function (now) {
          s.raf = 0;
          if (s.drag) return;
          var dt = s.last ? Math.min(0.034, (now - s.last) / 1000) : 0.016;
          s.last = now;
          s.v += ((s.t - s.a) * 130 - s.v * 17) * dt;
          s.a += s.v * dt;
          if (Math.abs(s.t - s.a) < 0.05 && Math.abs(s.v) < 0.5) {
            s.a = s.t;
            s.v = 0;
            // keep numbers small: 360 degrees is the same view
            var wrap = Math.round((s.t - 90) / 360) * 360;
            s.a -= wrap;
            s.t -= wrap;
            self.setSpinDom(s.a);
            return;
          }
          self.setSpinDom(s.a);
          s.raf = requestAnimationFrame(step);
        };
        s.raf = requestAnimationFrame(step);
      }

  });
  if (!customElements.get('hanger-rail')) customElements.define('hanger-rail', HangerRail);

})();
