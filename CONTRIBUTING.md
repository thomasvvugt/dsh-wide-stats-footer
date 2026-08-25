# Contributing to dsh-wide-stats-footer

Thanks for your interest in improving this plugin!

## Development setup

```sh
git clone https://github.com/thomasvvugt/dsh-wide-stats-footer.git
cd dsh-wide-stats-footer
```

No build step and no npm dependencies — the plugin is plain ESM JavaScript
plus a CSS patch layer. See [docs/development.md](docs/development.md) for
the full development workflow.

## Reporting bugs

Open an issue using the bug report template. Always include:

- Your DSH version (`dsh --version`)
- The diagnostics object from DevTools: `window.__WIDE_STATS_FOOTER__`
- Whether the footer is clamped, wide, or partially styled

## Submitting changes

1. Fork the repo and create a branch from `main`.
2. Keep changes minimal and scoped — this plugin intentionally does one thing.
3. Test against the DSH version you target (`pnpm run dev:web` in a DSH
   checkout, plus a production build if you touch discovery logic).
4. Open a pull request against `main` describing what changed and which DSH
   version you verified against.

## Guidelines

- **No npm dependencies.** The plugin must stay dependency-free.
- **No install-time scripts.** Ever.
- **Degrade gracefully.** If DSH's markup/CSS changes, the plugin must
  no-op silently rather than throw or break the UI.
- Keep the CSS override specificity-based (`.{hash}_root.{hash}_root`),
  not injection-order-based.

## Releasing

Maintainers: see [docs/release.md](docs/release.md).
