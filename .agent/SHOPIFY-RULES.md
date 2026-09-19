# SHOPIFY-RULES.md — read this before touching any file

You are working on a Shopify Skeleton-based theme for Smart Solutions. Full spec: `../PRD.md`. This file is the enforceable checklist — the detail files in `rules/` are the reference when you need the "why."

## Hard rules (never break these)

1. Inspect existing code before modifying anything — read the section/block/snippet fully before editing it.
2. Follow Skeleton's architecture. Directory structure is fixed — see `rules/01-architecture.md`. Don't invent new top-level folders.
3. Do not add Dawn as a dependency, git submodule-merge, or copy Dawn CSS files wholesale. Dawn is read-only reference — see `rules/02-dawn-boundaries.md`.
4. Do not use React, Vue, or any JS framework in the production theme. Ever. Convert designs per `rules/03-react-to-liquid.md`.
5. Use native Liquid objects for all Shopify data (`product`, `collection`, `cart`, `customer`, etc.). Never hardcode or mock catalog data — real Shopify data is always available in dev store.
6. Use `sections/` + `blocks/` (with `{% schema %}`) for anything merchant-configurable. Use `snippets/` (no schema) for pure render primitives.
7. CSS goes in `{% stylesheet %}` inside the component file by default. Global-only CSS lives in `assets/tokens.css` + `assets/critical.css`. Full rules: `rules/04-css-strategy.md`.
8. Never hardcode a color, spacing, or font value — always `var(--color-*)`, `var(--space-*)`, `var(--font-*)` from `tokens.css`.
9. No `!important`, ever, except as a documented last resort against a third-party embed you don't control.
10. Mobile-first CSS. Design mobile as its own layout, not a shrunk desktop — see PRD §5.
11. Every `<img>` has `width`/`height` or `aspect-ratio`. Use `image_url`/responsive `image_tag`, never a single fixed-size asset.
12. No unnecessary dependencies, no build step (Vite/webpack/Tailwind) unless the project explicitly calls for one. Plain Liquid + CSS + vanilla JS is the default.
13. Stateful interactive components (drawer, modal, accordion, tabs, carousel) → native Web Components (`customElements.define`), not querySelectorAll spaghetti.
14. Run `shopify theme check --path <changed-dir>` after every non-trivial change. A Theme Check error is a build failure — don't report the task done with one outstanding. Full workflow: `rules/05-theme-check.md`.
15. Preserve responsive behavior and accessibility on every edit — don't fix one breakpoint or one interaction state and silently break another.
16. Never sacrifice performance for decorative animation. No autoplay hero video by default. Respect `prefers-reduced-motion`.
17. Do not modify unrelated files in a change — keep diffs scoped to the task.
18. Before building a new UI component, check `snippets/` and `blocks/` for an existing one to reuse or extend.
19. Test the rendered result (via `shopify theme dev`), not just Liquid syntax correctness.
20. Every interactive element needs explicit hover/focus/active/disabled states and keyboard operability — see `rules/06-ui-ux.md`.
21. When converting a reference component (React or otherwise), translate design + interaction, never syntax. Flag anything you can't fully convert instead of pasting foreign syntax into a `.liquid` file.
22. If a rule here conflicts with a direct instruction from Jj in the current task, the current task instruction wins — but say so, don't silently override the rule.

## Rule files

| File | Covers |
|---|---|
| `rules/01-architecture.md` | Folder structure, sections vs blocks vs snippets |
| `rules/02-dawn-boundaries.md` | What's allowed to reference from Dawn, and what isn't |
| `rules/03-react-to-liquid.md` | React/Aceternity/shadcn → native Liquid conversion pipeline |
| `rules/04-css-strategy.md` | Global tokens vs `{% stylesheet %}` vs `{% style %}` |
| `rules/05-theme-check.md` | Linting workflow, CLI commands, CI config |
| `rules/06-ui-ux.md` | Accessibility, states, responsive, visual-consistency rules |
| `rules/07-performance.md` | Image/JS/video performance constraints |
| `rules/08-workflow-checklist.md` | Build phases + definition-of-done per component |
| `rules/09-premium-feature-parity.md` | Feature bar set by paid Theme Store themes (quick buy, swatches, mega menu, lookbooks, etc.) — what to build and at what priority |
