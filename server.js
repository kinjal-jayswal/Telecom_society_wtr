import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';
import * as xlsx from 'xlsx';
import pdf from 'pdf-parse';

import { 
  initDatabase, 
  getMembers, 
  searchReceipt, 
  getMemberSummary, 
  saveSettings, 
  getSettings, 
  getBoardMembers, 
  saveBoardMember,
  getBoardMemberById,
  deleteBoardMember,
  getBackups,
  getFullState,
  importFullState,
  addBackupLog,
  importRecords,
  importSocietyWorkbook,
  isPostgres
} from './database.js';
import { parseSocietyWorkbook } from './societyParser.js';
import { performBackup, startBackupScheduler, isBucketConfigured, downloadFromBucket } from './backupService.js';
import { isAIAvailable, getAIModel, aiExtractRecords, testAIConnection } from './aiParser.js';
import { isEmailConfigured, testEmailConnection } from './emailService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = join(__dirname, 'uploads');
const backupsDir = join(__dirname, 'backups');

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const app = express();
const PORT = process.env.PORT || 5545;

app.use(cors());
app.use(express.json());

// Set up file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// Board member photos are stored inline as base64 data URIs in the DB (no
// persistent volume is mounted for the app service), so they use in-memory
// storage instead of the disk storage above.
const boardPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for board member photos.'));
    }
  }
});

// Initialize database and start scheduler
initDatabase()
  .then(() => {
    startBackupScheduler();
    console.log('Database initialized and backups scheduler set up.');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });

// --- API ROUTES ---

// 1. Get all members
app.get('/api/members', async (req, res) => {
  try {
    const rows = await getMembers();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Receipt Search API (Public / Member use)
app.get('/api/receipts/search', async (req, res) => {
  const { account, year, month } = req.query;

  if (!account || !year || !month) {
    return res.status(400).json({ error: 'Missing required parameters: account, year, and month are required.' });
  }

  try {
    const row = await searchReceipt(account, year, month);
    if (!row) {
      return res.status(404).json({ error: 'No recovery receipt found for the specified account, year, and month.' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Member Detail Summary (Receipts & Loans)
app.get('/api/members/:staff_no/summary', async (req, res) => {
  const { staff_no } = req.params;
  try {
    const summary = await getMemberSummary(staff_no);
    if (!summary) return res.status(404).json({ error: 'Member not found.' });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Backups List
app.get('/api/backups', async (req, res) => {
  try {
    const rows = await getBackups();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Trigger Manual Backup
app.post('/api/backups/run', async (req, res) => {
  try {
    const backup = await performBackup();
    res.json({ message: 'Backup triggered successfully.', backup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Download Backup file (local SQLite copy, falling back to the offsite bucket)
app.get('/api/backups/download/:filename', async (req, res) => {
  const { filename } = req.params;
  const safeFilename = filename.replace(/\\|\//g, '');
  const filePath = join(backupsDir, safeFilename);

  if (fs.existsSync(filePath)) {
    return res.download(filePath);
  }

  try {
    const buffer = await downloadFromBucket(safeFilename);
    if (buffer) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
      return res.send(buffer);
    }
  } catch (err) {
    console.error('Bucket download failed:', err.message);
  }

  res.status(404).json({ error: 'Backup file not found.' });
});

// 7. Full DB State JSON Export (Alternative backup method for PostgreSQL)
app.get('/api/backups/export', async (req, res) => {
  try {
    const state = await getFullState();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=society_database_export.json');
    res.send(JSON.stringify(state, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Whether the offsite backup destinations (bucket / email) are configured,
// so the admin can see this without exposing any credentials.
app.get('/api/backups/status', (req, res) => {
  res.json({
    bucketConfigured: isBucketConfigured(),
    emailConfigured: isEmailConfigured()
  });
});

// Verifies the SMTP credentials actually work (auth only, sends no mail).
app.post('/api/backups/status/test-email', async (req, res) => {
  const result = await testEmailConnection();
  res.json(result);
});

// Restores a snapshot previously downloaded from /api/backups/export.
// Destructive: clears every table before re-inserting the backup's rows.
app.post('/api/backups/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No backup file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    fs.unlink(filePath, () => {});

    let state;
    try {
      state = JSON.parse(raw);
    } catch (parseErr) {
      return res.status(400).json({ error: 'That file is not valid JSON.' });
    }

    if (!state || typeof state !== 'object' || !Array.isArray(state.members)) {
      return res.status(400).json({ error: 'This does not look like a valid backup export file (missing a members array).' });
    }

    const stats = await importFullState(state);
    const status = stats.errors.length > 0 ? 'PARTIAL' : 'SUCCESS';
    await addBackupLog(`restore_from_${req.file.originalname}`, raw.length, status).catch(() => {});

    res.json({ message: 'Backup restore complete.', stats });
  } catch (err) {
    console.error('Backup restore failed:', err);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    res.status(500).json({ error: err.message });
  }
});

// Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    const settingsObj = await getSettings();
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    for (const [key, value] of Object.entries(updates)) {
      await saveSettings(key, String(value));
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI-Assisted Parsing Status Routes
app.get('/api/ai-status', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      configured: isAIAvailable(),
      model: getAIModel(),
      enabled: settings.ai_parsing_enabled === 'true'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Runs a real (tiny) call to Claude so the admin can confirm the configured
// API key/model actually work, not just that a key string is present.
app.post('/api/ai-status/test', async (req, res) => {
  const result = await testAIConnection();
  res.json(result);
});

// Board of Directors Routes
app.get('/api/board', async (req, res) => {
  try {
    const rows = await getBoardMembers();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/board', boardPhotoUpload.single('photo'), async (req, res) => {
  const { name, role, initials, display_order } = req.body;
  if (!name || !role || !initials) {
    return res.status(400).json({ error: 'Name, Role and Initials are required.' });
  }
  try {
    const photoUrl = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;
    await saveBoardMember(name, role, initials, display_order || 0, photoUrl);
    res.json({ message: 'Board member added successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/board/:id', boardPhotoUpload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, role, initials, display_order } = req.body;
  try {
    let photoUrl;
    if (req.file) {
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else {
      const existing = await getBoardMemberById(id);
      photoUrl = existing ? existing.photo_url : null;
    }
    await saveBoardMember(name, role, initials, display_order || 0, photoUrl, id);
    res.json({ message: 'Board member updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/board/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await deleteBoardMember(id);
    res.json({ message: 'Board member deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Downloadable blank template (CSV or XLSX) with the exact column headers
// the parsers/importRecords() expect, so admins don't have to guess the format.
const TEMPLATE_HEADERS = ['staff_no', 'name', 'year', 'month', 'savings_deposit', 'loan_recovery', 'interest_recovery'];
const TEMPLATE_EXAMPLE_ROW = ['1001', 'Mahendrakumar Solanki', '2026', '07', '2500', '8000', '2000'];

app.get('/api/upload-data/template', (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();

  if (format === 'xlsx') {
    const worksheet = xlsx.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE_ROW]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=society_upload_template.xlsx');
    return res.send(buffer);
  }

  const csvText = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE_ROW].map((row) => row.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=society_upload_template.csv');
  res.send(csvText);
});

// Imports the specific "members details" + "ledger" workbook format ATD
// Credit & Supply Society maintains manually (see societyParser.js).
// ?dryRun=true parses and returns a preview without writing to the
// database — used to review a new file (and flagged issues) before
// committing real member/receipt data.
app.post('/api/upload-data/society-workbook', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const dryRun = req.query.dryRun === 'true';

  try {
    const buffer = fs.readFileSync(filePath);
    fs.unlink(filePath, () => {});

    const parsed = parseSocietyWorkbook(buffer);

    if (dryRun) {
      return res.json({
        dryRun: true,
        memberCount: parsed.members.length,
        receiptCount: parsed.receipts.length,
        orphanMembers: parsed.orphanMembers,
        issues: parsed.issues,
        sampleMembers: parsed.members.slice(0, 5),
        sampleReceipts: parsed.receipts.slice(0, 5)
      });
    }

    const stats = await importSocietyWorkbook(parsed);
    res.json({ message: 'Society workbook imported.', issues: parsed.issues, stats });
  } catch (error) {
    console.error('Society workbook import failed:', error);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    res.status(500).json({ error: error.message });
  }
});

// 8. Upload Account Data (Admin Portal)
app.post('/api/upload-data', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

  try {
    let records = [];
    let aiUsed = false;
    let aiError = null;

    const settings = await getSettings();
    const aiEnabled = settings.ai_parsing_enabled === 'true' && isAIAvailable();

    if (fileExtension === 'csv') {
      // CSVs already have well-defined headers — the deterministic parser
      // handles them reliably, so AI extraction isn't used here.
      records = await parseCSV(filePath);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      if (aiEnabled) {
        try {
          records = await aiExtractRecords(excelToCsvText(filePath), 'an Excel spreadsheet');
          aiUsed = true;
        } catch (err) {
          aiError = err.message;
          console.error('AI Excel extraction failed, falling back to standard parser:', err.message);
          records = await parseExcel(filePath);
        }
      } else {
        records = await parseExcel(filePath);
      }
    } else if (fileExtension === 'pdf') {
      if (aiEnabled) {
        try {
          records = await aiExtractRecords(await extractPdfText(filePath), 'a PDF recovery statement');
          aiUsed = true;
        } catch (err) {
          aiError = err.message;
          console.error('AI PDF extraction failed, falling back to standard parser:', err.message);
          records = await parsePDF(filePath);
        }
      } else {
        records = await parsePDF(filePath);
      }
    } else {
      throw new Error('Unsupported file format. Please upload CSV, Excel, or PDF.');
    }

    if (records.length === 0) {
      throw new Error('No records could be parsed from the file.');
    }

    // Insert records into DB
    const importStats = await importRecords(records);

    // Clean up uploaded file
    fs.unlink(filePath, () => {});

    res.json({
      message: 'File processed successfully.',
      recordsParsed: records.length,
      stats: importStats,
      aiUsed,
      aiError
    });

  } catch (error) {
    console.error('Data upload handling failed:', error);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
    res.status(500).json({ error: error.message });
  }
});

// 9. Simulated WhatsApp Webhook
app.post('/api/whatsapp/webhook', async (req, res) => {
  const { message, sender } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message payload is required.' });
  }

  const query = message.trim().toLowerCase();

  if (query === 'help' || query === 'hi' || query === 'hello') {
    const welcomeText = `👋 Namaste! Welcome to **ATD Credit & Supply Society Bot**.\n\nYou can query your account information by sending these commands:\n\n*   **receipt <Staff_No> <Month_No> <Year>** - Ex: \`receipt 1001 07 2026\` to download July 2026 Recovery Receipt.\n*   **loans <Staff_No>** - Ex: \`loans 1001\` to view your active loans and remaining balances.\n*   **summary <Staff_No>** - Ex: \`summary 1001\` to get a quick overview of your profile.`;
    return res.json({ response: welcomeText });
  }

  const receiptMatch = query.match(/^receipt\s+(\w+)\s+(\d{1,2})\s+(\d{4})/);
  const loansMatch = query.match(/^loans\s+(\w+)/);
  const summaryMatch = query.match(/^summary\s+(\w+)/);

  try {
    if (receiptMatch) {
      const staffNo = receiptMatch[1];
      const monthRaw = receiptMatch[2];
      const month = monthRaw.length === 1 ? '0' + monthRaw : monthRaw;
      const year = receiptMatch[3];

      const row = await searchReceipt(staffNo, year, month);
      if (!row) {
        return res.json({ response: `❌ No receipt found for Staff No: *${staffNo}*, Year: *${year}*, Month: *${month}*.` });
      }

      const receiptText = `📄 *Recovery Receipt - ${month}/${year}*\n----------------------------------------\n👤 *Member:* ${row.name}\n🆔 *Staff No:* ${row.staff_no}\n\n💰 *Savings Deposit:* ₹${row.savings_deposit}\n🏦 *Loan Recovery:* ₹${row.loan_recovery}\n📈 *Interest Recovery:* ₹${row.interest_recovery}\n\n💵 *Total Recovered:* ₹${row.total_recovered}\n----------------------------------------\nThank you!`;
      return res.json({ response: receiptText });
    }

    if (loansMatch) {
      const staffNo = loansMatch[1];
      const summary = await getMemberSummary(staffNo);
      if (!summary) return res.json({ response: `❌ Member with Staff No: *${staffNo}* not found.` });

      if (summary.loans.length === 0) {
        return res.json({ response: `ℹ️ Member *${summary.member.name}* (${staffNo}) has no active loans.` });
      }

      let responseText = `🏦 *Active Loans for ${summary.member.name} (${staffNo})*\n`;
      summary.loans.forEach((loan) => {
        responseText += `\n*${loan.loan_type} Loan*:\n  • Amount: ₹${loan.loan_amount}\n  • Rate: ${loan.interest_rate}%\n  • Paid: ${loan.installments_paid}/${loan.installments_total} months\n  • Balance: *₹${loan.remaining_balance}*\n`;
      });
      return res.json({ response: responseText });
    }

    if (summaryMatch) {
      const staffNo = summaryMatch[1];
      const summary = await getMemberSummary(staffNo);
      if (!summary) return res.json({ response: `❌ Member with Staff No: *${staffNo}* not found.` });

      let savingsTotal = 0;
      summary.receipts.forEach(r => { savingsTotal += r.savings_deposit; });

      const activeLoans = summary.loans ? summary.loans.map(l => `${l.loan_type} (Bal: ₹${l.remaining_balance})`).join(', ') : 'None';
      const summaryText = `👤 *Profile Summary: ${summary.member.name}*\n----------------------------------------\n🆔 *Staff No:* ${summary.member.staff_no}\n📧 *Email:* ${summary.member.email || 'N/A'}\n📞 *Phone:* ${summary.member.phone || 'N/A'}\n📈 *Status:* ${summary.member.status}\n\n💰 *Total Savings Contributed:* ₹${savingsTotal}\n🏦 *Active Loans:* ${activeLoans || 'None'}\n----------------------------------------`;
      return res.json({ response: summaryText });
    }
  } catch (err) {
    console.error("WhatsApp webhook simulator db error:", err);
    return res.json({ response: '⚠️ An error occurred while retrieving details. Please try again later.' });
  }

  const fallbackText = `🤖 *ATD Bot*: Sorry, I didn't catch that.\n\nSend *help* to see a list of valid commands!`;
  res.json({ response: fallbackText });
});

// --- HELPER PARSING FUNCTIONS ---

// CSV Parser
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const row = {};
        Object.keys(data).forEach((key) => {
          const cleanKey = key.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
          row[cleanKey] = data[key];
        });
        results.push(row);
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

// Reads a workbook from disk. `xlsx.readFile` isn't a named ESM export in
// this package (only `read`/`write`/`utils` are) — importing it via
// `import * as xlsx from 'xlsx'` and calling `.readFile` throws, so we read
// the buffer ourselves and use `xlsx.read` instead.
function readWorkbook(filePath) {
  const buffer = fs.readFileSync(filePath);
  return xlsx.read(buffer, { type: 'buffer' });
}

// Excel Parser
function parseExcel(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = readWorkbook(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      const results = data.map((item) => {
        const row = {};
        Object.keys(item).forEach((key) => {
          const cleanKey = key.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
          row[cleanKey] = item[key];
        });
        return row;
      });
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

// Renders the first sheet as CSV text for the AI parser, which can handle
// inconsistent/unexpected column headers better than the fixed key-matching
// above.
function excelToCsvText(filePath) {
  const workbook = readWorkbook(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_csv(sheet);
}

// Extracts raw text from a PDF (shared by the regex parser below and the AI parser)
async function extractPdfText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

// PDF Parser (fixed-format fallback used when AI parsing is off/unavailable)
function parsePDF(filePath) {
  return new Promise(async (resolve, reject) => {
    try {
      const text = await extractPdfText(filePath);
      const lines = text.split('\n');
      const records = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        const regex = /^(\d+)\s+([a-zA-Z\s]+)\s+(\d{4})\s+(\d{2})\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/;
        const match = trimmed.match(regex);

        if (match) {
          records.push({
            staffno: match[1],
            name: match[2].trim(),
            year: match[3],
            month: match[4],
            savingsdeposit: parseFloat(match[5]),
            loanrecovery: parseFloat(match[6]),
            interestrecovery: parseFloat(match[7])
          });
        }
      });

      resolve(records);
    } catch (error) {
      reject(error);
    }
  });
}

// Serve production build of frontend
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Backend Server is running. Frontend has not been built yet.');
  });
}

// Error handler (e.g. board photo upload rejected by boardPhotoUpload's fileFilter/limits)
app.use((err, req, res, next) => {
  console.log('Unhandled request error (logged):', err.message);
  res.status(400).json({ error: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
