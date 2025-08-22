import { NextRequest, NextResponse } from 'next/server';
import { db_operations } from '@/lib/database';
import { sendInvitationEmail } from '@/lib/email';
import { generateInviteeSN } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have header and at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'email'];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        return NextResponse.json({ 
          error: `Missing required column: ${required}` 
        }, { status: 400 });
      }
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length !== headers.length) {
        results.errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate required fields
      if (!row.name || !row.email) {
        results.errors.push(`Row ${i + 1}: Missing name or email`);
        continue;
      }

      // Check if email already exists
      const allInvitees = await db_operations.getAllInvitees();
      const existing = allInvitees.find(inv => inv.email === row.email);
      if (existing) {
        results.skipped++;
        continue;
      }

      try {
        // Convert email_invite_flag to boolean
        const emailInviteFlag = row.email_invite_flag === 'true' || row.email_invite_flag === '1';
        
        // Generate unique SN
        const sn = await generateInviteeSN();
        
        const inviteeData = {
          sn,
          name: row.name,
          email: row.email,
          title: row.title || '',
          company: row.company || '',
          phone: row.phone || '',
          notes: row.notes || '',
          email_invite_flag: emailInviteFlag
        };

        await db_operations.createInvitee(inviteeData);
        
        // Send email if flagged
        if (emailInviteFlag) {
          try {
            const newInvitee = await db_operations.getInviteeBySN(sn);
            if (newInvitee) {
              await sendInvitationEmail(newInvitee);
              await db_operations.updateInvitee(sn, { invitation_sent: true, invitation_sent_at: new Date().toISOString() });
            }
          } catch (emailError) {
            console.error(`Failed to send email to ${row.email}:`, emailError);
            // Don't fail the whole import for email errors
          }
        }
        
        results.added++;
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({ 
      message: 'Import completed',
      results 
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
