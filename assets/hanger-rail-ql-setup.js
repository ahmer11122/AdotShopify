/** Hanger Rail — quick look setup */
(function () {
  'use strict';
  if (window.__adotHangerQlSetup) return;
  window.__adotHangerQlSetup = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      initQuickLook() {
        var self = this;
        var $ = function (s) {
          return self.querySelector(s);
        };
        this.ql = $('[data-ql]');
        if (!this.ql) return;
        this.qWall = $('[data-ql-wall]');
        this.qThread = $('[data-ql-thread]');
        this.qGarment = $('[data-ql-garment]');
        this.qSpin = $('[data-ql-spin]');
        this.qFront = $('[data-ql-front]');
        this.qBack = $('[data-ql-back]');
        this.qSide = $('[data-ql-side]');
        this.qPhoto = $('[data-ql-photo]');
        this.qThumbs = $('[data-ql-thumbs]');
        this.qNum = $('[data-ql-num]');
        this.qName = $('[data-ql-name]');
        this.qPrice = $('[data-ql-price]');
        this.qSub = $('[data-ql-sub]');
        this.qDesc = $('[data-ql-desc]');
        this.qSizes = $('[data-ql-sizes]');
        this.qChips = $('[data-ql-chips]');
        this.qNote = $('[data-ql-note]');
        this.qView = $('[data-ql-view]');
        this.qAdd = $('[data-ql-add]');
        this.qAddLabel = $('[data-ql-add-label]');
        this.qWa = $('[data-ql-wa]');
        this.qMore = $('[data-ql-more]');
        this.qInfo = $('[data-ql-info]');
        this.qClose = $('[data-ql-close]');
        this.qPrev = $('[data-ql-prev]');
        this.qNext = $('[data-ql-next]');
        // things that fade in/out when the quick look opens/closes (never on piece change)
        this.qFades = [this.qInfo, this.qThumbs, this.qPrev, this.qNext, this.qClose];
        this.qOpen = false;
        this.qIndex = 0;
        this.qViews = [];
        this.qViewIdx = 0;
        this.showSizes = this.dataset.showSizes !== 'false';
        this.quickAdd = this.dataset.quickAdd === 'true';
        this.addLabel = this.dataset.addLabel || 'Add to bag';
        this.spin = { a: 0, v: 0, t: 0, drag: false, raf: 0, last: 0, hasBack: false, hasSide: false };

        // Main button: "Add to bag" (if on) or "View product". Never both.
        this.qAdd.hidden = !this.quickAdd;
        this.qMore.hidden = !this.quickAdd;
        this.qView.hidden = this.quickAdd;
        this.qAddLabel.textContent = this.addLabel;

        this.qClose.addEventListener('click', function () {
          self.closeQL();
        });
        this.qWall.addEventListener('click', function () {
          self.closeQL();
        });
        this.ql.addEventListener('cancel', function (e) {
          e.preventDefault();
          self.closeQL();
        });
        this.qPrev.addEventListener('click', function () {
          self.goQL(-1);
        });
        this.qNext.addEventListener('click', function () {
          self.goQL(1);
        });
        this.ql.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          var grp = e.target.closest && e.target.closest('[data-ql-chips], [data-ql-thumbs]');
          if (grp) {
            // inside the size or thumbnail group: move between the buttons
            var btns = Array.prototype.filter.call(grp.children, function (b) {
              return !b.disabled;
            });
            var at = btns.indexOf(e.target.closest('button'));
            var to = btns[at + (e.key === 'ArrowRight' ? 1 : -1)];
            if (to) to.focus();
            e.preventDefault();
            return;
          }
          self.goQL(e.key === 'ArrowLeft' ? -1 : 1);
        });
        this.qThumbs.addEventListener('click', function (e) {
          var b = e.target.closest('.hrail-ql__thumb');
          if (b) self.setView(Number(b.dataset.view));
        });
        this.qChips.addEventListener('click', function (e) {
          var b = e.target.closest('.hrail-ql__chip');
          if (b && !b.disabled) self.selectSize(b.dataset.id);
        });
        this.qAdd.addEventListener('click', function () {
          self.addToCart();
        });

        // drag the piece: spin it (hanger view) or swipe through photos (photo view)
        var g = this.qGarment;
        g.addEventListener('pointerdown', function (e) {
          if (e.button > 0) return;
          var s = self.spin;
          s.drag = true;
          s.sx = e.clientX;
          s.sa = s.a;
          s.lx = e.clientX;
          s.lt = performance.now();
          s.vel = 0;
          g.setPointerCapture(e.pointerId);
        });
        g.addEventListener('pointermove', function (e) {
          var s = self.spin;
          if (!s.drag) return;
          var now = performance.now();
          var dtm = Math.max(1, now - s.lt);
          s.vel = ((e.clientX - s.lx) * 0.55) / (dtm / 1000);
          s.lx = e.clientX;
          s.lt = now;
          var v = self.qViews[self.qViewIdx];
          if (v && v.kind === 'photo') return;
          var raw = s.sa + (e.clientX - s.sx) * 0.55;
          if (!s.hasBack) raw = clamp(raw, -28, 28);
          s.a = raw;
          self.setSpinDom(s.a);
        });
        var up = function () {
          var s = self.spin;
          if (!s.drag) return;
          s.drag = false;
          var total = s.lx - s.sx;
          var v = self.qViews[self.qViewIdx];
          if (v && v.kind === 'photo') {
            if (Math.abs(total) > 50) self.setView(clamp(self.qViewIdx + (total < 0 ? 1 : -1), 0, self.qViews.length - 1));
            return;
          }
          if (!s.hasBack) {
            s.t = 0;
            self.runSpin();
            // no back image: a swipe left goes to the next view (a photo)
            if (total < -70 && self.qViews.length > 1) self.setView(self.qViewIdx + 1);
            return;
          }
          var proj = s.a + clamp(s.vel, -900, 900) * 0.16;
          s.t = Math.round(proj / 180) * 180;
          self.runSpin();
        };
        g.addEventListener('pointerup', up);
        g.addEventListener('pointercancel', up);
      },

      thumbSrc(url) {
        return /width=\d+/.test(url) ? url.replace(/width=\d+/, 'width=160') : url;
      },

      // Fill the quick look with piece i. Does not play any animation.
      fillQL(i) {
        var it = this.items[i];
        var d = it.data;
        var self = this;
        this.qIndex = i;
        this.qNum.textContent = pad2(i + 1);
        this.qName.textContent = d.title || '';
        this.qPrice.textContent = d.price || '';
        this.qSub.textContent = d.sub || '';
        this.qDesc.textContent = d.desc || '';

        // images: show the small rail image first (already loaded), then swap to the big one
        var small = it.front ? it.front.currentSrc || it.front.src : '';
        var big = d.front || small;
        this.qFront.src = small || big;
        if (big && big !== small) {
          var hi = new Image();
          hi.src = big;
          (hi.decode ? hi.decode() : Promise.resolve()).then(
            function () {
              if (self.qIndex === i) self.qFront.src = big;
            },
            function () {}
          );
        }
        if (d.back) this.qBack.src = d.back;
        else this.qBack.removeAttribute('src');
        if (d.side) this.qSide.src = d.side;
        else this.qSide.removeAttribute('src');
        this.qPhoto.alt = (d.title || '') + ' photo';
        this.spin.hasBack = !!d.back;
        this.spin.hasSide = !!d.side;
        this.spin.a = 0;
        this.spin.v = 0;
        this.spin.t = 0;
        this.setSpinDom(0);

        // views: front, back (if any), then product photos
        var views = [{ kind: 'face', face: 'front', src: d.front || small, label: 'Front' }];
        if (d.back) views.push({ kind: 'face', face: 'back', src: d.back, label: 'Back' });
        (d.photos ? d.photos.split('|') : []).forEach(function (u, k) {
          if (u) views.push({ kind: 'photo', src: u, label: 'Photo ' + (k + 1) });
        });
        this.qViews = views;
        this.qThumbs.innerHTML = '';
        views.forEach(function (v, k) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'hrail-ql__thumb' + (v.kind === 'face' ? ' is-cut' : '');
          b.dataset.view = String(k);
          b.setAttribute('aria-label', v.label);
          b.setAttribute('aria-pressed', 'false');
          var im = document.createElement('img');
          im.src = self.thumbSrc(v.src || '');
          im.alt = '';
          im.width = 60;
          im.height = 75;
          im.loading = 'lazy';
          b.appendChild(im);
          self.qThumbs.appendChild(b);
        });
        this.qThumbs.hidden = views.length < 2;
        this.qGarment.classList.remove('is-photo');
        this.ql.classList.remove('is-photo-view');
        this.markThumb(0);
        this.qViewIdx = 0;

        this.renderSizes(it);
        this.updateActions(it);

        // warm the neighbours
        [-1, 1].forEach(function (dir) {
          var nb = self.items[(i + dir + self.n) % self.n];
          if (nb && nb.data.front) new Image().src = nb.data.front;
        });
      }


  });
})();
