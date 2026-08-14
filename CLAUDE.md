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

**Multiple transactions per member per month**: the society uploads three separate monthly files (savings, salary-deducted loan repayment, other-method/cheque repayment), one row per member each. `receipts` is keyed `UNIQUE(member_id, year, month, receipt_no)` (not just `member_id, year, month`) so these land as distinct rows instead of each upload overwriting the last — an optional `receipt_no` column in the template tags which entry a row is (e.g. `"SAVINGS"`, `"SALARY"`, or an actual cheque/receipt number); left blank it defaults to `''`, preserving old single-file-per-month replace-on-reupload behavior for anyone not using the field. `searchReceipt()` (the "official receipt" search/print/WhatsApp view) aggregates all of a month's rows into one total at query time — sums the amounts, concatenates `receipt_no` values, takes the first row's `loan_balance_before` and the last row's `loan_balance_after`; `getMemberSummary()`/Ledger Details shows each row individually instead. `importRecords()` deducts `loan_recovery` from that member's most-recently-created loan's `remaining_balance` on every upload — by the *delta* versus whatever that same `(member, year, month, receipt_no)` row previously contributed, not the raw new amount, so re-uploading a correction doesn't double-deduct the value it's replacing.

The constraint widening from `(member_id, year, month)` to include `receipt_no` needed a real migration (`migrateReceiptsUniqueConstraint()` in database.js): Postgres can `DROP`/`ADD CONSTRAINT`, but SQLite has no `ALTER TABLE` support for changing a UNIQUE constraint at all — it rebuilds the whole table (create `receipts_new` with the new constraint, copy rows across explicit column names, drop the old table, rename). Guarded by inspecting `sqlite_master`'s stored `CREATE TABLE` text for the new constraint so it only runs once; safe against existing data since no table ever had more than one row per `(member, year, month)` before this, so widening the constraint can't conflict with anything already there.

**`xlsx` ESM import gotcha**: `import * as xlsx from 'xlsx'` does *not* expose `readFile`/`writeFile`/`SSF` as named exports (only `read`/`write`/`utils` are real named exports; everything else, including the date-serial formatter `SSF`, lives on the CJS `default` only). Always read the file into a buffer and call `xlsx.read(buffer, { type: 'buffer' })` (see `readWorkbook()` in server.js), and grab `SSF` via `xlsx.SSF || xlsx.default.SSF` (see societyParser.js) — calling `xlsx.readFile()` or `xlsx.SSF.parse_date_code()` directly throws at runtime, not at build time, so this is easy to miss without an actual upload test.

### Society workbook importer (real-world manual format)

ATD Credit & Supply Society maintains their real records manually as a 4-sheet Excel workbook (not the flat CSV template above). [societyParser.js](societyParser.js)'s `parseSocietyWorkbook()` is a purpose-built parser for two of those sheets specifically:
- **"members details"**: the member roster. `LF No` is their account identifier — reused directly as `members.staff_no` (no rename) to avoid rewiring receipt search / the WhatsApp bot / every other flow built around that column. Three distinct "balance as of X" figures exist per member (`interim_balance`, `bonus_amount`, `current_balance`) — don't conflate them, they come from three separately-labeled source columns.
- **"ledger"**: monthly loan repayment history, structured as *repeating blocks per member* (not flat rows) — the member's LF No is embedded in free text like `" KIRTI A MAKWANA   LF-73   PAGE-03"` and extracted via regex. There's no monthly savings figure in this sheet at all (savings is a running balance on the member, not a transaction) — imported receipts always get `savings_deposit = 0`.
- **"Bank pass-book"** and **"Loan details"** are intentionally out of scope: the former is the society's own bank reconciliation (not member data), and the latter has no reliable per-row LF No to join on (only free-text names), so blind name-matching risked assigning guarantor data to the wrong person.

The source ledger sometimes has multiple rows landing in the same member-month (legitimate multi-payment loan closures, and occasionally what looks like a date-entry mistake reusing an earlier date) — `parseSocietyWorkbook()` sums them into one receipt rather than crashing on the `receipts` UNIQUE(member_id, year, month) constraint, and reports every occurrence in `issues` for manual review.

`importSocietyWorkbook()` in database.js writes the parsed result: members upserted by `staff_no`; each member's current loan tagged `loan_type = 'Society Loan'` (so this importer never touches loans entered another way) with `remaining_balance` synced to their *most recent receipt's* `loan_balance_after` after all receipts land, since that's more accurate than the static loan-amount snapshot; members referenced only in the ledger (former/exited members not in the current roster) are created `status = 'INACTIVE'`.

`POST /api/upload-data/society-workbook?dryRun=true` parses and returns a full preview (counts + `issues`) without writing anything — always run this before the real import (no `dryRun` param) given this handles real financial data for real people.

### AI-assisted parsing (Claude)

[aiParser.js](aiParser.js) wraps `@anthropic-ai/sdk`, forcing structured JSON output via a single tool (`extract_society_records`) with `tool_choice` pinned to it, so the model can't return prose. It's gated by two independent switches that both need to be true for `/api/upload-data` to use it:
1. `process.env.ANTHROPIC_API_KEY` present (`isAIAvailable()`).
2. The `ai_parsing_enabled` row in the generic `settings` key-value table (admin-toggleable from the Upload tab; read via the existing `getSettings()`, no schema change needed).

`GET /api/ai-status` exposes `{ configured, model, enabled }` (never the key itself) and `POST /api/ai-status/test` makes one live, cheap Claude call so the admin can verify the key/model actually work, not just that a string is set. `ANTHROPIC_MODEL` overrides the default model (`claude-sonnet-5`).

### Backups (offsite: bucket + email, plus restore)

`backupService.js`'s `performBackup()` runs on a fortnightly `setInterval` and on manual trigger (`POST /api/backups/run`). It always builds a full JSON snapshot via `getFullState()` and, when configured, uploads it to a Railway object storage bucket (`BACKUP_BUCKET_*` env vars, S3-compatible, via `@aws-sdk/client-s3`) and/or emails it (`emailService.js`, Resend's HTTP API — **not SMTP**, since Railway blocks/throttles outbound SMTP and Gmail tends to reject shared cloud IPs regardless). Both destinations are optional/independent; `isBucketConfigured()`/`isEmailConfigured()` gate them and everything degrades gracefully to a no-op when unset, same pattern as AI parsing. `GET /api/backups/status` exposes which destinations are configured (never the credentials); `POST /api/backups/status/test-email` sends a real test email.

In SQLite mode, the historical local-file-copy behavior is *also* kept for backward compatibility (there's no persistent volume on the Railway app service, so this only matters for local dev — in Postgres/production, the JSON snapshot is the entire backup). `GET /api/backups/download/:filename` checks the local `backups/` dir first, then falls back to the bucket, since Postgres-mode backups only ever exist in the bucket/email, never on local disk.

`POST /api/backups/import` (`importFullState()` in database.js) is the restore path for the JSON export/backup: it's destructive (clears every table, then re-inserts the backup's rows preserving original IDs so `receipts`/`loans` → `members` foreign keys stay intact), not wrapped in a DB transaction (consistent with the rest of this file), and resyncs Postgres `SERIAL` sequences afterward since explicit-ID inserts don't advance them automatically.

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
| `BACKUP_BUCKET_ENDPOINT`, `BACKUP_BUCKET_ACCESS_KEY`, `BACKUP_BUCKET_SECRET_KEY`, `BACKUP_BUCKET_NAME`, `BACKUP_BUCKET_REGION` | Railway bucket (S3-compatible) that backups upload to |
| `RESEND_API_KEY`, `BACKUP_EMAIL_TO`, `BACKUP_EMAIL_FROM` | Resend HTTP API config that backups get emailed through |

Local dev loads these from `.env` via `dotenv/config` (see [.env.example](.env.example)); Railway injects them directly, no `.env` involved.
