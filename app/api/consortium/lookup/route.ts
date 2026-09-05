import { NextResponse } from 'next/server'
import { queryConsortium } from '@/lib/intelligence/cross-institution-db'
import { createPseudonymousIdentifier, normalizeIdentifier } from '@/lib/intelligence/privacy-engine'

/**
 * POST /api/consortium/lookup
 * 
 * Queries the cross-institution intelligence repository for matching threat indicators.
 * Demonstrates privacy-preserving pseudonymization:
 * 1. Validates input
 * 2. Normalizes identifier
 * 3. Generates pseudonymous token
 * 4. Queries consortium database
 * 5. Returns aggregate intelligence WITHOUT exposing raw customer PII of other banks.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entityType = 'BENEFICIARY', identifier } = body

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json(
        { error: 'Identifier is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const normalized = normalizeIdentifier(identifier, entityType)
    const { hash, displayToken } = createPseudonymousIdentifier(identifier, entityType)
    const match = queryConsortium(entityType, identifier)

    if (!match) {
      return NextResponse.json({
        match: false,
        entityType,
        pseudonymousIdentifier: displayToken,
        pseudonymizedIdentifier: displayToken,
        message: 'No matching cross-institution intelligence found for this indicator.',
        searchedAt: new Date().toISOString()
      })
    }

    const token = match.pseudonymousIdentifier || match.pseudonymizedIdentifier || displayToken

    return NextResponse.json({
      match: true,
      id: match.id,
      entityType: match.entityType || entityType,
      pseudonymousIdentifier: token,
      pseudonymizedIdentifier: token,
      riskScore: match.riskScore || 80,
      riskLevel: match.riskLevel,
      confidence: match.confidence,
      reportCount: match.reportCount || match.reportingInstitutionsCount,
      institutionCount: match.reportingInstitutionsCount,
      contributingInstitutions: Array.isArray(match.contributingInstitutions) ? match.contributingInstitutions : [],
      firstSeen: match.firstSeen,
      lastSeen: match.lastSeen,
      recencyNote: match.recencyNote,
      signalTypes: [match.signalType],
      tags: Array.isArray(match.tags) ? match.tags : [],
      status: match.status || 'ACTIVE',
      disclaimer: 'Intelligence signal derived from participating institutions. Does not constitute an automatic fraud decision.'
    })
  } catch (error) {
    console.error('Consortium lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to process consortium intelligence lookup' },
      { status: 500 }
    )
  }
}
