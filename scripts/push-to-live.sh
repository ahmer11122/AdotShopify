#!/usr/bin/env bash
set -e

STORE="1wa9f5-nc.myshopify.com"
LIVE_THEME_ID="188673753266"

echo "========================================================"
echo "Pushing latest changes to Shopify Live Theme (AdotShopify)"
echo "Store:    $STORE"
echo "Theme ID: $LIVE_THEME_ID"
echo "========================================================"

shopify theme push --store "$STORE" --theme "$LIVE_THEME_ID" --allow-live --nodelete
