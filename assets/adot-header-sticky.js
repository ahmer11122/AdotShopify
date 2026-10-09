/* ==========================================================================
   ADOT sticky header + smart hide
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotHeaderSticky) return;
  window.__adotHeaderSticky = true;

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
