# Shopify Admin API scopes for the AdotShopify env app

**Where:** Shopify Admin → **Settings → Apps and sales channels → Develop apps** → your custom app (the one whose Client ID/Secret are in `.env`) → **Configuration → Admin API integration** → **Edit**.

After changing scopes: **Save** → click **Install app** / **Reinstall** so Shopify issues a new access token. Then tell the agent the scopes are live.

---

## Status (Oct 2026)

| Scope | Status |
|---|---|
| `write_legal_policies` | ✅ Enabled — Shipping / Refund / Terms published |
| `read_legal_policies` | ✅ Enabled |
| `write_privacy_settings` | ✅ Enabled — Privacy auto feature disabled + pack published |
| `read_privacy_settings` | ✅ Enabled |

Privacy published via `privacyFeaturesDisable(PRIVACY_POLICY)` then `shopPolicyUpdate`. Source: `launch-copy/privacy-policy.html`.

---

## Already granted (keep)

`write_products` · `write_content` · `write_shipping` · `write_files` · `write_inventory` · `write_inventory_shipments` · `read_locations` · `write_online_store_navigation` · `write_discounts` · `write_price_rules`

---

## Optional later (not required for launch copy)

| Scope | Why you might add it |
|---|---|
| `read_orders` / `write_orders` | Test-order debugging, COD confirmation tooling |
| `read_customers` / `write_customers` | Customer support scripts |
| `read_themes` / `write_themes` | Push themes without Shopify CLI (CLI already works) |
| `read_analytics` | Pull traffic stats into reports |
| Payment / Shopify Payments scopes | **Usually not available** to custom Admin apps for enabling COD — turn on COD in **Settings → Payments** by hand |

**COD cannot be enabled via our Admin app API** in normal custom-app setups. Keep doing that in the Admin UI.

---

## After you enable `write_legal_policies`

Reply: `legal policies scope enabled`  
The agent will publish the three HTML files from `launch-copy/` to Settings → Policies.
