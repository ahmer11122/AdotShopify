# Shopify Local Development, Remote Push & Preview Guide

This guide contains everything you need to preview, edit, push, and test your theme locally and on remote Shopify stores.

---

## 1. Active Store & Theme Details

* **Current Store:** `1wa9f5-nc.myshopify.com`
* **Development Theme ID:** `188676800690`
* **Direct Storefront Preview Link:** [https://1wa9f5-nc.myshopify.com?preview_theme_id=188676800690](https://1wa9f5-nc.myshopify.com?preview_theme_id=188676800690)
* **Shopify Theme Customizer / Visual Editor:** [https://1wa9f5-nc.myshopify.com/admin/themes/188676800690/editor](https://1wa9f5-nc.myshopify.com/admin/themes/188676800690/editor)

---

## 2. How to Push Theme Changes to Remote Preview

### Push All Modified Files
To deploy all changes directly to the active development theme without deleting remote assets:
```bash
shopify theme push --theme 188676800690 --nodelete
```

### Push Specific Files Only (Fastest)
To push only specific assets or snippets (e.g. THREADLINE motion system):
```bash
shopify theme push --theme 188676800690 --nodelete --only assets/threadline.css assets/threadline.js snippets/product-card.liquid snippets/product-sticky-bar.liquid
```

### Push to Git & Remote
```bash
git add .
git commit -m "feat(motion): update THREADLINE 3.1 Sartorial Hybrid motion system"
git push origin main
```

---

## 3. Local Development Server (Live Hot-Reloading)

To run the local development server on your machine:
```bash
SHOPIFY_CLI_NO_AUTO_UPDATE=1 shopify theme dev --theme 188676800690
```

### Terminal Hotkeys (While `shopify theme dev` is Running):
* `t` — Opens local preview in browser (`http://127.0.0.1:9292`).
* `p` — Opens shareable remote preview link for mobile devices.
* `e` — Opens the visual Shopify Theme Editor.
* `Ctrl + C` — Stops the local dev server.

---

## 4. THREADLINE 3.1 — "The Sartorial Hybrid" Motion System

The store includes the bespoke **THREADLINE 3.1** Add to Bag motion engine for luxury menswear:

```
 1. LIFT & CONDENSE          2. 3D SUITING FOLD            3. CONTINUOUS THREAD FLIGHT       4. VECTOR IMPACT & FINISH
 ┌─────────────────┐        ┌────────┐  Fold I (rotateX)   ┌────────┐                      ┌─────────┐
 │ Product Photo / │ ──▶    │ Upper  │ ───────────────▶    │ Woven  │ ═══ Brass Thread ══▶ │ Bag Hit │ (hx,hy)
 │ Button Socket   │        │ Lower  │  Fold II (rotateY)  │ Label  │                      │ & Drawer│ / Receipt
 └─────────────────┘        └────────┘                     └────────┘                      └─────────┘
                            Reveals Oxblood Lining        Hot-Stamped Brass Logo           Knot + Ring + Odometer
```

### Key Highlights in THREADLINE 3.1:
1. **Hot-Stamped Maker's Mark:** Replaces generic white badges with a hot-stamped brass foil brand logo (`mask-image`) on **oxblood silk cupro lining** with tailored pinstripes (`#4A1523`).
2. **Compact Ivory Size Tab:** Crisp, readable contrast size tab (`.tl-tag-size`) with subtle depth shadow.
3. **Hairline Brass Embroidery:** Solid hairline border (`rgba(201, 168, 106, 0.32)`) replacing dashed lines for a refined, bespoke finish.
4. **Origin Resolution (`resolveOrigin`):** If the hero image is in the viewport (`coverage >= 35%`), the flyer condenses directly from the garment photograph; otherwise, it seamlessly ascends from the button.
5. **Continuous SVG Brass Thread:** Unspools along a quadratic Bézier curve, pulling the folded bundle into the bag target.
6. **Vector-Aware Bag Impact (`bagCatch`):** Compresses and springs home along the exact collision trajectory vector `(hx, hy)`.
7. **Dual-Finish Context Routing:**
   - **PDP Full Add:** Opens the cart drawer with a brass thread sweep across the added item.
   - **Collection Quick-Add:** Displays a floating receipt card with a shortening thread countdown timer.

---

## 5. Troubleshooting & Useful Tips

* **Free Up Port 9292:** If port 9292 is already occupied:
  ```bash
  fuser -k 9292/tcp
  ```
* **Verify JavaScript Syntax:**
  ```bash
  node -c assets/threadline.js
  ```
* **Run Shopify Theme Validator:**
  ```bash
  shopify theme check
  ```
