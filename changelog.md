# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Plan limits section for claude.ai and ChatGPT: add, edit and delete limits by hand (used % and reset time), stored in Firestore `users/{uid}/quotas`, with a reset countdown and colour-coded progress bars.
- API usage section: month-to-date cost, tokens, requests and top models for Anthropic and OpenAI, with a monthly budget per provider stored in Firestore `users/{uid}/settings/budgets`.
- Cloudflare Pages Function `functions/api/usage.ts` that verifies the Firebase ID token against `ALLOWED_EMAIL` and reads the Anthropic Usage and Cost Analytics API and the OpenAI organization Costs and Completions usage APIs with server-side admin keys.
- `firestore.rules` limiting each user to their own data, `.dev.vars.example` for the function's settings, and an `npm run preview` script (wrangler) for testing the function locally.
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

- Dashboard overview now shows plan limits and API usage instead of the Firebase service status panel.
