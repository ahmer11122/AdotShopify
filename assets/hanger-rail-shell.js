/** Hanger Rail — element shell */
(function () {
  'use strict';
  if (window.__adotHangerShell) return;
  window.__adotHangerShell = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  if (customElements.get('hanger-rail')) return;

  class HangerRail extends HTMLElement {
      connectedCallback() {
        if (this._ready) return;
        var self = this;
        var $ = function (s) {
          return self.querySelector(s);
        };

        this.section = this.closest('.hrail');
        this.stage = $('[data-hr-stage]');
        this.scroller = $('[data-hr-scroller]');
        this.track = $('[data-hr-track]');
        this.spot = $('[data-hr-spot]');
        this.nowEl = $('[data-hr-now]');
        this.nameEl = $('[data-hr-name]');
        this.subEl = $('[data-hr-sub]');
        this.priceEl = $('[data-hr-price]');
        this.hintEl = $('[data-hr-hint]');
        this.dotsEl = $('[data-hr-dots]');
        this.liveEl = $('[data-hr-live]');

        var lis = this.querySelectorAll('[data-hr-item]');
        this.n = lis.length;
        if (!this.n || !this.stage || !this.section) return;
        this._ready = true;

        this.items = Array.prototype.map.call(lis, function (li) {
          var link = li.querySelector('.hrail__link');
          return {
            el: li,
            link: link,
            slide: li.querySelector('.hrail__slide'),
            hit: li.querySelector('.hrail__hit'),
            swing: li.querySelector('.hrail__swing'),
            turn: li.querySelector('.hrail__turn'),
            front: li.querySelector('.hrail__img--front'),
            side: li.querySelector('.hrail__img--side'),
            data: link ? link.dataset : {},
            a: 0, v: 0, // turn amount (0 = side on, 1 = facing you) and its speed
            ang: 0, angV: 0, // sway angle and its speed
            tx: 0, ptx: null, // x position now and last frame
            tiltX: 0, tiltY: 0,
            z: -1, fo: -1, so: -1, hw: -1, op: -1 // cached style values to skip useless writes
          };
        });

        this.idleTitle = this.dataset.idleTitle || '';
        this.hintHover = this.dataset.hintHover || '';
        this.hintTouch = this.dataset.hintTouch || '';
        this.swayOn = this.dataset.sway !== 'false';
        this.attractOn = this.dataset.attract !== 'false';
        this.wa = this.dataset.wa || '';

        this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 750px)');

        this.mode = '';
        this.target = -1; // which piece is turned to face you (rail mode)
        this.active = -2; // which piece the label shows
        this.cur = 0; // keyboard focus index
        this.visible = false;
        this.scrolling = false;
        this.introDone = false;
        this.ptr = null;
        this.raf = 0;
        this.last = 0;
        this.spotX = 0;
        this.spotO = 0;
        this.attractCount = 0;
        this.userActed = false;

        if (this.dotsEl) {
          for (var d = 0; d < this.n; d++) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'hrail__dot';
            dot.setAttribute('aria-label', this.items[d].data.title || 'Piece ' + (d + 1));
            this.dotsEl.appendChild(dot);
          }
          this.dotsEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.hrail__dot');
            if (!btn || !self.dotsEl.contains(btn)) return;
            var i = Array.prototype.indexOf.call(self.dotsEl.children, btn);
            if (i < 0 || self.mode !== 'scroll') return;
            self.userAct();
            self.setRoving(i);
            self.scrollToIndex(i);
          });
        }

        this.initQuickLook();
        this.bind();

        this.items.forEach(function (it, i) {
          if (it.link) it.link.tabIndex = i === 0 ? 0 : -1;
        });

        try {
          if (sessionStorage.getItem('hrail-seen')) {
            this.hintQuiet = true;
            if (this.hintEl) this.hintEl.classList.add('is-quiet');
          }
        } catch (e) {}

        this.section.classList.add('is-ready');
        this.chooseMode();
        this.onActive(-1);
        this.tick(performance.now());
      }

      disconnectedCallback() {
        if (this.raf) cancelAnimationFrame(this.raf);
        clearTimeout(this.leaveT);
        clearTimeout(this.intentT);
        clearTimeout(this.attractT);
        clearTimeout(this.scrollT);
        if (this.ro) this.ro.disconnect();
        if (this.io) this.io.disconnect();
        if (this.stageIo) this.stageIo.disconnect();
        if (this.fine) this.fine.removeEventListener('change', this._onMq);
        if (this.reduce) this.reduce.removeEventListener('change', this._onMq);
        document.removeEventListener('shopify:block:select', this._onSelect);
        document.removeEventListener('shopify:block:deselect', this._onDeselect);
        document.documentElement.classList.remove('hrail-lock');
      }

      // ---------- events ----------

      indexOfLink(link) {
        for (var i = 0; i < this.n; i++) if (this.items[i].link === link) return i;
        return -1;
      }

      focusInside() {
        return this.track.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
      }

      setRoving(i) {
        this.cur = i;
        this.items.forEach(function (it, k) {
          if (it.link) it.link.tabIndex = k === i ? 0 : -1;
        });
      }

      userAct() {
        if (this.userActed) return;
        this.userActed = true;
        clearTimeout(this.attractT);
        if (this.attractRunning) {
          this.attractRunning = false;
          this.setTarget(-1);
        }
      }

      // ---------- mode + measuring ----------
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
      }

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
      }

      setHint() {
        if (!this.hintEl) return;
        var t = this.mode === 'rail' ? this.hintHover : this.hintTouch;
        if (t) this.hintEl.textContent = t;
      }

      scrollToIndex(i) {
        if (this.mode !== 'scroll') return;
        this.scroller.scrollTo({ left: i * this.P, behavior: this.reduce.matches ? 'auto' : 'smooth' });
      }

      // ---------- targeting (rail mode) ----------
      setTarget(i) {
        if (i === this.target) return;
        this.target = i;
        this.request();
      }

      centerOf(i) {
        return this.trackLeft + this.items[i].tx + this.P / 2;
      }

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
      }

      // Decode every rail image once, one by one, while the page is calm.

  }
  window.__AdotHangerRail = HangerRail;
})();
