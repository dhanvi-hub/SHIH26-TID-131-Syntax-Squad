import { NextResponse } from 'next/server'
import { getConsortiumStats, PARTICIPATING_INSTITUTIONS } from '@/lib/intelligence/cross-institution-db'

/**
 * GET /api/consortium/stats
 * Returns live consortium metrics computed from active intelligence records.
 */
export async function GET() {
  try {
    const stats = getConsortiumStats()
    return NextResponse.json({
      success: true,
      stats,
      institutions: PARTICIPATING_INSTITUTIONS,
    })
  } catch (error) {
    console.error('Failed to fetch consortium stats:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve consortium stats' },
      { status: 500 }
    )
  }
}
