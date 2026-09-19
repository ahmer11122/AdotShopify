# CSS strategy

Three mechanisms, three jobs. This is not "global CSS vs scoped CSS" as a style preference — it's Shopify's own layered system, used correctly.

## `assets/tokens.css` + `assets/critical.css` — loaded once, globally, in `layout/theme.liquid`

Use for: design tokens (color/type/spacing custom properties), CSS reset, base typography defaults, grid primitives, and anything needed above-the-fold on every template. This is the **only** CSS that should be truly global.

## `{% stylesheet %}` inside a section/block file — ~90% of your CSS lives here

Use for: all component-level styling. Automatically deduped — if a block renders 5 times on a page, its CSS still ships once. Colocated with the markup it styles, which is also what makes components portable across client themes.

Rule: every value inside a `{% stylesheet %}` block is a token reference (`var(--color-accent)`, `var(--space-md)`) — never a raw hex/px/rem literal, except for genuinely one-off geometry (e.g. a specific `border-radius` unique to one component) that has no token equivalent.

## `{% style %}` inside a section/block file — rare, per-instance only

Use **only** when a value must be computed per render from a merchant setting and needs to react live in the theme editor without a full page reload — e.g. one specific hero's merchant-picked accent color. Not deduped (recalculated every render), so never use it for static component styling — that's what `{% stylesheet %}` is for.

## Why not one global `theme.css`

- Ships CSS for sections a given page doesn't use → directly hurts LCP.
- Becomes a specificity war as the theme grows across multiple clients.
- Theme Check's `AssetSizeCSS` check (100KB default threshold) will start flagging it — that's a signal, not a reason to raise the threshold.

## Why not fully scoped-only (no global layer)

- Every component would need to re-declare tokens/reset rules → drift between components, no single source of truth for the brand palette.
- Can't do a clean brand swap (olive → navy → burgundy) for a new client — you'd be hunting hardcoded values across every section instead of changing `tokens.css` once.

## Per-client brand swap procedure

To reskin this theme for a new client: edit `assets/tokens.css` only. If a component needs a component-file edit to reskin, that component broke rule 8 in `SHOPIFY-RULES.md` (hardcoded value) — fix the component, don't work around it per-client.
