#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import time

import os
from pathlib import Path

# Load .env file if present
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

STORE = os.environ.get("SHOPIFY_STORE_DOMAIN", "1wa9f5-nc.myshopify.com")
CLIENT_ID = os.environ.get("SHOPIFY_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("SHOPIFY_CLIENT_SECRET", "")

def get_access_token():
    url = f"https://{STORE}/admin/oauth/access_token"
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        return res["access_token"]

def make_request(token, endpoint, method="GET", data=None):
    url = f"https://{STORE}/admin/api/2024-01/{endpoint}"
    req = urllib.request.Request(
        url,
        headers={"X-Shopify-Access-Token": token, "Content-Type": "application/json"},
        method=method
    )
    if data:
        req.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"HTTP Error {e.code} on {endpoint}: {error_body}")
        raise e

# Descriptions and Size Guides
HOODIE_DESC = """<p>Upgrade your winter wardrobe with the <strong>ADOT Heavyweight Pullover Hoodie</strong>. Engineered from an ultra-soft, thermal 350 GSM 3-end fleece blend, this hoodie delivers structured drape, exceptional warmth, and an effortless contemporary silhouette.</p>

<h4>Key Features</h4>
<ul>
  <li><strong>Fabric Weight:</strong> Premium 350 GSM Heavyweight Fleece (Cotton-Rich Blend)</li>
  <li><strong>Construction:</strong> Double-layered drawstring hood, kangaroo front pocket, and heavy-duty ribbed cuffs & hem</li>
  <li><strong>Fit:</strong> Tailored regular/relaxed fit designed for layering</li>
  <li><strong>Colorfast Guarantee:</strong> High-grade reactive dye to prevent fading</li>
  <li><strong>Payment:</strong> Cash on Delivery (COD) Available Across Pakistan</li>
</ul>

<h4>Composition & Care</h4>
<ul>
  <li>80% Combed Cotton / 20% Polyester (3-End Fleece)</li>
  <li>Machine wash cold on gentle cycle (Max 30°C)</li>
  <li>Wash inside out with similar colors</li>
  <li>Low heat iron inside out (do not iron over direct print/embroidery)</li>
  <li>Do not bleach, tumble dry, or dry clean</li>
</ul>

<h4>Size Guide (Inches)</h4>
<table style="width: 100%; border-collapse: collapse; text-align: left; margin-top: 10px;">
  <thead>
    <tr style="border-bottom: 2px solid #ddd; background-color: #f8f8f8;">
      <th style="padding: 8px;">Size</th>
      <th style="padding: 8px;">Chest (Width)</th>
      <th style="padding: 8px;">Length</th>
      <th style="padding: 8px;">Shoulder</th>
      <th style="padding: 8px;">Sleeve</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>S</strong></td><td style="padding: 8px;">20"</td><td style="padding: 8px;">26"</td><td style="padding: 8px;">17.5"</td><td style="padding: 8px;">24"</td></tr>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>M</strong></td><td style="padding: 8px;">21"</td><td style="padding: 8px;">27"</td><td style="padding: 8px;">18.5"</td><td style="padding: 8px;">24.5"</td></tr>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>L</strong></td><td style="padding: 8px;">22"</td><td style="padding: 8px;">28"</td><td style="padding: 8px;">19.5"</td><td style="padding: 8px;">25"</td></tr>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>XL</strong></td><td style="padding: 8px;">23"</td><td style="padding: 8px;">29"</td><td style="padding: 8px;">20.5"</td><td style="padding: 8px;">25.5"</td></tr>
    <tr><td style="padding: 8px;"><strong>XXL</strong></td><td style="padding: 8px;">24"-25"</td><td style="padding: 8px;">30"</td><td style="padding: 8px;">21.5"</td><td style="padding: 8px;">26"</td></tr>
  </tbody>
</table>"""

SWEATSHIRT_DESC = """<p>The <strong>ADOT Classic Crewneck Sweatshirt</strong> combines everyday versatility with premium comfort. Crafted from a refined 280 GSM 3-end cotton-poly fleece, it offers a smooth exterior finish with a brushed, plush interior for year-round warmth.</p>

<h4>Key Features</h4>
<ul>
  <li><strong>Fabric Weight:</strong> 280 GSM Mid-weight 3-End Fleece</li>
  <li><strong>Construction:</strong> Reinforced crew neckline, twin-needle stitching, and shape-retaining ribbed trims</li>
  <li><strong>Fit:</strong> Standard regular fit with clean shoulder lines</li>
  <li><strong>Feel:</strong> Breathable, pill-resistant, and super soft on the skin</li>
  <li><strong>Payment:</strong> Cash on Delivery (COD) Available Across Pakistan</li>
</ul>

<h4>Composition & Care</h4>
<ul>
  <li>Cotton / Polyester 3-End Fleece Blend</li>
  <li>Machine wash cold at 30°C inside out with like colors</li>
  <li>Do not bleach or tumble dry</li>
  <li>Iron on low setting inside out</li>
</ul>

<h4>Size Guide (Inches)</h4>
<table style="width: 100%; border-collapse: collapse; text-align: left; margin-top: 10px;">
  <thead>
    <tr style="border-bottom: 2px solid #ddd; background-color: #f8f8f8;">
      <th style="padding: 8px;">Size</th>
      <th style="padding: 8px;">Chest (Width)</th>
      <th style="padding: 8px;">Length</th>
      <th style="padding: 8px;">Shoulder</th>
      <th style="padding: 8px;">Sleeve</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>S</strong></td><td style="padding: 8px;">19.5"</td><td style="padding: 8px;">25.5"</td><td style="padding: 8px;">17"</td><td style="padding: 8px;">23.5"</td></tr>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>M</strong></td><td style="padding: 8px;">20.5"</td><td style="padding: 8px;">26.5"</td><td style="padding: 8px;">18"</td><td style="padding: 8px;">24"</td></tr>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>L</strong></td><td style="padding: 8px;">21.5"</td><td style="padding: 8px;">27.5"</td><td style="padding: 8px;">19"</td><td style="padding: 8px;">24.5"</td></tr>
    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;"><strong>XL</strong></td><td style="padding: 8px;">22.5"</td><td style="padding: 8px;">28.5"</td><td style="padding: 8px;">20"</td><td style="padding: 8px;">25"</td></tr>
    <tr><td style="padding: 8px;"><strong>XXL</strong></td><td style="padding: 8px;">23.5"-24"</td><td style="padding: 8px;">29.5"</td><td style="padding: 8px;">21"</td><td style="padding: 8px;">25.5"</td></tr>
  </tbody>
</table>"""

PRODUCTS_DATA = [
    # 5 Hoodies
    {
        "title": "Heavyweight Pullover Hoodie - Jet Black",
        "product_type": "Hoodies",
        "tags": "Hoodies, Heavyweight, 350 GSM, Black, Winter Drop, Fleece, Cash on Delivery",
        "body_html": HOODIE_DESC,
        "price": "3200.00",
        "compare_at": "3770.00",
        "sku_prefix": "ADOT-HD-BLK",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    },
    {
        "title": "Heavyweight Pullover Hoodie - Navy Blue",
        "product_type": "Hoodies",
        "tags": "Hoodies, Heavyweight, 350 GSM, Navy Blue, Winter Drop, Fleece, Cash on Delivery",
        "body_html": HOODIE_DESC,
        "price": "3200.00",
        "compare_at": "3770.00",
        "sku_prefix": "ADOT-HD-NVY",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    },
    {
        "title": "Heavyweight Pullover Hoodie - Off-White / Cream",
        "product_type": "Hoodies",
        "tags": "Hoodies, Heavyweight, 350 GSM, Off-White, Cream, Winter Drop, Fleece, Cash on Delivery",
        "body_html": HOODIE_DESC,
        "price": "3200.00",
        "compare_at": "3770.00",
        "sku_prefix": "ADOT-HD-OFW",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    },
    {
        "title": "Heavyweight Pullover Hoodie - Bottle Green",
        "product_type": "Hoodies",
        "tags": "Hoodies, Heavyweight, 350 GSM, Bottle Green, Forest Green, Winter Drop, Fleece, Cash on Delivery",
        "body_html": HOODIE_DESC,
        "price": "3200.00",
        "compare_at": "3770.00",
        "sku_prefix": "ADOT-HD-BGN",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    },
    {
        "title": "Heavyweight Pullover Hoodie - Heather Grey",
        "product_type": "Hoodies",
        "tags": "Hoodies, Heavyweight, 350 GSM, Heather Grey, Grey, Winter Drop, Fleece, Cash on Delivery",
        "body_html": HOODIE_DESC,
        "price": "3200.00",
        "compare_at": "3770.00",
        "sku_prefix": "ADOT-HD-GRY",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    },
    # 3 Sweatshirts
    {
        "title": "Classic Fleece Sweatshirt - Jet Black",
        "product_type": "Sweatshirts",
        "tags": "Sweatshirts, Shirts, 280 GSM, Black, Winter Drop, Fleece, Cash on Delivery",
        "body_html": SWEATSHIRT_DESC,
        "price": "3000.00",
        "compare_at": "3530.00",
        "sku_prefix": "ADOT-SW-BLK",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    },
    {
        "title": "Classic Fleece Sweatshirt - Crisp White",
        "product_type": "Sweatshirts",
        "tags": "Sweatshirts, Shirts, 280 GSM, White, Winter Drop, Fleece, Cash on Delivery",
        "body_html": SWEATSHIRT_DESC,
        "price": "3000.00",
        "compare_at": "3530.00",
        "sku_prefix": "ADOT-SW-WHT",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    },
    {
        "title": "Classic Fleece Sweatshirt - Wine Red",
        "product_type": "Sweatshirts",
        "tags": "Sweatshirts, Shirts, 280 GSM, Wine Red, Burgundy, Winter Drop, Fleece, Cash on Delivery",
        "body_html": SWEATSHIRT_DESC,
        "price": "3000.00",
        "compare_at": "3530.00",
        "sku_prefix": "ADOT-SW-WNR",
        "quantities": {"M": 2, "L": 8, "XL": 8, "XXL": 2}
    }
]

def main():
    print("🔑 Authenticating with Shopify...")
    token = get_access_token()
    print("✅ Authenticated successfully!")

    # Fetch existing products to avoid duplicate creation
    existing_resp = make_request(token, "products.json?limit=50")
    existing_by_title = {p["title"]: p for p in existing_resp.get("products", [])}
    print(f"📦 Found {len(existing_by_title)} existing products on store.")

    total_created = 0
    total_updated = 0
    total_units = 0

    for item in PRODUCTS_DATA:
        variants = []
        for size, qty in item["quantities"].items():
            total_units += qty
            variants.append({
                "option1": size,
                "price": item["price"],
                "compare_at_price": item["compare_at"],
                "sku": f"{item['sku_prefix']}-{size}",
                "inventory_management": "shopify",
                "inventory_quantity": qty
            })

        payload = {
            "product": {
                "title": item["title"],
                "body_html": item["body_html"],
                "vendor": "ADOT",
                "product_type": item["product_type"],
                "tags": item["tags"],
                "status": "active",
                "options": [{"name": "Size"}],
                "variants": variants
            }
        }

        if item["title"] in existing_by_title:
            p_id = existing_by_title[item["title"]]["id"]
            print(f"🔄 Updating existing product: '{item['title']}' (ID: {p_id})...")
            # Update product details
            update_payload = {
                "product": {
                    "id": p_id,
                    "body_html": item["body_html"],
                    "tags": item["tags"],
                    "status": "active"
                }
            }
            make_request(token, f"products/{p_id}.json", method="PUT", data=update_payload)
            total_updated += 1
        else:
            print(f"✨ Creating product: '{item['title']}'...")
            res = make_request(token, "products.json", method="POST", data=payload)
            new_id = res["product"]["id"]
            print(f"   -> Created with ID: {new_id} ({len(variants)} variants)")
            total_created += 1

        time.sleep(0.5) # rate limit politeness

    print("\n" + "="*50)
    print(f"🎉 Complete! Created: {total_created}, Updated: {total_updated}")
    print(f"📊 Total Inventory Units Tracked: {total_units} pieces across 8 products.")
    print("="*50)

if __name__ == "__main__":
    main()
