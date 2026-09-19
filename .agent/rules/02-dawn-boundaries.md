# Dawn — reference boundaries

Dawn (`github.com/Shopify/dawn`) is cloned/available locally purely as a pattern reference. It is never a dependency of this theme and never gets merged in.

Context: Shopify's default theme for new stores is now Horizon, not Dawn — but Horizon has no public repo, so it can't be inspected in source. Dawn remains the best available open-source reference for solved commerce-UX problems. That's why it stays open, read-only, on the side.

## Allowed — read and reimplement the *behavior* only

- **Cart drawer** — `sections/main-cart-drawer.liquid` (or `snippets/cart-drawer.liquid` depending on Dawn version), `assets/component-cart-drawer.css`, `assets/component-cart-items.css`, `assets/cart.js`. Take: AJAX add-to-cart sequencing, drawer open/close state management, cart update/remove flow, empty-cart handling, focus management on open (Dawn has fixed real accessibility bugs here — check their PR history, don't reinvent from zero).
- **Predictive search** — `sections/predictive-search.liquid` + its JS. Take: debounce timing on keystroke, the Storefront predictive-search API request shape, result-rendering/highlighting logic, keyboard navigation through results.
- **Variant picker** — `snippets/product-variant-picker.liquid`, `assets/product-form.js`. Take: option/variant availability logic (disabling out-of-stock combinations), URL param syncing so variant selection is shareable/bookmarkable, "sold out" and "unavailable" state handling.

## Never do

- Copy any Dawn `.css` file into this repo, even as a "starting point to trim down."
- Copy Dawn's class names (`.card`, `.button`, `.product-form__input`) into this theme's markup — every class here comes from this theme's own BEM naming against its own tokens.
- Add Dawn as a git submodule that gets deployed, or `{% render %}` anything directly from a Dawn file path.
- Treat Dawn's visual choices (spacing, type scale, color) as anything other than noise to ignore. Only the *interaction logic* is worth taking.

## Process when pulling a Dawn pattern

1. Read the relevant Dawn file(s) fully — markup, CSS, JS — to understand the actual state machine (what triggers what, what gets toggled, what's tracked in JS vs read from the DOM).
2. Note the accessibility attributes Dawn sets (`aria-expanded`, `aria-hidden`, `role`, focus-trap behavior) — these are usually correct and worth keeping as-is.
3. Rebuild the markup against this theme's own naming and schema needs.
4. Rebuild the CSS from scratch using `var(--color-*)`/`var(--space-*)` tokens — do not adapt Dawn's CSS variables or selectors.
5. Keep only the JS that is genuinely solved-problem logic (debounce, fetch/AJAX sequencing, availability calculation). Rewrite the DOM-manipulation glue to match this theme's structure.
