---
name: shopify-mens-fashion-visuals
description: Create conversion-focused men’s clothing product, lifestyle, banner, collection, and campaign imagery for Shopify. Use when generating apparel visuals, editing garment photos, building consistent fashion image sets, or implementing editable text overlays through the Shopify Theme Editor.
---

# Shopify Men’s Fashion Visuals

Use this skill for men’s apparel imagery intended for Shopify product pages, collection pages, homepage banners, landing pages, ads, and social campaigns.

## Core rule: separate imagery from editable copy

Do **not** bake promotional copy into the generated image when the merchant needs to edit it in Shopify. Generate the clean visual with intentional text-safe space, then render the heading, body copy, price, CTA, badge, or product title as Shopify theme text settings.

A PNG/JPEG with text painted into the pixels is not editable in Shopify’s Theme Editor. Shopify makes copy editable when it is exposed through a section or block setting such as `text`, `textarea`, `richtext`, or `inline_richtext`. Use a theme `font_picker`, `color_scheme`, and spacing settings when the merchant needs control over the presentation.

Only generate text inside the image for artwork that is intentionally part of the garment or product, such as an authentic printed logo, label, embroidery, or packaging. Preserve that text from a supplied reference and verify it visually.

## Choose the correct image job

Classify the request before prompting:

- **Product listing:** accurate garment, usually 1:1, neutral background, consistent scale, no marketing copy.
- **Product detail gallery:** front, back, side, close-up, fabric, label, fit, and detail views with the same garment identity.
- **Collection tile:** simple composition, consistent crop and background across products, no baked-in copy.
- **Homepage hero/banner:** wide composition with the garment or model on one side and deliberate negative space for editable Shopify text on the other.
- **Lifestyle campaign:** editorial scene with controlled brand palette, realistic garment construction, and a clean area for overlay copy if needed.
- **Social/ad creative:** create a clean visual first; use a separate editable design/layout workflow when exact copy, platform-safe typography, or multiple variants are required.

## Apparel fidelity requirements

When a source garment is supplied, preserve the product as the primary truth. Keep the exact silhouette, construction, seams, collar, cuffs, buttons, zipper, pockets, logo placement, print, color, material, and pattern. Do not invent or redesign a brand mark, garment text, or distinctive hardware.

Keep the same garment identity across a set. Change only the requested model, pose, setting, crop, or lighting. Describe fabric behavior explicitly, such as cotton jersey, heavyweight fleece, denim, twill, linen, wool, or technical nylon. Request realistic folds, tension, drape, stitching, and contact shadows. Avoid melted seams, extra fingers, distorted hands, impossible hems, floating garments, plastic fabric, and generic substitute clothing.

For models, specify age range, body type, skin tone, pose, styling, and expression only when relevant. Use inclusive sizing and show fit clearly when requested.

## Brand system before generation

Establish a small visual system and reuse it across the catalog. Define the primary and secondary colors, background tone, contrast level, accent color, lighting direction, shadow density, camera height, lens feel, crop rules, model styling, accessories, location vocabulary, and level of editorial polish.

Define product scale and margin rules for listing images. Define a text-safe area for banners. Keep the garment away from that area and avoid high-detail backgrounds behind copy.

If the user has not specified a system, choose a restrained menswear direction: neutral warm-gray or off-white studio background for product images; charcoal, stone, navy, olive, or muted earth tones for lifestyle work; soft directional light; natural fabric texture; and editorial but commercially clear styling.

## Prompt template: clean product image

```text
Create a Shopify-ready men’s apparel product image.
Product: [exact garment and color].
Reference fidelity: preserve the supplied garment’s silhouette, construction, fabric, stitching, labels, logo placement, print, and color exactly.
Composition: [front/back/side/detail], centered, full garment visible, consistent scale, balanced margins, [1:1 or requested ratio].
Styling: [flat lay / ghost mannequin / model], [model details if needed].
Lighting: soft controlled studio light, accurate color, natural contact shadow, realistic fabric texture.
Background: clean [white/off-white/brand neutral], distraction-free.
Text: no promotional text, no added logo, no invented labels, no watermark.
Avoid: garment redesign, extra pockets/buttons, distorted anatomy, plastic fabric, harsh cutout edges, clipped hems, clutter, and baked-in copy.
```

## Prompt template: hero/banner with editable Shopify copy

```text
Create a premium men’s fashion Shopify hero image for [brand/product/campaign].
Subject: [exact garment or model wearing the supplied garment].
Reference fidelity: preserve the garment exactly, including color, fit, seams, print, label, and material.
Composition: wide [16:9 or theme ratio]; place the subject on the [left/right] third; reserve clean low-detail negative space on the [opposite side] for editable Shopify text; keep the subject inside mobile-safe framing.
Style: [brand mood], realistic editorial fashion photography, [lighting], [location/background], controlled palette.
Text: no text rendered in the image; leave the text-safe area empty.
Avoid: baked-in headline, price, CTA, fake logos, watermarks, busy detail behind the text area, clipped subject, and important details near crop edges.
```

## Prompt template: consistent lifestyle set

Use one master prompt and change only the shot variable. Keep the same garment identity, model, palette, lighting, lens feel, and styling across all images.

```text
Create shot [number] in a consistent men’s apparel campaign set.
Keep unchanged: the exact supplied garment, model identity, styling, palette, lighting direction, camera treatment, and brand mood.
Shot variable: [front full-body / walking / seated / back view / fabric detail / pocket detail].
Composition: [ratio], clear garment visibility, realistic pose and fabric drape.
Text: no promotional copy or graphic overlays.
Avoid: new garment details, changed color, inconsistent model, fashion-editorial obstruction of the product, and AI artifacts.
```

## Shopify output rules

Use the Shopify target to choose the deliverable. For product and collection images, use a consistent aspect ratio across the catalog. A practical target is 2048 × 2048 px for square product imagery. Keep each image under Shopify’s current pixel and file-size limits.

Prefer JPEG for complex photographic images when transparency is not needed. Use PNG for logos, icons, transparent cutouts, and flat-color graphics. For hero images, generate a wide source with safe space for overlay copy. Do not place critical copy inside the bitmap because responsive themes can crop the image differently on mobile. Add a focal point in Shopify for images that may be cropped responsively.

Convert and compress only after visual review. Preserve sRGB and check both desktop and mobile previews.

## Editable text implementation in Shopify

For a merchant-editable banner, use an Online Store 2.0 section or a theme section that exposes settings like these:

```json
{
  "type": "text",
  "id": "heading",
  "label": "Heading",
  "default": "New season essentials"
},
{
  "type": "textarea",
  "id": "body",
  "label": "Body copy"
},
{
  "type": "text",
  "id": "button_label",
  "label": "Button label",
  "default": "Shop now"
},
{
  "type": "url",
  "id": "button_link",
  "label": "Button link"
},
{
  "type": "font_picker",
  "id": "heading_font",
  "label": "Heading font",
  "default": "helvetica_n4"
},
{
  "type": "color_scheme",
  "id": "color_scheme",
  "label": "Color scheme",
  "default": "scheme-1"
},
{
  "type": "image_picker",
  "id": "image",
  "label": "Image"
}
```

Render the image through `image_picker` and render the copy in Liquid as separate HTML elements. Do not render the copy into the image file. Use the theme’s responsive layout, typography, color scheme, and button settings so the merchant can edit content without regenerating the image.

For product-specific copy, use compatible product metafields or metaobjects and connect them through the dynamic source selector. This is useful for fit notes, material descriptions, campaign labels, and other structured content that changes by product.

If the current theme does not expose the required settings, add a custom Online Store 2.0 section or use a Shopify Partner. Do not promise pixel-perfect editable typography from a single uploaded PNG.

## Validation checklist

Before delivery, confirm that the garment is faithful to the reference and has no obvious anatomy, seam, label, or text defects. Confirm that the image job matches its Shopify placement and aspect ratio. Confirm that product images have no baked-in promotional copy and that banner images have a clear responsive text-safe area.

Confirm that the requested copy is exact when it is rendered by the theme or when garment text is intentionally part of the product. Check that palette, model styling, lighting, crop, and background are consistent across the set. Review desktop and mobile crops. Use an appropriate format and stay within Shopify’s current upload limits.

## Source guidance

Read `references/shopify-sources.md` when you need current Shopify limits, settings, or implementation details. Prefer the official sources listed there over third-party tutorials.
