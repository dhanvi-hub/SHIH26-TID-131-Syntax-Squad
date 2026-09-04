import type { DetectiveResult, ResearchResult, RiskResult, Transaction, ProcessedTransaction, TelecomResult } from '@/lib/types'
import { extractFeatures } from './feature-engine'
import { ensemblePredict, getStatusFromMLPrediction, type MLPrediction } from './ml-ensemble'

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

  if (telecomResult?.ruleFlags.includes('VISHING_PLUS_SMS_CORRELATION')) {
    status = 'FRAUD'
  }

  return {
    riskScore: Math.min(100, finalScore),
    status,
  }
}

export function enhancedRiskEngine(
  transaction: Transaction,
  detectiveResult: DetectiveResult,
  researchResult: ResearchResult,
  telecomResult: TelecomResult | undefined,
  allTransactions: ProcessedTransaction[],
  forceStatus?: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
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
    return { riskScore, status: forceStatus }
  }

  const features = extractFeatures(transaction, allTransactions)
  const mlPrediction = ensemblePredict(features)
  const mlStatus = getStatusFromMLPrediction(mlPrediction)
  
  const ruleScore = detectiveResult.riskScore + researchResult.additionalRiskScore
  const telecomScore = telecomResult?.riskScore || 0
  const mlScore = mlPrediction.ensemble.finalScore
  
  // Weighted combination: ML 50%, Rules 30%, Telecom 20%
  const combinedScore = Math.round((mlScore * 0.5) + (Math.min(ruleScore, 100) * 0.3) + (telecomScore * 0.2))
  
  let status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  
  if (mlStatus === 'FRAUD' || combinedScore >= 55 || telecomScore >= 55) {
    status = 'FRAUD'
  } else if (mlStatus === 'SUSPICIOUS' || combinedScore >= 30 || telecomScore >= 30) {
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
  
  if (telecomResult?.ruleFlags.includes('VISHING_PLUS_SMS_CORRELATION')) {
    status = 'FRAUD'
  }

  return {
    riskScore: Math.min(100, Math.max(combinedScore, telecomScore)),
    status,
    mlPrediction,
    modelScores: {
      isolationForest: mlPrediction.isolationForest.score,
      randomForest: mlPrediction.randomForest.score,
      xgboost: mlPrediction.metaLearner.score,
      ensemble: mlPrediction.ensemble.finalScore,
    }
  }
}
