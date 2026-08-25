# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-24

### Added

- Initial release: un-clamps the DSH composer stats footer so it spans the
  full composer width, centered, instead of being clamped to the chat
  content width (`748px`) and truncated with an ellipsis.
- Runtime hash discovery for the CSS-module prefix (stylesheet scan +
  DOM fallback), with `MutationObserver` re-sync for late style
  materialization, HMR rebuilds and theme swaps.
- Inline-style fallback applied directly to the footer element.
- Diagnostics via `window.__WIDE_STATS_FOOTER__`.
- Silent no-op degradation when DSH markup changes in a future release.

[0.1.0]: https://github.com/thomasvvugt/dsh-wide-stats-footer/releases/tag/v0.1.0
