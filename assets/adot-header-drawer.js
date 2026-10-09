/* ==========================================================================
   ADOT <header-drawer> — mobile navigation
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotHeaderDrawer) return;
  window.__adotHeaderDrawer = true;
  var AdotUI = window.AdotUI;
  if (!AdotUI) throw new Error('[ADOT] adot-ui.js must load first');
  var root = AdotUI.root;
  var escapeHtml = AdotUI.escapeHtml;
  var qsa = AdotUI.qsa;
  var trapTab = AdotUI.trapTab;
  var announce = AdotUI.announce;
  var reduceMotion = AdotUI.reduceMotion;

  class HeaderDrawer extends HTMLElement {
    connectedCallback() {
      var self = this;
      this.isOpen = false;
      this.ac = new AbortController();
      var opt = { signal: this.ac.signal };

      document.addEventListener(
        'click',
        function (e) {
          var t = e.target.closest && e.target.closest('[data-drawer-trigger]');
          if (!t) return;
          if (self.isOpen) self.close();
          else {
            self.opener = t;
            self.open();
          }
        },
        opt
      );

      this.addEventListener(
        'click',
        function (e) {
          if (e.target.closest('[data-drawer-close]') || e.target.closest('a')) self.close();
        },
        opt
      );

      document.addEventListener(
        'keydown',
        function (e) {
          if (!self.isOpen) return;
          if (e.key === 'Escape') self.close();
          else if (e.key === 'Tab') trapTab(self.querySelector('.header-drawer__panel') || self, e);
        },
        opt
      );
    }

    disconnectedCallback() {
      this.ac.abort();
      if (this.isOpen) AdotUI.unlock('drawer');
    }

    setTriggers(open) {
      qsa(document, '[data-drawer-trigger]').forEach(function (btn) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        btn.classList.toggle('is-active', open);
      });
    }

    open() {
      this.isOpen = true;
      this.classList.add('is-open');
      AdotUI.lock('drawer');
      var header = document.querySelector('.header');
      if (header) header.classList.add('header--drawer-open');
      this.setTriggers(true);
      var panel = this.querySelector('.header-drawer__panel');
      if (panel) {
        panel.setAttribute('tabindex', '-1');
        setTimeout(function () { panel.focus({ preventScroll: true }); }, 60);
      }
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.classList.remove('is-open');
      AdotUI.unlock('drawer');
      var header = document.querySelector('.header');
      if (header) header.classList.remove('header--drawer-open');
      this.setTriggers(false);
      if (this.opener && this.opener.isConnected) this.opener.focus({ preventScroll: true });
    }
  }
  if (!customElements.get('header-drawer')) customElements.define('header-drawer', HeaderDrawer);

})();
