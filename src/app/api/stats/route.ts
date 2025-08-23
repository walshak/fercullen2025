import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db_operations } from '@/lib/database';

// GET /api/stats - Get dashboard statistics
export const GET = requireAuth(async () => {
  try {
    const stats = await db_operations.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
});
