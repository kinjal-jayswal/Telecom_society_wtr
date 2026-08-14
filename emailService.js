import { Resend } from 'resend';

// Uses Resend's HTTP API rather than raw SMTP. Railway (like most PaaS
// providers) blocks/throttles outbound SMTP to prevent abuse, and Gmail
// separately tends to reject or throttle connections from shared cloud IP
// ranges — a plain HTTPS API call sidesteps both problems.
export function isEmailConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.BACKUP_EMAIL_TO);
}

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function getSender() {
  // onboarding@resend.dev works without verifying a custom domain — fine
  // for this volume (one email per fortnight). Override with
  // BACKUP_EMAIL_FROM once a verified sending domain is set up.
  return process.env.BACKUP_EMAIL_FROM || 'ATD Society Backups <onboarding@resend.dev>';
}

export async function sendBackupEmail(jsonText, filename) {
  const client = getClient();
  if (!client) throw new Error('Email is not configured (RESEND_API_KEY missing).');
  const to = process.env.BACKUP_EMAIL_TO;
  if (!to) throw new Error('BACKUP_EMAIL_TO is not set — no recipient configured.');

  const { error } = await client.emails.send({
    from: getSender(),
    to,
    subject: `ATD Society Database Backup — ${new Date().toLocaleDateString()}`,
    text: `Automated database backup attached (${filename}).\n\nIf the database is ever lost, this file can be restored from Admin Panel -> Backups tab -> "Restore from Backup File".`,
    attachments: [
      { filename, content: Buffer.from(jsonText).toString('base64') }
    ]
  });

  if (error) throw new Error(error.message || JSON.stringify(error));
}

// Sends a real (harmless) test email so the admin can confirm the API key,
// sender, and recipient actually work end-to-end.
export async function testEmailConnection() {
  const client = getClient();
  if (!client) {
    return { ok: false, error: 'Email is not configured (RESEND_API_KEY missing).' };
  }
  const to = process.env.BACKUP_EMAIL_TO;
  if (!to) {
    return { ok: false, error: 'BACKUP_EMAIL_TO is not set — no recipient configured.' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: getSender(),
      to,
      subject: 'ATD Society Backup — Test Connection',
      text: 'This confirms the backup email connection works. No backup data is attached to this message.'
    });
    if (error) return { ok: false, error: error.message || JSON.stringify(error) };
    return { ok: true, to, id: data?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
