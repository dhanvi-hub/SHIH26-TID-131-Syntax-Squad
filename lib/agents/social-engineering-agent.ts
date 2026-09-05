/**
 * Social Engineering & Scam Context Agent
 * Evaluates simulated communication metadata (interaction timing, caller reputation,
 * and pressure signatures) to detect social engineering manipulation.
 * 
 * IMPORTANT: This module processes purely metadata/simulation attributes.
 * It does NOT record, listen to, or process actual phone calls or microphone audio.
 */

import type { Transaction, SocialEngineeringResult } from '@/lib/types'

export function socialEngineeringAgent(transaction: Transaction): SocialEngineeringResult {
  const context = transaction.socialEngineering

  // If no interaction context provided or no recent call, return neutral response
  if (!context || (!context.recent_call && (!context.scam_pattern || context.scam_pattern === 'none'))) {
    return {
      detected: false,
      riskScore: 0,
      detectedPatterns: [],
      explanation: 'No recent suspicious interaction or social engineering context reported.',
      contributingSignals: [],
    }
  }

  const detectedPatterns: string[] = []
  const contributingSignals: string[] = []
  let riskScore = 0

  // 1. Caller Trust & Identity Anomaly
  if (context.recent_call && context.caller_known === false) {
    contributingSignals.push('Unknown / Unregistered Caller')
    riskScore += 20
  }

  // 2. Caller Threat Reputation Score
  if (context.caller_risk_score && context.caller_risk_score > 0) {
    if (context.caller_risk_score >= 75) {
      contributingSignals.push(`High-Risk Inbound Number (Score: ${context.caller_risk_score}/100)`)
      riskScore += 30
    } else if (context.caller_risk_score >= 40) {
      contributingSignals.push(`Moderate-Risk Caller Number (Score: ${context.caller_risk_score}/100)`)
      riskScore += 15
    }
  }

  // 3. Proximity to Transaction (Time Delta)
  if (context.recent_call && typeof context.time_since_call === 'number') {
    if (context.time_since_call <= 5) {
      contributingSignals.push(`Immediate Execution: Transfer initiated ${context.time_since_call}m after call`)
      riskScore += 25
    } else if (context.time_since_call <= 20) {
      contributingSignals.push(`Near-Immediate Execution: Transfer initiated ${context.time_since_call}m after call`)
      riskScore += 15
    }
  }

  // 4. Call Duration (Sustained Coercion Window)
  if (context.call_duration && context.call_duration > 180) { // > 3 minutes
    const minutes = Math.floor(context.call_duration / 60)
    contributingSignals.push(`Sustained Interaction: Call lasted ${minutes} minutes`)
    riskScore += 10
  }

  // 5. Explicit Scam Manipulation Patterns
  if (context.scam_pattern && context.scam_pattern !== 'none') {
    switch (context.scam_pattern) {
      case 'payment_urgency':
        detectedPatterns.push('PAYMENT_URGENCY')
        contributingSignals.push('High-pressure payment urgency demand detected')
        riskScore += 35
        break
      case 'account_closure_threat':
        detectedPatterns.push('ACCOUNT_CLOSURE_THREAT')
        contributingSignals.push('Imminent account freeze / closure threat pattern')
        riskScore += 40
        break
      case 'fake_kyc_request':
        detectedPatterns.push('FAKE_KYC_REQUEST')
        contributingSignals.push('Coercive transfer under guise of mandatory KYC update')
        riskScore += 35
        break
      case 'otp_payment_request':
        detectedPatterns.push('OTP_PAYMENT_REQUEST')
        contributingSignals.push('Urgent authorization / OTP solicitation signature')
        riskScore += 40
        break
      case 'lottery_prize':
        detectedPatterns.push('ADVANCE_FEE_SCAM')
        contributingSignals.push('Advance fee prize / lottery reward pattern')
        riskScore += 30
        break
    }
  }

  const finalScore = Math.min(100, riskScore)
  const isDetected = finalScore >= 35 || detectedPatterns.length > 0

  let explanation = 'No significant social engineering manipulation patterns detected.'
  if (isDetected) {
    const patternSummary = detectedPatterns.length > 0
      ? `Pattern(s): ${detectedPatterns.join(', ')}.`
      : 'Suspicious timing and caller attributes detected.'
    explanation = `Social engineering risk detected (Score: ${finalScore}/100). ${patternSummary} Transfer occurred in close temporal proximity to an unverified high-risk interaction.`
  }

  return {
    detected: isDetected,
    riskScore: finalScore,
    detectedPatterns,
    explanation,
    contributingSignals,
  }
}
