import type { 
  Transaction, 
  DetectiveResult, 
  ResearchResult, 
  EnhancedRiskResult,
  CrossInstitutionIntelligenceResult,
  SocialEngineeringResult
} from '@/lib/types'

const FLAG_DESCRIPTIONS: Record<string, string> = {
  VERY_HIGH_AMOUNT: 'transaction amount is significantly higher than normal limits',
  HIGH_AMOUNT: 'transaction amount exceeds typical thresholds',
  RAPID_TRANSACTIONS: 'multiple transactions detected in a very short time window',
  MULTIPLE_RECENT_TRANSACTIONS: 'several recent transactions from this user',
  SUSPICIOUS_LOCATION: 'transaction originated from a high-risk location',
  RAPID_LOCATION_CHANGE: 'location changed impossibly fast from previous transaction',
  LOCATION_CHANGE: 'transaction location differs from usual patterns',
  NEW_DEVICE: 'transaction made from an unrecognized device',
  DEVICE_CHANGE: 'device hardware fingerprint changed from established profile',
  IP_CHANGE: 'IP address changed from previous transaction',
  LATE_NIGHT: 'transaction occurred during late night hours',
  VELOCITY_ANOMALY: 'transaction velocity pattern is abnormal',
  UNUSUAL_PATTERN: 'unusual transaction pattern detected',
  KNOWN_SCAM_BENEFICIARY: 'beneficiary matched known scam/mule account in cross-institution intelligence',
  CROSS_INSTITUTION_DEVICE_MATCH: 'hardware fingerprint flagged for fraudulent activity across participating banks',
  SOCIAL_ENG_URGENCY: 'transaction initiated shortly after a high-pressure caller interaction',
  FAKE_KYC_PRESSURE: 'coercive interaction signature matching fake KYC/account closure scam',
}

export function reportingAgent(
  transaction: Transaction,
  detectiveResult: DetectiveResult,
  researchResult: ResearchResult,
  riskResult: EnhancedRiskResult,
  intelligenceResult?: CrossInstitutionIntelligenceResult,
  socialEngineeringResult?: SocialEngineeringResult
): string {
  const parts: string[] = []

  // 1. Opening based on status & escalation
  if (riskResult.multiSignalEscalation?.enabled) {
    parts.push(`ESCALATION ALERT: Transaction escalated to ${riskResult.status} (Score: ${riskResult.riskScore}/100).`)
    parts.push(`Reason: Independent signals indicate elevated risk despite the model's low-risk prediction.`)
  } else if (riskResult.status === 'FRAUD') {
    parts.push(`ALERT: High-risk transaction detected for user ${transaction.user_id} (Score: ${riskResult.riskScore}/100).`)
  } else if (riskResult.status === 'SUSPICIOUS') {
    parts.push(`WARNING: Suspicious activity detected for user ${transaction.user_id} (Score: ${riskResult.riskScore}/100).`)
  } else {
    parts.push(`Transaction for user ${transaction.user_id} appears normal (Score: ${riskResult.riskScore}/100).`)
  }

  // 2. Add transaction context
  parts.push(
    `Transaction of \u20B9${transaction.amount.toLocaleString('en-IN')} from ${transaction.location} via ${transaction.device}.`
  )

  // 3. Explain active rule flags
  if (detectiveResult.ruleFlags.length > 0) {
    const flagExplanations = detectiveResult.ruleFlags
      .map((flag) => FLAG_DESCRIPTIONS[flag] || flag.toLowerCase().replace(/_/g, ' '))
      .join('; ')
    parts.push(`Active rules triggered: ${flagExplanations}.`)
  }

  // 4. External Intelligence findings
  if (intelligenceResult?.matched) {
    parts.push(`Consortium Intelligence: ${intelligenceResult.summary}`)
  }

  // 5. Social Engineering findings
  if (socialEngineeringResult?.detected) {
    parts.push(`Scam Context: ${socialEngineeringResult.explanation}`)
  }

  // 6. Behavioral research findings
  if (researchResult.findings.length > 0) {
    parts.push(`Behavioral analysis: ${researchResult.findings.join('. ')}.`)
  }

  // 7. Comparison context
  if (researchResult.averageAmount > 0) {
    const ratio = (transaction.amount / researchResult.averageAmount).toFixed(1)
    if (parseFloat(ratio) > 2) {
      parts.push(
        `This amount is ${ratio}x the user's average transaction of \u20B9${researchResult.averageAmount.toLocaleString('en-IN')}.`
      )
    }
  }

  // 8. Closing recommendation
  if (riskResult.status === 'FRAUD') {
    parts.push('Recommended action: Block transaction immediately, freeze destination routing, and contact customer.')
  } else if (riskResult.status === 'SUSPICIOUS') {
    parts.push('Recommended action: Place on hold for step-up multi-factor verification and analyst review.')
  } else {
    parts.push('Recommended action: No immediate intervention required.')
  }

  return parts.join(' ')
}

