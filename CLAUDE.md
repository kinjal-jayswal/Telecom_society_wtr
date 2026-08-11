# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A member portal for **The Ahmedabad Telephone Employees' Co-Operative Credit & Supply Society Limited**: receipt search, member loan/savings summaries, an admin data-management console (CSV/Excel/PDF import, board & settings CRUD, DB backups), and a simulated WhatsApp bot webhook.

## Commands

```bash
npm install             # install dependencies

npm run dev:backend     # Express API on :5545 (uses society.db / DATABASE_URL)
npm run dev:frontend    # Vite dev server on :3000, proxies /api -> :5545

npm run build           # vite build -> dist/
npm start               # node server.js — serves dist/ + API on $PORT (default 5545)
```

There is no test suite, linter, or type checker configured in this repo (no `test`/`lint` script in package.json).

## Architecture

**Single-page monolith frontend, single-file Express backend.**

- [src/App.jsx](src/App.jsx) is the *entire* frontend — one component (~1700 lines) with all state (public site, receipt search, admin workspace, WhatsApp bot simulator, loan calculator) managed via `useState`/`useEffect` and an `activeTab`/`adminTab` string switch instead of routing. There is no component decomposition or router; when extending the UI, follow the existing pattern of adding state + a conditional render block rather than introducing new abstractions unless asked.
- [server.js](server.js) defines all REST routes directly (no route modules/controllers) plus inline CSV/Excel/PDF parsing helpers at the bottom of the file. New endpoints should follow the same flat `app.get/post/put/delete` style.
- [database.js](database.js) is the only data-access layer. It exports low-level `query`/`get`/`run` helpers plus higher-level functions (`getMembers`, `searchReceipt`, `importRecords`, etc.) that `server.js` calls directly — there is no ORM.

### Dual-database dialect handling

`database.js` picks the backend at import time based on `process.env.DATABASE_URL`:
- Set → PostgreSQL via `pg.Pool` (production, e.g. Railway).
- Unset → local SQLite file `society.db`.

`isPostgres` gates which of `SQLITE_SCHEMAS`/`POSTGRES_SCHEMAS` is applied and which SQL variant (e.g. `INSERT OR REPLACE` vs `ON CONFLICT ... DO UPDATE`) is used per query. **All SQL is written with `$1, $2, ...` placeholders**; the SQLite path rewrites them to `?` internally (`query`/`get`/`run` in database.js), so always use `$n` placeholders when adding queries, never `?`. When adding a table or column, update both schema arrays and both variants of any affected insert/upsert query.

### Data import pipeline

`POST /api/upload-data` accepts CSV, XLSX/XLS, or PDF (regex line-matching), normalizes each row's keys (lowercase, strip non-alphanumerics) in `parseCSV`/`parseExcel`/`parsePDF`, then `importRecords()` in database.js upserts members and receipts, tolerating multiple possible column-name aliases per field (e.g. `staffno`/`staff_no`/`hrms`/`staff_id`).

### Backups

`backupService.js` copies the SQLite file to `backups/` on a fortnightly `setInterval` and on manual trigger (`POST /api/backups/run`); every backup is logged to the `backups` table via `addBackupLog`. In Postgres mode, `performBackup()` does not copy any file — it just logs a virtual entry, since actual backups are assumed to be handled by the cloud provider. `GET /api/backups/export` is the DB-agnostic alternative: a full JSON dump of every table.

### Admin auth is client-side only

`handleAdminLogin` in App.jsx checks a hardcoded username/password (`admin` / `atdcresoc2026`) purely in the browser. **None of the `/api/*` routes (settings, board, upload-data, backups) enforce authentication server-side** — the "Admin Workspace" UI gate is not a real access control. Keep this in mind before treating any admin-only route as secured, and flag it if asked to work on security-sensitive changes.

### Legacy reference files

`site_home.html` and `receipt_search.html` are static pages scraped from the original society website (fetched by `test.py`) and kept only as visual/content reference — they are not served or imported by the app. `DESIGN.md` documents the intended design system (colors, typography, glassmorphism rules) that `src/App.jsx`/`src/index.css` should follow.

## Environment variables

| Var | Effect |
|---|---|
| `PORT` | Express listen port (default `5545`) |
| `DATABASE_URL` | If set, switches `database.js` to PostgreSQL |
