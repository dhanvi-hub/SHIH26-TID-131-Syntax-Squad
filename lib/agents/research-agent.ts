import type { Transaction, ResearchResult, ProcessedTransaction } from '@/lib/types'

export function researchAgent(
  transaction: Transaction,
  allTransactions: ProcessedTransaction[]
): ResearchResult {
  // Get last 20 transactions for this user
  const userTransactions = allTransactions
    .filter((t) => t.user_id === transaction.user_id)
    .slice(-20)

  const findings: string[] = []
  let additionalRiskScore = 0

  // Calculate average amount
  const averageAmount =
    userTransactions.length > 0
      ? userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length
      : 0

  // Get common locations
  const locationCounts: Record<string, number> = {}
  userTransactions.forEach((t) => {
    locationCounts[t.location] = (locationCounts[t.location] || 0) + 1
  })
  const commonLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([loc]) => loc)

  // Get common devices
  const deviceCounts: Record<string, number> = {}
  userTransactions.forEach((t) => {
    deviceCounts[t.device] = (deviceCounts[t.device] || 0) + 1
  })
  const commonDevices = Object.entries(deviceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([device]) => device)

  // Analysis 1: Amount compared to average
  if (userTransactions.length > 0) {
    const amountRatio = transaction.amount / averageAmount
    if (amountRatio > 10) {
      findings.push(`Amount is ${amountRatio.toFixed(1)}x the user's average spending`)
      additionalRiskScore += 25
    } else if (amountRatio > 5) {
      findings.push(`Amount is ${amountRatio.toFixed(1)}x the user's average spending`)
      additionalRiskScore += 15
    } else if (amountRatio > 3) {
      findings.push(`Amount is ${amountRatio.toFixed(1)}x higher than usual`)
      additionalRiskScore += 8
    }
  } else {
    findings.push('First transaction for this user - no history available')
    additionalRiskScore += 5
  }

  // Analysis 2: New location check
  if (commonLocations.length > 0 && !commonLocations.includes(transaction.location)) {
    findings.push(`Transaction from new location: ${transaction.location}`)
    additionalRiskScore += 12
  }

  // Analysis 3: New device check
  if (commonDevices.length > 0 && !commonDevices.includes(transaction.device)) {
    findings.push(`Transaction from new device type: ${transaction.device}`)
    additionalRiskScore += 10
  }

  // Analysis 4: Transaction frequency analysis
  if (userTransactions.length >= 10) {
    const timestamps = userTransactions.map((t) => new Date(t.timestamp).getTime())
    const avgTimeBetween =
      timestamps.length > 1
        ? (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1)
        : Infinity

    const currentTimeDiff = userTransactions.length > 0
      ? new Date(transaction.timestamp).getTime() - new Date(userTransactions[userTransactions.length - 1].timestamp).getTime()
      : 0

    if (currentTimeDiff < avgTimeBetween / 5) {
      findings.push('Transaction frequency is unusually high')
      additionalRiskScore += 8
    }
  }

  // Analysis 5: Check for escalating amounts
  if (userTransactions.length >= 5) {
    const recentAmounts = userTransactions.slice(-5).map((t) => t.amount)
    const isEscalating = recentAmounts.every((amt, i) => i === 0 || amt >= recentAmounts[i - 1])
    if (isEscalating && transaction.amount > recentAmounts[recentAmounts.length - 1]) {
      findings.push('Pattern detected: Escalating transaction amounts')
      additionalRiskScore += 10
    }
  }

  return {
    averageAmount,
    commonLocations,
    commonDevices,
    additionalRiskScore: Math.min(additionalRiskScore, 50), // Cap additional score
    findings,
  }
}
