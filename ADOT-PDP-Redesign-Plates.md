# ADOT PDP Redesign: "Plates"

Complete spec and full code for the Shopify product page, desktop and mobile.
Seven files to replace. Everything the implementing model needs is in this document.

---

## 0. Read this first (instructions for the implementing model)

You are applying a finished design. Do not redesign it, do not "improve" it, do not merge it with the old code.

**Rules**

1. Replace each file in section 7 **in full**. Paste the code exactly as given.
2. Do not rename any class, id, `data-*` attribute, custom element or event. They reference each other across files.
3. Do not add libraries, fonts, build steps, jQuery, or `localStorage`. Everything is plain Liquid, CSS and vanilla JS.
4. Do not touch `snippets/price.liquid`, `snippets/money.liquid`, `snippets/product-card.liquid`, `layout/theme.liquid`.
5. After pasting, search the whole theme (assets, other sections, templates) for the old class prefixes below. If anything outside these seven files still references them, report it instead of deleting blindly.
   - `product-buy-box__`, `product-gallery__`, `product-sticky-bar__`, `size-guide-`, `related-items__`
6. Run `shopify theme check` and fix only errors caused by these files.

**Files**

| Path | Action |
|---|---|
| `templates/product.json` | Replace (adds spec blocks and 4 settings) |
| `sections/product.liquid` | Replace |
| `snippets/product-gallery.liquid` | Replace |
| `snippets/product-buy-box.liquid` | Replace |
| `snippets/product-sticky-bar.liquid` | Replace (file name kept, it is now the quick-size dock) |
| `snippets/size-guide.liquid` | Replace |
| `sections/complete-the-look.liquid` | Replace |
| `snippets/price.liquid`, `snippets/money.liquid` | Unchanged |

**What the code assumes the theme already provides** (every one has a fallback, so nothing breaks if one is missing)

- CSS variables: `--font-display`, `--font-body`, `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-background`, `--color-surface`, `--color-btn-bg`, `--color-btn-text`, `--color-sale`, `--color-in-stock`, `--header-height`, `--page-margin`, `--container-max`, `--ease-out`, `--ease-in-out`.
- Utility classes: `.visually-hidden`, `.container`.
- A `product-card` snippet taking `product` and `lazy_load`.
- Cart drawer listening to `cart:refresh` and `cart:open` on `window`.
- **No `overflow-x: hidden` on `html` or `body`.** It silently breaks `position: sticky`, which both the plates and the panel depend on. If the theme has it, change it to `overflow-x: clip`.

---

## 1. Design thesis

**Subject.** ADOT sells heavyweight essentials (loopback fleece hoodies, shirts, trousers) to buyers in Pakistan who pay on delivery and worry about fit. The page has two jobs: make the garment feel substantial, and get the buyer to a confident size without friction.

**The one memorable thing: the plates.** On desktop every photo is a full-height sticky plate. The next plate slides up over the current one while the current one recedes (scale and shade). It reads like turning through prints, it needs no carousel arrows, and the decision panel stays put beside it the whole time. A numbered rail on the left shows where you are and jumps to any plate.

**Everything else is quiet and disciplined.** One type system, one spacing scale, hairlines, square corners, black and white. Motion is spent in three places only: the page-load moment (first plate + title), the plate stack (scroll), and responses to what the buyer does (pick a size, add to bag, open a guide).

**What was cut on purpose** (these are the usual "generated page" tells)

- No all-caps tracked eyebrow labels, no monospace data labels, no `A · B · C` meta strings.
- No numbered accordions (they are not a sequence). The numbers on the rail are a real sequence, so they stay.
- No fade-up-on-scroll for every block. No frosted glass dock. No arrows glued to button text.

**What the buyer gets that they did not have**

| Problem | Solution |
|---|---|
| "Which size is right?" | Picking a size shows its real garment measurements right under the ruler. The size guide marks "your size" and lets you pick from the table. |
| "Do I have to scroll back up to choose a size?" | On mobile the dock opens a size row. Pick, it folds away, the button becomes "Add to bag". |
| "When will it arrive?" | Delivery dates computed from today (working days, Mon to Sat), editable in the theme editor. |
| "Is it relaxed or slim?" | A 4-step fit scale in "At a glance". |
| Price changes silently | Only the digits that changed roll, right to left. |

---

## 2. Layout maps

### Desktop (1440 x 900)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ header                                                                         │
├────┬─────────────────────────────────────────────┬────────────────────────────┤
│Hood│                                             │ Shop / Hoodies   • In stock │
│ies │          ┌─────────────────────┐            │                             │
│    │          │                     │            │ Heavyweight                 │
│    │          │      PLATE 01       │            │ Loopback Hoodie             │
│    │          │   4:5, sticky       │            │                             │
│    │          │                     │            │ Rs. 7,990                   │
│    │          │                     │            │ One-line summary.           │
│    │          │                     │            │                             │
│01──│          │                     │            │ Size  M          Size guide │
│02  │          │                     │            │ ┌────┬────┬────┬────┐       │
│03  │          │                     │            │ │ S  │ ■M │ L  │ XL │       │
│04  │          └─────────────────────┘            │ └────┴────┴────┴────┘       │
│    │   next plate slides up over this one        │ Chest 122  Length 70 ...    │
│    │   while this one scales down + dims         │ [ Add to bag     Rs. 7,990 ]│
│    │                                             │ [ Order on WhatsApp       ↗ ]│
│    │                                             │ Arrives Thu 8 Oct to Sat 10 │
│    │                                             │ ── trust strip (3 cols) ──  │
│    │                                             │ At a glance · accordions ↓  │
├────┴─────────────────────────────────────────────┴────────────────────────────┤
│ You may also like (huge)                                           Shop all ↗ │
│ [card]      [card ↓]      [card]      [card ↓]                                 │
└───────────────────────────────────────────────────────────────────────────────┘
 rail (2.75rem) | plates (fluid) | panel (25rem to 30rem, sticky, fades at bottom if it overflows)
```

### Mobile (390 x 844)

```
┌───────────────────────┐
│ header                │
├───────────────────────┤
│                       │
│  full-bleed 4:5       │   swipe: native scroll-snap, image drifts inside its frame
│  carousel             │
│                       │
│ 01 ─ 05      ▬▬ ▬ ▬ ▬ │   counter + segmented progress
├───────────────────────┤
│ Shop / Hoodies  • In stock
│ Heavyweight           │
│ Loopback Hoodie       │
│ Rs. 7,990             │
│ Summary.              │
│ Size  Select  Guide   │
│ [S ][M ][L ][XL]      │
│ Pick a size to see... │
│ [ Select a size  Rs ] │
│ [ Order on WhatsApp ] │
│ Arrives ...           │
│ trust rows, glance,   │
│ accordions            │
├───────────────────────┤
│ DOCK (after main CTA  │   tap "Select a size" -> a size row folds open inside the dock
│ leaves the screen)    │
│ [S][M][L][XL]         │
│ [img] Title  [CTA]    │
└───────────────────────┘
```

---

## 3. Type system

Five tiers. Nothing sits between them. Sentence case everywhere. Digits are always tabular.

| Tier | Use | Mobile | Desktop | Weight | Tracking | Line height |
|---|---|---|---|---|---|---|
| Title | Product name | `clamp(2.375rem, 10.4vw, 2.875rem)` | `clamp(2.75rem, 3.7vw, 4.25rem)` | 500 | -0.045em | 0.96 |
| Price | Current price | 1.5rem | 1.75rem | 500 | -0.02em | 1.1 |
| Body | Summary, accordion text | 0.9375rem | same | 400 | 0 | 1.6 |
| UI | Buttons, option labels, sizes | 0.875rem | same | 500 (labels 600) | 0 | 1 |
| Small | Crumbs, status, hints, links | 0.8125rem | same | 500 | 0 | 1.5 |

The title uses `--font-display`, everything else `--font-body`. Related-items heading: `clamp(2.5rem, 7.5vw, 6.5rem)`, weight 500, tracking -0.05em, line height 0.92. Size guide title: `clamp(1.875rem, 5vw, 2.5rem)`.

**Spacing scale** (4px base, used in these steps only): `--s-1` 0.25rem, `--s-2` 0.5rem, `--s-3` 0.75rem, `--s-4` 1rem, `--s-5` 1.5rem, `--s-6` 2rem, `--s-7` 3rem, `--s-8` 4rem.

Vertical rhythm in the panel (desktop): crumbs, 32px, title, 24px, price, 16px, summary, 48px, size block, 32px, buttons (8px apart), 16px, delivery, 32px, trust, 32px, at a glance, 32px, accordions. Mobile uses the next step down at each gap.

---

## 4. Motion spec

| # | Moment | What happens | Timing |
|---|---|---|---|
| 1 | Page load | First plate unveils bottom-up (clip-path), its image settles from 1.14 | 1000ms ease-in-out, 1300ms ease-out |
| 2 | Page load | Title words rise out of their own masks | 950ms expo-out, 55ms stagger, starts at 220ms |
| 3 | Page load | Price fades in | 700ms at 560ms |
| 4 | Scroll (desktop) | Plate under the incoming one scales to 0.93 and darkens to 50% | Scroll-linked, written by JS each frame |
| 5 | Scroll (desktop) | Each plate's image settles from 1.12 to 1 as it arrives | Scroll-linked |
| 6 | Scroll (mobile) | Image drifts inside its frame while swiping | CSS scroll-driven, progressive |
| 7 | Rail | Active numeral gets a line that draws in | 420ms ease-out |
| 8 | Hover plate | "Expand" label follows the pointer, pops in with a spring | 420ms spring |
| 9 | Pick a size | Black block travels to the chosen cell with a slight overshoot | 520ms spring |
| 10 | Pick a size | Selected-size label rolls, measurements fade up, price digits roll | 110+220ms, 300ms, 420/520ms |
| 11 | Add to bag hover | Inversion grows from the exact point where the pointer entered | 600ms expo-out |
| 12 | Add to bag click | Label rolls to "Adding" with a line sweeping the bottom edge, then a check opens in front of "Added to bag" | 900ms loop, 300ms |
| 13 | Missing size | Ruler turns oxblood and shakes once | 340ms |
| 14 | Accordion | Height and opacity animate (native `::details-content`) | 360ms |
| 15 | Dock | Slides up after the main button leaves; size row folds open | 480ms, 460ms expo-out |
| 16 | Size guide | Sheet slides in; segmented thumbs travel; cm/in flips each number in place | 560ms, 420ms spring, 460ms |
| 17 | Related items | Hover one card, the others soften to 45% | 360ms |
| 18 | Image viewer | Frame morphs into the full-screen viewer (view transition) | 520ms |

**Easing tokens** (defined in `sections/product.liquid`): `--pdp-ease` = `--ease-out` or `cubic-bezier(0.23, 1, 0.32, 1)`; `--pdp-ease-io` = `cubic-bezier(0.77, 0, 0.175, 1)`; `--pdp-ease-expo` = `cubic-bezier(0.16, 1, 0.3, 1)`; `--pdp-spring` = a `linear()` spring, with `cubic-bezier(0.34, 1.35, 0.64, 1)` as the fallback.

**Rules the motion obeys**

- Only `transform`, `opacity`, `clip-path` and `grid-template-rows` are animated. Never width/height/top/left on the scroll path.
- Everything is interruptible (WAAPI / transitions). Nothing blocks a click.
- `prefers-reduced-motion: reduce`: no unveil, no word rise, no stack scale or shade, no cursor lerp, no view transitions, transitions drop to ~0ms. Layout (sticky plates) stays.
- Hover-only effects are wrapped in `(hover: hover) and (pointer: fine)`. Touch gets `:active` press feedback instead.

---

## 5. Public contract between files (do not break)

| Event (on `window`) | Sent by | Listened by | Detail |
|---|---|---|---|
| `variant:change` | buy box | gallery, dock, size guide | `{ variant, mediaId }` |
| `pdp:state` | buy box | dock | `{ state, label, cents }` |
| `pdp:sticky-add` | dock | buy box | none |
| `pdp:select-option` | dock, size guide | buy box | `{ value, index? }` |
| `cart:refresh`, `cart:open` | buy box | theme cart drawer | none |

Other hooks: any element with `data-open-size-guide` (optional `data-size-category="hoodies|shirts|trousers"`) opens the size guide. The size data lives once, in `snippets/size-guide.liquid`, and is also exposed as `<script type="application/json" id="AdotSizeData">` for the buy box.

---

## 6. Theme editor additions

`Product Page` section: **Gallery** (expand-cursor toggle), **Fit scale** (hide / slim / regular / relaxed / oversized), **Delivery estimate** (toggle, fastest days, slowest days), plus the existing WhatsApp and trust settings. New block type **Spec row** (label + value) feeds "At a glance". Accordion blocks can now really read a product metafield through `metafield_key` (for example `custom.fabric`); if the metafield is empty the block's own text is used.

---

## 7. The code

Apply in this order.


### 7.1 `templates/product.json`

```json
{
  "sections": {
    "main": {
      "type": "product",
      "blocks": {
        "spec_fabric": {
          "type": "spec",
          "settings": {
            "label": "Fabric",
            "value": "Combed cotton loopback fleece"
          }
        },
        "spec_weight": {
          "type": "spec",
          "settings": {
            "label": "Weight",
            "value": "Heavyweight"
          }
        },
        "spec_construction": {
          "type": "spec",
          "settings": {
            "label": "Construction",
            "value": "Pre-shrunk"
          }
        },
        "details": {
          "type": "accordion",
          "settings": {
            "title": "Details & Care",
            "content": "Crafted from custom heavyweight combed cotton loopback fleece. Pre-shrunk construction for enduring shape. Machine wash cold inside-out, hang dry recommended."
          }
        },
        "shipping": {
          "type": "accordion",
          "settings": {
            "title": "Shipping & Returns",
            "content": "Nationwide delivery across Pakistan in 2–4 working days. Cash on Delivery available. Easy 7-day hassle-free exchange window."
          }
        }
      },
      "block_order": [
        "spec_fabric",
        "spec_weight",
        "spec_construction",
        "details",
        "shipping"
      ],
      "settings": {
        "show_cursor": true,
        "fit_scale": "relaxed",
        "show_delivery_estimate": true,
        "delivery_days_min": 2,
        "delivery_days_max": 4,
        "show_whatsapp_button": true,
        "whatsapp_number": "923131707080",
        "show_trust_strip": true,
        "trust_badge_1_title": "Cash on Delivery",
        "trust_badge_1_subtitle": "Pay upon arrival nationwide",
        "trust_badge_2_title": "7-Day Easy Exchange",
        "trust_badge_2_subtitle": "Hassle-free size replacement",
        "trust_badge_3_title": "2–4 Day Delivery",
        "trust_badge_3_subtitle": "Express courier dispatch"
      }
    },
    "complete_the_look": {
      "type": "complete-the-look",
      "settings": {
        "heading": "You may also like"
      }
    }
  },
  "order": [
    "main",
    "complete_the_look"
  ]
}
```

### 7.2 `sections/product.liquid`

```liquid
{% comment %}
  Product Section (PDP orchestrator) - "Plates" layout

  Desktop: [ plates (sticky stack) | sticky decision panel ]
  Mobile : [ full-bleed carousel ] then [ panel ], with a quick-size dock pinned to the bottom.

  This file owns: design tokens (--pdp-*), the two-column grid, the panel overflow fade.
  Every snippet rendered below inherits the tokens, including the <dialog> size guide.
{% endcomment %}

<!-- Google Structured Data (JSON-LD) -->
<script type="application/ld+json">
  {{ product | structured_data }}
</script>

<section
  class="section-product section-product--{{ section.id }}"
  data-section-id="{{ section.id }}"
  data-section-type="product"
>
  <div class="section-product__inner">
    <div class="section-product__gallery">
      {% render 'product-gallery', product: product, section: section %}
    </div>

    <div class="section-product__panel" data-panel>
      {% render 'product-buy-box', product: product, section: section %}
    </div>
  </div>

  {% render 'product-sticky-bar', product: product, section: section %}
  {% render 'size-guide' %}
</section>

<style>
  .section-product {
    /* ------------------------------------------------------------ tokens */
    --pdp-top: calc(var(--header-height, 80px) + 1rem);
    --pdp-stage-h: calc(100dvh - var(--pdp-top) - 1rem);

    --pdp-ink: var(--color-text, #111);
    --pdp-ink-2: var(--color-text-muted, #555);
    --pdp-ink-3: var(--color-text-subtle, #6b6b6b);
    --pdp-paper: var(--color-background, #fff);
    --pdp-sunk: var(--color-surface, #f5f5f5);
    --pdp-line: oklch(0 0 0 / 0.1);
    --pdp-line-2: oklch(0 0 0 / 0.24);
    --pdp-sale: var(--color-sale, #991b1b);
    --pdp-ok: var(--color-in-stock, #166534);
    --pdp-btn-bg: var(--color-btn-bg, #111);
    --pdp-btn-fg: var(--color-btn-text, #fff);

    --pdp-font-display: var(--font-display, var(--font-body, system-ui, sans-serif));
    --pdp-font: var(--font-body, system-ui, sans-serif);

    /* Type scale: five tiers, nothing in between */
    --pdp-fs-title: clamp(2.375rem, 10.4vw, 2.875rem);
    --pdp-fs-price: 1.5rem;
    --pdp-fs-body: 0.9375rem;
    --pdp-fs-ui: 0.875rem;
    --pdp-fs-small: 0.8125rem;

    /* Spacing: 4px base, used in these steps only */
    --s-1: 0.25rem;
    --s-2: 0.5rem;
    --s-3: 0.75rem;
    --s-4: 1rem;
    --s-5: 1.5rem;
    --s-6: 2rem;
    --s-7: 3rem;
    --s-8: 4rem;

    /* Motion */
    --pdp-ease: var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
    --pdp-ease-io: var(--ease-in-out, cubic-bezier(0.77, 0, 0.175, 1));
    --pdp-ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --pdp-spring: cubic-bezier(0.34, 1.35, 0.64, 1);

    position: relative;
    padding-top: clamp(0.5rem, 2vw, 1.5rem);
    padding-bottom: clamp(3rem, 5vw, 5rem);
    background-color: var(--pdp-paper);
    color: var(--pdp-ink);
  }

  @supports (transition-timing-function: linear(0, 1)) {
    .section-product {
      --pdp-spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1);
    }
  }

  .section-product__inner {
    max-width: var(--container-max, 1440px);
    margin: 0 auto;
    padding-inline: var(--page-margin, 1rem);
  }

  /* ----------------------------------------------------------- shared bits */
  .section-product .pdp-label {
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    letter-spacing: 0;
    color: var(--pdp-ink-3);
  }

  /* Text link: underline draws out from the left on hover */
  .section-product .pdp-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--pdp-ink);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    background-image: linear-gradient(currentColor, currentColor);
    background-repeat: no-repeat;
    background-size: 100% 1px;
    background-position: 0 calc(50% + 0.7em);
    transition: background-size 320ms var(--pdp-ease);
  }

  @media (hover: hover) and (pointer: fine) {
    .section-product .pdp-link {
      background-size: 0% 1px;
    }

    .section-product .pdp-link:hover,
    .section-product .pdp-link:focus-visible {
      background-size: 100% 1px;
    }
  }

  .section-product :focus-visible {
    outline: 2px solid var(--pdp-ink);
    outline-offset: 3px;
  }

  /* Per-digit price roll (built by JS, collapses back to plain text) */
  .section-product .odo {
    display: inline-grid;
    clip-path: inset(0); /* clip, not overflow: keeps the text baseline identical */
  }

  .section-product .odo > span {
    grid-area: 1 / 1;
    white-space: pre;
  }

  /* ------------------------------------------------------------------ desktop */
  @media (min-width: 990px) {
    .section-product__inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) clamp(25rem, 31vw, 30rem);
      column-gap: clamp(2.5rem, 5vw, 6rem);
      align-items: start;
    }

    .section-product__panel {
      position: sticky;
      top: var(--pdp-top);
      max-height: calc(100dvh - var(--pdp-top) - 1rem);
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: none;
      padding-bottom: var(--s-4);
    }

    .section-product__panel::-webkit-scrollbar {
      display: none;
    }

    /* Tells the buyer there is more below the fold of the panel */
    .section-product__panel[data-more] {
      -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 3.5rem), transparent);
      mask-image: linear-gradient(to bottom, #000 calc(100% - 3.5rem), transparent);
    }

    .section-product {
      --pdp-fs-title: clamp(2.75rem, 3.7vw, 4.25rem);
      --pdp-fs-price: 1.75rem;
    }
  }

  /* ------------------------------------------------------------------- mobile */
  @media (max-width: 989px) {
    .section-product {
      padding-top: 0;
      padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
    }

    .section-product__inner {
      display: flex;
      flex-direction: column;
      gap: var(--s-5);
    }

    .section-product__panel {
      width: 100%;
    }
  }
</style>

<script>
  (function () {
    var panel = document.querySelector('.section-product--{{ section.id }} [data-panel]');
    if (!panel) return;
    var check = function () {
      var more = panel.scrollHeight - panel.scrollTop - panel.clientHeight > 6 && panel.scrollHeight > panel.clientHeight;
      panel.toggleAttribute('data-more', more);
    };
    panel.addEventListener('scroll', check, { passive: true });
    panel.addEventListener('toggle', check, true);
    window.addEventListener('resize', check, { passive: true });
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(check);
      ro.observe(panel);
      if (panel.firstElementChild) ro.observe(panel.firstElementChild);
    }
    check();
  })();
</script>

{% schema %}
{
  "name": "Product Page",
  "tag": "section",
  "class": "section-product-wrapper",
  "settings": [
    {
      "type": "header",
      "content": "Gallery"
    },
    {
      "type": "checkbox",
      "id": "show_cursor",
      "label": "Show \"Expand\" cursor over images (desktop)",
      "default": true
    },
    {
      "type": "header",
      "content": "Fit scale"
    },
    {
      "type": "select",
      "id": "fit_scale",
      "label": "How this product fits",
      "options": [
        { "value": "none", "label": "Hide" },
        { "value": "slim", "label": "Slim" },
        { "value": "regular", "label": "Regular" },
        { "value": "relaxed", "label": "Relaxed" },
        { "value": "oversized", "label": "Oversized" }
      ],
      "default": "relaxed"
    },
    {
      "type": "header",
      "content": "Delivery estimate"
    },
    {
      "type": "checkbox",
      "id": "show_delivery_estimate",
      "label": "Show estimated delivery dates",
      "default": true,
      "info": "Counts working days (Mon to Sat) from the visitor's date."
    },
    {
      "type": "range",
      "id": "delivery_days_min",
      "label": "Fastest delivery (working days)",
      "min": 1,
      "max": 10,
      "step": 1,
      "default": 2
    },
    {
      "type": "range",
      "id": "delivery_days_max",
      "label": "Slowest delivery (working days)",
      "min": 1,
      "max": 14,
      "step": 1,
      "default": 4
    },
    {
      "type": "header",
      "content": "WhatsApp Direct Ordering"
    },
    {
      "type": "checkbox",
      "id": "show_whatsapp_button",
      "label": "Enable WhatsApp Order Button",
      "default": true
    },
    {
      "type": "text",
      "id": "whatsapp_number",
      "label": "WhatsApp Phone Number",
      "default": "923131707080",
      "info": "Format: 923XXXXXXXXX without '+' or leading zero"
    },
    {
      "type": "header",
      "content": "Reassurance Trust Badges"
    },
    {
      "type": "checkbox",
      "id": "show_trust_strip",
      "label": "Show Reassurance Strip",
      "default": true
    },
    {
      "type": "text",
      "id": "trust_badge_1_title",
      "label": "Badge 1 Title",
      "default": "Cash on Delivery"
    },
    {
      "type": "text",
      "id": "trust_badge_1_subtitle",
      "label": "Badge 1 Subtitle",
      "default": "Pay upon arrival nationwide"
    },
    {
      "type": "text",
      "id": "trust_badge_2_title",
      "label": "Badge 2 Title",
      "default": "7-Day Easy Exchange"
    },
    {
      "type": "text",
      "id": "trust_badge_2_subtitle",
      "label": "Badge 2 Subtitle",
      "default": "Hassle-free size replacement"
    },
    {
      "type": "text",
      "id": "trust_badge_3_title",
      "label": "Badge 3 Title",
      "default": "2–4 Day Delivery"
    },
    {
      "type": "text",
      "id": "trust_badge_3_subtitle",
      "label": "Badge 3 Subtitle",
      "default": "Express courier dispatch"
    }
  ],
  "blocks": [
    {
      "type": "spec",
      "name": "Spec row",
      "settings": [
        {
          "type": "text",
          "id": "label",
          "label": "Label",
          "default": "Fabric"
        },
        {
          "type": "text",
          "id": "value",
          "label": "Value",
          "default": "Combed cotton loopback fleece"
        }
      ]
    },
    {
      "type": "accordion",
      "name": "Accordion Item",
      "settings": [
        {
          "type": "text",
          "id": "title",
          "label": "Accordion Title",
          "default": "Fabric & Material"
        },
        {
          "type": "textarea",
          "id": "content",
          "label": "Content",
          "default": "Heavyweight combed cotton with reinforced stitching. Pre-shrunk for maximum durability."
        },
        {
          "type": "text",
          "id": "metafield_key",
          "label": "Product Metafield Key (Optional)",
          "info": "e.g. custom.fabric. If populated, overrides the default text above."
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Product Page",
      "blocks": [
        { "type": "spec", "settings": { "label": "Fabric", "value": "Combed cotton loopback fleece" } },
        { "type": "spec", "settings": { "label": "Weight", "value": "Heavyweight" } },
        { "type": "spec", "settings": { "label": "Construction", "value": "Pre-shrunk" } },
        {
          "type": "accordion",
          "settings": {
            "title": "Details & Care",
            "content": "Crafted from premium heavyweight combed cotton. Machine wash cold inside-out, hang dry recommended."
          }
        },
        {
          "type": "accordion",
          "settings": {
            "title": "Shipping & Returns",
            "content": "Delivered across Pakistan in 2–4 working days via express courier. Cash on Delivery supported. Easy 7-day exchange window if the fit isn't right."
          }
        }
      ]
    }
  ]
}
{% endschema %}
```

### 7.3 `snippets/product-gallery.liquid`

```liquid
{% doc %}
  Product Gallery - "Plates"

  Desktop
  - Every image is a sticky plate. The next plate slides up over the current one, which recedes
    (scale + shade) while it is covered. The image inside each plate settles from a slight zoom as it arrives.
  - A sticky rail on the left carries the product type and a numbered index. Numbers are real, they jump to a plate.
  - A small "Expand" label follows the pointer over the images.

  Mobile
  - Full-bleed native scroll-snap carousel, 4:5, with a counter and segmented progress.
  - Image drifts inside its frame while swiping (CSS scroll-driven animation, progressive enhancement).

  Both
  - Tap or click opens a full-screen viewer. The frame morphs into the viewer (view transition);
    on desktop the viewer zooms 2x and pans with the pointer.
  - Card -> PDP: the first frame receives the shared `pdp-hero` transition name on arrival.
  - Variant sync: choosing a size that has its own media scrolls to that plate.

  @param {product} product - The product object
  @param {section} section - The parent section (reads show_cursor)
{% enddoc %}

{%- liquid
  assign total = product.images.size
  assign total_label = total | prepend: '00' | slice: -2, 2
  assign view_label = product.title | escape
  assign rail_label = product.type | default: product.vendor | escape

  assign solo = false
  if total < 2
    assign solo = true
  endif

  assign cursor_on = true
  if section.settings.show_cursor == false
    assign cursor_on = false
  endif
-%}

<product-gallery
  class="pdp-plates{% if solo %} pdp-plates--solo{% endif %}"
  data-product-gallery
  data-total="{{ total }}"
  data-cursor="{{ cursor_on }}"
>
  {%- unless solo -%}
    <aside class="pdp-rail" aria-hidden="true">
      <span class="pdp-rail__label">{{ rail_label }}</span>
      <ol class="pdp-rail__list">
        {%- for image in product.images -%}
          <li>
            <button
              type="button"
              tabindex="-1"
              class="pdp-rail__btn{% if forloop.first %} is-on{% endif %}"
              data-rail-jump="{{ forloop.index0 }}"
            >
              <span>{{ forloop.index | prepend: '00' | slice: -2, 2 }}</span><i></i>
            </button>
          </li>
        {%- endfor -%}
      </ol>
    </aside>

    <div class="pdp-hud" aria-hidden="true">
      <span class="pdp-hud__count">
        <span data-gallery-current>01</span><i></i><span>{{ total_label }}</span>
      </span>
      <span class="pdp-hud__segs">
        {%- for image in product.images -%}
          <i class="pdp-hud__seg{% if forloop.first %} is-on{% endif %}" data-gallery-segment></i>
        {%- endfor -%}
      </span>
    </div>
  {%- endunless -%}

  <div class="pdp-plates__track" data-gallery-track>
    {%- if total > 0 -%}
      {%- for image in product.images -%}
        {%- liquid
          assign loading_val = 'lazy'
          assign priority_val = 'auto'
          if forloop.first
            assign loading_val = 'eager'
            assign priority_val = 'high'
          endif
          assign frame_alt = image.alt | default: view_label
        -%}
        <div class="pdp-plate" data-media-id="{{ image.id }}" data-index="{{ forloop.index }}">
          <button
            type="button"
            class="pdp-plate__open"
            data-gallery-open
            aria-label="Open image {{ forloop.index }} of {{ total }} full screen"
            aria-haspopup="dialog"
          >
            <span class="pdp-plate__frame">
              <span class="pdp-plate__img">
                {{
                  image
                  | image_url: width: 1600
                  | image_tag:
                    loading: loading_val,
                    fetchpriority: priority_val,
                    widths: '600, 800, 1000, 1200, 1400, 1600',
                    sizes: '(min-width: 990px) 50vw, 100vw',
                    alt: frame_alt
                }}
              </span>
              <span class="pdp-plate__shade" aria-hidden="true"></span>
            </span>
          </button>
        </div>
      {%- endfor -%}
    {%- else -%}
      <div class="pdp-plate pdp-plate--placeholder">
        <span class="pdp-plate__frame">
          {{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}
        </span>
      </div>
    {%- endif -%}
  </div>

  {%- if cursor_on and total > 0 -%}
    <span class="pdp-cursor" data-cursor aria-hidden="true"><span>Expand</span></span>
  {%- endif -%}

  {%- if total > 0 -%}
    <dialog class="pdp-viewer" data-viewer aria-label="{{ view_label }} images">
      <div class="pdp-viewer__bar">
        <span class="pdp-viewer__count" data-viewer-count aria-live="polite">01 / {{ total_label }}</span>
        <button type="button" class="pdp-viewer__close" data-viewer-close>
          <span>Close</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="pdp-viewer__track" data-viewer-track>
        {%- for image in product.images -%}
          <div class="pdp-viewer__slide" data-viewer-slide data-index="{{ forloop.index }}">
            <img
              class="pdp-viewer__img"
              alt="{{ image.alt | default: view_label | escape }}"
              width="{{ image.width }}"
              height="{{ image.height }}"
              data-hi="{{ image | image_url: width: 2000 }}"
              decoding="async"
            >
          </div>
        {%- endfor -%}
      </div>

      {%- unless solo -%}
        <button type="button" class="pdp-viewer__nav pdp-viewer__nav--prev" data-viewer-prev aria-label="Previous image">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 3L5 9l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button type="button" class="pdp-viewer__nav pdp-viewer__nav--next" data-viewer-next aria-label="Next image">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M7 3l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {%- endunless -%}
    </dialog>
  {%- endif -%}
</product-gallery>

<script>
  /* Card -> PDP shared element. Must be registered synchronously, before first render. */
  window.addEventListener('pagereveal', function (event) {
    if (!event.viewTransition) return;
    var arrived = false;
    try {
      arrived = sessionStorage.getItem('adot-pdp-vt') === '1';
      sessionStorage.removeItem('adot-pdp-vt');
    } catch (err) {}
    if (!arrived) return;
    var hero = document.querySelector('[data-gallery-track] > .pdp-plate:first-child .pdp-plate__frame');
    if (!hero) return;
    hero.style.viewTransitionName = 'pdp-hero';
    document.documentElement.setAttribute('data-pdp-vt', '');
    event.viewTransition.finished.then(function () {
      hero.style.viewTransitionName = '';
    });
  });
</script>

<style>
  .pdp-plates {
    position: relative;
    display: block;
    width: 100%;
  }

  /* ------------------------------------------------------------------ plates */
  .pdp-plate {
    position: relative;
    min-width: 0;
  }

  .pdp-plate__open {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    border: 0;
    background: none;
    color: inherit;
    cursor: zoom-in;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .pdp-plate__frame {
    position: relative;
    display: block;
    width: 100%;
    overflow: hidden;
    background-color: var(--pdp-sunk, #f5f5f5);
  }

  /* 1px pure black at 10%, never a tinted neutral */
  .pdp-plate__frame::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    outline: 1px solid oklch(0 0 0 / 0.1);
    outline-offset: -1px;
    pointer-events: none;
  }

  .pdp-plate__img {
    position: absolute;
    inset: 0;
    display: block;
  }

  .pdp-plate__img img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .pdp-plate__shade {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: #000;
    opacity: 0;
    pointer-events: none;
  }

  .pdp-plate--placeholder .pdp-plate__frame {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 4 / 5;
  }

  .pdp-plate--placeholder svg {
    width: 40%;
    height: 40%;
    opacity: 0.3;
  }

  /* ------------------------------------------------------------ rail + hud */
  .pdp-rail,
  .pdp-hud {
    display: none;
  }

  .pdp-hud {
    z-index: 4;
    pointer-events: none;
    color: #fff;
    mix-blend-mode: difference; /* reads on white paper and on dark garments */
    font-family: var(--pdp-font);
    font-size: 0.8125rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .pdp-hud__count {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pdp-hud__count i {
    width: 1rem;
    height: 1px;
    background: currentColor;
    opacity: 0.6;
  }

  /* ----------------------------------------------------------------- desktop */
  @media (min-width: 990px) {
    .pdp-plates {
      display: grid;
      grid-template-columns: 2.75rem minmax(0, 1fr);
      column-gap: clamp(1rem, 2vw, 2rem);
    }

    .pdp-plates--solo {
      grid-template-columns: minmax(0, 1fr);
    }

    .pdp-rail {
      position: sticky;
      top: var(--pdp-top);
      height: var(--pdp-stage-h);
      align-self: start;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
    }

    .pdp-rail__label {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      white-space: nowrap;
      font-family: var(--pdp-font);
      font-size: var(--pdp-fs-small);
      font-weight: 500;
      color: var(--pdp-ink-3);
    }

    .pdp-rail__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .pdp-rail__btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 1.875rem;
      padding: 0;
      border: 0;
      background: none;
      color: var(--pdp-ink-3);
      font-family: var(--pdp-font);
      font-size: var(--pdp-fs-small);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: color 240ms var(--pdp-ease);
    }

    .pdp-rail__btn i {
      display: block;
      width: 0.75rem;
      height: 1px;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: left center;
      transition: transform 420ms var(--pdp-ease);
    }

    .pdp-rail__btn.is-on {
      color: var(--pdp-ink);
    }

    .pdp-rail__btn.is-on i {
      transform: scaleX(1);
    }

    @media (hover: hover) and (pointer: fine) {
      .pdp-rail__btn:hover {
        color: var(--pdp-ink);
      }
    }

    .pdp-plates__track {
      container-type: inline-size;
      min-width: 0;
    }

    /* One plate per screen, 4:5 inside it, stacking as you scroll */
    .pdp-plate {
      --plate-h: max(26rem, min(var(--pdp-stage-h), 62rem));
      position: sticky;
      top: var(--pdp-top);
      height: var(--plate-h);
      margin-bottom: 1.25rem;
    }

    @supports (width: 1cqw) {
      .pdp-plate {
        --plate-h: max(26rem, min(var(--pdp-stage-h), 125cqw));
      }
    }

    .pdp-plate:last-child {
      margin-bottom: 0;
    }

    .pdp-plate__frame {
      height: 100%;
      width: auto;
      max-width: 100%;
      aspect-ratio: 4 / 5;
      margin-inline: auto;
      transform-origin: 50% 30%;
    }

    .pdp-plate--placeholder .pdp-plate__frame {
      width: 100%;
      height: auto;
    }

    /* JS writes --enter (1 -> 0 as a plate arrives) and --cover (0 -> 1 as the next plate covers it) */
    .pdp-plate__frame {
      transform: scale(calc(1 - var(--cover, 0) * 0.07));
    }

    .pdp-plate__shade {
      opacity: calc(var(--cover, 0) * 0.5);
    }

    .pdp-plate__img {
      transform: scale(calc(1 + var(--enter, 0) * 0.12));
    }

    /* Sticky index lives in the rail; the HUD is for the carousel only */
    .pdp-hud {
      display: none;
    }
  }

  /* ------------------------------------------------------------------ mobile */
  @media (max-width: 989px) {
    .pdp-plates__track {
      display: flex;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      margin-inline: calc(-1 * var(--page-margin, 1rem));
      touch-action: pan-x pan-y;
    }

    .pdp-plates__track::-webkit-scrollbar {
      display: none;
    }

    .pdp-plate {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      aspect-ratio: 4 / 5;
      view-timeline: --plate inline;
    }

    .pdp-plate__frame {
      height: 100%;
    }

    .pdp-hud {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-inline: 1rem;
    }

    .pdp-hud__segs {
      display: flex;
      flex: 1;
      gap: 3px;
      max-width: 9rem;
      margin-inline-start: auto;
    }

    .pdp-hud__seg {
      position: relative;
      flex: 1;
      height: 2px;
      background: rgb(255 255 255 / 0.35);
      overflow: hidden;
    }

    .pdp-hud__seg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: left center;
      transition: transform 360ms var(--pdp-ease);
    }

    .pdp-hud__seg.is-on::after {
      transform: scaleX(1);
    }

    .pdp-cursor {
      display: none;
    }
  }

  /* ------------------------------------------------------------------ cursor */
  .pdp-cursor {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 12;
    pointer-events: none;
    opacity: 0;
    transition: opacity 160ms var(--pdp-ease);
  }

  .pdp-cursor.is-on {
    opacity: 1;
  }

  .pdp-cursor span {
    display: block;
    padding: 0.5rem 0.875rem;
    background: var(--pdp-btn-bg, #111);
    color: var(--pdp-btn-fg, #fff);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    transform: translate(16px, 16px) scale(0.6);
    transform-origin: 0 0;
    transition: transform 420ms var(--pdp-spring);
  }

  .pdp-cursor.is-on span {
    transform: translate(16px, 16px) scale(1);
  }

  /* ------------------------------------------------------------------ motion */
  @media (prefers-reduced-motion: no-preference) {
    /* The one load moment: the first plate unveils bottom-up and its image settles.
       Skipped when the card -> PDP shared-element morph runs. */
    .pdp-plates__track > .pdp-plate:first-child .pdp-plate__frame {
      animation: pdp-unveil 1000ms var(--pdp-ease-io) backwards;
    }

    .pdp-plates__track > .pdp-plate:first-child .pdp-plate__img {
      animation: pdp-settle 1300ms var(--pdp-ease) backwards;
    }

    [data-pdp-vt] .pdp-plates__track > .pdp-plate:first-child .pdp-plate__frame,
    [data-pdp-vt] .pdp-plates__track > .pdp-plate:first-child .pdp-plate__img {
      animation: none;
    }

    /* Mobile: image drifts inside the frame while swiping */
    @media (max-width: 989px) {
      @supports (animation-timeline: view()) {
        .pdp-plate__img {
          animation: pdp-pan linear both;
          animation-timeline: --plate;
        }

        .pdp-plates__track > .pdp-plate:first-child .pdp-plate__img {
          animation: pdp-pan linear both;
          animation-timeline: --plate;
        }
      }
    }
  }

  @keyframes pdp-unveil {
    from {
      clip-path: inset(100% 0 0 0);
    }
    to {
      clip-path: inset(0 0 0 0);
    }
  }

  @keyframes pdp-settle {
    from {
      transform: scale(1.14);
    }
  }

  @keyframes pdp-pan {
    0% {
      transform: translateX(7%) scale(1.14);
    }
    50% {
      transform: translateX(0) scale(1.14);
    }
    100% {
      transform: translateX(-7%) scale(1.14);
    }
  }

  /* ------------------------------------------------------------------ viewer */
  .pdp-viewer {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--pdp-paper, #fff);
    color: var(--pdp-ink, #111);
    overflow: hidden;
    opacity: 0;
    transition:
      opacity 220ms var(--pdp-ease),
      display 220ms allow-discrete,
      overlay 220ms allow-discrete;
  }

  .pdp-viewer[open] {
    opacity: 1;
  }

  @starting-style {
    .pdp-viewer[open]:not([data-vt]) {
      opacity: 0;
    }
  }

  .pdp-viewer[data-vt] {
    transition: none;
  }

  .pdp-viewer::backdrop {
    background: transparent;
  }

  html:has(.pdp-viewer[open]) {
    overflow: hidden;
  }

  .pdp-viewer__bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: max(0.5rem, env(safe-area-inset-top, 0px)) 0.5rem 0.5rem 1.25rem;
    pointer-events: none;
  }

  .pdp-viewer__count {
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .pdp-viewer__close {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0 0.875rem;
    border: 0;
    background: none;
    color: inherit;
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform 160ms var(--pdp-ease), opacity 160ms var(--pdp-ease);
  }

  .pdp-viewer__close:active {
    transform: scale(0.96);
  }

  .pdp-viewer__track {
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overscroll-behavior: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .pdp-viewer__track::-webkit-scrollbar {
    display: none;
  }

  .pdp-viewer__slide {
    flex: 0 0 100%;
    height: 100%;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    padding: 3.5rem 0 max(1rem, env(safe-area-inset-bottom, 0px));
    overflow: hidden;
    display: flex;
  }

  .pdp-viewer__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
    will-change: transform;
  }

  .pdp-viewer__nav {
    position: absolute;
    top: 50%;
    z-index: 3;
    display: none;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-top: -24px;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    transition: transform 160ms var(--pdp-ease), opacity 160ms var(--pdp-ease);
  }

  .pdp-viewer__nav--prev {
    left: 1rem;
  }

  .pdp-viewer__nav--next {
    right: 1rem;
  }

  .pdp-viewer__nav:active {
    transform: scale(0.96);
  }

  @media (hover: hover) and (pointer: fine) {
    .pdp-viewer__nav {
      display: inline-flex;
    }

    .pdp-viewer__slide {
      padding-inline: 6rem;
      cursor: zoom-in;
    }

    .pdp-viewer__slide.is-zoomed {
      cursor: zoom-out;
    }

    .pdp-viewer__close:hover,
    .pdp-viewer__nav:hover {
      opacity: 0.6;
    }
  }

  ::view-transition-group(pdp-viewer-img) {
    animation-duration: 520ms;
    animation-timing-function: var(--pdp-ease-io, cubic-bezier(0.77, 0, 0.175, 1));
  }

  ::view-transition-old(pdp-viewer-img),
  ::view-transition-new(pdp-viewer-img) {
    height: 100%;
    object-fit: cover;
    overflow: clip;
  }

  @media (prefers-reduced-motion: reduce) {
    .pdp-rail__btn i,
    .pdp-hud__seg::after,
    .pdp-cursor span {
      transition: none;
    }

    .pdp-viewer {
      transition-duration: 0.01ms;
    }
  }
</style>

<script>
  (function () {
    var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };

    class ProductGallery extends HTMLElement {
      connectedCallback() {
        if (this._ready) return;
        this._ready = true;

        this.track = this.querySelector('[data-gallery-track]');
        this.plates = [...this.querySelectorAll('.pdp-plate')];
        this.counters = [...this.querySelectorAll('[data-gallery-current]')];
        this.segments = [...this.querySelectorAll('[data-gallery-segment]')];
        this.railBtns = [...this.querySelectorAll('[data-rail-jump]')];
        this.total = this.plates.length;
        this.index = 0;
        this._live = true;

        this.viewer = this.querySelector('[data-viewer]');
        this.viewerTrack = this.querySelector('[data-viewer-track]');
        this.slides = [...this.querySelectorAll('[data-viewer-slide]')];
        this.viewerCount = this.querySelector('[data-viewer-count]');
        this.viewerIndex = 0;

        this.desktop = window.matchMedia('(min-width: 990px)');
        this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

        this.queue = () => {
          if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = 0; this.paint(); });
        };

        if (this.track) {
          window.addEventListener('scroll', this.queue, { passive: true });
          window.addEventListener('resize', this.queue, { passive: true });
          this.track.addEventListener('scroll', this.queue, { passive: true });
        }

        /* Only do per-frame work while the gallery is on screen */
        if ('IntersectionObserver' in window) {
          this._io = new IntersectionObserver((entries) => {
            this._live = entries[0].isIntersecting;
            if (this._live) this.queue();
          }, { rootMargin: '200px 0px' });
          this._io.observe(this);
        }

        this.railBtns.forEach((btn) => {
          btn.addEventListener('click', () => this.scrollToPlate(parseInt(btn.dataset.railJump, 10), true));
        });

        this.plates.forEach((plate, i) => {
          const opener = plate.querySelector('[data-gallery-open]');
          if (opener) opener.addEventListener('click', () => this.openViewer(i));
        });

        this.initCursor();
        if (this.viewer) this.initViewer();
        this.paint();

        this._onVariant = (e) => this.onVariantChange(e);
        window.addEventListener('variant:change', this._onVariant);
      }

      disconnectedCallback() {
        window.removeEventListener('variant:change', this._onVariant);
        window.removeEventListener('scroll', this.queue);
        window.removeEventListener('resize', this.queue);
        if (this._hideCursor) window.removeEventListener('blur', this._hideCursor);
        if (this._io) this._io.disconnect();
      }

      pad(n) {
        return String(n).padStart(2, '0');
      }

      /* ---------------------------------------------------------------- paint */
      paint() {
        if (!this._live || !this.track || this.total < 1) return;
        if (this.desktop.matches) this.paintStack();
        else this.paintCarousel();
      }

      stickyTop() {
        const t = parseFloat(getComputedStyle(this.plates[0]).top);
        return isNaN(t) ? 0 : t;
      }

      /* Desktop: one read pass, one write pass */
      paintStack() {
        const vh = window.innerHeight;
        const top = this.stickyTop();
        const still = this.reduce.matches;
        const rects = this.plates.map((p) => p.getBoundingClientRect());
        let active = 0;

        this.plates.forEach((plate, i) => {
          const r = rects[i];
          if (!still) {
            const next = rects[i + 1];
            const enter = clamp((r.top - top) / vh, 0, 1);
            const cover = next ? clamp(1 - (next.top - top) / r.height, 0, 1) : 0;
            plate.style.setProperty('--enter', enter.toFixed(3));
            plate.style.setProperty('--cover', cover.toFixed(3));
          }
          if (r.top - top <= r.height * 0.5) active = i;
        });

        this.setIndex(active);
      }

      paintCarousel() {
        const w = this.track.clientWidth || 1;
        this.setIndex(clamp(Math.round(this.track.scrollLeft / w), 0, this.total - 1));
      }

      setIndex(i) {
        if (i === this.index && this._painted) return;
        this._painted = true;
        this.index = i;
        this.counters.forEach((el) => { el.textContent = this.pad(i + 1); });
        this.railBtns.forEach((b, k) => b.classList.toggle('is-on', k === i));
        this.segments.forEach((s, k) => s.classList.toggle('is-on', k <= i));
      }

      /* A plate is "stuck" when the previous one is fully covered, so jump there */
      scrollToPlate(i, smooth) {
        const behavior = smooth && !this.reduce.matches ? 'smooth' : 'instant';
        if (this.desktop.matches) {
          const h = this.plates[0].offsetHeight;
          const gap = parseFloat(getComputedStyle(this.plates[0]).marginBottom) || 0;
          const trackTop = this.track.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: trackTop + i * (h + gap) - this.stickyTop(), behavior: behavior });
        } else {
          this.track.scrollTo({ left: i * this.track.clientWidth, behavior: behavior });
        }
      }

      onVariantChange(e) {
        const mediaId = e.detail && e.detail.mediaId;
        if (!mediaId) return;
        const i = this.plates.findIndex((p) => String(p.dataset.mediaId) === String(mediaId));
        if (i > -1) this.scrollToPlate(i, true);
      }

      /* --------------------------------------------------------------- cursor */
      initCursor() {
        const cur = this.querySelector('[data-cursor]');
        if (!cur || this.dataset.cursor !== 'true' || !this.finePointer.matches) return;

        let x = 0, y = 0, tx = 0, ty = 0, raf = 0;

        const loop = () => {
          const k = this.reduce.matches ? 1 : 0.22;
          x += (tx - x) * k;
          y += (ty - y) * k;
          cur.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
          raf = requestAnimationFrame(loop);
        };

        const show = (e) => {
          if (!this.desktop.matches) return;
          tx = e.clientX; ty = e.clientY;
          if (!cur.classList.contains('is-on')) {
            x = tx; y = ty;
            cur.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
            cur.classList.add('is-on');
            if (!raf) raf = requestAnimationFrame(loop);
          }
        };

        this._hideCursor = () => {
          cur.classList.remove('is-on');
          cancelAnimationFrame(raf);
          raf = 0;
        };

        this.track.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; show(e); });
        this.track.addEventListener('pointerleave', this._hideCursor);
        window.addEventListener('blur', this._hideCursor);
      }

      /* ---------------------------------------------------------------- viewer */
      canTransition() {
        return typeof document.startViewTransition === 'function' && !this.reduce.matches;
      }

      initViewer() {
        const closeBtn = this.querySelector('[data-viewer-close]');
        const prev = this.querySelector('[data-viewer-prev]');
        const next = this.querySelector('[data-viewer-next]');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeViewer());
        if (prev) prev.addEventListener('click', () => this.stepViewer(-1));
        if (next) next.addEventListener('click', () => this.stepViewer(1));

        this.viewer.addEventListener('cancel', (e) => {
          e.preventDefault();
          this.closeViewer();
        });

        this.viewer.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); this.stepViewer(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); this.stepViewer(-1); }
        });

        this.viewerTrack.addEventListener('scroll', () => {
          if (this._vraf) return;
          this._vraf = requestAnimationFrame(() => {
            this._vraf = 0;
            const w = this.viewerTrack.clientWidth || 1;
            const i = clamp(Math.round(this.viewerTrack.scrollLeft / w), 0, this.total - 1);
            if (i !== this.viewerIndex) {
              this.resetZoom();
              this.viewerIndex = i;
              this.paintViewerCount();
              this.loadSlide(i);
            }
          });
        }, { passive: true });

        this.initZoom();
      }

      paintViewerCount() {
        if (this.viewerCount) this.viewerCount.textContent = this.pad(this.viewerIndex + 1) + ' / ' + this.pad(this.total);
      }

      loadSlide(i) {
        const slide = this.slides[i];
        if (!slide) return;
        const img = slide.querySelector('img');
        const source = this.plates[i].querySelector('img');
        if (!img.getAttribute('src') && source) img.src = source.currentSrc || source.src;
        if (img.dataset.upgraded) return;
        img.dataset.upgraded = '1';
        const hi = new Image();
        hi.src = img.dataset.hi;
        hi.decode().then(() => { img.src = hi.src; }).catch(() => {});
      }

      goTo(i, smooth) {
        const w = this.viewerTrack.clientWidth;
        this.viewerTrack.scrollTo({ left: i * w, behavior: smooth ? 'smooth' : 'instant' });
      }

      stepViewer(dir) {
        const i = clamp(this.viewerIndex + dir, 0, this.total - 1);
        if (i === this.viewerIndex) return;
        this.goTo(i, !this.reduce.matches);
      }

      async openViewer(index) {
        const dlg = this.viewer;
        if (!dlg || dlg.open) return;
        if (this._hideCursor) this._hideCursor();

        const frame = this.plates[index].querySelector('.pdp-plate__frame');
        const img = this.slides[index].querySelector('img');
        this.loadSlide(index);

        const reveal = () => {
          dlg.showModal();
          this.viewerIndex = index;
          this.goTo(index, false);
          this.paintViewerCount();
          dlg.querySelector('[data-viewer-close]').focus({ preventScroll: true });
        };

        if (this.canTransition()) {
          dlg.dataset.vt = '1';
          frame.style.viewTransitionName = 'pdp-viewer-img';
          try {
            await Promise.race([img.decode(), new Promise((r) => setTimeout(r, 160))]);
          } catch (err) { /* decode can reject on a cached error; the morph still runs */ }
          const t = document.startViewTransition(() => {
            frame.style.viewTransitionName = '';
            img.style.viewTransitionName = 'pdp-viewer-img';
            reveal();
          });
          t.finished.finally(() => { img.style.viewTransitionName = ''; });
        } else {
          delete dlg.dataset.vt;
          reveal();
        }

        window.setTimeout(() => {
          this.slides.forEach((_, k) => { if (Math.abs(k - index) <= 1) this.loadSlide(k); });
        }, 350);
      }

      closeViewer() {
        const dlg = this.viewer;
        if (!dlg || !dlg.open) return;
        this.resetZoom();

        const i = this.viewerIndex;
        const img = this.slides[i].querySelector('img');
        const frame = this.plates[i].querySelector('.pdp-plate__frame');

        const settle = () => {
          this.scrollToPlate(i, false);
        };

        if (this.canTransition()) {
          dlg.dataset.vt = '1';
          img.style.viewTransitionName = 'pdp-viewer-img';
          const t = document.startViewTransition(() => {
            img.style.viewTransitionName = '';
            dlg.close();
            settle();
            frame.style.viewTransitionName = 'pdp-viewer-img';
          });
          t.finished.finally(() => { frame.style.viewTransitionName = ''; });
        } else {
          delete dlg.dataset.vt;
          dlg.close();
          settle();
        }
      }

      /* ------------------------------------------- desktop zoom, pointer-driven */
      initZoom() {
        this.zoom = { on: false, x: 0, y: 0, tx: 0, ty: 0, raf: 0, img: null, slide: null };

        const tick = () => {
          const z = this.zoom;
          z.x += (z.tx - z.x) * 0.16;
          z.y += (z.ty - z.y) * 0.16;
          if (z.img) z.img.style.transform = 'translate3d(' + z.x.toFixed(1) + 'px,' + z.y.toFixed(1) + 'px,0) scale(2)';
          z.raf = z.on ? requestAnimationFrame(tick) : 0;
        };
        this._tick = tick;

        this.slides.forEach((slide) => {
          slide.addEventListener('click', (e) => {
            if (!this.finePointer.matches) return;
            const img = slide.querySelector('img');
            if (this.zoom.on) { this.resetZoom(); return; }
            this.zoom.on = true;
            this.zoom.img = img;
            this.zoom.slide = slide;
            slide.classList.add('is-zoomed');
            this.aim(e, img);
            this.zoom.x = this.zoom.tx;
            this.zoom.y = this.zoom.ty;
            img.style.transition = 'transform 360ms var(--pdp-ease)';
            img.style.transform = 'translate3d(' + this.zoom.x + 'px,' + this.zoom.y + 'px,0) scale(2)';
            window.setTimeout(() => {
              if (this.zoom.on) { img.style.transition = 'none'; this.zoom.raf = requestAnimationFrame(this._tick); }
            }, 380);
          });

          slide.addEventListener('pointermove', (e) => {
            if (this.zoom.on && this.zoom.slide === slide) this.aim(e, slide.querySelector('img'));
          });
        });
      }

      aim(e, img) {
        const r = img.getBoundingClientRect();
        const px = clamp((e.clientX - r.left) / r.width, 0, 1);
        const py = clamp((e.clientY - r.top) / r.height, 0, 1);
        this.zoom.tx = (0.5 - px) * r.width;
        this.zoom.ty = (0.5 - py) * r.height;
      }

      resetZoom() {
        const z = this.zoom;
        if (!z || !z.on) return;
        z.on = false;
        cancelAnimationFrame(z.raf);
        z.raf = 0;
        if (z.slide) z.slide.classList.remove('is-zoomed');
        if (z.img) {
          z.img.style.transition = 'transform 280ms var(--pdp-ease)';
          z.img.style.transform = '';
        }
        z.img = null;
        z.slide = null;
      }
    }

    if (!customElements.get('product-gallery')) {
      customElements.define('product-gallery', ProductGallery);
    }
  })();
</script>
```

### 7.4 `snippets/product-buy-box.liquid`

```liquid
{% doc %}
  Product Buy Box - the decision panel

  Reading order, top to bottom, one job per tier:
    1  status + crumbs     small, quiet
    2  title               the loudest thing in the panel
    3  price               second loudest, digits roll when the variant changes
    4  one-line summary
    5  size ruler          sliding indicator, live garment measurements for the chosen size
    6  add to bag          one state machine: needs-size / ready / sold-out / loading / done
    7  delivery dates      computed from the visitor's date (working days, Mon to Sat)
    8  reassurance         the three theme-editor badges
    9  at a glance         spec rows + fit scale, from "Spec row" blocks
   10  accordions          native <details>, exclusive, animated height

  Public events (unchanged contract)
    out: pdp:state, variant:change, cart:refresh, cart:open
    in : pdp:sticky-add, pdp:select-option { value, index? }

  @param {product} product - The product object
  @param {section} section - The parent section
{% enddoc %}

{%- liquid
  assign adot_title = product.title
  assign adot_category = product.type
  assign adot_price = product.price
  assign adot_compare_at = product.compare_at_price | default: 0
  assign adot_image = product.featured_image | image_url: width: 1200
  assign adot_description = product.description

  assign is_on_sale = false
  assign discount_pct = 0
  if adot_compare_at > adot_price
    assign is_on_sale = true
    assign discount_diff = adot_compare_at | minus: adot_price
    assign discount_pct = discount_diff | times: 100.0 | divided_by: adot_compare_at | round
  endif

  assign only_default = false
  if product.has_only_default_variant or product.variants.size == 1
    assign only_default = true
  endif

  assign has_size_option = false
  for option in product.options_with_values
    assign option_lower = option.name | downcase
    if option_lower contains 'size'
      assign has_size_option = true
    endif
  endfor

  assign type_lc = product.type | downcase
  assign size_cat = 'hoodies'
  if type_lc contains 'shirt' or type_lc contains 'tee'
    assign size_cat = 'shirts'
  elsif type_lc contains 'trouser' or type_lc contains 'pant' or type_lc contains 'jogger'
    assign size_cat = 'trousers'
  endif

  assign title_words = product.title | split: ' '
  assign fit = section.settings.fit_scale | default: 'relaxed'
  assign fit_levels = 'slim,regular,relaxed,oversized' | split: ','

  assign spec_count = 0
  for block in section.blocks
    if block.type == 'spec' and block.settings.value != blank
      assign spec_count = spec_count | plus: 1
    endif
  endfor
-%}
{% capture adot_price_formatted %}{% render 'money', price: adot_price %}{% endcapture %}
{% assign adot_price_formatted = adot_price_formatted | strip %}
{% capture adot_compare_formatted %}{% render 'money', price: adot_compare_at %}{% endcapture %}
{% assign adot_compare_formatted = adot_compare_formatted | strip %}

<div class="pdp-panel" id="ProductBuyBox-{{ section.id }}" data-product-buy-box>
  <div class="pdp-meta">
    <nav class="pdp-crumbs" aria-label="Breadcrumb">
      <a href="{{ routes.all_products_collection_url }}">Shop</a>
      {%- if adot_category != blank -%}
        <i aria-hidden="true"></i>
        <a href="{{ adot_category | url_for_type }}">{{ adot_category }}</a>
      {%- endif -%}
    </nav>

    <span class="pdp-status" data-status data-tone="{% if product.available %}ok{% else %}out{% endif %}">
      <i aria-hidden="true"></i>
      <span data-status-text>{% if product.available %}In stock{% else %}Sold out{% endif %}</span>
    </span>
  </div>

  <h1 class="pdp-title">
    {%- for word in title_words -%}
      <span class="pdp-w" style="--w:{{ forloop.index0 }}"><span>{{ word | escape }}</span></span>{% unless forloop.last %} {% endunless %}
    {%- endfor -%}
  </h1>

  <div class="pdp-price" id="ProductPrice-{{ section.id }}" data-price-root>
    <span class="pdp-price__now{% if is_on_sale %} is-sale{% endif %}" data-price-now>{{ adot_price_formatted }}</span>
    <s class="pdp-price__was" data-price-was{% unless is_on_sale %} hidden{% endunless %}>{{ adot_compare_formatted }}</s>
    <span class="pdp-price__off" data-price-off{% unless is_on_sale %} hidden{% endunless %}>{% if is_on_sale %}−{{ discount_pct }}%{% endif %}</span>
  </div>

  {%- liquid
    assign clean_desc = adot_description | default: product.description | strip_html | strip | split: '. ' | first | remove_last: '.'
  -%}
  {%- if clean_desc != blank -%}
    <p class="pdp-summary">{{ clean_desc }}.</p>
  {%- endif -%}

  <form
    method="post"
    action="{{ routes.cart_add_url }}"
    id="ProductForm-{{ section.id }}"
    class="pdp-form"
    novalidate="novalidate"
  >
    <input type="hidden" name="id" value="" id="ProductVariantInput-{{ section.id }}" required>
    <input type="hidden" name="properties[_adot_title]" value="{{ adot_title | default: product.title | escape }}">
    <input type="hidden" name="properties[_adot_image]" value="{{ adot_image }}">
    <input type="hidden" name="properties[_adot_price]" value="{{ adot_price_formatted }}">
    <input type="hidden" name="properties[_adot_category]" value="{{ adot_category | default: 'Essentials' | escape }}">
    <input type="hidden" name="properties[Size]" value="" id="ProductSizeProperty-{{ section.id }}">

    {%- unless only_default -%}
      <div class="pdp-options" id="ProductOptions-{{ section.id }}">
        {%- for option in product.options_with_values -%}
          {%- liquid
            assign option_name_lower = option.name | downcase
            assign is_size_option = false
            if option_name_lower contains 'size'
              assign is_size_option = true
            endif
            assign cols = option.values.size
            if cols > 6
              assign cols = 5
            endif
          -%}
          {%- if option_name_lower contains 'color' or option_name_lower contains 'colour' -%}
            {%- continue -%}
          {%- endif -%}

          <fieldset
            class="pdp-opt"
            data-option-index="{{ forloop.index0 }}"
            data-option-name="{{ option.name | escape }}"
          >
            <legend class="visually-hidden">{{ option.name }}</legend>

            <div class="pdp-opt__head">
              <span class="pdp-opt__label" aria-hidden="true">
                <span>{{ option.name }}</span>
                <span class="pdp-opt__value" data-option-selected-label>Select</span>
              </span>

              {%- if is_size_option -%}
                <button
                  type="button"
                  class="pdp-link"
                  data-open-size-guide
                  data-size-category="{{ size_cat }}"
                  aria-haspopup="dialog"
                >Size guide</button>
              {%- endif -%}
            </div>

            <div class="pdp-sizes" role="radiogroup" aria-label="{{ option.name }}" style="--cols:{{ cols }}">
              <span class="pdp-sizes__ind" aria-hidden="true"></span>
              {%- for value in option.values -%}
                {%- liquid
                  assign option_available = false
                  for variant in product.variants
                    if variant.options[forloop.parentloop.index0] == value and variant.available
                      assign option_available = true
                      break
                    endif
                  endfor
                -%}
                <button
                  type="button"
                  role="radio"
                  aria-checked="false"
                  class="pdp-size{% unless option_available %} is-sold-out{% endunless %}"
                  data-option-name="{{ option.name }}"
                  data-option-value="{{ value | escape }}"
                  tabindex="{% if forloop.first %}0{% else %}-1{% endif %}"
                  {% unless option_available %}
                    aria-disabled="true"
                    aria-label="{{ value | escape }}, sold out"
                  {% endunless %}
                >
                  <span class="pdp-size__text">{{ value }}</span>
                  {%- unless option_available -%}
                    <span class="pdp-size__slash" aria-hidden="true"></span>
                  {%- endunless -%}
                </button>
              {%- endfor -%}
            </div>

            {%- if is_size_option -%}
              <div class="pdp-measure" data-measure data-cat="{{ size_cat }}" aria-live="polite">
                <p class="pdp-measure__hint" data-measure-hint>Choose a size to see its measurements.</p>
                <dl class="pdp-measure__grid" data-measure-grid hidden></dl>
              </div>
            {%- endif -%}
          </fieldset>
        {%- endfor -%}
      </div>
    {%- endunless -%}

    <div class="pdp-error" id="ProductAlert-{{ section.id }}" role="alert" hidden></div>

    <div class="pdp-actions">
      <button
        type="submit"
        name="add"
        class="pdp-cta"
        id="AddToCartBtn-{{ section.id }}"
        data-state="{% if only_default %}ready{% else %}needs-size{% endif %}"
        aria-disabled="{% if only_default %}false{% else %}true{% endif %}"
      >
        <span class="pdp-cta__fill" aria-hidden="true"></span>
        <span class="pdp-cta__bar" aria-hidden="true"></span>
        <span class="pdp-cta__main">
          <span class="pdp-cta__mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="pdp-cta__label" data-btn-label>{% if only_default %}Add to bag{% elsif has_size_option %}Select a size{% else %}Select an option{% endif %}</span>
        </span>
        <span class="pdp-cta__price" data-btn-price>{{ adot_price_formatted }}</span>
      </button>

      {%- if section.settings.show_whatsapp_button -%}
        {%- assign wa_phone = section.settings.whatsapp_number | default: '923131707080' -%}
        <button
          type="button"
          class="pdp-wa"
          id="WhatsAppBtn-{{ section.id }}"
          data-phone="{{ wa_phone }}"
          data-product-title="{{ adot_title | default: product.title | escape }}"
          data-product-price="{{ adot_price_formatted }}"
          data-product-url="{{ shop.url }}{{ product.url }}"
        >
          <span class="pdp-wa__fill" aria-hidden="true"></span>
          <span class="pdp-wa__main">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Order on WhatsApp</span>
          </span>
          <svg class="pdp-wa__out" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3.5 10.5l7-7M4.5 3.5h6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {%- endif -%}
    </div>
  </form>

  {%- if section.settings.show_delivery_estimate -%}
    <p
      class="pdp-eta"
      data-eta
      data-min="{{ section.settings.delivery_days_min | default: 2 }}"
      data-max="{{ section.settings.delivery_days_max | default: 4 }}"
      hidden
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="1" y="4" width="14" height="12"></rect>
        <path d="M15 8h4l3 3v5h-7"></path>
        <circle cx="5.5" cy="18.5" r="2"></circle>
        <circle cx="18" cy="18.5" r="2"></circle>
      </svg>
      <span>Arrives <strong data-eta-range></strong></span>
    </p>
  {%- endif -%}

  {%- if section.settings.show_trust_strip -%}
    <ul class="pdp-trust" aria-label="Order guarantees">
      <li class="pdp-trust__item">
        <svg class="pdp-trust__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14"></rect>
          <path d="M2 10h20M6 15h4"></path>
        </svg>
        <span class="pdp-trust__copy">
          <span class="pdp-trust__title">{{ section.settings.trust_badge_1_title | default: 'Cash on Delivery' }}</span>
          <span class="pdp-trust__sub">{{ section.settings.trust_badge_1_subtitle }}</span>
        </span>
      </li>
      <li class="pdp-trust__item">
        <svg class="pdp-trust__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          <path d="M3 21v-5h5"></path>
        </svg>
        <span class="pdp-trust__copy">
          <span class="pdp-trust__title">{{ section.settings.trust_badge_2_title | default: '7-Day Easy Exchange' }}</span>
          <span class="pdp-trust__sub">{{ section.settings.trust_badge_2_subtitle }}</span>
        </span>
      </li>
      <li class="pdp-trust__item">
        <svg class="pdp-trust__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="1" y="4" width="14" height="12"></rect>
          <path d="M15 8h4l3 3v5h-7"></path>
          <circle cx="5.5" cy="18.5" r="2"></circle>
          <circle cx="18" cy="18.5" r="2"></circle>
        </svg>
        <span class="pdp-trust__copy">
          <span class="pdp-trust__title">{{ section.settings.trust_badge_3_title | default: '2–4 Day Delivery' }}</span>
          <span class="pdp-trust__sub">{{ section.settings.trust_badge_3_subtitle }}</span>
        </span>
      </li>
    </ul>
  {%- endif -%}

  {%- if spec_count > 0 or fit != 'none' -%}
    <section class="pdp-glance" aria-labelledby="Glance-{{ section.id }}">
      <h2 class="pdp-glance__title" id="Glance-{{ section.id }}">At a glance</h2>
      <dl class="pdp-glance__list">
        {%- for block in section.blocks -%}
          {%- if block.type == 'spec' and block.settings.value != blank -%}
            <div class="pdp-glance__row" {{ block.shopify_attributes }}>
              <dt>{{ block.settings.label }}</dt>
              <dd>{{ block.settings.value }}</dd>
            </div>
          {%- endif -%}
        {%- endfor -%}
        {%- if fit != 'none' -%}
          <div class="pdp-glance__row">
            <dt>Fit</dt>
            <dd class="pdp-fit">
              <span class="pdp-fit__bar" role="img" aria-label="Fit scale: {{ fit | capitalize }}">
                {%- for level in fit_levels -%}
                  <i{% if level == fit %} class="is-on"{% endif %}></i>
                {%- endfor -%}
              </span>
              <span>{{ fit | capitalize }}</span>
            </dd>
          </div>
        {%- endif -%}
      </dl>
    </section>
  {%- endif -%}

  <div class="pdp-acc-list">
    {%- for block in section.blocks -%}
      {%- if block.type == 'accordion' -%}
        {%- liquid
          assign mf_value = nil
          if block.settings.metafield_key != blank
            assign mf_parts = block.settings.metafield_key | split: '.'
            if mf_parts.size == 2
              assign mf_value = product.metafields[mf_parts[0]][mf_parts[1]]
            endif
          endif
        -%}
        {%- if block.settings.content != blank or mf_value.value != blank -%}
          <details class="pdp-acc" name="pdp-info-{{ section.id }}" {{ block.shopify_attributes }}>
            <summary class="pdp-acc__summary">
              <span>{{ block.settings.title }}</span>
              <span class="pdp-acc__icon" aria-hidden="true"></span>
            </summary>
            <div class="pdp-acc__body">
              {%- if mf_value.value != blank -%}
                {{ mf_value | metafield_tag }}
              {%- else -%}
                <p>{{ block.settings.content }}</p>
              {%- endif -%}
            </div>
          </details>
        {%- endif -%}
      {%- endif -%}
    {%- endfor -%}
  </div>

  <span class="visually-hidden" role="status" aria-live="polite" data-sr-status></span>

  <script type="application/json" id="ProductVariants-{{ section.id }}">
    {{ product.variants | json }}
  </script>
</div>

<style>
  .pdp-panel {
    interpolate-size: allow-keywords;
    width: 100%;
    display: flex;
    flex-direction: column;
    font-family: var(--pdp-font);
    color: var(--pdp-ink);
  }

  .pdp-panel [hidden] {
    display: none !important;
  }

  /* ------------------------------------------------------------ 1 · meta row */
  .pdp-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-4);
    min-height: 1.5rem;
  }

  .pdp-crumbs {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    color: var(--pdp-ink-3);
  }

  .pdp-crumbs a {
    color: inherit;
    text-decoration: none;
    transition: color 160ms var(--pdp-ease);
  }

  .pdp-crumbs a:last-child {
    color: var(--pdp-ink);
  }

  .pdp-crumbs i {
    width: 1px;
    height: 0.9em;
    background: currentColor;
    opacity: 0.45;
    transform: rotate(22deg);
  }

  @media (hover: hover) and (pointer: fine) {
    .pdp-crumbs a:hover {
      color: var(--pdp-ink);
    }
  }

  .pdp-status {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    color: var(--pdp-ink-2);
  }

  .pdp-status i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pdp-ok);
    transition: background-color 240ms var(--pdp-ease);
  }

  .pdp-status[data-tone='low'] {
    color: var(--pdp-sale);
  }

  .pdp-status[data-tone='low'] i {
    background: var(--pdp-sale);
    animation: pdp-pulse 1.8s ease-in-out infinite;
  }

  .pdp-status[data-tone='out'] i {
    background: var(--pdp-ink-3);
  }

  @keyframes pdp-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }

  /* --------------------------------------------------------------- 2 · title */
  .pdp-title {
    margin: var(--s-5) 0 0;
    font-family: var(--pdp-font-display);
    font-size: var(--pdp-fs-title);
    font-weight: 500;
    line-height: 0.96;
    letter-spacing: -0.045em;
    text-wrap: balance;
    color: var(--pdp-ink);
  }

  /* Each word sits in a mask so it can rise into place */
  .pdp-w {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
    padding-bottom: 0.1em;
    margin-bottom: -0.1em;
  }

  .pdp-w > span {
    display: inline-block;
    transform-origin: 0 100%;
  }

  /* --------------------------------------------------------------- 3 · price */
  .pdp-price {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--s-1) var(--s-3);
    margin-top: var(--s-4);
    font-variant-numeric: tabular-nums;
  }

  .pdp-price__now {
    font-family: var(--pdp-font-display);
    font-size: var(--pdp-fs-price);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--pdp-ink);
  }

  .pdp-price__now.is-sale {
    color: var(--pdp-sale);
  }

  .pdp-price__was {
    font-size: var(--pdp-fs-body);
    color: var(--pdp-ink-3);
    text-decoration-thickness: 1px;
  }

  .pdp-price__off {
    align-self: center;
    padding: 0.25rem 0.5rem;
    box-shadow: inset 0 0 0 1px currentColor;
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    line-height: 1;
    color: var(--pdp-sale);
  }

  /* -------------------------------------------------------------- 4 · summary */
  .pdp-summary {
    max-width: 42ch;
    margin: var(--s-3) 0 0;
    font-size: var(--pdp-fs-body);
    line-height: 1.6;
    color: var(--pdp-ink-2);
    text-wrap: pretty;
  }

  /* ----------------------------------------------------------------- 5 · size */
  .pdp-form {
    display: flex;
    flex-direction: column;
  }

  .pdp-options {
    display: flex;
    flex-direction: column;
    gap: var(--s-5);
    margin-top: var(--s-6);
  }

  .pdp-opt {
    border: 0;
    padding: 0;
    margin: 0;
    min-width: 0;
  }

  .pdp-opt__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--s-3);
  }

  .pdp-opt__label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--s-3);
    font-size: var(--pdp-fs-ui);
    font-weight: 600;
    color: var(--pdp-ink);
  }

  .pdp-opt__value {
    font-weight: 400;
    color: var(--pdp-ink-3);
    transition: color 160ms var(--pdp-ease);
  }

  .pdp-opt.has-selection .pdp-opt__value {
    color: var(--pdp-ink);
  }

  .pdp-opt__head .pdp-link {
    margin-block: -0.75rem;
  }

  /* One connected ruler: shared hairlines, one block that travels between cells */
  .pdp-sizes {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr));
    border-top: 1px solid var(--pdp-line-2);
    border-left: 1px solid var(--pdp-line-2);
    background: var(--pdp-paper);
  }

  .pdp-sizes__ind {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    background: var(--pdp-btn-bg);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 520ms var(--pdp-spring),
      width 520ms var(--pdp-spring),
      opacity 160ms var(--pdp-ease);
  }

  .pdp-sizes__ind.is-on {
    opacity: 1;
  }

  .pdp-size {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3.5rem;
    min-width: 0;
    padding: 0;
    border: 0;
    border-right: 1px solid var(--pdp-line-2);
    border-bottom: 1px solid var(--pdp-line-2);
    background: transparent;
    color: var(--pdp-ink);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      color 200ms var(--pdp-ease),
      background-color 160ms var(--pdp-ease),
      transform 160ms var(--pdp-ease);
  }

  .pdp-size:focus-visible {
    outline-offset: -4px;
  }

  .pdp-size:active:not(.is-sold-out) {
    transform: scale(0.96);
  }

  .pdp-size.is-selected {
    color: var(--pdp-btn-fg);
  }

  @media (hover: hover) and (pointer: fine) {
    .pdp-size:hover:not(.is-sold-out):not(.is-selected) {
      background-color: var(--pdp-sunk);
    }
  }

  .pdp-size.is-sold-out {
    color: var(--pdp-ink-3);
    cursor: not-allowed;
  }

  .pdp-size.is-sold-out .pdp-size__text {
    opacity: 0.55;
  }

  .pdp-size__slash {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to top right,
      transparent calc(50% - 0.5px),
      var(--pdp-line-2) calc(50% - 0.5px),
      var(--pdp-line-2) calc(50% + 0.5px),
      transparent calc(50% + 0.5px)
    );
  }

  /* Missing size: the ruler turns oxblood with one short nudge */
  .pdp-opt.has-error .pdp-sizes {
    border-top-color: var(--pdp-sale);
    border-left-color: var(--pdp-sale);
    animation: pdp-nudge 340ms var(--pdp-ease);
  }

  .pdp-opt.has-error .pdp-size {
    border-right-color: var(--pdp-sale);
    border-bottom-color: var(--pdp-sale);
  }

  @keyframes pdp-nudge {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(4px); }
    75% { transform: translateX(-2px); }
  }

  /* Garment measurements for the chosen size */
  .pdp-measure {
    margin-top: var(--s-3);
    min-height: 2.5rem;
  }

  .pdp-measure__hint {
    margin: 0;
    font-size: var(--pdp-fs-small);
    line-height: 1.5;
    color: var(--pdp-ink-3);
  }

  .pdp-measure__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--s-3);
    margin: 0;
  }

  .pdp-measure__grid dt {
    font-size: var(--pdp-fs-small);
    color: var(--pdp-ink-3);
  }

  .pdp-measure__grid dd {
    margin: 2px 0 0;
    font-size: var(--pdp-fs-ui);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--pdp-ink);
  }

  .pdp-measure__grid small {
    font-size: var(--pdp-fs-small);
    font-weight: 400;
    color: var(--pdp-ink-3);
  }

  /* ----------------------------------------------------------------- notices */
  .pdp-error {
    margin-top: var(--s-4);
    padding: var(--s-3) var(--s-4);
    border-left: 2px solid var(--pdp-sale);
    background: oklch(0.45 0.16 25 / 0.06);
    color: var(--pdp-sale);
    font-size: var(--pdp-fs-small);
    font-weight: 500;
    line-height: 1.4;
  }

  /* --------------------------------------------------------------- 6 · actions */
  .pdp-actions {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    margin-top: var(--s-5);
  }

  .pdp-cta {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-4);
    width: 100%;
    min-height: 3.75rem;
    padding: 0 var(--s-5);
    border: 0;
    background-color: var(--pdp-btn-bg);
    color: var(--pdp-btn-fg);
    box-shadow: inset 0 0 0 1px var(--pdp-btn-bg);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui);
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color 260ms var(--pdp-ease),
      color 320ms var(--pdp-ease),
      box-shadow 260ms var(--pdp-ease),
      transform 160ms var(--pdp-ease);
  }

  .pdp-cta:active {
    transform: scale(0.985);
  }

  /* The inversion grows out of the exact point the pointer entered, and collapses toward where it leaves */
  .pdp-cta__fill,
  .pdp-wa__fill {
    position: absolute;
    inset: 0;
    z-index: -1;
    clip-path: circle(0% at var(--fx, 50%) var(--fy, 100%));
    transition: clip-path 600ms var(--pdp-ease-expo);
  }

  .pdp-cta__fill {
    background: var(--pdp-paper);
  }

  @media (hover: hover) and (pointer: fine) {
    .pdp-cta[data-state='ready']:hover {
      color: var(--pdp-ink);
    }

    .pdp-cta[data-state='ready']:hover .pdp-cta__fill {
      clip-path: circle(150% at var(--fx, 50%) var(--fy, 100%));
    }

    .pdp-cta[data-state='needs-size']:hover {
      box-shadow: inset 0 0 0 1px var(--pdp-ink);
    }
  }

  .pdp-cta[data-state='needs-size'] {
    background-color: var(--pdp-paper);
    color: var(--pdp-ink);
    box-shadow: inset 0 0 0 1px var(--pdp-line-2);
  }

  .pdp-cta[data-state='needs-size'] .pdp-cta__price {
    color: var(--pdp-ink-3);
  }

  .pdp-cta[data-state='sold-out'] {
    background-color: var(--pdp-sunk);
    color: var(--pdp-ink-3);
    box-shadow: inset 0 0 0 1px var(--pdp-line);
    cursor: not-allowed;
  }

  .pdp-cta[data-state='sold-out'] .pdp-cta__price {
    opacity: 0;
  }

  .pdp-cta[data-state='done'] {
    background-color: var(--pdp-ok);
    box-shadow: inset 0 0 0 1px var(--pdp-ok);
  }

  .pdp-cta__main {
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }

  .pdp-cta__label {
    display: inline-block;
    white-space: nowrap;
  }

  .pdp-cta__price {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    transition: opacity 200ms var(--pdp-ease), color 200ms var(--pdp-ease);
  }

  /* Check mark opens up in front of the label when the item lands in the bag */
  .pdp-cta__mark {
    display: grid;
    place-items: center;
    width: 0;
    margin-inline-end: 0;
    opacity: 0;
    transform: scale(0.25);
    filter: blur(4px);
    overflow: hidden;
    transition:
      width 300ms cubic-bezier(0.2, 0, 0, 1),
      margin 300ms cubic-bezier(0.2, 0, 0, 1),
      opacity 300ms cubic-bezier(0.2, 0, 0, 1),
      transform 300ms cubic-bezier(0.2, 0, 0, 1),
      filter 300ms cubic-bezier(0.2, 0, 0, 1);
  }

  .pdp-cta[data-state='done'] .pdp-cta__mark {
    width: 16px;
    margin-inline-end: var(--s-3);
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }

  /* Loading: a single line travels along the bottom edge */
  .pdp-cta__bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: currentColor;
    opacity: 0;
    transform: translateX(-100%);
  }

  .pdp-cta[data-state='loading'] .pdp-cta__bar {
    opacity: 1;
    animation: pdp-sweep 900ms var(--pdp-ease-io) infinite;
  }

  .pdp-cta[data-state='loading'] {
    cursor: progress;
  }

  @keyframes pdp-sweep {
    to { transform: translateX(100%); }
  }

  /* Secondary action stays quiet */
  .pdp-wa {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    width: 100%;
    min-height: 3.25rem;
    padding: 0 var(--s-5);
    border: 0;
    background: transparent;
    color: var(--pdp-ink);
    box-shadow: inset 0 0 0 1px var(--pdp-line-2);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui);
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: box-shadow 200ms var(--pdp-ease), transform 160ms var(--pdp-ease);
  }

  .pdp-wa__fill {
    background: var(--pdp-sunk);
  }

  .pdp-wa__main {
    display: inline-flex;
    align-items: center;
    gap: var(--s-3);
  }

  .pdp-wa__out {
    opacity: 0.45;
    transition: transform 320ms var(--pdp-ease), opacity 200ms var(--pdp-ease);
  }

  .pdp-wa:active {
    transform: scale(0.985);
  }

  @media (hover: hover) and (pointer: fine) {
    .pdp-wa:hover {
      box-shadow: inset 0 0 0 1px var(--pdp-ink);
    }

    .pdp-wa:hover .pdp-wa__fill {
      clip-path: circle(150% at var(--fx, 50%) var(--fy, 100%));
    }

    .pdp-wa:hover .pdp-wa__out {
      opacity: 1;
      transform: translate(2px, -2px);
    }
  }

  /* ----------------------------------------------------------- 7 · delivery */
  .pdp-eta {
    display: flex;
    align-items: center;
    gap: var(--s-3);
    margin: var(--s-4) 0 0;
    font-size: var(--pdp-fs-small);
    color: var(--pdp-ink-2);
  }

  .pdp-eta strong {
    font-weight: 600;
    color: var(--pdp-ink);
  }

  .pdp-eta svg {
    flex-shrink: 0;
    color: var(--pdp-ink);
  }

  /* ----------------------------------------------------------- 8 · reassurance */
  .pdp-trust {
    list-style: none;
    margin: var(--s-6) 0 0;
    padding: 0;
    border-top: 1px solid var(--pdp-line);
  }

  .pdp-trust__item {
    display: grid;
    grid-template-columns: 1.25rem minmax(0, 1fr);
    align-items: start;
    gap: var(--s-4);
    padding: var(--s-4) 0;
    border-bottom: 1px solid var(--pdp-line);
  }

  .pdp-trust__icon {
    margin-top: 1px;
    color: var(--pdp-ink);
  }

  .pdp-trust__copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pdp-trust__title {
    font-size: var(--pdp-fs-ui);
    font-weight: 500;
    color: var(--pdp-ink);
  }

  .pdp-trust__sub {
    font-size: var(--pdp-fs-small);
    line-height: 1.45;
    color: var(--pdp-ink-2);
  }

  .pdp-trust__sub:empty {
    display: none;
  }

  /* ---------------------------------------------------------- 9 · at a glance */
  .pdp-glance {
    margin-top: var(--s-6);
  }

  .pdp-glance__title {
    margin: 0 0 var(--s-3);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui);
    font-weight: 600;
    color: var(--pdp-ink);
  }

  .pdp-glance__list {
    margin: 0;
    border-top: 1px solid var(--pdp-line);
  }

  .pdp-glance__row {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr);
    align-items: center;
    gap: var(--s-4);
    min-height: 2.75rem;
    padding: var(--s-2) 0;
    border-bottom: 1px solid var(--pdp-line);
  }

  .pdp-glance__row dt {
    font-size: var(--pdp-fs-small);
    color: var(--pdp-ink-3);
  }

  .pdp-glance__row dd {
    margin: 0;
    font-size: var(--pdp-fs-ui);
    color: var(--pdp-ink);
  }

  .pdp-fit {
    display: flex;
    align-items: center;
    gap: var(--s-3);
  }

  .pdp-fit__bar {
    display: grid;
    grid-template-columns: repeat(4, 1.5rem);
    gap: 3px;
  }

  .pdp-fit__bar i {
    display: block;
    height: 4px;
    background: var(--pdp-line-2);
  }

  .pdp-fit__bar i.is-on {
    background: var(--pdp-ink);
  }

  /* -------------------------------------------------------------- 10 · accordions */
  .pdp-acc-list {
    display: flex;
    flex-direction: column;
    margin-top: var(--s-6);
    border-top: 1px solid var(--pdp-line);
  }

  .pdp-acc-list:empty {
    display: none;
  }

  .pdp-acc {
    border-bottom: 1px solid var(--pdp-line);
  }

  .pdp-acc__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-4);
    min-height: 3.5rem;
    list-style: none;
    font-size: var(--pdp-fs-body);
    font-weight: 500;
    color: var(--pdp-ink);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }

  .pdp-acc__summary::-webkit-details-marker {
    display: none;
  }

  .pdp-acc__summary:focus-visible {
    outline-offset: -2px;
  }

  .pdp-acc__icon {
    position: relative;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .pdp-acc__icon::before,
  .pdp-acc__icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1.5px;
    margin-top: -0.75px;
    background: currentColor;
    transition: transform 320ms var(--pdp-ease), opacity 200ms var(--pdp-ease);
  }

  .pdp-acc__icon::after {
    transform: rotate(90deg);
  }

  .pdp-acc[open] .pdp-acc__icon::after {
    transform: rotate(0deg) scaleX(0);
    opacity: 0;
  }

  .pdp-acc__body {
    padding-bottom: var(--s-5);
    font-size: var(--pdp-fs-body);
    line-height: 1.65;
    color: var(--pdp-ink-2);
  }

  .pdp-acc__body p {
    max-width: 52ch;
    margin: 0;
    white-space: pre-line;
    text-wrap: pretty;
  }

  @supports selector(::details-content) {
    .pdp-acc::details-content {
      block-size: 0;
      overflow: clip;
      opacity: 0;
      transition:
        block-size 360ms var(--pdp-ease),
        opacity 260ms var(--pdp-ease),
        content-visibility 360ms allow-discrete;
    }

    .pdp-acc[open]::details-content {
      block-size: auto;
      opacity: 1;
    }
  }

  /* ----------------------------------------------------------- breakpoints */
  @media (min-width: 990px) {
    .pdp-meta {
      min-height: 1.75rem;
    }

    .pdp-title {
      margin-top: var(--s-6);
    }

    .pdp-price {
      margin-top: var(--s-5);
    }

    .pdp-summary {
      margin-top: var(--s-4);
    }

    .pdp-options {
      margin-top: var(--s-7);
    }

    .pdp-actions {
      margin-top: var(--s-6);
    }

    /* Three reassurance badges become one ruled strip */
    .pdp-trust {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      border-bottom: 1px solid var(--pdp-line);
    }

    .pdp-trust__item {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--s-3);
      padding: var(--s-4) var(--s-3);
      border-bottom: 0;
      border-left: 1px solid var(--pdp-line);
    }

    .pdp-trust__item:first-child {
      padding-left: 0;
      border-left: 0;
    }

    .pdp-trust__copy {
      gap: var(--s-1);
    }
  }

  /* --------------------------------------------------------------- motion */
  /* The one load moment (with the first plate): title words rise out of their masks, price settles in */
  @media (prefers-reduced-motion: no-preference) {
    .pdp-w > span {
      animation: pdp-word 950ms var(--pdp-ease-expo) both;
      animation-delay: calc(var(--w, 0) * 55ms + 220ms + var(--vt-delay, 0ms));
    }

    .pdp-price {
      animation: pdp-fade 700ms var(--pdp-ease) both;
      animation-delay: calc(560ms + var(--vt-delay, 0ms));
    }

    [data-pdp-vt] .pdp-panel {
      --vt-delay: 420ms;
    }
  }

  @keyframes pdp-word {
    from {
      transform: translateY(108%) rotate(3deg);
    }
  }

  @keyframes pdp-fade {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pdp-sizes__ind,
    .pdp-cta__fill,
    .pdp-wa__fill,
    .pdp-acc__icon::before,
    .pdp-acc__icon::after {
      transition-duration: 0.01ms;
    }

    .pdp-status[data-tone='low'] i,
    .pdp-opt.has-error .pdp-sizes,
    .pdp-cta[data-state='loading'] .pdp-cta__bar {
      animation: none;
    }
  }
</style>

<script>
  (function () {
    const root = document.getElementById('ProductBuyBox-{{ section.id }}');
    if (!root) return;

    const variantsDataEl = document.getElementById('ProductVariants-{{ section.id }}');
    if (!variantsDataEl) return;

    let variants = [];
    try {
      variants = JSON.parse(variantsDataEl.textContent);
    } catch (e) {
      console.error('Failed to parse variant data', e);
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

    const form = document.getElementById('ProductForm-{{ section.id }}');
    const variantInput = document.getElementById('ProductVariantInput-{{ section.id }}');
    const sizeProp = document.getElementById('ProductSizeProperty-{{ section.id }}');
    const priceProp = form ? form.querySelector('[name="properties[_adot_price]"]') : null;
    const addToCartBtn = document.getElementById('AddToCartBtn-{{ section.id }}');
    const btnLabel = addToCartBtn ? addToCartBtn.querySelector('[data-btn-label]') : null;
    const btnPrice = addToCartBtn ? addToCartBtn.querySelector('[data-btn-price]') : null;
    const alertBox = document.getElementById('ProductAlert-{{ section.id }}');
    const statusEl = root.querySelector('[data-status]');
    const statusText = statusEl ? statusEl.querySelector('[data-status-text]') : null;
    const whatsAppBtn = document.getElementById('WhatsAppBtn-{{ section.id }}');
    const srStatus = root.querySelector('[data-sr-status]');
    const priceNow = root.querySelector('[data-price-now]');
    const priceWas = root.querySelector('[data-price-was]');
    const priceOff = root.querySelector('[data-price-off]');

    const hasSizeOption = {% if has_size_option %}true{% else %}false{% endif %};
    const hasOnlyDefaultVariant = {% if only_default %}true{% else %}false{% endif %};
    const baseCents = {{ adot_price }};
    const productAvailable = {% if product.available %}true{% else %}false{% endif %};

    const selectedOptions = {};
    let current = hasOnlyDefaultVariant && variants.length ? variants[0] : null;
    let unavailable = false;
    let status = 'idle';
    let doneTimer = 0;

    if (btnLabel) btnLabel.dataset.text = btnLabel.textContent.trim();
    if (priceNow) priceNow.dataset.text = priceNow.textContent.trim();
    if (btnPrice) btnPrice.dataset.text = btnPrice.textContent.trim();

    function formatMoney(cents) {
      return 'Rs. ' + (cents / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 });
    }

    function announce(message) {
      if (srStatus) srStatus.textContent = message;
    }

    /* Rolling label: old text lifts out, new text rises in. Interruptible. */
    function roll(el, text) {
      if (!el || el.dataset.text === text) return;
      el.dataset.text = text;
      if (reduce.matches || !el.animate) {
        el.textContent = text;
        return;
      }
      el.getAnimations().forEach((a) => a.cancel());
      const out = el.animate(
        [
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
          { opacity: 0, transform: 'translateY(-40%)', filter: 'blur(2px)' }
        ],
        { duration: 110, easing: EASE, fill: 'forwards' }
      );
      out.finished
        .then(() => {
          if (el.dataset.text !== text) return;
          el.textContent = text;
          out.cancel();
          el.animate(
            [
              { opacity: 0, transform: 'translateY(40%)', filter: 'blur(2px)' },
              { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }
            ],
            { duration: 220, easing: EASE }
          );
        })
        .catch(() => {});
    }

    /* Odometer: only the characters that changed roll, right to left. Collapses back to plain text. */
    function rollNumber(el, next) {
      if (!el) return;
      const prev = el.dataset.text;
      el.dataset.text = next;
      if (prev === undefined || prev === next || reduce.matches || !el.animate) {
        el.textContent = next;
        return;
      }
      const a = Array.from(prev);
      const b = Array.from(next);
      const n = Math.max(a.length, b.length);
      while (a.length < n) a.unshift('');
      while (b.length < n) b.unshift('');

      clearTimeout(el._odoTimer);
      el.textContent = '';
      b.forEach((ch, i) => {
        if (ch === a[i]) {
          el.append(document.createTextNode(ch));
          return;
        }
        const col = document.createElement('span');
        col.className = 'odo';
        const was = document.createElement('span');
        const now = document.createElement('span');
        was.textContent = a[i] || '\u00a0';
        now.textContent = ch || '\u00a0';
        col.append(was, now);
        el.append(col);
        const delay = (n - 1 - i) * 28;
        was.animate(
          [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-110%)', opacity: 0 }],
          { duration: 420, delay: delay, easing: EASE, fill: 'both' }
        );
        now.animate(
          [{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: 520, delay: delay, easing: EASE, fill: 'both' }
        );
      });
      el._odoTimer = setTimeout(() => {
        if (el.dataset.text === next) el.textContent = next;
      }, 520 + n * 28 + 80);
    }

    /* Single source of truth for the CTA */
    function render() {
      let state;
      let label = '';
      const cents = current ? current.price : baseCents;

      if (status === 'loading') {
        state = 'loading';
        label = 'Adding';
      } else if (status === 'done') {
        state = 'done';
        label = 'Added to bag';
      } else if (!hasOnlyDefaultVariant && unavailable) {
        state = 'sold-out';
        label = 'Unavailable';
      } else if (!current) {
        state = 'needs-size';
        label = hasSizeOption ? 'Select a size' : 'Select an option';
      } else if (!current.available) {
        state = 'sold-out';
        label = 'Sold out';
      } else {
        state = 'ready';
        label = 'Add to bag';
      }

      if (addToCartBtn) {
        addToCartBtn.dataset.state = state;
        addToCartBtn.setAttribute('aria-disabled', state === 'needs-size' || state === 'sold-out' ? 'true' : 'false');
        addToCartBtn.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
      }
      if (label) roll(btnLabel, label);
      rollNumber(btnPrice, formatMoney(cents));

      window.dispatchEvent(new CustomEvent('pdp:state', { detail: { state: state, label: label, cents: cents } }));
    }

    function renderPrice(variant) {
      rollNumber(priceNow, formatMoney(variant.price));
      const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
      if (priceNow) priceNow.classList.toggle('is-sale', !!onSale);
      if (priceWas) {
        priceWas.hidden = !onSale;
        if (onSale) priceWas.textContent = formatMoney(variant.compare_at_price);
      }
      if (priceOff) {
        priceOff.hidden = !onSale;
        if (onSale) {
          priceOff.textContent = '\u2212' + Math.round(((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price) + '%';
        }
      }
      if (priceProp) priceProp.value = formatMoney(variant.price);
    }

    function setStatus(text, tone) {
      if (!statusEl || !statusText) return;
      statusEl.dataset.tone = tone;
      if (statusText.textContent !== text) roll(statusText, text);
    }

    /* ---------------------------------------------------- live measurements */
    let sizeData = null;
    function getSizeData() {
      if (sizeData) return sizeData;
      const el = document.getElementById('AdotSizeData');
      if (!el) return null;
      try { sizeData = JSON.parse(el.textContent); } catch (err) { sizeData = null; }
      return sizeData;
    }

    function paintMeasure(group, value) {
      const box = group.querySelector('[data-measure]');
      if (!box) return;
      const hint = box.querySelector('[data-measure-hint]');
      const grid = box.querySelector('[data-measure-grid]');
      const data = getSizeData();
      const cat = data && data.find((c) => c.key === box.dataset.cat);
      const wanted = String(value).toUpperCase();
      const row = cat && cat.rows.find((r) => r.keys.some((k) => String(k).toUpperCase() === wanted));

      if (!row) {
        hint.hidden = false;
        grid.hidden = true;
        return;
      }
      grid.innerHTML = cat.cols
        .map((c, i) => '<div><dt>' + c + '</dt><dd>' + row.v[i] + '<small> cm</small></dd></div>')
        .join('');
      hint.hidden = true;
      grid.hidden = false;
      if (!reduce.matches && grid.animate) {
        grid.animate(
          [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 300, easing: EASE }
        );
      }
    }

    /* ---------------------------------------------------------- size indicator */
    function placeIndicator(group) {
      const indicator = group.querySelector('.pdp-sizes__ind');
      const selected = group.querySelector('.pdp-size.is-selected');
      if (!indicator) return;
      if (!selected) {
        indicator.classList.remove('is-on');
        return;
      }
      indicator.style.width = selected.offsetWidth + 'px';
      indicator.style.height = selected.offsetHeight + 'px';
      const move = 'translate(' + selected.offsetLeft + 'px,' + selected.offsetTop + 'px)';
      if (!indicator.classList.contains('is-on')) {
        // First pick: appear in place, then travel on later picks.
        indicator.style.transitionProperty = 'opacity';
        indicator.style.transform = move;
        void indicator.offsetWidth;
        indicator.classList.add('is-on');
        indicator.style.transitionProperty = '';
      } else {
        indicator.style.transform = move;
      }
    }

    const groups = [...root.querySelectorAll('.pdp-opt')];
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => groups.forEach(placeIndicator));
      groups.forEach((g) => ro.observe(g));
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => groups.forEach(placeIndicator));

    /* ---------------------------------------------------------------- selection */
    function selectCell(cell) {
      if (cell.classList.contains('is-sold-out')) return;

      const group = cell.closest('.pdp-opt');
      if (!group) return;

      group.classList.remove('has-error');
      group.classList.add('has-selection');
      if (alertBox) alertBox.hidden = true;

      const optionIndex = group.dataset.optionIndex;
      const val = cell.dataset.optionValue;

      group.querySelectorAll('.pdp-size').forEach((c) => {
        const on = c === cell;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-checked', on ? 'true' : 'false');
        c.tabIndex = on ? 0 : -1;
      });
      placeIndicator(group);

      const label = group.querySelector('[data-option-selected-label]');
      if (label) roll(label, val);

      selectedOptions[optionIndex] = val;
      if (sizeProp && /size/i.test(cell.dataset.optionName || '')) {
        sizeProp.value = val;
        paintMeasure(group, val);
      }

      refreshAvailability();

      const totalOptions = groups.length;
      if (Object.keys(selectedOptions).length !== totalOptions) {
        current = null;
        unavailable = false;
        render();
        return;
      }

      const matched = variants.find((variant) =>
        Object.entries(selectedOptions).every(([idx, optVal]) => variant.options[parseInt(idx, 10)] === optVal)
      );
      if (matched) onVariantSelected(matched);
      else onVariantUnavailable();
    }

    groups.forEach((group) => {
      const cells = [...group.querySelectorAll('.pdp-size')];
      cells.forEach((cell) => {
        cell.addEventListener('click', () => selectCell(cell));
      });

      // Radio group keyboard model: arrows move and select, Tab leaves the group.
      group.addEventListener('keydown', (e) => {
        const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        if (!keys.includes(e.key)) return;
        const live = cells.filter((c) => !c.classList.contains('is-sold-out'));
        if (!live.length) return;
        e.preventDefault();
        const at = live.indexOf(document.activeElement);
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
        const next = live[(at + step + live.length) % live.length];
        next.focus();
        selectCell(next);
      });
    });

    function onVariantSelected(variant) {
      current = variant;
      unavailable = false;
      variantInput.value = variant.id;

      const url = new URL(window.location);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);

      renderPrice(variant);

      window.dispatchEvent(new CustomEvent('variant:change', {
        detail: {
          variant: variant,
          mediaId: variant.featured_media ? variant.featured_media.id : (variant.featured_image ? variant.featured_image.id : null)
        }
      }));

      if (!variant.available) {
        setStatus('Sold out in this size', 'out');
      } else if (variant.inventory_management && variant.inventory_quantity > 0 && variant.inventory_quantity <= 3) {
        setStatus('Only ' + variant.inventory_quantity + ' left', 'low');
      } else {
        setStatus('In stock', 'ok');
      }

      render();
      announce(variant.title + (variant.available ? ' selected, ' + formatMoney(variant.price) : ' is sold out'));
    }

    function onVariantUnavailable() {
      current = null;
      unavailable = true;
      variantInput.value = '';
      setStatus('Unavailable', 'out');
      render();
      announce('This combination is unavailable');
    }

    function refreshAvailability() {
      if (groups.length < 2) return;
      groups.forEach((group) => {
        const optionIndex = parseInt(group.dataset.optionIndex, 10);
        group.querySelectorAll('.pdp-size').forEach((cell) => {
          const value = cell.dataset.optionValue;
          const possible = variants.some((variant) => {
            if (!variant.available || variant.options[optionIndex] !== value) return false;
            return Object.entries(selectedOptions).every(([index, selectedValue]) => {
              if (parseInt(index, 10) === optionIndex) return true;
              return variant.options[parseInt(index, 10)] === selectedValue;
            });
          });
          cell.classList.toggle('is-sold-out', !possible);
          if (possible) cell.removeAttribute('aria-disabled');
          else cell.setAttribute('aria-disabled', 'true');
        });
      });
    }

    /* Draw attention to the missing choice. Restart the nudge each time. */
    function requireSizeSelection() {
      const group = groups[0];
      if (group) {
        group.classList.remove('has-error');
        void group.offsetWidth;
        group.classList.add('has-error');
        const rect = group.getBoundingClientRect();
        const visible = rect.top >= 80 && rect.bottom <= window.innerHeight - 100;
        if (!visible) group.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
      }
      if (alertBox) {
        alertBox.textContent = hasSizeOption ? 'Select a size to continue.' : 'Select an option to continue.';
        alertBox.hidden = false;
      }
    }

    /* ------------------------------------------------------------------- submit */
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (status === 'loading') return;

        if (!variantInput.value) {
          requireSizeSelection();
          return;
        }
        if (current && !current.available) return;

        clearTimeout(doneTimer);
        status = 'loading';
        render();

        const formData = new FormData(form);
        formData.set('id', variantInput.value);
        formData.set('quantity', 1);

        fetch('{{ routes.cart_add_url }}.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData
        })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((errData) => {
                throw new Error(errData.description || 'Unable to add this item. Try again.');
              });
            }
            return res.json();
          })
          .then(() => {
            if (alertBox) alertBox.hidden = true;
            status = 'done';
            render();
            announce('Added to bag');
            window.dispatchEvent(new CustomEvent('cart:refresh'));
            window.dispatchEvent(new CustomEvent('cart:open'));
            doneTimer = setTimeout(() => {
              status = 'idle';
              render();
            }, 2200);
          })
          .catch((err) => {
            status = 'idle';
            render();
            if (alertBox) {
              alertBox.textContent = err.message || 'Unable to add this item. Check your connection and try again.';
              alertBox.hidden = false;
            }
          });
      });
    }

    if (whatsAppBtn) {
      whatsAppBtn.addEventListener('click', () => {
        if (!variantInput.value) {
          requireSizeSelection();
          return;
        }

        const phone = whatsAppBtn.dataset.phone;
        const title = whatsAppBtn.dataset.productTitle;
        const selectedSize = (sizeProp && sizeProp.value) || 'Standard';
        const price = formatMoney(current ? current.price : baseCents);
        const message =
          "Hi ADOT, I'd like to order *" + title + '* in size *' + selectedSize + '* (Price: ' + price + ').\n' +
          'Link: ' + window.location.href + '\nPayment method: Cash on delivery.';
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
      });
    }

    /* Buttons: the inversion starts from the point of entry */
    function trackEntry(btn) {
      if (!btn || !fine.matches) return;
      const set = (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--fx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        btn.style.setProperty('--fy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      };
      btn.addEventListener('pointerenter', set);
      btn.addEventListener('pointerleave', set);
    }
    trackEntry(addToCartBtn);
    trackEntry(whatsAppBtn);

    /* ----------------------------------------------------------- delivery dates */
    const eta = root.querySelector('[data-eta]');
    const etaRange = eta ? eta.querySelector('[data-eta-range]') : null;
    if (eta && etaRange) {
      const min = parseInt(eta.dataset.min, 10) || 2;
      const max = Math.max(min, parseInt(eta.dataset.max, 10) || 4);
      const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const addWorkingDays = (n) => {
        const d = new Date();
        let left = n;
        while (left > 0) {
          d.setDate(d.getDate() + 1);
          if (d.getDay() !== 0) left--; // couriers rest on Sunday
        }
        return d;
      };
      const from = fmt.format(addWorkingDays(min));
      const to = fmt.format(addWorkingDays(max));
      etaRange.textContent = from === to ? from : from + ' to ' + to;
      eta.hidden = false;
    }

    /* -------------------------------------------------------------- inbound events */
    // Any other part of the page (size guide, quick-add dock) picks an option through here.
    window.addEventListener('pdp:select-option', (e) => {
      const d = e.detail || {};
      if (d.value === undefined) return;
      const group = d.index !== undefined && d.index !== null
        ? root.querySelector('.pdp-opt[data-option-index="' + d.index + '"]')
        : (groups.find((g) => /size/i.test(g.dataset.optionName || '')) || groups[0]);
      if (!group) return;
      const wanted = String(d.value).toUpperCase();
      const cell = [...group.querySelectorAll('.pdp-size')].find((c) => c.dataset.optionValue.toUpperCase() === wanted);
      if (cell) selectCell(cell);
    });

    window.addEventListener('pdp:sticky-add', () => {
      if (!variantInput.value) requireSizeSelection();
      else if (form) form.requestSubmit();
    });

    /* Deep link: ?variant=ID selects the matching cells. Deferred so the size data (rendered later in the page) exists. */
    setTimeout(() => {
      const variantParam = new URLSearchParams(window.location.search).get('variant');
      if (!variantParam) return;
      const linked = variants.find((variant) => String(variant.id) === variantParam && variant.available);
      if (!linked) return;
      linked.options.forEach((optionValue, index) => {
        const group = root.querySelector('.pdp-opt[data-option-index="' + index + '"]');
        if (!group) return;
        const match = [...group.querySelectorAll('.pdp-size')].find((c) => c.dataset.optionValue === optionValue);
        if (match && !match.classList.contains('is-sold-out')) selectCell(match);
      });
    }, 0);

    render();
  })();
</script>
```

### 7.5 `snippets/product-sticky-bar.liquid`

```liquid
{% doc %}
  Product Dock (mobile, < 990px)

  Pinned to the bottom once the main "Add to bag" button has scrolled away.
  - With no size chosen, the CTA opens a size row inside the dock. Pick, and the row folds away
    and the button becomes "Add to bag". The buyer never has to scroll back up.
  - Mirrors the buy box through `pdp:state` and `variant:change`.
  - Sends the choice back through `pdp:select-option`; submits through `pdp:sticky-add`.
  - Products with more than one non-colour option skip the size row and fall back to the old behaviour
    (the tap scrolls the buy box to the ruler and flags it).
  - Safe-area aware. Hides itself while a dialog or the cart drawer is open.

  @param {product} product - The product object
  @param {section} section - The parent section
{% enddoc %}

{% capture sticky_price_formatted %}{% render 'money', price: product.price %}{% endcapture %}
{%- liquid
  assign dock_default = false
  if product.has_only_default_variant or product.variants.size == 1
    assign dock_default = true
  endif

  assign visible_count = 0
  assign dock_index = -1
  for option in product.options_with_values
    assign opt_lc = option.name | downcase
    unless opt_lc contains 'color' or opt_lc contains 'colour'
      assign visible_count = visible_count | plus: 1
      assign dock_index = forloop.index0
      assign dock_option = option
    endunless
  endfor

  assign dock_chips = false
  if visible_count == 1 and dock_default == false
    assign dock_chips = true
  endif

  assign dock_cols = dock_option.values.size
  if dock_cols > 5
    assign dock_cols = 5
  endif

  assign type_lc = product.type | downcase
  assign dock_cat = 'hoodies'
  if type_lc contains 'shirt' or type_lc contains 'tee'
    assign dock_cat = 'shirts'
  elsif type_lc contains 'trouser' or type_lc contains 'pant' or type_lc contains 'jogger'
    assign dock_cat = 'trousers'
  endif
-%}

<div class="pdp-dock" id="ProductStickyBar-{{ section.id }}" data-sticky-bar role="region" aria-label="Quick add">
  {%- if dock_chips -%}
    <div class="pdp-dock__sizes" id="DockSizes-{{ section.id }}" data-dock-sizes inert>
      <div class="pdp-dock__sizes-clip">
        <div class="pdp-dock__sizes-head">
          <span class="pdp-dock__sizes-label">{{ dock_option.name }}</span>
          {%- if dock_option.name contains 'ize' -%}
            <button type="button" class="pdp-link" data-open-size-guide data-size-category="{{ dock_cat }}" aria-haspopup="dialog">Size guide</button>
          {%- endif -%}
        </div>

        <div class="pdp-dock__chips" role="radiogroup" aria-label="{{ dock_option.name }}" data-dock-chips style="--cols:{{ dock_cols }}">
          {%- for value in dock_option.values -%}
            {%- liquid
              assign chip_ok = false
              for variant in product.variants
                if variant.options[dock_index] == value and variant.available
                  assign chip_ok = true
                  break
                endif
              endfor
            -%}
            <button
              type="button"
              role="radio"
              aria-checked="false"
              class="pdp-dock__chip{% unless chip_ok %} is-sold-out{% endunless %}"
              data-dock-chip
              data-index="{{ dock_index }}"
              data-value="{{ value | escape }}"
              {% unless chip_ok %}aria-disabled="true" aria-label="{{ value | escape }}, sold out"{% endunless %}
            >{{ value }}</button>
          {%- endfor -%}
        </div>
      </div>
    </div>
  {%- endif -%}

  <div class="pdp-dock__row">
    <div class="pdp-dock__thumb">
      {%- if product.featured_image -%}
        {{
          product.featured_image
          | image_url: width: 120
          | image_tag:
            loading: 'lazy',
            alt: '',
            class: 'pdp-dock__img',
            width: 40,
            height: 52
        }}
      {%- endif -%}
    </div>

    <div class="pdp-dock__meta">
      <span class="pdp-dock__title">{{ product.title }}</span>
      <span class="pdp-dock__sub">
        <span class="pdp-dock__price" data-sticky-price>{{ sticky_price_formatted | strip }}</span>
        {%- if dock_chips -%}
          <button
            type="button"
            class="pdp-dock__size"
            data-dock-toggle
            aria-expanded="false"
            aria-controls="DockSizes-{{ section.id }}"
          >
            <span data-sticky-size-label>Select a size</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 6.5L5 3.5l3 3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        {%- elsif dock_default == false -%}
          <span class="pdp-dock__size-text" data-sticky-size-label>Select a size</span>
        {%- endif -%}
      </span>
    </div>

    <button
      type="button"
      class="pdp-dock__cta"
      id="ProductStickyCta-{{ section.id }}"
      data-sticky-cta
      data-state="{% if dock_default %}ready{% else %}needs-size{% endif %}"
    >
      <span data-sticky-btn-text>{% if dock_default %}Add to bag{% else %}Select a size{% endif %}</span>
    </button>
  </div>
</div>

<style>
  .pdp-dock {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 85;
    padding: 0 var(--page-margin, 1rem) max(0.75rem, env(safe-area-inset-bottom, 0px));
    background: var(--pdp-paper, #fff);
    border-top: 1px solid var(--pdp-line, oklch(0 0 0 / 0.1));
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 480ms var(--pdp-ease-expo, cubic-bezier(0.16, 1, 0.3, 1)),
      opacity 200ms var(--pdp-ease, ease);
  }

  .pdp-dock.is-visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  @media (min-width: 990px) {
    .pdp-dock {
      display: none !important;
    }
  }

  body:has(dialog[open]) .pdp-dock,
  body:has(cart-drawer.is-open) .pdp-dock,
  .pdp-dock.is-hidden {
    transform: translateY(100%) !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* ---- size row: folds open with a grid-rows transition, so no height maths */
  .pdp-dock__sizes {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 460ms var(--pdp-ease-expo, cubic-bezier(0.16, 1, 0.3, 1));
  }

  .pdp-dock.is-open .pdp-dock__sizes {
    grid-template-rows: 1fr;
  }

  .pdp-dock__sizes-clip {
    min-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: opacity 240ms var(--pdp-ease, ease);
  }

  .pdp-dock.is-open .pdp-dock__sizes-clip {
    opacity: 1;
    transition-delay: 80ms;
  }

  .pdp-dock__sizes-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--s-3, 0.75rem);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui, 0.875rem);
    font-weight: 600;
    color: var(--pdp-ink, #111);
  }

  .pdp-dock__sizes-head .pdp-link {
    min-height: 36px;
  }

  .pdp-dock__chips {
    display: grid;
    grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr));
    gap: 6px;
    padding: var(--s-2, 0.5rem) 0 var(--s-3, 0.75rem);
  }

  .pdp-dock__chip {
    position: relative;
    height: 2.75rem;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--pdp-line-2, oklch(0 0 0 / 0.24));
    color: var(--pdp-ink, #111);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui, 0.875rem);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color 200ms var(--pdp-ease, ease),
      color 200ms var(--pdp-ease, ease),
      box-shadow 200ms var(--pdp-ease, ease),
      transform 160ms var(--pdp-ease, ease);
  }

  .pdp-dock__chip:active:not(.is-sold-out) {
    transform: scale(0.95);
  }

  .pdp-dock__chip.is-selected {
    background: var(--pdp-btn-bg, #111);
    color: var(--pdp-btn-fg, #fff);
    box-shadow: inset 0 0 0 1px var(--pdp-btn-bg, #111);
  }

  .pdp-dock__chip.is-sold-out {
    color: var(--pdp-ink-3, #6b6b6b);
    box-shadow: inset 0 0 0 1px var(--pdp-line, oklch(0 0 0 / 0.1));
    text-decoration: line-through;
    text-decoration-thickness: 1px;
    cursor: not-allowed;
  }

  .pdp-dock__chips.has-error .pdp-dock__chip:not(.is-sold-out):not(.is-selected) {
    box-shadow: inset 0 0 0 1px var(--pdp-sale, #991b1b);
  }

  .pdp-dock__chips.has-error {
    animation: pdp-nudge 340ms var(--pdp-ease, ease);
  }

  /* ---- main row */
  .pdp-dock__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3, 0.75rem);
    padding-top: var(--s-3, 0.75rem);
    max-width: var(--container-max, 1440px);
    margin: 0 auto;
  }

  .pdp-dock__thumb {
    position: relative;
    flex-shrink: 0;
    width: 40px;
    height: 52px;
    overflow: hidden;
    background: var(--pdp-sunk, #f5f5f5);
  }

  .pdp-dock__thumb::after {
    content: '';
    position: absolute;
    inset: 0;
    outline: 1px solid oklch(0 0 0 / 0.1);
    outline-offset: -1px;
  }

  .pdp-dock__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .pdp-dock__meta {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .pdp-dock__title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui, 0.875rem);
    font-weight: 500;
    letter-spacing: -0.005em;
    color: var(--pdp-ink, #111);
  }

  .pdp-dock__sub {
    display: flex;
    align-items: center;
    gap: var(--s-2, 0.5rem);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-small, 0.8125rem);
    font-variant-numeric: tabular-nums;
    color: var(--pdp-ink-2, #555);
  }

  .pdp-dock__price {
    font-weight: 500;
    color: var(--pdp-ink, #111);
  }

  .pdp-dock__size,
  .pdp-dock__size-text {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
  }

  .pdp-dock__size {
    min-height: 28px;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .pdp-dock__size::before,
  .pdp-dock__size-text::before {
    content: '';
    width: 1px;
    height: 0.75em;
    background: currentColor;
    opacity: 0.4;
  }

  .pdp-dock__size svg {
    transition: transform 320ms var(--pdp-ease, ease);
    transform: rotate(180deg);
  }

  .pdp-dock.is-open .pdp-dock__size svg {
    transform: rotate(0deg);
  }

  .pdp-dock__cta {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 9.5rem;
    min-height: 3rem;
    padding: 0 var(--s-5, 1.5rem);
    border: 0;
    background: var(--pdp-btn-bg, #111);
    color: var(--pdp-btn-fg, #fff);
    box-shadow: inset 0 0 0 1px var(--pdp-btn-bg, #111);
    font-family: var(--pdp-font);
    font-size: var(--pdp-fs-ui, 0.875rem);
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color 220ms var(--pdp-ease, ease),
      color 220ms var(--pdp-ease, ease),
      box-shadow 220ms var(--pdp-ease, ease),
      transform 160ms var(--pdp-ease, ease);
  }

  .pdp-dock__cta:active {
    transform: scale(0.97);
  }

  .pdp-dock__cta[data-state='needs-size'] {
    background: var(--pdp-paper, #fff);
    color: var(--pdp-ink, #111);
    box-shadow: inset 0 0 0 1px var(--pdp-line-2, oklch(0 0 0 / 0.24));
  }

  .pdp-dock__cta[data-state='sold-out'] {
    background: var(--pdp-sunk, #f5f5f5);
    color: var(--pdp-ink-3, #6b6b6b);
    box-shadow: inset 0 0 0 1px var(--pdp-line, oklch(0 0 0 / 0.1));
  }

  .pdp-dock__cta[data-state='done'] {
    background: var(--pdp-ok, #166534);
    box-shadow: inset 0 0 0 1px var(--pdp-ok, #166534);
  }

  .pdp-dock__cta[data-state='loading'] {
    opacity: 0.7;
  }

  @media (prefers-reduced-motion: reduce) {
    .pdp-dock {
      transition-property: opacity;
    }

    .pdp-dock__sizes,
    .pdp-dock__sizes-clip {
      transition-duration: 0.01ms;
    }

    .pdp-dock__chips.has-error {
      animation: none;
    }
  }
</style>

<script>
  (function () {
    const dock = document.getElementById('ProductStickyBar-{{ section.id }}');
    if (!dock) return;

    const cta = dock.querySelector('[data-sticky-cta]');
    const ctaText = dock.querySelector('[data-sticky-btn-text]');
    const priceEl = dock.querySelector('[data-sticky-price]');
    const sizeLabel = dock.querySelector('[data-sticky-size-label]');
    const sizesEl = dock.querySelector('[data-dock-sizes]');
    const chipsEl = dock.querySelector('[data-dock-chips]');
    const toggle = dock.querySelector('[data-dock-toggle]');
    const chips = [...dock.querySelectorAll('[data-dock-chip]')];
    const mainCta = document.getElementById('AddToCartBtn-{{ section.id }}');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    let state = '{% if dock_default %}ready{% else %}needs-size{% endif %}';
    let isPastButton = false;
    let open = false;
    let closeTimer = 0;

    function setOpen(next) {
      open = !!next && chips.length > 0;
      dock.classList.toggle('is-open', open);
      if (sizesEl) sizesEl.inert = !open;
      if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function swap(el, text) {
      if (!el || el.textContent === text) return;
      if (reduce.matches || !el.animate) {
        el.textContent = text;
        return;
      }
      el.textContent = text;
      el.animate(
        [{ opacity: 0, transform: 'translateY(35%)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }

    function updateVisibility() {
      dock.classList.toggle('is-visible', isPastButton && window.scrollY >= 300);
      if (!dock.classList.contains('is-visible') && open) setOpen(false);
    }

    /* Show the dock only after the main button has left the top of the viewport */
    if (mainCta && 'IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isPastButton = !(entry.isIntersecting || entry.boundingClientRect.top > 0);
            updateVisibility();
          });
        },
        { threshold: 0 }
      ).observe(mainCta);
    } else {
      window.addEventListener('scroll', () => {
        isPastButton = window.scrollY > 450;
        updateVisibility();
      }, { passive: true });
    }
    window.addEventListener('scroll', updateVisibility, { passive: true });

    /* Mirror the buy box's single CTA state */
    window.addEventListener('pdp:state', (e) => {
      const detail = e.detail || {};
      state = detail.state || state;
      if (cta) cta.dataset.state = state;
      if (detail.label) swap(ctaText, detail.label);
      if (priceEl && typeof detail.cents === 'number') {
        priceEl.textContent = 'Rs. ' + (detail.cents / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 });
      }
    });

    window.addEventListener('variant:change', (e) => {
      const variant = e.detail && e.detail.variant;
      if (!variant) return;
      if (sizeLabel) sizeLabel.textContent = variant.title;
      chips.forEach((chip) => {
        const on = String(variant.options[chip.dataset.index]).toUpperCase() === chip.dataset.value.toUpperCase();
        chip.classList.toggle('is-selected', on);
        chip.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('is-sold-out')) return;
        window.dispatchEvent(new CustomEvent('pdp:select-option', {
          detail: { index: parseInt(chip.dataset.index, 10), value: chip.dataset.value }
        }));
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => setOpen(false), reduce.matches ? 0 : 300);
      });
    });

    if (toggle) toggle.addEventListener('click', () => setOpen(!open));

    function nudge() {
      if (!chipsEl) return;
      chipsEl.classList.remove('has-error');
      void chipsEl.offsetWidth;
      chipsEl.classList.add('has-error');
    }

    if (cta) {
      cta.addEventListener('click', () => {
        // No size yet and the dock can offer sizes: open the row, or flag it if it is already open.
        if (state === 'needs-size' && chips.length) {
          if (!open) setOpen(true);
          else nudge();
          return;
        }
        // Otherwise same path as the main button: validation, scrolling and the nudge live in one place.
        window.dispatchEvent(new CustomEvent('pdp:sticky-add'));
      });
    }

    document.addEventListener('pointerdown', (e) => {
      if (open && !dock.contains(e.target)) setOpen(false);
    });

    dock.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        if (toggle) toggle.focus();
      }
    });
  })();
</script>
```

### 7.6 `snippets/size-guide.liquid`

```liquid
{% doc %}
  Size Guide

  - Native <dialog>. Desktop: a sheet that slides in from the right. Mobile: a bottom sheet you can drag down to close.
  - One data block below drives the tables AND the live measurements shown under the size ruler
    (the buy box reads it from the JSON script tag with id AdotSizeData). Edit sizes in one place only.
  - cm / in flips each number in place (no re-render).
  - If the product has the size, a "Select" button on that row picks it in the buy box and closes the sheet.
  - The row for the currently selected size is marked.

  Opened by any element with [data-open-size-guide] (optionally data-size-category="hoodies|shirts|trousers").
{% enddoc %}

{%- capture sg_json -%}
[
  {
    "key": "hoodies",
    "label": "Hoodies",
    "cols": ["Chest", "Length", "Shoulder", "Sleeve"],
    "note": "Boxy, relaxed drape. Fits true to size: take your regular size for an oversized silhouette.",
    "rows": [
      { "size": "S",  "keys": ["S"],  "v": [116, 68, 54, 61] },
      { "size": "M",  "keys": ["M"],  "v": [122, 70, 56, 62] },
      { "size": "L",  "keys": ["L"],  "v": [128, 72, 58, 63] },
      { "size": "XL", "keys": ["XL"], "v": [134, 74, 60, 64] }
    ]
  },
  {
    "key": "shirts",
    "label": "Shirts",
    "cols": ["Chest", "Length", "Shoulder", "Neck"],
    "note": "Tailored casual drape with a clean shoulder line and comfortable room through the chest.",
    "rows": [
      { "size": "S",  "keys": ["S"],  "v": [108, 74, 48, 39] },
      { "size": "M",  "keys": ["M"],  "v": [114, 76, 50, 41] },
      { "size": "L",  "keys": ["L"],  "v": [120, 78, 52, 43] },
      { "size": "XL", "keys": ["XL"], "v": [126, 80, 54, 45] }
    ]
  },
  {
    "key": "trousers",
    "label": "Trousers",
    "cols": ["Waist", "Inseam", "Rise", "Opening"],
    "note": "Relaxed straight leg with a tailored waistband. Order your standard waist size.",
    "rows": [
      { "size": "30 (S)",  "keys": ["30", "S"],  "v": [78, 76, 30, 22] },
      { "size": "32 (M)",  "keys": ["32", "M"],  "v": [83, 77, 31, 23] },
      { "size": "34 (L)",  "keys": ["34", "L"],  "v": [88, 78, 32, 24] },
      { "size": "36 (XL)", "keys": ["36", "XL"], "v": [93, 79, 33, 25] }
    ]
  }
]
{%- endcapture -%}
{%- assign sg = sg_json | parse_json -%}

<script type="application/json" id="AdotSizeData">{{ sg | json }}</script>

<dialog id="SizeGuideDialog" class="sg" aria-labelledby="SizeGuideTitle" data-unit="cm">
  <div class="sg__sheet" data-sg-sheet>
    <div class="sg__grab" data-sg-grab aria-hidden="true"><i></i></div>

    <header class="sg__head" data-sg-grab>
      <div>
        <h2 id="SizeGuideTitle" class="sg__title">Size guide</h2>
        <p class="sg__sub">Garment measurements, laid flat and relaxed.</p>
      </div>
      <button type="button" class="sg__close" data-close-size-guide aria-label="Close size guide">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </header>

    <div class="sg__tools">
      <div class="sg__seg" role="tablist" aria-label="Garment type" data-seg>
        <span class="sg__seg-ind" aria-hidden="true"></span>
        {%- for cat in sg -%}
          <button
            type="button"
            role="tab"
            id="SgTab-{{ cat.key }}"
            aria-controls="SgPanel-{{ cat.key }}"
            aria-selected="{% if forloop.first %}true{% else %}false{% endif %}"
            tabindex="{% if forloop.first %}0{% else %}-1{% endif %}"
            data-tab="{{ cat.key }}"
          >{{ cat.label }}</button>
        {%- endfor -%}
      </div>

      <div class="sg__seg" role="radiogroup" aria-label="Units" data-seg>
        <span class="sg__seg-ind" aria-hidden="true"></span>
        <button type="button" role="radio" aria-checked="true" tabindex="0" data-unit-btn="cm">cm</button>
        <button type="button" role="radio" aria-checked="false" tabindex="-1" data-unit-btn="in">in</button>
      </div>
    </div>

    <div class="sg__body">
      {%- for cat in sg -%}
        <section
          class="sg__panel"
          id="SgPanel-{{ cat.key }}"
          role="tabpanel"
          aria-labelledby="SgTab-{{ cat.key }}"
          data-panel="{{ cat.key }}"
          {% unless forloop.first %}hidden{% endunless %}
        >
          <table class="sg__table">
            <thead>
              <tr>
                <th scope="col">Size</th>
                {%- for col in cat.cols -%}
                  <th scope="col">
                    {{ col }}
                    <span class="sg__unit" aria-hidden="true"><span class="sg__cm">cm</span><span class="sg__in">in</span></span>
                  </th>
                {%- endfor -%}
                <td class="sg__act"></td>
              </tr>
            </thead>
            <tbody>
              {%- for row in cat.rows -%}
                <tr class="sg__row" data-keys="{{ row.keys | join: '|' | escape }}">
                  <th scope="row"><span class="sg__size">{{ row.size }}</span></th>
                  {%- for v in row.v -%}
                    <td>
                      <span class="sg__num">
                        <span class="sg__cm">{{ v }}</span>
                        <span class="sg__in" aria-hidden="true">{{ v | divided_by: 2.54 | round: 1 }}</span>
                      </span>
                    </td>
                  {%- endfor -%}
                  <td class="sg__act">
                    <button type="button" class="sg__pick" data-sg-pick hidden aria-label="Select size {{ row.size }}">
                      <span class="sg__pick-text">Select</span>
                      <svg class="sg__pick-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              {%- endfor -%}
            </tbody>
          </table>
          <p class="sg__note">{{ cat.note }}</p>
        </section>
      {%- endfor -%}
    </div>
  </div>
</dialog>

<style>
  /* The dialog is a full-screen transparent shell. The sheet inside is what you see. */
  .sg {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--pdp-ink, #111);
    overflow: hidden;
    z-index: 9999;
    transition: display 520ms allow-discrete, overlay 520ms allow-discrete;
  }

  .sg::backdrop {
    background: oklch(0 0 0 / 0);
    transition: background-color 520ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .sg[open]::backdrop {
    background: oklch(0 0 0 / 0.45);
  }

  @starting-style {
    .sg[open]::backdrop {
      background: oklch(0 0 0 / 0);
    }
  }

  html:has(.sg[open]) {
    overflow: hidden;
  }

  .sg__sheet {
    position: absolute;
    display: flex;
    flex-direction: column;
    background: var(--pdp-paper, #fff);
    font-family: var(--pdp-font, inherit);
    transition: transform 560ms var(--pdp-ease-expo, cubic-bezier(0.16, 1, 0.3, 1));
    will-change: transform;
  }

  .sg__sheet.is-dragging {
    transition: none;
  }

  /* Mobile: bottom sheet */
  @media (max-width: 989px) {
    .sg__sheet {
      left: 0;
      right: 0;
      bottom: 0;
      max-height: 90dvh;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      transform: translateY(100%);
    }

    .sg[open] .sg__sheet {
      transform: translateY(0);
    }

    @starting-style {
      .sg[open] .sg__sheet {
        transform: translateY(100%);
      }
    }
  }

  /* Desktop: side sheet */
  @media (min-width: 990px) {
    .sg__sheet {
      top: 0;
      right: 0;
      bottom: 0;
      width: min(34rem, 100%);
      transform: translateX(100%);
    }

    .sg[open] .sg__sheet {
      transform: translateX(0);
    }

    @starting-style {
      .sg[open] .sg__sheet {
        transform: translateX(100%);
      }
    }
  }

  .sg__grab {
    display: none;
    justify-content: center;
    padding: 0.625rem 0 0;
    touch-action: none;
    cursor: grab;
  }

  .sg__grab i {
    display: block;
    width: 2.5rem;
    height: 4px;
    background: var(--pdp-line-2, oklch(0 0 0 / 0.24));
  }

  @media (max-width: 989px) {
    .sg__grab {
      display: flex;
    }

    .sg__head {
      touch-action: none;
    }
  }

  .sg__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: clamp(1.25rem, 3vw, 2rem) clamp(1.25rem, 3vw, 2rem) 0;
  }

  .sg__title {
    margin: 0;
    font-family: var(--pdp-font-display, inherit);
    font-size: clamp(1.875rem, 5vw, 2.5rem);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.04em;
    color: var(--pdp-ink, #111);
  }

  .sg__sub {
    margin: 0.5rem 0 0;
    font-size: var(--pdp-fs-small, 0.8125rem);
    color: var(--pdp-ink-3, #6b6b6b);
  }

  .sg__close {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    margin: -0.5rem -0.75rem 0 0;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform 200ms var(--pdp-ease, ease), opacity 160ms var(--pdp-ease, ease);
  }

  .sg__close:active {
    transform: scale(0.92);
  }

  @media (hover: hover) and (pointer: fine) {
    .sg__close:hover {
      opacity: 0.55;
    }
  }

  /* ----- segmented controls with a sliding thumb */
  .sg__tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1.25rem clamp(1.25rem, 3vw, 2rem) 0;
  }

  .sg__seg {
    position: relative;
    display: inline-flex;
    padding: 3px;
    background: var(--pdp-sunk, #f5f5f5);
  }

  .sg__seg-ind {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 0;
    width: 0;
    background: var(--pdp-paper, #fff);
    box-shadow: inset 0 0 0 1px var(--pdp-line-2, oklch(0 0 0 / 0.24));
    transition:
      transform 420ms var(--pdp-spring, cubic-bezier(0.34, 1.35, 0.64, 1)),
      width 420ms var(--pdp-spring, cubic-bezier(0.34, 1.35, 0.64, 1));
  }

  .sg__seg-ind.is-still {
    transition: none;
  }

  .sg__seg button {
    position: relative;
    z-index: 1;
    min-height: 2.25rem;
    padding: 0 1rem;
    border: 0;
    background: none;
    color: var(--pdp-ink-3, #6b6b6b);
    font-family: var(--pdp-font, inherit);
    font-size: var(--pdp-fs-ui, 0.875rem);
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: color 200ms var(--pdp-ease, ease);
  }

  .sg__seg button[aria-selected='true'],
  .sg__seg button[aria-checked='true'] {
    color: var(--pdp-ink, #111);
  }

  /* ----- body + table */
  .sg__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1.5rem clamp(1.25rem, 3vw, 2rem) clamp(1.5rem, 3vw, 2.5rem);
  }

  .sg__table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }

  .sg__table th {
    padding: 0 0.5rem 0.75rem 0;
    text-align: left;
    vertical-align: bottom;
    font-size: var(--pdp-fs-small, 0.8125rem);
    font-weight: 500;
    color: var(--pdp-ink-3, #6b6b6b);
  }

  .sg__table thead th:first-child,
  .sg__table tbody th {
    width: 4.5rem;
  }

  .sg__table td {
    padding: 0 0.5rem 0 0;
    font-size: var(--pdp-fs-body, 0.9375rem);
    color: var(--pdp-ink, #111);
  }

  .sg__row > * {
    height: 3.5rem;
    border-top: 1px solid var(--pdp-line, oklch(0 0 0 / 0.1));
    transition: background-color 200ms var(--pdp-ease, ease);
  }

  .sg__row:last-child > * {
    border-bottom: 1px solid var(--pdp-line, oklch(0 0 0 / 0.1));
  }

  .sg__row > :first-child {
    padding-left: 0.75rem;
  }

  .sg__table thead th:first-child {
    padding-left: 0.75rem;
  }

  .sg__table tbody th {
    text-align: left;
    font-weight: 500;
  }

  .sg__size {
    font-family: var(--pdp-font-display, inherit);
    font-size: 1.25rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    white-space: nowrap;
    color: var(--pdp-ink, #111);
  }

  @media (hover: hover) and (pointer: fine) {
    .sg__row:hover > * {
      background: var(--pdp-sunk, #f5f5f5);
    }
  }

  /* The size currently selected in the buy box */
  .sg__row.is-yours > * {
    background: var(--pdp-sunk, #f5f5f5);
  }

  .sg__row.is-yours > :first-child {
    box-shadow: inset 2px 0 0 var(--pdp-ink, #111);
  }

  /* cm <-> in: the old number lifts out, the new one rises in, in the same cell */
  .sg__num,
  .sg__unit {
    display: inline-grid;
    overflow: hidden;
    vertical-align: bottom;
  }

  .sg__num > span,
  .sg__unit > span {
    grid-area: 1 / 1;
    transition:
      transform 460ms var(--pdp-ease-expo, cubic-bezier(0.16, 1, 0.3, 1)),
      opacity 260ms var(--pdp-ease, ease);
  }

  .sg__unit {
    margin-left: 0.25rem;
    font-weight: 400;
  }

  .sg[data-unit='cm'] .sg__in {
    transform: translateY(110%);
    opacity: 0;
  }

  .sg[data-unit='in'] .sg__cm {
    transform: translateY(-110%);
    opacity: 0;
  }

  .sg__act {
    width: 1%;
    padding-right: 0 !important;
    text-align: right;
    white-space: nowrap;
  }

  .sg__pick {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2.25rem;
    padding: 0 0.875rem;
    border: 0;
    background: transparent;
    color: var(--pdp-ink, #111);
    box-shadow: inset 0 0 0 1px var(--pdp-line-2, oklch(0 0 0 / 0.24));
    font-family: var(--pdp-font, inherit);
    font-size: var(--pdp-fs-small, 0.8125rem);
    font-weight: 500;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color 200ms var(--pdp-ease, ease),
      color 200ms var(--pdp-ease, ease),
      box-shadow 200ms var(--pdp-ease, ease),
      transform 160ms var(--pdp-ease, ease);
  }

  .sg__pick[hidden] {
    display: none;
  }

  .sg__pick:active {
    transform: scale(0.95);
  }

  .sg__pick-icon {
    display: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .sg__pick:hover {
      background: var(--pdp-btn-bg, #111);
      color: var(--pdp-btn-fg, #fff);
      box-shadow: inset 0 0 0 1px var(--pdp-btn-bg, #111);
    }
  }

  @media (max-width: 520px) {
    .sg__pick {
      width: 2.25rem;
      padding: 0;
    }

    .sg__pick-text {
      display: none;
    }

    .sg__pick-icon {
      display: block;
    }

    .sg__table th,
    .sg__table td {
      padding-right: 0.25rem;
    }

    .sg__table td {
      font-size: var(--pdp-fs-ui, 0.875rem);
    }
  }

  .sg__note {
    max-width: 46ch;
    margin: 1.25rem 0 0;
    font-size: var(--pdp-fs-small, 0.8125rem);
    line-height: 1.55;
    color: var(--pdp-ink-2, #555);
    text-wrap: pretty;
  }

  @media (prefers-reduced-motion: reduce) {
    .sg,
    .sg::backdrop,
    .sg__sheet,
    .sg__seg-ind,
    .sg__num > span,
    .sg__unit > span {
      transition-duration: 0.01ms;
    }
  }
</style>

<script>
  (function () {
    const dialog = document.getElementById('SizeGuideDialog');
    if (!dialog) return;

    const sheet = dialog.querySelector('[data-sg-sheet]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 989px)');
    const tabs = [...dialog.querySelectorAll('[role="tab"]')];
    const panels = [...dialog.querySelectorAll('.sg__panel')];
    const unitBtns = [...dialog.querySelectorAll('[data-unit-btn]')];
    const segs = [...dialog.querySelectorAll('[data-seg]')];

    let productCat = '';
    let yours = [];

    /* ------------------------------------------------------- sliding thumbs */
    function moveThumb(seg, still) {
      const ind = seg.querySelector('.sg__seg-ind');
      const on = seg.querySelector('[aria-selected="true"], [aria-checked="true"]');
      if (!ind || !on) return;
      if (still) ind.classList.add('is-still');
      ind.style.width = on.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
      if (still) {
        void ind.offsetWidth;
        ind.classList.remove('is-still');
      }
    }

    function moveAllThumbs(still) {
      segs.forEach((s) => moveThumb(s, still));
    }

    /* ----------------------------------------------------------- categories */
    function setCategory(key, animate) {
      const target = panels.find((p) => p.dataset.panel === key) || panels[0];
      if (!target) return;
      tabs.forEach((t) => {
        const on = t.dataset.tab === target.dataset.panel;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => { p.hidden = p !== target; });
      if (animate && !reduce.matches && target.animate) {
        target.animate(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        );
      }
      moveThumb(tabs[0].parentElement, false);
      refreshRows();
    }

    /* ---------------------------------------------------------------- units */
    function setUnit(unit) {
      dialog.dataset.unit = unit;
      unitBtns.forEach((b) => {
        const on = b.dataset.unitBtn === unit;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      dialog.querySelectorAll('.sg__in').forEach((el) => el.setAttribute('aria-hidden', unit === 'in' ? 'false' : 'true'));
      dialog.querySelectorAll('.sg__num .sg__cm').forEach((el) => el.setAttribute('aria-hidden', unit === 'cm' ? 'false' : 'true'));
      moveThumb(unitBtns[0].parentElement, false);
    }

    /* Arrow keys inside a segmented control */
    function arrowNav(buttons, activate) {
      buttons.forEach((btn) => {
        btn.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          e.preventDefault();
          const step = e.key === 'ArrowRight' ? 1 : -1;
          const next = buttons[(buttons.indexOf(btn) + step + buttons.length) % buttons.length];
          next.focus();
          activate(next);
        });
      });
    }

    tabs.forEach((t) => t.addEventListener('click', () => setCategory(t.dataset.tab, true)));
    unitBtns.forEach((b) => b.addEventListener('click', () => setUnit(b.dataset.unitBtn)));
    arrowNav(tabs, (t) => setCategory(t.dataset.tab, true));
    arrowNav(unitBtns, (b) => setUnit(b.dataset.unitBtn));

    /* ------------------------------------- rows: "your size" + select buttons */
    function findCell(keys) {
      return [...document.querySelectorAll('.pdp-size')].find((c) =>
        keys.some((k) => k === String(c.dataset.optionValue).toUpperCase())
      );
    }

    function refreshRows() {
      panels.forEach((panel) => {
        const isProductPanel = panel.dataset.panel === productCat;
        panel.querySelectorAll('.sg__row').forEach((row) => {
          const keys = row.dataset.keys.split('|').map((k) => k.toUpperCase());
          row.classList.toggle('is-yours', isProductPanel && keys.some((k) => yours.includes(k)));
          const pick = row.querySelector('[data-sg-pick]');
          if (!pick) return;
          const cell = isProductPanel ? findCell(keys) : null;
          pick.hidden = !cell || cell.classList.contains('is-sold-out');
          pick._cell = cell || null;
        });
      });
    }

    dialog.querySelectorAll('[data-sg-pick]').forEach((pick) => {
      pick.addEventListener('click', () => {
        if (!pick._cell) return;
        window.dispatchEvent(new CustomEvent('pdp:select-option', { detail: { value: pick._cell.dataset.optionValue } }));
        window.setTimeout(() => dialog.close(), reduce.matches ? 0 : 240);
      });
    });

    window.addEventListener('variant:change', (e) => {
      const variant = e.detail && e.detail.variant;
      yours = variant ? variant.options.map((o) => String(o).toUpperCase()) : [];
      refreshRows();
    });

    /* ------------------------------------------------------------ open / close */
    function open(trigger) {
      productCat = (trigger && trigger.dataset.sizeCategory) || productCat || (panels[0] && panels[0].dataset.panel);
      setCategory(productCat, false);
      setUnit(dialog.dataset.unit || 'cm');
      if (!dialog.open) dialog.showModal();
      moveAllThumbs(true);
    }

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    dialog.querySelectorAll('[data-close-size-guide]').forEach((b) => {
      b.addEventListener('click', () => dialog.close());
    });

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-size-guide], [data-open-size-modal]');
      if (!trigger) return;
      e.preventDefault();
      open(trigger);
    });

    /* ------------------------------------------- mobile: drag the sheet down */
    dialog.querySelectorAll('[data-sg-grab]').forEach((handle) => {
      let drag = null;

      handle.addEventListener('pointerdown', (e) => {
        if (!mobile.matches || e.target.closest('button')) return;
        drag = { y: e.clientY, dy: 0, last: e.clientY, lastT: performance.now(), v: 0 };
        handle.setPointerCapture(e.pointerId);
        sheet.classList.add('is-dragging');
      });

      handle.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const now = performance.now();
        drag.dy = Math.max(0, e.clientY - drag.y);
        drag.v = (e.clientY - drag.last) / Math.max(1, now - drag.lastT);
        drag.last = e.clientY;
        drag.lastT = now;
        sheet.style.transform = 'translateY(' + drag.dy + 'px)';
      });

      const end = () => {
        if (!drag) return;
        const shouldClose = drag.dy > 110 || drag.v > 0.6;
        drag = null;
        sheet.classList.remove('is-dragging');
        sheet.style.transform = '';
        if (shouldClose) dialog.close();
      };
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });

    window.addEventListener('resize', () => { if (dialog.open) moveAllThumbs(true); }, { passive: true });
  })();
</script>
```

### 7.7 `sections/complete-the-look.liquid`

```liquid
{% comment %}
  Related Items Section (PDP cross-sell)

  - Four pieces, drawn first from the same collection as the current product, then from the whole catalogue.
  - Desktop: 4 columns, the 2nd and 4th drop down so the row reads as a rhythm, not a table.
    Hovering one card softens the others (fine pointer only).
  - Mobile: one swipeable rail, the next card peeks in from the right.
  - The heading is the loudest thing on the page below the fold. The way out ("Shop all") sits on its baseline.
  - Bottom padding clears the mobile dock.
{% endcomment %}

{%- liquid
  assign current_handle = product.handle
  assign rendered_count = 0
  assign shown = ','
  assign primary_collection = product.collections | first
-%}

<section
  class="pdp-more container"
  data-section-id="{{ section.id }}"
  data-section-type="related-items"
  aria-labelledby="RelatedHeading-{{ section.id }}"
>
  <header class="pdp-more__head">
    <h2 class="pdp-more__title" id="RelatedHeading-{{ section.id }}">{{ section.settings.heading | default: 'You may also like' }}</h2>
    <a class="pdp-more__all" href="{{ routes.all_products_collection_url }}">
      <span>Shop all</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3.5 10.5l7-7M4.5 3.5h6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  </header>

  <div class="pdp-more__grid">
    {%- for pass in (1..2) -%}
      {%- if rendered_count >= 4 -%}{%- break -%}{%- endif -%}
      {%- if pass == 1 and primary_collection != blank -%}
        {%- assign pool = primary_collection.products -%}
      {%- elsif pass == 2 -%}
        {%- assign pool = collections.all.products -%}
      {%- else -%}
        {%- continue -%}
      {%- endif -%}

      {%- for prod_item in pool -%}
        {%- assign marker = prod_item.handle | prepend: ',' | append: ',' -%}
        {%- if prod_item.handle == current_handle or prod_item.handle contains 'gift-card' or prod_item.type contains 'Gift' or shown contains marker -%}
          {%- continue -%}
        {%- endif -%}

        <div class="pdp-more__item">
          {% render 'product-card', product: prod_item, lazy_load: true %}
        </div>

        {%- assign shown = shown | append: prod_item.handle | append: ',' -%}
        {%- assign rendered_count = rendered_count | plus: 1 -%}
        {%- if rendered_count == 4 -%}{%- break -%}{%- endif -%}
      {%- endfor -%}
    {%- endfor -%}
  </div>
</section>

{% stylesheet %}
  .section-complete-the-look {
    background-color: var(--color-background, #fff);
    padding-top: clamp(3rem, 6vw, 6rem);
    padding-bottom: clamp(6rem, 8vw, 8rem); /* clears the mobile dock */
  }

  .pdp-more {
    display: flex;
    flex-direction: column;
    gap: clamp(2rem, 4vw, 3.5rem);
  }

  .pdp-more__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    padding-top: clamp(1.5rem, 3vw, 2.5rem);
    border-top: 1px solid oklch(0 0 0 / 0.1);
  }

  .pdp-more__title {
    margin: 0;
    max-width: 14ch;
    font-family: var(--font-display, inherit);
    font-size: clamp(2.5rem, 7.5vw, 6.5rem);
    font-weight: 500;
    line-height: 0.92;
    letter-spacing: -0.05em;
    text-wrap: balance;
    color: var(--color-text, #111);
  }

  .pdp-more__all {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0;
    color: var(--color-text, #111);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    background-image: linear-gradient(currentColor, currentColor);
    background-repeat: no-repeat;
    background-size: 100% 1px;
    background-position: 0 calc(50% + 0.75em);
  }

  .pdp-more__all svg {
    transition: transform 320ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  }

  @media (hover: hover) and (pointer: fine) {
    .pdp-more__all {
      background-size: 0% 1px;
      transition: background-size 320ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
    }

    .pdp-more__all:hover {
      background-size: 100% 1px;
    }

    .pdp-more__all:hover svg {
      transform: translate(2px, -2px);
    }
  }

  .pdp-more__all:focus-visible {
    outline: 2px solid var(--color-text, #111);
    outline-offset: 3px;
  }

  /* Mobile: a rail with the next card peeking in */
  .pdp-more__grid {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 62%;
    gap: 0.75rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    margin-inline: calc(-1 * var(--page-margin, 1rem));
    padding-inline: var(--page-margin, 1rem);
    scroll-padding-inline: var(--page-margin, 1rem);
    touch-action: pan-x pan-y;
  }

  .pdp-more__grid::-webkit-scrollbar {
    display: none;
  }

  .pdp-more__item {
    min-width: 0;
    scroll-snap-align: start;
  }

  @media (min-width: 990px) {
    .pdp-more__grid {
      grid-auto-flow: row;
      grid-auto-columns: auto;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 2.5rem 1.5rem;
      overflow: visible;
      margin-inline: 0;
      padding-inline: 0;
      scroll-snap-type: none;
    }

    /* Rhythm: every second card steps down */
    .pdp-more__item:nth-child(even) {
      margin-top: clamp(2rem, 4vw, 4rem);
    }
  }

  /* Soften the siblings of the card under the pointer */
  @media (hover: hover) and (pointer: fine) {
    .pdp-more__item {
      transition: opacity 360ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
    }

    .pdp-more__grid:has(.pdp-more__item:hover) .pdp-more__item:not(:hover) {
      opacity: 0.45;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pdp-more__item,
    .pdp-more__all,
    .pdp-more__all svg {
      transition-duration: 0.01ms;
    }
  }
{% endstylesheet %}

{% schema %}
{
  "name": "Related Items",
  "tag": "section",
  "class": "section-complete-the-look",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "You may also like"
    }
  ],
  "presets": [
    {
      "name": "Related Items"
    }
  ]
}
{% endschema %}
```

---

## 8. Tuning knobs (change these, nothing else)

| Want | Where | Value |
|---|---|---|
| Bigger / smaller product title | `sections/product.liquid`, `--pdp-fs-title` (mobile and the desktop override) | clamp values |
| Plates stack less dramatically | `snippets/product-gallery.liquid`, `.pdp-plate__frame` `transform` and `.pdp-plate__shade` `opacity` | `0.07` scale step, `0.5` shade |
| Plates do not stack at all (normal scroll) | same file, desktop `.pdp-plate` | remove `position: sticky` and `top` |
| Gap between plates | `.pdp-plate` `margin-bottom` | `1.25rem` |
| Slower or faster spring on the size block | `--pdp-spring` in `sections/product.liquid` | swap for `cubic-bezier(0.34, 1.35, 0.64, 1)` for a lighter feel |
| Turn the "Expand" cursor off | Theme editor, Gallery | checkbox |
| Courier works Sundays | `product-buy-box.liquid`, `addWorkingDays` | delete the `getDay() !== 0` check |
| Panel too wide / narrow | `sections/product.liquid`, desktop `grid-template-columns` | `clamp(25rem, 31vw, 30rem)` |
| Add or change sizes / measurements | `snippets/size-guide.liquid`, the JSON at the top | one place, drives table and live measurements |

---

## 9. QA checklist (the implementing model must verify each)

**Desktop (1440 wide, and 1280 x 720)**

- [ ] First plate unveils once on load. Title words rise. No layout jump.
- [ ] Scrolling: each plate slides over the previous one; the previous one shrinks and darkens; the panel stays sticky the whole time.
- [ ] Rail numerals highlight the current plate; clicking a numeral scrolls so that plate is fully in place.
- [ ] Hovering an image shows "Expand" following the pointer; clicking opens the viewer with a morph; arrow keys change image; click zooms 2x and pans with the pointer; Esc closes and returns to the same plate.
- [ ] On a short window the panel scrolls inside itself and a soft fade appears at its bottom edge only while more content exists.
- [ ] Selecting a size: block slides, label rolls, measurements appear, price digits roll if the price differs, status line updates, button becomes "Add to bag".
- [ ] Add to bag hover: inversion grows from the side the pointer came from. Click: "Adding" with the line sweep, then check + "Added to bag", then cart opens.
- [ ] Clicking the button with no size: ruler shakes, message appears, no request is sent.
- [ ] Size guide opens as a right-hand sheet; tabs and cm/in thumbs slide; numbers flip in place; the selected size's row is marked; "Select" on a row selects that size in the panel and closes.
- [ ] Related items: staggered row; hovering a card softens the others.

**Mobile (390 x 844, real device if possible)**

- [ ] Carousel is full-bleed 4:5, snaps one image at a time, counter and segments follow, image drifts inside its frame while swiping.
- [ ] Title, price and the size ruler are visible within about one and a half screens.
- [ ] After scrolling past "Add to bag" the dock slides up. Tapping "Select a size" opens a size row; picking a size folds it away and the dock button reads "Add to bag". Tapping outside closes the row.
- [ ] Dock never covers the cart drawer, a dialog, or the viewer.
- [ ] Size guide is a bottom sheet; dragging the top down more than ~110px (or flicking) closes it; table has no horizontal scroll at 360px.
- [ ] Related items scroll sideways with the next card peeking.

**Both**

- [ ] Keyboard: tab through sizes (arrow keys move and select), buttons, accordions, size guide; focus ring always visible.
- [ ] `prefers-reduced-motion`: no unveil, no word rise, no scale/shade, no morph; everything still works.
- [ ] Product with a single variant: no size block, no dock size row, button says "Add to bag".
- [ ] Product with a sold-out size: cell is struck through and unselectable; a variant URL (`?variant=ID`) preselects.
- [ ] Product with 1 image: no rail, no counter, no stacking, page still looks complete.
- [ ] Console has no errors on load, on size select, on add to bag.

---

## 10. Known limits

- Written against Shopify Online Store 2.0 and current evergreen browsers. Scroll-driven image drift on mobile needs Chrome/Edge 115+ or Safari 26; elsewhere the image simply stays still. The desktop plate stack is JavaScript, so it works everywhere.
- `inventory_quantity` only appears in the variant JSON when the store exposes it; if it does not, the "Only N left" status is simply never shown.
- Delivery dates use the visitor's device date. If a visitor's clock is wrong, so are the dates.
- Garment measurements shown under the ruler come from the size-guide data, not from Shopify. If a product's size names are not S/M/L/XL (or 30/32/34/36 for trousers), the hint "Choose a size to see its measurements" stays and nothing breaks.
