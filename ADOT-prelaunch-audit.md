# ADOT Wear Pre-Launch Audit Report

**Date:** 2026-10-08 (updated same day after follow-up fixes)  
**Brand name:** **ADOT Wear**  
**Store:** `1wa9f5-nc.myshopify.com`  
**Primary domain:** `https://adotoffical.com/`  
**Theme:** AdotShopify (live theme id `#188673753266`)  
**Auditor:** Grok Build (theme + Admin API + storefront crawl + local preview)  
**Credentials source:** `.env` (store domain, storefront password, Admin app client credentials)

---

## Final verdict

# **NOT PRODUCTION READY**

Theme quality is strong after this audit pass. Remaining launch blockers are store-ops: **shipping rates**, **hoodie product images**, **payments/COD test order**, **legal policies**, and **password removal** when ready.

Support pages and Theme Editor CDN imagery are done. Shop Admin name is currently **`AdotWear`** (API cannot set spacing to `ADOT Wear` — change manually in Settings → Store details if you want the space).

---

## Scope and constraints

### In scope
- Full theme codebase: Liquid, JSON, JS, CSS, sections, snippets, templates, schemas
- Product / variant / cart / collection / search / navigation / page behaviour
- Mobile + desktop responsiveness
- Theme Editor editability and hardcoded content
- Shopify Theme Check
- SEO basics, performance, accessibility basics
- Live Shopify catalog/data via Admin API + password storefront
- Catalog fixes, page creation, asset cleanup, Files/CDN Theme Editor wiring
- Theme push to the already-live theme (no new theme publish)

### Explicitly out of scope / not done
- Removing the storefront password
- Changing payment, tax, or legal policy *content* beyond creating pages
- Installing apps
- Inventing final hoodie product photography

### User decisions
- Launch timing: ASAP
- Scope: theme + product/collection data
- Must-pass flow: full checkout path
- Category IA: Hoodies + Sweatshirts + Trousers (trousers products later)
- Hoodie images: leave blank until real photos
- Shop rename: **ADOT Wear** (Admin currently `AdotWear`; API rename still 406)
- Shipping rates: merchant will add in Admin
- Assets: delete extras + Fabric Reveal; upload hero/category/hanger to Theme Editor CDN

---

## Store snapshot (current)

| Item | Value |
|------|--------|
| Shop name (Admin) | `AdotWear` (set display to **ADOT Wear** manually if desired) |
| Plan | Basic |
| Currency | PKR |
| Timezone | Asia/Karachi |
| Password enabled | Yes |
| Products | 8 active (5 Hoodies, 3 Sweatshirts) |
| Hoodie images | Still **0** on all 5 hoodies |
| Sweatshirt images | Present with alt text |
| Collections | frontpage/ADOT Essentials, new-arrivals, hoodies, sweatshirts, trousers, shop-all, special-offers |
| Pages | contact, **faq**, **size-guide**, **shipping-delivery** (all published) |
| Shipping zones | Domestic + International — **rates still empty** |
| Admin app scopes (current) | products, inventory, files, content/pages, shipping, navigation, locations, discounts |

### Product inventory summary
- All products `active`, inventory tracked, `deny` when OOS
- Sizes: M / L / XL / XXL
- Weights: hoodies **0.7 kg**, sweatshirts **0.5 kg**
- SEO titles now end with `| ADOT Wear`

---

## 1. Problems found (original audit)

### A. Launch blockers
1. No shipping rates in Domestic/International zones  
2. Support pages 404 (faq / size-guide / shipping-delivery) — **fixed**  
3. Five hoodies with zero images — **still open**  
4. Shop named “My Store” — **renamed in Admin to AdotWear** (API cannot set `ADOT Wear`)  
5. Payments / COD / tax / legal not production-validated — **still open**

### B. Catalog / IA
6. Homepage sold Polos/Shirts while catalog is Hoodies/Sweatshirts — **fixed**  
7. Sweatshirts tagged `Shirts` — **fixed**  
8. Size guide matched Sweatshirts to shirts chart — **fixed**  
9. Product weights 0 kg — **fixed**  
10. Trousers collection missing — **fixed** (empty, ready for products)  
11. Empty product/collection SEO — **fixed** (now ADOT Wear)

### C. Theme / assets
12. Missing `section-size-guide.css` reference — **fixed**  
13. Unused Liquid assigns — **fixed**  
14. Blank password title — **fixed**  
15. No skip link — **fixed**  
16. No favicon fallback — **fixed**  
17. Meta description missing when shop description blank — **fixed**  
18. ~7 MB unused/campaign media + Fabric Reveal not on homepage — **removed**  
19. `category-shirts.jpg` vs Sweatshirts title mismatch — **renamed**

### D. SEO / performance
20. Thin homepage Preferences meta — still manual  
21. Incomplete legal policies — still open  
22. Large MP4s — **removed with Fabric Reveal cleanup**  
23. Theme JS/CSS budgets OK  

---

## 2. Problems fixed

### Theme code (pushed live)
| Change | Detail |
|--------|--------|
| Homepage IA | Hoodies / Sweatshirts / Trousers; hero CTA → New Arrivals |
| Featured collection | Wired to `new-arrivals` |
| Nav / search / footer / cart empty CTAs | Aligned to real collections |
| Size guide | `sweatshirts` key; sweat matched before `shirt` |
| Size-guide page | Removed broken CSS asset ref |
| A11y / SEO chrome | Skip link, favicon fallback, meta description fallback, blank title fix |
| Brand copy | Fallback meta uses **ADOT Wear** |
| Fabric Reveal | **Section + all media deleted** |
| Assets | Dead campaign media deleted; `category-shirts.jpg` → `category-sweatshirts.jpg` |
| Theme Check | **0 offenses** |

### Catalog / Admin API
| Change | Detail |
|--------|--------|
| Pages created | `/pages/faq` (template `faq`), `/pages/size-guide`, `/pages/shipping-delivery` (template `shipping`) — verified HTTP 200 |
| Trousers collection | Smart collection by product type |
| Weights / tags / SEO | Applied; SEO retargeted to **ADOT Wear** |
| Frontpage SEO | `ADOT Wear \| Hoodies & Sweatshirts` |

### Theme Editor + Shopify Files CDN
Uploaded theme imagery to **Content → Files**, then wired `shopify://shop_images/adot-theme-…` into homepage settings:

| Surface | Files |
|---------|--------|
| Hero | `adot-theme-hero-desktop.jpg`, `adot-theme-hero-mobile.jpg` |
| Category tiles + marquee | hoodies / sweatshirts / trousers JPGs |
| Hanger rail cards | front (+ side) PNGs |
| Theme settings | logo + favicon → `adot-theme-logo.png` |

**Live verify:** homepage serves  
`//adotoffical.com/cdn/shop/files/adot-theme-hero-desktop.jpg?width=…`  
(Shopify CDN with responsive width transforms).

Theme `assets/` copies remain as **fallbacks** if an Editor image is cleared.

### Assets after cleanup (~2.7 MB, was ~7.0 MB)

**Kept**
- `theme.js`, `tokens.css`, `base.css`, `critical.css`
- `logo.png`
- `hero-desktop.jpg`, `hero-mobile.jpg`
- `category-hoodies.jpg`, `category-sweatshirts.jpg`, `category-trousers.jpg`
- Hanger: 3 fronts + hoodie/shirt sides

**Deleted**
- All `fabric-*` campaign stills/videos
- `hoodie-walk-campaign.*`
- `adot-rail-trouser-side.png`
- `sections/fabric-reveal.liquid`

---

## 3. Manual action checklist (you)

### Must do before removing password
1. **Shipping rates** — Settings → Shipping and delivery → Pakistan rate(s) / COD  
2. **Upload hoodie product images** for all 5 hoodies (with alts)  
3. **Payments** — enable COD/cards; place a real test order  
4. **Legal policies** — refund, shipping, terms (privacy exists)  
5. **Online Store → Preferences** — homepage title/meta, social image  
6. **Shop display name** — Settings → Store details → set exactly **`ADOT Wear`** if you want the space (Admin API cannot)  
7. Confirm domain spelling `adotoffical.com`  
8. **Then** remove storefront password  

### Nice to have
- Add trousers products into empty Trousers collection  
- Compress category/hero JPGs further if Lighthouse flags LCP  
- Assign Shopify navigation menus (fallback links already correct)

---

## 4. Recommended apps

Prefer native Shopify. Do **not** install clutter for launch.

| Need | Recommendation |
|------|----------------|
| COD | Native manual payment / available Shopify payment options |
| WhatsApp | Already in theme (`wa.me`) — no app required for v1 |
| Reviews / page builders / popups / SEO spam apps | Skip |

No apps installed during this audit.

---

## 5. SEO / performance status

### SEO — improved
- Product + collection SEO filled with **ADOT Wear**
- Theme meta fallback mentions ADOT Wear
- Canonical, OG, Twitter, Organization / WebSite / Product JSON-LD
- Support pages live (faq, size guide, shipping)
- Favicon/logo via Theme settings (Files CDN)

### Still open
- Admin shop name spacing (`AdotWear` vs `ADOT Wear`)
- Empty hoodie images  
- Homepage Preferences fields  
- Incomplete legal policies  
- Password gate until launch  

### Performance
- Theme JS/CSS under Theme Check budgets  
- Multi-MB unused videos **removed**  
- Homepage images now on Files CDN with `width` srcset  
- Category/hero JPG weight still moderate — compress later if needed  

---

## 6. Theme Editor status

### Editable and now populated
- Hero desktop/mobile images (CDN)  
- Category tile images (CDN)  
- Brand marquee chip images (CDN)  
- Hanger rail front/side images (CDN)  
- Logo + favicon (CDN)  
- Copy: hero, tiles, New Arrivals, trust strip, footer WhatsApp, etc.

### Fallback / code defaults
- Header/footer collection links when no menu assigned  
- Theme `assets/` images if Editor image cleared  
- Size chart tables in Liquid/JSON  

Theme Editor URL:  
`https://1wa9f5-nc.myshopify.com/admin/themes/188673753266/editor`

---

## 7. Checkout path status

| Step | Result |
|------|--------|
| Product availability | Yes (sweatshirts + hoodies) |
| Add to cart | Yes |
| Cart page | Yes |
| `/checkout` start | Reaches Shopify checkout |
| Complete with shipping | **Blocked** until rates exist |
| Payment capture | Manual — not tested |

---

## 8. Shopify image best practice (applied)

| Image type | Where we put it | Status |
|------------|-----------------|--------|
| Product photos | Product admin media | Sweatshirts done; hoodies missing |
| Hero / category / hanger / logo | **Theme Editor → Files CDN** | Done (`adot-theme-*`) |
| Code fallbacks | Theme `assets/` | Kept (smaller set) |
| Dead campaign / Fabric Reveal | Deleted | Done |

**Rule:** finals in Theme Editor (CDN + editable); `assets/` only as backup; product photos only on products.

---

## 9. Files touched (theme) since audit start

```
ADOT-prelaunch-audit.md
assets/* (deletions + category rename)
assets/critical.css
config/settings_data.json          # logo + favicon CDN refs
layout/password.liquid
layout/theme.liquid
sections/brand-marquee.liquid
sections/cart.liquid
sections/collection.liquid
sections/featured-collection.liquid
sections/footer.liquid
sections/header-group.json
sections/header.liquid
sections/hero.liquid
sections/search.liquid
sections/size-guide-page.liquid
sections/fabric-reveal.liquid      # DELETED
snippets/meta-tags.liquid
snippets/product-buy-box.liquid
snippets/product-card.liquid
snippets/product-sticky-bar.liquid
snippets/size-guide.liquid
templates/index.json               # IA + CDN image_picker refs
```

---

## 10. Launch gate checklist

- [ ] Pakistan shipping rate(s) configured  
- [x] Pages `faq`, `size-guide`, `shipping-delivery` live with correct templates  
- [~] Shop renamed (`AdotWear` in Admin — set **ADOT Wear** manually if you want the space)  
- [ ] All hoodie images uploaded  
- [ ] Test order completes (address → shipping → payment/COD)  
- [ ] Refund / shipping / terms policies published  
- [ ] Homepage SEO filled in Preferences  
- [x] Theme Editor CDN images for hero/category/hanger/logo  
- [x] Dead assets + Fabric Reveal removed  
- [ ] Password removed only after the above  

**Current status: NOT PRODUCTION READY**

---

## 11. Quick re-verify

```bash
shopify theme check
shopify theme dev --store=1wa9f5-nc.myshopify.com --store-password="$SHOPIFY_STORE_PASSWORD" --port 9292
```

Confirm in browser (after password):
- `/` hero/category/hanger load from `/cdn/shop/files/adot-theme-…`
- `/pages/faq`, `/pages/size-guide`, `/pages/shipping-delivery` → 200  
- Titles show shop name from Admin (`AdotWear` until you change it)
