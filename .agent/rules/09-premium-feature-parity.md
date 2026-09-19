# Premium theme feature parity — what to build to match paid Theme Store themes

**Catalog-size override:** current catalog is 3 flat categories (Hoodies / Shirts / Trousers). PRD §2.1 supersedes the mega-menu and collection-side-navigation rows below for as long as that's true — build the flat-nav / no-side-nav version instead. Re-enable mega menu / side-nav from this file only once a category grows sub-types or the category count grows past ~6-8. Size guide (missing from the original version of this file) is now P0 — see the P0 table.

Source: Shopify Theme Store's own feature taxonomy, plus specifics pulled from **Stylist** ($280, Xotiny — beauty vertical, 3 presets: Stylist/Tranquil/Gateau) and **Arctos** ($380, fashion vertical). Both `Arctos` and `Radian` mostly surfaced generic Theme Store marketing copy (drag-and-drop sections, mobile-independent controls, speed-tested) rather than a distinguishable feature list — not enough to extract anything Arctos/Radian-specific beyond what's in the general list below, so don't treat this file as "Arctos has X, Radian has Y." Treat it as: this is the feature bar paid fashion/beauty themes in the $280–$400 range clear, and Skeleton gives you none of it out of the box — build what's relevant to a menswear editorial site.

**Important constraint:** these are proprietary, single-store-licensed themes. Nothing here is copied code — it's the feature *scope*, which is public marketing information. Every item below still gets built per this project's own rules (`04-css-strategy.md`, `06-ui-ux.md`, tokens, native Liquid).

## Priority for this project (menswear editorial site)

**P0 — build these, they're expected baseline for a $$ fashion store:**
| Feature | Where it lives | Build note |
|---|---|---|
| Quick buy / quick add | `snippets/quick-add.liquid`, called from product-card | Variant picker in a modal/popover, reuses Dawn's variant-availability logic (see `02-dawn-boundaries.md`) |
| Sticky/slide-out cart (drawer) | `sections/cart-drawer.liquid` | Already scoped in PRD §7 — this is the Dawn-referenced pattern |
| Color/size swatches on cards | `snippets/product-card.liquid` + `blocks/swatch.liquid` | Swatch = a block so merchants can toggle it per collection template |
| Recently viewed | `sections/recently-viewed.liquid`, localStorage-backed | Client-side only, no Shopify object for this — build as a small Web Component |
| Recommended products | `sections/product-recommendations.liquid` | Use Shopify's native Product Recommendations API (`routes.product_recommendations_url`), don't hand-roll |
| Enhanced/predictive search | Already in PRD (Dawn reference) | — |
| ~~Mega menu~~ | **Cut at current catalog size — see PRD §2.1.** Flat nav instead: `Hoodies · Shirts · Trousers` | Revisit only if category count or sub-types grow |
| Breadcrumbs | `snippets/breadcrumbs.liquid` | Cheap to build, expected on PDP/collection |
| Size guide | `snippets/size-guide.liquid`, modal from PDP | All 3 current categories are fit-dependent apparel — this is P0, not optional |
| Sticky header | `sections/header.liquid` | CSS-only (`position: sticky`), no JS needed unless you want hide-on-scroll-down |
| Trust badges | `snippets/trust-badges.liquid`, block-based | Merchant-editable icon+text row, near add-to-cart |
| Stock counter / low-stock messaging | `snippets/stock-counter.liquid` | Pull from `product.selected_or_first_available_variant.inventory_quantity`, threshold configurable in schema |

**P1 — high-value for an editorial/quiet-luxury brand specifically:**
| Feature | Where it lives | Build note |
|---|---|---|
| Lookbook / shop-the-look | `sections/shop-the-look.liquid` | Hotspot-pinned products over an editorial image — this is the single highest-leverage feature for "fashion publication that sells things" positioning, worth prioritizing over generic conversion widgets |
| Image hotspot | `blocks/hotspot.liquid`, used inside shop-the-look | Simple `%`-positioned absolute markers, no library needed |
| Before/after slider | `blocks/before-after.liquid` | Useful for fabric/material close-ups or styling transformations, not just skincare — CSS `clip-path` + a range input, no JS library |
| Image rollover (hover-swap product image) | `snippets/product-card.liquid` | CSS-only: stack two images, opacity-swap on `:hover`/`:focus-within` |
| ~~Collection page side navigation~~ | **Cut at current catalog size — see PRD §2.1.** Nothing to nest with 3 flat categories | Revisit if a category grows sub-types |
| Restrained entrance animation | Global, via `assets/base.css` utility classes | IntersectionObserver-triggered fade/slide-up, gated behind `prefers-reduced-motion` per PRD §11 — keep it subtle, this is "quiet luxury" not "flashy SaaS" |

**P2 — nice-to-have, build only if a client needs it:**
| Feature | Note |
|---|---|
| Pre-order | Needs inventory-policy logic per variant, scope it when a client actually sells pre-order stock |
| Combined listings | Shopify Plus only — irrelevant unless the client is on Plus |
| Age verifier | Only if client sells age-restricted goods |
| Quantity pricing / quick order list | B2B/wholesale pattern, not typical DTC menswear — skip unless asked |
| EU translations | Only if client sells into EU — Skeleton's `locales/` structure already supports adding these cheaply when needed |

## What NOT to copy from these themes

- Their exact visual treatment (Stylist's beauty-store layout, Arctos's fashion presets) — this project has its own Modern Editorial Minimalism direction (PRD §5), not theirs.
- Their CSS/JS — proprietary, licensed, and irrelevant anyway since none of it uses this project's token system.
- Feature bloat for its own sake — every row in the P0/P1 tables above earns its place because it fits an editorial menswear brand. Don't add quantity-pricing or B2B tooling just because a $290 theme ships it; that's a different merchant profile.
