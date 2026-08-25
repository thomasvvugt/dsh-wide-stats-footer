# dsh-wide-stats-footer

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) web plugin that
un-clamps the composer **stats footer** — the line under the input card:

```
16 turns · 255 steps | LLM 44m17s · Tool call 42m32s | TTFT avg 5.3s · 87 tok/s | Cache hit 97% | Input 32.3M tok · Output 113K tok
```

Stock DSH clamps that line to the chat content width, so long stats compact into `…`:

```
16 turns · 255 steps | LLM 44m17s · Tool call 42m32s | TTFT avg 5.3s · 87 tok/s | Cac…
```

With this plugin the footer spans the **full composer width**, centered — no more truncation
on wide screens.

## Install

```sh
dsh plugin --profile web add github:thomasvvugt/dsh-wide-stats-footer
```

Then restart `dsh web`. Confirm with `dsh --profile web --dump-config` (look for the
`dsh-wide-stats-footer` layer). To pin a release: `github:thomasvvugt/dsh-wide-stats-footer#v0.1.0`.

The plugin is also listed in the [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
registry, so it installs one-click from the in-app plugin market (`dshmarket`) and is
findable via plugin search.

**Uninstall:** `dsh plugin --profile web remove dsh-wide-stats-footer`, then restart.

## What it changes

The stock footer (`StatsLine` in `@deepseek-ai/dsh-client-ui-conversation`) is clamped by
its CSS module root rule:

```css
.{hash}_root {
  text-align: center;
  max-width: var(--dsh-chat-content-width);          /* 748px — the clamp */
  padding: 4px calc(var(--dsh-composer-side-clearance) + 16px) 0;  /* +32px more */
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin: 0 auto; width: 100%;
}
```

The plugin overrides exactly the width clamp and the horizontal padding on that element:

```css
.{hash}_root.{hash}_root { max-width: none; padding-left: 0; padding-right: 0; }
```

`width: 100%`, `margin: 0 auto` and `text-align: center` stay with the base rule, so the
footer becomes as wide as its container (the composer column) while remaining centered. The
doubled class gives specificity (0,2,0) over the base rule's (0,1,0), independent of
`<style>` injection order — third-party theme CSS included. An inline-style fallback is
applied to the footer element itself for extra robustness.

## Hash discovery (nothing hardcoded)

`{hash}` is a hashed CSS-module prefix that changes whenever
`dsh-client-ui-conversation` is rebuilt. The browser half discovers it at runtime:

1. scan `document.styleSheets` for the stats line's separator rule
   `.{hash}_sep { color: var(--dsw-alias-separator-primary); margin: 0 10px }`
   (unique in the app — the other `_sep`/`_separator` classes use dots or different
   margins), and
2. verify the sibling `.{hash}_root` rule actually declares the
   `max-width: var(--dsh-chat-content-width)` clamp before touching it.

A second, independent path finds the footer in the DOM directly. `MutationObserver`s on
`<head>` and `<body>` re-run discovery when style tags arrive (late bundle materialization,
HMR rebuilds, theme swaps) and when the session view (re)mounts the footer.

**If DSH's markup changes** in a future release, the plugin degrades to a silent no-op —
it never breaks the UI, the stock footer just stays clamped until an update.

## Diagnostics

Open DevTools and read `window.__WIDE_STATS_FOOTER__`:

```js
{ appliedAt, styleHash, domHash, overrideChars, inlineFixed, lastSyncAt }
```

`styleHash`/`domHash` show the discovered CSS-module prefix from each source; a `null`
there means that source hasn't matched. One `console.info` line is logged per boot.

## Troubleshooting / FAQ

**The footer is still clamped.**
Check `window.__WIDE_STATS_FOOTER__` in DevTools:

- `styleHash: null` **and** `domHash: null` — hash discovery matched nothing.
  This means your DSH build's markup/CSS differs from the verified shape
  (e.g. a newer DSH release). The plugin has degraded to a no-op; please
  [open an issue](https://github.com/thomasvvugt/dsh-wide-stats-footer/issues)
  with your DSH version and the diagnostics object.
- Hashes present but `overrideChars: 0` — the override rule was written but
  the base clamp rule wasn't the expected shape. Also worth an issue.
- `appliedAt: null` — the plugin never ran; confirm it's actually installed
  (`dsh --profile web --dump-config` should show the layer) and that you
  restarted `dsh web` after installing.

**It worked, then stopped after a DSH update.**
Expected occasionally: the CSS-module hash rotates on rebuilds. The plugin
rediscovers it at runtime, so a stop after an update means the *markup*
changed shape. Check the diagnostics object and report it.

**Does this slow the app down?**
No. Discovery runs once per boot plus on observed DOM/style mutations; the
observers do no periodic polling.

**Can I change the alignment (left/right instead of centered)?**
Not via config — this plugin deliberately has no configuration and does one
thing. The base `text-align: center` from DSH is preserved.

**Does it work with custom themes?**
Yes. The override uses doubled-class specificity (0,2,0), so it wins over
the stock rule regardless of stylesheet order. A theme that itself overrides
the footer's `max-width` with equal-or-higher specificity will win — that's
correct behavior.

## Compatibility

Built and verified against DSH `0.1.1-rc.2` web. Client-only: no host-side behavior, no
configuration, zero npm dependencies, no install scripts.

## License

[MIT](./LICENSE)
