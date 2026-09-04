/**
 * ML Ensemble Fraud Detection
 * Adapted from Smart-Horizon ml-service
 * 
 * Three-layer stacking ensemble:
 * Layer 1: Isolation Forest (anomaly detection) + Random Forest (classification)
 * Layer 2: XGBoost-style meta-learner (simulated in TypeScript)
 * 
 * Since we can't run actual sklearn/xgboost in the browser,
 * this implements the logic using weighted scoring algorithms
 * that mimic the ensemble behavior.
 */

import type { FeatureSet } from './feature-engine'

export interface MLPrediction {
  isolationForest: {
    score: number
    prediction: 'anomaly' | 'normal'
  }
  randomForest: {
    score: number
    fraudProbability: number
  }
  metaLearner: {
    score: number
    fraudProbability: number
    model: string
  }
  ensemble: {
    finalScore: number
    prediction: 'fraud' | 'normal'
    confidence: number
  }
  featureImportances: Record<string, number>
}

// Feature weights learned from fraud patterns (mimics Random Forest feature importances)
const FEATURE_WEIGHTS: Record<string, number> = {
  amountLog: 0.08,
  amountZScore: 0.12,
  hourOfDay: 0.03,
  hourSin: 0.02,
  hourCos: 0.02,
  isWeekend: 0.02,
  isNight: 0.06,
  stateRiskScore: 0.08,
  isSuspiciousLocation: 0.15,
  isCrossBorder: 0.04,
  txTypeRisk: 0.03,
  amountToBalance: 0.10,
  benfordDev: 0.04,
  isRound: 0.03,
  senderRisk: 0.08,
  kycRisk: 0.02,
  velocity1h: 0.07,
  velocity24h: 0.05,
  amountVsAvg: 0.09,
  deviceConsistency: 0.05,
  ipRisk: 0.08,
  travelSpeedFlag: 0.12,
}

/**
 * Simulated Isolation Forest
 * Detects anomalies by measuring how "isolated" a transaction is
 */
function isolationForestPredict(features: FeatureSet): { score: number; prediction: 'anomaly' | 'normal' } {
  // Calculate anomaly score based on deviation from normal patterns
  let anomalyScore = 0
  let normalScore = 0

  // High amount is anomalous
  if (features.amountZScore > 2) anomalyScore += 20
  else if (features.amountZScore > 1) anomalyScore += 10
  else normalScore += 15

  // Night transactions are more anomalous
  if (features.isNight) anomalyScore += 15
  else normalScore += 10

  // Suspicious location is highly anomalous
  if (features.isSuspiciousLocation) anomalyScore += 30
  else normalScore += 20

  // High velocity is anomalous
  if (features.velocity1h > 0.6) anomalyScore += 20
  else if (features.velocity24h > 0.7) anomalyScore += 10
  else normalScore += 15

  // High amount vs average is anomalous
  if (features.amountVsAvg > 0.5) anomalyScore += 15
  else normalScore += 10

  // Device inconsistency is anomalous
  if (features.deviceConsistency > 0.5) anomalyScore += 10
  else normalScore += 5

  // Travel speed flag is highly anomalous
  if (features.travelSpeedFlag > 0) anomalyScore += 25
  else normalScore += 15

  // High IP risk is anomalous
  if (features.ipRisk > 0.6) anomalyScore += 15
  else normalScore += 10

  // Round amounts can be suspicious
  if (features.isRound && features.amountZScore > 1) anomalyScore += 10
  else normalScore += 5

  // Normalize score to 0-100
  const totalPossible = 100 + 105 // max anomaly + max normal
  const normalizedScore = Math.round((anomalyScore / totalPossible) * 100)
  
  return {
    score: Math.min(100, normalizedScore * 1.5), // Amplify for sensitivity
    prediction: normalizedScore > 30 ? 'anomaly' : 'normal'
  }
}

/**
 * Simulated Random Forest
 * Classification based on weighted feature combinations
 */
function randomForestPredict(features: FeatureSet): { score: number; fraudProbability: number } {
  let fraudScore = 0
  
  // Apply weighted features
  fraudScore += features.amountZScore * 15 * FEATURE_WEIGHTS.amountZScore
  fraudScore += features.isNight * 25 * FEATURE_WEIGHTS.isNight
  fraudScore += features.isSuspiciousLocation * 40 * FEATURE_WEIGHTS.isSuspiciousLocation
  fraudScore += features.stateRiskScore * 30 * FEATURE_WEIGHTS.stateRiskScore
  fraudScore += features.velocity1h * 35 * FEATURE_WEIGHTS.velocity1h
  fraudScore += features.velocity24h * 20 * FEATURE_WEIGHTS.velocity24h
  fraudScore += features.amountVsAvg * 30 * FEATURE_WEIGHTS.amountVsAvg
  fraudScore += features.deviceConsistency * 25 * FEATURE_WEIGHTS.deviceConsistency
  fraudScore += features.ipRisk * 35 * FEATURE_WEIGHTS.ipRisk
  fraudScore += features.travelSpeedFlag * 50 * FEATURE_WEIGHTS.travelSpeedFlag
  fraudScore += features.senderRisk * 30 * FEATURE_WEIGHTS.senderRisk
  fraudScore += features.amountToBalance * 25 * FEATURE_WEIGHTS.amountToBalance
  fraudScore += features.isRound * 10 * FEATURE_WEIGHTS.isRound
  fraudScore += features.benfordDev * 15 * FEATURE_WEIGHTS.benfordDev
  
  // Add base noise for realism
  fraudScore += Math.random() * 5

  // Normalize to 0-100
  const normalizedScore = Math.min(100, Math.max(0, fraudScore * 2.5))
  
  return {
    score: Math.round(normalizedScore),
    fraudProbability: normalizedScore / 100
  }
}

/**
 * Simulated XGBoost Meta-Learner
 * Combines predictions from base models with gradient boosting logic
 */
function xgboostMetaLearner(
  ifScore: number,
  rfScore: number,
  features: FeatureSet
): { score: number; fraudProbability: number } {
  // XGBoost-style combination with learned weights
  let metaScore = 0
  
  // Base model contributions
  metaScore += ifScore * 0.3
  metaScore += rfScore * 0.4
  
  // Direct feature contributions (boosting residuals)
  if (features.isSuspiciousLocation) metaScore += 15
  if (features.travelSpeedFlag > 0) metaScore += 12
  if (features.amountZScore > 2) metaScore += 8
  if (features.velocity1h > 0.5 && features.amountVsAvg > 0.3) metaScore += 10 // Interaction
  if (features.isNight && features.stateRiskScore > 0.5) metaScore += 8 // Interaction
  if (features.senderRisk > 0.5 && features.amountToBalance > 0.5) metaScore += 10 // Interaction

  // Boosting adjustment for edge cases
  if (metaScore > 60 && features.ipRisk > 0.6) metaScore += 5
  if (metaScore > 70 && features.deviceConsistency > 0.5) metaScore += 3

  // Normalize
  const normalizedScore = Math.min(100, Math.max(0, metaScore))
  
  return {
    score: Math.round(normalizedScore),
    fraudProbability: normalizedScore / 100
  }
}

/**
 * Run the full ensemble prediction
 */
export function ensemblePredict(features: FeatureSet): MLPrediction {
  // Layer 1: Base model predictions
  const ifResult = isolationForestPredict(features)
  const rfResult = randomForestPredict(features)
  
  // Layer 2: Meta-learner
  const xgbResult = xgboostMetaLearner(ifResult.score, rfResult.score, features)
  
  // Final ensemble score (weighted combination)
  // Meta-learner 50%, RF 30%, IF 20%
  const finalScore = Math.round(
    (xgbResult.score * 0.50) + (rfResult.score * 0.30) + (ifResult.score * 0.20)
  )
  
  // Confidence based on model agreement
  const scores = [ifResult.score, rfResult.score, xgbResult.score]
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length
  const confidence = Math.max(0.3, 1 - (Math.sqrt(variance) / 50)) // Higher variance = lower confidence
  
  return {
    isolationForest: {
      score: ifResult.score,
      prediction: ifResult.prediction
    },
    randomForest: {
      score: rfResult.score,
      fraudProbability: rfResult.fraudProbability
    },
    metaLearner: {
      score: xgbResult.score,
      fraudProbability: xgbResult.fraudProbability,
      model: 'XGBoost-Simulated'
    },
    ensemble: {
      finalScore: Math.min(100, Math.max(0, finalScore)),
      prediction: finalScore >= 45 ? 'fraud' : 'normal',
      confidence: Math.round(confidence * 1000) / 1000
    },
    featureImportances: FEATURE_WEIGHTS
  }
}

/**
 * Determine final status based on ensemble prediction
 */
export function getStatusFromMLPrediction(prediction: MLPrediction): 'SAFE' | 'SUSPICIOUS' | 'FRAUD' {
  const score = prediction.ensemble.finalScore
  
  if (score >= 65) return 'FRAUD'
  if (score >= 35) return 'SUSPICIOUS'
  return 'SAFE'
}
