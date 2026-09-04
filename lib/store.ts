import type { ProcessedTransaction, DashboardStats, StateTransactionData, FraudCriteria } from '@/lib/types'
import { WORLD_CITIES } from '@/lib/agents/transaction-generator'

// In-memory store (simulates MongoDB)
class TransactionStore {
  private transactions: ProcessedTransaction[] = []
  private maxTransactions = 1000

  addTransaction(transaction: ProcessedTransaction): void {
    // Add fraud criteria calculation
    const transactionWithCriteria = {
      ...transaction,
      fraudCriteria: this.calculateFraudCriteria(transaction)
    }
    this.transactions.push(transactionWithCriteria)
    
    if (this.transactions.length > this.maxTransactions) {
      this.transactions = this.transactions.slice(-this.maxTransactions)
    }
  }

  private calculateFraudCriteria(txn: ProcessedTransaction): FraudCriteria {
    const ruleFlags = txn.ruleFlags
    const criteria: FraudCriteria = {
      rapidTransactions: 0,
      differentLocation: 0,
      lateNightTransaction: 0,
      differentDevice: 0,
      highAmount: 0,
      suspiciousIP: 0,
      unusualPattern: 0,
    }

    // Calculate percentages based on rule flags
    let totalWeight = 0

    if (ruleFlags.includes('RAPID_TRANSACTIONS') || ruleFlags.includes('VELOCITY_ANOMALY')) {
      criteria.rapidTransactions = 25
      totalWeight += 25
    }
    if (ruleFlags.includes('SUSPICIOUS_LOCATION') || ruleFlags.includes('RAPID_LOCATION_CHANGE')) {
      criteria.differentLocation = 20
      totalWeight += 20
    }
    if (ruleFlags.includes('LATE_NIGHT')) {
      const hour = new Date(txn.timestamp).getHours()
      if (hour >= 0 && hour <= 5) {
        criteria.lateNightTransaction = 15
        totalWeight += 15
      }
    }
    if (ruleFlags.includes('NEW_DEVICE') || ruleFlags.includes('DEVICE_CHANGE')) {
      criteria.differentDevice = 15
      totalWeight += 15
    }
    if (ruleFlags.includes('HIGH_AMOUNT') || ruleFlags.includes('VERY_HIGH_AMOUNT')) {
      criteria.highAmount = 20
      totalWeight += 20
    }
    if (ruleFlags.includes('SUSPICIOUS_IP') || txn.location.includes('VPN') || txn.location.includes('Proxy')) {
      criteria.suspiciousIP = 10
      totalWeight += 10
    }
    if (ruleFlags.includes('UNUSUAL_PATTERN') || ruleFlags.includes('DEVIATION_FROM_AVERAGE')) {
      criteria.unusualPattern = 15
      totalWeight += 15
    }

    // Normalize to 100% if there are any flags
    if (totalWeight > 0 && txn.status !== 'SAFE') {
      const multiplier = 100 / totalWeight
      criteria.rapidTransactions = Math.round(criteria.rapidTransactions * multiplier)
      criteria.differentLocation = Math.round(criteria.differentLocation * multiplier)
      criteria.lateNightTransaction = Math.round(criteria.lateNightTransaction * multiplier)
      criteria.differentDevice = Math.round(criteria.differentDevice * multiplier)
      criteria.highAmount = Math.round(criteria.highAmount * multiplier)
      criteria.suspiciousIP = Math.round(criteria.suspiciousIP * multiplier)
      criteria.unusualPattern = Math.round(criteria.unusualPattern * multiplier)
    }

    return criteria
  }

  getTransactions(limit = 50): ProcessedTransaction[] {
    return [...this.transactions].reverse().slice(0, limit)
  }

  getTransactionById(txnId: string): ProcessedTransaction | undefined {
    return this.transactions.find((t) => t.txn_id === txnId)
  }

  getUserTransactions(userId: string, limit = 20): ProcessedTransaction[] {
    return this.transactions
      .filter((t) => t.user_id === userId)
      .slice(-limit)
  }

  getAllTransactions(): ProcessedTransaction[] {
    return [...this.transactions]
  }

  getStats(): DashboardStats {
    const totalTransactions = this.transactions.length
    const fraudCount = this.transactions.filter((t) => t.status === 'FRAUD').length
    const suspiciousCount = this.transactions.filter((t) => t.status === 'SUSPICIOUS').length
    const safeCount = this.transactions.filter((t) => t.status === 'SAFE').length
    const totalAmount = this.transactions.reduce((sum, t) => sum + t.amount, 0)
    const averageRiskScore =
      totalTransactions > 0
        ? this.transactions.reduce((sum, t) => sum + t.riskScore, 0) / totalTransactions
        : 0

    return {
      totalTransactions,
      fraudCount,
      suspiciousCount,
      safeCount,
      totalAmount,
      averageRiskScore,
    }
  }

  getStateWiseData(): StateTransactionData[] {
    const stateData: Record<string, StateTransactionData> = {}

    // Initialize all global regions & states
    const regions = [...new Set(WORLD_CITIES.map(c => c.region))]
    regions.forEach(region => {
      stateData[region] = {
        state: region,
        safeCount: 0,
        suspiciousCount: 0,
        fraudCount: 0,
        totalAmount: 0,
        dominantStatus: 'SAFE'
      }
    })

    // Populate with transactions
    this.transactions.forEach((t) => {
      const stateName = this.extractState(t.location)
      if (stateName && stateData[stateName]) {
        stateData[stateName].totalAmount += t.amount
        if (t.status === 'SAFE') stateData[stateName].safeCount++
        else if (t.status === 'SUSPICIOUS') stateData[stateName].suspiciousCount++
        else if (t.status === 'FRAUD') stateData[stateName].fraudCount++
      }
    })

    // Calculate dominant status for each region
    Object.values(stateData).forEach(state => {
      if (state.fraudCount > 0) {
        state.dominantStatus = 'FRAUD'
      } else if (state.suspiciousCount > state.safeCount) {
        state.dominantStatus = 'SUSPICIOUS'
      } else {
        state.dominantStatus = 'SAFE'
      }
    })

    return Object.values(stateData).filter(s => 
      s.safeCount > 0 || s.suspiciousCount > 0 || s.fraudCount > 0
    )
  }

  private extractState(location: string): string | null {
    const cityData = WORLD_CITIES.find(c => location.includes(c.city) || location.includes(c.region) || location.includes(c.country))
    return cityData?.region || null
  }

  getFraudTransactions(): ProcessedTransaction[] {
    return this.transactions.filter(t => t.status === 'FRAUD' || t.status === 'SUSPICIOUS')
  }

  getTimeSeriesData(hours = 12): { timestamp: string; safe: number; suspicious: number; fraud: number }[] {
    const now = Date.now()
    const hourlyData: Record<string, { safe: number; suspicious: number; fraud: number }> = {}

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now - i * 60 * 60 * 1000)
      const key = hourStart.toISOString().slice(0, 13) + ':00'
      hourlyData[key] = { safe: 0, suspicious: 0, fraud: 0 }
    }

    this.transactions.forEach((t) => {
      const txnTime = new Date(t.timestamp)
      const hourKey = txnTime.toISOString().slice(0, 13) + ':00'
      if (hourlyData[hourKey]) {
        if (t.status === 'SAFE') hourlyData[hourKey].safe++
        else if (t.status === 'SUSPICIOUS') hourlyData[hourKey].suspicious++
        else if (t.status === 'FRAUD') hourlyData[hourKey].fraud++
      }
    })

    return Object.entries(hourlyData).map(([timestamp, data]) => ({
      timestamp,
      ...data,
    }))
  }

  getRiskDistribution(): { range: string; count: number }[] {
    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ]

    this.transactions.forEach((t) => {
      const range = ranges.find((r) => t.riskScore >= r.min && t.riskScore <= r.max)
      if (range) range.count++
    })

    return ranges.map(({ range, count }) => ({ range, count }))
  }

  clear(): void {
    this.transactions = []
  }
}

export const transactionStore = new TransactionStore()
