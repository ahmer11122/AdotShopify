# UI/UX rules — applies to every component, no exceptions

## Accessibility

- Every interactive element is keyboard-reachable and operable — tab order follows visual order, no keyboard traps.
- Visible focus states on everything interactive. Never `outline: none` without a replacement focus style.
- Contrast: body text ≥ 4.5:1 against its background token, large/display text ≥ 3:1.
- Custom components (drawer, modal, accordion, tabs) get correct ARIA: `aria-expanded`, `aria-hidden`, `role="dialog"` + focus trap for anything that overlays the page (drawer, modal, quick-view).
- Every content image has real `alt` text — pull `image.alt` from Shopify first, write a sane fallback second. Never ship an empty `alt` on a content image (decorative-only images get `alt=""` deliberately, not by omission).
- Respect `prefers-reduced-motion` — soften or disable scroll-reveal/transition-heavy effects when set.

## Interaction & states

- Every actionable element defines hover, focus, active, and disabled states explicitly — not just a default state with a color-only hover swap.
- Touch targets ≥ 44×44px on mobile: buttons, nav icons, variant swatches, quantity steppers, close buttons.
- Add-to-cart, search, filter, and newsletter interactions have a visible pending/loading state and a visible error state — never a silent no-op on failure.
- Form fields: persistent visible labels (not placeholder-as-label), inline validation messaging, clear required-field marking.

## Responsive

- Breakpoints as ranges, matching Skeleton/Dawn convention: mobile <750px, tablet 750–990px, desktop 990px+.
- Mobile nav, filters, and cart default to drawer/sheet patterns — not a shrunk desktop layout.
- Test real content edge cases before calling a component done: long product titles, out-of-stock state, empty collection, empty search results, single-item vs many-item grids.

## Visual consistency

- Every spacing value comes from `var(--space-*)` — no arbitrary `margin: 17px`.
- Every color comes from `var(--color-*)` — no one-off hex values.
- Hover/active/disabled states derive from token math (`color-mix()`, opacity applied to a token) — not new hardcoded colors invented per component.
- Display serif (Cormorant Garamond or equivalent) never used below ~20px — falls back to body font at small/UI sizes.

## Definition of done for any component

Matches the token system → passes Theme Check clean → keyboard- and screen-reader-sane markup → explicit states for every interaction → works at all three breakpoints → no hardcoded design values → tested with real (not placeholder) content.
