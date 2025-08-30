import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, generateInviteeSN } from '@/lib/auth';
import { db_operations } from '@/lib/database';
import { parseCSVData, validateCSVData, getBaseUrl } from '@/lib/utils';

// GET /api/invitees - Get invitees with pagination, search, sort, filter
export const GET = requireAuth(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const filter = url.searchParams.get('filter') || 'all'; // all, sent, not_sent, accepted, declined, checked_in
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build search criteria
    const searchCriteria: Record<string, unknown> = {};
    
    if (search) {
      searchCriteria.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { sn: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply filters
    switch (filter) {
      case 'sent':
        searchCriteria.invitation_sent = true;
        break;
      case 'not_sent':
        searchCriteria.invitation_sent = false;
        break;
      case 'accepted':
        searchCriteria.rsvp_status = 'accepted';
        break;
      case 'declined':
        searchCriteria.rsvp_status = 'declined';
        break;
      case 'checked_in':
        searchCriteria.checked_in = true;
        break;
      case 'pending_rsvp':
        searchCriteria.$or = [
          { rsvp_status: 'pending' },
          { rsvp_status: { $exists: false } },
          { rsvp_status: '' }
        ];
        break;
    }
    
    // Build sort criteria
    const sortCriteria: Record<string, 1 | -1> = {};
    sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const result = await db_operations.getInviteesWithPagination(
      searchCriteria,
      sortCriteria,
      limit,
      skip
    );
    
    return NextResponse.json({
      success: true,
      data: result.invitees,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page < Math.ceil(result.total / limit),
        hasPrev: page > 1
      },
      filters: {
        search,
        sortBy,
        sortOrder,
        filter
      }
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
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
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
      email: body.email?.trim().toLowerCase() || '',
      phone: body.phone?.trim() || '',
      notes: body.notes?.trim() || '',
      email_invite_flag: Boolean(body.email_invite_flag) && Boolean(body.email?.trim()),
      invitation_sent: false,
      rsvp_status: 'pending',
      checked_in: false
    };
    
    // Save to database
    await db_operations.createInvitee(inviteeData);
    
    // Send email immediately if flagged and email is provided
    if (inviteeData.email_invite_flag && inviteeData.email) {
      try {
        const newInvitee = await db_operations.getInviteeBySn(inviteeData.sn);
        if (newInvitee) {
          const { sendInvitationEmail } = await import('@/lib/email');
          const baseUrl = getBaseUrl(request);
          await sendInvitationEmail(newInvitee, baseUrl);
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
        const sn = await generateInviteeSN();
        
        const inviteeData = {
          sn,
          name: row.name,
          title: row.title || '',
          company: row.company || '',
          email: row.email.toLowerCase(),
          phone: row.phone || '',
          notes: row.notes || '',
          email_invite_flag: Boolean(row.email_invite_flag),
          invitation_sent: false,
          rsvp_status: 'pending',
          checked_in: false
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
