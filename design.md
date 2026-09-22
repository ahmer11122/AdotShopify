refrence component no1 
# ObsidianUI — Magnetic Image Trail

[Canonical page](https://www.obsidianui.dev/docs/magnetic-image-trail) · [Agent guide](https://www.obsidianui.dev/agent-instructions.md)

A cluster of images follows your cursor with magnetic momentum and a diagonal orbit.

## Preview

[Open the interactive component preview](https://www.obsidianui.dev/docs/magnetic-image-trail)

Move your cursor across the preview.

```tsx
"use client";
import { MagneticImageTrail } from "@/components/block/magnetic-image-trail";

export default function Demo() {
  return <MagneticImageTrail height="400px" className="w-full rounded-lg" />;
}
```

## Install using CLI

```bash
npx shadcn@latest add "https://www.obsidianui.dev/r/magnetic-image-trail.json"
```

## Usage

```jsx
"use client";
import { MagneticImageTrail } from "@/components/block/magnetic-image-trail";

export default function Demo() {
  return <MagneticImageTrail height="400px" className="w-full rounded-lg" />;
}
```

## Install manually — complete source

Download the complete manifest: [magnetic-image-trail.json](https://www.obsidianui.dev/r/magnetic-image-trail.json). It includes every required local file and package dependency.

Install the listed package dependencies in your React project:

```bash
npm install clsx tailwind-merge
```

Resolve @components/, @ui/, @lib/, and @hooks/ targets through your components.json aliases. For example, @components/block/example.tsx maps to src/components/block/example.tsx when components is @/components and @/\* resolves to src/\*. Do not create a literal @components directory. Preserve existing files deliberately and keep the use client directive where present.

### components/block/magnetic-image-trail.jsx

Installation target: `@components/block/magnetic-image-trail.jsx`

```jsx
"use client";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const imageUrls = [
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-distortion.jpg?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img01.webp?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img02.webp?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img03.webp?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img04.png?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img05.png?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img06.png?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img07.png?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img08.jpg?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img09.jpg?v=3",
  "/cdn/effects/magnetic-image-trail/magnetic-image-trail-img10.jpg?v=3",
];

const SLOTS = [
  { y: 0, size: 1.19, w: 206, h: 167 }, // mid - just a bit bigger
  { y: -30, size: 1.10, w: 214, h: 167 }, // 2nd closest - little bigger, spread more
  { y: 30, size: 1.20, w: 214, h: 167 },
  { y: -60, size: 1.06, w: 186, h: 144 }, // spread more
  { y: 60, size: 1.06, w: 186, h: 144 },

  { y: -94, size: 0.91, w: 157, h: 122 }, // spread more
  { y: 94, size: 0.91, w: 157, h: 122 },
  { y: -122, size: 0.80, w: 139, h: 109 },
  { y: 122, size: 0.80, w: 139, h: 109 },

  { y: -18, size: 1.04, w: 166, h: 129 }, // very little more than before
  { y: 18, size: 1.02, w: 161, h: 126 },
  { y: -52, size: 0.97, w: 153, h: 118 },
  { y: 52, size: 0.97, w: 153, h: 118 },

  { y: -78, size: 0.87, w: 137, h: 108 },
  { y: 78, size: 0.87, w: 137, h: 108 },
  { y: -134, size: 0.70, w: 111, h: 83 }, // spread a bit more at edges
  { y: 134, size: 0.70, w: 111, h: 83 },
  { y: 10, size: 0.91, w: 140, h: 108 }, // very little
];

// Faster + tighter motion.
const SPEED = 0.0003;
const MAX_SPEED = 0.0015; // Added max speed limit for generation
const FOLLOW = 0.22;
const SPREAD_X = 250; // Slightly more spread since sizes increased

// Interaction Config
const MOUSE_SPEED_BOOST = 0.003;
const FORWARD_PUSH_AMOUNT = 40;
const UPWARD_PUSH_AMOUNT = 30;
const SCALE_OUT_MIN = 0.68;
const SCALE_OUT_MAX = 1.48;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawRoundedImage(ctx, img, x, y, w, h, r = 0) {
  if (!img?.complete || img.naturalWidth <= 0) return;

  const imgAspect = img.naturalWidth / img.naturalHeight;
  const boxAspect = w / h;

  let sx, sy, sw, sh;

  if (imgAspect > boxAspect) {
    sh = img.naturalHeight;
    sw = sh * boxAspect;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / boxAspect;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  if (r > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
    return;
  }

  // No rounded corners.
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * @param {{ images?: string[], children?: import("react").ReactNode, className?: string,
 * style?: import("react").CSSProperties, height?: import("react").CSSProperties["height"],
 * background?: string, textColor?: string, compositionScale?: number }} props
 */
function ImageTrail({
  images = imageUrls,
  children = <>ObsidianUI.<br />Interfaces people remember.</>,
  className,
  style,
  height = "100vh",
  background = "#EDEBE6",
  textColor = "#111",
  compositionScale = 0.78,
} = {}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  const pointer = useRef({ x: 0, y: 0 });
  const lerpedPointer = useRef({ x: 0, y: 0 }); // lerped pointer position
  const smooth = useRef({ x: 0, y: 0 });
  const dirRef = useRef({ x: 1, y: 0 });
  const lastMoveAt = useRef(0);
  const phase = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sources = images.length ? images : imageUrls;
    const imgs = SLOTS.map((_, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = sources[i % sources.length];
      return img;
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      pointer.current = { x: w / 2, y: h / 2 };
      lerpedPointer.current = { x: w / 2, y: h / 2 };
      smooth.current = { x: w / 2, y: h / 2 };
      if (reducedMotion.matches) frame(0);
    }

    function frame(now) {
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;
      // Fit the original orbit and cards together inside embedded previews.
      const fitScale = Math.min(1, W / 720, H / 520) * Math.max(0, compositionScale);
      ctx.clearRect(0, 0, W, H);

      const dt = Math.min(32, now - (lastTime.current || now));
      lastTime.current = now;

      // --- lerp pointer on every frame ---
      // The lerped pointer smoothly follows the actual pointer.
      // A lerp amount of 0.18 gives a nice responsive but eased motion.
      const LERP_AMOUNT = 0.18;
      lerpedPointer.current.x = lerp(lerpedPointer.current.x, pointer.current.x, LERP_AMOUNT);
      lerpedPointer.current.y = lerp(lerpedPointer.current.y, pointer.current.y, LERP_AMOUNT);

      // Phase increment will be calculated after mouse speed is determined

      const prevSX = smooth.current.x;
      const prevSY = smooth.current.y;

      // use lerpedPointer instead of pointer directly for the trailing smooth position
      smooth.current.x += (lerpedPointer.current.x - smooth.current.x) * FOLLOW;
      smooth.current.y += (lerpedPointer.current.y - smooth.current.y) * FOLLOW;

      const cx = smooth.current.x;
      const cy = smooth.current.y;

      const vx = cx - prevSX;
      const vy = cy - prevSY;
      const vmag = Math.hypot(vx, vy);
      if (vmag > 0.35) {
        const tx = vx / vmag;
        const ty = vy / vmag;
        dirRef.current.x = dirRef.current.x + (tx - dirRef.current.x) * 0.2;
        dirRef.current.y = dirRef.current.y + (ty - dirRef.current.y) * 0.2;
        const m = Math.hypot(dirRef.current.x, dirRef.current.y) || 1;
        dirRef.current.x /= m;
        dirRef.current.y /= m;
        lastMoveAt.current = now;
      } else if (!lastMoveAt.current) {
        lastMoveAt.current = now;
      }

      const speed01 = clamp(vmag / 18, 0, 1);
      // INCREASE GENERATING SPEED BASED ON MOUSE MOVEMENT, CLAMPED TO MAX_SPEED
      const currentSpeed = clamp(SPEED + speed01 * MOUSE_SPEED_BOOST, SPEED, MAX_SPEED);
      phase.current += dt * currentSpeed;
      const dir = dirRef.current;

      const cards = SLOTS.map((slot, i) => {
        const n = SLOTS.length;

        // Animation progress per image.
        const t = (phase.current + i / n) % 1;

        // -1 → 0 → 1
        // This controls the movement along the diagonal path.
        const pathNorm = t * 2 - 1;

        // Diagonal movement direction.
        // Start: bottom-right
        // Center: middle
        // End: top-left
        // Bottom-left → top-right, but less steep.
        const moveX = pathNorm;
        const moveY = -pathNorm;

        // Keep the circular cluster shape.
        const yOffset = clamp(slot.y, -SPREAD_X * 0.82, SPREAD_X * 0.82);

        const circleWidthAtY =
          Math.sqrt(Math.max(0, SPREAD_X * SPREAD_X - yOffset * yOffset)) * 0.74;

        // Lower number = flatter/slanting movement.
        // 0.38 was too steep.
        const diagonalPush = SPREAD_X * 0.15;

        // Move the whole diagonal slightly upward,
        // so it starts a little above bottom-left
        // and ends a little below top-right.
        const verticalLift = -SPREAD_X * 0.06;

        const x = cx + moveX * circleWidthAtY;
        const y = cy + yOffset + moveY * diagonalPush + verticalLift;

        // Scale follows the same diagonal movement:
        // small → big at center → small
        const rawCenterScale = Math.max(0, 1 - Math.abs(pathNorm));
        const easedCenterScale =
          rawCenterScale * rawCenterScale * (3 - 2 * rawCenterScale);
        const centerScale = lerp(0.06, 0.9, easedCenterScale);

        // Scale images up in the direction of mouse movement.
        // Images ahead of the mouse direction get larger.
        // Images behind the mouse direction get smaller.
        const dx = x - cx;
        const dy = y - cy;

        const directionalProjection = clamp(
          (dx * dir.x + dy * dir.y) / Math.max(1, SPREAD_X),
          -1,
          1
        );

        // Scaling out works on OPPOSITE direction.
        // Images behind the mouse direction get larger (scale out).
        const oppositeProjection = -directionalProjection;
        const backwardAmount = (oppositeProjection + 1) * 0.5;

        const movementBoost = lerp(1, 1.18, speed01);
        const directionalScale = lerp(SCALE_OUT_MIN, SCALE_OUT_MAX, backwardAmount) * movementBoost;
        const scale = centerScale * directionalScale * 1.14;

        // Image translate effect on mouse move direction.
        // Images ahead of the mouse are pushed forward.
        const forwardPush = Math.max(0, directionalProjection) * speed01 * FORWARD_PUSH_AMOUNT;

        // Images scaling out (behind) translate a little up
        const upwardPush = Math.max(0, oppositeProjection) * speed01 * UPWARD_PUSH_AMOUNT;

        return {
          i,
          img: imgs[i % imgs.length],

          x: x + dir.x * forwardPush,
          y: y + dir.y * forwardPush - upwardPush,

          w: slot.w * slot.size * scale,
          h: slot.h * slot.size * scale,

          rot: 0,
          alpha: 1,
          order: i,
        };
      });

      // Stable stacking: never sort by `depth` (which changes during animation).
      cards.sort((a, b) => a.i - b.i);

      for (const card of cards) {
        if (card.w < 2 || card.h < 2) continue;

        ctx.save();
        ctx.translate(cx + (card.x - cx) * fitScale, cy + (card.y - cy) * fitScale);
        ctx.globalAlpha = 1;
        ctx.shadowColor = "rgba(0,0,0,0.14)";
        ctx.shadowBlur = 12 * fitScale;
        ctx.shadowOffsetY = 5 * fitScale;

        const width = card.w * fitScale;
        const height = card.h * fitScale;
        drawRoundedImage(ctx, card.img, -width / 2, -height / 2, width, height, 0);

        ctx.restore();
      }

      if (!reducedMotion.matches) rafRef.current = requestAnimationFrame(frame);
    }

    function syncMotion() {
      cancelAnimationFrame(rafRef.current);
      lastTime.current = 0;
      if (reducedMotion.matches) frame(0);
      else rafRef.current = requestAnimationFrame(frame);
    }

    // Observe the preview itself; gallery layout changes need not resize the window.
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    imgs.forEach((img) => {
      img.onload = () => { if (reducedMotion.matches) frame(0); };
    });
    resize();
    syncMotion();
    reducedMotion.addEventListener("change", syncMotion);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      reducedMotion.removeEventListener("change", syncMotion);
      imgs.forEach((img) => { img.onload = null; });
    };
  }, [images, compositionScale]);

  const updatePointer = useCallback((e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    // On mouse move, we set pointer to the actual event location (no lerp here).
    pointer.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  return (
    <section
      ref={wrapRef}
      className={cn("isolate", className)}
      onPointerMove={updatePointer}
      onPointerEnter={updatePointer}
      style={{
        position: "relative",
        width: "100%",
        height,
        background,
        overflow: "hidden",
        containerType: "inline-size",
        ...style,
      }}
    >
      <div
        className="w-[70%] mx-auto"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 1,
          color: textColor,
          fontSize: "clamp(18px, 3.5cqw, 44px)",

          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </section>
  );
}

export { ImageTrail as MagneticImageTrail };
```

### lib/utils.ts

Installation target: `@lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Preview behavior

Move your cursor across the preview. The effect stays inside its container and respects reduced motion preferences.




////



no 2 


import { CodeBlock, Dependencies } from '@/components/docs/component-installation'
import { CLICommand } from '@/components/docs/cli-command'
import { ComponentPreview } from '@/components/docs/component-preview'
import { ExpandableBlock } from '@/components/docs/expandable-block'
import { EffectPreview } from '@/components/catalog/effect-preview'
import { effectExamples } from '@/components/catalog/effect-examples'

# Interactive Blur Reveal

A frosted image becomes clear beneath a fluid cursor trail, with noise distortion and subtle grain.

<ComponentPreview component={<EffectPreview slug="interactive-blur-reveal" />} code={effectExamples["interactive-blur-reveal"]} description="Move over the image to reveal its detail." previewClassName="p-0 sm:p-0" />

## Install using CLI

<CLICommand componentName="interactive-blur-reveal" />

## Usage

```jsx copy
"use client";
import { InteractiveBlurReveal } from "@/components/block/interactive-blur-reveal";

export default function Demo() {
  return <InteractiveBlurReveal className="h-[400px] w-full rounded-lg" />;
}
```

## Install Manually

<Dependencies step={1} title="Install dependencies">
  <CodeBlock code="npm install clsx tailwind-merge" />
</Dependencies>

<Dependencies step={2} title="Copy the source code" className="docs-source-card">
  <p className="mb-4 text-sm text-muted-foreground">Copy into <code className="rounded-full bg-muted px-2 py-1 font-mono text-xs text-foreground">components/block/interactive-blur-reveal.jsx</code></p>

<ExpandableBlock>
```jsx copy
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const MAX_TRAIL_POINTS = 240;
const FULLSCREEN_TRIANGLE_VERTICES = new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  -1, 1,
  1, -1,
  1, 1,
]);
const TEXTURE_UNIT_BASE = 0;
const TEXTURE_UNIT_NOISE = 1;
const DEFAULT_POINTER_POSITION = 0.5;
const DEFAULT_FRAME_TIME_MS = 16.67;
const MAX_FRAME_DELTA_MS = 64;
const POINTER_LERP_FACTOR = 0.001;
const POINTER_LEAVE_DURATION_MS = 180;
const TRAIL_LIFETIME_MS = 650;
const MIN_POINTER_DISTANCE_INSIDE = 0.0022;
const MIN_POINTER_DISTANCE_LEAVING = 0.0013;

const BLUR_REVEAL_VERT = /* glsl */ `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const BLUR_REVEAL_FRAG = /* glsl */ `#version 300 es
precision highp float;

#define MAX_TRAIL_POINTS 240

uniform vec2      iResolution;
uniform float     iTime;
uniform vec2      iTrail[MAX_TRAIL_POINTS];
uniform float     iTrailAlpha[MAX_TRAIL_POINTS];
uniform int       iTrailCount;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

out vec4 fragColor;

vec2 distortUv(vec2 uv) {
  vec2 noiseUv = uv * 2.2;
  vec2 noiseOffset = texture(iChannel1, noiseUv).xy - 0.5;

  return uv + noiseOffset * 0.012;
}

vec4 blur21(sampler2D tex, vec2 uv, float radiusPx) {
  vec2 px = radiusPx / iResolution;
  vec4 color = vec4(0.0);

  color += texture(tex, uv) * 0.12;

  color += texture(tex, uv + px * vec2(1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(-1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, 1.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, -1.0)) * 0.08;

  color += texture(tex, uv + px * vec2(1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(1.0, -1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, -1.0)) * 0.065;

  color += texture(tex, uv + px * vec2(2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(-2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, 2.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, -2.0)) * 0.045;

  color += texture(tex, uv + px * vec2(3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(3.0, -1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, -1.0)) * 0.025;

  return color;
}

float sdSegment(vec2 point, vec2 start, vec2 end) {
  vec2 pointDelta = point - start;
  vec2 segmentDelta = end - start;
  float segmentProjection = clamp(
    dot(pointDelta, segmentDelta) / max(dot(segmentDelta, segmentDelta), 0.00001),
    0.0,
    1.0
  );

  return length(pointDelta - segmentDelta * segmentProjection);
}

float fluidTrailRevealMask(vec2 uv) {
  float aspect = iResolution.x / iResolution.y;
  vec2 point = vec2(uv.x * aspect, uv.y);
  float mask = 0.0;

  for (int i = 0; i < MAX_TRAIL_POINTS - 1; i++) {
    if (i >= iTrailCount - 1) {
      break;
    }

    vec2 start = vec2(iTrail[i].x * aspect, iTrail[i].y);
    vec2 end = vec2(iTrail[i + 1].x * aspect, iTrail[i + 1].y);
    float alpha = min(iTrailAlpha[i], iTrailAlpha[i + 1]);
    float distance = sdSegment(point, start, end);

    float noiseA = texture(iChannel1, uv * 4.0 + float(i) * 0.018).r;
    float noiseB = texture(iChannel1, uv * 10.0 + vec2(noiseA * 0.4, float(i) * 0.01)).r;
    float noiseC = texture(iChannel1, uv * 24.0 - float(i) * 0.006).r;
    float fluidNoise = noiseA * 0.45 + noiseB * 0.35 + noiseC * 0.20;

    float radius = 0.095 + (fluidNoise - 0.5) * 0.055;
    float softness = 0.09;
    float localMask = 1.0 - smoothstep(radius, radius + softness, distance);

    mask = max(mask, localMask * alpha);
  }

  float cloudNoise = texture(iChannel1, uv * 7.0).r;
  float fineNoise = texture(iChannel1, uv * 22.0).r;

  mask *= smoothstep(0.12, 0.95, mask + cloudNoise * 0.25 + fineNoise * 0.12);

  return clamp(mask, 0.0, 1.0);
}

vec3 filmGrain(vec2 uv) {
  // Layered grain keeps the frosted area from feeling digitally flat.
  vec2 coarseUv = uv * (iResolution.xy / 260.0) + vec2(iTime * 0.035, -iTime * 0.028);
  vec2 fineUv = uv * (iResolution.xy / 120.0) + vec2(-iTime * 0.055, iTime * 0.041);
  vec3 coarse = texture(iChannel1, coarseUv).rgb - 0.5;
  float fine = texture(iChannel1, fineUv).r - 0.5;
  vec3 chroma = vec3(coarse.r, coarse.g * 0.9, coarse.b * 1.1);

  return chroma * 0.95 + fine * 0.65;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / iResolution.xy;
  screenUv.y = 1.0 - screenUv.y;

  vec2 imageUv = screenUv;
  vec4 frostedImage = blur21(iChannel0, distortUv(imageUv), 42.0);
  vec4 clearImage = texture(iChannel0, imageUv);
  float revealMask = fluidTrailRevealMask(screenUv);
  float grain = texture(iChannel1, screenUv * iResolution.xy / 180.0).r;

  frostedImage.rgb = mix(frostedImage.rgb, vec3(0.70, 0.76, 0.78), 0.18);
  frostedImage.rgb += (grain - 0.5) * 0.045;
  frostedImage.rgb *= 0.96;

  vec4 mixed = mix(frostedImage, clearImage, revealMask);

  // Grain stays stronger in the frosted region so the reveal feels tactile.
  float grainAmount = mix(0.24, 0.12, revealMask);
  mixed.rgb += filmGrain(screenUv) * grainAmount;

  // A soft vignette keeps the edges from competing with the reveal path.
  vec2 vignetteDelta = screenUv - 0.5;
  float vignette = smoothstep(0.85, 0.25, dot(vignetteDelta, vignetteDelta) * 1.35);
  mixed.rgb *= mix(0.96, 1.0, vignette);

  fragColor = vec4(clamp(mixed.rgb, 0.0, 1.0), 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error("Shader compilation failed.");
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  let vertexShader;
  let fragmentShader;
  let program;
  try {
    vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    if (!program) throw new Error("Program allocation failed.");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Program linking failed.");
    }
    return program;
  } catch (error) {
    if (program) gl.deleteProgram(program);
    throw error;
  } finally {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
  }
}

function loadImage(source, signal) {
  return new Promise((resolve, reject) => {
    const image = source instanceof HTMLImageElement ? source : new Image();
    const removeListeners = () => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    };
    const onLoad = () => { removeListeners(); resolve(image); };
    const onError = () => { removeListeners(); reject(new Error("Image unavailable.")); };
    const onAbort = () => { removeListeners(); reject(new Error("Image loading cancelled.")); };
    if (signal.aborted) { onAbort(); return; }
    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    signal.addEventListener("abort", onAbort, { once: true });
    if (!(source instanceof HTMLImageElement)) {
      image.crossOrigin = "anonymous";
      image.src = source;
    }
    if (image.complete && image.naturalWidth > 0) onLoad();
  });
}

function createTexture(gl, image, unit, shouldRepeat = false) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Texture allocation failed.");
  try {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  } catch (error) {
    gl.deleteTexture(texture);
    throw error;
  }
}

/**
 * @param {{ imageSrc?: string, noiseSrc?: string, iChannel0?: string | HTMLImageElement, iChannel1?: string | HTMLImageElement, className?: string, style?: import("react").CSSProperties, paused?: boolean, alt?: string }} props
 */
export function InteractiveBlurReveal({
  imageSrc = "/cdn/effects/interactive-blur-reveal/interactive-blur-reveal-img01.webp?v=3",
  noiseSrc = "/cdn/effects/interactive-blur-reveal/interactive-blur-reveal-noise.png?v=3",
  iChannel0 = imageSrc,
  iChannel1 = noiseSrc,
  className,
  style,
  paused = false,
  alt = "ObsidianUI frosted image with a fluid cursor reveal",
} = {}) {
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const pointerRef = useRef({
    isInside: false,
    targetX: DEFAULT_POINTER_POSITION,
    targetY: DEFAULT_POINTER_POSITION,
    x: DEFAULT_POINTER_POSITION,
    y: DEFAULT_POINTER_POSITION,
    lastTime: 0,
    isLeaving: false,
    leaveAt: 0,
  });

  useEffect(() => {
    let isDisposed = false;
    let animationFrameId = 0;
    const controller = new AbortController();
    const disposeResources = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isStatic = () => paused || motion.matches;
    trailRef.current = [];
    const cleanup = () => {
      if (isDisposed) return;
      isDisposed = true;
      controller.abort();
      cancelAnimationFrame(animationFrameId);
      disposeResources.reverse().forEach((dispose) => dispose());
    };

    // ─── WebGL Setup ───────────────────────────────────────────────────────
    async function init() {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const gl = canvas.getContext("webgl2");

      if (!gl) {
        return;
      }

      const program = createProgram(gl, BLUR_REVEAL_VERT, BLUR_REVEAL_FRAG);
      disposeResources.push(() => gl.deleteProgram(program));
      const positionBuffer = gl.createBuffer();
      if (!positionBuffer) throw new Error("Buffer allocation failed.");
      disposeResources.push(() => gl.deleteBuffer(positionBuffer));
      const onContextLost = (event) => {
        event.preventDefault();
        canvas.style.opacity = "0";
        cleanup();
      };
      canvas.addEventListener("webglcontextlost", onContextLost);
      disposeResources.push(() => canvas.removeEventListener("webglcontextlost", onContextLost));
      const positionLocation = gl.getAttribLocation(program, "position");
      const resolutionLocation = gl.getUniformLocation(program, "iResolution");
      const timeLocation = gl.getUniformLocation(program, "iTime");
      const trailLocation = gl.getUniformLocation(program, "iTrail[0]");
      const trailAlphaLocation = gl.getUniformLocation(program, "iTrailAlpha[0]");
      const trailCountLocation = gl.getUniformLocation(program, "iTrailCount");
      const channel0Location = gl.getUniformLocation(program, "iChannel0");
      const channel1Location = gl.getUniformLocation(program, "iChannel1");

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE_VERTICES, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const [baseImage, noiseImage] = await Promise.all([
        loadImage(iChannel0, controller.signal),
        loadImage(iChannel1, controller.signal),
      ]);

      if (isDisposed) return;

      const baseTexture = createTexture(gl, baseImage, TEXTURE_UNIT_BASE);
      disposeResources.push(() => gl.deleteTexture(baseTexture));
      const noiseTexture = createTexture(gl, noiseImage, TEXTURE_UNIT_NOISE, true);
      disposeResources.push(() => gl.deleteTexture(noiseTexture));

      gl.uniform1i(channel0Location, TEXTURE_UNIT_BASE);
      gl.uniform1i(channel1Location, TEXTURE_UNIT_NOISE);

      // ─── Canvas Resize
      function onResize() {
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.floor(rect.width * devicePixelRatio));
        const nextHeight = Math.max(1, Math.floor(rect.height * devicePixelRatio));

        if (canvas.width === nextWidth && canvas.height === nextHeight) return;

        canvas.width = nextWidth;
        canvas.height = nextHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // ─── Animation Loop
      const trailData = new Float32Array(MAX_TRAIL_POINTS * 2);
      const trailAlphaData = new Float32Array(MAX_TRAIL_POINTS);
      function render() {
        if (isDisposed) return;

        const now = performance.now();

        gl.uniform1f(timeLocation, isStatic() ? 0 : now / 1000);

        const pointer = pointerRef.current;
        const frameDelta = pointer.lastTime
          ? Math.min(MAX_FRAME_DELTA_MS, now - pointer.lastTime)
          : DEFAULT_FRAME_TIME_MS;

        pointer.lastTime = now;

        // Exponential smoothing keeps the cursor feel consistent across frame rates.
        const smoothing = 1.0 - Math.pow(POINTER_LERP_FACTOR, frameDelta / 1000);

        pointer.x += (pointer.targetX - pointer.x) * smoothing;
        pointer.y += (pointer.targetY - pointer.y) * smoothing;

        const leavingAge = pointer.isLeaving ? now - pointer.leaveAt : 0;
        const isLeavingActive =
          pointer.isLeaving && leavingAge < POINTER_LEAVE_DURATION_MS;
        const pushStrength = isStatic() ? 0 : pointer.isInside
          ? 1
          : isLeavingActive
            ? 1 - leavingAge / POINTER_LEAVE_DURATION_MS
            : 0;

        if (pushStrength > 0) {
          const trail = trailRef.current;
          const lastPoint = trail[trail.length - 1];
          const deltaX = lastPoint ? pointer.x - lastPoint.x : 1;
          const deltaY = lastPoint ? pointer.y - lastPoint.y : 1;
          const distance = Math.hypot(deltaX, deltaY);
          const minPointerDistance = pointer.isInside
            ? MIN_POINTER_DISTANCE_INSIDE
            : MIN_POINTER_DISTANCE_LEAVING;

          if (!lastPoint || distance > minPointerDistance) {
            trail.push({
              x: pointer.x,
              y: pointer.y,
              time: now,
              strength: pushStrength,
            });
          }
        }

        let trail = trailRef.current.filter(
          (point) => now - point.time < TRAIL_LIFETIME_MS
        );

        if (trail.length > MAX_TRAIL_POINTS) {
          trail = trail.slice(trail.length - MAX_TRAIL_POINTS);
        }

        trailRef.current = trail;

        trailData.fill(0);
        trailAlphaData.fill(0);

        trail.forEach((point, index) => {
          const age = now - point.time;
          const life = Math.max(0, 1 - age / TRAIL_LIFETIME_MS);

          // Smooth alpha easing avoids a visible cutoff at the end of the trail.
          const baseAlpha = life * life * (3 - 2 * life);

          trailData[index * 2] = point.x;
          trailData[index * 2 + 1] = point.y;
          trailAlphaData[index] = baseAlpha * (point.strength ?? 1);
        });

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform2fv(trailLocation, trailData);
        gl.uniform1fv(trailAlphaLocation, trailAlphaData);
        gl.uniform1i(trailCountLocation, trail.length);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        canvas.style.opacity = "1";
        if (!isStatic()) animationFrameId = requestAnimationFrame(render);
      }

      const observer = new ResizeObserver(() => { onResize(); if (isStatic()) render(); });
      observer.observe(canvas.parentElement);
      disposeResources.push(() => observer.disconnect());
      const onMotionChange = () => {
        cancelAnimationFrame(animationFrameId);
        trailRef.current = [];
        render();
      };
      motion.addEventListener("change", onMotionChange);
      disposeResources.push(() => motion.removeEventListener("change", onMotionChange));
      onResize();
      render();

    }

    init().catch(() => {
      if (isDisposed) return;
      if (canvasRef.current) canvasRef.current.style.opacity = "0";
      cleanup();
    });
    return cleanup;
  }, [iChannel0, iChannel1, paused]);

  function updatePointerFromEvent(event) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointer = pointerRef.current;

    pointer.targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
    pointer.targetY = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
  }

  function onPointerEnter(event) {
    const pointer = pointerRef.current;

    pointer.isInside = true;
    pointer.isLeaving = false;
    updatePointerFromEvent(event);
  }

  function onPointerMove(event) {
    updatePointerFromEvent(event);
  }

  function onPointerLeave() {
    const pointer = pointerRef.current;

    pointer.isInside = false;
    pointer.isLeaving = true;
    pointer.leaveAt = performance.now();
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative h-[28rem] w-full overflow-hidden bg-black", className)}
      style={style}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
        style={{ backgroundImage: typeof iChannel0 === "string" ? `url(${JSON.stringify(iChannel0)})` : undefined }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        className="absolute inset-0 block h-full w-full opacity-0"
      />
    </div>
  );
}
```
</ExpandableBlock>
</Dependencies>

<Dependencies step={3} title="Add the supporting file" className="docs-source-card">
  <p className="mb-4 text-sm text-muted-foreground">Copy into <code className="rounded-full bg-muted px-2 py-1 font-mono text-xs text-foreground">lib/utils.ts</code></p>

<ExpandableBlock>
```ts copy
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
</ExpandableBlock>
</Dependencies>



## Preview behavior

Move over the image to reveal its detail. The effect stays inside its container and respects reduced motion preferences.



//


no 3 like this one 


import { CodeBlock, Dependencies } from '@/components/docs/component-installation'
import { CLICommand } from '@/components/docs/cli-command'
import { ComponentPreview } from '@/components/docs/component-preview'
import { ExpandableBlock } from '@/components/docs/expandable-block'
import { EffectPreview } from '@/components/catalog/effect-preview'
import { effectExamples } from '@/components/catalog/effect-examples'

# Interactive Blur Reveal

A frosted image becomes clear beneath a fluid cursor trail, with noise distortion and subtle grain.

<ComponentPreview component={<EffectPreview slug="interactive-blur-reveal" />} code={effectExamples["interactive-blur-reveal"]} description="Move over the image to reveal its detail." previewClassName="p-0 sm:p-0" />

## Install using CLI

<CLICommand componentName="interactive-blur-reveal" />

## Usage

```jsx copy
"use client";
import { InteractiveBlurReveal } from "@/components/block/interactive-blur-reveal";

export default function Demo() {
  return <InteractiveBlurReveal className="h-[400px] w-full rounded-lg" />;
}
```

## Install Manually

<Dependencies step={1} title="Install dependencies">
  <CodeBlock code="npm install clsx tailwind-merge" />
</Dependencies>

<Dependencies step={2} title="Copy the source code" className="docs-source-card">
  <p className="mb-4 text-sm text-muted-foreground">Copy into <code className="rounded-full bg-muted px-2 py-1 font-mono text-xs text-foreground">components/block/interactive-blur-reveal.jsx</code></p>

<ExpandableBlock>
```jsx copy
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const MAX_TRAIL_POINTS = 240;
const FULLSCREEN_TRIANGLE_VERTICES = new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  -1, 1,
  1, -1,
  1, 1,
]);
const TEXTURE_UNIT_BASE = 0;
const TEXTURE_UNIT_NOISE = 1;
const DEFAULT_POINTER_POSITION = 0.5;
const DEFAULT_FRAME_TIME_MS = 16.67;
const MAX_FRAME_DELTA_MS = 64;
const POINTER_LERP_FACTOR = 0.001;
const POINTER_LEAVE_DURATION_MS = 180;
const TRAIL_LIFETIME_MS = 650;
const MIN_POINTER_DISTANCE_INSIDE = 0.0022;
const MIN_POINTER_DISTANCE_LEAVING = 0.0013;

const BLUR_REVEAL_VERT = /* glsl */ `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const BLUR_REVEAL_FRAG = /* glsl */ `#version 300 es
precision highp float;

#define MAX_TRAIL_POINTS 240

uniform vec2      iResolution;
uniform float     iTime;
uniform vec2      iTrail[MAX_TRAIL_POINTS];
uniform float     iTrailAlpha[MAX_TRAIL_POINTS];
uniform int       iTrailCount;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

out vec4 fragColor;

vec2 distortUv(vec2 uv) {
  vec2 noiseUv = uv * 2.2;
  vec2 noiseOffset = texture(iChannel1, noiseUv).xy - 0.5;

  return uv + noiseOffset * 0.012;
}

vec4 blur21(sampler2D tex, vec2 uv, float radiusPx) {
  vec2 px = radiusPx / iResolution;
  vec4 color = vec4(0.0);

  color += texture(tex, uv) * 0.12;

  color += texture(tex, uv + px * vec2(1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(-1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, 1.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, -1.0)) * 0.08;

  color += texture(tex, uv + px * vec2(1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(1.0, -1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, -1.0)) * 0.065;

  color += texture(tex, uv + px * vec2(2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(-2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, 2.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, -2.0)) * 0.045;

  color += texture(tex, uv + px * vec2(3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(3.0, -1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, -1.0)) * 0.025;

  return color;
}

float sdSegment(vec2 point, vec2 start, vec2 end) {
  vec2 pointDelta = point - start;
  vec2 segmentDelta = end - start;
  float segmentProjection = clamp(
    dot(pointDelta, segmentDelta) / max(dot(segmentDelta, segmentDelta), 0.00001),
    0.0,
    1.0
  );

  return length(pointDelta - segmentDelta * segmentProjection);
}

float fluidTrailRevealMask(vec2 uv) {
  float aspect = iResolution.x / iResolution.y;
  vec2 point = vec2(uv.x * aspect, uv.y);
  float mask = 0.0;

  for (int i = 0; i < MAX_TRAIL_POINTS - 1; i++) {
    if (i >= iTrailCount - 1) {
      break;
    }

    vec2 start = vec2(iTrail[i].x * aspect, iTrail[i].y);
    vec2 end = vec2(iTrail[i + 1].x * aspect, iTrail[i + 1].y);
    float alpha = min(iTrailAlpha[i], iTrailAlpha[i + 1]);
    float distance = sdSegment(point, start, end);

    float noiseA = texture(iChannel1, uv * 4.0 + float(i) * 0.018).r;
    float noiseB = texture(iChannel1, uv * 10.0 + vec2(noiseA * 0.4, float(i) * 0.01)).r;
    float noiseC = texture(iChannel1, uv * 24.0 - float(i) * 0.006).r;
    float fluidNoise = noiseA * 0.45 + noiseB * 0.35 + noiseC * 0.20;

    float radius = 0.095 + (fluidNoise - 0.5) * 0.055;
    float softness = 0.09;
    float localMask = 1.0 - smoothstep(radius, radius + softness, distance);

    mask = max(mask, localMask * alpha);
  }

  float cloudNoise = texture(iChannel1, uv * 7.0).r;
  float fineNoise = texture(iChannel1, uv * 22.0).r;

  mask *= smoothstep(0.12, 0.95, mask + cloudNoise * 0.25 + fineNoise * 0.12);

  return clamp(mask, 0.0, 1.0);
}

vec3 filmGrain(vec2 uv) {
  // Layered grain keeps the frosted area from feeling digitally flat.
  vec2 coarseUv = uv * (iResolution.xy / 260.0) + vec2(iTime * 0.035, -iTime * 0.028);
  vec2 fineUv = uv * (iResolution.xy / 120.0) + vec2(-iTime * 0.055, iTime * 0.041);
  vec3 coarse = texture(iChannel1, coarseUv).rgb - 0.5;
  float fine = texture(iChannel1, fineUv).r - 0.5;
  vec3 chroma = vec3(coarse.r, coarse.g * 0.9, coarse.b * 1.1);

  return chroma * 0.95 + fine * 0.65;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / iResolution.xy;
  screenUv.y = 1.0 - screenUv.y;

  vec2 imageUv = screenUv;
  vec4 frostedImage = blur21(iChannel0, distortUv(imageUv), 42.0);
  vec4 clearImage = texture(iChannel0, imageUv);
  float revealMask = fluidTrailRevealMask(screenUv);
  float grain = texture(iChannel1, screenUv * iResolution.xy / 180.0).r;

  frostedImage.rgb = mix(frostedImage.rgb, vec3(0.70, 0.76, 0.78), 0.18);
  frostedImage.rgb += (grain - 0.5) * 0.045;
  frostedImage.rgb *= 0.96;

  vec4 mixed = mix(frostedImage, clearImage, revealMask);

  // Grain stays stronger in the frosted region so the reveal feels tactile.
  float grainAmount = mix(0.24, 0.12, revealMask);
  mixed.rgb += filmGrain(screenUv) * grainAmount;

  // A soft vignette keeps the edges from competing with the reveal path.
  vec2 vignetteDelta = screenUv - 0.5;
  float vignette = smoothstep(0.85, 0.25, dot(vignetteDelta, vignetteDelta) * 1.35);
  mixed.rgb *= mix(0.96, 1.0, vignette);

  fragColor = vec4(clamp(mixed.rgb, 0.0, 1.0), 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error("Shader compilation failed.");
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  let vertexShader;
  let fragmentShader;
  let program;
  try {
    vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    if (!program) throw new Error("Program allocation failed.");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Program linking failed.");
    }
    return program;
  } catch (error) {
    if (program) gl.deleteProgram(program);
    throw error;
  } finally {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
  }
}

function loadImage(source, signal) {
  return new Promise((resolve, reject) => {
    const image = source instanceof HTMLImageElement ? source : new Image();
    const removeListeners = () => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    };
    const onLoad = () => { removeListeners(); resolve(image); };
    const onError = () => { removeListeners(); reject(new Error("Image unavailable.")); };
    const onAbort = () => { removeListeners(); reject(new Error("Image loading cancelled.")); };
    if (signal.aborted) { onAbort(); return; }
    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    signal.addEventListener("abort", onAbort, { once: true });
    if (!(source instanceof HTMLImageElement)) {
      image.crossOrigin = "anonymous";
      image.src = source;
    }
    if (image.complete && image.naturalWidth > 0) onLoad();
  });
}

function createTexture(gl, image, unit, shouldRepeat = false) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Texture allocation failed.");
  try {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  } catch (error) {
    gl.deleteTexture(texture);
    throw error;
  }
}

/**
 * @param {{ imageSrc?: string, noiseSrc?: string, iChannel0?: string | HTMLImageElement, iChannel1?: string | HTMLImageElement, className?: string, style?: import("react").CSSProperties, paused?: boolean, alt?: string }} props
 */
export function InteractiveBlurReveal({
  imageSrc = "/cdn/effects/interactive-blur-reveal/interactive-blur-reveal-img01.webp?v=3",
  noiseSrc = "/cdn/effects/interactive-blur-reveal/interactive-blur-reveal-noise.png?v=3",
  iChannel0 = imageSrc,
  iChannel1 = noiseSrc,
  className,
  style,
  paused = false,
  alt = "ObsidianUI frosted image with a fluid cursor reveal",
} = {}) {
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const pointerRef = useRef({
    isInside: false,
    targetX: DEFAULT_POINTER_POSITION,
    targetY: DEFAULT_POINTER_POSITION,
    x: DEFAULT_POINTER_POSITION,
    y: DEFAULT_POINTER_POSITION,
    lastTime: 0,
    isLeaving: false,
    leaveAt: 0,
  });

  useEffect(() => {
    let isDisposed = false;
    let animationFrameId = 0;
    const controller = new AbortController();
    const disposeResources = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isStatic = () => paused || motion.matches;
    trailRef.current = [];
    const cleanup = () => {
      if (isDisposed) return;
      isDisposed = true;
      controller.abort();
      cancelAnimationFrame(animationFrameId);
      disposeResources.reverse().forEach((dispose) => dispose());
    };

    // ─── WebGL Setup ───────────────────────────────────────────────────────
    async function init() {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const gl = canvas.getContext("webgl2");

      if (!gl) {
        return;
      }

      const program = createProgram(gl, BLUR_REVEAL_VERT, BLUR_REVEAL_FRAG);
      disposeResources.push(() => gl.deleteProgram(program));
      const positionBuffer = gl.createBuffer();
      if (!positionBuffer) throw new Error("Buffer allocation failed.");
      disposeResources.push(() => gl.deleteBuffer(positionBuffer));
      const onContextLost = (event) => {
        event.preventDefault();
        canvas.style.opacity = "0";
        cleanup();
      };
      canvas.addEventListener("webglcontextlost", onContextLost);
      disposeResources.push(() => canvas.removeEventListener("webglcontextlost", onContextLost));
      const positionLocation = gl.getAttribLocation(program, "position");
      const resolutionLocation = gl.getUniformLocation(program, "iResolution");
      const timeLocation = gl.getUniformLocation(program, "iTime");
      const trailLocation = gl.getUniformLocation(program, "iTrail[0]");
      const trailAlphaLocation = gl.getUniformLocation(program, "iTrailAlpha[0]");
      const trailCountLocation = gl.getUniformLocation(program, "iTrailCount");
      const channel0Location = gl.getUniformLocation(program, "iChannel0");
      const channel1Location = gl.getUniformLocation(program, "iChannel1");

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE_VERTICES, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const [baseImage, noiseImage] = await Promise.all([
        loadImage(iChannel0, controller.signal),
        loadImage(iChannel1, controller.signal),
      ]);

      if (isDisposed) return;

      const baseTexture = createTexture(gl, baseImage, TEXTURE_UNIT_BASE);
      disposeResources.push(() => gl.deleteTexture(baseTexture));
      const noiseTexture = createTexture(gl, noiseImage, TEXTURE_UNIT_NOISE, true);
      disposeResources.push(() => gl.deleteTexture(noiseTexture));

      gl.uniform1i(channel0Location, TEXTURE_UNIT_BASE);
      gl.uniform1i(channel1Location, TEXTURE_UNIT_NOISE);

      // ─── Canvas Resize
      function onResize() {
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.floor(rect.width * devicePixelRatio));
        const nextHeight = Math.max(1, Math.floor(rect.height * devicePixelRatio));

        if (canvas.width === nextWidth && canvas.height === nextHeight) return;

        canvas.width = nextWidth;
        canvas.height = nextHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // ─── Animation Loop
      const trailData = new Float32Array(MAX_TRAIL_POINTS * 2);
      const trailAlphaData = new Float32Array(MAX_TRAIL_POINTS);
      function render() {
        if (isDisposed) return;

        const now = performance.now();

        gl.uniform1f(timeLocation, isStatic() ? 0 : now / 1000);

        const pointer = pointerRef.current;
        const frameDelta = pointer.lastTime
          ? Math.min(MAX_FRAME_DELTA_MS, now - pointer.lastTime)
          : DEFAULT_FRAME_TIME_MS;

        pointer.lastTime = now;

        // Exponential smoothing keeps the cursor feel consistent across frame rates.
        const smoothing = 1.0 - Math.pow(POINTER_LERP_FACTOR, frameDelta / 1000);

        pointer.x += (pointer.targetX - pointer.x) * smoothing;
        pointer.y += (pointer.targetY - pointer.y) * smoothing;

        const leavingAge = pointer.isLeaving ? now - pointer.leaveAt : 0;
        const isLeavingActive =
          pointer.isLeaving && leavingAge < POINTER_LEAVE_DURATION_MS;
        const pushStrength = isStatic() ? 0 : pointer.isInside
          ? 1
          : isLeavingActive
            ? 1 - leavingAge / POINTER_LEAVE_DURATION_MS
            : 0;

        if (pushStrength > 0) {
          const trail = trailRef.current;
          const lastPoint = trail[trail.length - 1];
          const deltaX = lastPoint ? pointer.x - lastPoint.x : 1;
          const deltaY = lastPoint ? pointer.y - lastPoint.y : 1;
          const distance = Math.hypot(deltaX, deltaY);
          const minPointerDistance = pointer.isInside
            ? MIN_POINTER_DISTANCE_INSIDE
            : MIN_POINTER_DISTANCE_LEAVING;

          if (!lastPoint || distance > minPointerDistance) {
            trail.push({
              x: pointer.x,
              y: pointer.y,
              time: now,
              strength: pushStrength,
            });
          }
        }

        let trail = trailRef.current.filter(
          (point) => now - point.time < TRAIL_LIFETIME_MS
        );

        if (trail.length > MAX_TRAIL_POINTS) {
          trail = trail.slice(trail.length - MAX_TRAIL_POINTS);
        }

        trailRef.current = trail;

        trailData.fill(0);
        trailAlphaData.fill(0);

        trail.forEach((point, index) => {
          const age = now - point.time;
          const life = Math.max(0, 1 - age / TRAIL_LIFETIME_MS);

          // Smooth alpha easing avoids a visible cutoff at the end of the trail.
          const baseAlpha = life * life * (3 - 2 * life);

          trailData[index * 2] = point.x;
          trailData[index * 2 + 1] = point.y;
          trailAlphaData[index] = baseAlpha * (point.strength ?? 1);
        });

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform2fv(trailLocation, trailData);
        gl.uniform1fv(trailAlphaLocation, trailAlphaData);
        gl.uniform1i(trailCountLocation, trail.length);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        canvas.style.opacity = "1";
        if (!isStatic()) animationFrameId = requestAnimationFrame(render);
      }

      const observer = new ResizeObserver(() => { onResize(); if (isStatic()) render(); });
      observer.observe(canvas.parentElement);
      disposeResources.push(() => observer.disconnect());
      const onMotionChange = () => {
        cancelAnimationFrame(animationFrameId);
        trailRef.current = [];
        render();
      };
      motion.addEventListener("change", onMotionChange);
      disposeResources.push(() => motion.removeEventListener("change", onMotionChange));
      onResize();
      render();

    }

    init().catch(() => {
      if (isDisposed) return;
      if (canvasRef.current) canvasRef.current.style.opacity = "0";
      cleanup();
    });
    return cleanup;
  }, [iChannel0, iChannel1, paused]);

  function updatePointerFromEvent(event) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointer = pointerRef.current;

    pointer.targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
    pointer.targetY = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
  }

  function onPointerEnter(event) {
    const pointer = pointerRef.current;

    pointer.isInside = true;
    pointer.isLeaving = false;
    updatePointerFromEvent(event);
  }

  function onPointerMove(event) {
    updatePointerFromEvent(event);
  }

  function onPointerLeave() {
    const pointer = pointerRef.current;

    pointer.isInside = false;
    pointer.isLeaving = true;
    pointer.leaveAt = performance.now();
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative h-[28rem] w-full overflow-hidden bg-black", className)}
      style={style}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
        style={{ backgroundImage: typeof iChannel0 === "string" ? `url(${JSON.stringify(iChannel0)})` : undefined }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        className="absolute inset-0 block h-full w-full opacity-0"
      />
    </div>
  );
}
```
</ExpandableBlock>
</Dependencies>

<Dependencies step={3} title="Add the supporting file" className="docs-source-card">
  <p className="mb-4 text-sm text-muted-foreground">Copy into <code className="rounded-full bg-muted px-2 py-1 font-mono text-xs text-foreground">lib/utils.ts</code></p>

<ExpandableBlock>
```ts copy
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
</ExpandableBlock>
</Dependencies>



## Preview behavior

Move over the image to reveal its detail. The effect stays inside its container and respects reduced motion preferences.


//

