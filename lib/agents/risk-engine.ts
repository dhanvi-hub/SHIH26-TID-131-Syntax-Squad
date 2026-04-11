import type { DetectiveResult, ResearchResult, RiskResult } from '@/lib/types'

export function riskEngine(
  detectiveResult: DetectiveResult,
  researchResult: ResearchResult,
  forceStatus?: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
): RiskResult {
  // If we have a forced status (from transaction type), use it
  if (forceStatus) {
    let riskScore: number
    switch (forceStatus) {
      case 'SAFE':
        riskScore = Math.floor(Math.random() * 25) + 5 // 5-29
        break
      case 'SUSPICIOUS':
        riskScore = Math.floor(Math.random() * 25) + 30 // 30-54
        break
      case 'FRAUD':
        riskScore = Math.floor(Math.random() * 35) + 65 // 65-100
        break
    }
    return { riskScore, status: forceStatus }
  }

  // Combine scores from both agents
  const combinedScore = detectiveResult.riskScore + researchResult.additionalRiskScore

  // Apply normalization and weighting
  const weightedScore = Math.min(
    detectiveResult.riskScore * 0.6 + (detectiveResult.riskScore + researchResult.additionalRiskScore) * 0.4,
    100
  )

  // Determine final risk score
  const finalScore = Math.round(Math.max(combinedScore, weightedScore))

  // Classify based on score - adjusted thresholds for 75/20/5 distribution
  let status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  
  if (finalScore >= 55) {
    status = 'FRAUD'
  } else if (finalScore >= 30) {
    status = 'SUSPICIOUS'
  } else {
    status = 'SAFE'
  }

  // Apply additional rules for automatic fraud classification
  if (
    detectiveResult.ruleFlags.includes('VERY_HIGH_AMOUNT') &&
    detectiveResult.ruleFlags.includes('SUSPICIOUS_LOCATION')
  ) {
    status = 'FRAUD'
  }

  if (
    detectiveResult.ruleFlags.includes('RAPID_TRANSACTIONS') &&
    detectiveResult.ruleFlags.includes('RAPID_LOCATION_CHANGE')
  ) {
    status = 'FRAUD'
  }

  return {
    riskScore: finalScore,
    status,
  }
}
