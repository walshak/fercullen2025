import { NextRequest, NextResponse } from 'next/server';
import { db_operations } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await params;
    
    if (!sn) {
      return NextResponse.json({ error: 'Invalid invitee serial number' }, { status: 400 });
    }

    // Get invitee by serial number
    const invitee = await db_operations.getInviteeBySn(sn);
    
    if (!invitee) {
      return NextResponse.json({ error: 'Invitee not found' }, { status: 404 });
    }

    if (invitee.checked_in) {
      return NextResponse.json({ error: 'Already checked in' }, { status: 400 });
    }

    // Auto-accept RSVP if still pending (for walk-ins or admin check-ins)
    const updateData: {
      checked_in: boolean;
      checked_in_at: string;
      rsvp_status?: string;
      rsvp_submitted_at?: string;
    } = {
      checked_in: true,
      checked_in_at: new Date().toISOString()
    };

    if (invitee.rsvp_status === 'pending') {
      updateData.rsvp_status = 'accepted';
      updateData.rsvp_submitted_at = new Date().toISOString();
    } else if (invitee.rsvp_status === 'declined') {
      return NextResponse.json({ error: 'Cannot check in declined RSVP' }, { status: 400 });
    }

    await db_operations.updateInvitee(invitee.sn, updateData);

    // Get updated invitee data
    const updatedInvitee = await db_operations.getInviteeBySn(sn);

    return NextResponse.json({ 
      message: 'Successfully checked in',
      data: updatedInvitee
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to check in invitee' },
      { status: 500 }
    );
  }
}
