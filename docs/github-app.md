# GitHub App (Production Auth)

## Purpose
Use a GitHub App for least-privilege, auditable automation (PRs, file reads/writes). Personal Access Tokens are allowed **only for local development**.

## App configuration
- **Permissions**
  - Repository → **Contents: Read & write**
  - Repository → **Pull requests: Read & write**
- **Subscribe to events (optional)**
  - `pull_request`, `push` (for webhooks, if used)
- **Installation**
  - Installed on: `SSkylar1/Roadmap-Kit-Starter` (and any additional target repos)

## Deployment
- Dashboard env vars (Vercel):
  - `GH_APP_ID`: `<your app id>`
  - `GH_APP_PRIVATE_KEY`: PEM as a single line with `\n`
  - `GH_APP_INSTALLATION_ID`: *(optional, can auto-resolve per repo)*
- Local dev fallback:
  - `GITHUB_TOKEN` with `repo` scope (do **not** set in production)

## Notes
- PATs are disabled in production deploys; GitHub App is the only auth path.
- The dashboard opens PRs and reads/writes repo files only through the App.