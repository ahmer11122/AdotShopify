# ADOT Theme JS Asset Split — 9 Oct 2026

## Summary

Shopify Theme Check was reporting oversized JavaScript (and one Liquid warning). We fixed the Liquid offense, split every large JS bundle into modules under Shopify’s **10KB** `AssetSizeJavaScript` recommendation, and stopped loading Threadline on pages that never add to cart.

**Result:** `shopify theme check` → **0 offenses**. Every theme JS asset is ≤ 10,000 bytes uncompressed.

---

## Why we did this

1. **Theme Check / Shopify guidance** — `AssetSizeJavaScript` flags files over 10KB. Large single files hurt maintainability and can delay parse/compile on mobile.
2. **Performance** — Threadline (~48KB) and related CSS were loading on every page (FAQ, contact, policies) even though add-to-bag only happens on home, product, collection, and search.
3. **Maintainability** — Header, Threadline, and Hanger Rail lived in monolithic files. Smaller modules are easier to review, cache, and change without touching unrelated code.
4. **One Liquid cleanup** — unused `title_check` assign in the PDP buy box triggered `UnusedAssign`.

---

## Benefits

| Benefit | Detail |
|---|---|
| Theme Check clean | No `AssetSizeJavaScript` or `UnusedAssign` offenses |
| Smaller critical path | FAQ/contact/etc. no longer download Threadline JS/CSS |
| Better caching | Changing search UI does not invalidate cart or Threadline bundles |
| Clear ownership | One concern per file (UI helpers, drawer, search shell, search results, cart ops, flight, peek, …) |
| Safer edits | Header/search/cart/Threadline/Hanger Rail can evolve independently |
| Still readable | Modules stay unminified source; threshold restored to Shopify default 10KB |

---

## What we changed (behavior)

- **Header / search / bag** — same APIs (`AdotUI`, `<header-drawer>`, `<search-modal>`, `<cart-drawer>`, sticky header). Load order is explicit in `layout/theme.liquid`.
- **Threadline** — same public API (`window.Threadline.add`, version 3.1). Loaded only on cart-capable templates via `snippets/threadline-assets.liquid`.
- **Hanger Rail** — same `<hanger-rail>` custom element; scripts loaded from `sections/interactive-gallery.liquid`.
- **PDP fabric loupe** — removed unused Liquid assign only; loupe behavior unchanged.

---

## Old files (before)

These were the large / problematic assets (or the files that referenced them):

| Old file | Approx size | Role | What happened |
|---|---:|---|---|
| `assets/adot-header-system.js` | ~40 KB | Header drawer + search + cart + sticky | Replaced by modules; file kept as **compat stub** |
| `assets/threadline.js` | ~48 KB | Full add-to-bag flight animation | Logic moved to `threadline-*.js`; file is now thin **public API** |
| `assets/hanger-rail.js` | ~53 KB | Hanger Rail section (synced during theme work) | Replaced by modules; file kept as **compat stub** |
| `layout/theme.liquid` | — | Loaded all three monoliths sitewide | Now loads header modules + conditional Threadline |
| `sections/interactive-gallery.liquid` | — | Loaded single `hanger-rail.js` | Now loads hanger-rail module chain |
| `snippets/product-buy-box.liquid` | — | Unused `title_check` | Assign removed |
| `.theme-check.yml` | — | JS threshold raised to 50KB | Restored to **10000** |

Also related (unchanged as source of truth for behavior, but no longer the only delivery vehicle):

- `assets/theme.js` (~9.9 KB) — left as-is (already under limit; `AdotCart` helpers)
- `assets/threadline.css` — still used; only loaded when Threadline JS is loaded
- `assets/hanger-rail.css` — still used by the Hanger Rail section

---

## New files (created)

### Header system

| New file | Approx size | Responsibility |
|---|---:|---|
| `assets/adot-ui.js` | ~4.4 KB | Shared `AdotUI` (money, scroll lock, focus trap, announce) |
| `assets/adot-header-drawer.js` | ~3.1 KB | `<header-drawer>` mobile nav |
| `assets/adot-search-modal.js` | ~9.5 KB | `<search-modal>` shell, events, recent searches |
| `assets/adot-search-results.js` | ~9.2 KB | Predictive search fetch + result rendering |
| `assets/adot-cart-drawer.js` | ~9.6 KB | `<cart-drawer>` open/close, section render, badge |
| `assets/adot-cart-ops.js` | ~5.5 KB | Qty changes, undo toast, WhatsApp bag link |
| `assets/adot-header-sticky.js` | ~1.7 KB | Sticky + smart-hide header |

### Threadline

| New file | Approx size | Responsibility |
|---|---:|---|
| `assets/threadline-core.js` | ~8.7 KB | Config, helpers, springs, haptics, origin |
| `assets/threadline-adapters.js` | ~7.1 KB | Cart/theme adapters |
| `assets/threadline-flyer.js` | ~5.4 KB | Flyer build + fold schedule |
| `assets/threadline-path.js` | ~8.0 KB | Flight path + bag catch effects |
| `assets/threadline-peek.js` | ~9.0 KB | Receipt peek card |
| `assets/threadline-swipe.js` | ~1.8 KB | Peek swipe dismiss |
| `assets/threadline-flow.js` | ~9.0 KB | Add-to-bag orchestration |
| `snippets/threadline-assets.liquid` | — | Conditional CSS + JS loader |

`assets/threadline.js` remains as the small public API / lifecycle entry (~1.6 KB).

### Hanger Rail

| New file | Approx size | Responsibility |
|---|---:|---|
| `assets/hanger-rail-helpers.js` | ~1.3 KB | Tuning constants + math helpers |
| `assets/hanger-rail-shell.js` | ~9.6 KB | `<hanger-rail>` element shell |
| `assets/hanger-rail-bind.js` | ~6.7 KB | Pointer / keyboard / observer binding |
| `assets/hanger-rail-layout.js` | ~6.0 KB | Mode choice + layout helpers |
| `assets/hanger-rail-tick.js` | ~8.7 KB | Animation tick / springs |
| `assets/hanger-rail-ql-setup.js` | ~9.6 KB | Quick look setup + fill |
| `assets/hanger-rail-ql-ui.js` | ~4.8 KB | Quick look thumbs / sizes / actions UI |
| `assets/hanger-rail-ql-cart.js` | ~4.9 KB | Quick look add-to-cart helpers |
| `assets/hanger-rail-ql-nav.js` | ~5.8 KB | Quick look open / flip / navigate |
| `assets/hanger-rail-ql-close.js` | ~5.5 KB | Quick look close + spin + `customElements.define` |

`assets/hanger-rail.js` and `assets/hanger-rail.css` are present for the section; JS entry is the module chain above (stub file is not loaded).

### Config / docs

| File | Change |
|---|---|
| `.theme-check.yml` | `AssetSizeJavaScript.threshold_in_bytes: 10000` |
| `sections/header.liquid` | Comment updated to list modular JS |
| `ADOT-js-asset-split-2026-10-09.md` | This document |

---

## Load order (important)

### Global (every page) — `layout/theme.liquid`

1. `theme.js`
2. `adot-ui.js`
3. `adot-header-drawer.js`
4. `adot-search-modal.js`
5. `adot-search-results.js`
6. `adot-cart-drawer.js`
7. `adot-cart-ops.js`
8. `adot-header-sticky.js`
9. Threadline modules **only if** template is index / product / collection / search (or Theme Editor)

### Hanger Rail — `sections/interactive-gallery.liquid`

helpers → shell → bind → layout → tick → ql-setup → ql-ui → ql-cart → ql-nav → ql-close

---

## How we verified

- `shopify theme check` — no offenses
- Local `shopify theme dev` — homepage 200; modular script tags present
- FAQ — Threadline assets absent
- Browser (Playwright) — `AdotUI`, search modal open/close, cart drawer open/close, `Threadline`, `hanger-rail` custom element all resolve

---

## Notes / risks

- Do **not** load modules out of order; later files depend on earlier ones (`AdotUI`, `__ADOT_TL`, `__ADOT_HR`, class stubs).
- Compat stubs (`adot-header-system.js`, `hanger-rail.js`) are intentionally tiny so a stale reference does not reintroduce a 40–50KB offense.
- `*.md` is in `.shopifyignore` for theme push; this doc stays in git for the team and is not required on the live theme CDN.
