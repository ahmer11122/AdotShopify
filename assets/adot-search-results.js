/* ==========================================================================
   ADOT <search-modal> — fetch, skeleton, result rendering
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotSearchResults) return;
  window.__adotSearchResults = true;
  var AdotUI = window.AdotUI;
  if (!AdotUI) throw new Error('[ADOT] adot-ui.js must load first');
  var root = AdotUI.root;
  var escapeHtml = AdotUI.escapeHtml;
  var qsa = AdotUI.qsa;
  var trapTab = AdotUI.trapTab;
  var announce = AdotUI.announce;
  var reduceMotion = AdotUI.reduceMotion;

  var SearchModal = window.__AdotSearchModal;
  if (!SearchModal) throw new Error('[ADOT] adot-search-modal.js must load first');

  Object.assign(SearchModal.prototype, {
    skeleton() {
      var card =
        '<div class="search-modal__card search-modal__card--skeleton" aria-hidden="true">' +
        '<div class="search-modal__card-media"></div><div class="search-modal__card-info"><span class="sk sk--line"></span><span class="sk sk--short"></span></div><div class="search-modal__card-arrow-sk"></div></div>';
      return '<div class="search-modal__grid">' + new Array(5).fill(card).join('') + '</div>';
    },

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
    },

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
    },

    mark(text, query) {
      var safe = escapeHtml(text);
      var term = String(query || '').trim();
      if (!term) return safe;
      var pattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return safe.replace(new RegExp('(' + escapeHtml(pattern) + ')', 'ig'), '<mark class="search-modal__mark">$1</mark>');
    }

  });

  if (!customElements.get('search-modal')) customElements.define('search-modal', SearchModal);
})();
