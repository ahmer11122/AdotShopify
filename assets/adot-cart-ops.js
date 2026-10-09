/* ==========================================================================
   ADOT <cart-drawer> — quantity, undo toast, WhatsApp order link
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotCartOps) return;
  window.__adotCartOps = true;
  var AdotUI = window.AdotUI;
  if (!AdotUI) throw new Error('[ADOT] adot-ui.js must load first');
  var root = AdotUI.root;
  var escapeHtml = AdotUI.escapeHtml;
  var qsa = AdotUI.qsa;
  var trapTab = AdotUI.trapTab;
  var announce = AdotUI.announce;
  var reduceMotion = AdotUI.reduceMotion;

  var CartDrawer = window.__AdotCartDrawer;
  if (!CartDrawer) throw new Error('[ADOT] adot-cart-drawer.js must load first');

  Object.assign(CartDrawer.prototype, {
    /* ----- quantity: taps add up, one request after a short pause ----- */
    lineEl(key) {
      return this.querySelector('[data-item-key="' + key + '"]');
    },

    step(key, delta) {
      var row = this.lineEl(key);
      if (!row) return;
      var current = key in this.targets ? this.targets[key] : Number(row.getAttribute('data-qty') || 1);
      var want = Math.max(0, current + delta);
      this.targets[key] = want;
      // show the new number at once
      var num = row.querySelector('[data-qty-value]');
      if (num) num.textContent = String(want);
      row.classList.add('is-updating');
      var note = row.querySelector('[data-qty-note]');
      if (note) note.hidden = true;
      clearTimeout(this.timers[key]);
      var self = this;
      this.timers[key] = setTimeout(function () {
        self.send(key);
      }, 280);
    },

    flushNow() {
      var self = this;
      Object.keys(this.timers).forEach(function (k) {
        clearTimeout(self.timers[k]);
        delete self.timers[k];
        if (k in self.targets) self.send(k);
      });
    },

    async send(key) {
      var want = this.targets[key];
      delete this.targets[key];
      delete this.timers[key];
      if (want === undefined) return;
      var row = this.lineEl(key);
      var removedMeta = row ? this.rowMeta(row) : null;
      this.busy++;
      try {
        var json = await this.post('cart/change.js', { id: key, quantity: want });
        if (json.sections && json.sections[this.sectionId]) this.apply(json.sections[this.sectionId]);
        else await this.fetchCart();
        if (want === 0 && removedMeta) this.showToast(removedMeta);
      } catch (err) {
        // stock limit or network: show the real number again, and say why
        await this.fetchCart();
        var again = this.lineEl(key);
        var note = again && again.querySelector('[data-qty-note]');
        if (note) {
          note.textContent = err.status === 422 ? err.message : 'Could not update. Try again.';
          note.hidden = false;
        }
      } finally {
        this.busy--;
      }
    },

    remove(key) {
      this.targets[key] = 0;
      var row = this.lineEl(key);
      if (row) row.classList.add('is-updating');
      clearTimeout(this.timers[key]);
      this.send(key);
    },

    rowMeta(row) {
      return {
        id: Number(row.getAttribute('data-variant-id')),
        quantity: Number(row.getAttribute('data-qty') || 1),
        title: row.getAttribute('data-title') || 'Item'
      };
    },

    /* ----- undo a remove ----- */
    showToast(meta) {
      var toast = this.querySelector('[data-cart-toast]');
      if (!toast) return;
      this.undoData = meta;
      toast.querySelector('[data-toast-text]').textContent = meta.title + ' removed';
      toast.hidden = false;
      toast.classList.add('is-in');
      clearTimeout(this.toastTimer);
      var self = this;
      this.toastTimer = setTimeout(function () { self.hideToast(); }, 6000);
    },

    hideToast() {
      var toast = this.querySelector('[data-cart-toast]');
      if (!toast) return;
      toast.hidden = true;
      toast.classList.remove('is-in');
      this.undoData = null;
      clearTimeout(this.toastTimer);
    },

    async undo() {
      var d = this.undoData;
      if (!d) return;
      this.hideToast();
      try {
        var json = await this.post('cart/add.js', { items: [{ id: d.id, quantity: d.quantity }] });
        if (json.sections && json.sections[this.sectionId]) this.apply(json.sections[this.sectionId]);
        else await this.fetchCart();
        this.flash(d.id);
      } catch (err) {
        await this.fetchCart();
      }
    },

    /* ----- WhatsApp order from the bag ----- */
    updateWa() {
      var a = this.querySelector('[data-cart-wa]');
      if (!a) return;
      if (!this.wa) {
        a.hidden = true;
        return;
      }
      var rows = qsa(this, '[data-item-key]');
      if (!rows.length) {
        a.hidden = true;
        return;
      }
      var lines = rows.map(function (r) {
        var t = r.getAttribute('data-title') || 'Item';
        var v = r.getAttribute('data-variant');
        var q = r.getAttribute('data-qty') || '1';
        return '- ' + t + (v ? ' (' + v + ')' : '') + ' x' + q;
      });
      var sub = this.querySelector('[data-cart-subtotal]');
      var msg = 'Hi! I want to order:\n' + lines.join('\n') + (sub ? '\nTotal: ' + sub.textContent.trim() : '');
      a.href = 'https://wa.me/' + this.wa + '?text=' + encodeURIComponent(msg);
      a.hidden = false;
    }

  });

  if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);
})();
