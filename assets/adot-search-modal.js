/* ==========================================================================
   ADOT <search-modal> — shell, events, open/close, recent searches
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotSearchModal) return;
  window.__adotSearchModal = true;
  var AdotUI = window.AdotUI;
  if (!AdotUI) throw new Error('[ADOT] adot-ui.js must load first');
  var root = AdotUI.root;
  var escapeHtml = AdotUI.escapeHtml;
  var qsa = AdotUI.qsa;
  var trapTab = AdotUI.trapTab;
  var announce = AdotUI.announce;
  var reduceMotion = AdotUI.reduceMotion;

  var RECENT_KEY = 'adot:recent-searches';
  var recent = {
    get: function () {
      try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(Boolean).slice(0, 5);
      } catch (e) {
        return [];
      }
    },
    add: function (q) {
      q = String(q || '').trim();
      if (q.length < 2) return;
      var list = recent.get().filter(function (x) {
        return x.toLowerCase() !== q.toLowerCase();
      });
      list.unshift(q);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
      } catch (e) {}
    },
    clear: function () {
      try {
        localStorage.removeItem(RECENT_KEY);
      } catch (e) {}
    }
  };

  class SearchModal extends HTMLElement {
    connectedCallback() {
      var self = this;
      this.isOpen = false;
      this.cache = {};
      this.ac = new AbortController();
      this.reqAbort = null;
      this.timer = null;
      this.input = this.querySelector('[data-search-input]');
      this.clearBtn = this.querySelector('[data-search-clear]');
      this.suggestions = this.querySelector('[data-search-suggestions]');
      this.results = this.querySelector('[data-search-results]');
      this.status = this.querySelector('[data-search-status]');
      this.recentBox = this.querySelector('[data-search-recent]');
      this.wa = this.dataset.wa || '';
      var opt = { signal: this.ac.signal };

      document.addEventListener(
        'click',
        function (e) {
          var t = e.target.closest && e.target.closest('[data-search-trigger]');
          if (!t || e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          self.opener = t;
          var drawer = document.querySelector('header-drawer');
          if (drawer && drawer.isOpen) drawer.close();
          self.open();
        },
        opt
      );

      this.addEventListener(
        'click',
        function (e) {
          if (e.target.closest('[data-search-close]')) {
            self.close();
            return;
          }
          var tag = e.target.closest('[data-tag-search]');
          if (tag) {
            self.setQuery(tag.getAttribute('data-tag-search'));
            return;
          }
          var rec = e.target.closest('[data-recent-search]');
          if (rec) {
            self.setQuery(rec.getAttribute('data-recent-search'));
            return;
          }
          if (e.target.closest('[data-recent-clear]')) {
            recent.clear();
            self.renderRecent();
            return;
          }
          // remember the search when the visitor picks a result
          if (e.target.closest('[data-search-option]') && self.input) recent.add(self.input.value);
        },
        opt
      );

      if (this.clearBtn) {
        this.clearBtn.addEventListener(
          'click',
          function () {
            self.input.value = '';
            self.input.focus();
            self.clearBtn.hidden = true;
            self.reset();
          },
          opt
        );
      }

      if (this.input) {
        this.input.addEventListener(
          'input',
          function () {
            var q = self.input.value.trim();
            if (self.clearBtn) self.clearBtn.hidden = q.length === 0;
            clearTimeout(self.timer);
            if (!q) {
              self.reset();
              return;
            }
            self.timer = setTimeout(function () {
              self.fetchResults(q);
            }, 160);
          },
          opt
        );
      }

      var form = this.querySelector('form');
      if (form) {
        form.addEventListener(
          'submit',
          function () {
            if (self.input) recent.add(self.input.value);
          },
          opt
        );
      }

      document.addEventListener(
        'keydown',
        function (e) {
          // "/" opens search (like most big shops), unless you are typing somewhere
          if (!self.isOpen && e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
            var el = document.activeElement;
            var typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
            var anyOpen = document.querySelector('cart-drawer.is-open, header-drawer.is-open, dialog[open]');
            if (!typing && !anyOpen) {
              e.preventDefault();
              self.opener = null;
              self.open();
            }
            return;
          }
          if (!self.isOpen) return;
          if (e.key === 'Escape') {
            self.close();
            return;
          }
          if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && self.input && document.activeElement === self.input) {
            var options = qsa(self, '[data-search-option]');
            if (!options.length) return;
            e.preventDefault();
            var cur = options.findIndex(function (o) {
              return o.getAttribute('aria-selected') === 'true';
            });
            var next = e.key === 'ArrowDown' ? cur + 1 : cur - 1;
            if (next < 0) next = options.length - 1;
            if (next >= options.length) next = 0;
            self.pick(options, next);
            return;
          }
          if (e.key === 'Enter' && self.input && document.activeElement === self.input) {
            var sel = self.querySelector('[data-search-option][aria-selected="true"]');
            if (sel) {
              e.preventDefault();
              sel.click();
            }
            return;
          }
          if (e.key === 'Tab') trapTab(self.querySelector('.search-modal__content') || self, e);
        },
        opt
      );

      this.renderRecent();
    }

    disconnectedCallback() {
      this.ac.abort();
      clearTimeout(this.timer);
      if (this.reqAbort) this.reqAbort.abort();
      if (this.isOpen) AdotUI.unlock('search');
    }

    open() {
      this.isOpen = true;
      this.classList.add('is-open');
      this.removeAttribute('aria-hidden');
      this.removeAttribute('inert');
      this.setAttribute('aria-modal', 'true');
      if (this.input) this.input.setAttribute('aria-expanded', 'true');
      AdotUI.lock('search');
      this.renderRecent();
      var self = this;
      setTimeout(function () {
        if (self.input) self.input.focus();
      }, 50);
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      this.setAttribute('inert', '');
      this.setAttribute('aria-modal', 'false');
      if (this.input) {
        this.input.setAttribute('aria-expanded', 'false');
        this.input.removeAttribute('aria-activedescendant');
      }
      this.clearPick();
      AdotUI.unlock('search');
      if (this.opener && this.opener.isConnected) this.opener.focus({ preventScroll: true });
    }

    setQuery(term) {
      if (!this.input) return;
      this.input.value = term;
      if (this.clearBtn) this.clearBtn.hidden = false;
      this.input.focus();
      this.fetchResults(term);
    }

    pick(options, index) {
      options.forEach(function (el) {
        el.setAttribute('aria-selected', 'false');
      });
      var a = options[index];
      if (!a) return;
      if (!a.id) a.id = 'SearchOption-' + index;
      a.setAttribute('aria-selected', 'true');
      if (this.input) this.input.setAttribute('aria-activedescendant', a.id);
      a.scrollIntoView({ block: 'nearest' });
    }

    clearPick() {
      qsa(this, '[data-search-option][aria-selected="true"]').forEach(function (el) {
        el.setAttribute('aria-selected', 'false');
      });
      if (this.input) this.input.removeAttribute('aria-activedescendant');
    }

    renderRecent() {
      if (!this.recentBox) return;
      var list = recent.get();
      this.recentBox.hidden = list.length === 0;
      if (!list.length) return;
      var chips = list
        .map(function (q) {
          return '<button type="button" class="search-modal__tag" data-recent-search="' + escapeHtml(q) + '">' + escapeHtml(q) + '</button>';
        })
        .join('');
      this.recentBox.innerHTML =
        '<div class="search-modal__suggestions-group">' +
        '<p class="text-micro search-modal__suggestions-title">RECENT <button type="button" class="search-modal__recent-clear" data-recent-clear>Clear</button></p>' +
        '<div class="search-modal__tags">' +
        chips +
        '</div></div>';
    }

    reset() {
      clearTimeout(this.timer);
      if (this.reqAbort) this.reqAbort.abort();
      if (this.results) {
        this.results.hidden = true;
        this.results.innerHTML = '';
        this.results.classList.remove('is-loading');
      }
      if (this.suggestions) this.suggestions.hidden = false;
      this.renderRecent();
    }

  }
  window.__AdotSearchModal = SearchModal;
})();
