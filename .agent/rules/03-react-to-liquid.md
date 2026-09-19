# React → Liquid conversion protocol

Source references you'll get: React Bits, Aceternity, Magic UI, shadcn/ui, a client Figma-to-React export, or a screenshot of an existing site. The rule in one line: **translate the design and interaction — never the syntax.**

## Pipeline

```
React component (code / screenshot)
        ↓ 1. Visual + interaction analysis
Layout, spacing, type scale, breakpoints, states, motion — described in plain terms
        ↓ 2. Liquid markup
Schema-driven if merchant-configurable, otherwise plain snippet markup
        ↓ 3. CSS
{% stylesheet %}, tokens only (var(--color-*) / var(--space-*) / var(--font-*))
        ↓ 4. Vanilla JS
{% javascript %}, only if interaction requires client-side behavior
        ↓
Native Shopify component
```

## Concrete mappings

| React pattern | Liquid/JS equivalent |
|---|---|
| `useState`/`useReducer` | DOM attributes (`data-state`, `aria-expanded`) + module-scope JS variables where needed. No virtual DOM. |
| `useEffect` on mount | `DOMContentLoaded`, or a Web Component's `connectedCallback` |
| Props | `block.settings.*` / `section.settings.*` via `{% schema %}` |
| `{cond && <X/>}` (static condition, known at render) | `{% if %}` in Liquid — render server-side, ship zero JS for it |
| `{cond && <X/>}` (condition changes after load, e.g. on scroll/click) | JS toggling a class or `hidden`/`aria-hidden` attribute |
| Persistent client-side state (accordion, tabs, carousel, drawer, modal) | A native Web Component: `customElements.define('component-name', class extends HTMLElement {...})` |
| Tailwind utility classes | Do not install Tailwind. Extract the intended spacing/type values, map to this theme's tokens, write semantic BEM classes |
| Framer Motion / animation libraries | CSS transitions/`@keyframes` first. IntersectionObserver only if CSS truly can't do it. Always gate behind `prefers-reduced-motion` |
| npm component library (shadcn, etc.) | Never installed. Read the rendered markup/behavior, rebuild natively |

## Hard rule

If a component's interaction is too complex to convert cleanly to vanilla JS/Web Components in a reasonable scope, **stop and flag it** as a scope question — don't paste JSX into a `.liquid` file "for reference," don't half-convert it with a React import left in, and don't quietly add a build step to make React work. None of those are acceptable outcomes for this theme.

## Why Web Components specifically

They colocate behavior with markup (the custom element's JS lives next to what it controls, same as a React component would), they don't need a framework runtime, and they're the pattern Shopify's own modern themes already use (`<cart-drawer>`, `<quantity-input>` style custom elements in Dawn 2.0+). Reach for this any time you'd have reached for `useState` in the reference component.
