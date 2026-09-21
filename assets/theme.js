// assets/theme.js
// Minimal global theme bootstrap (nav, cart event dispatch)

// Dawn cart.js waits 300ms before writing quantity. The number on screen updates immediately.
(function () {
  const QTY_DEBOUNCE_MS = 300;
  const queues = new Map();

  function formatMoney(cents) {
    const value = Math.round(Number(cents));
    const negative = value < 0;
    const abs = Math.abs(value);
    const whole = Math.floor(abs / 100).toLocaleString('en-PK');
    const frac = abs % 100;
    const amount = frac === 0 ? whole : `${whole}.${String(frac).padStart(2, '0')}`;
    return `${negative ? '-' : ''}Rs. ${amount}`;
  }

  function findRow(root, key) {
    if (!root || !key) return null;
    return [...root.querySelectorAll('[data-item-key]')].find((row) => row.dataset.itemKey === key) || null;
  }

  function lineQty(row) {
    if (row.dataset.shownQty !== undefined && row.dataset.shownQty !== '') {
      const shown = parseInt(row.dataset.shownQty, 10);
      if (Number.isFinite(shown)) return shown;
    }
    const input = row.querySelector('[data-qty-input]');
    if (input) {
      const typed = parseInt(input.value, 10);
      return Number.isFinite(typed) ? typed : 0;
    }
    const el = row.querySelector('[data-qty-value]');
    return el ? parseInt(el.textContent, 10) || 0 : 0;
  }

  function maxForRow(root, row) {
    const raw = row.dataset.qtyMax;
    if (raw === undefined || raw === '') return null;
    const cap = parseInt(raw, 10);
    if (!Number.isFinite(cap)) return null;
    const variantId = row.dataset.variantId;
    let others = 0;
    if (variantId) {
      root.querySelectorAll('[data-item-key]').forEach((other) => {
        if (other === row || other.hidden) return;
        if (other.dataset.variantId === variantId) others += lineQty(other);
      });
    }
    return Math.max(0, cap - others);
  }

  function paintQty(row, qty) {
    row.dataset.shownQty = String(qty);
    const valueEl = row.querySelector('[data-qty-value]');
    if (valueEl) valueEl.textContent = String(qty);
    const input = row.querySelector('[data-qty-input]');
    if (input) input.value = String(qty);
    const unit = Number(row.dataset.unitPrice);
    if (Number.isFinite(unit)) {
      row.querySelectorAll('[data-line-price]').forEach((el) => {
        el.textContent = formatMoney(unit * qty);
      });
    }
    row.hidden = qty <= 0;
  }

  function showNote(row, message) {
    if (!row) return;
    const note = row.querySelector('[data-qty-note]');
    if (!note) return;
    if (!message) {
      note.hidden = true;
      note.textContent = '';
      return;
    }
    note.hidden = false;
    note.textContent = message;
  }

  function syncButtons(root) {
    root.querySelectorAll('[data-item-key]').forEach((row) => {
      const plus = row.querySelector('[data-qty-plus]');
      if (!plus) return;
      const max = maxForRow(root, row);
      const blocked = max !== null && lineQty(row) >= max;
      plus.classList.toggle('is-at-max', blocked);
      plus.setAttribute('aria-disabled', blocked ? 'true' : 'false');
    });
  }

  function paintTotals(root, cents, count) {
    root.querySelectorAll('[data-cart-subtotal], [data-cart-total]').forEach((el) => {
      el.textContent = formatMoney(cents);
    });
    if (typeof count === 'number') {
      root.querySelectorAll('[data-cart-count-local]').forEach((el) => {
        el.textContent = `[${count}]`;
      });
      document.querySelectorAll('[data-cart-count], [data-drawer-count]').forEach((el) => {
        el.textContent = `[${count}]`;
        if (el.hasAttribute('data-cart-count')) el.setAttribute('data-cart-count', String(count));
      });
    }
  }

  function adjustTotals(root, deltaQty, unitCents) {
    const total = Math.max(0, (Number(root.dataset.cartTotal) || 0) + deltaQty * unitCents);
    const count = Math.max(0, (Number(root.dataset.cartCountValue) || 0) + deltaQty);
    root.dataset.cartTotal = String(total);
    root.dataset.cartCountValue = String(count);
    paintTotals(root, total, count);
  }

  function linePending(key) {
    const state = queues.get(key);
    if (!state) return null;
    if (state.inflight || state.dirty || state.timer) return state.desired;
    return null;
  }

  function hasPending() {
    for (const state of queues.values()) {
      if (state.inflight || state.dirty || state.timer) return true;
    }
    return false;
  }

  function rootHasPending(root) {
    return [...root.querySelectorAll('[data-item-key]')].some((row) => linePending(row.dataset.itemKey) !== null);
  }

  function stockMessage(max) {
    if (max <= 0) return 'This size is out of stock.';
    if (max === 1) return 'Only 1 available.';
    return `Only ${max} available.`;
  }

  function readCap(message) {
    if (!message) return null;
    const only = String(message).match(/only add (\d+)/i);
    if (only) return parseInt(only[1], 10);
    const all = String(message).match(/\ball (\d+)/i);
    if (all) return parseInt(all[1], 10);
    return null;
  }

  function capLine(key, allowed) {
    if (!Number.isFinite(allowed)) return;
    document.querySelectorAll('[data-qty-root]').forEach((root) => {
      const row = findRow(root, key);
      if (!row) return;
      const variantId = row.dataset.variantId;
      root.querySelectorAll('[data-item-key]').forEach((sibling) => {
        if (!variantId || sibling.dataset.variantId === variantId) {
          sibling.dataset.qtyMax = String(allowed);
        }
      });
    });
  }

  function applySettled(cart) {
    if (!cart) return;
    document.querySelectorAll('[data-qty-root]').forEach((root) => {
      root.querySelectorAll('[data-item-key]').forEach((row) => {
        const key = row.dataset.itemKey;
        const item = cart.items.find((entry) => entry.key === key);
        const pending = linePending(key);
        if (!item) {
          if (pending === null || pending === 0) row.remove();
          return;
        }
        row.dataset.unitPrice = String(item.final_price);
        if (pending === null || pending === item.quantity) {
          paintQty(row, item.quantity);
          row.querySelectorAll('[data-line-price]').forEach((el) => {
            el.textContent = formatMoney(item.final_line_price);
          });
          showNote(row, '');
        }
      });

      const empty = root.querySelector('[data-cart-empty]');
      const footer = root.querySelector('.cart-drawer__footer');
      if (empty) empty.hidden = cart.item_count !== 0;
      if (footer) footer.hidden = cart.item_count === 0;

      if (!rootHasPending(root)) {
        root.dataset.cartTotal = String(cart.total_price);
        root.dataset.cartCountValue = String(cart.item_count);
        paintTotals(root, cart.total_price, cart.item_count);
      }
      syncButtons(root);
    });

    if (!hasPending()) {
      document.querySelectorAll('[data-cart-count], [data-drawer-count]').forEach((el) => {
        el.textContent = `[${cart.item_count}]`;
        if (el.hasAttribute('data-cart-count')) el.setAttribute('data-cart-count', String(cart.item_count));
      });
    }

    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));

    if (cart.item_count === 0 && document.querySelector('[data-cart-page]')) {
      window.location.reload();
    }
  }

  function mirror(origin, key, qty) {
    document.querySelectorAll('[data-qty-root]').forEach((root) => {
      if (root === origin) return;
      const row = findRow(root, key);
      if (!row) return;
      const prev = lineQty(row);
      const unit = Number(row.dataset.unitPrice) || 0;
      paintQty(row, qty);
      adjustTotals(root, qty - prev, unit);
      syncButtons(root);
    });
  }

  function schedule(key, quantity, hooks) {
    let state = queues.get(key);
    if (!state) {
      state = { desired: quantity, timer: 0, inflight: false, dirty: false, hooks };
      queues.set(key, state);
    }
    state.desired = quantity;
    state.hooks = hooks;
    clearTimeout(state.timer);
    state.timer = setTimeout(() => flush(key), QTY_DEBOUNCE_MS);
  }

  async function flush(key) {
    const state = queues.get(key);
    if (!state) return;
    if (state.inflight) {
      state.dirty = true;
      return;
    }

    const quantity = state.desired;
    state.inflight = true;
    state.dirty = false;
    clearTimeout(state.timer);
    state.timer = 0;

    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });

      if (!res.ok) {
        let message = 'That quantity is not available.';
        try {
          const err = await res.json();
          message = err.description || err.message || message;
        } catch (parseErr) {
          /* keep the fallback message */
        }
        const cart = await fetch('/cart.js').then((response) => response.json());
        const line = cart.items.find((item) => item.key === key);
        const allowed = line ? line.quantity : 0;
        const parsed = readCap(message);
        capLine(key, parsed !== null ? parsed : allowed);
        state.desired = allowed;
        state.dirty = false;
        state.inflight = false;
        applySettled(cart);
        document.querySelectorAll('[data-qty-root]').forEach((root) => {
          const row = findRow(root, key);
          if (row) showNote(row, stockMessage(parsed !== null ? parsed : allowed));
        });
        return;
      }

      const cart = await res.json();
      if (state.dirty && state.desired !== quantity) {
        state.inflight = false;
        flush(key);
        return;
      }
      state.inflight = false;
      applySettled(cart);
      if (!hasPending()) {
        document.querySelectorAll('cart-drawer').forEach((drawer) => {
          if (drawer.dataset.refreshQueued === 'true' && typeof drawer.fetchCart === 'function') {
            drawer.fetchCart();
          }
        });
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      state.inflight = false;
      if (state.hooks && state.hooks.onError) state.hooks.onError(err);
    }
  }

  function commit(root, row, next, hooks) {
    const prev = lineQty(row);
    const max = maxForRow(root, row);
    let quantity = next;
    if (quantity < 0) quantity = 0;
    if (max !== null && quantity > max) {
      quantity = max;
      showNote(row, stockMessage(max));
    } else if (quantity !== prev) {
      showNote(row, '');
    }
    if (quantity === prev && (max === null || prev <= max)) {
      syncButtons(root);
      return;
    }
    const unit = Number(row.dataset.unitPrice) || 0;
    paintQty(row, quantity);
    adjustTotals(root, quantity - prev, unit);
    syncButtons(root);
    mirror(root, row.dataset.itemKey, quantity);
    schedule(row.dataset.itemKey, quantity, hooks);
  }

  function bind(root, hooks) {
    if (!root || root.dataset.qtyBound === 'true') return;
    root.dataset.qtyBound = 'true';

    root.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-remove-item]');
      if (removeBtn && root.contains(removeBtn)) {
        event.preventDefault();
        const row = removeBtn.closest('[data-item-key]');
        if (!row) return;
        commit(root, row, 0, hooks);
        return;
      }

      const btn = event.target.closest('[data-qty-change]');
      if (!btn || !root.contains(btn)) return;
      event.preventDefault();
      const row = btn.closest('[data-item-key]');
      if (!row) return;
      const delta = parseInt(btn.getAttribute('data-qty-change'), 10);
      if (!Number.isFinite(delta)) return;
      const max = maxForRow(root, row);
      const current = lineQty(row);
      if (delta > 0 && max !== null && current >= max) {
        showNote(row, stockMessage(max));
        syncButtons(root);
        return;
      }
      commit(root, row, current + delta, hooks);
    });

    root.addEventListener('change', (event) => {
      const input = event.target.closest('[data-qty-input]');
      if (!input || !root.contains(input)) return;
      const row = input.closest('[data-item-key]');
      if (!row) return;
      const typed = parseInt(input.value, 10);
      commit(root, row, Number.isFinite(typed) ? typed : 0, hooks);
    });
  }

  function setQuantity(root, key, quantity) {
    const row = findRow(root, key);
    if (!row) return;
    const hooks = queues.get(key)?.hooks;
    commit(root, row, quantity, hooks);
  }

  window.AdotCart = {
    formatMoney,
    bind,
    setQuantity,
    findRow,
    showNote,
    applySettled,
    capLine,
    hasPending,
    syncButtons,
    paintTotals,
  };

  window.dispatchEvent(new CustomEvent('adot:cart-ready'));
})();

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
    if (!form || e.defaultPrevented) return;

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


