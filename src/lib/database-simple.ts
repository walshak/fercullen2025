// Simple in-memory database for development
// TODO: Replace with proper SQLite implementation

interface Invitee {
  id: number;
  sn: string;
  name: string;
  title?: string;
  company?: string;
  email: string;
  phone?: string;
  notes?: string;
  email_invite_flag: boolean;
  invitation_sent: boolean;
  invitation_sent_at?: string;
  rsvp_status: string;
  rsvp_preferences?: string;
  rsvp_notes?: string;
  rsvp_submitted_at?: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

interface Admin {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

interface InvitationLog {
  id: number;
  invitee_sn: string;
  email: string;
  status: string;
  error_message?: string;
  sent_at: string;
}

// In-memory storage
const invitees: Invitee[] = [];
const admins: Admin[] = [];
const invitation_logs: InvitationLog[] = [];
let nextId = 1;

// Initialize with default admin
export async function initDatabase() {
  if (admins.length === 0) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'fercullen2025', 10);
    
    admins.push({
      id: nextId++,
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedPassword,
      created_at: new Date().toISOString()
    });
  }
  
  return true;
}

export function saveDatabase() {
  // In development, data persists in memory only
  console.log('Database saved (in-memory)');
}

export async function getDatabase() {
  await initDatabase();
  return true;
}

export const db_operations = {
  async getAdmin(username: string) {
    return admins.find(admin => admin.username === username);
  },

  async createInvitee(inviteeData: Omit<Invitee, 'id' | 'invitation_sent' | 'rsvp_status' | 'checked_in' | 'created_at' | 'updated_at'>) {
    // Check for duplicate email
    if (invitees.some(inv => inv.email === inviteeData.email)) {
      throw new Error('UNIQUE constraint failed: invitees.email');
    }
    
    const newInvitee: Invitee = {
      ...inviteeData,
      id: nextId++,
      invitation_sent: false,
      rsvp_status: 'pending',
      checked_in: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    invitees.push(newInvitee);
    return { success: true };
  },

  async getAllInvitees() {
    return [...invitees].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getInviteeBySN(sn: string) {
    return invitees.find(inv => inv.sn === sn);
  },

  async updateInvitee(sn: string, data: Partial<Invitee>) {
    const index = invitees.findIndex(inv => inv.sn === sn);
    if (index === -1) {
      throw new Error('Invitee not found');
    }
    
    invitees[index] = {
      ...invitees[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    return { success: true };
  },

  async deleteInvitee(sn: string) {
    const index = invitees.findIndex(inv => inv.sn === sn);
    if (index === -1) {
      throw new Error('Invitee not found');
    }
    
    invitees.splice(index, 1);
    return { success: true };
  },

  async updateRSVP(sn: string, rsvpData: { status: string; preferences?: string; notes?: string }) {
    const index = invitees.findIndex(inv => inv.sn === sn);
    if (index === -1) {
      throw new Error('Invitee not found');
    }
    
    invitees[index] = {
      ...invitees[index],
      rsvp_status: rsvpData.status,
      rsvp_preferences: rsvpData.preferences || '',
      rsvp_notes: rsvpData.notes || '',
      rsvp_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { success: true };
  },

  async checkInInvitee(sn: string) {
    const index = invitees.findIndex(inv => inv.sn === sn);
    if (index === -1) {
      throw new Error('Invitee not found');
    }
    
    invitees[index] = {
      ...invitees[index],
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { success: true };
  },

  async logInvitation(inviteeSN: string, email: string, status: string, errorMessage?: string) {
    const log: InvitationLog = {
      id: nextId++,
      invitee_sn: inviteeSN,
      email,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    };
    
    invitation_logs.push(log);
  },

  async getStats() {
    const totalInvitees = invitees.length;
    const totalSent = invitees.filter(inv => inv.invitation_sent).length;
    const totalRSVP = invitees.filter(inv => inv.rsvp_status !== 'pending').length;
    const totalAccepted = invitees.filter(inv => inv.rsvp_status === 'accepted').length;
    const totalDeclined = invitees.filter(inv => inv.rsvp_status === 'declined').length;
    const totalCheckedIn = invitees.filter(inv => inv.checked_in).length;

    return {
      totalInvitees,
      totalSent,
      totalRSVP,
      totalAccepted,
      totalDeclined,
      totalCheckedIn
    };
  }
};
