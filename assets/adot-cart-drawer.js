/* ==========================================================================
   ADOT <cart-drawer> — open/close, section render, badge bump
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotCartDrawer) return;
  window.__adotCartDrawer = true;
  var AdotUI = window.AdotUI;
  if (!AdotUI) throw new Error('[ADOT] adot-ui.js must load first');
  var root = AdotUI.root;
  var escapeHtml = AdotUI.escapeHtml;
  var qsa = AdotUI.qsa;
  var trapTab = AdotUI.trapTab;
  var announce = AdotUI.announce;
  var reduceMotion = AdotUI.reduceMotion;

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      var self = this;
      this.isOpen = false;
      this.ac = new AbortController();
      this.targets = {}; // wanted quantity per line (so fast taps add up)
      this.timers = {};
      this.busy = 0;
      this.undoData = null;
      this.sectionId = this.dataset.sectionId || '';
      this.wa = this.dataset.wa || '';
      this.lastCount = Number(this.dataset.cartCountValue || 0);
      var opt = { signal: this.ac.signal };

      document.addEventListener(
        'click',
        function (e) {
          var t = e.target.closest && e.target.closest('[data-cart-trigger]');
          if (!t || e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          self.opener = t;
          self.open();
        },
        opt
      );

      this.addEventListener(
        'click',
        function (e) {
          if (e.target.closest('[data-cart-close]')) {
            self.close();
            return;
          }
          var q = e.target.closest('[data-qty-change]');
          if (q) {
            self.step(q.getAttribute('data-key'), parseInt(q.getAttribute('data-qty-change'), 10));
            return;
          }
          var rm = e.target.closest('[data-remove-item]');
          if (rm) {
            self.remove(rm.getAttribute('data-key'));
            return;
          }
          if (e.target.closest('[data-toast-undo]')) self.undo();
        },
        opt
      );

      // other parts of the theme can talk to the bag with these events
      window.addEventListener('cart:open', function () { self.open(); }, opt);
      window.addEventListener(
        'cart:refresh',
        function (e) {
          self.fetchCart().then(function () {
            if (e.detail && e.detail.variantId) self.flash(e.detail.variantId);
          });
        },
        opt
      );

      document.addEventListener(
        'keydown',
        function (e) {
          if (!self.isOpen) return;
          if (e.key === 'Escape') self.close();
          else if (e.key === 'Tab') trapTab(self.querySelector('.cart-drawer__panel') || self, e);
        },
        opt
      );

      this.updateWa();
    }

    disconnectedCallback() {
      this.ac.abort();
      Object.keys(this.timers).forEach(function (k) {
        clearTimeout(this.timers[k]);
      }, this);
      if (this.isOpen) AdotUI.unlock('cart');
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      // close other overlays FIRST. Then lock. (The old code locked first and the other one unlocked it.)
      if (!this.opener) this.opener = document.activeElement;
      var s = document.querySelector('search-modal');
      if (s && s.isOpen) s.close();
      var d = document.querySelector('header-drawer');
      if (d && d.isOpen) d.close();
      this.classList.add('is-open');
      this.removeAttribute('aria-hidden');
      this.removeAttribute('inert');
      this.setAttribute('aria-modal', 'true');
      AdotUI.lock('cart');
      var panel = this.querySelector('.cart-drawer__panel');
      if (panel) {
        panel.setAttribute('tabindex', '-1');
        setTimeout(function () { panel.focus({ preventScroll: true }); }, 40);
      }
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.flushNow();
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      this.setAttribute('inert', '');
      this.setAttribute('aria-modal', 'false');
      AdotUI.unlock('cart');
      this.hideToast();
      if (this.opener && this.opener.isConnected && this.opener !== document.body) this.opener.focus({ preventScroll: true });
      this.opener = null;
    }

    /* ----- talking to Shopify ----- */
    async post(path, payload) {
      payload.sections = this.sectionId;
      payload.sections_url = window.location.pathname;
      var res = await fetch(root + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      var json = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        var err = new Error(json.description || json.message || 'Request failed');
        err.status = res.status;
        throw err;
      }
      return json;
    }

    async fetchCart() {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('section_id', this.sectionId);
        url.hash = '';
        var res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Section render failed');
        this.apply(await res.text());
      } catch (err) {
        console.error('Cart refresh failed:', err);
      }
    }

    // Take the new drawer HTML and put the changed parts in. Nothing else moves.
    apply(html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var next = doc.querySelector('cart-drawer');
      if (!next) return;
      var focusKey = document.activeElement && document.activeElement.closest && this.contains(document.activeElement)
        ? { key: document.activeElement.getAttribute('data-key'), change: document.activeElement.getAttribute('data-qty-change'), remove: document.activeElement.hasAttribute('data-remove-item') }
        : null;

      var items = this.querySelector('[data-cart-items]');
      var nItems = next.querySelector('[data-cart-items]');
      if (items && nItems) items.innerHTML = nItems.innerHTML;

      ['[data-cart-empty]', '.cart-drawer__footer', '[data-cart-progress]'].forEach(
        function (sel) {
          var cur = this.querySelector(sel);
          var nxt = next.querySelector(sel);
          if (!cur || !nxt) return;
          cur.hidden = nxt.hidden;
          if (sel === '.cart-drawer__footer') {
            var sub = cur.querySelector('[data-cart-subtotal]');
            var nsub = nxt.querySelector('[data-cart-subtotal]');
            if (sub && nsub) sub.textContent = nsub.textContent;
          }
          if (sel === '[data-cart-progress]') {
            // keep the bar element so its width can animate
            var fill = cur.querySelector('[data-progress-fill]');
            var nfill = nxt.querySelector('[data-progress-fill]');
            if (fill && nfill) fill.style.setProperty('--p', nfill.style.getPropertyValue('--p'));
            var txt = cur.querySelector('[data-progress-text]');
            var ntxt = nxt.querySelector('[data-progress-text]');
            if (txt && ntxt) txt.textContent = ntxt.textContent;
            cur.classList.toggle('is-done', nxt.classList.contains('is-done'));
          }
        }.bind(this)
      );

      var count = this.querySelector('[data-drawer-count]');
      var nCount = next.querySelector('[data-drawer-count]');
      if (count && nCount) count.textContent = nCount.textContent;

      var nextValue = Number(next.dataset.cartCountValue || 0);
      var headerCount = doc.querySelector('[data-cart-count]');
      qsa(document, '[data-cart-count]').forEach(function (el) {
        var text = headerCount ? headerCount.textContent : '[' + nextValue + ']';
        el.textContent = text;
      });
      qsa(document, '.header__cart-btn').forEach(function (b) {
        b.setAttribute('aria-label', 'Shopping Bag, ' + nextValue + (nextValue === 1 ? ' item' : ' items'));
      });
      this.dataset.cartCountValue = String(nextValue);
      this.dataset.cartTotal = next.dataset.cartTotal || '';
      if (nextValue > this.lastCount) this.bump();
      this.lastCount = nextValue;

      // buttons work again
      qsa(this, '.is-updating').forEach(function (el) { el.classList.remove('is-updating'); });
      this.updateWa();
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: nextValue } }));

      if (focusKey && focusKey.key) {
        var sel = focusKey.remove ? '[data-remove-item][data-key="' + focusKey.key + '"]' : '[data-qty-change="' + focusKey.change + '"][data-key="' + focusKey.key + '"]';
        var again = this.querySelector(sel);
        if (again) again.focus({ preventScroll: true });
      }
    }

    bump() {
      if (reduceMotion.matches) return;
      qsa(document, '[data-cart-count], .header__cart-btn .header__icon').forEach(function (el) {
        el.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.35)', offset: 0.35 },
            { transform: 'scale(1)' }
          ],
          { duration: 520, easing: 'cubic-bezier(0.2, 0.85, 0.2, 1)' }
        );
      });
    }

    flash(variantId) {
      var row = this.querySelector('[data-variant-id="' + variantId + '"]');
      if (!row) return;
      row.classList.remove('is-new');
      void row.offsetWidth;
      row.classList.add('is-new');
      var title = row.getAttribute('data-title') || 'Item';
      announce(title + ' added to your bag');
    }

  }
  window.__AdotCartDrawer = CartDrawer;
})();
