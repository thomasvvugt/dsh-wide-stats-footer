# Development & maintenance notes

## Repo layout

```
index.js           host entry — no-op guard, exports metadata
client.js          browser half — hash discovery, CSS override, observers
cordis.patch.yml   CSS patch layer (the actual visual override)
package.json       metadata + dsh bundle manifest
```

No build, no dependencies, no install scripts. Keep it that way — it is a
documented guarantee (see SECURITY.md and CONTRIBUTING.md).

## Test loop

1. Point a DSH web profile at a local checkout (or `dsh plugin --profile
   <p> add /abs/path/to/dsh-wide-stats-footer`).
2. Run `dsh web` with that profile.
3. Open DevTools, check `window.__WIDE_STATS_FOOTER__`:
   - `styleHash` and/or `domHash` non-null
   - `overrideChars > 0`
   - `appliedAt` set
4. Visually confirm: with a long conversation (many turns), the stats line
   under the composer shows all segments without `…` truncation.
5. Test degradation: temporarily break the expected clamp signature in
   `client.js` and confirm nothing throws and the stock footer stays intact.

## What to re-verify on a DSH upgrade

- The `_sep` rule signature (`color: var(--dsw-alias-separator-primary);
  margin: 0 10px`) is still unique in the app stylesheet.
- The `_root` rule still declares `max-width: var(--dsh-chat-content-width)`.
- The DOM fallback selector still matches the footer element's classes.

If any of these change, update the matchers in `client.js` and note the DSH
version in README's Compatibility section.

## Maintenance principles

- One concern: the width clamp. Resist scope creep.
- Degrade to no-op, never throw.
- Specificity over order: keep the doubled-class selector pattern.
- Re-run the full test loop before tagging a release.
