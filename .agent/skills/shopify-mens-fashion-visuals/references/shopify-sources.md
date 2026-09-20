# Shopify sources

Use these official sources when validating the skill’s implementation details. Limits and theme behavior can change, so recheck them before a production build.

## Theme editor and editable text

- [Shopify Help Center: Sections and blocks](https://help.shopify.com/en/manual/online-store/themes/theme-structure/sections-and-blocks) — sections and blocks can contain text, images, buttons, links, and customizable settings. Compatible themes can connect settings to dynamic sources such as metafields and metaobjects.
- [Shopify Developers: Input settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings) — documents `text`, `textarea`, `richtext`, `inline_richtext`, `font_picker`, `image_picker`, color settings, and other Theme Editor inputs.
- [Shopify Developers: Fonts](https://shopify.dev/docs/storefronts/themes/architecture/settings/fonts) — Shopify font-library and theme font configuration reference.

## Media requirements

- [Shopify Help Center: Product media types](https://help.shopify.com/en/manual/products/product-media/product-media-types) — product image formats, dimensions, file-size limits, video and 3D support, and metafield file references.
- [Shopify Help Center: Theme images](https://help.shopify.com/en/manual/online-store/images/theme-images) — supported formats, JPEG versus PNG guidance, compression and format selection, focal points, color profiles, and responsive banner guidance.

## Apparel photography and AI workflow

- [Shopify: Clothing Photography](https://www.shopify.com/ae/blog/clothing-photography) — flat lay, model/mannequin, and lifestyle approaches; shot lists; garment preparation; lighting and setup practices.
- [Shopify: AI Product Photography](https://www.shopify.com/blog/ai-product-photography) — start with a clear product reference, write detailed prompts, generate options, refine defects, and optimize outputs for channels.

## Findings to preserve

- Shopify themes expose editable content through sections and blocks; a text layer baked into a PNG or JPEG is not a Theme Editor text setting.
- `font_picker` lets a theme expose a merchant-editable font selection from Shopify’s font library. This is separate from a font baked into an image.
- `image_picker` lets a merchant choose or upload a theme image and can support focal points when rendered correctly by the theme.
- Shopify recommends consistent aspect ratios for product imagery. Official product-media guidance states product and collection images can be up to 5000 × 5000 px or 25 megapixels and under 20 MB; confirm current limits before upload because Shopify documentation can change.
- Shopify’s theme-image guidance recommends JPEG for photography and PNG for graphics, text, icons, and transparency. For responsive banners, keep text out of the image and use the Theme Editor overlay instead.
- Shopify’s apparel guidance supports a mix of flat lay, model/mannequin, and lifestyle images. A complete shot list and consistent visual treatment improve product clarity.
- Shopify’s AI photography guidance recommends using the actual product as a reference, writing specific prompts, generating multiple options, inspecting defects, and optimizing the final images.
