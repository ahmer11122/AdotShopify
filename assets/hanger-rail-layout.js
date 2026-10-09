/** Hanger Rail — layout + mode */
(function () {
  'use strict';
  if (window.__adotHangerLayout) return;
  window.__adotHangerLayout = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      chooseMode() {
        var want = this.fine.matches ? 'rail' : 'scroll';
        if (want !== this.mode) {
          this.mode = want;
          this.section.setAttribute('data-mode', want);
          this.items.forEach(function (it) {
            it.a = 0;
            it.v = 0;
            it.ptx = null;
            it.el.style.transform = '';
            if (it.slide) {
              it.slide.style.transform = '';
              it.slide.style.opacity = '';
              it.op = -1;
            }
          });
          if (want === 'scroll') {
            this.target = -1;
            if (this.spot) {
              this.spot.style.transform = '';
              this.spot.style.opacity = '';
            }
            this.spotO = 0;
          }
        }
        this.measure();
        if (this.mode === 'rail' && this.P < MIN_PITCH) {
          this.mode = 'scroll';
          this.section.setAttribute('data-mode', 'scroll');
          this.target = -1;
          this.measure();
        }
        this.setHint();
      },

      measure() {
        var it0 = this.items[0];
        var Wc = it0.link.offsetWidth;
        this.F = Wc * FILL;
        var W = this.stage.clientWidth;
        if (this.mode === 'rail') {
          var maxTrack = (this.n - 1) * MAX_PITCH + this.F;
          var track = Math.min(W - 24, maxTrack);
          this.P = this.n > 1 ? (track - this.F) / (this.n - 1) : this.F;
          this.trackW = track;
          this.trackLeft = (W - track) / 2;
          this.M = (this.F - this.P) / 2;
          this.section.style.setProperty('--hr-pitch', this.P.toFixed(2) + 'px');
          this.section.style.setProperty('--hr-track-w', track.toFixed(2) + 'px');
        } else {
          this.section.style.removeProperty('--hr-pitch');
          this.section.style.removeProperty('--hr-track-w');
          this.P = it0.el.getBoundingClientRect().width || 60;
          this.padStart = parseFloat(getComputedStyle(this.scroller).paddingLeft) || 0;
        }
        this.half = this.mode === 'scroll' ? 0 : (this.F - this.P) / 2;
        this.H = it0.link.offsetHeight;
      },

      setHint() {
        if (!this.hintEl) return;
        var t = this.mode === 'rail' ? this.hintHover : this.hintTouch;
        if (t) this.hintEl.textContent = t;
      },

      scrollToIndex(i) {
        if (this.mode !== 'scroll') return;
        this.scroller.scrollTo({ left: i * this.P, behavior: this.reduce.matches ? 'auto' : 'smooth' });
      },

      // ---------- targeting (rail mode) ----------
      setTarget(i) {
        if (i === this.target) return;
        this.target = i;
        this.request();
      },

      centerOf(i) {
        return this.trackLeft + this.items[i].tx + this.P / 2;
      },

      hitTest(x) {
        var cur = this.target;
        // Stay on the open piece while the pointer is still over it. Stops flicker.
        if (cur >= 0 && Math.abs(x - this.centerOf(cur)) <= this.F * 0.52) return cur;
        var best = 0;
        var bd = 1e9;
        for (var i = 0; i < this.n; i++) {
          var d = Math.abs(x - this.centerOf(i));
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        return best;
      },

      // Decode every rail image once, one by one, while the page is calm.
      warm() {
        if (this.warmed) return;
        this.warmed = true;
        var imgs = [];
        this.items.forEach(function (it) {
          if (it.front) imgs.push(it.front);
          if (it.side) imgs.push(it.side);
        });
        var k = 0;
        var next = function () {
          var img = imgs[k++];
          if (!img) return;
          var done = new Promise(function (res) {
            setTimeout(res, 900);
          });
          var dec = img.decode ? img.decode() : Promise.resolve();
          Promise.race([dec, done]).then(
            function () {
              setTimeout(next, 70);
            },
            function () {
              setTimeout(next, 70);
            }
          );
        };
        setTimeout(next, 600);
      },

      // ---------- intro + attract ----------
      playIntro() {
        if (this.introDone) return;
        this.introDone = true;
        this.section.classList.add('is-in');
      },

      startAttract() {
        var self = this;
        if (!this.attractOn || this.userActed || this.reduce.matches || this.mode !== 'rail') return;
        if (this.attractT || this.attractRunning) return;
        var idx = Math.floor(this.n / 3);
        var step = function () {
          self.attractT = 0;
          if (self.userActed || self.mode !== 'rail' || self.attractCount >= 7) return;
          if (!self.visible) return;
          self.attractRunning = true;
          self.attractCount++;
          self.setTarget(idx % self.n);
          idx += 2;
          self.attractT = setTimeout(function () {
            if (self.userActed) return;
            self.setTarget(-1);
            self.attractT = setTimeout(step, 650);
          }, 1900);
        };
        this.attractT = setTimeout(step, 1900);
      },

      // ---------- animation loop ----------
      request() {
        if (this.raf) return;
        var self = this;
        this.last = 0;
        this.raf = requestAnimationFrame(function (t) {
          self.tick(t);
        });
      }


  });
})();
