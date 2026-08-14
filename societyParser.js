import * as xlsx from 'xlsx';

// `SSF` (the date-serial formatter) isn't a named ESM export either — same
// gotcha as `readFile`/`writeFile` (see CLAUDE.md) — it only lives on the
// CJS `default`.
const SSF = xlsx.SSF || xlsx.default.SSF;

// Parses the specific workbook format ATD Credit & Supply Society maintains
// manually (sheets: "members details" + "ledger"; "Bank pass-book" and
// "Loan details" are out of scope — see CLAUDE.md). This is a
// purpose-built parser for that known structure, not a generic
// spreadsheet importer.

function excelDateToISO(serial) {
  if (typeof serial !== 'number') return null;
  const d = SSF.parse_date_code(serial);
  if (!d) return null;
  return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
}

function excelDateToYearMonth(serial) {
  if (typeof serial !== 'number') return null;
  const d = SSF.parse_date_code(serial);
  if (!d) return null;
  return { year: String(d.y), month: String(d.m).padStart(2, '0') };
}

function extractDateFromHeaderText(text) {
  const m = String(text).match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

export function parseSocietyWorkbook(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const issues = [];

  const membersSheet = wb.Sheets['members details'];
  const ledgerSheet = wb.Sheets['ledger'];
  if (!membersSheet) throw new Error('This workbook has no "members details" sheet.');
  if (!ledgerSheet) throw new Error('This workbook has no "ledger" sheet.');

  // ---------- members details ----------
  const mdRows = xlsx.utils.sheet_to_json(membersSheet, { header: 1, defval: '' });
  const headerRowIndex = mdRows.findIndex((r) => String(r[2]).trim().toLowerCase() === 'lf no');
  if (headerRowIndex === -1) {
    throw new Error('Could not find the header row (looking for "LF No") in "members details".');
  }
  const headerRow = mdRows[headerRowIndex];
  const interimBalanceDate = extractDateFromHeaderText(headerRow[9]);
  const currentBalanceDate = extractDateFromHeaderText(headerRow[11]);

  const members = [];
  const seenLfNos = new Map();
  for (let i = headerRowIndex + 1; i < mdRows.length; i++) {
    const r = mdRows[i];
    const lfNoRaw = r[2];
    const nameRaw = r[1];
    if (!lfNoRaw || !nameRaw) continue;
    const staffNo = String(lfNoRaw).trim();
    const name = String(nameRaw).trim();

    if (seenLfNos.has(staffNo)) {
      issues.push(`Duplicate LF No ${staffNo}: kept "${seenLfNos.get(staffNo)}", skipped "${name}" — resolve manually and re-upload if the skipped row should be kept instead.`);
      continue;
    }
    seenLfNos.set(staffNo, name);

    const loanAmountRaw = r[14];
    const loanAmount = typeof loanAmountRaw === 'number' ? loanAmountRaw : null;

    members.push({
      staffNo,
      name,
      phone: r[3] ? String(r[3]).trim() : null,
      savingsBalance: typeof r[5] === 'number' ? r[5] : null,
      savingsBalanceDate: excelDateToISO(r[4]),
      shareAmount: typeof r[7] === 'number' ? r[7] : null,
      shareCertificateNo: r[8] ? String(r[8]).trim() : null,
      interimBalance: typeof r[9] === 'number' ? r[9] : null,
      interimBalanceDate,
      bonusAmount: typeof r[10] === 'number' ? r[10] : null,
      currentBalance: typeof r[11] === 'number' ? r[11] : null,
      currentBalanceDate,
      loanTakenOn: excelDateToISO(r[13]),
      loanAmount,
      hasLoan: loanAmount !== null && loanAmount > 0,
      guarantor1Name: r[16] ? String(r[16]).trim() : null,
      guarantor2Name: r[17] ? String(r[17]).trim() : null
    });
  }

  const staffNoSet = new Set(members.map((m) => m.staffNo));

  // ---------- ledger ----------
  const ledgerRows = xlsx.utils.sheet_to_json(ledgerSheet, { header: 1, defval: '' });
  const rawEntries = [];
  let currentLf = null;
  let currentName = null;
  const orphanLfNos = new Map();

  for (let i = 0; i < ledgerRows.length; i++) {
    const r = ledgerRows[i];
    const col1 = String(r[1] || '');
    const blockMatch = col1.match(/LF[\s-]*(\d+)/i);

    // A block-start row: numeric sl in col 0 and "<name> LF-<no> PAGE-<no>" in col 1
    if (typeof r[0] === 'number' && blockMatch) {
      currentLf = blockMatch[1];
      currentName = col1.split(/LF[\s-]*\d+/i)[0].trim();
      if (!staffNoSet.has(currentLf)) {
        orphanLfNos.set(currentLf, currentName);
      }
      continue;
    }

    // Repeated column header row, or the block's opening-balance row
    if (col1 === 'DATE' || col1.includes('BALANCE AS ON')) continue;

    const emiMonthSerial = r[3];
    if (typeof emiMonthSerial !== 'number' || !currentLf) continue; // blank spacer / "LOAN CLOSED" marker / unattributed row
    const ym = excelDateToYearMonth(emiMonthSerial);
    if (!ym) continue;

    rawEntries.push({
      staffNo: currentLf,
      name: currentName,
      year: ym.year,
      month: ym.month,
      receiptNo: r[2] ? String(r[2]).trim() : null,
      balanceBefore: typeof r[4] === 'number' ? r[4] : null,
      installment: typeof r[5] === 'number' ? r[5] : 0,
      interest: typeof r[6] === 'number' ? r[6] : 0,
      emi: typeof r[7] === 'number' ? r[7] : 0,
      balanceAfter: typeof r[8] === 'number' ? r[8] : null
    });
  }

  // The receipts table is UNIQUE per (member, year, month), but the source
  // ledger sometimes has multiple rows landing in the same member-month —
  // legitimate multi-payment loan closures, and occasionally what looks
  // like a date-entry mistake reusing an earlier date. Both are summed into
  // one receipt (installment/interest/emi added, last balanceAfter kept) so
  // the total money and running balance stay correct either way, and
  // flagged in `issues` so the office can double-check the ambiguous ones.
  const grouped = new Map();
  const combinedMonths = [];
  for (const entry of rawEntries) {
    const key = `${entry.staffNo}|${entry.year}|${entry.month}`;
    if (!grouped.has(key)) {
      grouped.set(key, { ...entry, rowsCombined: 1 });
    } else {
      const g = grouped.get(key);
      g.installment += entry.installment;
      g.interest += entry.interest;
      g.emi += entry.emi;
      g.balanceAfter = entry.balanceAfter;
      g.rowsCombined++;
      if (g.rowsCombined === 2) combinedMonths.push(key);
    }
  }
  if (combinedMonths.length > 0) {
    issues.push(`${combinedMonths.length} member-month(s) had multiple ledger rows combined into one receipt (summed installment/interest) — review for accuracy: ${combinedMonths.join(', ')}`);
  }

  const receipts = Array.from(grouped.values()).map((r) => ({
    staffNo: r.staffNo,
    name: r.name,
    year: r.year,
    month: r.month,
    receiptNo: r.receiptNo,
    savingsDeposit: 0, // not tracked monthly in this ledger — see members[].savingsBalance for the running balance
    loanRecovery: r.installment,
    interestRecovery: r.interest,
    totalRecovered: r.emi,
    loanBalanceBefore: r.balanceBefore,
    loanBalanceAfter: r.balanceAfter
  }));

  const orphanMembers = [...orphanLfNos.entries()].map(([staffNo, name]) => ({ staffNo, name }));
  if (orphanMembers.length > 0) {
    issues.push(`${orphanMembers.length} LF No(s) appear in the ledger but not in "members details" (likely former/exited members): ${orphanMembers.map((o) => `${o.staffNo} (${o.name})`).join(', ')}`);
  }

  return { members, receipts, orphanMembers, issues };
}
