import { NextResponse } from 'next/server'
import { addOrUpdateConsortiumRecord, normalizeConsortiumRecord, PARTICIPATING_INSTITUTIONS } from '@/lib/intelligence/cross-institution-db'

/**
 * POST /api/consortium/report
 * 
 * Submits validated threat intelligence to the shared cross-institution consortium.
 * Implements multi-institution corroboration:
 * - If entity is reported for the first time: registers new pseudonymous record.
 * - If entity was previously reported by another bank: increments reportCount,
 *   merges participating institutions, updates lastSeen recency, and aggregates risk/confidence.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      institutionId = 'BANK_A',
      entityType = 'BENEFICIARY',
      identifier,
      riskScore = 85,
      confidence = 0.90,
      signalType,
      tags = [],
      notes
    } = body

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json(
        { error: 'Identifier is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const validInstitutions = PARTICIPATING_INSTITUTIONS.map(i => i.id)
    const normalizedInst = institutionId.toUpperCase()
    
    // Fallback or accept valid institution
    const reportingInstId = validInstitutions.includes(normalizedInst) ? normalizedInst : 'BANK_A'

    const result = addOrUpdateConsortiumRecord({
      institutionId: reportingInstId,
      entityType,
      identifier,
      riskScore: Math.min(100, Math.max(1, Number(riskScore))),
      confidence: Math.min(0.99, Math.max(0.1, Number(confidence))),
      signalType,
      tags: Array.isArray(tags) ? tags : [],
      notes: notes ? String(notes).trim() : undefined,
    })

    const normalizedRecord = normalizeConsortiumRecord(result.record)

    return NextResponse.json({
      success: true,
      isNew: result.isNew,
      message: result.isNew
        ? 'New threat intelligence indicator indexed into consortium.'
        : 'Existing threat intelligence indicator updated with multi-institution corroboration.',
      record: {
        ...normalizedRecord,
        institutionCount: normalizedRecord.contributingInstitutions.length,
      }
    })
  } catch (error) {
    console.error('Consortium report error:', error)
    return NextResponse.json(
      { error: 'Failed to submit consortium intelligence report' },
      { status: 500 }
    )
  }
}
