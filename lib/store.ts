import type { ProcessedTransaction, DashboardStats } from '@/lib/types'

// In-memory store (simulates MongoDB)
// In production, replace with actual MongoDB connection
class TransactionStore {
  private transactions: ProcessedTransaction[] = []
  private maxTransactions = 1000 // Keep last 1000 transactions

  addTransaction(transaction: ProcessedTransaction): void {
    this.transactions.push(transaction)
    
    // Trim old transactions if we exceed max
    if (this.transactions.length > this.maxTransactions) {
      this.transactions = this.transactions.slice(-this.maxTransactions)
    }
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

  getTimeSeriesData(hours = 12): { timestamp: string; safe: number; suspicious: number; fraud: number }[] {
    const now = Date.now()
    const hourlyData: Record<string, { safe: number; suspicious: number; fraud: number }> = {}

    // Initialize hourly buckets
    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now - i * 60 * 60 * 1000)
      const key = hourStart.toISOString().slice(0, 13) + ':00'
      hourlyData[key] = { safe: 0, suspicious: 0, fraud: 0 }
    }

    // Populate with transactions
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

// Singleton instance
export const transactionStore = new TransactionStore()
