# Audit Notes

Scope
- Only **read-only** artifacts are provided to assistants:
  - `docs/context/context-pack.json` (redacted file previews + hashes)
  - `docs/db-facts.json` (schema, RLS, policy facts)
  - `docs/roadmap-status.json` (status only)

Protections
- Secrets are excluded by `.chatignore` and `docs/redaction-rules.yml`.
- Context pack truncates large files and stores SHA-256 for change traceability.
- Database verification uses a **read-only boolean** edge function; no data is returned.

Traceability
- CI commits include timestamps and job logs for when context was refreshed.
- Dashboard PRs modify `.roadmaprc.json` and are reviewable like any code change.
