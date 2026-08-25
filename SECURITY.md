# Security Policy

## Supported versions

Only the latest release line is supported with security updates.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |

## Reporting a vulnerability

Please report vulnerabilities privately:

1. Open a GitHub security advisory at
   https://github.com/thomasvvugt/dsh-wide-stats-footer/security/advisories/new,
   or
2. Email the maintainer via the email listed on the GitHub profile.

Do **not** open a public issue for security problems. Please allow up to
14 days for a response before following up.

## Scope notes

This plugin is client-side only: a small amount of JavaScript injected into
the DSH web client plus a CSS patch layer. It:

- has **zero npm dependencies**,
- runs **no install scripts** (see `package.json` — no `preinstall`,
  `postinstall`, or `scripts`),
- makes **no network requests**,
- reads **no credentials, secrets, or files**.

If you find any behavior contradicting the above, that is a security issue
and we want to hear about it.
