# Atelier Desk footer pages — files changed & where the design lives

**Date:** 10 Oct 2026  
**Commits:** `b0a4c3c` → `6d2441b`  
**Themes updated:** live `#188673753266`, Development `#188676800690`, Atelier Desk preview `#188753510578`

---

## What this is

Quiet-luxury redesign of FAQ, Shipping, Size Guide, Contact, generic Page, and `/policies/*` (privacy, shipping, refund/exchange, terms). Shared kit, WhatsApp-first help, no new fonts/libs/images.

---

## Where the design lives

| Layer | Path | Role |
|---|---|---|
| **Shared styles** | `assets/adot-pages.css` | All page look: hero, forms, FAQ, size chart, help card, buttons, policy body. Accents use store tokens (`#111` / muted / live green) — no brass/brown. |
| **Shared JS** | `assets/adot-pages.js` | Sticky offsets, TOC open/close, scroll progress, ETA. |
| **Shared JS (UI)** | `assets/adot-pages-ui.js` | FAQ accordion/search, size chart unit + find-size, contact submit, policy TOC. |
| **Kit load gate** | `layout/theme.liquid` | Loads CSS/JS when `template.name` is `page` \| `policy`, **or** path contains `/policies/`. Also **intercepts** `/policies/*` and renders `adot-policy-layout` (Shopify ignores `templates/policy.liquid`). |
| **Page chrome** | `snippets/adot-hero.liquid`, `adot-title.liquid` | № label + large title (same hero language as footer pages). |
| **Buttons** | `snippets/adot-btn.liquid` + CSS in `adot-pages.css` | Hover matched to homepage hero: clip-path wipe-up, arrow nudge `4px`, press `scale(0.96)`. |
| **Help** | `snippets/adot-help-card.liquid`, `adot-mobile-help.liquid`, `adot-wa-link.liquid` | WhatsApp + email from Theme settings. |
| **Policy layout** | `snippets/adot-policy-layout.liquid` | Full Atelier Desk shell for legal policies; body/title from `shop.privacy_policy` / `shop.shipping_policy` / `shop.refund_policy` / `shop.terms_of_service`. |
| **Color source** | `assets/tokens.css` | App palette: `--color-text` `#111`, `--color-text-muted`, `--color-live-indicator`, surfaces/borders. Atelier CSS aliases `--adot-brass` → these tokens. |
| **Hover reference** | `sections/hero.liquid` (`.btn-hero-primary`) | Design source for button hover on footer pages. |

**Not used on top of pages anymore:** sticky service index (`snippets/adot-service-index.liquid` kept in repo but not rendered — it collided with the site header nav).

---

## Files changed (by area)

### New files created

| File | Purpose |
|---|---|
| `assets/adot-pages.css` | Shared Atelier Desk stylesheet |
| `assets/adot-pages.js` | Shared kit JS (core) |
| `assets/adot-pages-ui.js` | Shared kit JS (FAQ / size / contact / policy) |
| `sections/main-policy.liquid` | Policy section (backup; live path uses layout intercept + snippet) |
| `snippets/adot-btn.liquid` | Button partial |
| `snippets/adot-help-card.liquid` | Bottom help patch |
| `snippets/adot-hero.liquid` | Page hero |
| `snippets/adot-mobile-help.liquid` | Mobile WhatsApp bar |
| `snippets/adot-policy-layout.liquid` | `/policies/*` layout |
| `snippets/adot-service-index.liquid` | Service index (retired from render) |
| `snippets/adot-title.liquid` | Word-split title |
| `snippets/adot-wa-link.liquid` | `wa.me` URL builder |
| `templates/policy.liquid` | Thin wrapper (Shopify often ignores it) |

### Existing files redesigned / updated

| File | What changed |
|---|---|
| `layout/theme.liquid` | Kit load + `/policies/*` intercept |
| `config/settings_schema.json` | WhatsApp / support email copy for footer pages |
| `sections/faq-page.liquid` | Atelier Desk FAQ |
| `sections/shipping-policy-page.liquid` | Atelier Desk shipping page |
| `sections/size-guide-page.liquid` | Chart-only (no shirt SVG); horizontal scroll table |
| `sections/contact-page.liquid` | Atelier Desk contact; boxed inputs |
| `sections/page.liquid` | Generic page → Atelier Desk |
| `templates/page.faq.json` | FAQ template wiring |
| `templates/page.shipping.json` | Shipping template wiring |
| `templates/page.size-guide.json` | Size guide template wiring |
| `templates/page.contact.json` | Contact template wiring |

### Unrelated leftover (separate commit)

| File | Commit | Note |
|---|---|---|
| `sections/collection.liquid` | `18e49c3` | Removed category filter pills (not part of Atelier Desk kit) |

---

## Design decisions (short)

1. **No second sticky nav** — site header only; service index removed from pages.  
2. **Colors from the app** — `tokens.css` neutrals + live green; brass `#A8864F` removed.  
3. **Policies** — Shopify’s default `shopify-policy__*` shell is replaced in `theme.liquid`; content from `shop.*_policy`.  
4. **Size guide** — no garment SVG; matrix table with left/right scroll + sticky Size column.  
5. **Contact fields** — boxed borders (`1px` + padding) so placeholders don’t sit on an underline.  
6. **Button hover** — copied from homepage hero wipe-up, not the old horizontal brass wipe.

---

## Routes to check

- `/pages/faq`
- `/pages/shipping-delivery`
- `/pages/size-guide`
- `/pages/contact`
- `/policies/privacy-policy`
- `/policies/shipping-policy`
- `/policies/refund-policy`
- `/policies/terms-of-service`

---

## Docs in this repo

This file: `ADOT-atelier-desk-pages-changelog.md`

---

## Quiet rewrite — 10 Oct 2026 (homepage language)

**Goal:** Full visual rewrite of Atelier Desk footer pages to match store tokens / homepage — clean, clutter-free, responsive. No decorative chrome.

### Removed
- № pill label, sew stitch bar, sticky side rail + needle, mobile Contents TOC
- Dashed help-card / WhatsApp-patch outlines
- Brass-named decorative accents (aliases kept only for compat)

### Kept / aligned
- Shared kit: `assets/adot-pages.css` (+ js/ui), hero/help/btn/policy snippets
- FAQ search + chips + accordion; Shipping facts + ledger; Size matrix; Contact WA-first; `/policies/*` intercept
- Tokens from `tokens.css`; breakpoints 750 / 990; button wipe + `scale(0.96)`; word-rise titles
- Title word gap via `.adot-title__w + .adot-title__w { margin-inline-start: 0.28em }`

### Files touched this pass
`assets/adot-pages.css`, `snippets/adot-{hero,help-card,policy-layout,title}.liquid`, `sections/{faq-page,shipping-policy-page,size-guide-page,contact-page,page,main-policy}.liquid`
