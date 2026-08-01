# Contributing

Additions, corrections, and fixes are welcome.

## Add an entry

This list is **data-driven**: the README and the site are generated from [`data/tools.json`](data/tools.json). **Edit that file, not the README** (the README's list section is overwritten by the build).

1. Add one object to `data/tools.json`:
   ```json
   {
     "name": "Name",
     "repo": "owner/repo",
     "url": "https://github.com/owner/repo",
     "category": "<a valid category>",
     "desc": "One honest sentence: what it does and who it is for."
   }
   ```
   Include `repo` (`owner/name`) when it is on GitHub so the star count auto-populates.
2. Regenerate: `node scripts/generate.mjs`
3. Open a PR.

## Rules

- Open-source or genuinely useful. No pure marketing, no paid placements.
- No dead links. Prefer things you have actually used.
- One honest sentence per entry. Put it in the right category.
