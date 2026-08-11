import sqlite3 from 'sqlite3';
import pg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'society.db');

export const isPostgres = !!process.env.DATABASE_URL;

let db = null;
let pgPool = null;

if (isPostgres) {
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('Using PostgreSQL database connection');
} else {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log('Connected to local SQLite database at:', dbPath);
    }
  });
}

// Database helper functions: insulated from specific drivers
export function query(sql, params = []) {
  if (isPostgres) {
    return pgPool.query(sql, params).then(res => res.rows);
  } else {
    return new Promise((resolve, reject) => {
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      db.all(sqliteSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }
}

export function get(sql, params = []) {
  if (isPostgres) {
    return pgPool.query(sql, params).then(res => res.rows[0] || null);
  } else {
    return new Promise((resolve, reject) => {
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      db.get(sqliteSql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }
}

export function run(sql, params = []) {
  if (isPostgres) {
    return pgPool.query(sql, params).then(res => ({ changes: res.rowCount }));
  } else {
    return new Promise((resolve, reject) => {
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      db.run(sqliteSql, params, function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

// Dialect schema declarations
const SQLITE_SCHEMAS = [
  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'ACTIVE'
  )`,
  `CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    year TEXT NOT NULL,
    month TEXT NOT NULL,
    total_recovered REAL NOT NULL,
    savings_deposit REAL NOT NULL,
    loan_recovery REAL NOT NULL,
    interest_recovery REAL NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(member_id, year, month)
  )`,
  `CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    loan_type TEXT NOT NULL,
    loan_amount REAL NOT NULL,
    interest_rate REAL NOT NULL,
    installments_total INTEGER NOT NULL,
    installments_paid INTEGER DEFAULT 0,
    remaining_balance REAL NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    backup_time TEXT NOT NULL,
    status TEXT NOT NULL,
    size INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS board_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    initials TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    photo_url TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`
];

const POSTGRES_SCHEMAS = [
  `CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    staff_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE'
  )`,
  `CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL,
    year VARCHAR(10) NOT NULL,
    month VARCHAR(10) NOT NULL,
    total_recovered DOUBLE PRECISION NOT NULL,
    savings_deposit DOUBLE PRECISION NOT NULL,
    loan_recovery DOUBLE PRECISION NOT NULL,
    interest_recovery DOUBLE PRECISION NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(member_id, year, month)
  )`,
  `CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL,
    loan_type VARCHAR(50) NOT NULL,
    loan_amount DOUBLE PRECISION NOT NULL,
    interest_rate DOUBLE PRECISION NOT NULL,
    installments_total INTEGER NOT NULL,
    installments_paid INTEGER DEFAULT 0,
    remaining_balance DOUBLE PRECISION NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    backup_time VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    size BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS board_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    display_order INTEGER DEFAULT 0,
    photo_url TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`
];

// Initialize database tables
export async function initDatabase() {
  const schemas = isPostgres ? POSTGRES_SCHEMAS : SQLITE_SCHEMAS;
  for (const schema of schemas) {
    await run(schema);
  }
  await runMigrations();
  await seedInitialData();
}

// Adds columns to tables that already existed before this column was introduced
async function runMigrations() {
  try {
    const alterSql = isPostgres
      ? "ALTER TABLE board_members ADD COLUMN IF NOT EXISTS photo_url TEXT"
      : "ALTER TABLE board_members ADD COLUMN photo_url TEXT";
    await run(alterSql);
  } catch (err) {
    // SQLite has no "ADD COLUMN IF NOT EXISTS" — ignore "duplicate column" on repeat runs
  }
}

// Seed initial data for testing
async function seedInitialData() {
  const countRow = await get("SELECT COUNT(*) as count FROM members");
  const count = parseInt(countRow?.count || 0);
  if (count > 0) {
    console.log('Database tables already seeded.');
    return;
  }

  console.log('Seeding initial records for testing...');
  
  // 1. Members
  await run("INSERT INTO members (staff_no, name, email, phone) VALUES ($1, $2, $3, $4)", ['1001', 'Mahendrakumar Solanki', 'mahendra.s@atdcresoc.co.in', '9876543210']);
  await run("INSERT INTO members (staff_no, name, email, phone) VALUES ($1, $2, $3, $4)", ['1002', 'Hiteshkumar Solanki', 'hitesh.s@atdcresoc.co.in', '9823456789']);
  await run("INSERT INTO members (staff_no, name, email, phone) VALUES ($1, $2, $3, $4)", ['1003', 'Ashokkumar M Patel', 'ashok.p@atdcresoc.co.in', '9812345678']);

  // Get member IDs
  const m1 = await get("SELECT id FROM members WHERE staff_no = $1", ['1001']);
  const m2 = await get("SELECT id FROM members WHERE staff_no = $1", ['1002']);
  const m3 = await get("SELECT id FROM members WHERE staff_no = $1", ['1003']);

  if (m1 && m2 && m3) {
    // 2. Loans
    await run("INSERT INTO loans (member_id, loan_type, loan_amount, interest_rate, installments_total, installments_paid, remaining_balance) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m1.id, 'PMT', 500000.0, 8.4, 70, 15, 392857.0]);
    await run("INSERT INTO loans (member_id, loan_type, loan_amount, interest_rate, installments_total, installments_paid, remaining_balance) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m2.id, 'Festival', 48000.0, 8.4, 12, 4, 32000.0]);
    await run("INSERT INTO loans (member_id, loan_type, loan_amount, interest_rate, installments_total, installments_paid, remaining_balance) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m3.id, 'SP Food', 25000.0, 8.4, 10, 2, 20000.0]);
    await run("INSERT INTO loans (member_id, loan_type, loan_amount, interest_rate, installments_total, installments_paid, remaining_balance) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m3.id, 'TMP', 4800, 8.4, 16, 8, 2400]);

    // 3. Receipts
    await run("INSERT INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m1.id, '2026', '06', 12500.0, 2500.0, 8000.0, 2000.0]);
    await run("INSERT INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m1.id, '2026', '07', 12500.0, 2500.0, 8000.0, 2000.0]);
    await run("INSERT INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m2.id, '2026', '06', 6200.0, 1500.0, 4000.0, 700.0]);
    await run("INSERT INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m2.id, '2026', '07', 6200.0, 1500.0, 4000.0, 700.0]);
    await run("INSERT INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m3.id, '2026', '06', 4500.0, 1000.0, 3000.0, 500.0]);
    await run("INSERT INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery) VALUES ($1, $2, $3, $4, $5, $6, $7)", [m3.id, '2026', '07', 4500.0, 1000.0, 3000.0, 500.0]);
  }

  // 4. Settings
  await run("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ['society_name', "Ahmedabad Telephone Employees' Co-Operative Credit & Supply Society Limited"]);
  await run("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ['address', 'Central Telephone Exchange Building, Shahpur Road, Ahmedabad - 380 001']);
  await run("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ['phone', '079 - 2562 6999']);
  await run("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ['email', 'atdcresoc@gmail.com']);
  await run("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ['established_year', '1951']);
  await run("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ['interest_rate', '8.4']);
  await run("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", ['max_pmt_amount', '700000']);

  // 5. Board
  await run("INSERT INTO board_members (name, role, initials, display_order) VALUES ($1, $2, $3, $4)", ['Mahendrakumar Solanki', 'Chairman', 'MS', 1]);
  await run("INSERT INTO board_members (name, role, initials, display_order) VALUES ($1, $2, $3, $4)", ['Hiteshkumar Solanki', 'Managing Director', 'HS', 2]);
  await run("INSERT INTO board_members (name, role, initials, display_order) VALUES ($1, $2, $3, $4)", ['Ashokkumar M Patel', 'Honorary Secretary', 'AP', 3]);
  await run("INSERT INTO board_members (name, role, initials, display_order) VALUES ($1, $2, $3, $4)", ['Bharatkumar M Shah', 'Assistant Secretary', 'BS', 4]);

  console.log("Database seeded successfully.");
}

// Database helper API for query routes
export async function getMembers() {
  return query("SELECT * FROM members ORDER BY name ASC");
}

export async function searchReceipt(staffNo, year, month) {
  const sql = `
    SELECT r.*, m.name, m.staff_no, m.email, m.phone 
    FROM receipts r
    JOIN members m ON r.member_id = m.id
    WHERE m.staff_no = $1 AND r.year = $2 AND r.month = $3
  `;
  return get(sql, [staffNo, year, month]);
}

export async function getMemberSummary(staffNo) {
  const member = await get("SELECT * FROM members WHERE staff_no = $1", [staffNo]);
  if (!member) return null;

  const loans = await query("SELECT * FROM loans WHERE member_id = $1", [member.id]);
  const receipts = await query("SELECT * FROM receipts WHERE member_id = $1 ORDER BY year DESC, month DESC", [member.id]);

  return { member, loans, receipts };
}

export async function saveSettings(key, value) {
  const sql = isPostgres
    ? "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
    : "INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)";
  return run(sql, [key, value]);
}

export async function getSettings() {
  const rows = await query("SELECT * FROM settings");
  const settingsObj = {};
  rows.forEach(r => {
    settingsObj[r.key] = r.value;
  });
  return settingsObj;
}

export async function getBoardMembers() {
  return query("SELECT * FROM board_members ORDER BY display_order ASC");
}

export async function saveBoardMember(name, role, initials, displayOrder, photoUrl = null, id = null) {
  if (id) {
    return run("UPDATE board_members SET name = $1, role = $2, initials = $3, display_order = $4, photo_url = $5 WHERE id = $6", [name, role, initials, parseInt(displayOrder), photoUrl, id]);
  } else {
    return run("INSERT INTO board_members (name, role, initials, display_order, photo_url) VALUES ($1, $2, $3, $4, $5)", [name, role, initials, parseInt(displayOrder), photoUrl]);
  }
}

export async function getBoardMemberById(id) {
  return get("SELECT * FROM board_members WHERE id = $1", [id]);
}

export async function deleteBoardMember(id) {
  return run("DELETE FROM board_members WHERE id = $1", [id]);
}

export async function getBackups() {
  return query("SELECT * FROM backups ORDER BY backup_time DESC");
}

export async function addBackupLog(filename, size, status) {
  return run("INSERT INTO backups (filename, backup_time, status, size) VALUES ($1, $2, $3, $4)", [filename, new Date().toISOString(), status, size]);
}

export async function getFullState() {
  const members = await query("SELECT * FROM members");
  const receipts = await query("SELECT * FROM receipts");
  const loans = await query("SELECT * FROM loans");
  const boardMembers = await query("SELECT * FROM board_members");
  const settings = await query("SELECT * FROM settings");
  const backups = await query("SELECT * FROM backups");
  
  return { members, receipts, loans, boardMembers, settings, backups };
}

// Restores a snapshot previously produced by getFullState() (the JSON
// export downloaded from the admin Backups tab). Clears each table and
// re-inserts the backup's rows in FK-safe order (members before the
// loans/receipts that reference member_id), preserving original IDs so
// those relationships stay intact. Not wrapped in a DB transaction —
// consistent with the rest of this file, which doesn't use them either —
// so the returned per-table stats/errors are how a partial failure shows up.
export async function importFullState(state) {
  const stats = { members: 0, loans: 0, receipts: 0, boardMembers: 0, settings: 0, errors: [] };

  await run("DELETE FROM receipts");
  await run("DELETE FROM loans");
  await run("DELETE FROM members");
  await run("DELETE FROM board_members");
  await run("DELETE FROM settings");

  for (const m of state.members || []) {
    try {
      await run(
        "INSERT INTO members (id, staff_no, name, email, phone, status) VALUES ($1, $2, $3, $4, $5, $6)",
        [m.id, m.staff_no, m.name, m.email ?? null, m.phone ?? null, m.status ?? 'ACTIVE']
      );
      stats.members++;
    } catch (err) {
      stats.errors.push(`member ${m.staff_no}: ${err.message}`);
    }
  }

  for (const l of state.loans || []) {
    try {
      await run(
        "INSERT INTO loans (id, member_id, loan_type, loan_amount, interest_rate, installments_total, installments_paid, remaining_balance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [l.id, l.member_id, l.loan_type, l.loan_amount, l.interest_rate, l.installments_total, l.installments_paid ?? 0, l.remaining_balance]
      );
      stats.loans++;
    } catch (err) {
      stats.errors.push(`loan ${l.id}: ${err.message}`);
    }
  }

  for (const r of state.receipts || []) {
    try {
      await run(
        "INSERT INTO receipts (id, member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [r.id, r.member_id, r.year, r.month, r.total_recovered, r.savings_deposit, r.loan_recovery, r.interest_recovery]
      );
      stats.receipts++;
    } catch (err) {
      stats.errors.push(`receipt ${r.id}: ${err.message}`);
    }
  }

  for (const b of state.boardMembers || []) {
    try {
      await run(
        "INSERT INTO board_members (id, name, role, initials, display_order, photo_url) VALUES ($1, $2, $3, $4, $5, $6)",
        [b.id, b.name, b.role, b.initials, b.display_order ?? 0, b.photo_url ?? null]
      );
      stats.boardMembers++;
    } catch (err) {
      stats.errors.push(`board member ${b.name}: ${err.message}`);
    }
  }

  for (const s of state.settings || []) {
    try {
      await saveSettings(s.key, s.value);
      stats.settings++;
    } catch (err) {
      stats.errors.push(`setting ${s.key}: ${err.message}`);
    }
  }

  // Postgres SERIAL columns don't auto-advance when IDs are inserted
  // explicitly, so the next auto-generated insert would collide with a
  // restored ID unless the sequence is resynced to the restored max.
  if (isPostgres) {
    for (const table of ['members', 'loans', 'receipts', 'board_members']) {
      try {
        await run(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`);
      } catch (err) {
        stats.errors.push(`sequence resync for ${table}: ${err.message}`);
      }
    }
  }

  return stats;
}

export async function importRecords(records) {
  let membersInserted = 0;
  let receiptsInserted = 0;
  let errors = 0;

  if (records.length === 0) {
    return { membersInserted, receiptsInserted, errors };
  }

  for (const record of records) {
    const staffNo = record.staffno || record.staff_no || record.hrms || record.staff_id;
    const name = record.name || record.member_name || record.full_name;
    const year = record.year || record.receipt_year;
    const month = record.month || record.receipt_month;
    
    let monthStr = String(month || '').trim();
    if (monthStr.length === 1) monthStr = '0' + monthStr;

    const savings = parseFloat(record.savingsdeposit || record.savings_deposit || record.savings || 0);
    const loan = parseFloat(record.loanrecovery || record.loan_recovery || record.loan || 0);
    const interest = parseFloat(record.interestrecovery || record.interest_recovery || record.interest || 0);
    const total = savings + loan + interest;

    if (!staffNo || !name || !year || !monthStr) {
      errors++;
      continue;
    }

    try {
      // 1. Insert member
      const memberInsertSql = isPostgres
        ? "INSERT INTO members (staff_no, name) VALUES ($1, $2) ON CONFLICT (staff_no) DO NOTHING"
        : "INSERT OR IGNORE INTO members (staff_no, name) VALUES ($1, $2)";
      
      const mResult = await run(memberInsertSql, [staffNo, name]);
      if (mResult.changes > 0) {
        membersInserted++;
      }

      // 2. Fetch member ID
      const member = await get("SELECT id FROM members WHERE staff_no = $1", [staffNo]);
      if (!member) {
        errors++;
        continue;
      }

      // 3. Insert/Replace receipt
      const receiptInsertSql = isPostgres
        ? `INSERT INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (member_id, year, month) DO UPDATE SET 
             total_recovered = EXCLUDED.total_recovered,
             savings_deposit = EXCLUDED.savings_deposit,
             loan_recovery = EXCLUDED.loan_recovery,
             interest_recovery = EXCLUDED.interest_recovery`
        : `INSERT OR REPLACE INTO receipts (member_id, year, month, total_recovered, savings_deposit, loan_recovery, interest_recovery)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`;
      
      await run(receiptInsertSql, [member.id, String(year), monthStr, total, savings, loan, interest]);
      receiptsInserted++;
    } catch (err) {
      console.error("Import record error:", err);
      errors++;
    }
  }

  return { membersInserted, receiptsInserted, errors };
}

// Fallback compatibility export
export function getDb() {
  return {
    all: (sql, params, cb) => query(sql, params).then(rows => cb(null, rows)).catch(cb),
    get: (sql, params, cb) => get(sql, params).then(row => cb(null, row)).catch(cb),
    run: (sql, params, cb) => run(sql, params).then(res => cb(null, res)).catch(cb)
  };
}
