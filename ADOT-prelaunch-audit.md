# ADOT Pre-Launch Audit Report

**Date:** 2026-10-08  
**Store:** `1wa9f5-nc.myshopify.com`  
**Primary domain:** `https://adotoffical.com/`  
**Theme:** AdotShopify (live theme id `#188673753266`)  
**Auditor:** Grok Build (theme + Admin API + storefront crawl + local preview)  
**Credentials source:** `.env` (store domain, storefront password, Admin app client credentials)

---

## Final verdict

# **NOT PRODUCTION READY**

The theme codebase is in good shape after this pass (Theme Check clean; cart add works; homepage IA aligned to the real catalog). The store is **not** ready to remove the password or take paid traffic until shipping rates, support pages, hoodie images, shop rename, payments/COD test order, and legal policies are completed.

---

## Scope and constraints

### In scope
- Full theme codebase: Liquid, JSON, JS, CSS, sections, snippets, templates, schemas
- Product / variant / cart / collection / search / navigation / page behaviour
- Mobile + desktop responsiveness (local preview + headless screenshots)
- Theme Editor editability and hardcoded content
- Shopify Theme Check
- SEO basics, performance obvious issues, accessibility basics
- Live Shopify catalog/data via Admin API + password-authenticated storefront
- Safe catalog fixes (tags, weights, SEO fields, collections)
- Theme push to the already-live theme (file update only)

### Explicitly out of scope / not done
- Publishing a new theme
- Removing the storefront password
- Changing payment, tax, or legal settings
- Installing apps
- Inventing hoodie product photography

### User decisions during audit
- Launch timing: ASAP (days)
- Scope: theme + product/collection data
- Must-pass flow: full checkout path
- Category IA: Hoodies + Sweatshirts + Trousers (trousers coming later)
- Hoodie images: leave blank for now (no temporary stand-ins)
- Shop rename: rename to **ADOT** (API blocked; manual)
- Support pages: merchant will create in Admin with correct handles/templates
- Shipping: merchant will add COD / flat rates in Admin

---

## Store snapshot (at audit time)

| Item | Value |
|------|--------|
| Shop name | My Store (must rename) |
| Plan | Basic |
| Currency | PKR |
| Timezone | Asia/Karachi |
| Password enabled | Yes |
| Products | 8 active (5 Hoodies, 3 Sweatshirts) |
| Hoodie images | 0 on all 5 hoodies |
| Sweatshirt images | Present (2–4 each) with alt text |
| Collections | frontpage, new-arrivals, hoodies, sweatshirts, trousers, shop-all, special-offers |
| Pages in sitemap | Only `/pages/contact` |
| Shipping zones | Domestic (PK) + International — **both have empty rates** |
| Admin app scopes | products / inventory / files / discounts (no pages, menus, shipping write, shop rename) |

### Product inventory summary
- All products `active`, inventory tracked with `deny` when out of stock
- Size options: M / L / XL / XXL
- Compare-at prices set (launch discount style)
- Weights after fix: hoodies **0.7 kg**, sweatshirts **0.5 kg**

---

## 1. Problems found

### A. Launch blockers (store ops)

1. **No shipping rates**  
   Domestic and International zones exist, but `price_based_shipping_rates`, `weight_based_shipping_rates`, and carrier providers are empty. Checkout cannot complete without at least one deliverable rate for Pakistan.

2. **Support pages 404**  
   Theme links to:
   - `/pages/faq`
   - `/pages/size-guide`
   - `/pages/shipping-delivery`  
   Shopify only has `/pages/contact`. Theme **templates** exist (`page.faq`, `page.size-guide`, `page.shipping`) but Online Store pages were never created.

3. **Five hoodies have zero images**  
   PDPs/cards render placeholders. Storefront availability is fine; imagery is the gap.

4. **Shop still named “My Store”**  
   Appears in `<title>`, Open Graph, Organization schema, password page, checkout. Admin API `PUT /shop.json` returned 406 with current app scopes.

5. **Payments / COD / tax / legal not production-validated**  
   Not changed in this audit. A real test order is required before launch.

### B. Catalog / information architecture

6. **Homepage sold Polos / Shirts / Trousers** while live catalog is Hoodies + Sweatshirts (+ Trousers later).  
   Broken/empty category filters and misleading hero CTA.

7. **Sweatshirts tagged `Shirts`**  
   Polluted search/filter semantics.

8. **Size guide bug**  
   `product.type | downcase contains 'shirt'` matched **Sweatshirts**, opening the wrong size chart key.

9. **Product weights were 0 kg**  
   Breaks weight-based shipping once rates exist.

10. **Trousers collection missing**  
    Theme linked trousers; collection did not exist.

11. **Product and collection SEO empty**  
    `seo.title` / `seo.description` null on products and collections.

### C. Theme / code quality

12. **Theme Check error:** `sections/size-guide-page.liquid` referenced missing `assets/section-size-guide.css` (styles were already inlined).

13. **Unused Liquid assigns** in `featured-collection.liquid` and `product-card.liquid`.

14. **Password / empty page title** rendered as `&ndash; My Store`.

15. **No skip-to-content link.**

16. **Favicon only if Theme Editor setting set** — no asset fallback.

17. **Meta description omitted** when `page_description` and `shop.description` blank.

### D. SEO / indexing / policies

18. `shop.description` empty.

19. Online Store Preferences homepage title/meta not set via API (manual).

20. Legal policies incomplete: privacy exists; refund / shipping / terms mostly missing.

21. Products sitemap endpoint returned errors during crawl; collections sitemap was incomplete vs live collection list (password/CDN quirks may apply — recheck after password removal).

22. Domain spelling `adotoffical.com` vs “official” — confirm intentional.

### E. Performance / CWV risks

23. Large theme videos: `hoodie-walk-campaign.mp4` (~2.1MB), `fabric-fleece-loop.mp4` (~1.2MB), plus other MP4s.

24. Category JPGs ~350–500KB.

25. Google Fonts loaded remotely (Inter / Inter Tight) — acceptable but not zero-cost.

26. Theme JS/CSS sizes are fine under Theme Check budgets (`theme.js` ~9.8KB after prior minify).

### F. Accessibility

27. Missing skip link (fixed).

28. Many interactive controls already use 44px targets and `aria-*` in header/PDP — good baseline.

29. Hoodie placeholder PDPs hurt clarity more than formal a11y rules.

### G. Theme Editor

30. Most homepage copy is schema-driven (good).

31. Header/footer fall back to hardcoded collection links when menus empty (acceptable for launch IA).

32. Local `config/settings_data.json` is `{}` — live editor settings live on the remote theme.

---

## 2. Problems fixed

### Theme code (pushed to live theme `#188673753266`)

| Area | Change |
|------|--------|
| `templates/index.json` | Hero → Hoodies/Sweatshirts; CTA → New Arrivals; category tiles/marquee/hanger → hoodies, sweatshirts, trousers; featured collection → `new-arrivals` |
| `sections/hero.liquid` | Schema defaults updated away from Polos |
| `sections/search.liquid` | Category cards/links → real collections |
| `sections/collection.liquid` | Fallback filters → Hoodies / Sweatshirts / Trousers |
| `sections/header.liquid` / `header-group.json` | Nav + search tags include Trousers / Sweatshirts |
| `sections/footer.liquid` | Collections fallback includes Trousers |
| `sections/cart.liquid` | Empty CTA defaults/info → Sweatshirts |
| `sections/size-guide-page.liquid` | Removed missing CSS asset reference |
| `sections/featured-collection.liquid` | Removed unused assigns |
| `snippets/size-guide.liquid` | Key/label `shirts` → `sweatshirts` |
| `snippets/product-buy-box.liquid` | Size category: sweat before shirt |
| `snippets/product-sticky-bar.liquid` | Same size-category fix |
| `snippets/product-card.liquid` | Removed unused `featured_media` assign |
| `snippets/meta-tags.liquid` | Blank title fix; always emit description; brand fallback copy |
| `layout/theme.liquid` | Skip link; favicon fallback to `logo.png` |
| `layout/password.liquid` | Favicon fallback |
| `assets/critical.css` | Skip-link styles |

**Theme Check after fixes:** 65 files, **0 offenses**.

### Catalog / SEO via Admin API

| Change | Detail |
|--------|--------|
| Created smart collection | `trousers` (type equals Trousers) — empty until products exist |
| Variant weights | Hoodies 0.7 kg; sweatshirts 0.5 kg |
| Tags | Removed erroneous `Shirts` from sweatshirts |
| Product SEO | Title `… \| ADOT` + description from body excerpt for all 8 products |
| Collection SEO | Titles/descriptions set for all collections |
| Frontpage collection | SEO title set to `ADOT \| Hoodies & Sweatshirts` |

### Verification performed

- Local `shopify theme dev` preview at `http://127.0.0.1:9292/`
- Routes checked: `/`, collections (all/hoodies/sweatshirts/new-arrivals), sweatshirt PDP, hoodie PDP, cart, search, contact
- Cart: add sweatshirt + hoodie variants succeeded; cart page shows lines; `/checkout` reaches Shopify checkout URL
- Headless Chrome screenshots (desktop + mobile): home, PDP, collection → `.playwright-mcp/audit/`
- Live password unlock works on `adotoffical.com` (cookie must stay on custom domain)
- Note: aggressive live crawling hit Cloudflare 429 intermittently; local preview used for behavioural confirmation after push

---

## 3. Manual action checklist (you)

### Must do before removing password

1. **Shipping rates**  
   Shopify Admin → Settings → Shipping and delivery → add at least one Pakistan rate (flat and/or COD carrier).

2. **Create Online Store pages** (Pages → Add page), publish, assign theme template:

   | Page title (suggested) | Handle (exact) | Theme template |
   |------------------------|----------------|----------------|
   | FAQ | `faq` | `page.faq` |
   | Size Guide | `size-guide` | `page.size-guide` |
   | Shipping & Exchanges | `shipping-delivery` | `page.shipping` |

   Theme header/footer already link these handles.

3. **Rename shop**  
   Settings → Store details → name **ADOT**.

4. **Upload hoodie product images** for all 5 hoodie products (with alt text).

5. **Payments**  
   Enable COD / cards you will use. Place one real test order end-to-end.

6. **Legal policies**  
   Settings → Policies → refund, shipping, terms (privacy already present).

7. **Online Store → Preferences**  
   Homepage title, meta description, social sharing image.

8. **Theme Editor**  
   Set favicon (optional; `logo.png` is fallback). Confirm WhatsApp number `923131707080` everywhere you care about.

9. **Domain**  
   Confirm `adotoffical.com` spelling is intentional.

10. **Only then** remove storefront password.

### Should do soon

- Add trousers products when ready (collection already waiting).
- Compress or defer large homepage MP4s.
- Recheck `/sitemap.xml` child sitemaps after password removal.
- Expand Admin app scopes if you want API automation for pages/shipping (`write_online_store_pages`, write shipping, etc.).

---

## 4. Recommended apps

Prefer native Shopify first. Do **not** install clutter for launch.

| Need | Recommendation |
|------|----------------|
| Cash on Delivery | Native manual payment method / Shopify payments options available in PK |
| WhatsApp ordering | Already in theme (wa.me links) — no app required for v1 |
| Reviews | Skip until you have real orders |
| Page builders / upsell / popups / countdown spam | **Do not install** |
| SEO booster apps | Not needed yet — finish Preferences + pages + images first |
| Inventory apps | Not needed at 8 SKUs |

No apps were installed during this audit.

---

## 5. SEO / performance status

### SEO — improved, not complete

**Done**
- Product SEO titles/descriptions filled
- Collection SEO filled
- Theme meta description fallback
- Canonical, OG, Twitter card tags
- Organization + WebSite SearchAction JSON-LD
- Product `structured_data` on PDP
- Favicon fallback

**Still open**
- Shop name “My Store” in titles/schema until renamed
- Missing FAQ / size guide / shipping pages
- Empty hoodie images (no image SEO / OG image quality)
- Homepage Preferences title/description
- Incomplete legal policies
- Password gate blocks public indexing until launch
- Confirm product sitemap after go-live

### Performance — acceptable theme budget, media risk

| Asset class | Status |
|-------------|--------|
| `theme.js` | ~9.8KB — under Theme Check JS threshold |
| CSS (`tokens`/`critical`/`base`) | Small; under thresholds |
| Homepage MP4s | **High risk** (multi-MB) |
| Category/hero JPGs | Moderate; compress further if possible |
| Fonts | Remote Google Fonts with `display=swap` |

Core Web Vitals will be driven more by hero media and third-party checkout than by theme JS size.

---

## 6. Theme Editor status

### Editable (good)
- Hero copy, media, CTA
- Category tiles (title/link/image)
- New Arrivals collection, eyebrow, heading, product count
- Trust strip pillars + WhatsApp
- Hanger rail pieces + WhatsApp
- Footer eyebrow/heading/tagline/marquee/WhatsApp/menus
- Header drawer meta + search tags
- PDP WhatsApp toggle/number, specs blocks
- Global favicon/logo pickers in `settings_schema.json`

### Fallback / semi-hardcoded
- Header/footer collection links when no menu assigned (now correctly Hoodies / Sweatshirts / Trousers / Shop All)
- Size guide measurement tables in snippets/sections (merchant-editable only by editing theme content or future metafields)
- Some search empty-state copy

### Recommendation
Assign Shopify navigation menus in Admin for Header/Footer when you want zero-code link management. Until then, theme fallbacks match the launch catalog.

---

## 7. Checkout path status

| Step | Result |
|------|--------|
| Product available (sweatshirts + hoodies) | Yes (API + `/products/*.js`) |
| Add to cart | Yes (local preview; live sometimes Cloudflare-challenged under automation) |
| Cart page | Yes — lines render, checkout link present |
| `/checkout` start | Reaches Shopify checkout URL |
| Complete checkout with shipping | **Blocked** until shipping rates exist |
| Payment capture | Manual — not tested / not changed |

---

## 8. Files changed in this audit (theme)

```
assets/critical.css
layout/password.liquid
layout/theme.liquid
sections/cart.liquid
sections/collection.liquid
sections/featured-collection.liquid
sections/footer.liquid
sections/header-group.json
sections/header.liquid
sections/hero.liquid
sections/search.liquid
sections/size-guide-page.liquid
snippets/meta-tags.liquid
snippets/product-buy-box.liquid
snippets/product-card.liquid
snippets/product-sticky-bar.liquid
snippets/size-guide.liquid
templates/index.json
ADOT-prelaunch-audit.md  (this file)
```

Live theme push: **successful** to `AdotShopify` `#188673753266` (`shopify theme push --allow-live --nodelete`).

---

## 9. How to re-verify quickly

```bash
# Local preview
shopify theme dev --store=1wa9f5-nc.myshopify.com --store-password="$SHOPIFY_STORE_PASSWORD" --port 9292

# Theme Check
shopify theme check

# Storefront password unlock must use the custom domain cookie host
# POST https://adotoffical.com/password  then GET https://adotoffical.com/
```

Preview URLs used during audit:
- Local: `http://127.0.0.1:9292/`
- Theme editor: `https://1wa9f5-nc.myshopify.com/admin/themes/188673753266/editor`

---

## 10. Bottom-line launch gate

Do **not** call this production-ready until all of the following are true:

- [ ] Pakistan shipping rate(s) configured
- [ ] Pages `faq`, `size-guide`, `shipping-delivery` live with correct templates
- [ ] Shop renamed to ADOT
- [ ] All hoodie images uploaded
- [ ] Test order completes (address → shipping → payment/COD)
- [ ] Refund / shipping / terms policies published
- [ ] Homepage SEO filled in Preferences
- [ ] Password removed only after the above

**Current status: NOT PRODUCTION READY**
