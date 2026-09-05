import { NextResponse } from 'next/server'
import { getAllConsortiumRecords, getConsortiumStats, normalizeConsortiumRecord, PARTICIPATING_INSTITUTIONS } from '@/lib/intelligence/cross-institution-db'

/**
 * GET /api/consortium/records
 * 
 * Returns all indexed consortium intelligence records and network statistics.
 * Used by the Consortium Intelligence page to display active threat indicators.
 */
export async function GET() {
  try {
    const rawRecords = getAllConsortiumRecords()
    const stats = getConsortiumStats()

    const records = rawRecords.map(r => {
      const normalized = normalizeConsortiumRecord(r)
      return {
        ...normalized,
        institutionCount: normalized.contributingInstitutions.length,
      }
    })

    return NextResponse.json({
      success: true,
      stats,
      participatingInstitutions: PARTICIPATING_INSTITUTIONS,
      records,
    })
  } catch (error) {
    console.error('Failed to fetch consortium records:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve consortium intelligence records' },
      { status: 500 }
    )
  }
}
