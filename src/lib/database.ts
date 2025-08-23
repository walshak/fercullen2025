// MongoDB database implementation for the Fercullen RSVP app
import { MongoClient, Db, Collection } from 'mongodb';
import bcrypt from 'bcryptjs';

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

class MongoDatabase {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionPromise: Promise<void> | null = null;

  private async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.doConnect();
    return this.connectionPromise;
  }

  private async doConnect(): Promise<void> {
    if (this.client) {
      return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    this.client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await this.client.connect();
    this.db = this.client.db('fercullen2025');
    console.log('Connected to MongoDB');
  }

  private async getCollection(name: string): Promise<Collection> {
    await this.connect();
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection(name);
  }

  // Initialize database with default admin user
  async initialize(): Promise<void> {
    try {
      await this.connect();
      
      // Check if admin user exists
      const adminsCollection = await this.getCollection('admins');
      const adminExists = await adminsCollection.findOne({ username: 'admin' });
      
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'fercullen2025', 10);
        const defaultAdmin: Admin = {
          id: 1,
          username: 'admin',
          password: hashedPassword,
          created_at: new Date().toISOString()
        };
        
        await adminsCollection.insertOne(defaultAdmin);
        console.log('Default admin user created');
      }

      // Create indexes for better performance
      const inviteesCollection = await this.getCollection('invitees');
      await inviteesCollection.createIndex({ sn: 1 }, { unique: true });
      await inviteesCollection.createIndex({ email: 1 });
      
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Invitee operations
  async getAllInvitees(): Promise<Invitee[]> {
    const collection = await this.getCollection('invitees');
    return await collection.find({}).toArray() as unknown as Invitee[];
  }

  async getInviteeBySn(sn: string): Promise<Invitee | null> {
    const collection = await this.getCollection('invitees');
    return await collection.findOne({ sn }) as unknown as Invitee | null;
  }

  async getInviteeById(id: number): Promise<Invitee | null> {
    const collection = await this.getCollection('invitees');
    return await collection.findOne({ id }) as unknown as Invitee | null;
  }

  async createInvitee(inviteeData: Omit<Invitee, 'id' | 'created_at' | 'updated_at'>): Promise<Invitee> {
    const collection = await this.getCollection('invitees');
    
    // Get next ID
    const lastInvitee = await collection.findOne({}, { sort: { id: -1 } }) as unknown as Invitee | null;
    const nextId = lastInvitee ? lastInvitee.id + 1 : 1;

    const now = new Date().toISOString();
    const invitee: Invitee = {
      ...inviteeData,
      id: nextId,
      created_at: now,
      updated_at: now
    };

    await collection.insertOne(invitee);
    return invitee;
  }

  async updateInvitee(sn: string, updates: Partial<Invitee>): Promise<Invitee | null> {
    const collection = await this.getCollection('invitees');
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const result = await collection.findOneAndUpdate(
      { sn },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result as unknown as Invitee | null;
  }

  async deleteInvitee(sn: string): Promise<boolean> {
    const collection = await this.getCollection('invitees');
    const result = await collection.deleteOne({ sn });
    return result.deletedCount > 0;
  }

  async bulkCreateInvitees(invitees: Omit<Invitee, 'id' | 'created_at' | 'updated_at'>[]): Promise<Invitee[]> {
    const collection = await this.getCollection('invitees');
    
    // Get next ID
    const lastInvitee = await collection.findOne({}, { sort: { id: -1 } }) as unknown as Invitee | null;
    let nextId = lastInvitee ? lastInvitee.id + 1 : 1;

    const now = new Date().toISOString();
    const inviteesToInsert: Invitee[] = invitees.map(invitee => ({
      ...invitee,
      id: nextId++,
      created_at: now,
      updated_at: now
    }));

    await collection.insertMany(inviteesToInsert);
    return inviteesToInsert;
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | null> {
    const collection = await this.getCollection('admins');
    return await collection.findOne({ username }) as unknown as Admin | null;
  }

  async getAllAdmins(): Promise<Admin[]> {
    const collection = await this.getCollection('admins');
    return await collection.find({}).toArray() as unknown as Admin[];
  }

  // Invitation log operations
  async logInvitation(log: Omit<InvitationLog, 'id'>): Promise<void> {
    const collection = await this.getCollection('invitation_logs');
    
    // Get next ID
    const lastLog = await collection.findOne({}, { sort: { id: -1 } }) as unknown as InvitationLog | null;
    const nextId = lastLog ? lastLog.id + 1 : 1;

    const logEntry: InvitationLog = {
      ...log,
      id: nextId
    };

    await collection.insertOne(logEntry);
  }

  async getInvitationLogs(): Promise<InvitationLog[]> {
    const collection = await this.getCollection('invitation_logs');
    return await collection.find({}).sort({ sent_at: -1 }).toArray() as unknown as InvitationLog[];
  }

  // Statistics
  async getStats() {
    const inviteesCollection = await this.getCollection('invitees');
    const logsCollection = await this.getCollection('invitation_logs');

    const [
      totalInvitees,
      sentInvitations,
      acceptedRsvps,
      checkedInGuests,
      totalLogs
    ] = await Promise.all([
      inviteesCollection.countDocuments({}),
      inviteesCollection.countDocuments({ invitation_sent: true }),
      inviteesCollection.countDocuments({ rsvp_status: 'accepted' }),
      inviteesCollection.countDocuments({ checked_in: true }),
      logsCollection.countDocuments({})
    ]);

    return {
      total_invitees: totalInvitees,
      sent_invitations: sentInvitations,
      accepted_rsvps: acceptedRsvps,
      checked_in_guests: checkedInGuests,
      total_logs: totalLogs
    };
  }

  // Close connection
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.connectionPromise = null;
    }
  }
}

// Export a singleton instance
const mongoDb = new MongoDatabase();

// Export the operations object
export const db_operations = {
  // Initialize
  initialize: () => mongoDb.initialize(),

  // Invitee operations
  getAllInvitees: () => mongoDb.getAllInvitees(),
  getInviteeBySn: (sn: string) => mongoDb.getInviteeBySn(sn),
  getInviteeById: (id: number) => mongoDb.getInviteeById(id),
  createInvitee: (inviteeData: Omit<Invitee, 'id' | 'created_at' | 'updated_at'>) => mongoDb.createInvitee(inviteeData),
  updateInvitee: (sn: string, updates: Partial<Invitee>) => mongoDb.updateInvitee(sn, updates),
  deleteInvitee: (sn: string) => mongoDb.deleteInvitee(sn),
  bulkCreateInvitees: (invitees: Omit<Invitee, 'id' | 'created_at' | 'updated_at'>[]) => mongoDb.bulkCreateInvitees(invitees),

  // Admin operations
  getAdminByUsername: (username: string) => mongoDb.getAdminByUsername(username),
  getAllAdmins: () => mongoDb.getAllAdmins(),

  // Invitation log operations
  logInvitation: (log: Omit<InvitationLog, 'id'>) => mongoDb.logInvitation(log),
  getInvitationLogs: () => mongoDb.getInvitationLogs(),

  // Statistics
  getStats: () => mongoDb.getStats(),

  // Close connection
  close: () => mongoDb.close()
};

// Initialize on import
mongoDb.initialize().catch(console.error);

export default mongoDb;
