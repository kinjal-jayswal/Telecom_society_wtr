import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { addBackupLog, getBackups, getFullState, isPostgres } from './database.js';
import { sendBackupEmail, isEmailConfigured } from './emailService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'society.db');
const backupsDir = join(__dirname, 'backups');

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

export function isBucketConfigured() {
  return !!(
    process.env.BACKUP_BUCKET_ENDPOINT &&
    process.env.BACKUP_BUCKET_ACCESS_KEY &&
    process.env.BACKUP_BUCKET_SECRET_KEY &&
    process.env.BACKUP_BUCKET_NAME
  );
}

function getS3Client() {
  if (!isBucketConfigured()) return null;
  return new S3Client({
    region: process.env.BACKUP_BUCKET_REGION || 'auto',
    endpoint: process.env.BACKUP_BUCKET_ENDPOINT,
    credentials: {
      accessKeyId: process.env.BACKUP_BUCKET_ACCESS_KEY,
      secretAccessKey: process.env.BACKUP_BUCKET_SECRET_KEY
    }
  });
}

async function uploadStateToBucket(jsonText, filename) {
  const client = getS3Client();
  if (!client) throw new Error('Backup bucket is not configured.');
  await client.send(new PutObjectCommand({
    Bucket: process.env.BACKUP_BUCKET_NAME,
    Key: filename,
    Body: jsonText,
    ContentType: 'application/json'
  }));
}

// Used by GET /api/backups/download/:filename to fall back to the bucket
// when the requested backup isn't a local SQLite file copy.
export async function downloadFromBucket(filename) {
  const client = getS3Client();
  if (!client) return null;
  try {
    const result = await client.send(new GetObjectCommand({
      Bucket: process.env.BACKUP_BUCKET_NAME,
      Key: filename
    }));
    const chunks = [];
    for await (const chunk of result.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
  } catch (err) {
    if (err.name === 'NoSuchKey') return null;
    throw err;
  }
}

// Performs a backup. Always builds a full JSON snapshot of the database
// (via getFullState) and, when configured, uploads it to the Railway bucket
// and/or emails it — this is the actual offsite protection against the
// Railway Postgres database itself being lost, since neither the bucket
// upload nor the email depend on the app's own database being reachable
// afterward. In SQLite mode, the historical local-file-copy behavior is
// also kept for backward compatibility with existing local dev workflows.
export function performBackup() {
  return new Promise(async (resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTime = new Date().toISOString();
    const jsonFilename = `society_backup_${timestamp}.json`;

    let jsonText = null;
    try {
      const state = await getFullState();
      jsonText = JSON.stringify(state, null, 2);
    } catch (err) {
      console.error('Failed to snapshot database state for backup:', err.message);
    }

    const offsite = { uploadedToBucket: false, bucketError: null, emailed: false, emailError: null };

    if (jsonText) {
      if (isBucketConfigured()) {
        try {
          await uploadStateToBucket(jsonText, jsonFilename);
          offsite.uploadedToBucket = true;
        } catch (err) {
          offsite.bucketError = err.message;
          console.error('Bucket backup upload failed:', err.message);
        }
      }

      if (isEmailConfigured()) {
        try {
          await sendBackupEmail(jsonText, jsonFilename);
          offsite.emailed = true;
        } catch (err) {
          offsite.emailError = err.message;
          console.error('Backup email failed:', err.message);
        }
      }
    }

    if (isPostgres) {
      // No persistent volume is mounted on the app service, so there's
      // nothing to copy to local disk here — the JSON snapshot above
      // (bucket/email) is the actual backup for Postgres mode.
      const status = offsite.uploadedToBucket || offsite.emailed ? 'SUCCESS' : (jsonText ? 'PARTIAL' : 'FAILED');
      addBackupLog(jsonFilename, jsonText ? jsonText.length : 0, status)
        .then(() => {
          console.log(`Postgres backup snapshot: ${jsonFilename} (bucket: ${offsite.uploadedToBucket}, email: ${offsite.emailed})`);
          resolve({ filename: jsonFilename, size: jsonText ? jsonText.length : 0, time: backupTime, ...offsite });
        })
        .catch(reject);
      return;
    }

    if (!fs.existsSync(dbPath)) {
      return reject(new Error('Database file does not exist, cannot perform backup.'));
    }

    const backupFilename = `society_backup_${timestamp}.db`;
    const backupFilePath = join(backupsDir, backupFilename);

    fs.copyFile(dbPath, backupFilePath, (err) => {
      if (err) {
        console.error('Backup copy failed:', err);
        addBackupLog(backupFilename, 0, 'FAILED').catch(console.error);
        return reject(err);
      }

      const stats = fs.statSync(backupFilePath);
      const fileSize = stats.size;

      addBackupLog(backupFilename, fileSize, 'SUCCESS')
        .then(() => {
          console.log(`Fortnightly Backup created successfully: ${backupFilename} (${fileSize} bytes)`);
          resolve({ filename: backupFilename, size: fileSize, time: backupTime, ...offsite });
        })
        .catch((dbErr) => {
          console.error('Failed to log backup to DB:', dbErr);
          resolve({ filename: backupFilename, size: fileSize, time: backupTime, ...offsite });
        });
    });
  });
}

// Start fortnightly scheduler (14 days)
export function startBackupScheduler() {
  // Fortnight in milliseconds = 14 days * 24 hours * 60 mins * 60 secs * 1000 ms
  const FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000;

  console.log('Fortnightly backup scheduler initialized.');

  // Set interval to run backup
  setInterval(() => {
    console.log('Scheduler triggering automatic fortnightly backup...');
    performBackup().catch((err) => {
      console.error('Automatic backup failed:', err);
    });
  }, FORTNIGHT_MS);

  // Run a startup backup check / automatic backup if no backups exist
  getBackups().then((backups) => {
    if (backups && backups.length === 0) {
      console.log('No existing backups found. Creating initial system backup...');
      performBackup().catch(err => console.error('Initial backup failed:', err));
    }
  }).catch(err => {
    console.error('Failed to query backup logs:', err);
  });
}
