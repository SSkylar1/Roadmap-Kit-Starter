# Adopt Roadmap Kit in <30 Minutes

Use this quick-start checklist to port the Roadmap Kit workflows and docs into a
new repository.

## 1. Prep (5 minutes)

- Ensure you have Node.js 18+, npm, and the Supabase CLI installed locally.
- Copy this repository or use it as a GitHub template.
- Create a Supabase project (free tier is fine) and deploy the
  `read_only_checks` function.

## 2. Configure secrets & settings (5 minutes)

- Generate a service role key for the Supabase project and store the hosted edge
  function URL.
- In the new repo, set the `READ_ONLY_CHECKS_URL` secret to that URL.
- Review `.roadmaprc.json` and update `verify.defaultEnv` plus any
  environment-specific overrides.

## 3. Install automation workflows (10 minutes)

- Copy the workflows from `.github/workflows/`:
  - `roadmap.yml` (status generator)
  - `context-pack.yml` (context bundle)
  - `db-facts.yml` (database facts)
- Copy the helper scripts in `scripts/` if you started from a clean repo.
- Commit the workflows and scripts so CI can run immediately after the first
  push.

## 4. Seed initial artifacts (5 minutes)

Run the bootstrap commands locally:

```bash
npm install
npm run context:pack
npm run db:facts
npm run roadmap:check
```

Commit the generated artifacts:

- `docs/context/context-pack.json`
- `docs/db-facts.json`
- `docs/roadmap-status.json`, `docs/roadmap-status.md`, and `docs/roadmap-status.svg`

## 5. Confirm dashboard integration (5 minutes)

- Install the Roadmap Kit GitHub App (or configure PAT fallback) so status PRs
  receive ✅/❌ flip comments.
- Open the dashboard and verify the new repository displays all roadmap items as
  expected.
- Share the dashboard URL with collaborators to track progress from day one.

With these steps the Roadmap Kit automation is live, the status badge renders in
`README.md`, and your team can iterate with guardrails in place—no multi-day
setup required.
