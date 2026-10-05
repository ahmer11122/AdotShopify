# Prompts for real hanger-rail photos

Use this when the real products are ready. One product needs three pictures: front, side, and back. The side picture is what shoppers see on the rail before they hover. The front is what they see when a piece turns toward them. The back turns on the Front / Back switch in quick look.

Make the whole set in one image tool so the light and the hook stay the same. Attach the real product photo every time. The tool must accept a reference photo.

After the tool answers, you still place the cutout on a transparent 1600 × 2000 canvas. Image tools will not hit the hook position exactly. That placement step is required. Steps are at the bottom.

## Rules for every picture

- Size after placement: **1600 × 2000 px**, PNG, transparent background.
- The brass ring is centred left to right. The **middle of the ring is 80 px from the top** (4%). The theme draws the rod at that height. If the ring is lower or higher, the garment floats off the rod or sinks through it.
- Only the ring shows above the cloth. The wooden bar stays **behind** the collar, hood, or waistband. It must not stick out past the shoulders or the waist. The bottom of the ring touches the top of the cloth.
- Same scale for every product. A tee is shorter than a hoodie. Trousers are the longest. Do not stretch a piece to fill the frame. The longest piece ends near 1700 px.
- At least 6% empty space on the left and the right.
- Soft daylight from the front-left. No floor, no wall, no shadow on the background.
- No person, no mannequin, no hands, no face.
- The side picture is the garment turned 90°, not a squashed front. Hood, collar, sleeve, and hem must still read as that garment.
- File names: `adot-rail-{product-handle}-front.png`, `-side.png`, `-back.png`.
- Keep each file under about 900 KB (Squoosh or TinyPNG). Shopify sends WebP to the browser.

White and cream garments: ask for a **mid-grey background (#9A9A9A)** instead of light grey, then remove it. A white shirt on a cream background leaves a cloudy patch.

## What to attach

For each product:

1. The clearest photo of the real garment (flat lay, hanger, or on a person).
2. The back photo, if you have one.
3. A close-up of any print, logo, or label.
4. From the second product onward, also attach the approved front of the first hero piece, and say “match the hook and the light of this image.”

## Master block

Paste this first, then one of the view blocks.

```text
You are making a product image for a clothing website.
Use the attached photo as the only truth for the garment.

Keep the garment exactly the same: colour, fabric, stitching, collar, cuffs, hem, pockets, zips, buttons, label, logo, and print. Same size, same place, same spelling. Do not redesign it. Do not add anything. Do not remove anything.

The garment hangs from a small brushed-brass ring. The wooden hanger bar is hidden inside the garment, behind the collar, hood, or waistband. Nothing wooden is visible past the shoulders or the waist. The bottom of the ring touches the top of the cloth. The ring is small, the same size in every image.

Look: realistic studio photo, soft even daylight from the front-left, a few small real folds. Clean and calm.

No person, no mannequin, no body, no hands.

Background: plain flat light grey (#E6E6E6). For a white or cream garment, use plain mid grey (#9A9A9A) instead. No floor, no wall, no gradient, no shadow on the background.

Frame: portrait 4:5. The ring is exactly centred left to right. Leave clear space above the ring. The garment is centred, with empty space on the left and the right. Show the real size of the garment. Do not stretch it to fill the frame.

Make one image only.
```

## Front

Attach the real product photo. Paste the master block, then:

```text
View: straight-on front. Camera at chest height. The garment faces the camera. Sleeves hang naturally at the sides.
Match the front of the garment in the attached photo exactly, including where the print or logo sits.

Garment: [colour, fabric, and the exact print or logo if it has one].
```

Check this one until the ring, the light, and the framing are right. That file is the style anchor for the rest of the set.

## Side

Attach two images: the original product photo, and the approved front of this same piece. Paste the master block, then:

```text
Attached image 1 is the original photo of the garment.
Attached image 2 is the approved front of this same garment. Match its hook, light, scale, and top edge.

View: turn the garment exactly 90 degrees so we see its left side. It is a real profile, narrow but still obviously this garment. Show the hood or collar in profile, one sleeve hanging in front of the body, the side seam, and the hem. The brass ring stays on top, touching the cloth, in the same place as image 2.
Do not squash the front view. Do not show the chest of the garment.
```

## Back

Attach the original photo (include a back photo if you have one) and the approved front. Paste the master block, then:

```text
Attached image 1 is the original photo, including the back if it was provided.
Attached image 2 is the approved front. Match its hook, light, scale, and top edge.

View: straight-on back. The garment is turned 180 degrees. Show the back exactly as in the original photo.
If there is no back photo, keep the back plain. Do not invent a print or a logo.
```

## Only photo is someone wearing it

Use this instead of the front prompt. Paste the master block, then:

```text
The attached photo shows a person wearing the garment. Make a product photo of only the garment, hanging from the brass ring. Remove the person completely. Rebuild the parts that were hidden — the inside of the neck, the back of the collar, the underside of the sleeves — so they match the fabric. Keep every visible detail of the garment the same.
View: straight-on front.
```

Then make the side and the back from that approved front.

## Fix one detail

When a logo or a stitch is wrong. Attach the image to fix, and a close-up of the real detail.

```text
Attached image 1 is the image to fix. Attached image 2 is a close-up of the real detail.
Change only the [print on the chest]. Make it match image 2 exactly: same letters, same spelling, same size, same place.
Keep everything else in image 1 unchanged: the ring, the garment shape, the colour, the light, and the framing.
```

## Clean up a real photo

If you shoot the garment yourself, this is the safer path for prints and small logos. Hang it so the wooden bar is hidden behind the cloth and only the brass ring shows. Phone on a tripod, chest height, soft window light. Three shots: front, side, back. Then:

```text
Attached: a real photo of the garment on a hanger.
Clean it for a website. Keep the garment exactly as it is. Do not change the print, colour, shape, or fabric. Only remove the background and make it plain flat light grey (#E6E6E6). For a white or cream garment, use mid grey (#9A9A9A). Soften harsh shadows. Lightly smooth messy wrinkles. Do not redraw the garment.
Keep the framing: the brass ring centred, empty space above the ring, portrait 4:5. The wooden bar must stay hidden behind the cloth.
```

## After the tool answers

Do this for every image, in this order.

1. Remove the background (Photoroom, remove.bg, Photoshop, or Canva). View the cutout on `#F4F2EE` and on `#111`. Rub out any grey or green fringe. White shirts are the ones that keep a cloudy edge. Fix that before you go on.
2. New canvas, **1600 × 2000 px**, transparent.
3. Paste the cutout. Put the **middle of the brass ring at x = 800, y = 80**. The bottom of the ring touches the cloth. No wood past the shoulders.
4. Match scale to the hero piece. The top of every ring is on the same line. A tee ends higher than trousers.
5. Export PNG. Compress under about 900 KB.
6. Name the file `adot-rail-{handle}-front.png`, `-side.png`, or `-back.png`.

## Put them on the rail

Theme editor → homepage → the hanger section → each Piece block:

- **Image** = front
- **Side image** = side (this is the picture at rest)
- **Back image** = back (this shows the Front / Back switch)

If you set a front and leave the side empty, that piece turns into a thin card again when it is not hovered. The category stand-ins are only used while both the image and the product photo are empty.

## Check before you publish

- Zoom to 200% on any logo. Same letters, same spelling, same place as the real garment.
- Colour matches the garment in your hand.
- No extra pocket, button, seam, or tag. Nothing missing.
- The ring is centred, and its middle is about 80 px from the top. Allow about 24 px.
- The wooden bar does not stick out past the cloth.
- The side picture reads as that garment from the side, and it is not a squashed front.
- The back has no invented print.
- Edges are clean on the cream page background and on black.
- A tee looks shorter than a hoodie. Trousers look longer than both.
