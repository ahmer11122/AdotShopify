# SEO / SPEED / AI-VISIBILITY AUDIT - adotoffical.com - 9 October 2026

**Mode:** Pre-launch (password-protected) — Phase A theme code + password-page + authenticated sample crawl.  
**Brand decision (owner, this session):** canonical name = **ADOT Official**. Product line shown = menswear (hoodies / fleece); **ADOT Fashion (embroidered 2-piece suits) is unrelated** — disambiguate, do not claim.  
**Store:** `1wa9f5-nc.myshopify.com` → primary `https://adotoffical.com` · Plan Basic · Currency PKR · Theme live id `#188673753266`  
**Secrets:** storefront password referenced only as `[storefront password]` — never printed here.

---

## 1. Executive summary (max 10 lines)

- **Overall health:** T Amber · S Red · P Amber · O Amber · U Amber · G Amber · **M N/A** · **A N/A (record-only)** · L Red · **B Red (highest priority)** · X Red  
- **Top 5 problems:** (1) Password wall + password page is what Google/AI currently read; (2) brand entity chaos (`ADOT Official` vs `AdotWear` vs `ADOT Wear` vs vendor `ADOT`); (3) duplicate Product/ProductGroup JSON-LD on every PDP; (4) five hoodies with **zero** images; (5) missing About + incomplete legal policies; Instagram private (owner report).  
- **Top 5 quick wins (< 1 day):** Rename shop display to **ADOT Official**; fix password H1/locale + add Instagram/WhatsApp; remove duplicate `structured_data` in `sections/product.liquid` **or** `snippets/meta-tags.liquid`; noindex `/search`; add Organization `sameAs` + WebSite `alternateName`.  
- **Could NOT verify:** Search Console / Bing / GA4 / Merchant Center dashboards (no owner login); CrUX field CWV (pre-launch); Lighthouse lab in authenticated Chrome session (owner should run); live ChatGPT/Gemini/Claude prompt matrix at scale; whether Instagram is still private (HTTP 200 only); apps list beyond theme inspection.

---

## 2. Scope and method

### Pages sampled (authenticated with [storefront password] where needed)

| Type | URLs |
|---|---|
| Password (public) | `https://adotoffical.com/` → `/password` |
| Homepage | `/` |
| Collections | `/collections/hoodies`, `/trousers` (empty), `/shop-all`, `/hoodies?page=2`, `/hoodies?filter.v.option.size=M`, `/hoodies?sort_by=price-ascending` |
| Products (8) | All 5 hoodies + 3 sweatshirts (multi-variant; images only on sweatshirts; sale compare-at visible) |
| Collection-scoped PDP | `/collections/hoodies/products/heavyweight-pullover-hoodie-jet-black` |
| Pages | `/pages/contact`, `/faq`, `/shipping-delivery`, `/size-guide`; `/pages/about` **404** |
| Policies | `/policies/privacy-policy` 200; refund / terms / shipping-policy **404** |
| Search / cart / 404 / blog / account | `/search?q=hoodie`, `/cart`, missing product 404, `/blogs/news` (empty), `/account/login` |
| Agent files | `/robots.txt`, `/sitemap.xml` (404 public / 200 auth), `/agents.md`, `/llms.txt`, `/.well-known/ucp` |

### Tools / commands
- `curl -sIL` redirect + header matrix; bot UA header checks  
- Authenticated Python/`curl` HTML saves under `/tmp/adot-seo-audit/raw/`  
- `shopify theme check` (1 error, 1 warning)  
- Admin GraphQL catalog dump (products, collections, pages, metafields)  
- Theme grep/read: `layout/`, `snippets/meta-tags.liquid`, `sections/product.liquid`, hero/password, assets sizes  
- Google Merchant Center supported-countries page (Pakistan absent) `[OFFICIAL]`  
- Web search for brand collisions / `adotofficial.com`

### Access
**Had:** theme repo, storefront password, Admin API (products/content/shipping scopes), public web.  
**Did not have:** GSC, Bing Webmaster, GA4 UI, Merchant Center, PageSpeed API key, owner Lighthouse exports.

### Confidence legend
`[OFFICIAL]` Google/Bing/OpenAI docs · `[PLATFORM-DOC]` Shopify · `[INDUSTRY]` unverified hypothesis

---

## 3. Scorecard

| Module | Checks run | PASS | FAIL | UNVERIFIED | N/A | Worst severity |
|---|---:|---:|---:|---:|---:|---|
| T Crawl/index (Phase A) | 18 | 7 | 6 | 5 | 0 | P0 |
| S Structured data | 10 | 3 | 5 | 2 | 0 | P0 |
| P Performance | 20 | 8 | 7 | 5 | 0 | P1 |
| O Content | 12 | 4 | 6 | 2 | 0 | P1 |
| U UX/a11y | 9 | 5 | 2 | 2 | 0 | P1 |
| G Google AI | 8 | 1 | 2 | 5 | 0 | P0 (post-launch) |
| M Merchant Center | 2 (M-13/14 only) | 0 | 2 | 0 | rest | P1 (metafields/taxonomy) |
| A Agentic/Catalog | 2 (A-05/06 record) | — | — | — | rest | N/A |
| L AI chatbots | 8 | 2 | 3 | 3 | 0 | P0 |
| B Brand/entity | 8 | 0 | 7 | 1 | 0 | P0 |
| X Measurement | 6 | 0 | 0 | 6 | 0 | P0 |

---

## 4. Findings (prioritized)

### B-05 / B-02 Brand name inconsistency matrix - P0 - Effort S - Confidence [OFFICIAL]+[PLATFORM-DOC]
- **Where:** Admin shop name, titles, schema, password page, agents.md  
- **Evidence:**

| Surface | Observed string |
|---|---|
| Owner canonical (this audit) | **ADOT Official** |
| Admin `shop.name` | `AdotWear` |
| Homepage `<title>` | `AdotWear` |
| Product SEO titles | `… \| ADOT Wear` then theme appends `– AdotWear` → **double brand** |
| JSON-LD Organization / WebSite `name` | `AdotWear` |
| Product `brand` / vendor | `ADOT` (bare acronym) |
| Meta fallback copy | `ADOT Wear menswear essentials…` |
| `agents.md` heading | `AdotWear` |
| Instagram (owner) | `@adotofficial` |

- **Why it matters:** Entity clarity is the #1 lever for branded SERPs and AI answers when the domain is misspelled and “ADOT” collides with Arizona DOT, Web3 Adot, Laurencio Adot, etc. `[OFFICIAL]` fundamentals + playbook 1A.5.  
- **Fix:** Set Settings → Store details name to **`ADOT Official`**. Update SEO title templates to end with `| ADOT Official`. In `snippets/meta-tags.liquid`, set WebSite/Organization `name` to ADOT Official, `alternateName`: `["ADOT Wear","AdotWear","ADOT Official","adotoffical"]`, `description` one factual sentence (menswear hoodies/fleece, Pakistan, COD). Change product `vendor` to `ADOT Official` (or keep short brand field but schema `Brand.name` = ADOT Official).  
- **Verify:** View-source homepage Organization.name; Rich Results / schema validator; branded SERP in 2–4 weeks.  
- **Owner action?** Yes — Admin rename + social bios.

### B-03 About page missing - P0 - Effort S - Confidence [OFFICIAL]
- **Where:** `https://adotoffical.com/pages/about` → **404** (sampled). Pages in Admin: contact, faq, size-guide, shipping-delivery only.  
- **Evidence:** HTTP 404, H1 `Page Not Found`, canonical `https://adotoffical.com/404`.  
- **Why it matters:** About is the primary fact sheet AI/Google quote for “who is this brand?”  
- **Fix:** Create published About page: what you sell, who for, Pakistan-only, COD, founding facts, clear line that you are **not** ADOT Fashion (suits) / not Arizona DOT / not other Adots; link Instagram once public; WhatsApp.  
- **Verify:** 200, indexable after launch, linked from footer.  
- **Owner action?** Yes — copy approval.

### T-02 Store password-protected - P0 - Effort S (ops) - Confidence [PLATFORM-DOC]
- **Where:** `/` → 302 → `/password`  
- **Evidence:** `curl -sIL https://adotoffical.com/` → 302 then 200 password; `x-robots-tag: nofollow` on password response; `pageType;desc="password"`.  
- **Why it matters:** Blocks real product indexing; AI Overviews currently describe an “upcoming store” from thin password content (owner screenshot, 1A.2).  
- **Fix:** Do **not** remove password until launch gate (1A.4a): P0 theme fixes, shipping rates, COD test order, policies, brand rename, hoodie images. Then remove password and run Phase B within 48h.  
- **Verify:** Logged-out private window loads homepage 200 without password form.  
- **Owner action?** Yes — launch timing.

### T-02b / 1A.4 Password page quality - P1 - Effort S - Confidence [INDUSTRY]+playbook
- **Where:** `layout/password.liquid`, `sections/password.liquid`, `locales/en.default.json`  
- **Evidence (public HTML):**  
  - `<title>AdotWear</title>`  
  - Meta description OK-ish: ADOT Wear menswear + COD Pakistan  
  - **H1:** `This shop is private` (from `password.title` locale) — not brand-forward  
  - `x-robots-tag: nofollow` only — **no `noindex`** in meta or header (explains Google indexing the password URL)  
  - No Instagram link, no WhatsApp, no OG image, COMING SOON tag present  
  - Organization schema name `AdotWear`, no `sameAs`  
- **Fix:** Change locale `password.title` → e.g. `ADOT Official`; H1 brand + one-line descriptor; body: menswear hoodies/fleece, Pakistan, COD, launch note; links to public Instagram + WhatsApp; set social sharing image in Preferences; keep email capture. Optional: accept that Shopify’s password `nofollow` behavior is platform-controlled.  
- **Verify:** View-source public `/password` after theme publish.  
- **Owner action?** Partial — Preferences social image + Instagram URL.

### S-01 Duplicate Product/ProductGroup JSON-LD - P0 - Effort S - Confidence [OFFICIAL]
- **Where:** `snippets/meta-tags.liquid` lines 57–60 **and** `sections/product.liquid` lines 11–14  
- **Evidence:** Authenticated PDP `p-multi` has **4** `ld+json` blocks; **two** full `ProductGroup` graphs with identical prices (`3200.00` PKR). `prod_schema` type hits = 10 (duplicated).  
- **Why it matters:** Duplicate Product markup risks rich-result loss / spam handling. `[OFFICIAL]`  
- **Fix (dev theme only):** Keep **one** source — prefer `{{ product | structured_data }}` once in `meta-tags.liquid` (product page_type) **or** once in `product.liquid`, delete the other.  
```diff
- <!-- Google Structured Data (JSON-LD) -->
- <script type="application/ld+json">
-   {{ product | structured_data }}
- </script>
```
(remove from `sections/product.liquid` if keeping meta-tags)  
- **Verify:** View-source → exactly one Product/ProductGroup; Rich Results Test after launch.  
- **Owner action?** No — theme fix on duplicate/dev theme.

### S-03 / O-05 Hoodies have zero images - P0 - Effort M - Confidence [PLATFORM-DOC]+[OFFICIAL]
- **Where:** Admin + PDP HTML for all 5 `heavyweight-pullover-hoodie-*`  
- **Evidence:** Admin `imgs=0`; schema `"image"` absent on hoodie variants; HTML contains placeholder SVG; sweatshirts have 2–4 images.  
- **Why it matters:** Image-led discovery, LCP, AI/shopping eligibility, conversion. Catalog rules require ≥1 image. `[PLATFORM-DOC]`  
- **Fix:** Upload ≥4–6 original photos per hero SKU (angles, scale, on-body); descriptive alts; filenames not keyword-stuffed.  
- **Verify:** Admin media count; PDP raw HTML `<img>`; schema `image` array.  
- **Owner action?** Yes — photography.

### S-07 Organization/WebSite incomplete - P1 - Effort S - Confidence [OFFICIAL]
- **Where:** `snippets/meta-tags.liquid` 114–135  
- **Evidence:** Organization has name/url/logo only — **no `sameAs`, no `description`, no `alternateName`**. WebSite has SearchAction but no `alternateName`. Emitted on **all** templates (acceptable) but values wrong brand string.  
- **Fix:** Implement playbook §19.4 with ADOT Official + alternateNames + real profile URLs only.  
- **Verify:** Homepage JSON-LD.  
- **Owner action?** Provide final social URLs.

### T-08 Search results indexable - P1 - Effort S - Confidence [PLATFORM-DOC]
- **Where:** `/search?q=hoodie`  
- **Evidence:** HTTP 200, **no** robots meta noindex, canonical `https://adotoffical.com/search?q=hoodie`, title indexed-pattern. Gift card has noindex; search does not.  
- **Fix:** In `layout/theme.liquid` or `templates/search.json` / search section head:  
  `{% if request.page_type == 'search' %}<meta name="robots" content="noindex, follow">{% endif %}`  
- **Verify:** View-source search.  
- **Owner action?** No.

### T-09 / T-01 Sitemap visibility - P1 - Effort S - Confidence [PLATFORM-DOC]
- **Where:** `/sitemap.xml`, `/robots.txt`  
- **Evidence:** Public (logged-out) `sitemap.xml` → **404**; authenticated → 200 index with products(9 locs incl home), collections(7), pages(4), blogs, agentic. **`robots.txt` has no `Sitemap:` line** (full 3582-byte file ends at adsbot rules). AI bots not individually blocked (`*` Allow: /) — good for L-01 defaults.  
- **Fix:** After password removal, confirm Shopify injects Sitemap line; submit in GSC/Bing. Do not submit while passworded.  
- **Verify:** `curl -s https://adotoffical.com/robots.txt | grep -i sitemap`; GSC sitemap status.  
- **Owner action?** GSC submit post-launch.

### T-05 / T-06 / T-07 URL hygiene (partial PASS) - P2 notes
- **PASS evidence:** Collection-scoped PDP canonical → `/products/heavyweight-pullover-hoodie-jet-black`. Filter/sort URLs canonical → base `/collections/hoodies`. `?page=2` self-canonical. Product cards use `product.url`.  
- **UNVERIFIED:** Infinite-scroll fallback N/A (paginated theme). Facet flood in sitemap — Shopify robots disallows multi-filter; good.

### O-01 Title duplication - P1 - Effort S - Confidence [INDUSTRY]
- **Evidence:** `Heavyweight Pullover Hoodie - Jet Black | ADOT Wear – AdotWear` (SEO title already includes brand; `meta-tags.liquid` appends `shop.name` again). Homepage title only `AdotWear`.  
- **Fix:** Either strip brand from product SEO titles and let theme append **ADOT Official**, or stop appending when title already contains brand (improve the `unless page_title contains shop.name` check to also match alternate names).  
- **Verify:** Sampled titles 30–65 chars guideline, one brand suffix.

### O-04 / O-12 Product copy - P2 - Confidence [INDUSTRY]
- **Evidence:** Descriptions ~140–160 words with GSM, care, size table, COD — decent unique depth for launch. Near-identical bodies across hoodie colourways (expected variants). Trousers collection SEO description wrongly says “heavyweight hoodies and fleece…”  
- **Fix:** Per-colour unique first paragraph eventually; fix trousers SEO/description or noindex empty trousers until stocked.  
- **Verify:** Admin collection SEO.

### O-06 Collection intros - P2
- **Evidence:** Collection `description` lengths 50–126 in Admin but hoodies HTML sample found **no** rendered collection description block (NONE FOUND).  
- **Fix:** Ensure `sections/collection.liquid` outputs `collection.description` in HTML above/below grid.  
- **Verify:** View-source contains intro paragraph.

### L-07 / B-01 Social + corroboration - P0 (brand) - Effort S - Confidence [INDUSTRY]
- **Evidence:** Homepage footer **no** Instagram/Facebook/TikTok hrefs in HTML (`SOCIAL []`). Policy link only privacy. Owner: Instagram private. Web: `adotofficial.com` resolves to a **different** Shopify store (theme id `139946131541` ≠ `188673753266`) — correctly spelled domain is **taken**, do not assume you can redirect it; brutalistwebsites historically tied it to a Chicago rapper “Adot”.  
- **Fix:** Make Instagram **public** Business account; bio = ADOT Official · menswear Pakistan · COD · exact `https://adotoffical.com`; wire footer social settings; print domain on packaging. Skip buying `adotofficial.com` unless you legally control that Shopify store.  
- **Verify:** Public IG; footer links; consistency matrix.  
- **Owner action?** Yes.

### P-01..P-03 LCP image patterns - PASS (code) / UNVERIFIED (lab)
- **Evidence:** `sections/hero.liquid` uses real `<img>` / `image_tag` with `loading: 'eager'`, `fetchpriority: 'high'`. PDP gallery first image eager+high (`product-gallery.liquid`). Hero `heroSettle` animates **scale only** (not opacity:0 on LCP image) — copy uses opacity fades.  
- **Risk:** Category fallback JPGs 355–521 KB; hero-mobile fallback 260 KB — over Pakistan budget (≤100 KB LCP). Live uses Theme Editor CDN images (better), but compress further.  
- **Fix:** Re-export heroes/category tiles ≤100 KB mobile; keep Editor CDN; verify LCP element in DevTools.  
- **Owner action?** Run Lighthouse on password-authed session (1A.4).

### P-30 / P-41 Google Fonts + JS budget - P1 - Effort M - Confidence [PLATFORM-DOC]+heuristic 1A.6
- **Where:** `layout/theme.liquid` / `password.liquid` lines 18–21  
- **Evidence:** Remote `fonts.googleapis.com` Inter + Inter Tight (render-blocking stylesheet). Local first-party JS sum ≈ **98 KB** uncompressed (`theme.js`+`adot-header-system.js`+`threadline.js`) vs tighter ≤80 KB heuristic. Live homepage scripts **did not** include `adot-header-system.js` / `threadline.js` / `header-v2.css` (unpublished header-v2 theme exists per memory) — audit local repo as launch candidate.  
- **Fix:** Self-host 1–2 woff2 on Shopify CDN or system-ui stack; subset weights; defer non-critical JS; load hanger/`threadline` only on templates that need it.  
- **Verify:** Network panel Slow 4G + 6x CPU; transferred font bytes.

### P-31 Orphaned apps - UNVERIFIED / likely clean
- **Evidence:** Theme Check clean of remote app snippets; no Judge.me/Stamped/Yotpo strings in PDP HTML. No review apps detected.  
- **Owner action?** Paste Apps list from admin for confirmation.

### M-13 / M-14 Metafields & taxonomy - P1 - Confidence [PLATFORM-DOC]
- **Evidence:** Product metafields only `global.title_tag` / `global.description_tag`. No typed material/care/origin metafields exposed. `category` = **None** on all products (Shopify Standard Product Taxonomy unused). Theme supports `custom.fabric_spec` / fabric_swatch but unused in Admin.  
- **Module M otherwise N/A:** Pakistan **not** in Google Merchant Center Shopping ads / free listings country table (checked https://support.google.com/merchants/answer/160637 on 9 Oct 2026). `[OFFICIAL]`  
- **Fix:** Define metafields (material, GSM, care, country of origin); assign Apparel taxonomy; surface in PDP HTML.  
- **Verify:** Admin product category + PDP specs table.

### A-05 / A-06 Record only (N/A Catalog) - informational
- **Eligibility:** Password on + Pakistan-only shipping → Shopify Catalog / Agentic Storefronts **not expected**. `[PLATFORM-DOC]`  
- **Recorded (authenticated):**  
  - `/agents.md` → 200, Shopify-managed “Agent Instructions — AdotWear”, UCP/MCP pointers  
  - `/llms.txt` → 200, mirrors agents.md  
  - `/.well-known/ucp` → 200 JSON, version `2026-08-25`, MCP `https://1wa9f5-nc.myshopify.com/api/ucp/mcp`  
- **Public (no password):** agents/llms/ucp redirect or 401/302 — expected pre-launch.  
- **Do not** customize agents.md for “AI ranking.” Google ignores llms.txt. `[OFFICIAL]`

### G-01 / G-03 Google AI prep - P1 - Confidence [OFFICIAL]
- **Evidence:** Password pages are snippet-eligible enough to appear in Google (owner SERP + AI Overview). No GSC access → Generative AI toggle / Domain property **UNVERIFIED**.  
- **Fix now:** Verify **Domain** property via DNS TXT; import Bing from GSC; do **not** submit sitemap or Request Indexing for products until password off. After launch: confirm not opted out of generative AI.  
- **Owner action?** Yes — DNS + GSC.

### X-01..X-03 Measurement - P0 setup - UNVERIFIED
- No evidence GA4 currency PKR, AI assistants channel group, or ecommerce events.  
- **Fix:** GA4 property, PKR, purchase events via Customer Events; custom channel group regex from playbook §14; Bing Webmaster; change log.  
- **Owner action?** Yes.

### U-07 / contact placeholders - P2
- **Evidence:** Skip link + `main#MainContent` present in `theme.liquid`. Contact form uses `placeholder="name@example.com"` (placeholder only — not a published fake email). WhatsApp `wa.me/923131707080` present. Theme Check: missing width/height on loupe zoom img (`product-buy-box.liquid` ~416).  
- **Fix:** Theme Check error; ensure real support email visible on Contact if you have one.  
- **Owner action?** Optional email.

### S-05 Reviews - P2 (expected empty)
- No review app, no `aggregateRating` — correct (do not fake). Plan real reviews post-launch.

### S-08 BreadcrumbList - P2
- Page template has visible breadcrumbs; PDP/collection: **no** BreadcrumbList JSON-LD found. Add matching BreadcrumbList when visible crumbs exist.

---

## 5. Performance appendix

### Lab / field (pre-launch)
| Template | Field LCP/INP/CLS | Lab | LCP element | Notes |
|---|---|---|---|---|
| Home | UNVERIFIED (no CrUX) | UNVERIFIED — owner Lighthouse needed | Likely hero `<img.hero__image>` | eager+fetchpriority present |
| Collection | UNVERIFIED | UNVERIFIED | First product card / hero | |
| Product (hoodie) | UNVERIFIED | Poor expected | Placeholder / text | **No product images** |
| Product (sweatshirt) | UNVERIFIED | UNVERIFIED | Gallery img 0 | |

### Script / asset inventory (local theme launch candidate)

| Asset | Bytes (raw) | Role | Keep / change |
|---|---:|---|---|
| `theme.js` | 9.9 KB | Core | Keep |
| `adot-header-system.js` | 40.0 KB | Header/search/bag | Keep; ensure published with header-v2 |
| `threadline.js` | 47.9 KB | Hanger rail | Conditionally load on index only |
| `header-v2.css` | 43.1 KB | Header | Publish with v2 theme |
| `threadline.css` | 14.9 KB | Hanger | Index-only |
| Google Fonts CSS | remote | 2 families / multi weights | Self-host or system fonts |
| Category JPG fallbacks | 355–521 KB | Tiles | Compress ≤100 KB mobile |
| Hero mobile fallback | 260 KB | LCP | Compress ≤100 KB |

### Top fixes (impact/effort)
1. Compress LCP/category images (high/S)  
2. Self-host or drop Google Fonts (high/S)  
3. Template-conditional `threadline.*` (medium/S)  
4. Publish header-v2 consistently; avoid dual live/dev drift (high/S)  
5. Fix Theme Check ImgWidthAndHeight on loupe (low/S)

---

## 6. Structured data appendix

| Template | Types found | Issues |
|---|---|---|
| Home | Organization, WebSite, SearchAction | Wrong name; no sameAs/alternateName/description |
| Password | Organization, WebSite | Same; password H1 unrelated |
| PDP | **ProductGroup ×2**, Brand, Product×4, Offer×4, Organization, WebSite | **Duplicate ProductGroup**; brand `ADOT`; hoodie no images; PKR prices match visible sale price 3200; SKUs present; **no GTIN**; variant `@id` relative paths |
| Collection | Organization, WebSite only | No CollectionPage/ItemList (optional) |
| Article/Blog | N/A empty blog | |
| Search | Organization, WebSite | Should be noindex |

---

## 7. AI visibility appendix

### robots.txt AI-bot table (public)

| Bot | Rule | Status |
|---|---|---|
| `*` | Allow: / + standard Shopify Disallows | PASS defaults |
| OAI-SearchBot / ChatGPT-User / Claude-SearchBot / PerplexityBot / Bingbot / Applebot | No specific group | Inherit `*` — allowed |
| GPTBot / ClaudeBot / Google-Extended / CCBot | No specific group | Inherit `*` — allowed (owner policy Q14 still open) |
| Sitemap line | **Missing** | FAIL/UNVERIFIED platform quirk under password |

Bot UA requests to `/` all 302 → password (expected).

### Prompt test (baseline — limited)

| Query | Observed (9 Oct 2026) | Notes |
|---|---|---|
| Owner Google SERP `adotoffical` | Homepage titled AdotWear; AI Overview mixes ADOT Official / ADOT Fashion suits; cites private IG | Per 1A.2 — treat as baseline |
| Web search `ADOT Wear` / `adotoffical.com` | Almost no third-party corroboration of this store | Open-web citation rate ≈ 0 |
| Name collisions | Arizona DOT; Adot Web3; Laurencio Adot; historical adotofficial.com rapper site | Always pair descriptor |

**Full §15 matrix (ChatGPT/Gemini/Claude/Perplexity × 30 prompts × 3):** UNVERIFIED this session — run at launch day 0/7/30.

### Consistency matrix (brand facts)

| Fact | Site | Schema | IG | Domain |
|---|---|---|---|---|
| Name | AdotWear / ADOT Wear | AdotWear / brand ADOT | adotofficial | adotoffical.com (misspelling) |
| Category | Hoodies/fleece menswear | Same in descriptions | UNVERIFIED private | — |
| Market | Pakistan COD | In product copy | Should state | — |
| About | **Missing** | Thin | — | — |

### Catalog / Merchant eligibility
- Merchant Center free listings: **N/A** (Pakistan unsupported) `[OFFICIAL]`  
- Shopify Catalog: **N/A** (password + no US/CA ship) `[PLATFORM-DOC]`  
- On-page Product schema: still worth fixing for future rich results.

---

## 8. Prioritized roadmap

### Week 1 — P0 (before password removal)
| Item | Owner | Effort | Deps |
|---|---|---|---|
| Canonical rename → **ADOT Official** everywhere | Owner + dev | S | Decision done |
| About page + legal policies (refund, terms, shipping policy) | Owner + merch | M | Copy |
| Remove duplicate Product JSON-LD | Dev (dev theme) | S | — |
| Upload hoodie images (5 SKUs) | Owner | M | Photos |
| Password page H1/locale + IG/WhatsApp/OG | Dev + owner | S | Public IG |
| Instagram → public Business; bio + link | Owner | S | — |
| Shipping rates + COD + test order | Owner | M | Payments |
| GSC Domain property + Bing import (no sitemap submit yet) | Owner | S | DNS |
| GA4 PKR + basic ecommerce | Owner/dev | M | — |

### Weeks 2–4 — P1 (launch week + after)
| Item | Owner | Effort |
|---|---|---|
| Remove password; Phase B crawl (T/S live) | Owner + agent | S |
| Submit sitemap; index home + top collections + top 5 PDPs | Owner | S |
| Search noindex; trousers SEO fix / noindex empty | Dev | S |
| Organization sameAs + alternateName | Dev | S |
| Fonts self-host; image compression | Dev | M |
| Metafields + Shopify taxonomy | Merch + dev | M |
| Branded prompt tests day 0/7 | Agent | S |
| Publish header-v2 theme if that is launch UI | Owner | S |

### Month 2–3 — P2
- Collection intro HTML; BreadcrumbList; review app (real only); blog buying guides; conditional threadline JS; size-chart content expansion; change log + CWV monitoring.

### Backlog — P3
- Speculation Rules; Wikidata only if notable; `adotofficial.com` — **do not buy** unless you control the other Shopify store (different theme id).

---

## 9. Questions for the owner

1. Confirm social URLs to put in `sameAs` (IG, TikTok, Facebook, YouTube).  
2. Intake Q14: allow AI **training** bots (GPTBot/ClaudeBot/Google-Extended) or only search/user bots?  
3. Is `adotofficial.com` (correct spelling) **your** second Shopify store or a third party? (Evidence: different theme id.)  
4. Real support email for Contact (beyond WhatsApp)?  
5. Launch date string for password page?  
6. Competitors list (playbook intake Q8) for O-15 gap table?  
7. Apps installed list (reviews/popups/GTM)?  
8. Can you run Lighthouse (mobile) on home + collection + sweatshirt PDP while logged in with the storefront password and paste scores + LCP element?

---

## 10. Needs owner access (exact)

1. Google Search Console — Domain property screenshots: verification, Page indexing, Generative AI control/report (if any).  
2. Bing Webmaster — verification + AI Performance (when available).  
3. GA4 — property access or acquisition export.  
4. Shopify admin → Apps list; Online Store → Preferences (password, social image); Settings → Policies; Shipping rates screenshot.  
5. Instagram: switch public + screenshot bio.  
6. Lighthouse JSON/PDF for 3 templates (authed).  
7. Optional: PageSpeed Insights API key for agent re-runs post-launch.

---

## Myth check (for the owner)

| Myth | This store |
|---|---|
| “Add llms.txt to rank in AI” | Shopify already serves it; Google ignores it. Harmless. |
| “Merchant Center will fix Shopping” | Pakistan unsupported today — skip until you sell to a listed country. |
| “Agentic Catalog will list us” | Needs open storefront + US/CA shipping — N/A now. |
| “Fix the misspelled domain or we can’t rank” | Google already associates it; focus on brand entity + content. |

---

## Launch-day checklist reminder (1A.4a)

Gate: P0 above fixed + test order (incl. COD) + policies live + brand string consistent.  
Then: remove password → agent re-crawl robots/sitemap/sample 200/canonical/JSON-LD → GSC+Bing sitemap → public IG launch post → day 2/7 re-test Modules T/S + branded prompts → week 4 full re-audit.

---

*Evidence pack path: `/tmp/adot-seo-audit/raw/` (HTML, headers, admin-catalog.json, theme-check.txt). Theme edits must be on a duplicate/dev theme only — no live edits from this audit.*
