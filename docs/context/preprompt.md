# Preprompt (Context Attachment)

Use these references as ground truth for this repository:
- Roadmap status: `docs/roadmap-status.json`
- Context pack (redacted code/docs previews): `docs/context/context-pack.json`
- DB facts (tables, RLS, policies): `docs/db-facts.json`
- Tech stack: `docs/tech-stack.yml`

Rules:
- Never reveal or invent secrets.
- Suggest changes as PR-ready diffs.
- When verifying DB existence, rely on the read-only probe (`/api/verify`) or `docs/db-facts.json`, not live queries.
