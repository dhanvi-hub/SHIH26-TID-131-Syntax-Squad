import type { 
  ProcessedTransaction, 
  DashboardStats, 
  StateTransactionData, 
  FraudCriteria,
  BankRule,
  HumanValidation,
  MLFeedbackSample,
  FeedbackStats
} from '@/lib/types'
import { INDIAN_CITIES } from '@/lib/agents/transaction-generator'

const WORLD_CITIES = [
  { city: 'London', region: 'United Kingdom', country: 'UK' },
  { city: 'New York', region: 'United States', country: 'USA' },
  { city: 'Singapore', region: 'Singapore', country: 'Singapore' },
  { city: 'Dubai', region: 'UAE', country: 'UAE' },
]

// Bank Rules Initial Configuration
const INITIAL_RULES: BankRule[] = [
  {
    id: 'RULE-001',
    name: 'High Amount Transfer',
    description: 'Flag transactions exceeding ₹50,000 threshold for elevated risk inspection',
    category: 'amount',
    severity: 'medium',
    isActive: true,
    threshold: 50000,
    action: 'flag',
  },
  {
    id: 'RULE-002',
    name: 'Very High Amount Block',
    description: 'Critical warning for single transfers exceeding ₹200,000',
    category: 'amount',
    severity: 'critical',
    isActive: true,
    threshold: 200000,
    action: 'block',
  },
  {
    id: 'RULE-003',
    name: 'Suspicious Proxy IP',
    description: 'Flag transactions originating from TOR exit nodes, VPNs, or datacenter proxies',
    category: 'location',
    severity: 'high',
    isActive: true,
    action: 'review',
  },
  {
    id: 'RULE-004',
    name: 'Late Night Anomaly',
    description: 'Monitor high-value transactions conducted between 00:00 AM and 05:00 AM',
    category: 'time',
    severity: 'low',
    isActive: true,
    action: 'flag',
  },
  {
    id: 'RULE-005',
    name: 'Rapid Cross-Border Velocity',
    description: 'Detect geographically impossible location shifts within short time windows',
    category: 'velocity',
    severity: 'critical',
    isActive: true,
    action: 'block',
  },
  {
    id: 'RULE-006',
    name: 'Cross-Institution Adverse Match',
    description: 'Elevate risk when beneficiary or device appears in privacy-preserving consortium threat registry',
    category: 'intelligence',
    severity: 'critical',
    isActive: true,
    action: 'review',
  },
  {
    id: 'RULE-007',
    name: 'Scam-Call Telephony Coercion',
    description: 'Flag high-value transfers preceded by active calls from unknown callers within 15 minutes',
    category: 'social_engineering',
    severity: 'high',
    isActive: true,
    action: 'review',
  },
]

// In-memory store (simulates MongoDB/Persisted DB)
class TransactionStore {
  private transactions: ProcessedTransaction[] = []
  private maxTransactions = 1000
  private rules: BankRule[] = [...INITIAL_RULES]
  private feedbackSamples: MLFeedbackSample[] = []
  private listeners: Set<(transaction: ProcessedTransaction) => void> = new Set()

  subscribe(listener: (transaction: ProcessedTransaction) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  addTransaction(transaction: ProcessedTransaction): void {
    const transactionWithCriteria = {
      ...transaction,
      fraudCriteria: this.calculateFraudCriteria(transaction)
    }
    this.transactions.push(transactionWithCriteria)
    
    if (this.transactions.length > this.maxTransactions) {
      this.transactions = this.transactions.slice(-this.maxTransactions)
    }

    // Broadcast to all active listeners (e.g. SSE stream / Web Dashboard)
    this.listeners.forEach((listener) => {
      try {
        listener(transactionWithCriteria)
      } catch (err) {
        console.error('Error in transactionStore listener:', err)
      }
    })
  }

  private calculateFraudCriteria(txn: ProcessedTransaction): FraudCriteria {
    const ruleFlags = txn.ruleFlags || []
    const criteria: FraudCriteria = {
      rapidTransactions: 0,
      differentLocation: 0,
      lateNightTransaction: 0,
      differentDevice: 0,
      highAmount: 0,
      suspiciousIP: 0,
      unusualPattern: 0,
      crossInstitutionIntelligence: 0,
      socialEngineering: 0,
    }

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
    if (txn.agentResults?.intelligence?.matched || ruleFlags.includes('CROSS_INSTITUTION_MATCH')) {
      criteria.crossInstitutionIntelligence = 25
      totalWeight += 25
    }
    if (txn.agentResults?.socialEngineering?.detected || ruleFlags.includes('SCAM_CALL_COERCION')) {
      criteria.socialEngineering = 25
      totalWeight += 25
    }

    if (totalWeight > 0 && txn.status !== 'SAFE') {
      const multiplier = 100 / totalWeight
      criteria.rapidTransactions = Math.round(criteria.rapidTransactions * multiplier)
      criteria.differentLocation = Math.round(criteria.differentLocation * multiplier)
      criteria.lateNightTransaction = Math.round(criteria.lateNightTransaction * multiplier)
      criteria.differentDevice = Math.round(criteria.differentDevice * multiplier)
      criteria.highAmount = Math.round(criteria.highAmount * multiplier)
      criteria.suspiciousIP = Math.round(criteria.suspiciousIP * multiplier)
      criteria.unusualPattern = Math.round(criteria.unusualPattern * multiplier)
      if (criteria.crossInstitutionIntelligence) {
        criteria.crossInstitutionIntelligence = Math.round(criteria.crossInstitutionIntelligence * multiplier)
      }
      if (criteria.socialEngineering) {
        criteria.socialEngineering = Math.round(criteria.socialEngineering * multiplier)
      }
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

    const crossInstitutionAlerts = this.transactions.filter((t) => t.agentResults?.intelligence?.matched).length
    const socialEngineeringAlerts = this.transactions.filter((t) => t.agentResults?.socialEngineering?.detected).length
    const multiSignalEscalations = this.transactions.filter((t) => t.multiSignalEscalation?.enabled).length

    return {
      totalTransactions,
      fraudCount,
      suspiciousCount,
      safeCount,
      totalAmount,
      averageRiskScore,
      crossInstitutionAlerts,
      socialEngineeringAlerts,
      multiSignalEscalations,
    }
  }

  getStateWiseData(): StateTransactionData[] {
    const stateData: Record<string, StateTransactionData> = {}

    // Initialize all global & Indian regions/states
    const indianStates = [...new Set(INDIAN_CITIES.map(c => c.state))]
    const worldRegions = [...new Set(WORLD_CITIES.map(c => c.region))]
    const allRegions = [...new Set([...indianStates, ...worldRegions])]

    allRegions.forEach(region => {
      stateData[region] = {
        state: region,
        safeCount: 0,
        suspiciousCount: 0,
        fraudCount: 0,
        totalAmount: 0,
        dominantStatus: 'SAFE'
      }
    })

    this.transactions.forEach((t) => {
      const stateName = this.extractState(t.location)
      if (stateName && stateData[stateName]) {
        stateData[stateName].totalAmount += t.amount
        if (t.status === 'SAFE') stateData[stateName].safeCount++
        else if (t.status === 'SUSPICIOUS') stateData[stateName].suspiciousCount++
        else if (t.status === 'FRAUD') stateData[stateName].fraudCount++
      }
    })

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
    const indianCity = INDIAN_CITIES.find(c => location.includes(c.city) || location.includes(c.state))
    if (indianCity) return indianCity.state

    const worldCity = WORLD_CITIES.find(c => location.includes(c.city) || location.includes(c.region) || location.includes(c.country))
    return worldCity?.region || null
  }

  getFraudTransactions(): ProcessedTransaction[] {
    return this.transactions.filter(t => t.status === 'FRAUD' || t.status === 'SUSPICIOUS')
  }

  getTimeSeriesData(hours = 12): { timestamp: string; safe: number; suspicious: number; fraud: number }[] {
    const now = Date.now()
    const hourlyData: Record<string, { safe: number; suspicious: number; fraud: number }> = {}

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now - i * 60 * 60 * 1000)
      const key = hourStart.toISOString().slice(0, 13) + ':00:00.000Z'
      hourlyData[key] = { safe: 0, suspicious: 0, fraud: 0 }
    }

    this.transactions.forEach((t) => {
      const txnTime = new Date(t.timestamp)
      if (isNaN(txnTime.getTime())) return
      const hourKey = txnTime.toISOString().slice(0, 13) + ':00:00.000Z'
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
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ]

    this.transactions.forEach((t) => {
      const score = typeof t.riskScore === 'number' && !isNaN(t.riskScore) ? Math.round(t.riskScore) : 0
      if (score <= 20) ranges[0].count++
      else if (score <= 40) ranges[1].count++
      else if (score <= 60) ranges[2].count++
      else if (score <= 80) ranges[3].count++
      else ranges[4].count++
    })

    return ranges
  }

  clear(): void {
    this.transactions = []
  }

  getRules(): BankRule[] {
    return this.rules
  }

  updateRule(ruleId: string, isActive: boolean): void {
    this.rules = this.rules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive } : rule
    )
  }

  getRule(ruleId: string): BankRule | undefined {
    return this.rules.find(r => r.id === ruleId)
  }

  // ── Human Validation & ML Retraining Feedback Dataset ──
  updateTransactionValidation(txnId: string, validation: HumanValidation): ProcessedTransaction | undefined {
    const txn = this.transactions.find(t => t.txn_id === txnId)
    if (!txn) return undefined

    txn.humanValidation = validation
    
    const modelRisk = txn.riskScore
    const modelStatus = txn.status
    let sampleType: 'FALSE_NEGATIVE' | 'FALSE_POSITIVE' | 'TRUE_POSITIVE' | 'TRUE_NEGATIVE'
    
    if (validation.status === 'CONFIRMED_FRAUD') {
      sampleType = (modelStatus === 'SAFE' || modelRisk < 40) ? 'FALSE_NEGATIVE' : 'TRUE_POSITIVE'
    } else if (validation.status === 'LEGITIMATE' || validation.status === 'FALSE_POSITIVE') {
      sampleType = (modelStatus === 'FRAUD' || modelRisk >= 60) ? 'FALSE_POSITIVE' : 'TRUE_NEGATIVE'
    } else {
      sampleType = modelStatus === 'FRAUD' ? 'TRUE_POSITIVE' : 'TRUE_NEGATIVE'
    }

    const sample: MLFeedbackSample = {
      id: `FDBK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      txnId: txn.txn_id,
      modelPredictionScore: modelRisk,
      modelStatus: modelStatus,
      humanLabel: validation.status,
      sampleType,
      featuresSummary: {
        amount: txn.amount,
        location: txn.location,
        userId: txn.user_id,
        beneficiaryId: txn.beneficiary_id,
        device: txn.device,
      },
      submittedToConsortium: !!validation.submittedToConsortium,
      createdAt: validation.validatedAt,
    }

    this.feedbackSamples.push(sample)
    return txn
  }

  getFeedbackSamples(): MLFeedbackSample[] {
    return [...this.feedbackSamples].reverse()
  }

  getFeedbackStats(): FeedbackStats {
    const totalReviewed = this.feedbackSamples.length
    const falseNegatives = this.feedbackSamples.filter(s => s.sampleType === 'FALSE_NEGATIVE').length
    const falsePositives = this.feedbackSamples.filter(s => s.sampleType === 'FALSE_POSITIVE').length
    const truePositives = this.feedbackSamples.filter(s => s.sampleType === 'TRUE_POSITIVE').length
    const trueNegatives = this.feedbackSamples.filter(s => s.sampleType === 'TRUE_NEGATIVE').length
    const pendingReviewCount = this.transactions.filter(
      t => !t.humanValidation && (t.status === 'FRAUD' || t.status === 'SUSPICIOUS')
    ).length

    return {
      totalReviewed,
      falseNegatives,
      falsePositives,
      truePositives,
      trueNegatives,
      pendingReviewCount,
    }
  }
}

export const transactionStore = new TransactionStore()
