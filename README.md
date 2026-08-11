# ATD Credit & Supply Society Portal

A member portal for **The Ahmedabad Telephone Employees' Co-Operative Credit & Supply Society Limited** — a redesign of the society's website with online receipt search, member loan/savings summaries, an admin data-management console, and a simulated WhatsApp bot for self-service queries.

## Features

- **Receipt Search** — members look up a monthly recovery receipt (savings, loan recovery, interest) by staff number, year, and month.
- **Member Summary** — combined view of a member's profile, active loans, and receipt history.
- **Admin Workspace** (login-gated in the UI)
  - Bulk data import from **CSV, Excel (.xlsx/.xls), or PDF** statements, upserted into the database.
  - Board of Directors CRUD.
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
| File parsing | `csv-parser`, `xlsx`, `pdf-parse` |
| Uploads | `multer` |
| Deployment | Procfile-based (Heroku/Railway style) |

The backend (`database.js`) auto-detects the environment: if `DATABASE_URL` is set it uses PostgreSQL, otherwise it falls back to a local `society.db` SQLite file. Both dialects share the same schema and query helpers.

## Project Structure

```
├── server.js            # Express app, REST API routes, file upload/parsing, WhatsApp webhook
├── database.js          # DB connection, schema (SQLite + Postgres), query helpers, seed data
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

| Env Var | Purpose |
|---------|---------|
| `PORT` | Port for the Express server (defaults to `5545`) |
| `DATABASE_URL` | If set, connects to PostgreSQL instead of local SQLite |

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
| POST | `/api/backups/run` | Trigger a manual backup |
| GET | `/api/backups/download/:filename` | Download a backup file |
| GET | `/api/backups/export` | Export full DB state as JSON |
| POST | `/api/upload-data` | Upload & import CSV/Excel/PDF member data |
| POST | `/api/whatsapp/webhook` | Simulated WhatsApp bot (`receipt`, `loans`, `summary`, `help`) |

## Notes

- `site_home.html` and `receipt_search.html` are static pages scraped from the original society website (via `test.py`) and kept as design/content reference — they are not served by the app.
- Backups are file-copy based for SQLite; for PostgreSQL, backups are assumed to be managed by the cloud provider and only logged.
