# Assistant Hints (First-Message Guidance)

Always:
1) Read `docs/roadmap-status.json` to understand what’s done vs pending.
2) Use `docs/context/context-pack.json` (redacted previews of key files).
3) Use `docs/db-facts.json` for schema, RLS, and policy existence (no data).
4) Respect `.chatignore` and `docs/redaction-rules.yml` — never request secrets.
5) When DB existence is uncertain, call the dashboard `/api/verify` endpoint
   with a **read_only_checks** query like:
   - `ext:pgcrypto`
   - `table:public:users`
   - `rls:public:users`
   - `policy:public:users:select:Users can view own record`

Prefer proposing **diffs/PR-ready edits** against files listed in the context pack.
If repo settings are needed, open a PR to `.roadmaprc.json` rather than inline instructions.
