import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db_operations, initDatabase } from '@/lib/database';
import { getBaseUrl } from '@/lib/utils';

export async function GET(
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

    // Generate RSVP URL using request object
    const baseUrl = getBaseUrl(request);
    const rsvpUrl = `${baseUrl}/rsvp/${invitee.sn}`;

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(rsvpUrl, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#01315C', // Fercullen dark blue
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return new NextResponse(qrCodeBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-${invitee.sn}-${invitee.name.replace(/[^a-zA-Z0-9]/g, '_')}.png"`
      }
    });

  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
