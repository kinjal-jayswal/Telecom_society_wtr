import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { addBackupLog, getBackups, isPostgres } from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'society.db');
const backupsDir = join(__dirname, 'backups');

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

// Function to perform backup
export function performBackup() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTime = new Date().toISOString();

    if (isPostgres) {
      // In Postgres mode, backups are natively managed by Railway/PG. We log the event.
      const virtualFilename = `postgres_cloud_snapshot_${timestamp}.json`;
      addBackupLog(virtualFilename, 0, 'SUCCESS')
        .then(() => {
          console.log(`Log entry generated for cloud Postgres managed backup: ${virtualFilename}`);
          resolve({ filename: virtualFilename, size: 0, time: backupTime, note: 'PostgreSQL cloud managed' });
        })
        .catch(reject);
      return;
    }

    if (!fs.existsSync(dbPath)) {
      return reject(new Error('Database file does not exist, cannot perform backup.'));
    }

    const backupFilename = `society_backup_${timestamp}.db`;
    const backupFilePath = join(backupsDir, backupFilename);

    // Copy DB file
    fs.copyFile(dbPath, backupFilePath, (err) => {
      if (err) {
        console.error('Backup copy failed:', err);
        addBackupLog(backupFilename, 0, 'FAILED').catch(console.error);
        return reject(err);
      }

      // Get file size
      const stats = fs.statSync(backupFilePath);
      const fileSize = stats.size;

      addBackupLog(backupFilename, fileSize, 'SUCCESS')
        .then(() => {
          console.log(`Fortnightly Backup created successfully: ${backupFilename} (${fileSize} bytes)`);
          resolve({ filename: backupFilename, size: fileSize, time: backupTime });
        })
        .catch((dbErr) => {
          console.error('Failed to log backup to DB:', dbErr);
          resolve({ filename: backupFilename, size: fileSize, time: backupTime });
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

  // Run a startup backup check / automatic backup if no backups exist (SQLite only)
  if (!isPostgres) {
    getBackups().then((backups) => {
      if (backups && backups.length === 0) {
        console.log('No existing backups found. Creating initial system backup...');
        performBackup().catch(err => console.error('Initial backup failed:', err));
      }
    }).catch(err => {
      console.error('Failed to query backup logs:', err);
    });
  }
}
