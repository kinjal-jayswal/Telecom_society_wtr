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

`POST /api/upload-data` accepts CSV, XLSX/XLS, or PDF. CSV always uses the deterministic `parseCSV` (header-based). For XLSX/PDF, when AI parsing is enabled (see below) it calls `aiExtractRecords()` in [aiParser.js](aiParser.js) instead of the fixed-format `parseExcel`/`parsePDF` (regex line-matching); on any AI failure it falls back to the fixed-format parser automatically and reports `aiError` in the response. `importRecords()` in database.js then upserts members and receipts, tolerating multiple possible column-name aliases per field (e.g. `staffno`/`staff_no`/`hrms`/`staff_id`) — this is why the AI tool schema's field names (`staffno`, `savingsdeposit`, ...) were chosen to match those aliases directly.

**`xlsx` ESM import gotcha**: `import * as xlsx from 'xlsx'` does *not* expose `readFile`/`writeFile` as named exports (only `read`/`write`/`utils` are real named exports; `readFile`/`writeFile` live on the CJS `default` only). Always read the file into a buffer and call `xlsx.read(buffer, { type: 'buffer' })` (see `readWorkbook()` in server.js) — calling `xlsx.readFile()` directly throws `xlsx.readFile is not a function` at runtime, not at build time, so this is easy to miss without an actual upload test.

### AI-assisted parsing (Claude)

[aiParser.js](aiParser.js) wraps `@anthropic-ai/sdk`, forcing structured JSON output via a single tool (`extract_society_records`) with `tool_choice` pinned to it, so the model can't return prose. It's gated by two independent switches that both need to be true for `/api/upload-data` to use it:
1. `process.env.ANTHROPIC_API_KEY` present (`isAIAvailable()`).
2. The `ai_parsing_enabled` row in the generic `settings` key-value table (admin-toggleable from the Upload tab; read via the existing `getSettings()`, no schema change needed).

`GET /api/ai-status` exposes `{ configured, model, enabled }` (never the key itself) and `POST /api/ai-status/test` makes one live, cheap Claude call so the admin can verify the key/model actually work, not just that a string is set. `ANTHROPIC_MODEL` overrides the default model (`claude-sonnet-5`).

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
| `ANTHROPIC_API_KEY` | Enables AI-assisted PDF/Excel parsing (still needs the `ai_parsing_enabled` setting on to actually be used) |
| `ANTHROPIC_MODEL` | Overrides the default Claude model (`claude-sonnet-5`) used for parsing and the connection test |

Local dev loads these from `.env` via `dotenv/config` (see [.env.example](.env.example)); Railway injects them directly, no `.env` involved.
