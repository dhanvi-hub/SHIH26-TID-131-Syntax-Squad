import type { 
  DetectiveResult, 
  ResearchResult, 
  RiskResult, 
  Transaction, 
  ProcessedTransaction, 
  TelecomResult,
  CrossInstitutionIntelligenceResult,
  SocialEngineeringResult,
  MultiSignalEscalation,
  SignalBreakdown
} from '@/lib/types'
import { extractFeatures } from './feature-engine'
import { ensemblePredict, getStatusFromMLPrediction, type MLPrediction } from './ml-ensemble'
import { predictRealML } from './ml-bridge'

export interface EnhancedRiskResult extends RiskResult {
  mlPrediction?: MLPrediction
  modelScores?: {
    isolationForest: number
    randomForest: number
    xgboost: number
    ensemble: number
  }
}

export function riskEngine(
  detectiveResult: DetectiveResult,
  researchResult: ResearchResult,
  telecomResult?: TelecomResult,
  forceStatus?: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
): RiskResult {
  if (forceStatus) {
    let riskScore: number
    switch (forceStatus) {
      case 'SAFE':
        riskScore = Math.floor(Math.random() * 25) + 5
        break
      case 'SUSPICIOUS':
        riskScore = Math.floor(Math.random() * 25) + 30
        break
      case 'FRAUD':
        riskScore = Math.floor(Math.random() * 35) + 65
        break
    }
    return { riskScore, status: forceStatus }
  }

  const telecomScore = telecomResult?.riskScore || 0
  const combinedScore = detectiveResult.riskScore + researchResult.additionalRiskScore + telecomScore

  const weightedScore = Math.min(
    detectiveResult.riskScore * 0.4 + (detectiveResult.riskScore + researchResult.additionalRiskScore) * 0.3 + telecomScore * 0.3,
    100
  )

  const finalScore = Math.round(Math.max(combinedScore, weightedScore))

  let status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  if (finalScore >= 55 || telecomScore >= 50) {
    status = 'FRAUD'
  } else if (finalScore >= 30 || telecomScore >= 30) {
    status = 'SUSPICIOUS'
  } else {
    status = 'SAFE'
  }

  if (
    detectiveResult.ruleFlags.includes('VERY_HIGH_AMOUNT') &&
    detectiveResult.ruleFlags.includes('SUSPICIOUS_LOCATION')
  ) {
    status = 'FRAUD'
  }

  return {
    riskScore: Math.min(100, finalScore),
    status,
  }
}

/**
 * Enhanced Risk Engine with Multi-Signal Fusion and Resilient Fallback Escalation
 * Evaluates 6 independent risk dimensions:
 * 1. mlRisk (Stacking ML Ensemble: IF + RF + XGBoost)
 * 2. ruleRisk (Detective Agent - active bank rules only)
 * 3. behaviouralRisk (Research Agent - user transaction deviation)
 * 4. networkRisk (Research Agent - entity, device & location velocity graph)
 * 5. externalIntelligenceRisk (Intelligence Agent - privacy-preserving consortium)
 * 6. socialEngineeringRisk (Social Engineering Agent / Telephony metadata)
 */
export function enhancedRiskEngine(
  transaction: Transaction,
  detectiveResult: DetectiveResult,
  researchResult: ResearchResult,
  allTransactions: ProcessedTransaction[],
  intelligenceResult?: CrossInstitutionIntelligenceResult,
  socialEngineeringResult?: SocialEngineeringResult,
  forceStatus?: 'SAFE' | 'SUSPICIOUS' | 'FRAUD',
  telecomResult?: TelecomResult
): EnhancedRiskResult {
  if (forceStatus) {
    let riskScore: number
    switch (forceStatus) {
      case 'SAFE':
        riskScore = Math.floor(Math.random() * 25) + 5
        break
      case 'SUSPICIOUS':
        riskScore = Math.floor(Math.random() * 25) + 30
        break
      case 'FRAUD':
        riskScore = Math.floor(Math.random() * 35) + 65
        break
    }
    const signals: SignalBreakdown = {
      mlRisk: forceStatus === 'SAFE' ? 10 : forceStatus === 'SUSPICIOUS' ? 40 : 80,
      ruleRisk: 0,
      behaviouralRisk: 0,
      networkRisk: 0,
      externalIntelligenceRisk: 0,
      socialEngineeringRisk: 0,
      finalRisk: riskScore
    }
    return { 
      riskScore, 
      status: forceStatus,
      mlRisk: signals.mlRisk,
      ruleRisk: 0,
      behaviouralRisk: 0,
      networkRisk: 0,
      externalIntelligenceRisk: 0,
      socialEngineeringRisk: 0,
      finalRisk: riskScore,
      signals
    }
  }

  // 1. Supervised Machine Learning Model Risk (Data-Driven Random Forest)
  const realMLRes = predictRealML(transaction, allTransactions)
  const mlRisk = realMLRes.ml_risk_score

  // 2. Rule Risk (strictly evaluated active rules)
  const ruleRisk = Math.min(100, detectiveResult.riskScore)

  // 3. Behavioural Risk (spending deviation vs user baseline)
  let behaviouralRisk = 0
  if (researchResult.averageAmount > 0) {
    const ratio = transaction.amount / researchResult.averageAmount
    if (ratio > 10) behaviouralRisk = 80
    else if (ratio > 5) behaviouralRisk = 55
    else if (ratio > 3) behaviouralRisk = 35
    else if (ratio > 2) behaviouralRisk = 20
  } else if (allTransactions.filter(t => t.user_id === transaction.user_id).length === 0) {
    behaviouralRisk = 25
  }

  // 4. Network / Graph Risk
  const networkRisk = Math.min(100, Math.round(researchResult.additionalRiskScore * 2))

  // 5. External Consortium Intelligence Risk
  const externalIntelligenceRisk = intelligenceResult?.riskScore || 0

  // 6. Social Engineering / Scam Context Risk
  const socialEngBase = socialEngineeringResult?.riskScore || 0
  const telecomBase = telecomResult?.riskScore || 0
  const socialEngineeringRisk = Math.max(socialEngBase, telecomBase)

  // ── Baseline Multi-Signal Aggregation ──
  let aggregatedScore = Math.round(
    (mlRisk * 0.35) +
    (ruleRisk * 0.25) +
    (externalIntelligenceRisk * 0.15) +
    (socialEngineeringRisk * 0.15) +
    (networkRisk * 0.05) +
    (behaviouralRisk * 0.05)
  )

  // ── Multi-Signal Fallback & Escalation Safety Net ──
  const elevatedSignals: { name: string; score: number; label: string }[] = []
  if (externalIntelligenceRisk >= 50) {
    elevatedSignals.push({ name: 'External Intelligence', score: externalIntelligenceRisk, label: 'Cross-Institution Consortium Threat' })
  }
  if (socialEngineeringRisk >= 50) {
    elevatedSignals.push({ name: 'Social Engineering', score: socialEngineeringRisk, label: 'High-Pressure Scam Context' })
  }
  if (ruleRisk >= 50) {
    elevatedSignals.push({ name: 'Active Rules', score: ruleRisk, label: 'Severe Rule Violation' })
  }
  if (networkRisk >= 50) {
    elevatedSignals.push({ name: 'Network Graph', score: networkRisk, label: 'High Entity/Velocity Anomaly' })
  }
  if (behaviouralRisk >= 50) {
    elevatedSignals.push({ name: 'Behavioural Baseline', score: behaviouralRisk, label: 'Extreme Profile Deviation' })
  }

  let multiSignalEscalation: MultiSignalEscalation = {
    enabled: false,
    reason: '',
    contributingSignals: [],
  }

  if (mlRisk <= 38 && elevatedSignals.length >= 2) {
    const avgElevated = elevatedSignals.reduce((sum, s) => sum + s.score, 0) / elevatedSignals.length
    const maxElevated = Math.max(...elevatedSignals.map(s => s.score))
    const escalatedScore = Math.min(95, Math.round(Math.max(aggregatedScore, (avgElevated * 0.6) + (maxElevated * 0.3) + (mlRisk * 0.1))))

    multiSignalEscalation = {
      enabled: true,
      reason: "Independent signals indicate elevated risk despite the model's low-risk prediction.",
      contributingSignals: elevatedSignals.map(s => `${s.name} (${s.score}/100 - ${s.label})`),
      originalMLScore: mlRisk,
      escalatedScore,
    }

    aggregatedScore = escalatedScore
  }

  const rawFinalRisk = Math.min(100, Math.max(0, aggregatedScore))

  // ── Status Determination ──
  const mlStatus = realMLRes.ml_classification
  let status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  let computedRisk = rawFinalRisk

  if (
    detectiveResult.ruleFlags.includes('KNOWN_SCAM_BENEFICIARY') ||
    detectiveResult.ruleFlags.includes('FAKE_KYC_PRESSURE') ||
    detectiveResult.ruleFlags.includes('SMS_KYC_PHISHING_ATTEMPT') ||
    detectiveResult.ruleFlags.includes('SMS_ELECTRICITY_SCAM') ||
    detectiveResult.ruleFlags.includes('VISHING_PLUS_SMS_CORRELATION') ||
    (detectiveResult.ruleFlags.includes('VERY_HIGH_AMOUNT') && detectiveResult.ruleFlags.includes('SUSPICIOUS_LOCATION'))
  ) {
    status = 'FRAUD'
    computedRisk = Math.max(computedRisk, 90)
  } else if (computedRisk >= 60 || mlStatus === 'FRAUD' || (multiSignalEscalation.enabled && computedRisk >= 60)) {
    status = 'FRAUD'
    computedRisk = Math.max(computedRisk, 85)
  } else if (computedRisk >= 30 || mlStatus === 'SUSPICIOUS' || multiSignalEscalation.enabled) {
    status = 'SUSPICIOUS'
    computedRisk = Math.max(computedRisk, 45)
  } else {
    status = 'SAFE'
  }

  const signals: SignalBreakdown = {
    mlRisk,
    ruleRisk,
    behaviouralRisk,
    networkRisk,
    externalIntelligenceRisk,
    socialEngineeringRisk,
    finalRisk: computedRisk,
  }

  return {
    riskScore: computedRisk,
    status,
    mlRisk,
    ruleRisk,
    behaviouralRisk,
    networkRisk,
    externalIntelligenceRisk,
    socialEngineeringRisk,
    finalRisk: computedRisk,
    multiSignalEscalation,
    signals,
  }
}
