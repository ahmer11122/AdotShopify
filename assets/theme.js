// assets/theme.js
// Minimal global theme bootstrap (nav, cart event dispatch)

document.addEventListener('DOMContentLoaded', () => {
  // Global event listener for cart updates to keep counters in sync across components
  window.addEventListener('cart:updated', (event) => {
    const cart = event.detail?.cart;
    if (!cart) return;

    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = cart.item_count;
      element.setAttribute('data-cart-count', cart.item_count);
    });
  });
});
