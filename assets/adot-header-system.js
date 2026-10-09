/* ==========================================================================
   ADOT header system v2  (replaces the old header JavaScript)
   <header-drawer>   mobile menu
   <search-modal>    full-screen predictive search
   <cart-drawer>     slide-out bag
   Also: sticky + smart-hide header, shared scroll lock, shop money format.

   Rules:
   - No DOM work in constructors. Everything starts in connectedCallback,
     and is removed in disconnectedCallback (the theme editor re-renders sections).
   - One shared scroll lock, so two overlays never fight over page scroll.
   - Prices always use the shop money format (never a hard-coded "$").
   - The cart drawer is drawn by Liquid. After every change we ask Shopify
     for the new header HTML in the SAME request (Section Rendering API).
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotHeaderSystem) return;
  window.__adotHeaderSystem = true;

  var AdotUI = (window.AdotUI = window.AdotUI || {});
  var root = AdotUI.root || (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  AdotUI.root = root;
  AdotUI.moneyFormat = AdotUI.moneyFormat || 'Rs. {{amount_no_decimals}}';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- small helpers ---------- */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  AdotUI.escapeHtml = escapeHtml;

  function qsa(node, sel) {
    return Array.prototype.slice.call(node.querySelectorAll(sel));
  }

  // Money: understands the Shopify placeholders ({{amount}}, {{amount_no_decimals}}, ...)
  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = precision === undefined ? 2 : precision;
    thousands = thousands === undefined ? ',' : thousands;
    decimal = decimal === undefined ? '.' : decimal;
    if (isNaN(number) || number === null) return '0';
    var fixed = (number / 100).toFixed(precision);
    var parts = fixed.split('.');
    var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    var cents = parts[1] ? decimal + parts[1] : '';
    return dollars + cents;
  }
  AdotUI.money = function (cents, format) {
    var f = format || AdotUI.moneyFormat;
    var value = Number(cents);
    var m = f.match(/\{\{\s*(\w+)\s*\}\}/);
    if (!m) return String(value / 100);
    var out;
    switch (m[1]) {
      case 'amount':
        out = formatWithDelimiters(value, 2);
        break;
      case 'amount_no_decimals':
        out = formatWithDelimiters(value, 0);
        break;
      case 'amount_with_comma_separator':
        out = formatWithDelimiters(value, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        out = formatWithDelimiters(value, 0, '.', ',');
        break;
      case 'amount_with_apostrophe_separator':
        out = formatWithDelimiters(value, 2, "'", '.');
        break;
      default:
        out = formatWithDelimiters(value, 2);
    }
    return f.replace(m[0], out);
  };
  // Predictive search gives prices like "7800.00" (decimal, no symbol).
  AdotUI.moneyFromDecimal = function (str) {
    var n = parseFloat(String(str).replace(/[^0-9.\-]/g, ''));
    if (!isFinite(n)) return '';
    return AdotUI.money(Math.round(n * 100));
  };

  /* ---------- one scroll lock for everything ---------- */
  /* Synchronous, ref-counted by id, toggles data-scroll-locked on html.
     CSS handles overflow: hidden cleanly without padding-right or scrollTo hacks. */
  var locks = new Set();

  function applyLock() {
    document.documentElement.toggleAttribute('data-scroll-locked', locks.size > 0);
  }

  AdotUI.lock = function (id) {
    locks.add(id);
    applyLock();
  };
  AdotUI.unlock = function (id) {
    locks.delete(id);
    applyLock();
  };

  /* ---------- focus trap ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  function trapTab(container, e) {
    var list = qsa(container, FOCUSABLE).filter(function (el) {
      return !el.hidden && el.getClientRects().length > 0;
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function announce(text) {
    var el = document.querySelector('[data-adot-live]');
    if (!el) return;
    el.textContent = '';
    setTimeout(function () {
      el.textContent = text;
    }, 30);
  }
  AdotUI.announce = announce;

  /* ======================================================================
     1. <header-drawer>
     ====================================================================== */
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

  /* ======================================================================
     2. <search-modal>
     ====================================================================== */
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

    skeleton() {
      var card =
        '<div class="search-modal__card search-modal__card--skeleton" aria-hidden="true">' +
        '<div class="search-modal__card-media"></div><div class="search-modal__card-info"><span class="sk sk--line"></span><span class="sk sk--short"></span></div><div class="search-modal__card-arrow-sk"></div></div>';
      return '<div class="search-modal__grid">' + new Array(5).fill(card).join('') + '</div>';
    }

    async fetchResults(query) {
      var key = query.toLowerCase();
      if (this.suggestions) this.suggestions.hidden = true;
      if (this.recentBox) this.recentBox.hidden = true;
      if (this.results) this.results.hidden = false;

      if (this.cache[key]) {
        this.render(this.cache[key], query);
        return;
      }
      if (this.reqAbort) this.reqAbort.abort();
      this.reqAbort = new AbortController();
      if (this.status) this.status.textContent = 'Searching';

      // keep old results on screen (dimmed) while the next ones load. Show a skeleton only the first time.
      if (this.results && !this.results.querySelector('.search-modal__card:not(.search-modal__card--skeleton)')) {
        this.results.innerHTML = this.skeleton();
      } else if (this.results) {
        this.results.classList.add('is-loading');
      }

      try {
        var url =
          root +
          'search/suggest.json?q=' +
          encodeURIComponent(query) +
          '&resources[type]=product,collection&resources[limit]=6&resources[limit_scope]=each&resources[options][unavailable_products]=last';
        var res = await fetch(url, { signal: this.reqAbort.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Search failed');
        var data = await res.json();
        var r = (data.resources && data.resources.results) || {};
        var out = { products: r.products || [], collections: r.collections || [] };
        this.cache[key] = out;
        this.render(out, query);
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        if (this.results) {
          this.results.classList.remove('is-loading');
          this.results.innerHTML =
            '<div class="search-modal__empty"><p>Could not load results. Press Enter to see the full search.</p></div>';
        }
      }
    }

    render(data, query) {
      if (!this.results) return;
      this.results.classList.remove('is-loading');
      this.clearPick();
      var products = data.products;
      var collections = data.collections;
      var q = escapeHtml(query);

      if (!products.length && !collections.length) {
        var tagHtml = qsa(this, '[data-search-suggestions] [data-tag-search]')
          .slice(0, 5)
          .map(function (b) {
            return '<button type="button" class="search-modal__tag" data-tag-search="' + escapeHtml(b.getAttribute('data-tag-search')) + '">' + escapeHtml(b.textContent.trim()) + '</button>';
          })
          .join('');
        var waHtml = '';
        if (this.wa) {
          var msg = encodeURIComponent('Hi! I am looking for: ' + query);
          waHtml = '<a class="search-modal__wa text-micro" href="https://wa.me/' + escapeHtml(this.wa) + '?text=' + msg + '" target="_blank" rel="noopener">Ask us on WhatsApp</a>';
        }
        this.results.innerHTML =
          '<div class="search-modal__empty"><p>Nothing found for &ldquo;<strong>' + q + '</strong>&rdquo;.</p>' +
          (tagHtml ? '<div class="search-modal__tags search-modal__tags--center">' + tagHtml + '</div>' : '') +
          waHtml +
          '</div>';
        if (this.status) this.status.textContent = 'No results for ' + query;
        return;
      }

      var self = this;
      var colHtml = '';
      if (collections.length) {
        colHtml =
          '<div class="search-modal__collections" role="group" aria-label="Collections">' +
          '<div class="search-modal__results-header"><span class="text-micro search-modal__results-title">COLLECTIONS (' + collections.length + ')</span></div>' +
          '<div class="search-modal__collection-list">' +
          collections
            .map(function (c) {
              return (
                '<a href="' + escapeHtml(c.url) + '" class="search-modal__collection" data-search-option role="option" aria-selected="false">' +
                '<span class="search-modal__collection-title">' + self.mark(c.title, query) + '</span>' +
                '<svg class="search-modal__collection-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
                '</a>'
              );
            })
            .join('') +
          '</div></div>';
      }

      var cards = products
        .map(function (p) {
          var img = p.image || (p.featured_image && p.featured_image.url) || '';
          var price = p.price ? AdotUI.moneyFromDecimal(p.price) : '';
          var was = p.compare_at_price_max && parseFloat(p.compare_at_price_max) > parseFloat(p.price || 0) ? AdotUI.moneyFromDecimal(p.compare_at_price_max) : '';
          var out = p.available === false;
          return (
            '<a href="' + escapeHtml(p.url) + '" class="search-modal__card' + (out ? ' is-out' : '') + '" data-search-option role="option" aria-selected="false">' +
            '<div class="search-modal__card-media">' +
            (img
              ? '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(p.title) + '" class="search-modal__card-img" width="200" height="250" loading="lazy">'
              : '<div class="search-modal__card-placeholder" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg></div>') +
            (out ? '<span class="search-modal__badge text-micro">Sold out</span>' : '') +
            '</div>' +
            '<div class="search-modal__card-info">' +
            '<span class="search-modal__card-title">' + self.mark(p.title, query) + '</span>' +
            '<div class="search-modal__card-meta">' +
            '<span class="search-modal__card-price text-micro">' + escapeHtml(price) + (was ? ' <s class="search-modal__card-was">' + escapeHtml(was) + '</s>' : '') + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="search-modal__card-arrow" aria-hidden="true">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
            '</div>' +
            '</a>'
          );
        })
        .join('');

      var total = products.length + collections.length;
      this.results.innerHTML =
        colHtml +
        (products.length
          ? '<div class="search-modal__results-header"><span class="text-micro search-modal__results-title">PRODUCTS (' + products.length + ')</span></div>' +
            '<div class="search-modal__grid" role="group" aria-label="Products">' + cards + '</div>'
          : '') +
        '<a href="' + root + 'search?q=' + encodeURIComponent(query) + '" class="search-modal__view-all" data-search-option role="option" aria-selected="false"><span>See all results for &ldquo;' + q + '&rdquo;</span>' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="1" y1="7" x2="13" y2="7"></line><polyline points="8 2 13 7 8 12"></polyline></svg></a>';
      if (this.status) this.status.textContent = total + ' results for ' + query;
    }

    mark(text, query) {
      var safe = escapeHtml(text);
      var term = String(query || '').trim();
      if (!term) return safe;
      var pattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return safe.replace(new RegExp('(' + escapeHtml(pattern) + ')', 'ig'), '<mark class="search-modal__mark">$1</mark>');
    }
  }
  if (!customElements.get('search-modal')) customElements.define('search-modal', SearchModal);

  /* ======================================================================
     3. <cart-drawer>
     ====================================================================== */
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

    /* ----- quantity: taps add up, one request after a short pause ----- */
    lineEl(key) {
      return this.querySelector('[data-item-key="' + key + '"]');
    }

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
    }

    flushNow() {
      var self = this;
      Object.keys(this.timers).forEach(function (k) {
        clearTimeout(self.timers[k]);
        delete self.timers[k];
        if (k in self.targets) self.send(k);
      });
    }

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
    }

    remove(key) {
      this.targets[key] = 0;
      var row = this.lineEl(key);
      if (row) row.classList.add('is-updating');
      clearTimeout(this.timers[key]);
      this.send(key);
    }

    rowMeta(row) {
      return {
        id: Number(row.getAttribute('data-variant-id')),
        quantity: Number(row.getAttribute('data-qty') || 1),
        title: row.getAttribute('data-title') || 'Item'
      };
    }

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
    }

    hideToast() {
      var toast = this.querySelector('[data-cart-toast]');
      if (!toast) return;
      toast.hidden = true;
      toast.classList.remove('is-in');
      this.undoData = null;
      clearTimeout(this.toastTimer);
    }

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
    }

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
  }
  if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);

  /* ======================================================================
     4. Sticky header + smart hide
     ====================================================================== */
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header || header.dataset.adotInit) return;
    header.dataset.adotInit = '1';
    var smart = header.dataset.smartHide === 'true';
    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      header.classList.toggle('header--scrolled', y > 20);
      if (smart) {
        var open = document.querySelector('header-drawer.is-open, search-modal.is-open, cart-drawer.is-open, dialog[open]');
        var delta = y - lastY;
        if (open || y < 120 || delta < -4) header.classList.remove('header--hidden');
        else if (delta > 6) header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }
      lastY = y;
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    // keyboard users: never hide the header while focus is inside it
    header.addEventListener('focusin', function () {
      header.classList.remove('header--hidden');
    });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeader);
  else initHeader();
  document.addEventListener('shopify:section:load', initHeader);
})();
