// Production-ready in-memory database for the Fercullen RSVP app
// This can be easily replaced with SQLite when deployment environment supports it

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

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

interface DatabaseState {
  invitees: Invitee[];
  admins: Admin[];
  invitation_logs: InvitationLog[];
  nextId: number;
}

// Persistent storage file path
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'fercullen-db.json');

// In-memory storage with persistence
let dbState: DatabaseState = {
  invitees: [],
  admins: [],
  invitation_logs: [],
  nextId: 1
};

// Load database from file
function loadDatabase(): void {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
      dbState = JSON.parse(data);
      console.log('Database loaded from file');
    } else {
      console.log('No existing database file found, starting fresh');
    }
  } catch (error) {
    console.error('Error loading database:', error);
    // Keep default empty state
  }
}

// Save database to file
export function saveDatabase(): void {
  try {
    const dataDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbState, null, 2), 'utf8');
    console.log('Database saved to file');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Initialize database
export async function initDatabase(): Promise<boolean> {
  // Load existing data
  loadDatabase();
  
  // Create default admin if none exists
  if (dbState.admins.length === 0) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'fercullen2025', 10);
    
    dbState.admins.push({
      id: dbState.nextId++,
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedPassword,
      created_at: new Date().toISOString()
    });
    
    saveDatabase();
    console.log('Default admin user created');
  }
  
  return true;
}

export async function getDatabase(): Promise<boolean> {
  await initDatabase();
  return true;
}

export const db_operations = {
  async getAdmin(username: string): Promise<Admin | undefined> {
    return dbState.admins.find(admin => admin.username === username);
  },

  async createInvitee(inviteeData: Omit<Invitee, 'id' | 'invitation_sent' | 'rsvp_status' | 'checked_in' | 'created_at' | 'updated_at'>): Promise<{ success: boolean }> {
    // Check for duplicate email
    if (dbState.invitees.some(inv => inv.email === inviteeData.email)) {
      throw new Error('UNIQUE constraint failed: invitees.email');
    }
    
    // Check for duplicate SN
    if (dbState.invitees.some(inv => inv.sn === inviteeData.sn)) {
      throw new Error('UNIQUE constraint failed: invitees.sn');
    }
    
    const newInvitee: Invitee = {
      ...inviteeData,
      id: dbState.nextId++,
      invitation_sent: false,
      rsvp_status: 'pending',
      checked_in: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    dbState.invitees.push(newInvitee);
    saveDatabase();
    return { success: true };
  },

  async getAllInvitees(): Promise<Invitee[]> {
    return [...dbState.invitees].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getInviteeBySN(sn: string): Promise<Invitee | null> {
    return dbState.invitees.find(inv => inv.sn === sn) || null;
  },

  async updateInvitee(identifier: string | number, data: Partial<Invitee>): Promise<{ success: boolean }> {
    let index = -1;
    
    if (typeof identifier === 'string') {
      // Update by SN
      index = dbState.invitees.findIndex(inv => inv.sn === identifier);
    } else {
      // Update by ID
      index = dbState.invitees.findIndex(inv => inv.id === identifier);
    }
    
    if (index === -1) {
      return { success: false };
    }
    
    dbState.invitees[index] = {
      ...dbState.invitees[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    saveDatabase();
    return { success: true };
  },

  async deleteInvitee(sn: string): Promise<{ success: boolean }> {
    const index = dbState.invitees.findIndex(inv => inv.sn === sn);
    if (index === -1) {
      throw new Error('Invitee not found');
    }
    
    dbState.invitees.splice(index, 1);
    saveDatabase();
    return { success: true };
  },

  async updateRSVP(sn: string, rsvpData: { status: string; preferences?: string; notes?: string }): Promise<{ success: boolean }> {
    const index = dbState.invitees.findIndex(inv => inv.sn === sn);
    if (index === -1) {
      throw new Error('Invitee not found');
    }
    
    dbState.invitees[index] = {
      ...dbState.invitees[index],
      rsvp_status: rsvpData.status,
      rsvp_preferences: rsvpData.preferences || '',
      rsvp_notes: rsvpData.notes || '',
      rsvp_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    saveDatabase();
    return { success: true };
  },

  async checkInInvitee(sn: string): Promise<{ success: boolean }> {
    const index = dbState.invitees.findIndex(inv => inv.sn === sn);
    if (index === -1) {
      throw new Error('Invitee not found');
    }
    
    dbState.invitees[index] = {
      ...dbState.invitees[index],
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    saveDatabase();
    return { success: true };
  },

  async logInvitation(inviteeSN: string, email: string, status: string, errorMessage?: string): Promise<void> {
    const log: InvitationLog = {
      id: dbState.nextId++,
      invitee_sn: inviteeSN,
      email,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    };
    
    dbState.invitation_logs.push(log);
    saveDatabase();
  },

  async getStats() {
    const totalInvitees = dbState.invitees.length;
    const totalSent = dbState.invitees.filter(inv => inv.invitation_sent).length;
    const totalRSVP = dbState.invitees.filter(inv => inv.rsvp_status !== 'pending').length;
    const totalAccepted = dbState.invitees.filter(inv => inv.rsvp_status === 'accepted').length;
    const totalDeclined = dbState.invitees.filter(inv => inv.rsvp_status === 'declined').length;
    const totalCheckedIn = dbState.invitees.filter(inv => inv.checked_in).length;

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


