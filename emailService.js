import nodemailer from 'nodemailer';

// Generic SMTP config so this works with a Gmail App Password, or any other
// SMTP provider, without hardcoding to one vendor's API.
export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function getRecipient() {
  return process.env.BACKUP_EMAIL_TO || process.env.SMTP_USER;
}

export async function sendBackupEmail(jsonText, filename) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('Email is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing).');
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: getRecipient(),
    subject: `ATD Society Database Backup — ${new Date().toLocaleDateString()}`,
    text: `Automated database backup attached (${filename}).\n\nIf the database is ever lost, this file can be restored from Admin Panel -> Backups tab -> "Restore from Backup File".`,
    attachments: [
      { filename, content: jsonText, contentType: 'application/json' }
    ]
  });
}

// Sends no mail — just authenticates against the SMTP server so the admin
// can confirm the credentials actually work before relying on them.
export async function testEmailConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: 'Email is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing).' };
  }
  try {
    await transporter.verify();
    return { ok: true, to: getRecipient() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
