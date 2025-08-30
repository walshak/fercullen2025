import { NextRequest, NextResponse } from 'next/server';
import { db_operations } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await params;
    
    if (!sn) {
      return NextResponse.json({ error: 'Serial number is required' }, { status: 400 });
    }

    console.log(`Fetching invitee with SN: ${sn}`);

    const invitee = await db_operations.getInviteeBySn(sn);
    
    if (!invitee) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: invitee
    });

  } catch (error) {
    console.error('Error fetching invitee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await params;
    const { status, preferences, notes } = await request.json();
    
    if (!sn) {
      return NextResponse.json({ error: 'Serial number is required' }, { status: 400 });
    }

    if (!status || !['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Valid RSVP status is required' }, { status: 400 });
    }

    // Check if invitee exists
    const existingInvitee = await db_operations.getInviteeBySn(sn);
    if (!existingInvitee) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Update RSVP
    const updateData: Partial<{
      rsvp_status: string;
      rsvp_submitted_at: string;
      rsvp_preferences?: string;
      rsvp_notes?: string;
    }> = {
      rsvp_status: status,
      rsvp_submitted_at: new Date().toISOString()
    };

    // Only add preferences for accepted RSVPs
    if (status === 'accepted' && preferences !== undefined) {
      updateData.rsvp_preferences = preferences;
    }
    
    if (notes !== undefined) {
      updateData.rsvp_notes = notes;
    }

    const success = await db_operations.updateInvitee(existingInvitee.sn, updateData);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
    }

    // Log the RSVP submission
    await db_operations.logInvitation({
      invitee_sn: sn,
      email: existingInvitee.email || '',
      status: `rsvp_${status}`,
      error_message: `RSVP submitted: ${status}${preferences ? `, preferences: ${preferences}` : ''}${notes ? `, notes: ${notes}` : ''}`,
      sent_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'RSVP submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
