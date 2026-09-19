# Theme Check workflow

Shopify's official linter, built into Shopify CLI. No separate install. Covers two categories:

**Correctness:** Liquid/JSON syntax errors, missing snippet/section references, unused `{% assign %}`, deprecated/unknown tags and filters, undefined objects, missing/mismatched translation keys, excessive snippet nesting.

**Performance (Core Web Vitals):** parser-blocking scripts missing `defer`/`async`, remote (non-Shopify-CDN) assets, `<img>` missing `width`/`height`, oversized pagination, CSS/JS asset-size limits (opt-in — turn on), redundant CDN preconnect hints.

## When to run it

- After every non-trivial edit to any `.liquid`, `.json`, or `.css`/`.js`-in-Liquid file.
- Before saying a task is done. A Theme Check error is equivalent to a build failure — it blocks completion, not a "note for later."
- `--auto-correct` first for anything it can safely fix, then manually resolve the rest.

## Commands

```bash
shopify theme check                    # whole repo
shopify theme check --path sections/   # scoped to a directory
shopify theme check --path sections/hero.liquid   # scoped to one file
shopify theme check --auto-correct     # safe auto-fixes
```

## Config — `.theme-check.yml` at repo root

```yaml
root: .
AssetSizeCSS:
  enabled: true
  threshold_in_bytes: 100000
AssetSizeJavaScript:
  enabled: true
  threshold_in_bytes: 10000
ImgWidthAndHeight:
  enabled: true
ParserBlockingScript:
  enabled: true
```

Don't disable a check to make a failing build pass. If a check is wrong for a specific line, use the scoped disable comment, not a global config change:

```liquid
{% # theme-check-disable ImgWidthAndHeight %}
...
{% # theme-check-enable ImgWidthAndHeight %}
```

## CI — `.github/workflows/theme-check.yml`

```yaml
name: Theme Check
on: [pull_request]
jobs:
  theme-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @shopify/cli
      - run: shopify theme check
```

Every PR against the client theme repo runs this before merge is allowed. No manual override without explicit sign-off from Jj.
