---
name: AI provider fallback
description: The learning platform must remain usable when external AI access is unavailable.
---

The AI route should treat provider quota, credit, and malformed-response failures as normal degraded operation: return validated local educational content instead of exposing a server error.

**Why:** The project's OpenAI key can be configured while still returning HTTP 429 for unavailable credits, and the managed Replit AI integration may require an account upgrade.

**How to apply:** Preserve the local fallback bank and its source metadata whenever changing the AI provider, model, prompt, or response validation.