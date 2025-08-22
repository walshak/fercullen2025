import { NextRequest, NextResponse } from 'next/server';
import { db_operations } from '@/lib/database';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    try {
      await sendInvitationEmail(invitee);
      await db_operations.updateInvitee(invitee.sn, { 
        invitation_sent: true, 
        invitation_sent_at: new Date().toISOString() 
      });

      return NextResponse.json({ 
        message: invitee.invitation_sent ? 'Invitation resent successfully' : 'Invitation sent successfully',
        email: invitee.email 
      });

    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send email invitation' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Send invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
