/** THREADLINE 3.1 — peek swipe gesture */
(function () {
  'use strict';
  var TL = window.__ADOT_TL;
  if (!TL || !TL.__peek) throw new Error('[Threadline] peek must load first');
  if (TL.__swipe) return;
  TL.__swipe = true;
  var dismissPeek = TL.dismissPeek;
  var adapters = TL.adapters;
  var sp = TL.sp;
  var EASE = TL.EASE;

  function enableSwipe(card, pauseTimer, resumeTimer) {
    let startY = 0, currentY = 0, startTime = 0, dragging = false;
    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      dragging = true; startY = currentY = e.clientY; startTime = Date.now();
      try { card.setPointerCapture(e.pointerId); } catch (_) {}
      pauseTimer();
    }, { passive: true });
    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      currentY = e.clientY;
      const dy = currentY - startY;
      card.style.transform = 'translateY(' + (dy > 0 ? dy : dy * 0.18) + 'px)';
    }, { passive: true });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      try { card.releasePointerCapture(e.pointerId); } catch (_) {}
      const dy = currentY - startY, vy = dy / Math.max(1, Date.now() - startTime);
      if (dy > 60 || vy > 0.5) dismissPeek(false, 'swipe');
      else if (dy < -30) { dismissPeek(true); adapters.openCart(); }
      else {
        const from = card.style.transform || 'translateY(0px)';
        card.style.transform = '';
        const s = sp('release');
        card.animate([{ transform: from }, { transform: 'translateY(0px)' }], { duration: s.duration, easing: s.easing });
        resumeTimer();
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  }

  TL.enableSwipe = enableSwipe;
})();
