# Architecture

Base: `Shopify/skeleton-theme` official structure. Do not deviate from these top-level folders.

```
assets/     static CSS/JS/images/fonts — only global files live here directly
blocks/     reusable, nestable, theme-editor-configurable UI units (have {% schema %})
config/     settings_schema.json, settings_data.json
layout/     theme.liquid, password.liquid
locales/    en.default.json + any additional locale files
sections/   page-level components (have {% schema %})
snippets/   pure render primitives, no schema, no merchant settings
templates/  JSON templates composing sections per page type
```

## Decision rule: section vs block vs snippet

- **Section** — a full-width, page-level piece a merchant adds/removes/reorders via the theme editor (hero, featured-collection, newsletter).
- **Block** — a nestable, repeatable unit inside a section, also merchant-configurable (a slide inside a slideshow section, a column inside a multi-column section, a promo tile).
- **Snippet** — no merchant-facing settings at all. Pure render logic called via `{% render 'name', param: value %}`. Product card markup, price formatting, a button primitive, an icon — these are snippets even though they render UI, because they take Liquid variables, not theme-editor settings.

If you're not sure: does a merchant need to configure or reorder this from the Shopify admin? Yes → section/block. No → snippet.

## File-level rules

- One section/block per `.liquid` file. Don't combine multiple unrelated sections in one file "for convenience."
- Every section/block file contains, in order: markup → `{% stylesheet %}` → `{% javascript %}` → `{% schema %}`.
- Snippets never contain `{% schema %}`. If a snippet needs to become configurable, it should become a block, not grow a schema tacked onto a snippet.
- `assets/` only holds: `tokens.css`, `critical.css`, `base.css`, `theme.js` (global bootstrap), fonts, and any icon/image assets that are genuinely global (logo, favicon fallback). Do not put per-section CSS files here — that CSS belongs inline in the section via `{% stylesheet %}` (see `04-css-strategy.md`).
- `theme.js` in assets is for global-only concerns: mobile nav toggle, cart-count badge sync across sections, and wiring up any Web Components that need registering once. It is not a dumping ground — component-specific JS lives in that component's `{% javascript %}` block.

## Naming

- Liquid files, CSS classes, and JS custom-element tags: kebab-case (`product-card.liquid`, `.product-card__price`, `<product-card>`).
- CSS: BEM-style (`.block__element--modifier`) scoped inside the component's own `{% stylesheet %}` — no need for extra namespacing since `{% stylesheet %}` output is deduped per source, not global-cascade-risk in the way a single theme.css is.
- Schema `id`s: match the setting's purpose, not its input type (`layout`, not `select_1`).
