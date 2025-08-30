import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import QRCode from 'qrcode';

// CSV Template structure
export interface InviteeCSVRow {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  email_invite_flag?: boolean;
}

// Database invitee structure
export interface DBInvitee {
  id: number;
  sn: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  email_invite_flag: boolean;
  invitation_sent: boolean;
  invitation_sent_at?: string;
  rsvp_status: string;
  rsvp_preferences?: string;
  rsvp_notes?: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

// Generate CSV template
export function generateCSVTemplate(): string {
  const headers = [
    'name',
    'title',
    'company', 
    'email',
    'phone',
    'notes',
    'email_invite_flag'
  ];
  
  const sampleData = [
    {
      name: 'John Doe',
      title: 'CEO',
      company: 'Example Corp',
      email: 'john.doe@example.com',
      phone: '+234801234567',
      notes: 'VIP Guest',
      email_invite_flag: 'true'
    },
    {
      name: 'Jane Smith',
      title: 'Marketing Director',
      company: 'Sample Ltd',
      email: 'jane.smith@sample.com',
      phone: '+234809876543',
      notes: 'Media contact',
      email_invite_flag: 'false'
    }
  ];
  
  return stringify([headers, ...sampleData.map(row => Object.values(row))], {
    header: false
  });
}

// Parse CSV data
export function parseCSVData(csvContent: string): InviteeCSVRow[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[];
    
    return records.map((record) => ({
      name: record.name?.trim() || '',
      title: record.title?.trim() || '',
      company: record.company?.trim() || '',
      email: record.email?.trim() || '',
      phone: record.phone?.trim() || '',
      notes: record.notes?.trim() || '',
      email_invite_flag: record.email_invite_flag?.toLowerCase() === 'true'
    }));
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error('Invalid CSV format');
  }
}

// Validate CSV data
export function validateCSVData(data: InviteeCSVRow[]): {
  valid: boolean;
  errors: string[];
  validRows: InviteeCSVRow[];
} {
  const errors: string[] = [];
  const validRows: InviteeCSVRow[] = [];
  
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Required field validation
    if (!row.name) {
      errors.push(`Row ${rowNumber}: Name is required`);
    }
    
    if (!row.email) {
      errors.push(`Row ${rowNumber}: Email is required`);
    } else if (!isValidEmail(row.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
    }
    
    // If no errors for this row, add to valid rows
    if (row.name && row.email && isValidEmail(row.email)) {
      validRows.push(row);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    validRows
  };
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Export invitees to CSV
export function exportInviteesToCSV(invitees: DBInvitee[]): string {
  const headers = [
    'SN',
    'Name',
    'Title',
    'Company',
    'Email',
    'Phone',
    'Notes',
    'Email Invite Flag',
    'Invitation Sent',
    'RSVP Status',
    'RSVP Preferences',
    'RSVP Notes',
    'Checked In',
    'Created At'
  ];
  
  const rows = invitees.map(invitee => [
    invitee.sn,
    invitee.name,
    invitee.title || '',
    invitee.company || '',
    invitee.email,
    invitee.phone || '',
    invitee.notes || '',
    invitee.email_invite_flag ? 'Yes' : 'No',
    invitee.invitation_sent ? 'Yes' : 'No',
    invitee.rsvp_status || 'Pending',
    invitee.rsvp_preferences || '',
    invitee.rsvp_notes || '',
    invitee.checked_in ? 'Yes' : 'No',
    new Date(invitee.created_at).toLocaleString()
  ]);
  
  return stringify([headers, ...rows], {
    header: false
  });
}

// Generate QR code as PNG buffer
export async function generateQRCodePNG(text: string, size = 300): Promise<Buffer> {
  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: size,
      margin: 2,
      color: {
        dark: '#01315c',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    
    return qrBuffer;
  } catch (error) {
    console.error('Error generating QR code PNG:', error);
    throw error;
  }
}

// Generate multiple QR codes for bulk download
export async function generateBulkQRCodes(invitees: DBInvitee[], baseUrl?: string): Promise<{
  [key: string]: Buffer
}> {
  const qrCodes: { [key: string]: Buffer } = {};
  const appBaseUrl = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  for (const invitee of invitees) {
    const rsvpLink = `${appBaseUrl}/rsvp/${invitee.sn}`;
    const qrBuffer = await generateQRCodePNG(rsvpLink);
    qrCodes[`${invitee.sn}-${invitee.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`] = qrBuffer;
  }
  
  return qrCodes;
}

// Construct base URL from request object
export function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +234
  if (cleaned.startsWith('0')) {
    return `+234${cleaned.substring(1)}`;
  }
  
  // If starts with 234, add +
  if (cleaned.startsWith('234')) {
    return `+${cleaned}`;
  }
  
  // If doesn't start with country code, assume Nigerian number
  if (cleaned.length === 10) {
    return `+234${cleaned}`;
  }
  
  return phone; // Return original if can't format
}

// Generate unique filename with timestamp
export function generateFileName(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
}
