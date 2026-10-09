/** Hanger Rail — quick look UI */
(function () {
  'use strict';
  if (window.__adotHangerQlUi) return;
  window.__adotHangerQlUi = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      markThumb(idx) {
        Array.prototype.forEach.call(this.qThumbs.children, function (b, k) {
          b.setAttribute('aria-pressed', k === idx ? 'true' : 'false');
        });
      },

      setView(i) {
        var v = this.qViews[i];
        if (!v) return;
        var self = this;
        this.qViewIdx = i;
        this.markThumb(i);
        if (v.kind === 'face') {
          this.qGarment.classList.remove('is-photo');
          this.ql.classList.remove('is-photo-view');
          var wantBack = v.face === 'back';
          var isBack = Math.cos((this.spin.t * Math.PI) / 180) < 0;
          if (wantBack !== isBack) {
            this.spin.t += 180;
            this.runSpin();
          }
        } else {
          var show = function () {
            if (self.qViewIdx !== i) return;
            self.qGarment.classList.add('is-photo');
            self.ql.classList.add('is-photo-view');
          };
          this.qPhoto.src = v.src;
          if (this.qPhoto.decode) this.qPhoto.decode().then(show, show);
          else show();
        }
      },

      renderSizes(it) {
        var d = it.data;
        var list = [];
        if (d.variants) {
          d.variants.split('|').forEach(function (s) {
            var p = s.split('~');
            if (p[0]) list.push({ id: p[0], title: p[1] || '', ok: p[2] === 'true' });
          });
        }
        it.list = list;
        var single = list.length === 1;
        var hide = !this.showSizes || list.length === 0 || (single && /default title/i.test(list[0].title));
        // one buyable option only: pick it for the visitor
        var buyable = list.filter(function (v) {
          return v.ok;
        });
        if (!it.size && buyable.length === 1 && (single || hide)) it.size = buyable[0].id;
        this.qSizes.hidden = hide;
        this.qNote.textContent = '';
        this.qChips.innerHTML = '';
        if (hide) return;
        var self = this;
        list.forEach(function (v) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'hrail-ql__chip' + (v.ok ? '' : ' is-out');
          b.textContent = v.title;
          b.dataset.id = v.id;
          b.setAttribute('aria-pressed', it.size === v.id ? 'true' : 'false');
          if (!v.ok) {
            b.disabled = true;
            b.title = 'Sold out';
          }
          self.qChips.appendChild(b);
        });
      },

      selectSize(id) {
        var it = this.items[this.qIndex];
        it.size = it.size === id ? '' : id;
        Array.prototype.forEach.call(this.qChips.children, function (b) {
          b.setAttribute('aria-pressed', b.dataset.id === it.size ? 'true' : 'false');
        });
        this.qNote.textContent = '';
        this.updateActions(it);
      },

      sizeTitle(it) {
        var s = '';
        (it.list || []).forEach(function (v) {
          if (v.id === it.size) s = v.title;
        });
        return /default title/i.test(s) ? '' : s;
      },

      updateActions(it) {
        var d = it.data;
        var u = new URL(it.link.getAttribute('href'), window.location.href);
        if (it.size) u.searchParams.set('variant', it.size);
        this.qView.href = u.href;
        this.qMore.href = u.href;
        if (this.qWa) {
          var abs = new URL(it.link.getAttribute('href'), window.location.href).href;
          var sz = this.sizeTitle(it);
          var msg = 'Hi! I want to order: ' + (d.title || '') + (sz ? ' (size ' + sz + ')' : '') + ' ' + abs;
          this.qWa.href = 'https://wa.me/' + this.wa + '?text=' + encodeURIComponent(msg);
        }
        if (this.quickAdd) {
          var any = (it.list || []).some(function (v) {
            return v.ok;
          });
          var hasList = (it.list || []).length > 0;
          this.qAdd.disabled = hasList && !any;
          this.qAddLabel.textContent = hasList && !any ? 'Sold out' : this.addLabel;
          // no product on this piece: fall back to the product link
          this.qAdd.hidden = !hasList;
          this.qView.hidden = hasList;
          this.qMore.hidden = !hasList;
        }
      }


  });
})();
