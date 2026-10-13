# Hanger rail hook gap — review brief

Paste this whole file to another model. The job is to recommend the best way to hang the garments on the ADOT homepage rail. Do not invent a new rail. The theme already has one. The pictures and the theme must agree.

Store: `adotoffical.com` (password store). Live theme: **AdotShopify** `#188673753266`. Homepage section: `interactive_gallery` in `templates/index.json`.

## What we want

Five hoodies hang on one rail. Desktop shows the **side** photo at rest. Hover turns a piece to the **front**. Quick look can show **front** and **back**.

The hook should look like it holds the garment. It must not:

- float in a large empty gap above the hood
- sit painted on the outside of the cloth
- jump up or down when the piece turns from side to front to back

The same hook point has to work later for shirts and trousers. Do not special-case hoodies in CSS in a way that would hang a shirt or a trouser from a different place.

## What the shopper actually sees

The rail draws a grey horizontal rod in CSS. The gold ring and the short neck are **inside the PNG**, not drawn by CSS.

Two failures showed up, and they are not the same bug:

1. **Side view, big gap.** On the resting rail every hoodie is a side profile. The gold hook stops, then there is empty background, then the hood. The front view of the same file looks closer, because the hood opening rises under the hook. The side hood slopes, so the centre of the picture (where the hook is) is empty for longer.
2. **Hook painted on the cloth.** Making the neck longer so it “goes inside” drew brass on top of the hoodie. In quick look the ring sat on the outside of the back hood. It looked stuck on the picture, not like a hanger. That version was rejected and replaced.

Latest pictures on the live files (uploaded after those screenshots): ring centre still at 4%, cloth top at 160 px, neck stops **before** the cloth. Small air gap. Not yet signed off.

## Why the side gap is structural

Canvas is 1600 × 2000. Hook centre is x = 800.

Measured on the jet-black side PNG before the bad “paint over the cloth” pass:

| y (px) | What is at the centre (x = 800) | What is beside the centre |
| --- | --- | --- |
| 80 | Ring centre | Empty |
| 116 | Thin brass neck only | Empty |
| 124 | Neck only | Hood edge starts off to the side (~50 px of cloth) |
| 180 | Cloth finally reaches the centre | Hood is already wide |

On the **front** of the same garment, cloth fills the centre at about y = 124. So one shared “collar at 200 px” or “collar at 160 px” still leaves a wedge on the side, because the side hood’s peak is not under the hook.

Lengthening the neck until it hits centre-cloth closes the hole by drawing metal across the slope. That is what looked “outside” / “on top of the image”.

Moving only the side PNG up, and not the front and back, makes the piece jump when it turns. Do not do that.

## Image contract the theme already assumes

From `ADOT-hanger-rail-image-prompts.md` and `assets/hanger-rail.css`:

- PNG, transparent, **1600 × 2000**.
- Ring centred. **Middle of the ring is 80 px from the top (4%).**
- CSS rod and swing origin are that same 4%: `--hr-hook: calc(var(--hr-h) * 0.04)` and `.hrail__swing { transform-origin: 50% 4%; }`.
- Spec also says the collar / hood / waistband starts at about **200 px (10%)**, so there is a neck of air. Longest piece ends near **1800 px (90%)**. Do not stretch a short shirt to fill the frame. Trousers are the longest. Trousers have **no side photo**. The rail turns the trouser front itself.
- At least 6% empty on the left and right.
- File names: `adot-rail-{handle}-front.png`, `-side.png`, `-back.png`.
- Quick look thread is aimed at 4% of the image height: `bottom: calc(100% - var(--ql-h) * 0.04)`.

If the ring moves off 4%, the rod, the swing, and the quick-look thread no longer meet the hook. That breaks shirts and trousers as well as hoodies.

Images use `object-fit: contain` and `object-position: 50% 0`. They are not cropped. A gap in the PNG is a gap on the site.

## What is on the rail now

`templates/index.json` → section `interactive_gallery`.

Five pieces only. `show_photos` is false, so quick look does not add the worn model photos. `label_pull` is 0.

| Piece | Product handle |
| --- | --- |
| Jet Black | `heavyweight-pullover-hoodie-jet-black` |
| Navy Blue | `heavyweight-pullover-hoodie-navy-blue` |
| Off-White | `heavyweight-pullover-hoodie-off-white-cream` |
| Bottle Green | `heavyweight-pullover-hoodie-bottle-green` |
| Heather Grey | `heavyweight-pullover-hoodie-heather-grey` |

Each block sets `image`, `image_side`, `image_back` to `shopify://shop_images/adot-rail-{handle}-{view}.png`.

Local masters (not in git; `manus/` stays untracked):

`manus/hoodie_campaign_package_v2/05_hanger_rail/`

Source product photos and generated side profiles used to build them:

- Front and back: `manus/hoodie_campaign_package_v2/01_product_images_and_prompts/{color}_hoodie_product_{front,back}.jpg`
- Side profiles: were generated, then cut out. The colour key is `black`, `navy_blue`, `cream`, `green`, `gray`.

Pictures are Shopify Files, replaced in place. The theme JSON does not change when a file is replaced. A refresh loads the new `?v=`.

## What we tried, and what it caused

| Try | What we did | What it caused |
| --- | --- | --- |
| 1. Spec placement | Ring at y = 80, cloth top at y = 200, short neck, garment scaled so the hem is near y = 1800. | Correct for the theme’s 4% hook. Side view looked like a large gap. Front looked closer. User asked to close the gap a little. |
| 2. Move all cloth up | Shifted the garment so the first wide row sat near y = 120. Ring stayed at 4%. | Gap got smaller. Side still showed a wedge, because the side hood does not meet the centre until lower than the front hood. |
| 3. Bigger hook drawn into the cloth | Ring radius 26. Neck width 12–14. Neck extended until it overlapped the centre cloth by ~20 px. Side PNGs were also shifted up on their own. | Rejected. The hook sat **on** the hoodie. Quick look back view looked like the ring was outside, stuck on top of the hood. A later cleanup pass also left a white nick and a stray crescent where old brass pixels were not fully removed. Do not paint the hook over the garment. |
| 4. Current rebuild | Cut the garments out again. Ring radius 16, centre y = 80. Cloth top y = 160. Neck stops about 6 px **above** the cloth. Same placement on front, side, and back. Uploaded over the same Shopify filenames. | Hook is in the air. Garment starts a little under the rail. No brass on the fabric. Side slope can still show a slightly larger visual gap than the front. Not signed off. |

## Code the reviewer needs

Rod and hook point, `assets/hanger-rail.css`:

```css
.hrail {
  --hr-h: clamp(300px, 47svh, var(--hr-h-max, 480px));
  --hr-hook: calc(var(--hr-h) * 0.04); /* hook loop centre = 4% down the image */
}
.hrail__swing {
  transform-origin: 50% 4%;
}
.hrail__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: 50% 0;
}
.hrail__rod {
  top: calc(var(--hr-hook) - 3px);
  height: 6px;
}
```

Quick look thread, same file:

```css
.hrail-ql__thread {
  left: 50%;
  bottom: calc(100% - var(--ql-h) * 0.04);
  width: 1px;
  height: 100vh;
}
```

Quick look only treats front and back as hanger faces. A third “side” thumb is not a face. `assets/hanger-rail-ql-setup.js` builds views as front, then back, then optional product photos. `assets/hanger-rail-ql-ui.js` `setView` spins 180° for back and does not have a side stop. The side image is the resting face of the 3D turn (`hasSide`), not a separate hung position.

Product photos were removed from this rail on purpose (`show_photos: false` in `templates/index.json`, schema default false in `sections/interactive-gallery.liquid`). Do not turn them back on. The quick look should stay on the hanger PNGs.

Placement that produced the current files (`/tmp/adot-rail-build.py`, not in the repo):

- Canvas 1600 × 2000.
- `RING_CX, RING_CY, RING_R = 800, 80, 16`
- `COLLAR_Y = 160` (cloth top)
- Neck line ends at `COLLAR_Y - 6`. A second draw of the hook is cropped to `y < COLLAR_Y` so it cannot paint on the garment.
- Garment is scaled to run from y = 160 toward y = 1800, then capped at 88% of the width.
- Background removal is `rembg` with the `u2net` session. The image model does not place the ring at 4%. Placement is done after the cutout.

## Constraints

- Do not move the ring off 4% / 80 px. The rod, the swing, and the quick-look thread are hardcoded to that.
- Front, side, and back of one product must share one cloth-top, or the piece jumps on turn.
- Do not draw the hook across the cloth. That read as “outside” and was rejected.
- A side profile will always have a slope. A single centre neck cannot touch the peak and the dip at once without crossing the fabric.
- Shirts need front, side, and back. Trousers need front and back only, no side file. A tee is shorter than a hoodie. Do not stretch it.
- Keep PNG transparency. The page background is about `#F4F2EE`.
- Prefer a theme-safe rule over a hoodie-only pixel nudge.

## Ask for a recommendation

Pick one approach and say exactly what to change (PNG numbers, or CSS, or both). Explain what happens to a future shirt and a future trouser. Call out anything that would make the turn jump or pull the rod off the ring.

Options already considered, so do not repeat them as if they are new unless you can show they avoid the failures above:

- More empty space (spec’s 200 px). Looks hung, side gap feels large.
- Less empty space for every view together (current 160 px). Smaller gap, still a side wedge.
- Longer neck painted into the cloth. Rejected. Looks stuck on the outside.
- Lifting only the side PNG. Makes the turn jump.
- Changing `--hr-hook` or the 4% origins without rebuilding every picture. Breaks the contract for shirts and trousers.

## Files to open

- `assets/hanger-rail.css` — rod, swing, image fit, quick-look thread
- `assets/hanger-rail-ql-setup.js` — which pictures quick look shows
- `assets/hanger-rail-ql-ui.js` — front/back spin
- `sections/interactive-gallery.liquid` — block settings, `show_photos`
- `templates/index.json` — the five hoodie blocks
- `ADOT-hanger-rail-image-prompts.md` — the 1600×2000 / 4% / 10% contract
