# Student Loans Solutions

**Your path to financial freedom.**

This repository contains the public Student Loans Solutions website and its advisor application.

## Canonical layout

- `apps/web/public/index.html` — existing public marketing site; its content and visual identity are preserved.
- `apps/web/src/` — React Router advisor CRM, document intake, and agreement signing application.
- `apps/web/server.mjs` — production Express/React Router server. There is no `server.ts` entry point.
- `apps/pocketbase/` — PocketBase hooks and workspace.
- `apps/google-apps-script/` — secondary Sheets/reporting integration.
- `docs/pocketbase-setup.md` — required PocketBase collections, permissions and environment setup.
- `tests/` — production server smoke tests.

## Local setup

Requires Node.js 22.

1. Copy `apps/web/.env.example` to `apps/web/.env`.
2. Set the PocketBase URL and a dedicated server-side service account as described in `docs/pocketbase-setup.md`.
3. Install and run:

```sh
npm install
npm run check:structure
npm run dev
```

The public website is at http://localhost:5173. The React Router application routes are `/login`, `/crm`, `/document-preparation`, and `/sign/:token`.

For production, run `npm run build` then `npm start`. The application server listens on `PORT` (default 3000).

## Data and security

PocketBase is the primary database and authentication service. The browser receives only the public PocketBase URL; the service-account credentials are server-only and must never be exposed through a `VITE_` variable or committed.

The CRM collections must deny public list/view/update/delete operations. The server-side service account is used for public inquiry creation and token-based agreement signing. Exact collection fields and starter access rules are documented in `docs/pocketbase-setup.md`.

Google Sheets is not the live CRM data store. Do not configure a public Apps Script endpoint to bypass PocketBase access rules.

## Current implementation boundary

The repository now has a real React Router server, advisor login, PocketBase-backed CRM screens, public inquiry endpoint, document intake, and token-based typed-name electronic acknowledgment workflow. These require a configured PocketBase instance and matching collection schema before live data operations can succeed. The signing workflow captures a typed name, consent, timestamp and request metadata; it is not a certificate-based digital-signature product.

Do not deploy this recovery branch over the current Hostinger site until the PocketBase connection and end-to-end checks have been completed and deployment is separately approved.
