import { NextRequest, NextResponse } from 'next/server';
import { cache } from '~/lib/cache';

export async function POST(request: NextRequest) {
  try {
    console.log('[CLEAR-CACHE] Clearing all caches');

    // Clear all cache entries
    // Note: This is a simple implementation - in production you might want more selective clearing
    await cache.clear();

    console.log('[CLEAR-CACHE] All caches cleared successfully');

    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      data: {
        clearedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[CLEAR-CACHE] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear caches',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}