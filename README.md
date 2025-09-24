# Roadmap Kit Starter

[![Roadmap status](docs/roadmap-status.svg)](docs/roadmap-status.md)

This repository captures an end-to-end example of the Roadmap Kit in action. It
includes CI workflows, Supabase read-only probes, context packs, and automation
scripts that keep roadmap status up to date.

## What lives here?

- **Automation scripts** under `scripts/` keep the roadmap, context pack, and DB
  facts in sync.
- **Docs** in `docs/` explain the GitHub App integration, assistant guardrails,
  and generated status artifacts.
- **Supabase edge function** (`supabase/functions/read_only_checks/`) provides a
  read-only verification endpoint for automated checks.

## Quick start

```bash
npm install
npm run roadmap:check
```

The `roadmap:check` script refreshes:

- `docs/roadmap-status.json` and `docs/roadmap-status.md` (human-friendly view)
- `docs/roadmap-status.svg` (the badge embedded above)

Additional helper commands live in `package.json` (for example
`npm run context:pack` and `npm run db:facts`).

## Useful references

- [Roadmap overview](docs/roadmap.yml)
- [Current status details](docs/roadmap-status.md)
- [Context pack preview](docs/context/context-pack.json)
- [DB facts](docs/db-facts.json)
