import type { 
  Transaction, 
  DetectiveResult, 
  ProcessedTransaction,
  CrossInstitutionIntelligenceResult,
  SocialEngineeringResult
} from '@/lib/types'
import { transactionStore } from '@/lib/store'

const SUSPICIOUS_LOCATIONS = ['Unknown Location', 'VPN-Hidden', 'Foreign IP', 'Proxy Detected']

export function detectiveAgent(
  transaction: Transaction,
  recentTransactions: ProcessedTransaction[],
  intelligenceResult?: CrossInstitutionIntelligenceResult,
  socialEngineeringResult?: SocialEngineeringResult
): DetectiveResult {
  const ruleFlags: string[] = []
  let riskScore = 0

  const getRule = (ruleId: string) => {
    return transactionStore.getRule(ruleId)
  }


  // Filter user's transactions
  const recentUserTxns = recentTransactions.filter(
    (t) => t.user_id === transaction.user_id
  )

  // Filter 5 minutes window
  const last5Minutes = recentUserTxns.filter((t) => {
    const timeDiff = new Date(transaction.timestamp).getTime() - new Date(t.timestamp).getTime()
    return timeDiff < 5 * 60 * 1000 // 5 minutes
  })

  // Rule 1: High Value Transaction Alert (rule-001) & Rule 2: Very High Value Block (rule-002)
  const rule001 = getRule('rule-001')
  const rule002 = getRule('rule-002')
  
  if (rule002?.isActive && transaction.amount > (rule002.threshold || 500000)) {
    ruleFlags.push('VERY_HIGH_AMOUNT')
    riskScore += 30
  } else if (rule001?.isActive && transaction.amount > (rule001.threshold || 100000)) {
    ruleFlags.push('HIGH_AMOUNT')
    riskScore += 15
  }

  // Rule 3: Micro Transaction Pattern (rule-003)
  const rule003 = getRule('rule-003')
  if (rule003?.isActive) {
    const smallTxns = last5Minutes.filter(t => t.amount < (rule003.threshold || 500))
    if (smallTxns.length >= 3) {
      ruleFlags.push('VELOCITY_ANOMALY')
      ruleFlags.push('RAPID_TRANSACTIONS')
      riskScore += 25
    }
  }

  // Rule 17: Hourly Velocity Check (rule-017)
  const rule017 = getRule('rule-017')
  if (rule017?.isActive) {
    const lastHour = recentUserTxns.filter((t) => {
      const timeDiff = new Date(transaction.timestamp).getTime() - new Date(t.timestamp).getTime()
      return timeDiff < 60 * 60 * 1000 // 1 hour
    })
    if (lastHour.length >= (rule017.threshold || 5)) {
      ruleFlags.push('RAPID_TRANSACTIONS')
      ruleFlags.push('VELOCITY_ANOMALY')
      riskScore += 25
    }
  }

  // Rule 16: Daily Transaction Limit (rule-016)
  const rule016 = getRule('rule-016')
  if (rule016?.isActive) {
    const lastDay = recentUserTxns.filter((t) => {
      const timeDiff = new Date(transaction.timestamp).getTime() - new Date(t.timestamp).getTime()
      return timeDiff < 24 * 60 * 60 * 1000 // 24 hours
    })
    if (lastDay.length >= (rule016.threshold || 20)) {
      ruleFlags.push('VELOCITY_ANOMALY')
      riskScore += 25
    }
  }

  // Rule 18: Daily Amount Limit (rule-018)
  const rule018 = getRule('rule-018')
  if (rule018?.isActive) {
    const lastDay = recentUserTxns.filter((t) => {
      const timeDiff = new Date(transaction.timestamp).getTime() - new Date(t.timestamp).getTime()
      return timeDiff < 24 * 60 * 60 * 1000 // 24 hours
    })
    const dailySpend = lastDay.reduce((sum, t) => sum + t.amount, 0) + transaction.amount
    if (dailySpend > (rule018.threshold || 1000000)) {
      ruleFlags.push('VELOCITY_ANOMALY')
      riskScore += 30
    }
  }

  // Fallback for general multiple recent transactions check
  // (if micro transaction or hourly velocity rules are active)
  if (last5Minutes.length >= 2 && (rule017?.isActive || rule003?.isActive)) {
    // Only flag MULTIPLE_RECENT_TRANSACTIONS if RAPID_TRANSACTIONS wasn't already flagged
    if (!ruleFlags.includes('RAPID_TRANSACTIONS')) {
      ruleFlags.push('MULTIPLE_RECENT_TRANSACTIONS')
      riskScore += 10
    }
  }

  // Rule 5: VPN/Proxy Detection (rule-005) & Rule 6: International Location Alert (rule-006)
  const rule005 = getRule('rule-005')
  const rule006 = getRule('rule-006')
  const isSuspiciousLoc = SUSPICIOUS_LOCATIONS.some(loc => transaction.location.includes(loc))
  
  if (isSuspiciousLoc) {
    const isVPNOrProxy = transaction.location.includes('VPN-Hidden') || transaction.location.includes('Proxy Detected')
    const isInternational = transaction.location.includes('Foreign IP') || transaction.location.includes('Unknown Location')

    if (isVPNOrProxy && rule005?.isActive) {
      ruleFlags.push('SUSPICIOUS_LOCATION')
      ruleFlags.push('SUSPICIOUS_IP')
      riskScore += 25
    } else if (isInternational && rule006?.isActive) {
      ruleFlags.push('SUSPICIOUS_LOCATION')
      ruleFlags.push('SUSPICIOUS_IP')
      riskScore += 25
    }
  }

  // Rule 4: Cross-State Rapid Transaction (rule-004)
  const rule004 = getRule('rule-004')
  if (rule004?.isActive && recentUserTxns.length > 0) {
    const lastTxn = recentUserTxns[recentUserTxns.length - 1]
    const lastState = lastTxn.location.split(', ')[1]
    const currentState = transaction.location.split(', ')[1]
    
    if (lastState && currentState && lastState !== currentState) {
      const timeDiff = new Date(transaction.timestamp).getTime() - new Date(lastTxn.timestamp).getTime()
      if (timeDiff < 60 * 60 * 1000) { // Within 1 hour - impossible to travel
        ruleFlags.push('RAPID_LOCATION_CHANGE')
        riskScore += 25
      } else if (timeDiff < 3 * 60 * 60 * 1000) { // Within 3 hours
        ruleFlags.push('LOCATION_CHANGE')
        riskScore += 10
      }
    }
  }

  // Rule 10: New Device Detection (rule-010)
  const rule010 = getRule('rule-010')
  if (rule010?.isActive && recentUserTxns.length > 0) {
    const userDevices = new Set(recentUserTxns.map((t) => t.device))
    if (!userDevices.has(transaction.device)) {
      ruleFlags.push('NEW_DEVICE')
      ruleFlags.push('DEVICE_CHANGE')
      riskScore += 15
    }
  }

  // Rule 11: Multiple Device Alert (rule-011)
  const rule011 = getRule('rule-011')
  if (rule011?.isActive && recentUserTxns.length > 0) {
    const last24hTxns = recentUserTxns.filter((t) => {
      const timeDiff = new Date(transaction.timestamp).getTime() - new Date(t.timestamp).getTime()
      return timeDiff < 24 * 60 * 60 * 1000
    })
    const userDevices24h = new Set(last24hTxns.map((t) => t.device))
    userDevices24h.add(transaction.device)
    if (userDevices24h.size > (rule011.threshold || 3)) {
      ruleFlags.push('DEVICE_CHANGE')
      riskScore += 15
    }
  }

  // Rule 12: Device-Location Mismatch (rule-012)
  const rule012 = getRule('rule-012')
  if (rule012?.isActive) {
    if (SUSPICIOUS_LOCATIONS.some(loc => transaction.location.includes(loc)) && transaction.device === 'desktop') {
      ruleFlags.push('DEVICE_CHANGE')
      riskScore += 25
    }
  }

  // Rule 10 / Rule 5: IP Change Check
  if (recentUserTxns.length > 0 && (rule010?.isActive || rule005?.isActive)) {
    const lastTxn = recentUserTxns[recentUserTxns.length - 1]
    if (lastTxn.ip !== transaction.ip) {
      ruleFlags.push('IP_CHANGE')
      riskScore += 5
    }
  }

  // Rule 7: Late Night Transaction Review (rule-007)
  const rule007 = getRule('rule-007')
  if (rule007?.isActive) {
    const hour = new Date(transaction.timestamp).getHours()
    if (hour >= 0 && hour <= 5) {
      ruleFlags.push('LATE_NIGHT')
      riskScore += 10
    }
  }

  // Rule 8: Holiday Fraud Protection (rule-008)
  const rule008 = getRule('rule-008')
  if (rule008?.isActive) {
    const day = new Date(transaction.timestamp).getDay()
    if (day === 0 || day === 6) { // Weekend
      ruleFlags.push('UNUSUAL_PATTERN')
      riskScore += 5
    }
  }

  // Rule 9: First Transaction After Dormancy (rule-009)
  const rule009 = getRule('rule-009')
  if (rule009?.isActive) {
    if (recentUserTxns.length === 0) {
      ruleFlags.push('UNUSUAL_PATTERN')
      riskScore += 15
    } else {
      const lastTxn = recentUserTxns[recentUserTxns.length - 1]
      const timeDiff = new Date(transaction.timestamp).getTime() - new Date(lastTxn.timestamp).getTime()
      if (timeDiff > (rule009.threshold || 90) * 24 * 60 * 60 * 1000) { // 90+ days dormancy
        ruleFlags.push('UNUSUAL_PATTERN')
        riskScore += 15
      }
    }
  }

  // Rule 13: Spending Pattern Deviation (rule-013)
  const rule013 = getRule('rule-013')
  if (rule013?.isActive) {
    if (recentUserTxns.length >= 3) {
      const avgAmt = recentUserTxns.reduce((sum, t) => sum + t.amount, 0) / recentUserTxns.length
      if (transaction.amount > avgAmt * (rule013.threshold || 3)) {
        ruleFlags.push('UNUSUAL_PATTERN')
        riskScore += 15
      }
    }
  }

  // Rule 15: Round Amount Pattern (rule-015)
  const rule015 = getRule('rule-015')
  if (rule015?.isActive) {
    if (transaction.amount % 10000 === 0) {
      ruleFlags.push('UNUSUAL_PATTERN')
      riskScore += 10
    }
  }

  // Rule 14: Merchant Category Anomaly (rule-014)
  const rule014 = getRule('rule-014')
  if (rule014?.isActive) {
    // Simple logic: if new merchant is used and transaction amount is high
    if (transaction.amount > 50000) {
      ruleFlags.push('UNUSUAL_PATTERN')
      riskScore += 10
    }
  }

  // Rule 8 (original code context): Unusual pattern - high amount with new device
  if ((rule013?.isActive || rule010?.isActive) && transaction.amount > 50000 && ruleFlags.includes('NEW_DEVICE')) {
    if (!ruleFlags.includes('UNUSUAL_PATTERN')) {
      ruleFlags.push('UNUSUAL_PATTERN')
      riskScore += 15
    }
  }

  // Rule 19: Known Scam Beneficiary Match (rule-019)
  const rule019 = getRule('rule-019')
  const benIdLower = (transaction.beneficiary_id || '').toLowerCase()
  const isKnownScamVpa = benIdLower.includes('mule') || benIdLower.includes('scammer') || benIdLower.includes('power_discom') || benIdLower.includes('scam') || benIdLower.includes('ben-scam') || benIdLower.includes('ben-mule')
  
  if (rule019?.isActive && (isKnownScamVpa || intelligenceResult?.matched)) {
    const hasBeneficiaryMatch = isKnownScamVpa || (intelligenceResult?.matches.some(
      m => m.signalType === 'BENEFICIARY_RISK' || m.signalType === 'KNOWN_SCAM_ACCOUNT' || m.signalType === 'MULE_NETWORK_SIGNAL'
    ) ?? false)
    
    if (hasBeneficiaryMatch) {
      ruleFlags.push('KNOWN_SCAM_BENEFICIARY')
      riskScore += 45
    }
  }

  // Rule 20: Cross-Institution Device Match (rule-020)
  const rule020 = getRule('rule-020')
  if (rule020?.isActive && intelligenceResult?.matched) {
    const hasDeviceMatch = intelligenceResult.matches.some(
      m => m.signalType === 'DEVICE_REPUTATION'
    )
    if (hasDeviceMatch) {
      ruleFlags.push('CROSS_INSTITUTION_DEVICE_MATCH')
      riskScore += 25
    }
  }

  // Rule 21: Social Engineering / Payment Urgency (rule-021)
  const rule021 = getRule('rule-021')
  if (rule021?.isActive && socialEngineeringResult?.detected) {
    const isUrgent = socialEngineeringResult.detectedPatterns.includes('PAYMENT_URGENCY') ||
      (transaction.socialEngineering?.recent_call && (transaction.socialEngineering?.time_since_call ?? 999) <= 15)
    if (isUrgent) {
      ruleFlags.push('SOCIAL_ENG_URGENCY')
      riskScore += 25
    }
  }

  // Rule 22: Fake KYC / Account Closure Pressure (rule-022)
  const rule022 = getRule('rule-022')
  if (rule022?.isActive && socialEngineeringResult?.detected) {
    const hasCoercion = socialEngineeringResult.detectedPatterns.some(
      p => p === 'FAKE_KYC_REQUEST' || p === 'ACCOUNT_CLOSURE_THREAT' || p === 'OTP_PAYMENT_REQUEST'
    )
    if (hasCoercion) {
      ruleFlags.push('FAKE_KYC_PRESSURE')
      riskScore += 35
    }
  }

  return {
    ruleFlags: Array.from(new Set(ruleFlags)),
    riskScore: Math.min(riskScore, 100), // Cap at 100
  }
}

