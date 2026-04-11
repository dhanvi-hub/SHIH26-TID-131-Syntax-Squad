import type { Transaction, DetectiveResult, ProcessedTransaction } from '@/lib/types'

const SUSPICIOUS_LOCATIONS = ['Unknown Location', 'VPN-Hidden', 'Foreign IP', 'Proxy Detected']
const HIGH_AMOUNT_THRESHOLD = 50000 // ₹50,000
const VERY_HIGH_AMOUNT_THRESHOLD = 150000 // ₹1,50,000

export function detectiveAgent(
  transaction: Transaction,
  recentTransactions: ProcessedTransaction[]
): DetectiveResult {
  const ruleFlags: string[] = []
  let riskScore = 0

  // Rule 1: Check for unusually high amount (in INR)
  if (transaction.amount > VERY_HIGH_AMOUNT_THRESHOLD) {
    ruleFlags.push('VERY_HIGH_AMOUNT')
    riskScore += 30
  } else if (transaction.amount > HIGH_AMOUNT_THRESHOLD) {
    ruleFlags.push('HIGH_AMOUNT')
    riskScore += 15
  }

  // Rule 2: Check for multiple transactions in short time
  const recentUserTxns = recentTransactions.filter(
    (t) => t.user_id === transaction.user_id
  )
  const last5Minutes = recentUserTxns.filter((t) => {
    const timeDiff = new Date(transaction.timestamp).getTime() - new Date(t.timestamp).getTime()
    return timeDiff < 5 * 60 * 1000 // 5 minutes
  })
  
  if (last5Minutes.length >= 3) {
    ruleFlags.push('RAPID_TRANSACTIONS')
    ruleFlags.push('VELOCITY_ANOMALY')
    riskScore += 25
  } else if (last5Minutes.length >= 2) {
    ruleFlags.push('MULTIPLE_RECENT_TRANSACTIONS')
    riskScore += 10
  }

  // Rule 3: Check for suspicious location
  if (SUSPICIOUS_LOCATIONS.some(loc => transaction.location.includes(loc))) {
    ruleFlags.push('SUSPICIOUS_LOCATION')
    ruleFlags.push('SUSPICIOUS_IP')
    riskScore += 25
  }

  // Rule 4: Check for location change (cross-state transactions)
  if (recentUserTxns.length > 0) {
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

  // Rule 5: Check for new device
  if (recentUserTxns.length > 0) {
    const userDevices = new Set(recentUserTxns.map((t) => t.device))
    if (!userDevices.has(transaction.device)) {
      ruleFlags.push('NEW_DEVICE')
      ruleFlags.push('DEVICE_CHANGE')
      riskScore += 15
    }
  }

  // Rule 6: Check for IP change
  if (recentUserTxns.length > 0) {
    const lastTxn = recentUserTxns[recentUserTxns.length - 1]
    if (lastTxn.ip !== transaction.ip) {
      ruleFlags.push('IP_CHANGE')
      riskScore += 5
    }
  }

  // Rule 7: Late night transactions (India timezone approximation)
  const hour = new Date(transaction.timestamp).getHours()
  if (hour >= 0 && hour <= 5) {
    ruleFlags.push('LATE_NIGHT')
    riskScore += 10
  }

  // Rule 8: Unusual pattern - high amount with new device
  if (transaction.amount > HIGH_AMOUNT_THRESHOLD && ruleFlags.includes('NEW_DEVICE')) {
    ruleFlags.push('UNUSUAL_PATTERN')
    riskScore += 15
  }

  return {
    ruleFlags,
    riskScore: Math.min(riskScore, 100), // Cap at 100
  }
}
