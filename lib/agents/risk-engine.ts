import type { DetectiveResult, ResearchResult, RiskResult } from '@/lib/types'

export function riskEngine(
  detectiveResult: DetectiveResult,
  researchResult: ResearchResult
): RiskResult {
  // Combine scores from both agents
  const combinedScore = detectiveResult.riskScore + researchResult.additionalRiskScore

  // Apply normalization and weighting
  // Detective findings are weighted slightly more (60%)
  // Research findings provide context (40%)
  const weightedScore = Math.min(
    detectiveResult.riskScore * 0.6 + (detectiveResult.riskScore + researchResult.additionalRiskScore) * 0.4,
    100
  )

  // Determine final risk score
  const finalScore = Math.round(Math.max(combinedScore, weightedScore))

  // Classify based on score
  let status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  
  if (finalScore >= 60) {
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
