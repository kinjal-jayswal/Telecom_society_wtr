# ATD Credit & Supply Society Portal

A member portal for **The Ahmedabad Telephone Employees' Co-Operative Credit & Supply Society Limited** — a redesign of the society's website with online receipt search, member loan/savings summaries, an admin data-management console, and a simulated WhatsApp bot for self-service queries.

## Features

- **Receipt Search** — members look up a monthly recovery receipt (savings, loan recovery, interest) by staff number, year, and month.
- **Member Summary** — combined view of a member's profile, active loans, and receipt history.
- **Admin Workspace** (login-gated in the UI)
  - Bulk data import from **CSV, Excel (.xlsx/.xls), or PDF** statements, upserted into the database.
  - **AI-assisted parsing (Claude)** — optional, toggleable: PDF and Excel uploads can be read by Claude instead of the fixed-format parser, so inconsistent headers or irregular layouts still get mapped correctly. Falls back to the standard parser automatically if AI parsing fails or isn't configured. CSV always uses the standard parser.
  - Board of Directors CRUD, including an optional photograph per member (falls back to an initials avatar).
  - Society settings (name, address, contact info, interest rate, max loan amount).
  - Database backups: manual trigger, fortnightly automatic scheduler, download, and full JSON export.
- **WhatsApp Bot Simulator** — a chat-style UI backed by a webhook endpoint that answers `receipt`, `loans`, and `summary` commands.
- **Loan calculator** on the frontend for estimating installments.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18 + Vite, [lucide-react](https://lucide.dev/) icons |
| Backend  | Node.js + Express |
| Database | SQLite (local dev) or PostgreSQL (production, via `DATABASE_URL`) |
| File parsing | `csv-parser`, `xlsx`, `pdf-parse`, optionally `@anthropic-ai/sdk` (Claude) |
| Uploads | `multer` |
| Deployment | Procfile-based (Heroku/Railway style) |

The backend (`database.js`) auto-detects the environment: if `DATABASE_URL` is set it uses PostgreSQL, otherwise it falls back to a local `society.db` SQLite file. Both dialects share the same schema and query helpers.

## Project Structure

```
├── server.js            # Express app, REST API routes, file upload/parsing, WhatsApp webhook
├── database.js          # DB connection, schema (SQLite + Postgres), query helpers, seed data
├── aiParser.js            # Optional Claude-based extraction for PDF/Excel uploads
├── backupService.js      # Manual + fortnightly-scheduled backup logic
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx           # Entire frontend UI (public site, search, admin workspace, bot)
│   └── index.css
├── index.html            # Vite HTML entry
├── vite.config.js        # Dev server + /api proxy to backend on :5545
├── DESIGN.md             # Design system reference (colors, typography, glassmorphism)
├── Procfile               # `web: npm start` — production process definition
├── uploads/               # Temp storage for uploaded import files
├── backups/                # SQLite backup snapshots
├── society.db              # Local SQLite database file
├── site_home.html, receipt_search.html  # Legacy reference pages scraped from the original site
└── test.py                 # One-off script that fetched receipt_search.html for reference
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Install
```bash
npm install
```

### Development
Run backend and frontend separately (frontend proxies `/api` to `http://localhost:5545`):
```bash
npm run dev:backend    # Express API on port 5545
npm run dev:frontend   # Vite dev server on port 3000
```

### Production Build
```bash
npm run build   # builds the frontend into dist/
npm start       # runs server.js, which serves dist/ and the API on $PORT (default 5545)
```

## Configuration

Copy [.env.example](.env.example) to `.env` for local development (loaded automatically via `dotenv`; not needed on Railway, which injects vars directly).

| Env Var | Purpose |
|---------|---------|
| `PORT` | Port for the Express server (defaults to `5545`) |
| `DATABASE_URL` | If set, connects to PostgreSQL instead of local SQLite |
| `ANTHROPIC_API_KEY` | Enables AI-assisted PDF/Excel parsing. Without it, `/api/ai-status` reports `configured: false` and uploads always use the standard parser regardless of the admin toggle. |
| `ANTHROPIC_MODEL` | Optional — defaults to `claude-sonnet-5` |
| `BACKUP_BUCKET_ENDPOINT`, `BACKUP_BUCKET_ACCESS_KEY`, `BACKUP_BUCKET_SECRET_KEY`, `BACKUP_BUCKET_NAME`, `BACKUP_BUCKET_REGION` | Enables uploading each backup's JSON snapshot to a Railway object storage bucket (S3-compatible), independent of the app's own database |
| `RESEND_API_KEY`, `BACKUP_EMAIL_TO`, `BACKUP_EMAIL_FROM` | Enables emailing each backup's JSON snapshot via [Resend](https://resend.com)'s HTTP API (not SMTP — Railway blocks/throttles outbound SMTP, and Gmail tends to reject shared cloud IPs) |

AI parsing also requires the admin toggle at Admin Panel → Upload tab → "AI-Assisted Parsing (Claude)" to be turned on (persisted as the `ai_parsing_enabled` setting) — having the API key alone doesn't turn it on for uploads.

## Database

Tables: `members`, `receipts`, `loans`, `board_members`, `settings`, `backups`. Schema and seed data are created automatically on first run (`initDatabase()` in [database.js](database.js)) — a few sample members, loans, and receipts are seeded when the `members` table is empty.

## API Overview

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/members` | List all members |
| GET | `/api/receipts/search?account=&year=&month=` | Look up a receipt |
| GET | `/api/members/:staff_no/summary` | Member profile + loans + receipts |
| GET/POST | `/api/settings` | Read/update society settings |
| GET/POST/PUT/DELETE | `/api/board` | Board of Directors CRUD |
| GET | `/api/backups` | List backup log entries |
| POST | `/api/backups/run` | Trigger a manual backup (also uploads to the bucket/emails if configured) |
| GET | `/api/backups/download/:filename` | Download a backup file (local SQLite copy, falling back to the bucket) |
| GET | `/api/backups/export` | Export full DB state as JSON |
| POST | `/api/backups/import` | Restore the database from a previously exported JSON file (destructive — clears each table first) |
| GET | `/api/backups/status` | Whether the offsite bucket/email destinations are configured |
| POST | `/api/backups/status/test-email` | Sends a real test email to verify Resend is working |
| POST | `/api/upload-data` | Upload & import CSV/Excel/PDF member data (AI-assisted when enabled) |
| POST | `/api/upload-data/society-workbook?dryRun=true\|false` | Import the specific "members details" + "ledger" workbook format the society maintains manually (dry run previews without writing) |
| GET | `/api/upload-data/template?format=csv\|xlsx` | Download a blank upload template with the correct column headers |
| GET | `/api/ai-status` | Whether an Anthropic API key is configured, the model, and whether AI parsing is enabled |
| POST | `/api/ai-status/test` | Runs a live round-trip call to Claude to verify the key/model work |
| POST | `/api/whatsapp/webhook` | Simulated WhatsApp bot (`receipt`, `loans`, `summary`, `help`) |

## Notes

- `site_home.html` and `receipt_search.html` are static pages scraped from the original society website (via `test.py`) and kept as design/content reference — they are not served by the app.
- SQLite mode also keeps a local file-copy backup (`backups/`) for backward compatibility, but the JSON snapshot uploaded to the bucket/emailed is the actual disaster-recovery backup in Postgres mode (production), since Railway's app filesystem isn't persistent across deploys.
