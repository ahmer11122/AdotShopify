# ADOT Hanger Rail — Build Brief

A clothing rail for the ADOT Shopify store. Pieces hang on hangers. Hover (or swipe on mobile) and a piece swings to face you. Click it and it lifts into a quick look that you can spin.

This replaces the "Lookbook Flow" section (`sections/interactive-gallery.liquid`).

**Who reads this:** an AI coding agent. Follow the steps in order. Do not improvise. The code in Appendix A is already written and tested. Your job is to place it, connect the content, and check it.

---

## 0. Quick start (do these 6 steps)

1. Commit the old `sections/interactive-gallery.liquid` to git, so you can go back. Do **not** leave a backup copy inside `sections/` (it would show up in the theme editor).
2. Replace the whole content of `sections/interactive-gallery.liquid` with **Appendix A**. Paste it exactly.
3. Check the theme tokens in section 7. Map any names that are different in this theme.
4. Run Theme Check. Fix real errors only.
5. Add the images (section 8). Fill the blocks (section 9).
6. Go through the checklist in section 10.

### Golden rules (do not break these)

1. **Keep the file name** `sections/interactive-gallery.liquid`. The homepage template points to it by name.
2. **Keep these setting ids:** `eyebrow`, `heading`, `caption`, `button_label`, `button_link`, `background_color`, `text_color`. **Keep block type `card`** and its ids `image`, `title`, `subtitle`, `link`. Then the old saved content keeps working.
3. **Animate only `transform` and `opacity`.** Never animate width, height, top or left.
4. **No `position: sticky`, no pinned sections, no scroll-jacking.** (A past sticky attempt on the hero glitched.)
5. **No libraries.** No GSAP, no jQuery, no React.
6. **One file.** Liquid, CSS (`{% stylesheet %}`), JS (`<script>`) and schema stay in this one section file.
7. **Do not "improve" the JS.** If something looks wrong, read section 11 first.
8. **Do not change the tuning numbers** (section 6) unless asked.

---

## 1. Goal

Make the "lookbook" feel like a real shop rail. It must look calm, clean and expensive on desktop and on mobile. The memorable thing is one move: **a piece turns from side-on to facing you.** Everything else stays quiet.

## 2. What the reference video does

Reference: Molimao demo (clothing rail).

- Warm off-white page. A thin metal rod with small end caps.
- 10 pieces hang from it, all turned sideways, so each looks like a thin sliver.
- Hover one: it swings to face you and grows. The pieces next to it slide aside.
- Under the rail: the piece name, a hint line ("Hover to turn. Click to explore."), and a pill button.
- Click: the page blurs. The piece lifts to the centre on a thin thread. You see name, small line, counter (`01 / 10`), a Front / Back switch, a shop link, and Close.
- Front / Back turns the piece through its side.
- An orange marquee strip at the bottom. **We do not copy this.**

## 3. Our version: what is better

| Reference | Ours |
|---|---|
| The turn jumps from one piece to the next | Spring motion. Slight overshoot. Neighbours lean and swing back like real hangers. |
| Front / Back button only | Drag the piece to spin it. Prev / Next inside the quick look. Arrow keys. |
| No clear mobile idea | **Swipe the rail.** Hangers slide along the rod like on a real rack. The piece in the centre faces you. Tap to open. |
| Mouse only | Keyboard works. Screen readers get the product name. Reduced motion is respected. |
| Appears with no moment | One intro: the rod draws across, then pieces drop onto it. |
| Flat light | A soft pool of light follows the open piece. |
| No shopping info | Price, "View product" button, optional WhatsApp order button. |
| Hover can flicker when the layout moves | Hit testing is "sticky": the open piece stays open while the mouse is still on it. |

Taste rules for this section:
- Spend the boldness in one place (the turn). Keep the rest quiet.
- No numbered badges, no gradient washes, no cards. No arrows on buttons.
- The theme's own fonts and colours are used. Do not add a new font.

---

## 4. Behaviour spec

### 4.1 Two modes (the JS picks one by itself)

| Mode | When | How it works |
|---|---|---|
| `rail` | Mouse + screen at least 750px wide + enough room (gap between hangers at least 54px) | Pieces sit on a fixed rod. Hover turns one. |
| `scroll` | Touch devices, small screens, or too many pieces for the width | Native horizontal swipe with snap. The rod stays still. Pieces slide along it. The piece in the middle faces you. |

The mode is set as `data-mode="rail"` or `data-mode="scroll"` on the section. It re-checks when the window resizes.

### 4.2 Desktop (`rail` mode)

- At rest every piece is turned about 84° (side-on). A piece at rest shows its **side image**. If there is no side image, the front image is turned in 3D instead.
- Move the mouse over the rail. The nearest piece turns to face you. Its neighbours move apart. The total width stays the same.
- The open piece tilts a little toward the mouse (up to 7° left/right, 3.5° up/down).
- A soft light follows the open piece.
- The label under the rail swaps with a short slide-up (name, small line, price). The counter at top right shows `01`, `02`, …
- Leave the rail: after 140 ms everything swings back to rest.
- **Auto-demo:** about 2 seconds after the section shows on screen, pieces turn one by one. It stops at the first mouse move, key press or click. It runs at most 7 times. It can be switched off in the settings.
- **Idle sway:** all pieces move a tiny bit (about 0.5°), each on its own timing. Can be switched off.
- Click a piece (or press Enter on it): quick look opens. Ctrl/Cmd/Shift/middle click still opens the product link normally.

### 4.3 Mobile (`scroll` mode)

- The rod fills the screen width and does not move. Pieces slide along it.
- The centre piece faces you and is large. The pieces beside it are side-on slivers, and they peek in from both edges.
- Swiping snaps one piece at a time to the centre.
- Tap the centre piece: quick look. Tap a side piece: it slides to the centre first.
- The hint under the rail changes to "Swipe the rail. Tap to explore."
- The "Shop All Pieces" button is full width.

### 4.4 Quick look (the `<dialog>`)

- Opens with the real `<dialog>` element and `showModal()`. This gives focus trap, Esc to close and an inert page.
- **Opening motion:** the piece flies from its place on the rail to the centre (position and size, one smooth move). The background blurs in. A thin thread draws down from the top to the hook. Name, line, buttons slide up one after another.
- **Content:** counter with Prev / Next, name, fabric line + price, Front / Back switch (hidden if there is no back image), "View product" button, optional "Order on WhatsApp".
- **Spin:** drag the piece left or right to turn it. On release it snaps to front or back. While it turns edge-on, the side image shows.
- **Prev / Next:** old piece slides out, new one slides in. Left / Right arrow keys do the same.
- **Close:** Close button, Esc, or click the blurred background. The piece flies back to its place on the rail. Focus returns to the piece that was opened.
- The page behind does not scroll while it is open.
- A safety timer makes sure it always closes, even if an animation fails.

### 4.5 Keyboard and screen readers

- Only one piece is in the tab order (roving tabindex). Left / Right / Home / End move between pieces.
- Focusing a piece opens it in the rail (same as hover) and announces its name in a hidden live region.
- Every piece is a real link `<a href>`. With JS off it still works as a plain swipe list of front images.
- Visible focus ring on every control.

### 4.6 Reduced motion

If the person asks for reduced motion: no springs, no sway, no auto-demo, no intro, no flying piece. Pieces switch instantly. The quick look just appears and disappears.

### 4.7 Edge cases already handled

- 1 to 12 pieces (schema limit is 12). With few pieces the rod gets shorter so the gaps do not look empty.
- A piece with no side image: front image is turned in 3D.
- A piece with no back image: the Back switch is hidden and dragging only wiggles a little.
- A piece with no front image: a dashed placeholder box shows its name.
- Piece with no product picked: uses the typed name and the link field.
- Several copies of this section on one page.
- Theme editor: selecting a block previews that piece.

---

## 5. Motion spec

| What | Time / feel | Notes |
|---|---|---|
| Turn to face you | Spring. Stiffness 170, damping 20. About 4% overshoot. | Pieces swing a tiny bit past front and settle. |
| Neighbours step aside | Same spring as the turn | Layout is computed every frame. No CSS transition. |
| Sway / lean | Spring. Stiffness 60, damping 7 | A piece leans away from the way it moves, then swings back 2 to 3 times. Max 5°. |
| Idle sway | Sine wave, 0.55°, slow, each piece offset | Off if the setting is off. |
| Tilt to mouse | Smooth follow, about 100 ms | Open piece only. |
| Spotlight | Follows with ease, fades in about 150 ms | Soft white radial gradient. |
| Label text swap | 460 ms, `cubic-bezier(0.2, 0.85, 0.2, 1)` | Slides up inside a clipped line. |
| Intro: rod | 900 ms, draws left to right | Once, when the section is 25% visible. |
| Intro: pieces | 1000 ms each, 55 ms apart, start after 250 ms | Drop 26px and swing 2.5° into place. |
| Quick look: fly in | 780 ms, `cubic-bezier(0.2, 0.85, 0.2, 1)` | Uses a FLIP move (position + scale). |
| Quick look: thread | 700 ms | Draws from the top. |
| Quick look: info | 640 ms each, 70 ms apart, start after 180 ms | Slide up 16px and fade in. |
| Quick look: fly out | 540 ms, `cubic-bezier(0.55, 0, 0.7, 0.3)` | Back to the rail position. |
| Spin (front / back) | Spring. Stiffness 130, damping 17 | Drag speed adds a little throw. |
| Prev / Next | 200 ms out, 480 ms in | Slides 56px sideways. |

Performance rules:
- Only `transform` and `opacity`. The animation loop runs only while the section is on screen, and it stops by itself when nothing moves (unless idle sway is on).
- No `filter` or `box-shadow` is animated.
- Images use `loading="lazy"` and `srcset`. The quick look loads the big image only when opened, and warms the next and previous pieces.

---

## 6. How the layout works (so you understand the code)

Do not rewrite this. It is here so you can read the code.

Names: `N` pieces, `P` gap between hanger centres, `F` visible width of a piece facing you, `a_i` how much piece `i` faces you (0 = side-on, 1 = facing).

1. **Size.** Every piece sits in a 4:5 box. Height is `--hr-h`. Width is 0.8 × height. `F` = box width × 0.78 (`FILL`).
2. **Rail mode.** The rod width is `(N − 1) × P + F`, but never more than the stage width. `P = (rod width − F) / (N − 1)`, with a maximum of 132 px (`MAX_PITCH`). If `P` would be under 54 px (`MIN_PITCH`), switch to scroll mode.
3. **Neighbours step aside.** For a piece `i`:
   `shift_i = (F − P) / 2 × (sum of a_j for j before i − sum of a_j for j after i)`
   The open piece grows evenly to both sides. The pieces on each side move out by half the extra width. Nothing overflows the rod, because there is spare room at both ends of the rod (half of `F − P`).
4. **Turn.** `rotateY = (1 − a) × 84°` (`REST_TURN`). Scale goes from 0.92 to 1. If a side image exists, front and side images cross-fade between 50% and 90% of the turn.
5. **Hit test (rail mode).** If the mouse is still within ±0.52 × F of the open piece centre, that piece stays open. Otherwise the nearest piece centre wins. This stops flicker.
6. **Scroll mode.** `a_i` comes from how close the piece is to the middle: `smoothstep(1 − distance / P)`. The sum of all `a` stays 1.
7. **Snap points must not move.** In scroll mode the moving transform is on an inner wrapper (`.hrail__slide`), never on the `<li>`. Scroll-snap reads the transformed box, so moving the `<li>` would break the snap points. **Do not move this transform to the `<li>`.**

### Tuning knobs (JS, top of the script)

| Name | Default | Does |
|---|---|---|
| `FILL` | 0.78 | Visible garment width ÷ image width |
| `MAX_PITCH` | 132 | Widest gap between hangers on desktop (px) |
| `MIN_PITCH` | 54 | Below this gap, switch to swipe mode (px) |
| `REST_TURN` | 84 | How far pieces are turned at rest (degrees) |
| `SPRING_K`, `SPRING_C` | 170, 20 | Turn spring: stiffness, damping |
| `SWAY_K`, `SWAY_C` | 60, 7 | Sway spring. Lower `SWAY_C` = more wobble |

---

## 7. Theme integration

### 7.1 Section settings

| Id | Type | Default | Note |
|---|---|---|---|
| `eyebrow` | text | On the rail | Empty = hidden |
| `heading` | text | Clean Cuts. Quality Fabrics. | Same as before |
| `caption` | textarea | empty | |
| `idle_title` | text | Pick a piece | Shown when nothing is open |
| `hint_hover` | text | Hover to turn. Click to explore. | Desktop |
| `hint_touch` | text | Swipe the rail. Tap to explore. | Mobile |
| `button_label`, `button_link` | text, url | Shop All Pieces | Empty label = no button |
| `show_price` | checkbox | on | Needs a product on the piece |
| `view_label` | text | View product | Quick look main button |
| `whatsapp_number` | text | empty | Country code, digits only (example `923001234567`). Empty = no WhatsApp button |
| `idle_sway` | checkbox | on | |
| `attract_mode` | checkbox | on | Auto-demo on desktop |
| `rail_height` | range 320–560 | 480 | Max piece height on desktop (px) |
| `background_color` | color | #F4F2EE | Warm off-white works best for the light pool |
| `text_color` | color | #111111 | |

### 7.2 Block: type `card` ("Piece"), max 12

| Id | Type | Note |
|---|---|---|
| `product` | product | Gives name, link and price |
| `image` | image | **Front** cutout (PNG, transparent) |
| `image_side` | image | Optional. Side view |
| `image_back` | image | Optional. Back view. Turns on the Back switch |
| `title` | text | Empty = product title |
| `subtitle` | text | Small line, for example the fabric |
| `link` | url | Empty = product link |

Each colour of a product is its own product in this store. So **one piece on the rail = one product page.** There are no colour swatches anywhere in this section.

If `image` is empty but a product is picked, the product's main image is used. It is not a cutout, so it will look wrong. Always add cutouts.

### 7.3 Theme tokens used (all have fallbacks)

| Token | Used for | If the theme uses another name |
|---|---|---|
| `--font-display` | headings, names | replace in the `{% stylesheet %}` block |
| `--color-border` | top border | same |
| `--color-text-subtle`, `--color-text-muted` | small grey text | same |
| `--color-focus` | focus ring | same |
| `.btn`, `.btn-outline` | the "Shop All Pieces" button | same |
| `.text-micro` | eyebrow, hint, counter | same |

### 7.4 Things to check in the theme

- A global `dialog { ... }` rule in the theme CSS can break the quick look. The section sets its own size, so remove or narrow the global rule if needed.
- A sticky header does not matter. The quick look sits in the browser top layer, above everything.
- The old homepage section may have more than 12 blocks. The new limit is 12. If so, remove the extras in the theme editor.

---

## 8. Images

This is the part that makes or breaks the look. The code is ready. The images must be right.

### 8.1 What to make (per product)

| Image | Needed? | What it is |
|---|---|---|
| **Front** | Required | Garment on a hanger, seen straight from the front |
| **Side** | Strongly recommended | The same garment, same hanger, seen exactly from its left side |
| **Back** | Recommended | Straight from the back. Turns on the Back switch |

| Level | Images per piece | Result |
|---|---|---|
| A | Front only | Works. Pieces turn in 3D like a thin card. Looks flat. |
| B | Front + side | Real look at rest. **Best value.** |
| C | Front + side + back | Full quick look with Front / Back and spin |

For 10 pieces at level C you need 30 images.

### 8.2 Image rules (every image in the set must match)

- **Size:** 1600 × 2000 px. Ratio 4:5 (portrait).
- **Format:** PNG with a **transparent background**.
- **Hanger:** the **same** slim dark-walnut wooden hanger with a brushed-brass hook, in every image.
- **Hook position:** the hook loop is exactly centred left-to-right. The **middle of the loop is 4% from the top edge** (80 px). The code puts the rod at that height. If the hook is not there, the hooks will float or sink.
- **Garment:** centred. At least 6% empty space on the left and right. The longest piece should end at about 85% of the height (1700 px).
- **Scale:** the same pixels-per-cm for every piece. A T-shirt must look shorter than a hoodie. Do not stretch pieces to fill the box.
- **Light:** soft, even, from the front-left. Same in every image. No shadow baked on the background. No floor.
- **Side image:** it must be a real side view (the garment turned 90°), with the same hook position and the same top edge as the front image. It is **not** a squashed front image.
- **No people.** No mannequin, no hands, no face.
- **File size:** under about 900 KB each. Compress with Squoosh or TinyPNG. Shopify serves WebP to browsers by itself.
- **File names:** `adot-rail-{product-handle}-front.png`, `-side.png`, `-back.png`.

### 8.3 Two ways to get the images

**Way 1: AI from your original photos (fast).** Use the prompts below.

**Way 2: shoot the real garment (most true).**
Hang the garment on the same wooden hanger on a plain wall or a door. Use a phone on a tripod at chest height, in soft window light. Take 3 shots: front, side, back. Then remove the background. Use AI only to clean up (see prompt 8.6). This is the safest way for prints and small logos.

You can mix both ways.

### 8.4 What to give the AI

For each product, upload:
1. The clearest **front photo** (flat lay, on a hanger, or on a person).
2. The **back photo**, if you have one.
3. A **close-up** of any print, logo or label.

Use **one image tool for the whole set**, so the hanger and light stay the same. Pick a tool that accepts reference photos and keeps small details (for example Gemini image editing, GPT image, Flux Kontext, or Seedream, or a newer one).

### 8.5 Prompts

Replace anything in `[brackets]`. Always paste the **MASTER STYLE** block first.

#### MASTER STYLE (paste first in every prompt)

```
You are making a product image for a clothing website.
Use the attached photo(s) as the ONLY truth for the garment.

Keep the garment exactly the same: colour, fabric look, stitching, collar,
cuffs, hem, pockets, zips, buttons, label, logo and print (same size, same
place, same spelling). Do not redesign it. Do not add anything. Do not
remove anything.

The garment hangs on a slim dark-walnut wooden hanger with a small
brushed-brass hook. Use the same hanger in every image of this set.

Look: realistic studio photo, soft even daylight from the front-left,
gentle natural fabric drape with a few small real folds. Clean and calm.
No harsh shadows.

No person, no mannequin, no body, no hands.

Background: plain flat light grey (#E6E6E6). No floor, no wall, no
gradient, no shadow on the background.

Frame: portrait 4:5 (1600 x 2000 px). The hook is exactly centred left to
right. The middle of the hook loop is 4% down from the top edge. The
garment is centred, with about 6% empty space on the left and right.
Show the real size of the garment compared with other garments: do not
stretch it to fill the frame.
```

#### PROMPT 1: FRONT

```
[MASTER STYLE]

View: straight-on front view, camera at chest height. The garment faces the
camera. Sleeves hang naturally.
Match the front of the garment in the attached photo exactly, including
where the print or logo sits.
Make one image only.

Garment: [for example: black polo, white trim on the collar, "NORTH" print
on the chest].
```

#### PROMPT 2: SIDE (use the approved FRONT image as image 2)

```
[MASTER STYLE]

Attached image 1: the original photo of the garment.
Attached image 2: the approved front image of this same garment on this same
hanger. Match the hanger, light, scale and hook position of image 2.

View: turn the whole hanger and garment exactly 90 degrees, so we see the
LEFT SIDE of the garment. It looks narrow, like a profile. Show the side
seam, the sleeve hanging in front of the body, the collar or hood shape and
the curve of the hem. The wooden hanger is seen from its thin edge, with the
hook on top.

Same height, same scale and same top edge as image 2.
This must look like a real side view. Do not squash the front view.
Make one image only.
```

#### PROMPT 3: BACK (use the approved FRONT image as image 2)

```
[MASTER STYLE]

Attached image 1: the original photo(s) of the garment, including the back
if available.
Attached image 2: the approved front image. Match the hanger, light, scale
and hook position of image 2.

View: straight-on back view, the garment turned 180 degrees on the hanger.
Show the back exactly as in the original photo.
If there is no back photo: keep the back plain. Do not invent a print or
a logo.
Make one image only.
```

#### PROMPT 4: if the only photo shows a person wearing it

```
[MASTER STYLE]

The attached photo shows a person wearing the garment. Make a product photo
of ONLY the garment, hanging on the wooden hanger. Remove the person
completely. Rebuild the parts that were hidden (the inside of the neck, the
back of the collar, the underside of the sleeves) in a natural way that
matches the fabric. Keep every detail of the visible garment the same.
View: straight-on front view.
```

#### PROMPT 5: fix one detail only (when the AI gets a print wrong)

```
Attached image 1: the image to fix. Attached image 2: a close-up of the
real print.
Change ONLY the [print on the chest]. Make it match image 2 exactly: same
letters, same spelling, same size, same place.
Keep everything else in image 1 unchanged: hanger, garment shape, colour,
light, framing.
```

#### PROMPT 6: clean up a real photo (Way 2)

```
Attached: a real photo of the garment on a hanger.
Clean it for a website. Keep the garment exactly as it is (do not change
the print, colour, shape or fabric). Only: remove the background and make
it plain flat light grey (#E6E6E6), soften harsh shadows, and lightly
smooth messy wrinkles. Do not redraw the garment.
Keep the framing: hook centred, loop middle 4% from the top, portrait 4:5.
```

### 8.6 Work order (do it in this order)

1. Pick **one hero piece**. Make its FRONT (prompt 1). Check it. Repeat until the hanger, light and framing are right. This approved image is your style anchor.
2. For every other piece, make the FRONT again. Attach the approved hero front as an extra reference ("match the hanger and light of this image").
3. For every piece, make the SIDE (prompt 2) and the BACK (prompt 3) from that piece's approved front.
4. Remove the background (see 8.7).
5. Place each cutout on a transparent **1600 × 2000 px** canvas (Canva, Photoshop or Photopea). Check hook position and scale (see 8.8). Fix by nudging the garment on the canvas. Most AI tools do not give an exact size, so this step is needed.
6. Compress. Name the files. Upload to Shopify (Content > Files), then pick them in each block.

### 8.7 Making the background transparent

- If the tool can output a transparent PNG, add "transparent background (alpha)" to the prompt.
- If not, use the grey background, then remove it with Photoroom, remove.bg, Photoshop "Remove Background", or the background remover in Canva.
- White and cream garments can blend into light grey. For those, ask for a **mid-grey (#9A9A9A)** background instead, then remove it.
- After removing: view the image on a **light** background (#F4F2EE) and on a **dark** one (#111). Remove any grey halo around the edges.

### 8.8 Image check (do this for every image)

- [ ] Print, logo, label: zoom to 200%. Same letters, same spelling, same place as the real garment.
- [ ] Colour matches the real garment. Hold your phone next to the screen to compare.
- [ ] No extra pocket, button, drawstring, seam or tag. Nothing missing.
- [ ] Both sleeves match. The collar is correct.
- [ ] Same hanger in every image of the set.
- [ ] Hook loop is centred, and its middle is about 4% from the top (allow ±1.5%).
- [ ] Scale is right: a T-shirt is shorter than a hoodie.
- [ ] The side image is a real side view. It has the same top edge as the front.
- [ ] The back has no invented print.
- [ ] No person, no mannequin, no hands, no odd text.
- [ ] Edges are clean on light and dark backgrounds.
- [ ] File is under about 900 KB.

**Be honest with customers.** AI can quietly change a logo, a colour or a stitch. A wrong image means returns and angry messages. If the AI keeps failing on one piece, use Way 2 (real photo) for that piece.

---

## 9. Filling the content

1. In the theme editor, open the homepage. Select the section. Add or edit "Piece" blocks. 5 to 12 pieces is best. 8 to 10 looks great.
2. For each block: pick the **product**, then add **front**, **side** and **back** images. Leave `title` and `link` empty to use the product's own.
3. Order: the auto-demo starts at about one third along the rail. Put a best seller there. Mix dark and light pieces side by side for rhythm.
4. Set `whatsapp_number` if you want the WhatsApp button. Leave it empty to hide it.
5. Old blocks (from "Lookbook Flow") carry over. Their old images are probably normal photos with a background, so replace them with cutouts.

---

## 10. QA checklist

**Desktop (mouse)**
- [ ] On first view the rod draws, then pieces drop on. Then the auto-demo runs. It stops when you move the mouse.
- [ ] Hover turns the nearest piece. Neighbours move aside. No jumping when you sweep slowly across the open piece.
- [ ] Moving from piece to piece feels smooth. Neighbours lean and settle.
- [ ] First and last pieces stay inside the rod when open.
- [ ] Mouse leaves: everything swings back to rest.
- [ ] Click opens the quick look. The piece flies to the centre. Thread, text and buttons appear.
- [ ] Front / Back works. Dragging spins the piece and it snaps to front or back.
- [ ] Prev / Next and arrow keys work. Esc, Close and clicking the background all close it. The piece flies back. Focus returns to that piece.
- [ ] Page behind does not scroll while it is open.
- [ ] Ctrl/Cmd + click opens the product link in a new tab.

**Mobile (real phone if you can)**
- [ ] Rod fills the width. The centre piece faces you. Side pieces peek in from the edges.
- [ ] Swipe snaps one piece at a time. Vertical page scroll still works when you scroll past the rail.
- [ ] Tap centre = quick look. Tap a side piece = it moves to the centre.
- [ ] Quick look: buttons are full width and easy to tap. Nothing is cut off. Works with the browser address bar showing or hidden.
- [ ] No sideways page scroll.

**Keyboard and access**
- [ ] Tab reaches the rail with one stop. Arrow keys move between pieces. Enter opens.
- [ ] Focus ring is visible. Esc closes. Focus goes back to the piece.
- [ ] With "reduce motion" on, nothing swings or flies. Everything still works.

**Other**
- [ ] No errors in the browser console.
- [ ] Theme Check has no new errors.
- [ ] Theme editor: select a block, it previews. Edit a setting, the section re-renders and works.
- [ ] PageSpeed: no layout shift from the section (it has a fixed height). Images lazy load.

---

## 11. Knobs and troubleshooting

| Problem | Fix |
|---|---|
| Hooks float above or sink below the rod | The hook is not at 4% in the images. Fix the images, or change `--hr-hook` in the CSS (default `calc(var(--hr-h) * 0.04)`). |
| Pieces look too small or too big | Setting "Max piece height", or the CSS `--hr-h`. |
| Gaps between hangers look too wide | Lower `MAX_PITCH`. |
| Pieces look like flat cards when they turn | Add side images. |
| Turn feels too slow or too bouncy | `SPRING_K` up = faster. `SPRING_C` up = less bounce. |
| Too much wobble | Raise `SWAY_C`, or turn off "Gentle sway". |
| Swipe mode starts too early or too late | `MIN_PITCH`. |
| The visible garment looks off-centre when open | Check the image has equal space left and right. Adjust `FILL` if the garment fills a different share of the image than 78%. |
| Section shows a plain list and nothing moves | JS did not start. The section has no `is-ready` class. Open the console and fix the error. |
| Mobile does not swipe | An ancestor element has `overflow: hidden` with a fixed width, or `touch-action: none`. The element `.hrail__scroller` must be free to scroll. |
| Swipe snaps to odd places | Someone moved the transform to the `<li>` in scroll mode. Put it back on `.hrail__slide` (section 6, point 7). |
| Quick look looks wrong (wrong size, white box) | A global `dialog` rule in the theme. Narrow or remove it. |
| WhatsApp button missing | `whatsapp_number` is empty. |
| Prices missing | `show_price` is off, or the block has no product picked. |

---

## 12. What was tested (read this before you trust it)

The code was run in headless Chromium with placeholder art (not your real photos):
- Desktop 1440×900, 1024×768 and 820×700 (rail mode).
- Mobile 390×844 with touch (swipe mode, snap, tap to open).
- 4 pieces and 10 pieces.
- Hover, sweep across the open piece (no flicker), click, quick look open, Front / Back, Prev / Next, drag to spin, Esc close.
- Keyboard: Tab, arrows, Enter, Esc, focus return.
- Reduced motion on.
- No console errors in any run.

**Not tested:** real Shopify rendering (the Liquid was checked with a Liquid engine and mock data), Safari and iOS Safari, Firefox, real phones, speed on cheap Android phones, the theme editor's block-select preview, and how the real photos look. **Test on a real phone and in Safari before launch.**

## 13. Ideas for later (do not build now)

- A small "cursor label" that follows the mouse on the open piece.
- A "shop the rack" link that filters a collection by the open piece's type.
- A photo of the garment's fabric close-up in the quick look.
- Different rails for Men / Women or New / Best sellers (two sections).

---

## Appendix A — the full section file

Paste this exactly as `sections/interactive-gallery.liquid`.

```liquid
{% comment %}
  Hanger Rail
  Replaces "Lookbook Flow". Keep this file name: sections/interactive-gallery.liquid
  Same setting ids and same block type ("card") as before, so saved content keeps working.

  Idea: a clothing rail. Every piece hangs turned sideways. Hover (desktop) or swipe (mobile)
  and the piece swings to face you. Click it and it lifts into a quick-look you can spin.
  Motion uses transform and opacity only. No sticky, no scroll-jacking.
{% endcomment %}

{% liquid
  assign total = section.blocks.size
  assign total_label = total
  if total < 10
    assign total_label = total | prepend: '0'
  endif
  assign wa_number = section.settings.whatsapp_number | strip | remove: '+' | remove: ' ' | remove: '-'
  assign idle_title = section.settings.idle_title | default: 'Pick a piece'
%}

<section
  class="hrail"
  data-section-id="{{ section.id }}"
  style="--hr-bg: {{ section.settings.background_color }}; --hr-ink: {{ section.settings.text_color }}; --hr-h-max: {{ section.settings.rail_height }}px;"
  aria-labelledby="HRailHeading-{{ section.id }}"
>
  <hanger-rail
    class="hrail__root"
    data-wa="{{ wa_number }}"
    data-idle-title="{{ idle_title | escape }}"
    data-hint-hover="{{ section.settings.hint_hover | escape }}"
    data-hint-touch="{{ section.settings.hint_touch | escape }}"
    data-sway="{{ section.settings.idle_sway }}"
    data-attract="{{ section.settings.attract_mode }}"
    data-view-label="{{ section.settings.view_label | escape }}"
  >
    <header class="hrail__head">
      <div class="hrail__head-row">
        <div class="hrail__head-text">
          {% if section.settings.eyebrow != blank %}
            <p class="text-micro hrail__eyebrow">{{ section.settings.eyebrow }}</p>
          {% endif %}
          {% if section.settings.heading != blank %}
            <h2 id="HRailHeading-{{ section.id }}" class="hrail__heading">{{ section.settings.heading }}</h2>
          {% endif %}
        </div>
        <p class="text-micro hrail__count" aria-hidden="true">
          <span data-hr-now>01</span>
          <span class="hrail__count-rule"></span>
          <span>{{ total_label }}</span>
        </p>
      </div>
      {% if section.settings.caption != blank %}
        <p class="hrail__caption">{{ section.settings.caption }}</p>
      {% endif %}
    </header>

    <div class="hrail__stage" data-hr-stage>
      <div class="hrail__rod" data-hr-rod aria-hidden="true"></div>
      <div class="hrail__spot" data-hr-spot aria-hidden="true"></div>
      <div class="hrail__scroller" data-hr-scroller>
        <ul class="hrail__track" role="list" data-hr-track>
          {% for block in section.blocks %}
            {% liquid
              assign p = block.settings.product
              assign title = block.settings.title | default: p.title | default: 'Piece'
              assign sub = block.settings.subtitle
              assign url = block.settings.link | default: p.url | default: routes.all_products_collection_url
              assign front = block.settings.image
              assign side = block.settings.image_side
              assign back = block.settings.image_back
              if front == blank and p != blank
                assign front = p.featured_image
              endif
              assign num = forloop.index
              if num < 10
                assign num = num | prepend: '0'
              endif
              assign price = ''
              if p != blank and section.settings.show_price
                assign price = p.price | money_without_trailing_zeros
              endif
              assign alt = title
              if sub != blank
                assign alt = title | append: ', ' | append: sub
              endif
            %}
            <li class="hrail__item" style="--i: {{ forloop.index0 }}" data-hr-item {{ block.shopify_attributes }}>
              <span class="hrail__slide">
              <a
                class="hrail__link"
                href="{{ url }}"
                aria-label="{{ alt | escape }}"
                data-title="{{ title | escape }}"
                data-sub="{{ sub | escape }}"
                data-price="{{ price | escape }}"
                data-num="{{ num }}"
                {% if front != blank %}data-front="{{ front | image_url: width: 1400 }}"{% endif %}
                {% if back != blank %}data-back="{{ back | image_url: width: 1400 }}"{% endif %}
                {% if side != blank %}data-side="{{ side | image_url: width: 1400 }}"{% endif %}
              >
                <span class="hrail__swing">
                  <span class="hrail__turn">
                    {% if side != blank %}
                      {{
                        side
                        | image_url: width: 900
                        | image_tag:
                          loading: 'lazy',
                          widths: '300, 450, 600, 900',
                          sizes: '(min-width: 750px) 380px, 75vw',
                          class: 'hrail__img hrail__img--side',
                          alt: '',
                          draggable: 'false'
                      }}
                    {% endif %}
                    {% if front != blank %}
                      {{
                        front
                        | image_url: width: 900
                        | image_tag:
                          loading: 'lazy',
                          widths: '300, 450, 600, 900',
                          sizes: '(min-width: 750px) 380px, 75vw',
                          class: 'hrail__img hrail__img--front',
                          alt: alt,
                          draggable: 'false'
                      }}
                    {% else %}
                      <span class="hrail__ph">{{ title }}</span>
                    {% endif %}
                  </span>
                </span>
                <span class="hrail__hit" aria-hidden="true"></span>
              </a>
              </span>
            </li>
          {% endfor %}
        </ul>
      </div>
    </div>

    <div class="hrail__label">
      <p class="hrail__name"><span class="hrail__mask"><span data-hr-name>{{ idle_title }}</span></span></p>
      <p class="hrail__meta"><span data-hr-sub></span><span data-hr-price></span></p>
      <p class="text-micro hrail__hint" data-hr-hint>{{ section.settings.hint_hover }}</p>
      <p class="hrail__sr" aria-live="polite" data-hr-live></p>
    </div>

    {% if section.settings.button_label != blank %}
      <div class="hrail__foot">
        <a class="btn btn-outline hrail__cta" href="{{ section.settings.button_link | default: routes.all_products_collection_url }}">
          <span>{{ section.settings.button_label }}</span>
        </a>
      </div>
    {% endif %}

    <dialog class="hrail-ql" data-ql aria-label="Quick look">
      <div class="hrail-ql__wall" data-ql-wall></div>
      <div class="hrail-ql__thread" data-ql-thread aria-hidden="true"></div>
      <button type="button" class="hrail-ql__close" data-ql-close>
        <span>Close</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 2L10 10M10 2L2 10" stroke-linecap="round"/></svg>
      </button>
      <div class="hrail-ql__layout">
        <div class="hrail-ql__stage">
          <div class="hrail-ql__garment" data-ql-garment>
            <div class="hrail-ql__spin" data-ql-spin>
              <img class="hrail-ql__face hrail-ql__face--front" data-ql-front alt="" draggable="false">
              <img class="hrail-ql__face hrail-ql__face--back" data-ql-back alt="" draggable="false">
            </div>
            <img class="hrail-ql__side" data-ql-side alt="" aria-hidden="true" draggable="false">
          </div>
        </div>
        <div class="hrail-ql__info" data-ql-info>
          <div class="hrail-ql__counter" data-rv>
            <button type="button" class="hrail-ql__step" data-ql-prev aria-label="Previous piece">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <span class="text-micro"><span data-ql-num>01</span> / {{ total_label }}</span>
            <button type="button" class="hrail-ql__step" data-ql-next aria-label="Next piece">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 2L10 7L5 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <h3 class="hrail-ql__name" data-rv data-ql-name></h3>
          <p class="hrail-ql__sub" data-rv><span data-ql-sub></span><span data-ql-price></span></p>
          <div class="hrail-ql__seg" data-rv data-ql-seg data-face="front" role="group" aria-label="Show front or back">
            <span class="hrail-ql__pill" aria-hidden="true"></span>
            <button type="button" data-face-btn="front" aria-pressed="true">Front</button>
            <button type="button" data-face-btn="back" aria-pressed="false">Back</button>
          </div>
          <div class="hrail-ql__cta" data-rv>
            <a class="hrail-btn hrail-btn--solid" data-ql-view href="{{ routes.all_products_collection_url }}">
              <span>{{ section.settings.view_label | default: 'View product' }}</span>
            </a>
            {% if wa_number != blank %}
              <a class="hrail-btn hrail-btn--ghost" data-ql-wa href="https://wa.me/{{ wa_number }}" target="_blank" rel="noopener">Order on WhatsApp</a>
            {% endif %}
          </div>
        </div>
      </div>
    </dialog>
  </hanger-rail>
</section>

{% stylesheet %}
  /* ---------- Hanger Rail: base ---------- */
  .hrail {
    --hr-h: clamp(300px, 47svh, var(--hr-h-max, 480px));
    --hr-hook: calc(var(--hr-h) * 0.04); /* hook loop centre = 4% down the image */
    --hr-gutter: clamp(1rem, 4vw, 3rem);
    --hr-pitch: clamp(52px, 14vw, 84px);
    --hr-ease: cubic-bezier(0.2, 0.85, 0.2, 1);
    position: relative;
    overflow: hidden;
    background: var(--hr-bg, var(--color-background, #f4f2ee));
    color: var(--hr-ink, var(--color-text, #111));
    padding-block: clamp(2.5rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4.5rem);
    border-top: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  }

  @media (max-width: 749px) {
    .hrail {
      --hr-h: min(86vw, 460px);
    }
  }

  .hrail *,
  .hrail *::before,
  .hrail *::after {
    box-sizing: border-box;
  }

  .hrail__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ---------- Header ---------- */
  .hrail__head {
    width: min(1320px, 100% - 2 * var(--hr-gutter));
    margin-inline: auto;
  }

  .hrail__head-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }

  .hrail__eyebrow {
    margin: 0 0 0.6rem;
    color: var(--color-text-subtle, rgba(0, 0, 0, 0.5));
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.7rem;
  }

  .hrail__heading {
    margin: 0;
    font-family: var(--font-display, inherit);
    font-size: clamp(1.75rem, 3.2vw, 2.75rem);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }

  .hrail__caption {
    margin: 0.75rem 0 0;
    max-width: 44ch;
    color: var(--color-text-muted, rgba(0, 0, 0, 0.62));
    line-height: 1.5;
  }

  .hrail__count {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    flex-shrink: 0;
    margin: 0;
    font-variant-numeric: tabular-nums;
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-subtle, rgba(0, 0, 0, 0.5));
  }

  .hrail__count-rule {
    width: 1.25rem;
    height: 1px;
    background: currentColor;
    opacity: 0.45;
  }

  /* ---------- Stage ---------- */
  .hrail__stage {
    position: relative;
    width: min(1320px, 100% - 2 * var(--hr-gutter));
    height: calc(var(--hr-h) + 10px);
    margin: clamp(1.5rem, 4vw, 3rem) auto 0;
  }

  @media (max-width: 749px) {
    .hrail__stage {
      width: 100%;
    }
  }

  .hrail__scroller {
    position: relative;
    height: 100%;
  }

  .hrail__track {
    position: relative;
    height: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Before JS: a plain swipe list of front images. It still works. */
  .hrail:not(.is-ready) .hrail__scroller {
    overflow-x: auto;
  }
  .hrail:not(.is-ready) .hrail__track {
    display: flex;
    gap: 12px;
    width: max-content;
  }
  .hrail:not(.is-ready) .hrail__item {
    position: relative;
    flex: 0 0 min(60vw, 300px);
  }
  .hrail:not(.is-ready) .hrail__img--side {
    display: none;
  }

  .hrail__item {
    position: relative;
    height: var(--hr-h);
    margin: 0;
    padding: 0;
  }

  .hrail__slide {
    position: absolute;
    inset: 0;
    display: block;
  }

  .hrail__link {
    position: absolute;
    top: 0;
    left: 50%;
    display: block;
    width: calc(var(--hr-h) * 0.8);
    height: var(--hr-h);
    margin-left: calc(var(--hr-h) * -0.4);
    color: inherit;
    text-decoration: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .hrail__swing,
  .hrail__turn {
    position: absolute;
    inset: 0;
    display: block;
    transform-origin: 50% 0;
  }

  .hrail__img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: 50% 0;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }

  .hrail__ph {
    position: absolute;
    inset: 12% 8% auto;
    padding: 2rem 1rem;
    border: 1px dashed currentColor;
    text-align: center;
    font-size: 0.75rem;
    opacity: 0.5;
  }

  .hrail__hit {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: var(--hw, 100%);
    transform: translateX(-50%);
  }

  .hrail:not(.is-ready) .hrail__hit {
    display: none;
  }

  .hrail__link:focus-visible .hrail__hit {
    outline: 2px solid var(--color-focus, currentColor);
    outline-offset: 4px;
    border-radius: 4px;
  }

  /* ---------- Mode: rail (desktop, mouse) ---------- */
  .hrail.is-ready[data-mode='rail'] .hrail__track {
    width: var(--hr-track-w, 100%);
    margin-inline: auto;
  }

  .hrail.is-ready[data-mode='rail'] .hrail__item {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--hr-pitch);
    will-change: transform;
  }

  .hrail.is-ready[data-mode='rail'] .hrail__hit {
    pointer-events: auto;
    cursor: pointer;
  }

  .hrail.is-ready[data-mode='rail'] .hrail__link {
    pointer-events: none;
  }

  /* ---------- Mode: scroll (touch, small screens) ---------- */
  .hrail.is-ready[data-mode='scroll'] .hrail__scroller {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-inline: calc(50% - var(--hr-pitch) / 2);
    box-sizing: border-box;
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__scroller::-webkit-scrollbar {
    display: none;
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__track {
    display: flex;
    width: max-content;
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__item {
    flex: 0 0 var(--hr-pitch);
    width: var(--hr-pitch);
    scroll-snap-align: center;
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__slide {
    will-change: transform;
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__link {
    pointer-events: none;
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__hit {
    pointer-events: auto;
  }

  /* ---------- The rod ---------- */
  .hrail__rod {
    display: none;
    position: absolute;
    top: calc(var(--hr-hook) - 3px);
    height: 6px;
    border-radius: 6px;
    background: linear-gradient(180deg, #fbfaf8 0%, #d3d1cc 40%, #8d8b86 100%);
    box-shadow: 0 10px 14px -8px rgba(0, 0, 0, 0.35);
    transform-origin: left center;
    pointer-events: none;
  }

  .hrail__rod::before,
  .hrail__rod::after {
    content: '';
    position: absolute;
    top: -7px;
    width: 8px;
    height: 20px;
    border-radius: 3px;
    background: linear-gradient(90deg, #dedcd7, #98968f);
    box-shadow: 0 6px 8px -4px rgba(0, 0, 0, 0.3);
  }
  .hrail__rod::before {
    left: -4px;
  }
  .hrail__rod::after {
    right: -4px;
  }

  .hrail.is-ready .hrail__rod {
    display: block;
  }

  .hrail.is-ready[data-mode='rail'] .hrail__rod {
    left: 50%;
    width: calc(var(--hr-track-w, 100%) + 56px);
    margin-left: calc((var(--hr-track-w, 100%) + 56px) / -2);
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__rod {
    left: 0;
    width: 100%;
    border-radius: 0;
  }
  .hrail.is-ready[data-mode='scroll'] .hrail__rod::before,
  .hrail.is-ready[data-mode='scroll'] .hrail__rod::after {
    display: none;
  }

  /* ---------- Spotlight (a soft pool of light behind the active piece) ---------- */
  .hrail__spot {
    position: absolute;
    top: -6%;
    left: 0;
    width: calc(var(--hr-h) * 1.25);
    height: calc(var(--hr-h) * 1.35);
    margin-left: calc(var(--hr-h) * -0.625);
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .hrail.is-ready[data-mode='scroll'] .hrail__spot {
    left: 50%;
    opacity: 1;
  }

  /* ---------- Intro: rod draws, pieces drop on ---------- */
  .hrail.is-ready:not(.is-in) .hrail__link {
    opacity: 0;
  }

  .hrail.is-ready:not(.is-in) .hrail__rod {
    transform: scaleX(0);
  }

  .hrail.is-ready.is-in .hrail__rod {
    animation: hrail-rod 0.9s var(--hr-ease) both;
  }

  .hrail.is-ready.is-in .hrail__link {
    animation: hrail-drop 1s var(--hr-ease) both;
    animation-delay: calc(0.25s + var(--i) * 55ms);
  }

  @keyframes hrail-rod {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  @keyframes hrail-drop {
    from {
      opacity: 0;
      transform: translateY(-26px) rotate(2.5deg);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .hrail__item.is-lifted .hrail__link {
    visibility: hidden;
  }

  /* ---------- Label under the rail ---------- */
  .hrail__label {
    display: grid;
    justify-items: center;
    gap: 0.35rem;
    width: min(1320px, 100% - 2 * var(--hr-gutter));
    min-height: 5.4rem;
    margin: clamp(1.25rem, 3vw, 2rem) auto 0;
    text-align: center;
  }

  .hrail__name {
    margin: 0;
    font-family: var(--font-display, inherit);
    font-size: clamp(1rem, 0.6vw + 0.85rem, 1.3rem);
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .hrail__mask {
    display: block;
    overflow: hidden;
    padding-block: 0.12em;
  }

  .hrail__mask > span {
    display: block;
  }

  .hrail__meta {
    display: flex;
    justify-content: center;
    gap: 0;
    min-height: 1.3em;
    margin: 0;
    overflow: hidden;
    color: var(--color-text-muted, rgba(0, 0, 0, 0.62));
    font-size: 0.875rem;
  }

  .hrail__meta > span {
    display: inline-block;
  }

  .hrail__meta > span:empty {
    display: none;
  }

  .hrail__meta > span:not(:empty) + span:not(:empty) {
    margin-left: 1.1rem;
    color: var(--hr-ink, #111);
  }

  .hrail__hint {
    margin: 0;
    color: var(--color-text-subtle, rgba(0, 0, 0, 0.5));
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 0.68rem;
  }

  .hrail__foot {
    display: flex;
    justify-content: center;
    margin-top: 1.25rem;
  }

  .hrail__cta {
    gap: 0.5rem;
  }



  @media (max-width: 749px) {
    .hrail__foot {
      padding-inline: var(--hr-gutter);
    }
    .hrail__cta {
      flex: 1 1 auto;
      justify-content: center;
      min-height: 48px;
    }
  }

  /* ---------- Quick look (dialog) ---------- */
  html.hrail-lock {
    overflow: hidden;
  }

  .hrail-ql {
    --ql-top: clamp(56px, 8svh, 84px);
    --ql-h: min(58svh, 640px, 115vw);
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    background: transparent;
    color: var(--hr-ink, #111);
  }

  .hrail-ql:not([open]) {
    display: none;
  }

  .hrail-ql::backdrop {
    background: transparent;
  }

  .hrail-ql__wall {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--hr-bg, #f4f2ee) 88%, transparent);
    -webkit-backdrop-filter: blur(22px);
    backdrop-filter: blur(22px);
  }

  .hrail-ql__thread {
    position: absolute;
    top: 0;
    left: 50%;
    width: 1px;
    height: var(--ql-top);
    background: color-mix(in srgb, var(--hr-ink, #111) 38%, transparent);
    transform-origin: top;
  }

  .hrail-ql__layout {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr;
    justify-items: center;
    height: 100%;
    padding: var(--ql-top) 1rem clamp(1rem, 3svh, 2rem);
    box-sizing: border-box;
    overflow-y: auto;
  }

  .hrail-ql__stage {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .hrail-ql__garment {
    position: relative;
    height: var(--ql-h);
    aspect-ratio: 4 / 5;
    perspective: 1500px;
    transform-origin: 50% 0;
    touch-action: pan-y;
    cursor: grab;
    user-select: none;
  }

  .hrail-ql__garment:active {
    cursor: grabbing;
  }

  .hrail-ql__spin {
    position: absolute;
    inset: 0;
    transform-origin: 50% 0;
    transform-style: preserve-3d;
  }

  .hrail-ql__face,
  .hrail-ql__side {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: 50% 0;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .hrail-ql__face {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .hrail-ql__face--back {
    transform: rotateY(180deg);
  }

  .hrail-ql__side {
    opacity: 0;
  }

  .hrail-ql__info {
    width: min(100%, 32rem);
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 0.5rem;
    padding-top: 1.1rem;
    text-align: center;
  }

  .hrail-ql__counter {
    display: inline-flex;
    align-items: center;
    gap: 0.9rem;
    color: var(--color-text-subtle, rgba(0, 0, 0, 0.5));
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.7rem;
  }

  .hrail-ql__step,
  .hrail-ql__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .hrail-ql__step {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--hr-ink, #111) 18%, transparent);
    color: var(--hr-ink, #111);
    transition: background-color 160ms ease, border-color 160ms ease, transform 160ms var(--hr-ease);
  }

  .hrail-ql__step:active {
    transform: scale(0.94);
  }

  .hrail-ql__close {
    position: absolute;
    top: max(1rem, env(safe-area-inset-top));
    right: 1rem;
    z-index: 2;
    min-height: 44px;
    padding-inline: 0.75rem;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
  }

  .hrail-ql__name {
    margin: 0;
    font-family: var(--font-display, inherit);
    font-size: clamp(1.25rem, 2vw + 0.6rem, 1.9rem);
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.15;
  }

  .hrail-ql__sub {
    display: flex;
    justify-content: center;
    margin: 0;
    color: var(--color-text-muted, rgba(0, 0, 0, 0.62));
    font-size: 0.9rem;
  }

  .hrail-ql__sub > span:empty {
    display: none;
  }

  .hrail-ql__sub > span:not(:empty) + span:not(:empty) {
    margin-left: 1.1rem;
    color: var(--hr-ink, #111);
  }

  .hrail-ql__seg {
    position: relative;
    display: inline-grid;
    grid-template-columns: 1fr 1fr;
    margin-top: 0.4rem;
    padding: 3px;
    border: 1px solid color-mix(in srgb, var(--hr-ink, #111) 16%, transparent);
    border-radius: 999px;
  }

  .hrail-ql__seg button {
    position: relative;
    z-index: 1;
    min-width: 5.5rem;
    min-height: 40px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: color 220ms ease;
  }

  .hrail-ql__seg button[aria-pressed='true'] {
    color: var(--hr-bg, #fff);
  }

  .hrail-ql__pill {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: calc(50% - 3px);
    border-radius: 999px;
    background: var(--hr-ink, #111);
    transition: transform 420ms var(--hr-ease);
  }

  .hrail-ql__seg[data-face='back'] .hrail-ql__pill {
    transform: translateX(100%);
  }

  .hrail-ql:not(.has-back) .hrail-ql__seg {
    display: none;
  }

  .hrail-ql__cta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 0.6rem;
  }

  .hrail-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 48px;
    padding: 0 1.5rem;
    border: 1px solid var(--hr-ink, #111);
    border-radius: 999px;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    text-decoration: none;
    transition: background-color 180ms ease, color 180ms ease, transform 160ms var(--hr-ease);
  }

  .hrail-btn--solid {
    background: var(--hr-ink, #111);
    color: var(--hr-bg, #fff);
  }

  .hrail-btn--ghost {
    background: transparent;
    color: var(--hr-ink, #111);
  }

  .hrail-btn:active {
    transform: scale(0.98);
  }

  .hrail-ql :focus-visible {
    outline: 2px solid var(--color-focus, currentColor);
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .hrail-btn--solid:hover {
      background: transparent;
      color: var(--hr-ink, #111);
    }
    .hrail-btn--ghost:hover {
      background: var(--hr-ink, #111);
      color: var(--hr-bg, #fff);
    }
    .hrail-ql__step:hover {
      background: color-mix(in srgb, var(--hr-ink, #111) 8%, transparent);
    }
  }

  @media (max-width: 749px) {
    .hrail-ql__cta {
      width: 100%;
      flex-direction: column;
    }
    .hrail-btn {
      width: 100%;
    }
  }

  /* ---------- Reduced motion ---------- */
  @media (prefers-reduced-motion: reduce) {
    .hrail.is-ready .hrail__link,
    .hrail.is-ready .hrail__rod {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .hrail-ql__pill,
    .hrail-btn,
    .hrail-ql__step {
      transition: none;
    }
  }
{% endstylesheet %}

<script>
  (function () {
    if (customElements.get('hanger-rail')) return;

    // ----- Tuning knobs (safe to change) -----
    var FILL = 0.78; // visible garment width / image canvas width
    var MAX_PITCH = 132; // px: widest gap between hangers on desktop
    var MIN_PITCH = 54; // px: below this, switch to swipe mode
    var REST_TURN = 84; // deg: how far a hanger is turned at rest
    var SPRING_K = 170; // turn spring: stiffness
    var SPRING_C = 20; // turn spring: damping
    var SWAY_K = 60; // sway spring: stiffness
    var SWAY_C = 7; // sway spring: damping (low = more wobble)
    var EASE = 'cubic-bezier(0.2, 0.85, 0.2, 1)';

    function clamp(v, a, b) {
      return Math.min(b, Math.max(a, v));
    }
    function lerp(a, b, t) {
      return a + (b - a) * t;
    }
    function smooth(e0, e1, x) {
      var t = clamp((x - e0) / (e1 - e0), 0, 1);
      return t * t * (3 - 2 * t);
    }
    function pad2(n) {
      return n < 10 ? '0' + n : String(n);
    }

    class HangerRail extends HTMLElement {
      connectedCallback() {
        if (this._ready) return;
        var self = this;
        var $ = function (s) {
          return self.querySelector(s);
        };

        this.section = this.closest('.hrail');
        this.stage = $('[data-hr-stage]');
        this.scroller = $('[data-hr-scroller]');
        this.track = $('[data-hr-track]');
        this.spot = $('[data-hr-spot]');
        this.nowEl = $('[data-hr-now]');
        this.nameEl = $('[data-hr-name]');
        this.subEl = $('[data-hr-sub]');
        this.priceEl = $('[data-hr-price]');
        this.hintEl = $('[data-hr-hint]');
        this.liveEl = $('[data-hr-live]');

        var lis = this.querySelectorAll('[data-hr-item]');
        this.n = lis.length;
        if (!this.n || !this.stage || !this.section) return;
        this._ready = true;

        this.items = Array.prototype.map.call(lis, function (li) {
          var link = li.querySelector('.hrail__link');
          return {
            el: li,
            link: link,
            slide: li.querySelector('.hrail__slide'),
            hit: li.querySelector('.hrail__hit'),
            swing: li.querySelector('.hrail__swing'),
            turn: li.querySelector('.hrail__turn'),
            front: li.querySelector('.hrail__img--front'),
            side: li.querySelector('.hrail__img--side'),
            data: link ? link.dataset : {},
            a: 0, v: 0, // turn amount (0 = side on, 1 = facing you) and its speed
            ang: 0, angV: 0, // sway angle and its speed
            tx: 0, ptx: null, // x position now and last frame
            tiltX: 0, tiltY: 0,
            z: -1, fo: -1, so: -1, hw: -1 // cached style values to skip useless writes
          };
        });

        this.idleTitle = this.dataset.idleTitle || '';
        this.hintHover = this.dataset.hintHover || '';
        this.hintTouch = this.dataset.hintTouch || '';
        this.swayOn = this.dataset.sway !== 'false';
        this.attractOn = this.dataset.attract !== 'false';
        this.wa = this.dataset.wa || '';

        this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 750px)');

        this.mode = '';
        this.target = -1; // which piece is turned to face you (rail mode)
        this.active = -2; // which piece the label shows
        this.cur = 0; // keyboard focus index
        this.visible = false;
        this.scrolling = false;
        this.introDone = false;
        this.ptr = null;
        this.raf = 0;
        this.last = 0;
        this.spotX = 0;
        this.spotO = 0;
        this.attractCount = 0;
        this.userActed = false;

        this.initQuickLook();
        this.bind();

        this.items.forEach(function (it, i) {
          if (it.link) it.link.tabIndex = i === 0 ? 0 : -1;
        });

        this.section.classList.add('is-ready');
        this.chooseMode();
        this.onActive(-1);
        this.tick(performance.now());
      }

      disconnectedCallback() {
        if (this.raf) cancelAnimationFrame(this.raf);
        clearTimeout(this.leaveT);
        clearTimeout(this.attractT);
        clearTimeout(this.scrollT);
        if (this.ro) this.ro.disconnect();
        if (this.io) this.io.disconnect();
        if (this.fine) this.fine.removeEventListener('change', this._onMq);
        if (this.reduce) this.reduce.removeEventListener('change', this._onMq);
        document.removeEventListener('shopify:block:select', this._onSelect);
        document.removeEventListener('shopify:block:deselect', this._onDeselect);
        document.documentElement.classList.remove('hrail-lock');
      }

      // ---------- events ----------
      bind() {
        var self = this;

        this.stage.addEventListener('pointermove', function (e) {
          if (self.mode !== 'rail' || e.pointerType === 'touch' || self.qlOpen) return;
          var r = self.stage.getBoundingClientRect();
          self.ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
          self.userAct();
          clearTimeout(self.leaveT);
          var inside = self.ptr.x >= self.trackLeft - 24 && self.ptr.x <= self.trackLeft + self.trackW + 24;
          self.setTarget(inside ? self.hitTest(self.ptr.x) : -1);
          self.request();
        });

        this.stage.addEventListener('pointerleave', function (e) {
          if (self.mode !== 'rail' || e.pointerType === 'touch' || self.qlOpen) return;
          self.ptr = null;
          clearTimeout(self.leaveT);
          self.leaveT = setTimeout(function () {
            if (!self.focusInside()) self.setTarget(-1);
          }, 140);
        });

        this.track.addEventListener('click', function (e) {
          var link = e.target.closest('.hrail__link');
          if (!link) return;
          if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          var i = self.indexOfLink(link);
          if (i < 0) return;
          e.preventDefault();
          self.userAct();
          if (self.mode === 'scroll' && self.items[i].a < 0.6) {
            self.scrollToIndex(i);
            return;
          }
          self.openQL(i);
        });

        this.track.addEventListener('focusin', function (e) {
          var link = e.target.closest('.hrail__link');
          var i = link ? self.indexOfLink(link) : -1;
          if (i < 0) return;
          self.setRoving(i);
          if (self.mode === 'rail') self.setTarget(i);
          else if (self.items[i].a < 0.6) self.scrollToIndex(i);
          if (self.liveEl) self.liveEl.textContent = self.items[i].data.title || '';
        });

        this.track.addEventListener('focusout', function () {
          if (self.mode === 'rail' && !self.ptr) {
            setTimeout(function () {
              if (!self.focusInside() && !self.qlOpen) self.setTarget(-1);
            }, 0);
          }
        });

        this.track.addEventListener('keydown', function (e) {
          var i = self.cur;
          if (e.key === 'ArrowRight') i = Math.min(self.n - 1, i + 1);
          else if (e.key === 'ArrowLeft') i = Math.max(0, i - 1);
          else if (e.key === 'Home') i = 0;
          else if (e.key === 'End') i = self.n - 1;
          else return;
          e.preventDefault();
          self.userAct();
          self.setRoving(i);
          self.items[i].link.focus({ preventScroll: true });
        });

        this.scroller.addEventListener(
          'scroll',
          function () {
            if (self.mode !== 'scroll') return;
            self.scrolling = true;
            clearTimeout(self.scrollT);
            self.scrollT = setTimeout(function () {
              self.scrolling = false;
              self.request();
            }, 140);
            self.request();
          },
          { passive: true }
        );

        this.ro = new ResizeObserver(function () {
          self.chooseMode();
          self.request();
        });
        this.ro.observe(this.stage);

        this.io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              self.visible = en.isIntersecting;
              if (self.visible) {
                self.playIntro();
                self.request();
                self.startAttract();
              } else {
                clearTimeout(self.attractT);
              }
            });
          },
          { threshold: 0.25 }
        );
        this.io.observe(this.section);

        this._onMq = function () {
          self.chooseMode();
          self.request();
        };
        this.fine.addEventListener('change', this._onMq);
        this.reduce.addEventListener('change', this._onMq);

        // Shopify theme editor: select a block to preview it
        this._onSelect = function (e) {
          var li = e.target && e.target.closest ? e.target.closest('[data-hr-item]') : null;
          if (!li || !self.contains(li)) return;
          var i = Array.prototype.indexOf.call(self.track.children, li);
          if (i < 0) return;
          self.userAct();
          if (self.mode === 'rail') self.setTarget(i);
          else self.scrollToIndex(i);
        };
        this._onDeselect = function () {
          if (self.mode === 'rail') self.setTarget(-1);
        };
        document.addEventListener('shopify:block:select', this._onSelect);
        document.addEventListener('shopify:block:deselect', this._onDeselect);
      }

      indexOfLink(link) {
        for (var i = 0; i < this.n; i++) if (this.items[i].link === link) return i;
        return -1;
      }

      focusInside() {
        return this.track.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
      }

      setRoving(i) {
        this.cur = i;
        this.items.forEach(function (it, k) {
          if (it.link) it.link.tabIndex = k === i ? 0 : -1;
        });
      }

      userAct() {
        if (this.userActed) return;
        this.userActed = true;
        clearTimeout(this.attractT);
        if (this.attractRunning) {
          this.attractRunning = false;
          this.setTarget(-1);
        }
      }

      // ---------- mode + measuring ----------
      chooseMode() {
        var want = this.fine.matches ? 'rail' : 'scroll';
        if (want !== this.mode) {
          this.mode = want;
          this.section.setAttribute('data-mode', want);
          this.items.forEach(function (it) {
            it.a = 0;
            it.v = 0;
            it.ptx = null;
            it.el.style.transform = '';
            if (it.slide) it.slide.style.transform = '';
          });
          if (want === 'scroll') {
            this.target = -1;
            if (this.spot) {
              this.spot.style.transform = '';
              this.spot.style.opacity = '';
            }
            this.spotO = 0;
          }
        }
        this.measure();
        if (this.mode === 'rail' && this.P < MIN_PITCH) {
          this.mode = 'scroll';
          this.section.setAttribute('data-mode', 'scroll');
          this.target = -1;
          this.measure();
        }
        this.setHint();
      }

      measure() {
        var it0 = this.items[0];
        var Wc = it0.link.offsetWidth;
        this.F = Wc * FILL;
        var W = this.stage.clientWidth;
        if (this.mode === 'rail') {
          var maxTrack = (this.n - 1) * MAX_PITCH + this.F;
          var track = Math.min(W - 24, maxTrack);
          this.P = this.n > 1 ? (track - this.F) / (this.n - 1) : this.F;
          this.trackW = track;
          this.trackLeft = (W - track) / 2;
          this.M = (this.F - this.P) / 2;
          this.section.style.setProperty('--hr-pitch', this.P.toFixed(2) + 'px');
          this.section.style.setProperty('--hr-track-w', track.toFixed(2) + 'px');
        } else {
          this.section.style.removeProperty('--hr-pitch');
          this.section.style.removeProperty('--hr-track-w');
          this.P = it0.el.getBoundingClientRect().width || 60;
          this.padStart = parseFloat(getComputedStyle(this.scroller).paddingLeft) || 0;
        }
        this.half = (this.F - this.P) / 2;
        this.H = it0.link.offsetHeight;
      }

      setHint() {
        if (!this.hintEl) return;
        var t = this.mode === 'rail' ? this.hintHover : this.hintTouch;
        if (t) this.hintEl.textContent = t;
      }

      scrollToIndex(i) {
        if (this.mode !== 'scroll') return;
        this.scroller.scrollTo({ left: i * this.P, behavior: this.reduce.matches ? 'auto' : 'smooth' });
      }

      // ---------- targeting (rail mode) ----------
      setTarget(i) {
        if (i === this.target) return;
        this.target = i;
        this.request();
      }

      centerOf(i) {
        return this.trackLeft + this.items[i].tx + this.P / 2;
      }

      hitTest(x) {
        var cur = this.target;
        // Stay on the open piece while the pointer is still over it. Stops flicker.
        if (cur >= 0 && Math.abs(x - this.centerOf(cur)) <= this.F * 0.52) return cur;
        var best = 0;
        var bd = 1e9;
        for (var i = 0; i < this.n; i++) {
          var d = Math.abs(x - this.centerOf(i));
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        return best;
      }

      // ---------- intro + attract ----------
      playIntro() {
        if (this.introDone) return;
        this.introDone = true;
        this.section.classList.add('is-in');
      }

      startAttract() {
        var self = this;
        if (!this.attractOn || this.userActed || this.reduce.matches || this.mode !== 'rail') return;
        if (this.attractT || this.attractRunning) return;
        var idx = Math.floor(this.n / 3);
        var step = function () {
          self.attractT = 0;
          if (self.userActed || self.mode !== 'rail' || self.attractCount >= 7) return;
          if (!self.visible) return;
          self.attractRunning = true;
          self.attractCount++;
          self.setTarget(idx % self.n);
          idx += 2;
          self.attractT = setTimeout(function () {
            if (self.userActed) return;
            self.setTarget(-1);
            self.attractT = setTimeout(step, 650);
          }, 1900);
        };
        this.attractT = setTimeout(step, 1900);
      }

      // ---------- animation loop ----------
      request() {
        if (this.raf) return;
        var self = this;
        this.last = 0;
        this.raf = requestAnimationFrame(function (t) {
          self.tick(t);
        });
      }

      tick(now) {
        this.raf = 0;
        var self = this;
        var dt = this.last ? Math.min(0.034, (now - this.last) / 1000) : 0.016;
        if (dt < 0.001) dt = 0.001;
        this.last = now;
        var reduce = this.reduce.matches;
        var animating = false;
        var n = this.n;
        var items = this.items;
        var i, it;

        // 1) how far each piece is turned toward you
        if (this.mode === 'rail') {
          for (i = 0; i < n; i++) {
            it = items[i];
            var tg = i === this.target ? 1 : 0;
            if (reduce) {
              it.a = tg;
              it.v = 0;
            } else {
              it.v += ((tg - it.a) * SPRING_K - it.v * SPRING_C) * dt;
              it.a += it.v * dt;
              if (Math.abs(tg - it.a) < 0.0008 && Math.abs(it.v) < 0.01) {
                it.a = tg;
                it.v = 0;
              } else animating = true;
            }
          }
        } else {
          var cx = this.scroller.scrollLeft + this.scroller.clientWidth / 2;
          for (i = 0; i < n; i++) {
            var dx = this.padStart + (i + 0.5) * this.P - cx;
            items[i].a = smooth(0, 1, 1 - Math.abs(dx) / this.P);
          }
          if (this.scrolling) animating = true;
        }

        // 2) layout: the open piece grows, neighbours step aside
        var total = 0;
        for (i = 0; i < n; i++) total += clamp(items[i].a, 0, 1.08);
        var before = 0;
        var best = -1;
        var bestA = 0.5;

        for (i = 0; i < n; i++) {
          it = items[i];
          var ac = clamp(it.a, 0, 1.08);
          var after = total - before - ac;
          var shift = this.half * (before - after);
          before += ac;
          var tx = (this.mode === 'rail' ? this.M + i * this.P : 0) + shift;
          if (it.a > bestA) {
            bestA = it.a;
            best = i;
          }

          // sway: pieces lean away from the way they move, then swing back
          var vx = it.ptx === null ? 0 : (tx - it.ptx) / dt;
          it.ptx = tx;
          it.tx = tx;
          if (reduce) {
            it.ang = 0;
            it.angV = 0;
          } else {
            var lean = clamp(-vx * 0.0055, -5, 5);
            var idle = this.swayOn ? Math.sin((now / 1000) * 0.85 + i * 0.9) * 0.55 : 0;
            it.angV += ((lean + idle - it.ang) * SWAY_K - it.angV * SWAY_C) * dt;
            it.ang += it.angV * dt;
            if (this.swayOn) animating = true;
            else if (Math.abs(it.angV) > 0.02 || Math.abs(lean - it.ang) > 0.02) animating = true;
          }

          // tilt toward the pointer (only the open piece)
          var tiltYt = 0;
          var tiltXt = 0;
          if (this.mode === 'rail' && this.ptr && i === this.target && !reduce) {
            tiltYt = clamp((this.ptr.x - this.centerOf(i)) / (this.F / 2), -1, 1) * 7;
            tiltXt = clamp((this.ptr.y - this.H / 2) / (this.H / 2), -1, 1) * -3.5;
          }
          var k = Math.min(1, dt * 9);
          it.tiltY += (tiltYt - it.tiltY) * k;
          it.tiltX += (tiltXt - it.tiltX) * k;
          if (Math.abs(tiltYt - it.tiltY) > 0.02 || Math.abs(tiltXt - it.tiltX) > 0.02) animating = true;

          // write to the page
          // rail mode moves the <li>. Swipe mode moves the inner slide, so scroll-snap points never move.
          (this.mode === 'rail' ? it.el : it.slide).style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)';
          if (it.swing) it.swing.style.transform = 'rotate(' + it.ang.toFixed(3) + 'deg)';

          var turn = clamp(1 - it.a, -0.1, 1);
          var theta = turn * REST_TURN + it.tiltY;
          var s = lerp(0.92, 1, clamp(it.a, 0, 1));
          if (it.turn) {
            it.turn.style.transform =
              'perspective(1200px) rotateX(' + it.tiltX.toFixed(2) + 'deg) rotateY(' + theta.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
          }

          var fo = 1;
          var so = 0;
          if (it.side) {
            so = smooth(0.5, 0.82, turn);
            fo = 1 - smooth(0.66, 0.92, turn);
          }
          if (it.front && Math.abs(fo - it.fo) > 0.002) {
            it.front.style.opacity = fo.toFixed(3);
            it.fo = fo;
          }
          if (it.side && Math.abs(so - it.so) > 0.002) {
            it.side.style.opacity = so.toFixed(3);
            it.so = so;
          }

          var z = it.a > 0.45 ? 5 : 1;
          if (z !== it.z) {
            it.el.style.zIndex = z;
            it.z = z;
          }

          var hw = Math.round(lerp(Math.max(this.P * 0.78, 30), this.F, clamp(it.a, 0, 1)));
          if (it.hit && hw !== it.hw) {
            it.hit.style.setProperty('--hw', hw + 'px');
            it.hw = hw;
          }
        }

        // 3) spotlight follows the open piece
        if (this.mode === 'rail' && this.spot) {
          var sx = this.spotX;
          var so2 = 0;
          if (this.target >= 0) {
            var cxs = this.centerOf(this.target);
            sx = this.spotO < 0.05 ? cxs : this.spotX + (cxs - this.spotX) * Math.min(1, dt * 7);
            so2 = 1;
          }
          this.spotX = sx;
          this.spotO += (so2 - this.spotO) * Math.min(1, dt * 6);
          this.spot.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,0,0)';
          this.spot.style.opacity = this.spotO.toFixed(3);
          if (Math.abs(so2 - this.spotO) > 0.01 || Math.abs((this.target >= 0 ? this.centerOf(this.target) : sx) - sx) > 0.5) animating = true;
        }

        // 4) which piece is the label talking about?
        var act = this.mode === 'rail' ? this.target : best;
        if (act !== this.active) this.onActive(act);

        if (animating && this.visible) this.request();
      }

      onActive(idx) {
        this.active = idx;
        var it = idx >= 0 ? this.items[idx] : null;
        this.items.forEach(function (o, k) {
          o.el.classList.toggle('is-active', k === idx);
        });
        if (it && this.nowEl) this.nowEl.textContent = pad2(idx + 1);
        this.swap(this.nameEl, it ? it.data.title : this.idleTitle);
        this.swap(this.subEl, it ? it.data.sub : '');
        this.swap(this.priceEl, it ? it.data.price : '');
      }

      swap(el, text) {
        if (!el) return;
        text = text || '';
        if (el.textContent === text) return;
        el.textContent = text;
        if (this.reduce.matches || !text) return;
        el.animate(
          [
            { transform: 'translateY(110%)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          { duration: 460, easing: EASE }
        );
      }

      // =====================================================
      // Quick look
      // =====================================================
      initQuickLook() {
        var self = this;
        var $ = function (s) {
          return self.querySelector(s);
        };
        this.ql = $('[data-ql]');
        if (!this.ql) return;
        this.qWall = $('[data-ql-wall]');
        this.qThread = $('[data-ql-thread]');
        this.qGarment = $('[data-ql-garment]');
        this.qSpin = $('[data-ql-spin]');
        this.qFront = $('[data-ql-front]');
        this.qBack = $('[data-ql-back]');
        this.qSide = $('[data-ql-side]');
        this.qNum = $('[data-ql-num]');
        this.qName = $('[data-ql-name]');
        this.qSub = $('[data-ql-sub]');
        this.qPrice = $('[data-ql-price]');
        this.qSeg = $('[data-ql-seg]');
        this.qView = $('[data-ql-view]');
        this.qWa = $('[data-ql-wa]');
        this.qInfo = $('[data-ql-info]');
        this.qClose = $('[data-ql-close]');
        this.qOpen = false;
        this.qIndex = 0;
        this.spin = { a: 0, v: 0, t: 0, drag: false, raf: 0, last: 0, hasBack: false, hasSide: false };

        this.qClose.addEventListener('click', function () {
          self.closeQL();
        });
        this.qWall.addEventListener('click', function () {
          self.closeQL();
        });
        this.ql.addEventListener('cancel', function (e) {
          e.preventDefault();
          self.closeQL();
        });
        this.querySelector('[data-ql-prev]').addEventListener('click', function () {
          self.goQL(-1);
        });
        this.querySelector('[data-ql-next]').addEventListener('click', function () {
          self.goQL(1);
        });
        this.ql.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowLeft') self.goQL(-1);
          else if (e.key === 'ArrowRight') self.goQL(1);
        });
        Array.prototype.forEach.call(this.qSeg.querySelectorAll('[data-face-btn]'), function (b) {
          b.addEventListener('click', function () {
            var wantBack = b.dataset.faceBtn === 'back';
            var isBack = Math.cos((self.spin.t * Math.PI) / 180) < 0;
            if (wantBack === isBack) return;
            self.spin.t += 180;
            self.runSpin();
          });
        });

        // drag to spin
        var g = this.qGarment;
        g.addEventListener('pointerdown', function (e) {
          if (e.button > 0) return;
          var s = self.spin;
          s.drag = true;
          s.sx = e.clientX;
          s.sa = s.a;
          s.lx = e.clientX;
          s.lt = performance.now();
          s.vel = 0;
          g.setPointerCapture(e.pointerId);
        });
        g.addEventListener('pointermove', function (e) {
          var s = self.spin;
          if (!s.drag) return;
          var raw = s.sa + (e.clientX - s.sx) * 0.55;
          if (!s.hasBack) raw = clamp(raw, -28, 28);
          var now = performance.now();
          var dtm = Math.max(1, now - s.lt);
          s.vel = ((e.clientX - s.lx) * 0.55) / (dtm / 1000);
          s.lx = e.clientX;
          s.lt = now;
          s.a = raw;
          self.setSpinDom(s.a);
        });
        var up = function () {
          var s = self.spin;
          if (!s.drag) return;
          s.drag = false;
          var proj = s.a + clamp(s.vel, -900, 900) * 0.16;
          s.t = s.hasBack ? Math.round(proj / 180) * 180 : 0;
          self.runSpin();
        };
        g.addEventListener('pointerup', up);
        g.addEventListener('pointercancel', up);
      }

      fillQL(i) {
        var it = this.items[i];
        var d = it.data;
        this.qIndex = i;
        this.qNum.textContent = pad2(i + 1);
        this.qName.textContent = d.title || '';
        this.qSub.textContent = d.sub || '';
        this.qPrice.textContent = d.price || '';
        this.qView.href = it.link.href;
        if (this.qWa) {
          var abs = new URL(it.link.getAttribute('href'), window.location.href).href;
          var msg = 'Hi! I want to order: ' + (d.title || '') + ' ' + abs;
          this.qWa.href = 'https://wa.me/' + this.wa + '?text=' + encodeURIComponent(msg);
        }
        // show the small rail image first (already loaded), then swap to the big one
        var small = it.front ? it.front.currentSrc || it.front.src : '';
        var big = d.front || small;
        var self = this;
        this.qFront.src = small || big;
        if (big && big !== small) {
          var hi = new Image();
          hi.src = big;
          (hi.decode ? hi.decode() : Promise.resolve()).then(
            function () {
              if (self.qIndex === i) self.qFront.src = big;
            },
            function () {}
          );
        }
        if (d.back) this.qBack.src = d.back;
        else this.qBack.removeAttribute('src');
        if (d.side) this.qSide.src = d.side;
        else this.qSide.removeAttribute('src');
        this.spin.hasBack = !!d.back;
        this.spin.hasSide = !!d.side;
        this.ql.classList.toggle('has-back', !!d.back);
        this.spin.a = 0;
        this.spin.v = 0;
        this.spin.t = 0;
        this.setSpinDom(0);
        // warm the neighbours
        [-1, 1].forEach(function (dir) {
          var nb = self.items[(i + dir + self.n) % self.n];
          if (nb && nb.data.front) new Image().src = nb.data.front;
        });
      }

      cancelQLAnims() {
        [this.qGarment, this.qWall, this.qThread, this.qInfo, this.qClose].forEach(function (el) {
          el.getAnimations().forEach(function (a) {
            a.cancel();
          });
        });
      }

      revealInfo() {
        if (this.reduce.matches) return;
        Array.prototype.forEach.call(this.qInfo.querySelectorAll('[data-rv]'), function (el, k) {
          el.animate(
            [
              { opacity: 0, transform: 'translateY(16px)' },
              { opacity: 1, transform: 'none' }
            ],
            { duration: 640, delay: 180 + k * 70, easing: EASE, fill: 'backwards' }
          );
        });
      }

      flip(from, dir) {
        var g = this.qGarment;
        var to = g.getBoundingClientRect();
        if (!to.width || !from.width) return Promise.resolve();
        var s = from.height / to.height;
        var dx = from.left + from.width / 2 - (to.left + to.width / 2);
        var dy = from.top - to.top;
        var frames = [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }, { transform: 'none' }];
        if (dir === 'out') frames.reverse();
        var anim = g.animate(frames, {
          duration: dir === 'in' ? 780 : 540,
          easing: dir === 'in' ? 'cubic-bezier(0.2, 0.85, 0.2, 1)' : 'cubic-bezier(0.55, 0, 0.7, 0.3)',
          fill: 'both'
        });
        return anim.finished.then(
          function () {},
          function () {}
        );
      }

      openQL(i) {
        if (!this.ql || this.qOpen) return;
        this.qOpen = true;
        this.qlOpener = this.items[i].link;
        this.userAct();
        this.cancelQLAnims();
        this.fillQL(i);
        var it = this.items[i];
        var from = (it.front || it.turn).getBoundingClientRect();
        document.documentElement.classList.add('hrail-lock');
        this.ql.showModal();
        it.el.classList.add('is-lifted');
        if (this.mode === 'rail') this.setTarget(i);

        if (!this.reduce.matches) {
          this.qWall.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out', fill: 'backwards' });
          this.qThread.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, easing: EASE, fill: 'backwards' });
          this.qClose.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300, fill: 'backwards' });
          this.flip(from, 'in');
          this.revealInfo();
        }
      }

      goQL(d) {
        if (!this.qOpen || this.qBusy) return;
        var self = this;
        var next = (this.qIndex + d + this.n) % this.n;
        this.items[this.qIndex].el.classList.remove('is-lifted');
        this.items[next].el.classList.add('is-lifted');
        if (this.mode === 'rail') this.setTarget(next);
        else this.scrollToIndex(next);
        this.setRoving(next);

        if (this.reduce.matches) {
          this.fillQL(next);
          return;
        }
        this.qBusy = true;
        var g = this.qGarment;
        var out = g.animate(
          [
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(' + -d * 56 + 'px)' }
          ],
          { duration: 200, easing: 'ease-in', fill: 'forwards' }
        );
        var swap = function () {
          self.fillQL(next);
          out.cancel();
          g.animate(
            [
              { opacity: 0, transform: 'translateX(' + d * 56 + 'px)' },
              { opacity: 1, transform: 'none' }
            ],
            { duration: 480, easing: EASE }
          );
          self.revealInfo();
          self.qBusy = false;
        };
        out.finished.then(swap, swap);
      }

      closeQL() {
        if (!this.qOpen || this.qClosing) return;
        var self = this;
        this.qClosing = true;
        var it = this.items[this.qIndex];
        var done = function () {
          self.cancelQLAnims();
          self.ql.close();
          document.documentElement.classList.remove('hrail-lock');
          it.el.classList.remove('is-lifted');
          self.qOpen = false;
          self.qClosing = false;
          self.qBusy = false;
          var op = self.items[self.qIndex].link;
          if (op) op.focus({ preventScroll: true });
          if (self.mode === 'rail' && !self.ptr && !self.focusInside()) self.setTarget(-1);
          self.request();
        };
        if (this.reduce.matches) {
          done();
          return;
        }
        var to = (it.front || it.turn).getBoundingClientRect();
        var onScreen = to.bottom > 0 && to.top < window.innerHeight && to.right > 0 && to.left < window.innerWidth;
        var fade = { duration: 380, easing: 'ease-in', fill: 'forwards' };
        this.qWall.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, delay: 120, easing: 'ease-in', fill: 'forwards' });
        this.qThread.animate([{ opacity: 1 }, { opacity: 0 }], fade);
        this.qInfo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
        this.qClose.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
        var p;
        if (onScreen) p = this.flip(to, 'out');
        else
          p = this.qGarment
            .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })
            .finished.then(
              function () {},
              function () {}
            );
        // safety: always close, even if an animation never reports back
        var finished = false;
        var finish = function () {
          if (finished) return;
          finished = true;
          done();
        };
        p.then(function () {
          setTimeout(finish, 40);
        });
        setTimeout(finish, 1200);
      }

      // ---------- spin (front / back) ----------
      setSpinDom(a) {
        var s = this.spin;
        this.qSpin.style.transform = 'rotateY(' + a.toFixed(2) + 'deg)';
        var sn = Math.abs(Math.sin((a * Math.PI) / 180));
        var so = s.hasSide ? smooth(0.8, 0.99, sn) : 0;
        this.qSide.style.opacity = so.toFixed(3);
        var fo = s.hasSide ? 1 - smooth(0.93, 0.995, sn) : 1;
        this.qFront.style.opacity = fo.toFixed(3);
        this.qBack.style.opacity = fo.toFixed(3);
        // which face is showing? (for the Front / Back switch)
        var back = Math.cos((s.t * Math.PI) / 180) < 0;
        var face = back ? 'back' : 'front';
        if (this.qSeg.dataset.face !== face) {
          this.qSeg.dataset.face = face;
          Array.prototype.forEach.call(this.qSeg.querySelectorAll('[data-face-btn]'), function (b) {
            b.setAttribute('aria-pressed', b.dataset.faceBtn === face ? 'true' : 'false');
          });
        }
      }

      runSpin() {
        var self = this;
        var s = this.spin;
        if (this.reduce.matches) {
          s.a = s.t;
          s.v = 0;
          this.setSpinDom(s.a);
          return;
        }
        if (s.raf) return;
        s.last = 0;
        var step = function (now) {
          s.raf = 0;
          if (s.drag) return;
          var dt = s.last ? Math.min(0.034, (now - s.last) / 1000) : 0.016;
          s.last = now;
          s.v += ((s.t - s.a) * 130 - s.v * 17) * dt;
          s.a += s.v * dt;
          if (Math.abs(s.t - s.a) < 0.05 && Math.abs(s.v) < 0.5) {
            s.a = s.t;
            s.v = 0;
            // keep numbers small: 360 degrees is the same view
            var wrap = Math.round((s.t - 90) / 360) * 360;
            s.a -= wrap;
            s.t -= wrap;
            self.setSpinDom(s.a);
            return;
          }
          self.setSpinDom(s.a);
          s.raf = requestAnimationFrame(step);
        };
        s.raf = requestAnimationFrame(step);
      }
    }

    customElements.define('hanger-rail', HangerRail);
  })();
</script>

{% schema %}
{
  "name": "Hanger Rail",
  "tag": "section",
  "class": "section-hanger-rail",
  "max_blocks": 12,
  "settings": [
    {
      "type": "paragraph",
      "content": "Pieces hang on a rail. Hover (or swipe on mobile) to turn a piece. Click to open a quick look. Add 5 to 12 pieces. Images must be transparent PNG cutouts on a hanger."
    },
    { "type": "header", "content": "Text" },
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "On the rail" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Clean Cuts. Quality Fabrics." },
    { "type": "textarea", "id": "caption", "label": "Caption" },
    { "type": "text", "id": "idle_title", "label": "Text when nothing is selected", "default": "Pick a piece" },
    { "type": "text", "id": "hint_hover", "label": "Hint (desktop)", "default": "Hover to turn. Click to explore." },
    { "type": "text", "id": "hint_touch", "label": "Hint (mobile)", "default": "Swipe the rail. Tap to explore." },
    { "type": "header", "content": "Button under the rail" },
    { "type": "text", "id": "button_label", "label": "Button label", "default": "Shop All Pieces" },
    { "type": "url", "id": "button_link", "label": "Button link" },
    { "type": "header", "content": "Quick look" },
    { "type": "checkbox", "id": "show_price", "label": "Show price (needs a product on the piece)", "default": true },
    { "type": "text", "id": "view_label", "label": "Main button label", "default": "View product" },
    {
      "type": "text",
      "id": "whatsapp_number",
      "label": "WhatsApp number",
      "info": "Country code, numbers only. Example: 923001234567. Leave empty to hide the WhatsApp button."
    },
    { "type": "header", "content": "Motion" },
    { "type": "checkbox", "id": "idle_sway", "label": "Gentle sway on the rail", "default": true },
    { "type": "checkbox", "id": "attract_mode", "label": "Auto-demo on desktop (stops when the visitor moves)", "default": true },
    { "type": "header", "content": "Size and colour" },
    { "type": "range", "id": "rail_height", "label": "Max piece height (desktop)", "min": 320, "max": 560, "step": 20, "unit": "px", "default": 480 },
    { "type": "color", "id": "background_color", "label": "Background", "default": "#F4F2EE" },
    { "type": "color", "id": "text_color", "label": "Text", "default": "#111111" }
  ],
  "blocks": [
    {
      "type": "card",
      "name": "Piece",
      "settings": [
        { "type": "product", "id": "product", "label": "Product (gives name, price, link)" },
        { "type": "image_picker", "id": "image", "label": "Front image (transparent PNG, on hanger)" },
        { "type": "image_picker", "id": "image_side", "label": "Side image (optional, hanging, seen from the side)" },
        { "type": "image_picker", "id": "image_back", "label": "Back image (optional, enables the Back button)" },
        { "type": "text", "id": "title", "label": "Name (leave empty to use the product name)", "default": "Heavyweight Hoodie" },
        { "type": "text", "id": "subtitle", "label": "Small line (fabric or fit)", "default": "Organic Cotton" },
        { "type": "url", "id": "link", "label": "Link (leave empty to use the product link)" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Hanger Rail",
      "settings": {
        "heading": "Clean Cuts. Quality Fabrics.",
        "button_label": "Shop All Pieces"
      },
      "blocks": [
        { "type": "card", "settings": { "title": "Heavyweight Hoodie", "subtitle": "Organic Cotton" } },
        { "type": "card", "settings": { "title": "Poplin Shirt", "subtitle": "Relaxed Fit" } },
        { "type": "card", "settings": { "title": "Twill Trouser", "subtitle": "Straight Cut" } },
        { "type": "card", "settings": { "title": "Daily Overshirt", "subtitle": "Classic Layer" } },
        { "type": "card", "settings": { "title": "Boxy Sweatshirt", "subtitle": "Heavy Fleece" } },
        { "type": "card", "settings": { "title": "Casual Shirt", "subtitle": "100% Cotton" } }
      ]
    }
  ]
}
{% endschema %}
```
