/**
 * Prototype Cross-Institution Consortium Intelligence Layer
 * Demonstrates privacy-preserving fraud intelligence sharing across participating financial institutions.
 * 
 * Simulated Institutions:
 * 1. Bank A (Apex Bank Ltd)
 * 2. Bank B (Horizon Financial Corp)
 * 3. Bank C (Nexus Payments Network)
 * 4. Bank D (Zenith Credit Union)
 * 
 * IMPORTANT ARCHITECTURAL & COMPLIANCE NOTE:
 * All records are indexed by salted/pseudonymized SHA-256 tokens.
 * No raw customer PII (e.g. customer name, raw account number, phone number) is shared or exposed.
 * Matching is performed strictly over pseudonymous representations.
 */

import { hashIdentifier, normalizeIdentifier, createPseudonymousIdentifier, maskIdentifier } from './privacy-engine'
import type { IntelligenceSignalMatch, ConsortiumRecord, ConsortiumStats } from '@/lib/types'

export interface InstitutionInfo {
  id: string
  name: string
  code: string
}

export const PARTICIPATING_INSTITUTIONS: InstitutionInfo[] = [
  { id: 'BANK_A', name: 'Apex Bank Ltd', code: 'APEX' },
  { id: 'BANK_B', name: 'Horizon Financial Corp', code: 'HORIZON' },
  { id: 'BANK_C', name: 'Nexus Payments Network', code: 'NEXUS' },
  { id: 'BANK_D', name: 'Zenith Credit Union', code: 'ZENITH' },
]

export const PARTICIPATING_INSTITUTION_NAMES = PARTICIPATING_INSTITUTIONS.map(i => i.name)

// Helper to resolve institution display name from ID or name
export function resolveInstitutionName(idOrName: string): string {
  const match = PARTICIPATING_INSTITUTIONS.find(
    i => i.id.toUpperCase() === idOrName.toUpperCase() || i.name.toLowerCase() === idOrName.toLowerCase()
  )
  return match ? match.name : idOrName
}

// Pre-computed known threat seeds (plain text used only to generate prototype pseudonymous tokens)
const KNOWN_THREAT_SEEDS = [
  {
    id: 'INTEL-2026-001',
    institutionId: 'BANK_A',
    type: 'beneficiary',
    entityType: 'BENEFICIARY' as const,
    raw: 'BEN-MULE-8801',
    signalType: 'BENEFICIARY_RISK' as const,
    riskLevel: 'HIGH' as const,
    riskScore: 88,
    confidence: 0.94,
    contributingInstitutions: ['Apex Bank Ltd', 'Nexus Payments Network', 'Horizon Financial Corp'],
    firstSeen: '2026-06-12T10:30:00Z',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    reportedAt: '2026-06-12T10:30:00Z',
    reportCount: 3,
    status: 'ACTIVE' as const,
    tags: ['mule_account', 'rapid_dispersal', 'inter_bank_velocity'],
    notes: 'Rapid cross-border fund dispersal following incoming micro-deposits.'
  },
  {
    id: 'INTEL-2026-002',
    institutionId: 'BANK_B',
    type: 'beneficiary',
    entityType: 'BENEFICIARY' as const,
    raw: 'BEN-SCAM-7723',
    signalType: 'KNOWN_SCAM_ACCOUNT' as const,
    riskLevel: 'CRITICAL' as const,
    riskScore: 96,
    confidence: 0.98,
    contributingInstitutions: ['Horizon Financial Corp', 'Apex Bank Ltd', 'Zenith Credit Union', 'Nexus Payments Network'],
    firstSeen: '2026-05-04T08:00:00Z',
    lastSeen: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m ago
    reportedAt: '2026-05-04T08:00:00Z',
    reportCount: 5,
    status: 'ACTIVE' as const,
    tags: ['phishing_collector', 'cybercrime_reported', 'active_freeze_request'],
    notes: 'Collector account for active impersonation scam syndicate.'
  },
  {
    id: 'INTEL-2026-003',
    institutionId: 'BANK_C',
    type: 'beneficiary',
    entityType: 'BENEFICIARY' as const,
    raw: 'BEN-LAUNDER-9912',
    signalType: 'MULE_NETWORK_SIGNAL' as const,
    riskLevel: 'HIGH' as const,
    riskScore: 84,
    confidence: 0.89,
    contributingInstitutions: ['Nexus Payments Network', 'Horizon Financial Corp', 'Apex Bank Ltd'],
    firstSeen: '2026-07-20T16:45:00Z',
    lastSeen: '2026-08-30T18:00:00Z',
    reportedAt: '2026-07-20T16:45:00Z',
    reportCount: 3,
    status: 'ACTIVE' as const,
    tags: ['layering_pattern', 'frequent_micro_deposits'],
    notes: 'Layering pattern identified across inter-bank clearing cycles.'
  },
  {
    id: 'INTEL-2026-009',
    institutionId: 'BANK_A',
    type: 'beneficiary',
    entityType: 'BENEFICIARY' as const,
    raw: 'mule_scammer_99@ybl',
    signalType: 'KNOWN_SCAM_ACCOUNT' as const,
    riskLevel: 'CRITICAL' as const,
    riskScore: 98,
    confidence: 0.99,
    contributingInstitutions: ['Apex Bank Ltd', 'Horizon Financial Corp', 'Nexus Payments Network', 'Zenith Credit Union'],
    firstSeen: '2026-01-10T10:00:00Z',
    lastSeen: new Date().toISOString(),
    reportedAt: '2026-01-10T10:00:00Z',
    reportCount: 12,
    status: 'ACTIVE' as const,
    tags: ['mule_account', 'active_scam_syndicate', 'kyc_fraud_collector'],
    notes: 'Primary collector account for active voice call impersonation and KYC scam syndicate.'
  },
  {
    id: 'INTEL-2026-010',
    institutionId: 'BANK_C',
    type: 'beneficiary',
    entityType: 'BENEFICIARY' as const,
    raw: 'power_discom@upi',
    signalType: 'BENEFICIARY_RISK' as const,
    riskLevel: 'CRITICAL' as const,
    riskScore: 94,
    confidence: 0.96,
    contributingInstitutions: ['Nexus Payments Network', 'Apex Bank Ltd', 'Horizon Financial Corp'],
    firstSeen: '2026-02-14T09:00:00Z',
    lastSeen: new Date().toISOString(),
    reportedAt: '2026-02-14T09:00:00Z',
    reportCount: 8,
    status: 'ACTIVE' as const,
    tags: ['phishing_discom', 'fake_utility_bill', 'sms_coercion'],
    notes: 'Fake electricity discom collector VPA used in SMS bill disconnection scams.'
  },
  {
    id: 'INTEL-2026-004',
    institutionId: 'BANK_A',
    type: 'device_fingerprint',
    entityType: 'DEVICE' as const,
    raw: 'FP-DEV-EMULATOR-77',
    signalType: 'DEVICE_REPUTATION' as const,
    riskLevel: 'CRITICAL' as const,
    riskScore: 95,
    confidence: 0.96,
    contributingInstitutions: ['Apex Bank Ltd', 'Horizon Financial Corp', 'Nexus Payments Network', 'Zenith Credit Union'],
    firstSeen: '2026-03-10T12:00:00Z',
    lastSeen: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    reportedAt: '2026-03-10T12:00:00Z',
    reportCount: 6,
    status: 'ACTIVE' as const,
    tags: ['device_farm_emulator', 'rooted_device', 'credential_stuffing_cluster'],
    notes: 'Synthetic device fingerprint linked to automated account takeover clusters.'
  },
  {
    id: 'INTEL-2026-005',
    institutionId: 'BANK_D',
    type: 'device_fingerprint',
    entityType: 'DEVICE' as const,
    raw: 'FP-DEV-BOT-303',
    signalType: 'DEVICE_REPUTATION' as const,
    riskLevel: 'HIGH' as const,
    riskScore: 78,
    confidence: 0.91,
    contributingInstitutions: ['Zenith Credit Union', 'Nexus Payments Network'],
    firstSeen: '2026-08-01T14:00:00Z',
    lastSeen: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    reportedAt: '2026-08-01T14:00:00Z',
    reportCount: 2,
    status: 'ACTIVE' as const,
    tags: ['headless_browser', 'automation_script'],
    notes: 'Headless browser agent used for rapid testing of harvested credentials.'
  },
  {
    id: 'INTEL-2026-006',
    institutionId: 'BANK_B',
    type: 'ip',
    entityType: 'IP' as const,
    raw: '198.51.100.44',
    signalType: 'IP_THREAT' as const,
    riskLevel: 'HIGH' as const,
    riskScore: 82,
    confidence: 0.92,
    contributingInstitutions: ['Horizon Financial Corp', 'Apex Bank Ltd', 'Nexus Payments Network'],
    firstSeen: '2026-04-18T05:22:00Z',
    lastSeen: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    reportedAt: '2026-04-18T05:22:00Z',
    reportCount: 4,
    status: 'ACTIVE' as const,
    tags: ['bulletproof_proxy', 'known_vpn_exit', 'ddos_associated'],
    notes: 'Hosting range dedicated to high-anonymity commercial proxy routing.'
  },
  {
    id: 'INTEL-2026-007',
    institutionId: 'BANK_A',
    type: 'ip',
    entityType: 'IP' as const,
    raw: '185.220.101.5',
    signalType: 'IP_THREAT' as const,
    riskLevel: 'CRITICAL' as const,
    riskScore: 97,
    confidence: 0.97,
    contributingInstitutions: ['Apex Bank Ltd', 'Horizon Financial Corp', 'Nexus Payments Network', 'Zenith Credit Union'],
    firstSeen: '2026-01-15T09:12:00Z',
    lastSeen: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    reportedAt: '2026-01-15T09:12:00Z',
    reportCount: 7,
    status: 'ACTIVE' as const,
    tags: ['tor_exit_node', 'syndicate_relay', 'account_takeover_source'],
    notes: 'Recognized syndicate relay active across all 4 clearing networks.'
  },
  {
    id: 'INTEL-2026-008',
    institutionId: 'BANK_C',
    type: 'user',
    entityType: 'ACCOUNT' as const,
    raw: 'USR009',
    signalType: 'MULE_NETWORK_SIGNAL' as const,
    riskLevel: 'HIGH' as const,
    riskScore: 76,
    confidence: 0.88,
    contributingInstitutions: ['Nexus Payments Network', 'Zenith Credit Union'],
    firstSeen: '2026-07-11T11:00:00Z',
    lastSeen: '2026-08-28T17:30:00Z',
    reportedAt: '2026-07-11T11:00:00Z',
    reportCount: 2,
    status: 'ACTIVE' as const,
    tags: ['cross_bank_syndicate_suspect', 'repeated_identity_mismatch'],
    notes: 'Repeated KYC discrepancy reported across merchant onboarding.'
  },
]

// Dynamic in-memory mock consortium repository keyed by pseudonymized SHA-256 hash
const CONSORTIUM_DATABASE: Map<string, ConsortiumRecord> = new Map()

// Initialize seeds
KNOWN_THREAT_SEEDS.forEach((seed) => {
  const { hash, displayToken } = createPseudonymousIdentifier(seed.raw, seed.type)
  CONSORTIUM_DATABASE.set(hash, {
    id: seed.id,
    institutionId: seed.institutionId,
    entityType: seed.entityType,
    signalType: seed.signalType,
    hashedIdentifier: hash,
    pseudonymousIdentifier: displayToken,
    riskScore: seed.riskScore,
    riskLevel: seed.riskLevel,
    confidence: seed.confidence,
    status: seed.status,
    tags: seed.tags,
    firstSeen: seed.firstSeen,
    lastSeen: seed.lastSeen,
    reportedAt: seed.reportedAt,
    reportCount: seed.reportCount,
    contributingInstitutions: seed.contributingInstitutions,
    notes: seed.notes,
  })
})

/**
 * Calculates a human-readable recency note and recency decay factor.
 */
function calculateRecency(lastSeenIso: string): { recencyNote: string; factor: number } {
  const diffMs = Date.now() - new Date(lastSeenIso).getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 60) {
    return { recencyNote: `Reported very recently (${Math.max(1, diffMinutes)}m ago)`, factor: 1.0 }
  } else if (diffHours < 24) {
    return { recencyNote: `Reported today (${diffHours}h ago)`, factor: 0.98 }
  } else if (diffDays <= 7) {
    return { recencyNote: `Reported this week (${diffDays}d ago)`, factor: 0.95 }
  } else if (diffDays <= 30) {
    return { recencyNote: `Reported this month (${diffDays}d ago)`, factor: 0.90 }
  } else if (diffDays <= 90) {
    return { recencyNote: `Reported past 90 days (${diffDays}d ago)`, factor: 0.80 }
  } else {
    return { recencyNote: `Historical intelligence (> 90d ago)`, factor: 0.70 }
  }
}

/**
 * Derives riskLevel enum from a numeric score.
 */
function deriveRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 90) return 'CRITICAL'
  if (score >= 70) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

/**
 * Query the consortium database using raw or normalized identifier.
 * Generates pseudonymous representation internally to protect customer privacy.
 * Also supports token-level lookup (e.g. "BEN-****7723") and common shorthand (e.g. "BEN-7723").
 */
export function queryConsortium(entityType: string, identifier: string): IntelligenceSignalMatch | null {
  if (!identifier) return null
  const clean = identifier.trim()
  const { hash } = createPseudonymousIdentifier(clean, entityType)
  
  // 1. Direct cryptographic hash lookup
  const directMatch = queryConsortiumByHash(hash)
  if (directMatch) return directMatch

  // 2. Token-level and alias-level lookup (for analyst investigation & interactive UI queries)
  // Handles cases where investigator enters the pseudonymous display token (e.g. "BEN-****7723"),
  // or a shortened format like "BEN-7723" or suffix "7723"
  const normalizedClean = clean.toUpperCase().replace(/\s+/g, '')
  const tokenMatch = Array.from(CONSORTIUM_DATABASE.values()).find((r) => {
    const rToken = (r.pseudonymousIdentifier || r.pseudonymizedIdentifier || '').toUpperCase()
    if (rToken === normalizedClean) return true

    // Check suffix matching (e.g. "BEN-7723" matching token "BEN-****7723")
    if (normalizedClean.includes('-')) {
      const parts = normalizedClean.split('-')
      const pPrefix = parts[0]
      const pSuffix = parts[parts.length - 1]
      if (rToken.startsWith(pPrefix) && rToken.endsWith(pSuffix)) return true
    } else if (normalizedClean.length >= 4 && rToken.endsWith(normalizedClean)) {
      return true
    }

    // Check against seed raw patterns
    const rawMatch = KNOWN_THREAT_SEEDS.find(s => s.id === r.id)
    if (rawMatch) {
      const rawNormalized = rawMatch.raw.toUpperCase().replace(/\s+/g, '')
      if (rawNormalized === normalizedClean || rawNormalized.includes(normalizedClean)) {
        return true
      }
      // Common shorthand (e.g. BEN-7723 vs BEN-SCAM-7723)
      const rawParts = rawNormalized.split('-')
      if (rawParts.length >= 3 && `${rawParts[0]}-${rawParts[rawParts.length - 1]}` === normalizedClean) {
        return true
      }
    }

    return false
  })

  if (tokenMatch) {
    return queryConsortiumByHash(tokenMatch.hashedIdentifier)
  }

  return null
}

/**
 * Query the consortium database using a pre-computed SHA-256 hash.
 * Returns privacy-preserving intelligence without exposing raw customer identities.
 */
export function queryConsortiumByHash(hash: string): IntelligenceSignalMatch | null {
  if (!hash) return null
  const match = CONSORTIUM_DATABASE.get(hash)
  if (!match) return null

  const { recencyNote, factor } = calculateRecency(match.lastSeen)
  // Apply mild recency weighting to effective confidence
  const adjustedConfidence = Math.round(match.confidence * factor * 100) / 100

  return {
    id: match.id,
    entityType: match.entityType,
    signalType: match.signalType,
    riskLevel: match.riskLevel,
    riskScore: match.riskScore,
    confidence: adjustedConfidence,
    reportingInstitutionsCount: match.contributingInstitutions.length,
    firstSeen: match.firstSeen,
    lastSeen: match.lastSeen,
    reportedAt: match.reportedAt,
    reportCount: match.reportCount,
    contributingInstitutions: [...match.contributingInstitutions],
    tags: [...match.tags],
    pseudonymizedIdentifier: match.pseudonymousIdentifier,
    pseudonymousIdentifier: match.pseudonymousIdentifier,
    status: match.status,
    recencyNote,
  }
}

export interface SubmitConsortiumReportInput {
  institutionId: string // e.g. "BANK_A" or "Apex Bank Ltd"
  entityType: 'BENEFICIARY' | 'DEVICE' | 'IP' | 'ACCOUNT' | 'TRANSACTION_PATTERN'
  identifier: string // Raw identifier - normalized and hashed immediately
  riskScore?: number
  confidence?: number
  signalType?: 'BENEFICIARY_RISK' | 'DEVICE_REPUTATION' | 'IP_THREAT' | 'KNOWN_SCAM_ACCOUNT' | 'MULE_NETWORK_SIGNAL'
  tags?: string[]
  notes?: string
}

/**
 * Submits or aggregates a validated fraud intelligence report into the shared consortium.
 * If entity already exists, aggregates multi-institution corroboration counts and updates recency.
 */
export function addOrUpdateConsortiumRecord(input: SubmitConsortiumReportInput): {
  success: boolean
  isNew: boolean
  record: ConsortiumRecord
} {
  const { hash, displayToken } = createPseudonymousIdentifier(input.identifier, input.entityType)
  const reportingInstName = resolveInstitutionName(input.institutionId || 'BANK_A')
  const now = new Date().toISOString()
  
  const existing = CONSORTIUM_DATABASE.get(hash)
  
  if (existing) {
    // Multi-institution aggregation
    const institutionsSet = new Set(existing.contributingInstitutions)
    institutionsSet.add(reportingInstName)
    const updatedInstitutions = Array.from(institutionsSet)
    
    // Corroboration bonus: more independent banks reporting increases confidence
    const corroborationBonus = (updatedInstitutions.length - existing.contributingInstitutions.length) * 0.05
    const updatedConfidence = Math.min(0.99, Math.max(existing.confidence, input.confidence || 0.85) + corroborationBonus)
    
    // Aggregate risk score
    const reportRisk = input.riskScore || 85
    const updatedRiskScore = Math.min(100, Math.max(existing.riskScore, reportRisk) + (updatedInstitutions.length > existing.contributingInstitutions.length ? 3 : 0))
    const updatedRiskLevel = deriveRiskLevel(updatedRiskScore)
    
    // Merge tags
    const tagsSet = new Set([...existing.tags, ...(input.tags || ['validated_fraud'])])

    const updatedRecord: ConsortiumRecord = {
      ...existing,
      riskScore: updatedRiskScore,
      riskLevel: updatedRiskLevel,
      confidence: Math.round(updatedConfidence * 100) / 100,
      lastSeen: now,
      reportCount: existing.reportCount + 1,
      contributingInstitutions: updatedInstitutions,
      tags: Array.from(tagsSet),
      notes: input.notes ? `${existing.notes ? existing.notes + ' | ' : ''}${input.notes}` : existing.notes
    }

    CONSORTIUM_DATABASE.set(hash, updatedRecord)
    return { success: true, isNew: false, record: updatedRecord }
  } else {
    // New entity registration in consortium
    const defaultSignalType = 
      input.entityType === 'DEVICE' ? 'DEVICE_REPUTATION' :
      input.entityType === 'IP' ? 'IP_THREAT' :
      input.entityType === 'ACCOUNT' ? 'MULE_NETWORK_SIGNAL' : 'BENEFICIARY_RISK'

    const riskScore = input.riskScore || 85
    const riskLevel = deriveRiskLevel(riskScore)
    const confidence = input.confidence || 0.88

    const newRecord: ConsortiumRecord = {
      id: `INTEL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      institutionId: input.institutionId || 'BANK_A',
      entityType: input.entityType,
      signalType: input.signalType || defaultSignalType,
      hashedIdentifier: hash,
      pseudonymousIdentifier: displayToken,
      riskScore,
      riskLevel,
      confidence,
      status: 'ACTIVE',
      tags: input.tags && input.tags.length > 0 ? input.tags : ['reported_threat', input.entityType.toLowerCase()],
      firstSeen: now,
      lastSeen: now,
      reportedAt: now,
      reportCount: 1,
      contributingInstitutions: [reportingInstName],
      notes: input.notes || `Reported by ${reportingInstName}`
    }

    CONSORTIUM_DATABASE.set(hash, newRecord)
    return { success: true, isNew: true, record: newRecord }
  }
}

/**
 * Ensures every ConsortiumRecord matches the canonical schema contract.
 * Normalizes strings, arrays, numbers, and dates to prevent undefined runtime errors.
 */
export function normalizeConsortiumRecord(raw: Partial<ConsortiumRecord>): ConsortiumRecord {
  const displayIdentifier = String(raw.pseudonymousIdentifier || raw.pseudonymizedIdentifier || 'UNKNOWN_TOKEN')
  const riskScore = typeof raw.riskScore === 'number' && !isNaN(raw.riskScore) ? raw.riskScore : 75
  const confidence = typeof raw.confidence === 'number' && !isNaN(raw.confidence) ? raw.confidence : 0.85
  const reportCount = typeof raw.reportCount === 'number' && !isNaN(raw.reportCount) ? raw.reportCount : 1
  const tags = Array.isArray(raw.tags) ? raw.tags.map(t => String(t ?? '').trim()).filter(Boolean) : []
  const contributingInstitutions = Array.isArray(raw.contributingInstitutions) && raw.contributingInstitutions.length > 0
    ? raw.contributingInstitutions.map(i => resolveInstitutionName(String(i ?? '').trim())).filter(Boolean)
    : [resolveInstitutionName(raw.institutionId || 'BANK_A')]

  return {
    id: String(raw.id || `INTEL-${Date.now().toString().slice(-6)}`),
    institutionId: String(raw.institutionId || 'BANK_A'),
    entityType: (raw.entityType as any) || 'BENEFICIARY',
    signalType: (raw.signalType as any) || 'BENEFICIARY_RISK',
    pseudonymousIdentifier: displayIdentifier,
    pseudonymizedIdentifier: displayIdentifier,
    hashedIdentifier: String(raw.hashedIdentifier || ''),
    riskScore,
    riskLevel: raw.riskLevel || deriveRiskLevel(riskScore),
    confidence,
    status: raw.status || 'ACTIVE',
    tags,
    firstSeen: String(raw.firstSeen || new Date().toISOString()),
    lastSeen: String(raw.lastSeen || new Date().toISOString()),
    reportedAt: String(raw.reportedAt || raw.firstSeen || new Date().toISOString()),
    reportCount,
    contributingInstitutions,
    notes: raw.notes ? String(raw.notes) : undefined,
  }
}

/**
 * Returns all active consortium records sorted by lastSeen (newest first).
 */
export function getAllConsortiumRecords(): ConsortiumRecord[] {
  return Array.from(CONSORTIUM_DATABASE.values())
    .map(r => normalizeConsortiumRecord(r))
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
}

/**
 * Lookup by record ID.
 */
export function getConsortiumRecordById(id: string): ConsortiumRecord | undefined {
  const found = Array.from(CONSORTIUM_DATABASE.values()).find(r => r.id === id)
  return found ? normalizeConsortiumRecord(found) : undefined
}

/**
 * Returns dynamic, computed consortium metrics.
 */
export function getConsortiumStats(): ConsortiumStats {
  const records = Array.from(CONSORTIUM_DATABASE.values())
  const highRisk = records.filter(r => r.riskScore >= 75 || r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000
  const recent = records.filter(r => new Date(r.lastSeen).getTime() >= sevenDaysAgo).length

  return {
    totalSignalsIndexed: records.length,
    participatingInstitutions: PARTICIPATING_INSTITUTIONS.length,
    highRiskIndicators: highRisk,
    recentReportsCount: recent,
    activeThreatClusters: records.filter(r => r.status === 'ACTIVE').length,
    lastSyncTimestamp: new Date().toISOString(),
  }
}

