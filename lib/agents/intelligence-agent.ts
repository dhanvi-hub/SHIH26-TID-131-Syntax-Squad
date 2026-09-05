/**
 * Intelligence Agent
 * Performs privacy-preserving cross-institution consortium checks.
 * Hashes incoming transaction identifiers before querying the shared intelligence repository.
 */

import type { Transaction, CrossInstitutionIntelligenceResult, IntelligenceSignalMatch } from '@/lib/types'
import { hashIdentifier } from '@/lib/intelligence/privacy-engine'
import { queryConsortiumByHash, PARTICIPATING_INSTITUTIONS } from '@/lib/intelligence/cross-institution-db'

export function intelligenceAgent(transaction: Transaction): CrossInstitutionIntelligenceResult {
  const matches: IntelligenceSignalMatch[] = []

  // 1. Hash & Check Beneficiary ID
  if (transaction.beneficiary_id) {
    const benHash = hashIdentifier('beneficiary', transaction.beneficiary_id)
    const benMatch = queryConsortiumByHash(benHash)
    if (benMatch) {
      matches.push(benMatch)
    }
  }

  // 2. Hash & Check Device Fingerprint
  if (transaction.device_fingerprint) {
    const devHash = hashIdentifier('device_fingerprint', transaction.device_fingerprint)
    const devMatch = queryConsortiumByHash(devHash)
    if (devMatch) {
      matches.push(devMatch)
    }
  }

  // 3. Hash & Check IP Address
  if (transaction.ip) {
    const ipHash = hashIdentifier('ip', transaction.ip)
    const ipMatch = queryConsortiumByHash(ipHash)
    if (ipMatch) {
      matches.push(ipMatch)
    }
  }

  // 4. Hash & Check User Account ID
  if (transaction.user_id) {
    const userHash = hashIdentifier('user', transaction.user_id)
    const userMatch = queryConsortiumByHash(userHash)
    if (userMatch) {
      matches.push(userMatch)
    }
  }

  // If no consortium matches found, return neutral result
  if (matches.length === 0) {
    return {
      matched: false,
      riskScore: 0,
      matches: [],
      summary: 'No adverse cross-institution intelligence matches found in consortium network.',
      participatingInstitutionsCount: PARTICIPATING_INSTITUTIONS.length,
    }
  }

  // Calculate intelligence risk score based on severity, institution count, and confidence
  let maxRisk = 0
  matches.forEach((m) => {
    let baseScore = 0
    switch (m.riskLevel) {
      case 'CRITICAL':
        baseScore = 95
        break
      case 'HIGH':
        baseScore = 80
        break
      case 'MEDIUM':
        baseScore = 55
        break
      case 'LOW':
        baseScore = 30
        break
    }
    // Weight by confidence and multiple institution corroboration
    const corroborationBonus = Math.min((m.reportingInstitutionsCount - 1) * 5, 10)
    const itemScore = Math.round((baseScore * m.confidence) + corroborationBonus)
    if (itemScore > maxRisk) {
      maxRisk = itemScore
    }
  })

  // Format concise privacy-preserving summary
  const topMatch = matches[0]
  const signalLabels: Record<string, string> = {
    BENEFICIARY_RISK: 'Beneficiary account flagged',
    KNOWN_SCAM_ACCOUNT: 'Known scam beneficiary detected',
    DEVICE_REPUTATION: 'Compromised device fingerprint matched',
    IP_THREAT: 'Threat-actor IP address identified',
    MULE_NETWORK_SIGNAL: 'Mule network syndicate entity matched',
  }

  const label = signalLabels[topMatch.signalType] || 'Cross-bank threat entity matched'
  const summary = `Privacy consortium match: ${label} (${topMatch.riskLevel} risk, ${(topMatch.confidence * 100).toFixed(0)}% confidence) reported across ${topMatch.reportingInstitutionsCount} participating institutions.`

  return {
    matched: true,
    riskScore: Math.min(100, maxRisk),
    matches,
    summary,
    participatingInstitutionsCount: PARTICIPATING_INSTITUTIONS.length,
  }
}
