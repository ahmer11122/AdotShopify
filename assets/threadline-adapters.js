/** THREADLINE 3.1 — cart/theme adapters */
(function () {
  'use strict';
  var TL = window.__ADOT_TL;
  if (!TL || !TL.__core) throw new Error('[Threadline] core must load first');
  if (TL.__adapters) return;
  TL.__adapters = true;
  var isCoarse = TL.isCoarse;
  var inViewport = TL.inViewport;
  var config = TL.config;
  var el = TL.el;

  const adapters = {
    getTarget() {
      const coarse = isCoarse();
      const dockBag = document.querySelector('[data-tl-dock-bag], [data-bag-dock]');
      if (coarse && dockBag && inViewport(dockBag)) return dockBag;
      const preferred = document.querySelector('[data-tl-bag]') || document.querySelector('[data-bag-target]') || document.querySelector('.header__cart-btn');
      if (preferred) return preferred;
      // Last resort: a visible cart link that is NOT inside the drawer or the receipt card.
      const links = document.querySelectorAll('a[href*="/cart"]');
      for (const a of links) {
        if (a.closest('cart-drawer, .cart-drawer, .tl-peek')) continue;
        if (inViewport(a)) return a;
      }
      return null;
    },
    async addToCart(form) {
      const formData = form instanceof FormData ? form : new FormData(form);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), config.awaitMs);
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: formData,
          signal: ctrl.signal,
        });
        if (!res.ok) {
          let errDesc = 'Unable to add item';
          try { const e = await res.json(); errDesc = e.description || e.message || errDesc; } catch (_) {}
          throw new Error(errDesc);
        }
        const itemData = await res.json();
        let cartData = null;
        try {
          const cartRes = await fetch('/cart.js', { signal: ctrl.signal });
          if (cartRes.ok) cartData = await cartRes.json();
        } catch (_) {}
        return {
          item: itemData,
          item_count: cartData ? cartData.item_count : (itemData.item_count || 1),
          cart: cartData,
        };
      } finally {
        clearTimeout(timer);
      }
    },
    async resync() {
      try {
        const r = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
        if (!r.ok) return;
        const cart = await r.json();
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
      } catch (_) {}
    },
    getLogoUrl() {
      const logoEl = document.querySelector('.header__logo-img, .cart-drawer__logo-img, .header-drawer__logo-img, [data-header-logo] img');
      if (logoEl && (logoEl.currentSrc || logoEl.src)) return logoEl.currentSrc || logoEl.src;
      return '';
    },
    getThumbUrl(form, cta) {
      if (form) {
        const imgInput = form.querySelector('input[name="properties[_adot_image]"]');
        if (imgInput && imgInput.value) return imgInput.value;
      }
      if (cta) {
        const card = cta.closest('.product-card');
        if (card) {
          const img = card.querySelector('.product-card__image, img');
          if (img && (img.currentSrc || img.src)) return img.currentSrc || img.src;
        }
        const dock = cta.closest('.pdp-dock');
        if (dock) {
          const img = dock.querySelector('.pdp-dock__img, img');
          if (img && (img.currentSrc || img.src)) return img.currentSrc || img.src;
        }
      }
      const mainImg = document.querySelector(config.gallerySelector);
      if (mainImg && (mainImg.currentSrc || mainImg.src)) return mainImg.currentSrc || mainImg.src;
      return '';
    },
    getVariantLabel(form, cta) {
      if (cta && cta.getAttribute('data-variant-title')) {
        const t = cta.getAttribute('data-variant-title').trim();
        if (t && t.toLowerCase() !== 'add' && t.toLowerCase() !== 'add to bag') return t.length > 3 ? t.slice(0, 3) : t;
      }
      if (form) {
        const szProp = form.querySelector('input[name="properties[Size]"]');
        if (szProp && szProp.value) return szProp.value.slice(0, 3);
      }
      const selOpt = document.querySelector('.pdp-opt [data-option-selected-label]');
      if (selOpt && selOpt.textContent && selOpt.textContent.trim() !== 'Select') {
        const text = selOpt.textContent.trim();
        return text.length > 3 ? text.slice(0, 3) : text;
      }
      return '';
    },
    getProductTitle(form, cta) {
      if (form) {
        const titleProp = form.querySelector('input[name="properties[_adot_title]"]');
        if (titleProp && titleProp.value) return titleProp.value;
      }
      if (cta) {
        const card = cta.closest('.product-card');
        if (card) {
          const t = card.querySelector('.product-card__title');
          if (t && t.textContent) return t.textContent.trim();
        }
      }
      const pdpTitle = document.querySelector('.product-title, .pdp-head__title, h1');
      if (pdpTitle && pdpTitle.textContent) return pdpTitle.textContent.trim();
      return 'Tailored Garment';
    },
    getPriceFormatted(form, cta, cartResult) {
      if (cartResult && cartResult.item && cartResult.item.final_price) {
        if (window.AdotCart && typeof window.AdotCart.formatMoney === 'function') return window.AdotCart.formatMoney(cartResult.item.final_price);
        return 'Rs. ' + Math.floor(cartResult.item.final_price / 100).toLocaleString('en-PK');
      }
      if (form) {
        const prProp = form.querySelector('input[name="properties[_adot_price]"]');
        if (prProp && prProp.value) return prProp.value;
      }
      const pdpPrice = document.querySelector('.pdp-price__current, [data-btn-price], .price__item');
      if (pdpPrice && pdpPrice.textContent) return pdpPrice.textContent.trim();
      return '';
    },
    getItemCount(cartResult) {
      if (!cartResult) return 1;
      if (typeof cartResult.item_count === 'number') return cartResult.item_count;
      if (cartResult.cart && typeof cartResult.cart.item_count === 'number') return cartResult.cart.item_count;
      return 1;
    },
    getDock() { return document.querySelector('[data-tl-dock]') || document.querySelector('.pdp-dock'); },
    openCart() {
      const drawer = document.querySelector('cart-drawer, #HeaderCartDrawer, .cart-drawer');
      if (drawer && typeof drawer.open === 'function') drawer.open();
      window.dispatchEvent(new CustomEvent('cart:open'));
      document.documentElement.setAttribute('data-tf-opening', '');
      setTimeout(() => document.documentElement.removeAttribute('data-tf-opening'), 900);
    },
    refreshCart(cartResult) {
      const vId = cartResult && cartResult.item ? cartResult.item.variant_id : undefined;
      window.dispatchEvent(new CustomEvent('cart:refresh', { detail: { variantId: vId } }));
      if (cartResult && cartResult.cart) window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cartResult.cart } }));
    },
  };

  TL.adapters = adapters;
})();
