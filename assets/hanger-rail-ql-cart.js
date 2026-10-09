/** Hanger Rail — quick look cart */
(function () {
  'use strict';
  if (window.__adotHangerQlCart) return;
  window.__adotHangerQlCart = true;
  var HR = window.__ADOT_HR;
  if (!HR || !HR.__helpers) throw new Error('[HangerRail] helpers must load first');
  var FILL=HR.FILL, MAX_PITCH=HR.MAX_PITCH, MIN_PITCH=HR.MIN_PITCH, REST_TURN=HR.REST_TURN;
  var SPRING_K=HR.SPRING_K, SPRING_C=HR.SPRING_C, SWAY_K=HR.SWAY_K, SWAY_C=HR.SWAY_C, EASE=HR.EASE;
  var clamp=HR.clamp, lerp=HR.lerp, smooth=HR.smooth, pad2=HR.pad2;

  var HangerRail = window.__AdotHangerRail;
  if (!HangerRail) throw new Error('[HangerRail] shell must load first');
  Object.assign(HangerRail.prototype, {
      addToCart() {
        var self = this;
        var it = this.items[this.qIndex];
        if (!it.size) {
          this.qNote.textContent = 'Pick a size';
          this.qChips.classList.remove('is-shaking');
          void this.qChips.offsetWidth;
          this.qChips.classList.add('is-shaking');
          return;
        }
        var btn = this.qAdd;
        if (btn.disabled) return;
        btn.disabled = true;
        this.qAddLabel.textContent = 'Adding...';
        var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
        var reset = function (text, ms) {
          self.qAddLabel.textContent = text;
          setTimeout(function () {
            self.qAddLabel.textContent = self.addLabel;
            btn.disabled = false;
          }, ms);
        };
        var variantId = Number(it.size);
        fetch(root + 'cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
        })
          .then(function (r) {
            if (!r.ok) throw new Error('add failed');
            return r.json();
          })
          .then(function () {
            reset('Added', 1800);
            self.afterAdd(root, variantId);
          })
          .catch(function () {
            reset('Could not add. Try again', 2200);
          });
      },

      // THEME HOOK: cart:refresh redraws the drawer + badge; closeQL({ toBag }) flies into the bag and opens it.
      afterAdd(root, variantId) {
        document.dispatchEvent(new CustomEvent('hanger-rail:cart-add', { bubbles: true }));
        var hasDrawer = !!document.querySelector('cart-drawer');
        window.dispatchEvent(
          new CustomEvent('cart:refresh', { detail: { variantId: variantId } })
        );
        if (!hasDrawer) {
          fetch(root + 'cart.js', { headers: { Accept: 'application/json' } })
            .then(function (r) {
              return r.json();
            })
            .then(function (cart) {
              document.querySelectorAll('[data-cart-count]').forEach(function (el) {
                var bracket = /^\s*\[\d+\]\s*$/.test(el.textContent);
                el.textContent = bracket ? '[' + cart.item_count + ']' : String(cart.item_count);
              });
            })
            .catch(function () {});
          return;
        }
        var self = this;
        setTimeout(function () {
          self.closeQL({ toBag: true });
        }, 450);
      },

      cancelQLAnims() {
        [this.qGarment, this.qWall, this.qThread].concat(this.qFades).forEach(function (el) {
          if (el) {
            el.getAnimations().forEach(function (a) {
              a.cancel();
            });
          }
        });
        if (this.qAnim) this.qAnim.cancel();
      },

      // The first time the quick look opens, the hint is no longer needed.
      quietHint() {
        if (this.hintQuiet) return;
        this.hintQuiet = true;
        try {
          sessionStorage.setItem('hrail-seen', '1');
        } catch (e) {}
        if (this.hintEl) this.hintEl.classList.add('is-quiet');
      },

      // Slide the text and controls in. Used when the quick look OPENS only.
      revealInfo() {
        if (this.reduce.matches) return;
        Array.prototype.forEach.call(this.ql.querySelectorAll('[data-rv]'), function (el, k) {
          el.animate(
            [
              { opacity: 0, transform: 'translateY(16px)' },
              { opacity: 1, transform: 'none' }
            ],
            { duration: 640, delay: 180 + k * 60, easing: EASE, fill: 'backwards' }
          );
        });
      },

      // Fade only the text that changed. Buttons and arrows never move.
      fadeIn(list) {
        if (this.reduce.matches) return;
        Array.prototype.forEach.call(list, function (el) {
          el.animate(
            [
              { opacity: 0, transform: 'translateY(8px)' },
              { opacity: 1, transform: 'none' }
            ],
            { duration: 380, easing: EASE }
          );
        });
      }


  });
})();
