# Shopify Local Development & Preview Guide

This guide contains everything you need to start, preview, and edit your theme locally.

---

## 1. Quick Start Command

Run this command in the project root (`/home/ahmer/Desktop/AdotShopify`):

```bash
SHOPIFY_CLI_NO_AUTO_UPDATE=1 shopify theme dev --store adot-5v045cze.myshopify.com --store-password euyeor
```

> **Note:** If prompted for a one-time authentication code in your browser, approve it to link your session.

---

## 2. Preview & Admin Links

Once the command is running, you can access your store through these URLs:

| Environment | URL | Purpose |
| :--- | :--- | :--- |
| **Local Preview** | [http://127.0.0.1:9292](http://127.0.0.1:9292) | Hot-reloading local development server |
| **Remote Share Link** | [https://adot-5v045cze.myshopify.com/?preview_theme_id=166763954411](https://adot-5v045cze.myshopify.com/?preview_theme_id=166763954411) | Shareable link to view on phones or other devices |
| **Theme Customizer** | [Theme Editor](https://adot-5v045cze.myshopify.com/admin/themes/166763954411/editor?hr=9292) | Visual editor for changing settings, menus, and sections |

---

## 3. Store Credentials & Details

* **Store Handle:** `adot-5v045cze.myshopify.com`
* **Storefront Password:** `euyeor`
* **Development Theme ID:** `166763954411`

---

## 4. Terminal Hotkeys (While Dev Server is Running)

Press these keys directly in the terminal running `shopify theme dev`:

* `t` — Opens your **local preview** in default browser (`127.0.0.1:9292`).
* `p` — Opens the **remote shareable preview** link.
* `e` — Opens the **Shopify visual theme editor**.
* `g` — Opens gift card preview.
* `Ctrl + C` — Stops the dev server.

---

## 5. Helpful Commands & Troubleshooting

### Check Theme for Errors (Linter)
Before committing or publishing changes:
```bash
shopify theme check
```

### If Port 9292 is Already in Use
Specify an alternate port:
```bash
SHOPIFY_CLI_NO_AUTO_UPDATE=1 shopify theme dev --store adot-5v045cze.myshopify.com --store-password euyeor --port 9293
```
Or find and stop the existing process:
```bash
fuser -k 9292/tcp
```
