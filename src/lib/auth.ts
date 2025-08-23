import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db_operations } from './database';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fercullen-whiskey-launch-2025';

export interface AdminUser {
  id: number;
  username: string;
}

// Authenticate admin user
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    const admin = await db_operations.getAdminByUsername(username);
    
    if (!admin) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return {
      id: admin.id,
      username: admin.username
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Generate JWT token
export function generateToken(user: AdminUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token
export function verifyToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & AdminUser;
    return {
      id: decoded.id,
      username: decoded.username
    };
  } catch {
    return null;
  }
}

// Get current user from request
export function getCurrentUser(request: NextRequest): AdminUser | null {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Middleware to check authentication
export function requireAuth(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const user = getCurrentUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request);
  };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Generate unique invitee serial number
export async function generateInviteeSN(): Promise<string> {
  try {
    // Import the database operations
    const { db_operations } = await import('@/lib/database');
    
    // Get all existing invitees to determine next number
    const existingInvitees = await db_operations.getAllInvitees();
    
    // Find the highest FQ number and increment
    const existingNumbers = existingInvitees
      .map((inv) => inv.sn)
      .filter((sn: string) => sn.startsWith('FQ-'))
      .map((sn: string) => {
        const num = sn.split('-')[1];
        return num ? parseInt(num, 10) : 0;
      })
      .filter((num: number) => !isNaN(num));
    
    let nextNumber = 1;
    if (existingNumbers.length > 0) {
      nextNumber = Math.max(...existingNumbers) + 1;
    }
    
    // Format as FQ-XXX with zero padding
    return `FQ-${nextNumber.toString().padStart(3, '0')}`;
    
  } catch {
    // Fallback: use timestamp-based approach if we can't access db
    const fallbackNumber = (Date.now() % 999) + 1; // 1-999
    return `FQ-${fallbackNumber.toString().padStart(3, '0')}`;
  }
}
