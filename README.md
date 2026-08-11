# superiorshavings.github.io

Jekyll site for Superior Shavings (Tumut NSW, part of Breeder's Choice
Woodshavings Pty Ltd), deployed to GitHub Pages by
`.github/workflows/jekyll.yml`.

## Two designs live in this repo

- **`/`** — the original site, rendered by `_layouts/default.html` and
  `index.md`. This is what the public sees. Do not break it.
- **`/preview/`** — the 2026 redesign (`_layouts/base|home|stockists.html`
  plus `_includes/`), noindexed and excluded from the sitemap so the client
  can review it live. Promoting it is a permalink change in `preview/*.md`.

Because both are built from one `_config.yml`, some keys exist only to keep
the old layout working and must not be renamed:

| Key | Read by |
| --- | --- |
| `title`, `description` | old layout via `{% seo %}` **and as visible hero copy** — keep byte-identical to production until the flip |
| `stockistscsv` | old layout's stockist finder (note: no underscore) |

The redesign reads `brand_description` / `brand_tagline` / `stockists_csv`
instead, so editing those cannot affect the live pages.

## Stockists

The finder fetches the owner's Dropbox CSV in the browser at page load, so
stockist edits go live with no deploy. Do not move this to build time.
State pages (`/preview/stockists/vic/` etc.) exist so the list is indexable —
the old JS-only finder was invisible to search engines.

## Wordmark

`_includes/wordmark.svg` and `images/logo.svg` are the original logo with its
embedded raster device rebuilt as a `<rect>` — the text paths are unchanged,
so it is pixel-identical but crisp at any size. `images/logo.svg` keeps the
original `viewBox` because the old layout still uses it.
`_includes/wordmark-modern.svg` is an unused alternative (Barlow Condensed
lettering, same device) kept for reference.

## Content notes

- Trading since 2002 in Holbrook; plant moved to Tumut in 2019.
- Bale ~0.18 m³, moisture 8–13%.
- The "triple screened" process (star screen → rotary trommel → airborne dust
  extraction) is deliberately worded differently here than on the sister site
  so the two domains do not serve identical paragraphs.
- The trade section's lede was written from copy the owner approved elsewhere:
  he struck the original in his edit but left no replacement. Confirm with him.
- Structured data uses `OfferCatalog`, never `Product` — Product entities
  require offers/review/aggregateRating, which these items do not have.

Image provenance is documented in `images/site/README.md`.
