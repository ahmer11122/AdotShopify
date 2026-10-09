/** Hanger Rail — quick look nav */
(function () {
  'use strict';
  if (window.__adotHangerQlNav) return;
  window.__adotHangerQlNav = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      flip(from, dir, toBag) {
        var g = this.qGarment;
        var to = g.getBoundingClientRect();
        if (!to.width || !from.width) return Promise.resolve();
        var s = from.height / to.height;
        var dx = from.left + from.width / 2 - (to.left + to.width / 2);
        var dy = from.top - to.top;
        var frames = [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }, { transform: 'none' }];
        if (dir === 'out') frames.reverse();
        if (toBag && dir === 'out') {
          // Shrink into the bag icon (or top-right corner) and fade out.
          var bag = document.querySelector('[data-cart-trigger]');
          var header = document.querySelector('.header');
          var hidden = header && header.classList.contains('header--hidden');
          var br = bag && !hidden ? bag.getBoundingClientRect() : null;
          var tx = br ? br.left + br.width / 2 : window.innerWidth - 28;
          var ty = br ? br.top + br.height / 2 : 28;
          var gx = to.left + to.width / 2;
          var gy = to.top + to.height / 2;
          frames = [
            { transform: 'none', opacity: 1 },
            {
              transform: 'translate(' + (tx - gx) + 'px,' + (ty - gy) + 'px) scale(0.08)',
              opacity: 0
            }
          ];
          var animBag = g.animate(frames, {
            duration: 680,
            easing: 'cubic-bezier(0.55, 0, 0.7, 0.3)',
            fill: 'both'
          });
          return animBag.finished.then(
            function () {},
            function () {}
          );
        }
        var anim = g.animate(frames, {
          duration: dir === 'in' ? 780 : 540,
          easing: dir === 'in' ? 'cubic-bezier(0.2, 0.85, 0.2, 1)' : 'cubic-bezier(0.55, 0, 0.7, 0.3)',
          fill: 'both'
        });
        return anim.finished.then(
          function () {},
          function () {}
        );
      },

      openQL(i) {
        if (!this.ql || this.qOpen) return;
        this.qOpen = true;
        this.qlOpener = this.items[i].link;
        this.userAct();
        this.quietHint();
        this.cancelQLAnims();
        this.fillQL(i);
        var it = this.items[i];
        var from = (it.front || it.turn).getBoundingClientRect();
        document.documentElement.classList.add('hrail-lock');
        this.ql.showModal();
        this.ql.setAttribute('tabindex', '-1');
        this.ql.focus({ preventScroll: true });
        it.el.classList.add('is-lifted');
        if (this.mode === 'rail') this.setTarget(i);
        if (this.liveEl) this.liveEl.textContent = (it.data.title || '') + ', ' + (i + 1) + ' of ' + this.n;

        if (!this.reduce.matches) {
          this.qWall.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out', fill: 'backwards' });
          this.qThread.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, easing: EASE, fill: 'backwards' });
          this.flip(from, 'in');
          this.revealInfo();
        }
      },

      // The thumbnails and size buttons are rebuilt for every piece. Keep focus inside the dialog.
      keepFocus(d) {
        if (!this.ql.contains(document.activeElement) || document.activeElement === document.body) {
          (d > 0 ? this.qNext : this.qPrev).focus({ preventScroll: true });
        }
      },

      // Next / previous piece. The old piece swings away on its hanger, the new one swings in.
      goQL(d) {
        if (!this.qOpen || this.qBusy) return;
        var self = this;
        var next = (this.qIndex + d + this.n) % this.n;
        this.items[this.qIndex].el.classList.remove('is-lifted');
        this.items[next].el.classList.add('is-lifted');
        if (this.mode === 'rail') this.setTarget(next);
        else this.scrollToIndex(next);
        this.setRoving(next);
        if (this.liveEl) this.liveEl.textContent = (this.items[next].data.title || '') + ', ' + (next + 1) + ' of ' + this.n;

        if (this.reduce.matches) {
          this.fillQL(next);
          this.keepFocus(d);
          return;
        }
        this.qBusy = true;
        var g = this.qGarment;
        var P = 'perspective(1400px) ';
        var out = g.animate(
          [
            { transform: P + 'translateX(0) rotateY(0deg)', opacity: 1 },
            { transform: P + 'translateX(' + -d * 90 + 'px) rotateY(' + d * 68 + 'deg)', opacity: 0 }
          ],
          { duration: 260, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)', fill: 'forwards' }
        );
        var swap = function () {
          self.fillQL(next);
          self.keepFocus(d);
          out.cancel();
          self.qAnim = g.animate(
            [
              { transform: P + 'translateX(' + d * 90 + 'px) rotateY(' + -d * 68 + 'deg)', opacity: 0 },
              { transform: 'none', opacity: 1 }
            ],
            { duration: 620, easing: EASE }
          );
          self.fadeIn(self.ql.querySelectorAll('[data-sw]'));
          setTimeout(function () {
            self.qBusy = false;
          }, 320);
        };
        out.finished.then(swap, swap);
      }


  });
})();
