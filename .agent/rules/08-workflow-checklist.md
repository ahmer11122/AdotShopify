# Workflow phases + definition of done

## Phases

1. **Foundation** — clone Skeleton, connect GitHub, `tokens.css`/`critical.css`, global layout, Theme Check config + CI wired up before any component work starts.
2. **Components** — header, buttons, product card, price, image, drawer, modal, forms, nav. Build as snippets/blocks, schema-driven where merchant-facing.
3. **Shopify functionality** — products/variants, collections/filters, search, cart, metafields, theme-editor settings.
4. **Pages** — home, collection, product, search, cart, static pages, 404. Composed from Phase 2 components.
5. **Content** — real product data, real photography, real editorial copy. Never ship a milestone against mock data — Skeleton's JSON templates render real Shopify objects from day one, use that.
6. **QA** — mobile + desktop, throttled network, real variants, cart flows, search, theme-editor stress test, clean `shopify theme check` run, accessibility pass, Lighthouse/PageSpeed pass.
7. **Client handoff** — push unpublished → QA on client store with real data → client approval → publish.

## Definition of done — per component

- [ ] Uses only `var(--color-*)` / `var(--space-*)` / `var(--font-*)` tokens, zero hardcoded design values
- [ ] `shopify theme check` clean on the changed files
- [ ] Keyboard-operable, correct ARIA where applicable, passes contrast check
- [ ] Explicit hover/focus/active/disabled + loading/error states where relevant
- [ ] Works at mobile (<750px), tablet (750–990px), desktop (990px+)
- [ ] Tested against real content edge cases (long titles, sold-out, empty states)
- [ ] No React/Vue/framework syntax, no unnecessary dependency added
- [ ] If it pulled a pattern from Dawn: logic only, no copied CSS/classnames (see `02-dawn-boundaries.md`)

## Definition of done — per page/milestone

- [ ] All components on the page individually pass their own definition of done
- [ ] Real Shopify data end-to-end, no placeholder/mock content
- [ ] `shopify theme check` clean on full repo
- [ ] Lighthouse/PageSpeed pass on mobile emulation, throttled network
- [ ] Reviewed against PRD §5 (Modern Editorial Minimalism) — not just "does it work," but "does it look like the brand direction"
