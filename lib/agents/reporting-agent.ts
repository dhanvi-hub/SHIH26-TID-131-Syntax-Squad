import type { Transaction, DetectiveResult, ResearchResult, RiskResult, TelecomResult } from '@/lib/types'

const FLAG_DESCRIPTIONS: Record<string, string> = {
  VERY_HIGH_AMOUNT: 'transaction amount is significantly higher than normal limits',
  HIGH_AMOUNT: 'transaction amount exceeds typical thresholds',
  RAPID_TRANSACTIONS: 'multiple transactions detected in a very short time window',
  MULTIPLE_RECENT_TRANSACTIONS: 'several recent transactions from this user',
  SUSPICIOUS_LOCATION: 'transaction originated from a high-risk location',
  RAPID_LOCATION_CHANGE: 'location changed impossibly fast from previous transaction',
  LOCATION_CHANGE: 'transaction location differs from usual patterns',
  NEW_DEVICE: 'transaction made from an unrecognized device',
  IP_CHANGE: 'IP address changed from previous transaction',
  ACTIVE_VOICE_CALL_DURING_TX: 'active voice call connected during payment initiation (Vishing alert)',
  SMS_KYC_PHISHING_ATTEMPT: 'suspicious SMS received threatening KYC/Account suspension',
  SMS_ELECTRICITY_SCAM: 'suspicious SMS threatening immediate electricity disconnection',
  SMS_LOTTERY_JOB_SCAM: 'suspicious SMS luring with fake reward or job offer',
  SMS_SUSPICIOUS_URL_DETECTED: 'unverified URL or APK link detected in recent SMS',
  VISHING_PLUS_SMS_CORRELATION: 'high-risk correlation between live call and scam SMS',
}

export function reportingAgent(
  transaction: Transaction,
  detectiveResult: DetectiveResult,
  researchResult: ResearchResult,
  riskResult: RiskResult,
  telecomResult?: TelecomResult
): string {
  const parts: string[] = []

  // Opening based on status
  if (riskResult.status === 'FRAUD') {
    parts.push(`ALERT: High-risk transaction detected for user ${transaction.user_id}.`)
  } else if (riskResult.status === 'SUSPICIOUS') {
    parts.push(`WARNING: Suspicious activity detected for user ${transaction.user_id}.`)
  } else {
    parts.push(`Transaction for user ${transaction.user_id} appears normal.`)
  }

  // Add transaction context
  parts.push(
    `Transaction of \u20B9${transaction.amount.toLocaleString('en-IN')} from ${transaction.location} via ${transaction.device}.`
  )

  // Explain rule flags
  if (detectiveResult.ruleFlags.length > 0) {
    const flagExplanations = detectiveResult.ruleFlags
      .map((flag) => FLAG_DESCRIPTIONS[flag] || flag.toLowerCase().replace(/_/g, ' '))
      .join('; ')
    parts.push(`Flagged because: ${flagExplanations}.`)
  }

  // Telecom & Mobile Telemetry evidence
  if (telecomResult && telecomResult.evidenceSummary.length > 0) {
    parts.push(`Telecom Threat Intel: ${telecomResult.evidenceSummary.join('. ')}.`)
  }

  // Add research findings
  if (researchResult.findings.length > 0) {
    parts.push(`Behavioral analysis: ${researchResult.findings.join('. ')}.`)
  }

  // Add comparison context
  if (researchResult.averageAmount > 0) {
    const ratio = (transaction.amount / researchResult.averageAmount).toFixed(1)
    if (parseFloat(ratio) > 2) {
      parts.push(
        `This amount is ${ratio}x the user's average transaction of \u20B9${researchResult.averageAmount.toLocaleString('en-IN')}.`
      )
    }
  }

  // Closing recommendation
  if (riskResult.status === 'FRAUD') {
    parts.push('Recommended action: Block transaction and contact user immediately.')
  } else if (riskResult.status === 'SUSPICIOUS') {
    parts.push('Recommended action: Flag for manual review and consider additional verification.')
  } else {
    parts.push('No immediate action required.')
  }

  return parts.join(' ')
}
