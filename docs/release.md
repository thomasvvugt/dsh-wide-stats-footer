# Release / tarball notes

This plugin has no build step: what's in the repo is what ships. A release
is just a tag (and optionally a GitHub Release with the npm tarball
attached for offline installs).

## What ships in the tarball

Controlled by the `files` field in `package.json`:

- `index.js` — host entry (no-op guard / metadata)
- `client.js` — browser half (hash discovery + CSS override)
- `cordis.patch.yml` — CSS patch layer
- `README.md`, `LICENSE`

Docs, templates, and `.github/` are intentionally **not** in the tarball;
they live in the repo only.

## Release procedure

1. Update `CHANGELOG.md` (new `[X.Y.Z] - YYYY-MM-DD` section).
2. Bump `version` in `package.json`.
3. Commit: `chore: release vX.Y.Z`.
4. Tag and push:

   ```sh
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin main --tags
   ```

5. Verify the pack contents locally: `npm pack --dry-run`.
6. Optionally attach the tarball (`npm pack` output) to a GitHub Release so
   users can install offline:
   `dsh plugin --profile web add ./dsh-wide-stats-footer-X.Y.Z.tgz`.

## Install sources, ranked

| Source | Command |
| --- | --- |
| Branch (default) | `dsh plugin --profile web add github:thomasvvugt/dsh-wide-stats-footer` |
| Pinned tag | `dsh plugin --profile web add github:thomasvvugt/dsh-wide-stats-footer#v0.1.0` |
| Local tarball | `dsh plugin --profile web add ./dsh-wide-stats-footer-0.1.0.tgz` |

npm publishing is **optional** and not required for the
[awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
listing; GitHub is the canonical source.
