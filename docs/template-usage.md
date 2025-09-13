# Template Usage (New Repo in <15 min)

1) **Use this repo as a template** or copy `.github/`, `docs/`, `scripts/`, `supabase/functions/read_only_checks`.
2) **Set repo secrets**:
   - `READ_ONLY_CHECKS_URL`: Supabase edge function URL returning booleans.
3) **Edit `.roadmaprc.json`** for your env and probe URL.
4) **Install workflows**:
   - `roadmap.yml` (status)
   - `context-pack.yml` (context)
   - `db-facts.yml` (db facts)
5) **Run once locally**:
   ```bash
   npm i
   npm run context:pack
   npm run db:facts
   npm run roadmap:check
   git add docs/context docs/db-facts.* docs/roadmap-status.json
   git commit -m "chore: seed context & status"
   git push
