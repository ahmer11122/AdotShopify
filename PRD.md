# PRD — Smart Solutions Shopify Theme Foundation
**Modern Editorial Minimalism / Skeleton-based / reusable across clients**

Status: verified against Shopify's live docs + official repos (Sept 2026). Corrections from the original draft are marked ✅ CONFIRMED or ⚠️ CORRECTED below.

---

## 0. Verification notes (read this first)

| Claim in original brief | Verdict |
|---|---|
| "Shopify Skeleton Theme" is a real, official starter | ✅ CONFIRMED — `github.com/Shopify/skeleton-theme`, also scaffolded by `shopify theme init` |
| Skeleton folder structure: assets/blocks/config/layout/locales/sections/snippets/templates | ✅ CONFIRMED — this is the exact top-level structure in the official repo |
| Native `{% stylesheet %}` / `{% javascript %}` pattern instead of a generic React-style CSS structure | ✅ CONFIRMED — Skeleton's own README recommends these tags for section/block CSS+JS. Code included multiple times still ships once (deduped) |
| Keep Dawn as reference for cart drawer, predictive search, variant picker — don't inherit its CSS | ✅ CONFIRMED, and stronger than you think — see below |
| Add Shopify Theme Check to the flow | ✅ CONFIRMED — it's Shopify's official linter, ships inside Shopify CLI, runs in CI |
| Don't build on Dawn | ✅ Correct call |

**One important update the original brief didn't have:** Shopify's default theme for *new stores* is no longer Dawn — it's now **Horizon**, built on nested blocks (8 levels deep vs Dawn's 2), global blocks, and AI block generation in the editor. **Horizon is closed-source — there is no public repo.** That actually strengthens your original instinct: Dawn remains the only *inspectable* open-source reference for solved problems like cart-drawer state management, predictive-search debouncing, and variant-picker option/availability logic. Skeleton is intentionally too bare to teach you those patterns. Community consensus is Dawn is being phased out for new stores but isn't dead — keep using it as a pattern reference, don't build the client production theme on it.

**Also confirmed:** the CSS question has a real answer, not a preference — see §3.

---

## 1. Foundation

| Layer | Choice |
|---|---|
| Starter | `Shopify/skeleton-theme` (`git clone git@github.com:Shopify/skeleton-theme.git` or `shopify theme init`) |
| Reference-only (never a dependency) | Dawn — cart drawer, predictive search, variant picker *logic* only |
| Version control | GitHub, one repo per client theme, this foundation forked/templated per client |
| Local dev | Shopify CLI (`shopify theme dev`) |
| Linting | Shopify Theme Check (built into Shopify CLI) |
| Preview/QA | Shopify development store |
| Production | Client's live Shopify store, theme pushed unpublished → QA'd with real data → published |

```
Shopify Skeleton
      ↓
Smart Solutions design-token layer
      ↓
Native Liquid (sections + blocks + snippets)
      ↓
Skeleton's {% stylesheet %} / {% javascript %} pattern + global tokens (§3)
      ↓
Theme Check (every save + pre-push + CI)
      ↓
Shopify CLI → development store → client store
```

---

## 2. Folder structure

Skeleton's native structure, extended with the minimum needed for a reusable multi-client system. **Don't add a build step (Vite/webpack/Tailwind) unless the client project genuinely needs it** — Skeleton is designed to run on plain Liquid + CSS + vanilla JS with zero build tooling, which is also your fastest path for Pakistani-network performance. Add a bundler only if you're doing this across 10+ client themes and need shared component compilation.

```
project-root/
├── .agent/                          ← AI agent rules (see PRD companion kit)
│   ├── SHOPIFY-RULES.md
│   └── rules/
├── .theme-check.yml                 ← Theme Check config (§6)
├── .github/workflows/theme-check.yml← CI pipeline (§6)
├── assets/
│   ├── critical.css                 ← global, render-blocking, loads on EVERY page (§3)
│   ├── tokens.css                   ← design tokens: color/type/spacing vars (§3, brand-swappable)
│   ├── base.css                     ← resets, typography defaults, grid utilities (global, non-critical)
│   └── theme.js                     ← tiny global bootstrap only (nav toggle, cart-count sync). NOT a dumping ground.
├── blocks/
│   ├── _text.liquid                 ← Skeleton naming convention: theme-native blocks prefixed `_`
│   ├── product-card.liquid
│   ├── editorial-block.liquid
│   └── ...
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/
│   ├── theme.liquid
│   └── password.liquid
├── locales/
│   └── en.default.json
├── sections/
│   ├── header.liquid                ← flat nav: Hoodies / Shirts / Trousers — no mega menu, see §2.1
│   ├── footer.liquid
│   ├── hero.liquid                  ← homepage
│   ├── category-tiles.liquid        ← 3-tile showcase, homepage — this IS your category nav at this catalog size
│   ├── featured-collection.liquid   ← reusable product grid, used for New Arrivals + per-category pulls
│   ├── editorial.liquid             ← brand story / statement block, homepage
│   ├── shop-the-look.liquid         ← optional at launch, P1 — see §2.1
│   ├── newsletter.liquid
│   ├── main-collection.liquid       ← collection template: grid + minimal filters, no side-nav
│   ├── main-product.liquid          ← PDP: gallery + info + variant picker + size guide trigger
│   ├── main-cart.liquid             ← full cart page (fallback for the drawer)
│   ├── cart-drawer.liquid           ← slide-out cart, Dawn-referenced logic (§7)
│   └── predictive-search.liquid     ← Dawn-referenced logic (§7)
├── snippets/
│   ├── product-card.liquid          ← primitives referenced by sections/blocks
│   ├── price.liquid
│   ├── button.liquid
│   ├── icon.liquid
│   ├── image.liquid
│   ├── badge.liquid
│   ├── size-guide.liquid            ← modal content, triggered from main-product — see §2.1
│   ├── trust-badges.liquid
│   └── breadcrumbs.liquid
└── templates/
    ├── index.json
    ├── product.json
    ├── collection.json
    ├── search.json
    ├── cart.json
    └── 404.json
```

Rules for this structure:
- `blocks/` is for genuinely reusable, nestable, theme-editor-configurable units. Don't put one-off page furniture here.
- `snippets/` is for primitives with **no schema** — pure render logic, no merchant-facing settings.
- Every section/block owns its **own** `{% stylesheet %}` and `{% javascript %}` block inline in the `.liquid` file — do not create a parallel `assets/section-name.css` file per section unless the CSS exceeds ~150 lines and genuinely needs external editing/versioning.
- `critical.css` and `tokens.css` are the *only* global stylesheets loaded on every page. Everything else is scoped per-section/block.

## 2.1 Minimal section set — current catalog is 3 categories (Hoodies / Shirts / Trousers)

At this catalog size, several things a "full" fashion theme would ship are actively the wrong call — they add UI weight for navigation problems you don't have yet. Cut/keep decisions:

| Would normally build | Decision at this size | Why |
|---|---|---|
| Mega menu | **Cut.** Flat nav: `Hoodies · Shirts · Trousers · Search · Cart` | A mega menu solves "too many categories to list" — you have 3. A flat nav is faster to build, faster to scan, and more editorial (matches Modern Editorial Minimalism better than a dropdown panel) |
| Collection page side-navigation / sub-category tree | **Cut.** | Nothing to nest — 3 top-level categories with no sub-categories yet. Add it later only if a category grows sub-types (e.g. Trousers → Chinos/Joggers/Denim) |
| Category showcase | **Keep, but as `category-tiles.liquid` on the homepage** — 3 large editorial tiles (image + label), not a grid or carousel | This *is* your category navigation at this size. Full-bleed photography per tile fits the design direction directly |
| Complex filtering (multi-facet) | **Cut for launch.** `main-collection.liquid` ships with size + color/swatch filter only, sort by price/newest | 3 categories with presumably modest SKU counts per category don't need faceted search. Revisit if a category catalog grows past ~40-50 products |
| Infinite scroll / pagination | **Simple pagination, not infinite scroll.** | Small catalogs don't need infinite scroll — it's a large-catalog UX pattern and adds JS for no benefit here |
| Size guide | **Add — this was missing from the original plan and shouldn't be.** `snippets/size-guide.liquid`, opened as a modal from `main-product.liquid` | All three current categories (hoodies, shirts, trousers) are fit-dependent apparel — a size guide is P0, not optional, regardless of catalog size |
| Shop-the-look / lookbook | **Keep as P1, not launch-blocking.** `shop-the-look.liquid` pairs one item from each category (hoodie + shirt + trousers) in a styled editorial shot | With exactly 3 categories, "complete the outfit" cross-sell is unusually clean to build — one lookbook section can meaningfully reference all three categories. Worth doing early even though it's P1, it's cheap at this catalog size |
| Product recommendations | **Keep, reframe as cross-category.** Native Shopify Product Recommendations API on PDP | With only 3 categories, recommendations naturally surface "complete the fit" pairings rather than generic "more like this" |
| Quick buy / quick add | **Keep, but lower urgency.** Build after the core PDP works | Fewer products per category means customers are more likely browsing into full PDPs anyway — quick-add matters more at large catalog sizes |

Net effect: `header.liquid` and `main-collection.liquid` get simpler than the general premium-theme baseline in `.agent/rules/09-premium-feature-parity.md` — that file's mega-menu and collection-side-nav rows are superseded by this table for as long as the catalog stays at 3 flat categories.

---

## 3. CSS strategy — the actual answer, not a vibe

Shopify gives you three mechanisms. Use all three, for different jobs — this isn't "global vs scoped," it's a layered system:

| Mechanism | Scope | Dedup behavior | Use for |
|---|---|---|---|
| `assets/tokens.css` + `assets/critical.css`, loaded once in `layout/theme.liquid` | Global, every page | N/A (loaded once) | Design tokens (color/type/spacing vars), CSS reset, base typography, grid primitives, anything needed above the fold on every template |
| `{% stylesheet %}` inside a section/block file | Effectively global once rendered, but colocated with the component and only shipped if the component is used | Deduped automatically — same block/section used 5× on a page still ships the CSS once | All component-level CSS: header, hero, product-grid, editorial block, footer, etc. This is ~90% of your CSS |
| `{% style %}` inside a section/block file | Scoped to that render via `section.id`/`block.id`, re-evaluates on every render | Not deduped — recalculated per instance | **Only** for values that must react live in the theme-editor per-instance (e.g. a merchant-picked accent color on one specific hero), never for static component styling |

**Why this beats "one global theme.css" (what most agencies still do):**
- A single global CSS file grows unbounded, becomes a specificity war, and ships CSS for sections a given page doesn't even use — directly hurts LCP/CLS, which Theme Check's `AssetSizeCSS` check will start flagging (default threshold: 100,000 bytes).
- Fully scoped-only (no global layer) means you re-declare tokens and reset rules in every section — drift risk, and duplicate output before Shopify's dedup kicks in for shared imports.

**Rule for the agent:** never write raw hex/px values inside a `{% stylesheet %}` block. Always reference `var(--color-*)`, `var(--space-*)`, `var(--font-*)` from `tokens.css`. This is what makes the same theme re-skinnable per client (olive → navy → burgundy) without touching component files.

---

## 4. Design tokens (default: menswear/editorial preset)

```css
/* assets/tokens.css */
:root {
  --color-background: #F5F2EC;
  --color-surface:    #ECE8E0;
  --color-text:       #151515;
  --color-muted:      #6F6B63;
  --color-border:     #D8D3CA;
  --color-dark:       #20201E;
  --color-accent:     #5B6048; /* swap per client: brown / navy / burgundy / black */

  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body:    "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  --space-xs: 0.5rem;  --space-sm: 1rem;   --space-md: 2rem;
  --space-lg: 4rem;    --space-xl: 8rem;

  --container-max: 1440px;
  --grid-gap: 2rem;
}
```

Never hardcode "olive = menswear" in component logic. The brand preset is a token swap, not a rebuild — that's the entire point of the layered CSS system in §3.

---

## 5. Design direction — Modern Editorial Minimalism

**Is:** editorial + quiet luxury + masculine + modern. Feels like a fashion publication that happens to sell things.
**Is not:** pure brutalism, generic SaaS minimalism, overly organic, black-and-gold "luxury template" cliché.

Core principles:
- Strong typography as the primary visual identity (not UI chrome)
- Large, high-quality photography, full-bleed where it earns it
- Generous whitespace, strict grid, near-zero decorative UI
- Minimal borders, little-to-no shadow, restrained motion
- Mobile-first, but mobile is a **separate design**, not a squeezed desktop

**Typography rules:**
- Display: Cormorant Garamond (or equivalent refined serif) — hero headlines, collection titles, editorial statements, large campaign type only.
- Body/UI: Inter (or equivalent) — nav, product names, prices, buttons, filters, forms, body copy.
- Never run the display serif at small/UI sizes — it degrades on mobile. Below ~20px, always fall back to body font.

**Desktop layout pattern:**
```
Hero → Editorial statement → Collection → Product grid → Editorial image/text
     → New arrivals → Brand story → Newsletter → Footer
```
Not every section is a centered card — use full-width photography, asymmetric grids, deliberate whitespace.

**Mobile layout pattern** (designed separately, not derived from desktop):
```
Image → Headline → CTA
Image → Product info
Product grid
Editorial image → Text
```
Fast, thumb-friendly, no dense multi-column squeezing.

---

## 6. Theme Check — non-negotiable part of the flow

✅ Confirmed: Theme Check is Shopify's official linter, ships inside Shopify CLI (no separate install), and covers two categories:

**Correctness** — Liquid/JSON syntax errors, missing snippets/sections, unused `{% assign %}`, deprecated/unknown tags, undefined objects, missing translation keys.

**Performance / Core Web Vitals** — parser-blocking scripts without `defer`/`async`, remote (non-CDN) assets, missing `width`/`height` on `<img>`, oversized pagination (`PaginationSize`, default max 250), asset-size limits (`AssetSizeCSS` default 100KB, `AssetSizeJavaScript` default 10KB, opt-in checks — turn these **on**), redundant CDN preconnects.

Config — `.theme-check.yml` at project root:
```yaml
root: .
AssetSizeCSS:
  enabled: true
  threshold_in_bytes: 100000
AssetSizeJavaScript:
  enabled: true
  threshold_in_bytes: 10000
ImgWidthAndHeight:
  enabled: true
ParserBlockingScript:
  enabled: true
```

Run it:
```bash
shopify theme check                 # full repo
shopify theme check --path sections/
shopify theme check --auto-correct  # fixes what it safely can
```

CI (`.github/workflows/theme-check.yml`):
```yaml
name: Theme Check
on: [pull_request]
jobs:
  theme-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @shopify/cli
      - run: shopify theme check
```

**Agent workflow rule:** run `shopify theme check --path <changed-dir>` after every non-trivial edit, before reporting a task done. Treat a Theme Check error the same as a build failure — it doesn't get shipped.

---

## 7. Dawn — reference boundaries

Dawn stays cloned locally (or as a git submodule pointed at `github.com/Shopify/dawn`) purely as a **pattern reference**, never a dependency, never merged into the theme repo.

**Allowed to reference from Dawn:**
- `sections/main-cart-*.liquid`, `snippets/cart-drawer.liquid` and `assets/component-cart-drawer.css`/`component-cart-items.css` — for cart-drawer state, AJAX add-to-cart, and cart update behavior only.
- `sections/predictive-search.liquid` and its JS — for debounce timing, API call shape, and results-rendering logic.
- `snippets/product-variant-picker.liquid` and `assets/product-form.js` — for option/variant availability logic, sold-out state handling, and URL-param syncing.

**Never do:**
- Copy any Dawn `.css` file wholesale into this theme.
- Copy Dawn's class-naming conventions into your components.
- Import Dawn as a git dependency or theme base.

**Conversion rule when pulling a Dawn pattern:** read the *behavior* (what triggers what, what state it tracks, what accessibility attributes it sets), reimplement the markup/CSS against your own tokens and BEM-ish naming, keep only the JS logic that's genuinely solved-problem (debounce timers, fetch/AJAX cart update sequencing, ARIA state toggling).

---

## 8. React → Liquid conversion protocol

You (or a coding agent) will often start from a React reference component (React Bits, Aceternity, Magic UI, shadcn, or a client-supplied Figma/React mockup). The rule is: **translate the design and interaction, never the syntax.**

Pipeline:
```
React component (code/screenshot)
        ↓
Visual + interaction analysis (layout, states, breakpoints, motion)
        ↓
Liquid markup (schema-driven where merchant-configurable)
        ↓
CSS in {% stylesheet %}, tokens only, no hardcoded values
        ↓
Vanilla JS in {% javascript %}, only if interaction requires it
        ↓
Native Shopify component
```

Concrete mapping rules:
- `useState`/`useReducer` → plain JS module-scope variables + DOM attribute toggles (`data-state`, `aria-expanded`), no virtual DOM.
- `useEffect` on mount → `DOMContentLoaded` or a custom element's `connectedCallback` if you're using Web Components for interactive pieces (recommended for anything stateful — see below).
- Props → Liquid `block.settings.*` / `section.settings.*` via schema, not JS config objects.
- Conditional rendering (`{cond && <X/>}`) → Liquid `{% if %}` at render time wherever possible (server-rendered, no JS needed for static conditionals); only move to JS if the condition changes after page load.
- Client-side state that must persist across re-renders (accordions, tabs, carousels, drawers) → implement as a native **Web Component** (`customElements.define`), not a jQuery-style querySelectorAll spaghetti file. This is Shopify's own modern pattern (Dawn 2.0+ uses custom elements like `<cart-drawer>`, `<quantity-input>`) and keeps behavior colocated with its markup.
- Tailwind utility classes in the reference → do not install Tailwind. Translate the *intended* spacing/type scale into your token system and write semantic classes (`.product-card__price`, not `.text-sm.font-medium.text-gray-600`).
- Animation libraries (Framer Motion etc.) → CSS transitions/`@keyframes` first; only reach for JS-driven animation (IntersectionObserver reveal, etc.) if CSS genuinely can't do it, and keep it opt-out-able for `prefers-reduced-motion`.
- Never leave React import statements, JSX, or npm package references in the final Liquid — if the agent can't fully translate a component, it should flag it, not paste JSX into a `.liquid` file inside a comment "for reference."

**Never do:** ship a React runtime, bundle a component library, or introduce a build step to make a React component "work" inside a section. If a component's interaction is too complex for vanilla JS in a reasonable timeframe, that's a scope conversation, not a reason to break the "no React in production theme" rule.

---

## 9. Performance rules

Primary audience includes Pakistani/South-Asian mobile networks — treat this as a hard constraint, not a nice-to-have.

- No autoplay hero video by default. Compressed responsive hero image (`image_url` + `srcset` via Liquid filters), eager/high-priority load for the hero, lazy-load everything below the fold.
- Use Shopify's responsive image filters (`image_url`, `image_tag` with `widths`, `sizes`) — never hand-roll `<img src>` with a single fixed-size asset.
- Every `<img>` has explicit `width`/`height` (or `aspect-ratio` CSS) — Theme Check's `ImgWidthAndHeight` enforces this; it's also a direct CLS fix.
- No unnecessary JS libraries. Vanilla JS + native Web Components cover ~everything a theme needs.
- Video only when it's genuinely brand-critical, and only self-hosted via Shopify's video CDN with proper `preload`/`poster` handling — never an unoptimized embed.
- Respect Theme Check's `AssetSizeCSS` (100KB) / `AssetSizeJavaScript` (10KB) thresholds per file — if a section's CSS is approaching that, it's a sign the section is doing too much, not a reason to raise the threshold.

---

## 10. Workflow phases

1. **Foundation** — clone Skeleton, connect GitHub, set up `tokens.css`/`critical.css`, global layout, Theme Check config + CI.
2. **Components** — header, buttons, product card, price, image, drawer, modal, forms, nav (as snippets/blocks, schema-driven where merchant-facing).
3. **Shopify functionality** — products/variants, collections/filters, search, cart, metafields, theme-editor settings.
4. **Pages** — home, collection, product, search, cart, static pages, 404.
5. **Content** — real product data, photography, editorial copy (never ship with mock data — Skeleton scaffolds JSON templates against real Shopify objects from day one).
6. **QA** — mobile + desktop, throttled/slow network, real product variants, cart flows, search, theme-editor stress test, `shopify theme check` clean run, accessibility pass (§11), Lighthouse/PageSpeed pass.
7. **Client handoff** — push unpublished to client's store → QA against real data → client approval → publish.

---

## 10.5 Feature bar vs. paid Theme Store themes

Skeleton ships with none of the conversion features merchants expect from a $280–$400 Theme Store theme — quick buy, swatches, mega menu, lookbooks, trust badges, stock counters, etc. Full priority list (P0/P1/P2, mapped to this architecture, with build notes) is in the companion kit: `.agent/rules/09-premium-feature-parity.md`. P0 items are baseline-expected; P1 items (especially shop-the-look/lookbook) are the highest-leverage additions for the Modern Editorial Minimalism positioning specifically.

## 11. Professional UI/UX rules (baseline, applies to every component)

**Accessibility**
- Every interactive element reachable and operable by keyboard; visible focus states (don't remove `outline` without replacing it).
- Color contrast: body text ≥ 4.5:1, large/display text ≥ 3:1 against its background token.
- All custom interactive components (drawers, modals, accordions, tabs) get correct ARIA roles/states (`aria-expanded`, `aria-hidden`, `role="dialog"` + focus trap for modals/drawers).
- `alt` text on every product/editorial image — pull from Shopify's native `image.alt` first, sane fallback second, never empty on content images.
- Respect `prefers-reduced-motion` — disable/soften scroll-reveal and transition-heavy interactions when set.

**Interaction & states**
- Every actionable element needs explicit hover, focus, active, and disabled states — not just a default state with a color-only hover.
- Touch targets ≥ 44×44px on mobile (buttons, nav icons, variant swatches, quantity steppers).
- Loading and error states are designed, not accidental — add-to-cart, search, and filter interactions need a visible pending state and a visible failure state, not a silent no-op.
- Form fields: label always visible (not placeholder-as-label), inline validation messaging, clear required-field indication.

**Responsive**
- Design breakpoints as ranges, not devices: mobile (<750px), tablet (750–990px), desktop (990px+) — match Skeleton/Dawn's existing breakpoint convention so components compose cleanly.
- Mobile nav, filters, and cart default to drawer/sheet patterns, not desktop layouts shrunk down.
- Test real content lengths (long product titles, out-of-stock states, empty collections, empty search) — not just the happy-path Lorem Ipsum layout.

**Visual consistency**
- Every spacing value comes from `--space-*` tokens — no arbitrary `margin: 17px`.
- Every color comes from `--color-*` tokens — no one-off hex values in component CSS.
- Component states (hover/active/disabled) shift opacity/color via token math (`color-mix()`, opacity on the token), not new hardcoded colors.

**Definition of done for any component:** matches the token system, passes Theme Check clean, has keyboard + screen-reader-sane markup, has explicit states for every interaction, works at all three breakpoints, and has no hardcoded design values.
