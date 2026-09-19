# Performance rules

Primary audience includes lower-bandwidth mobile networks (Pakistan-based client base). Treat these as hard constraints.

- No autoplay hero video by default. Default hero is a compressed responsive image.
- Use Shopify's responsive image filters (`image_url`, `image_tag` with `widths`/`sizes`) — never a single fixed-size `<img src>`.
- Hero/above-fold image: eager + high `fetchpriority`. Everything below the fold: lazy-loaded.
- Every `<img>` has explicit `width`/`height` or `aspect-ratio` in CSS — this is both a Theme Check requirement (`ImgWidthAndHeight`) and a direct CLS fix.
- No unnecessary JS libraries or frameworks. Vanilla JS + native Web Components handle essentially everything a theme section needs.
- Video only when genuinely brand-critical — self-hosted via Shopify's video CDN, with `preload`/`poster` set correctly. Never an unoptimized third-party embed.
- Keep an eye on Theme Check's `AssetSizeCSS` (100KB) / `AssetSizeJavaScript` (10KB) per-file thresholds. If a section is approaching them, that's a sign the section is doing too much — split it or simplify, don't raise the threshold.
- Scripts get `defer`/`async` by default — nothing in `{% javascript %}` should be parser-blocking.
- Award-winning UI that takes 8 seconds to load isn't award-winning ecommerce. Performance is a design constraint, not a QA afterthought.
