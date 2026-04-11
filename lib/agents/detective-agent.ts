import type { Transaction, DetectiveResult, ProcessedTransaction } from '@/lib/types'

const SUSPICIOUS_LOCATIONS = ['Lagos', 'Moscow', 'Unknown', 'VPN-Hidden']
const HIGH_AMOUNT_THRESHOLD = 2000
const VERY_HIGH_AMOUNT_THRESHOLD = 5000

export function detectiveAgent(
  transaction: Transaction,
  recentTransactions: ProcessedTransaction[]
): DetectiveResult {
  const ruleFlags: string[] = []
  let riskScore = 0

  // Rule 1: Check for unusually high amount
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
    riskScore += 25
  } else if (last5Minutes.length >= 2) {
    ruleFlags.push('MULTIPLE_RECENT_TRANSACTIONS')
    riskScore += 10
  }

  // Rule 3: Check for suspicious location
  if (SUSPICIOUS_LOCATIONS.includes(transaction.location)) {
    ruleFlags.push('SUSPICIOUS_LOCATION')
    riskScore += 20
  }

  // Rule 4: Check for location change
  if (recentUserTxns.length > 0) {
    const lastTxn = recentUserTxns[recentUserTxns.length - 1]
    if (lastTxn.location !== transaction.location) {
      const timeDiff = new Date(transaction.timestamp).getTime() - new Date(lastTxn.timestamp).getTime()
      if (timeDiff < 60 * 60 * 1000) { // Within 1 hour
        ruleFlags.push('RAPID_LOCATION_CHANGE')
        riskScore += 20
      } else {
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

  return {
    ruleFlags,
    riskScore: Math.min(riskScore, 100), // Cap at 100
  }
}
