---
name: Capacitor package installation
description: Environment constraint encountered while preparing Capacitor packaging.
---

The Replit package firewall rejected the Capacitor CLI dependency tree when it selected `tar@6.2.1`/`tar@6.1.15`. Pinning the workspace override to `tar@7.5.22` allowed the Capacitor 7 dependency tree to install from the available package store.

**Why:** The blocked tarball prevented both the initial install and local CLI execution; the newer tar package was already available and worked with Capacitor CLI 7.

**How to apply:** Keep the tar override synchronized in `package.json` and `pnpm-lock.yaml`, and confirm `pnpm install --offline` plus `pnpm run mobile:sync` before changing Capacitor versions.