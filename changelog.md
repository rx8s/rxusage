# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- DEPLOY.md section on adding or changing allowed accounts: keep `ALLOWED_EMAIL` and the Firestore rules email list in sync, what breaks when only one is changed, and never overwrite a shared project's rules.
- `DEPLOY.md`: step-by-step guide for deploying your own copy (Firebase, Cloudflare Pages, KV, collector, troubleshooting).
- MIT `LICENSE`.
- Pages Function `functions/api/me.ts` and a "This account isn't allowed" screen for Google accounts not in `ALLOWED_EMAIL`.
- Automatic plan limits for Claude and ChatGPT at the top of the dashboard: 5-hour and weekly used %, reset countdowns, last-update time, and warnings for stale data or a failed collection; refreshes every minute.
- Mac collector `collector/rxusage-collector.mjs` that reads limits from the Claude Code sign-in (Keychain) and the Codex sign-in (`~/.codex/auth.json`) and sends only the numbers to the site, plus `collector/install.sh` to run it every 5 minutes as a LaunchAgent.
- Cloudflare Pages Function `functions/api/limits.ts`: POST from the collector (token checked against `LIMITS_INGEST_TOKEN_SHA256`), GET for the dashboard (Firebase ID token for `ALLOWED_EMAIL`), stored in the `LIMITS` KV namespace.

- Plan limits section for claude.ai and ChatGPT: add, edit and delete limits by hand (used % and reset time), stored in Firestore `rxusage/{uid}/quotas`, with a reset countdown and colour-coded progress bars.
- API usage section: month-to-date cost, tokens, requests and top models for Anthropic and OpenAI, with a monthly budget per provider stored in Firestore `rxusage/{uid}/settings/budgets`.
- Cloudflare Pages Function `functions/api/usage.ts` that verifies the Firebase ID token against `ALLOWED_EMAIL` and reads the Anthropic Usage and Cost Analytics API and the OpenAI organization Costs and Completions usage APIs with server-side admin keys.
- Firebase rules in `firebase/` (Firestore, Realtime Database, Storage) as `rxusage` blocks to merge into the shared project's existing rules, limiting each user to their own data; `.dev.vars.example` for the function's settings, and an `npm run preview` script (wrangler) for testing the function locally.
- Next.js 16 app (App Router, TypeScript, Tailwind CSS 4) configured for static export (`out/`) to deploy on Cloudflare Pages.
- Firebase client setup for Authentication, Cloud Firestore, Realtime Database, Cloud Storage and Analytics, configured through `NEXT_PUBLIC_FIREBASE_*` variables (`.env.example`).
- Sign-in page with email/password and Google sign-in, plus a notice when Firebase is not configured.
- Dashboard shell with sidebar, client-side auth guard, sign-out, an empty state for usage data, and a Firebase service status panel.
- Thai/English language switch and dark/light theme toggle, both remembered in the browser.
- Design system from ui-ux-pro-max in `design-system/rxusage/MASTER.md` (IBM Plex Sans Thai + Fira Code, slate + green palette).
- README with local setup and Cloudflare Pages deploy steps.
- `.claude/launch.json` dev server config.
- `changelog.md` to track project changes.
- `.gitignore` covering macOS, editor, secret, log, Node.js, Next.js, Cloudflare and Python files.

### Changed

- DEPLOY.md "Fork and clone" now says forks of the public repo stay public, adds a private-repo path, the source repo link, and how to pull later updates.
- Sign-in is Google (Gmail) only; the email/password form is removed. `ALLOWED_EMAIL` accepts several comma-separated emails.
- Prepared the repo to be public: README rewritten, Firebase rules and `.dev.vars.example` no longer assume a specific shared project, and `collector/install.sh` now requires the site URL on first install.
- Manual limits section renamed to "Manual limits" and moved below API usage; Firebase token checks moved to `functions/_lib/auth.ts`, shared by both functions; `npm run preview` now binds a local `LIMITS` KV.
- All Firebase data now lives under the `rxusage` prefix because the Firebase project is shared: Firestore `rxusage/{uid}/...`, Realtime Database and Storage `rxusage/...` via `rtdbRef()` / `storageRef()`, Analytics events `rxusage_<name>` via `logAppEvent()`.
- Dashboard overview now shows plan limits and API usage instead of the Firebase service status panel.
