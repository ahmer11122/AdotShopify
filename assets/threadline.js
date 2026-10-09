/** THREADLINE 3.1 — public API */
(function () {
  'use strict';
  var TL = window.__ADOT_TL;
  if (!TL || !TL.__flow) throw new Error('[Threadline] flow must load first');
  if (window.Threadline) return;

  var el = TL.el;
  var dismissPeek = TL.dismissPeek;
  var config = TL.config;
  var adapters = TL.adapters;
  var showPeek = TL.showPeek;
  var highlightLine = TL.highlightLine;
  var spring = TL.spring;
  var addWithThreadline = TL.addWithThreadline;
  var resolveOrigin = TL.resolveOrigin;

  const killAll = () => {
    dismissPeek(true);
    document.querySelectorAll('.tl-flyer, .tl-thread, .tl-ring, .tl-knot').forEach((n) => n.remove());
  };
  window.addEventListener('pagehide', killAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) killAll(); });

  window.Threadline = {
    version: '3.1.0',
    add: addWithThreadline,
    config: config,
    adapters: adapters,
    showPeek: showPeek,
    dismissPeek: dismissPeek,
    highlightLine: highlightLine,
    killAll: killAll,
    spring: spring,
    debug: { activeFlights: () => TL._activeFlights || 0, resolveOrigin: resolveOrigin },
  };

  const initLive = () => {
    if (document.querySelector('[data-tl-live]')) return;
    const live = el('div', 'tl-sr');
    live.setAttribute('data-tl-live', '');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLive);
  else initLive();
})();
