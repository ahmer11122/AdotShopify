# Prompts for real hanger-rail photos (v2)

Use this when the real products are ready. Where this file and the older notes differ, this version wins.

One product needs a front and a back. Tops and shirts also need a side. **Trousers do not get a side photo.** The rail turns the trouser front itself, so it hangs as a thin sliver.

The side photo is what shoppers see on the desktop rail before they hover. The front is what they see when a piece turns toward them. The back turns on a back view in quick look.

Make the whole set in one image tool so the light and the hook stay the same. Attach the real product photo every time.

After the tool answers, place the cutout on a transparent canvas. Image tools will not hit the hook position exactly. That step is required.

## Rules for every picture

- Size after placement: **1600 × 2000 px**, PNG, transparent background.
- The brass ring is centred left to right. The **middle of the ring is 80 px from the top** (4%). The theme draws the rod and the swing point there.
- Above the collar, only a short slim brass neck and a small round ring show. The wooden bar stays hidden inside the garment. It must not stick out past the shoulders or the waist.
- The top of the collar, hood, or waistband is about **200 px from the top** (10%). That neck of space is what makes the piece look hung, not pinned to the rod.
- The longest piece fills about **90%** of the height (about 1800 px). Do not stretch a short piece to fill the frame. A tee is shorter than a hoodie. Trousers are the longest.
- At least 6% empty space on the left and the right.
- Soft daylight from the front-left. No floor, no wall, no shadow on the background.
- No person, no mannequin, no hands, no face.
- A side photo is the garment turned exactly 90°, not a squashed front. The ring sits above the middle of the shoulder seam.
- File names: `adot-rail-{product-handle}-front.png`, `-side.png`, `-back.png`.
- Keep each uploaded file under about 900 KB. Shopify already sends 900 px to the rail and 1400 px to the quick look.

White and cream garments: ask for a **mid-grey background (#9A9A9A)** instead of light grey, then remove it. A white shirt on a cream background leaves a cloudy patch.

## Master block

Paste this first, then one view block.

```text
You are making a product image for a clothing website.
Use the attached photo(s) as the ONLY truth for the garment.

Keep the garment exactly the same: colour, fabric look, stitching, collar,
cuffs, hem, pockets, zips, buttons, label, logo and print (same size, same
place, same spelling). Do not redesign it. Do not add anything. Do not
remove anything.

The garment hangs from a slim brass hook. The wooden hanger is hidden
inside the garment. Above the collar we see only a short slim brass neck
and a small round hook ring.

Look: realistic studio photo, soft even daylight from the front-left,
gentle natural fabric drape with a few small real folds. Clean and calm.
No harsh shadows.

No person, no mannequin, no body, no hands.

Background: plain flat light grey (#E6E6E6). No floor, no wall, no
gradient, no shadow on the background.

Frame: portrait 4:5 (1600 x 2000 px). The hook ring is exactly centred left
to right. The middle of the ring is 4% down from the top edge (80 px).
The top of the collar or shoulder line is about 10% down (200 px).
The garment is centred. The longest piece fills about 90% of the height.
Other pieces keep their real size compared with it: do not stretch a short
piece to fill the frame.
```

For a white or cream garment, change the background line to: plain mid grey (#9A9A9A).

## Front

Attach the real product photo. Paste the master block, then:

```text
View: straight-on front view, camera at chest height. The garment faces the
camera. Sleeves hang naturally.
Match the front of the garment in the attached photo exactly, including
where the print or logo sits.
Make one image only.

Garment: [colour, fabric, and the exact print or logo if it has one].
```

Check this one until the ring, the neck, the light, and the framing are right. That file is the style anchor for the rest of the set.

## Side

Not for trousers. Attach the original product photo and the approved front. Paste the master block, then:

```text
Attached image 1: the original photo of the garment.
Attached image 2: the approved front image of this same garment. Match the
hook, light, scale and top edge of image 2.

View: turn the whole garment exactly 90 degrees, so we see the LEFT SIDE.
It looks narrow, like a profile. Show the side seam, the sleeve hanging in
front of the body, the collar or hood shape and the curve of the hem.
The hook ring must sit directly above the middle of the shoulder seam, in
the middle of the picture.
Same height, same scale and same top edge as image 2.
This must look like a real side view. Do not squash the front view.
Make one image only.
```

## Back

Attach the original photo (include a back photo if you have one) and the approved front. Paste the master block, then:

```text
Attached image 1: the original photo(s) of the garment, including the back
if available.
Attached image 2: the approved front image. Match the hook, light, scale and
top edge of image 2.

View: straight-on back view, the garment turned 180 degrees.
Show the back exactly as in the original photo.
If there is no back photo: keep the back plain. Do not invent a print or a
logo.
Make one image only.
```

## Trousers, front

No side photo. Paste the master block, then:

```text
The trousers hang straight from the waistband on two small clips. The clips
and the bar are hidden behind the waistband. The waistband top is about 10%
down from the top edge. The legs hang straight down to about 90% of the
height. Keep the pleats, creases, belt loops, pockets and the real colour
exactly as in the attached photo.
View: straight-on front view.
Make one image only.
```

## Only photo is someone wearing it

Use this instead of the front prompt. Paste the master block, then:

```text
The attached photo shows a person wearing the garment. Make a product photo
of ONLY the garment, hanging from the brass hook. Remove the person
completely. Rebuild the hidden parts (inside of the neck, back of the
collar, underside of the sleeves) in a natural way that matches the fabric.
Keep every detail of the visible garment the same.
View: straight-on front view.
```

Then make the side (except trousers) and the back from that approved front.

## Fix one detail

Attach the image to fix, and a close-up of the real detail.

```text
Attached image 1: the image to fix. Attached image 2: a close-up of the
real print.
Change ONLY the [print on the chest]. Make it match image 2 exactly: same
letters, same spelling, same size, same place.
Keep everything else in image 1 unchanged: hook, garment shape, colour,
light, framing.
```

## Clean up a real photo

Hang the garment so the wooden bar is hidden and only the brass neck and ring show. Phone on a tripod, chest height, soft window light. Front, side (not for trousers), and back. Then:

```text
Attached: a real photo of the garment hanging.
Clean it for a website. Keep the garment exactly as it is (do not change
the print, colour, shape or fabric). Only: remove the background and make
it plain flat light grey (#E6E6E6), soften harsh shadows, and lightly
smooth messy wrinkles. Do not redraw the garment.
Keep the framing: hook ring centred, ring middle 4% from the top, collar
about 10% from the top, portrait 4:5.
```

Use mid grey (#9A9A9A) when the garment is white or cream.

## After the tool answers

1. Remove the background. View the cutout on `#F4F2EE` and on `#111`. Rub out any grey or green fringe.
2. New canvas, **1600 × 2000 px**, transparent.
3. Paste the cutout. Put the **middle of the brass ring at x = 800, y = 80**. The collar, hood, or waistband starts near **y = 200**. No wood past the cloth.
4. Match scale to the hero piece. Every ring sits on the same line. The longest piece ends near y = 1800.
5. Export PNG. Compress under about 900 KB.
6. Name the file `adot-rail-{handle}-front.png`, `-side.png`, or `-back.png`.

## Put them on the rail

Theme editor → homepage → Hanger Rail → each Piece block:

- Pick the **product**. That gives the price, sizes, extra photos, and the real link.
- **Image** = front
- **Side image** = side for tops and shirts. Leave it empty for trousers.
- **Back image** = back

If you set a front and leave the side empty on a top, that piece turns into a thin card when it is not hovered. The category stand-ins are only used while both the image and the product photo are empty.

When the real photos fill about 90% of the frame, set **Move the text under the rail up** to 0. It is 70 while the short stand-ins are in.

## Check before you publish

- Zoom to 200% on any logo. Same letters, same spelling, same place as the real garment.
- Colour matches the garment in your hand.
- No extra pocket, button, seam, or tag. Nothing missing.
- The ring is centred. Its middle is about 80 px from the top. Allow about 24 px.
- The collar or waistband is about 200 px from the top.
- The longest piece fills about 90% of the height. A tee is shorter than a hoodie.
- The side picture is a real 90° view, with the ring above the shoulder seam.
- Trousers have no side picture.
- The back has no invented print.
- Edges are clean on the cream page and on black.
- The file is under about 900 KB.
