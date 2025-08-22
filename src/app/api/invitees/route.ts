import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, generateInviteeSN } from '@/lib/auth';
import { db_operations, initDatabase } from '@/lib/database';
import { parseCSVData, validateCSVData } from '@/lib/utils';

// GET /api/invitees - Get all invitees
export const GET = requireAuth(async () => {
  try {
    await initDatabase();
    const invitees = await db_operations.getAllInvitees();
    
    return NextResponse.json({
      success: true,
      data: invitees
    });
  } catch (error) {
    console.error('Error fetching invitees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitees' },
      { status: 500 }
    );
  }
});

// POST /api/invitees - Create new invitee
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    await initDatabase();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Generate unique SN
    const sn = await generateInviteeSN();
    
    // Create invitee data
    const inviteeData = {
      sn: sn,
      name: body.name.trim(),
      title: body.title?.trim() || '',
      company: body.company?.trim() || '',
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      notes: body.notes?.trim() || '',
      email_invite_flag: Boolean(body.email_invite_flag)
    };
    
    // Save to database
    await db_operations.createInvitee(inviteeData);
    
    // Send email immediately if flagged
    if (inviteeData.email_invite_flag) {
      try {
        const newInvitee = await db_operations.getInviteeBySN(inviteeData.sn);
        if (newInvitee) {
          const { sendInvitationEmail } = await import('@/lib/email');
          await sendInvitationEmail(newInvitee);
          await db_operations.updateInvitee(inviteeData.sn, { 
            invitation_sent: true, 
            invitation_sent_at: new Date().toISOString() 
          });
        }
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the entire request for email errors
      }
    }
    
    return NextResponse.json({
      success: true,
      data: { ...inviteeData, id: Date.now() }, // Temporary ID for response
      message: inviteeData.email_invite_flag ? 'Invitee created and invitation sent successfully' : 'Invitee created successfully'
    });
  } catch (error) {
    console.error('Error creating invitee:', error);
    
    if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create invitee' },
      { status: 500 }
    );
  }
});

// PUT /api/invitees - Bulk upload invitees from CSV
export const PUT = requireAuth(async (request: NextRequest) => {
  try {
    await initDatabase();
    const body = await request.json();
    
    if (!body.csvData) {
      return NextResponse.json(
        { error: 'CSV data is required' },
        { status: 400 }
      );
    }
    
    // Parse CSV data
    const parsedData = parseCSVData(body.csvData);
    
    // Validate data
    const validation = validateCSVData(parsedData);
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid CSV data',
          details: validation.errors
        },
        { status: 400 }
      );
    }
    
    // Create invitees
    const results = [];
    const errors = [];
    
    for (const row of validation.validRows) {
      try {
        const sn = generateInviteeSN();
        
        const inviteeData = {
          sn,
          name: row.name,
          title: row.title || '',
          company: row.company || '',
          email: row.email.toLowerCase(),
          phone: row.phone || '',
          notes: row.notes || '',
          email_invite_flag: Boolean(row.email_invite_flag)
        };
        
        await db_operations.createInvitee(inviteeData);
        results.push(inviteeData);
      } catch (error) {
        if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
          errors.push(`Email ${row.email} already exists`);
        } else {
          errors.push(`Failed to create invitee for ${row.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        created: results.length,
        errors: errors.length,
        errorDetails: errors
      },
      message: `Successfully created ${results.length} invitees${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
});
