import { NextRequest, NextResponse } from 'next/server';
import { db_operations, initDatabase } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();

    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid invitee ID' }, { status: 400 });
    }

    // Get all invitees and find by ID
    const allInvitees = await db_operations.getAllInvitees();
    const invitee = allInvitees.find(inv => inv.id === id);
    
    if (!invitee) {
      return NextResponse.json({ error: 'Invitee not found' }, { status: 404 });
    }

    if (invitee.checked_in) {
      return NextResponse.json({ error: 'Already checked in' }, { status: 400 });
    }

    if (invitee.rsvp_status !== 'accepted') {
      return NextResponse.json({ error: 'Can only check in accepted RSVPs' }, { status: 400 });
    }

    await db_operations.checkInInvitee(invitee.sn);

    return NextResponse.json({ 
      message: 'Successfully checked in',
      invitee: {
        id: invitee.id,
        name: invitee.name,
        email: invitee.email,
        checked_in_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to check in invitee' },
      { status: 500 }
    );
  }
}
