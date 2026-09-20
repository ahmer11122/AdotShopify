// assets/theme.js
// Minimal global theme bootstrap (nav, cart event dispatch)

document.addEventListener('DOMContentLoaded', () => {
  // Global event listener for cart updates to keep counters in sync across components
  window.addEventListener('cart:updated', (event) => {
    const cart = event.detail?.cart;
    if (!cart) return;

    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = `[${cart.item_count}]`;
      element.setAttribute('data-cart-count', cart.item_count);
    });
  });

  // Global AJAX handler for Add to Cart forms
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[action*="/cart/add"]');
    if (!form) return;

    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn ? submitBtn.value || submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitBtn.tagName === 'INPUT') submitBtn.value = 'Adding...';
      else submitBtn.textContent = 'Adding...';
    }

    try {
      const formData = new FormData(form);
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Add to cart failed');

      window.dispatchEvent(new CustomEvent('cart:refresh'));
      window.dispatchEvent(new CustomEvent('cart:open'));
    } catch (err) {
      console.error('Error adding to cart:', err);
      form.submit();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitBtn.tagName === 'INPUT') submitBtn.value = originalText;
        else submitBtn.textContent = originalText;
      }
    }
  });

  // Lightweight prefetcher for smooth instantaneous page transitions
  const prefetchedUrls = new Set();
  const prefetchUrl = (url) => {
    if (!url || prefetchedUrls.has(url) || url.startsWith('#') || url.startsWith('javascript:')) return;
    prefetchedUrls.add(url);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  };

  const handleLinkPrefetch = (e) => {
    const anchor = e.target.closest('a[data-category-link], .category-tile__link, .featured-collection__item a');
    if (anchor && anchor.href && anchor.origin === window.location.origin) {
      prefetchUrl(anchor.href);
    }
  };

  document.addEventListener('mouseover', handleLinkPrefetch, { passive: true });
  document.addEventListener('touchstart', handleLinkPrefetch, { passive: true });
});


