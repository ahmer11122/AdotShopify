/** Hanger Rail — event binding */
(function () {
  'use strict';
  if (window.__adotHangerBind) return;
  window.__adotHangerBind = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      bind() {
        var self = this;

        this.stage.addEventListener('pointermove', function (e) {
          if (self.mode !== 'rail' || e.pointerType === 'touch' || self.qlOpen) return;
          var r = self.stage.getBoundingClientRect();
          self.ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
          self.userAct();
          clearTimeout(self.leaveT);
          var inside = self.ptr.x >= self.trackLeft - 24 && self.ptr.x <= self.trackLeft + self.trackW + 24;
          var want = inside ? self.hitTest(self.ptr.x) : -1;
          // how fast is the pointer moving? (px per ms)
          var tnow = performance.now();
          var spd = 0;
          if (self.lastPtr) spd = Math.abs(self.ptr.x - self.lastPtr.x) / Math.max(1, tnow - self.lastPtr.t);
          self.lastPtr = { x: self.ptr.x, t: tnow };
          clearTimeout(self.intentT);
          if (want >= 0 && self.target >= 0 && want !== self.target && spd > 1.2) {
            // moving fast across the rail: wait until the pointer slows down
            self.intentT = setTimeout(function () {
              if (self.ptr) self.setTarget(self.hitTest(self.ptr.x));
            }, 90);
          } else {
            self.setTarget(want);
          }
          self.request();
        });

        this.stage.addEventListener('pointerleave', function (e) {
          if (self.mode !== 'rail' || e.pointerType === 'touch' || self.qlOpen) return;
          self.ptr = null;
          self.lastPtr = null;
          clearTimeout(self.intentT);
          clearTimeout(self.leaveT);
          self.leaveT = setTimeout(function () {
            if (!self.focusInside()) self.setTarget(-1);
          }, 140);
        });

        this.track.addEventListener('click', function (e) {
          var link = e.target.closest('.hrail__link');
          if (!link) return;
          if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          var i = self.indexOfLink(link);
          if (i < 0) return;
          e.preventDefault();
          self.userAct();
          if (self.mode === 'scroll' && self.items[i].a < 0.6) {
            self.scrollToIndex(i);
            return;
          }
          self.openQL(i);
        });

        this.track.addEventListener('focusin', function (e) {
          var link = e.target.closest('.hrail__link');
          var i = link ? self.indexOfLink(link) : -1;
          if (i < 0) return;
          self.setRoving(i);
          if (self.mode === 'rail') self.setTarget(i);
          else if (self.items[i].a < 0.6) self.scrollToIndex(i);
          if (self.liveEl) self.liveEl.textContent = self.items[i].data.title || '';
        });

        this.track.addEventListener('focusout', function () {
          if (self.mode === 'rail' && !self.ptr) {
            setTimeout(function () {
              if (!self.focusInside() && !self.qlOpen) self.setTarget(-1);
            }, 0);
          }
        });

        this.track.addEventListener('keydown', function (e) {
          var i = self.cur;
          if (e.key === 'ArrowRight') i = Math.min(self.n - 1, i + 1);
          else if (e.key === 'ArrowLeft') i = Math.max(0, i - 1);
          else if (e.key === 'Home') i = 0;
          else if (e.key === 'End') i = self.n - 1;
          else return;
          e.preventDefault();
          self.userAct();
          self.setRoving(i);
          self.items[i].link.focus({ preventScroll: true });
        });

        this.scroller.addEventListener(
          'scroll',
          function () {
            if (self.mode !== 'scroll') return;
            self.scrolling = true;
            clearTimeout(self.scrollT);
            self.scrollT = setTimeout(function () {
              self.scrolling = false;
              self.request();
            }, 140);
            self.request();
          },
          { passive: true }
        );

        this.ro = new ResizeObserver(function () {
          self.chooseMode();
          self.request();
        });
        this.ro.observe(this.stage);

        this.io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              self.visible = en.isIntersecting;
              if (self.visible) {
                self.request();
                self.startAttract();
                self.warm();
              } else {
                clearTimeout(self.attractT);
              }
            });
          },
          { threshold: 0.05 }
        );
        this.io.observe(this.section);

        // Trigger intro animation only when the clothes rail stage itself enters the viewport
        this.stageIo = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) {
                self.playIntro();
                if (self.stageIo) self.stageIo.disconnect();
              }
            });
          },
          { rootMargin: '0px 0px -40px 0px', threshold: 0.15 }
        );
        this.stageIo.observe(this.stage);

        this._onMq = function () {
          self.chooseMode();
          self.request();
        };
        this.fine.addEventListener('change', this._onMq);
        this.reduce.addEventListener('change', this._onMq);

        // Shopify theme editor: select a block to preview it
        this._onSelect = function (e) {
          var li = e.target && e.target.closest ? e.target.closest('[data-hr-item]') : null;
          if (!li || !self.contains(li)) return;
          var i = Array.prototype.indexOf.call(self.track.children, li);
          if (i < 0) return;
          self.userAct();
          if (self.mode === 'rail') self.setTarget(i);
          else self.scrollToIndex(i);
        };
        this._onDeselect = function () {
          if (self.mode === 'rail') self.setTarget(-1);
        };
        document.addEventListener('shopify:block:select', this._onSelect);
        document.addEventListener('shopify:block:deselect', this._onDeselect);
      }


  });
})();
