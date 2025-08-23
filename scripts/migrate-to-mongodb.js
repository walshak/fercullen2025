// Migration script to move data from JSON file to MongoDB
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { db_operations } from '../src/lib/database';

interface JsonData {
  invitees: any[];
  admins: any[];
  invitation_logs: any[];
}

async function migrateData() {
  try {
    const jsonFilePath = path.join(process.cwd(), 'data', 'fercullen-db.json');
    
    if (!existsSync(jsonFilePath)) {
      console.log('No JSON database file found, skipping migration');
      return;
    }

    console.log('Reading data from JSON file...');
    const jsonData: JsonData = JSON.parse(readFileSync(jsonFilePath, 'utf8'));
    
    // Migrate invitees
    if (jsonData.invitees && jsonData.invitees.length > 0) {
      console.log(`Migrating ${jsonData.invitees.length} invitees...`);
      
      for (const invitee of jsonData.invitees) {
        try {
          // Check if invitee already exists
          const existing = await db_operations.getInviteeBySn(invitee.sn);
          if (!existing) {
            const { id, created_at, updated_at, ...inviteeData } = invitee;
            await db_operations.createInvitee(inviteeData);
            console.log(`✓ Migrated invitee: ${invitee.sn} - ${invitee.name}`);
          } else {
            console.log(`- Skipped existing invitee: ${invitee.sn}`);
          }
        } catch (error) {
          console.error(`✗ Failed to migrate invitee ${invitee.sn}:`, error);
        }
      }
    }

    // Migrate invitation logs
    if (jsonData.invitation_logs && jsonData.invitation_logs.length > 0) {
      console.log(`Migrating ${jsonData.invitation_logs.length} invitation logs...`);
      
      for (const log of jsonData.invitation_logs) {
        try {
          const { id, ...logData } = log;
          await db_operations.logInvitation(logData);
          console.log(`✓ Migrated log for: ${log.invitee_sn}`);
        } catch (error) {
          console.error(`✗ Failed to migrate log for ${log.invitee_sn}:`, error);
        }
      }
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
