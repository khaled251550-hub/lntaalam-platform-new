---
name: GitHub repository bootstrap
description: Reliable way to publish a complete workspace snapshot to a new GitHub repository through the managed connector.
---

For a newly created empty GitHub repository, create an initial file through the Contents API before using Git Data API trees, blobs, commits, and refs. Build tree entries with UTF-8 file paths; Git's default quoted path output can break non-ASCII filenames. Use raw text in tree entries where possible and upload binary blobs sequentially with pacing to avoid secondary rate limits.

**Why:** GitHub returns `409 Git Repository is empty` for direct blob/tree operations on an empty repository, and burst blob uploads can trigger `429` even when the core API rate limit remains available.

**How to apply:** Seed the repository, enumerate files with `git -c core.quotePath=false ls-files -co --exclude-standard`, upload a complete tree, then verify the remote tree against the local file list.