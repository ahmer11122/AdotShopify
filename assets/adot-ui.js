/* ==========================================================================
   ADOT shared UI helpers — money, scroll lock, focus trap, announce
   ========================================================================== */
(function () {
  'use strict';
  if (window.__adotUI) return;
  window.__adotUI = true;

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


  AdotUI.qsa = qsa;
  AdotUI.trapTab = trapTab;
  AdotUI.reduceMotion = reduceMotion;
})();
