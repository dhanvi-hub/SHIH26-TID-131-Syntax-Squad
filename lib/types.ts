export interface Transaction {
  txn_id: string
  user_id: string
  amount: number
  location: string
  ip: string
  device: 'mobile' | 'desktop'
  timestamp: string
}

export interface DetectiveResult {
  ruleFlags: string[]
  riskScore: number
}

export interface ResearchResult {
  averageAmount: number
  commonLocations: string[]
  commonDevices: string[]
  additionalRiskScore: number
  findings: string[]
}

export interface RiskResult {
  riskScore: number
  status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
}

export interface ProcessedTransaction extends Transaction {
  ruleFlags: string[]
  riskScore: number
  status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  report: string
  processedAt: string
  agentResults: {
    detective: DetectiveResult
    research: ResearchResult
    risk: RiskResult
  }
  fraudCriteria?: FraudCriteria
}

export interface FraudCriteria {
  rapidTransactions: number // percentage contribution
  differentLocation: number
  lateNightTransaction: number
  differentDevice: number
  highAmount: number
  suspiciousIP: number
  unusualPattern: number
}

export interface DashboardStats {
  totalTransactions: number
  fraudCount: number
  suspiciousCount: number
  safeCount: number
  totalAmount: number
  averageRiskScore: number
}

export interface AgentStep {
  name: string
  status: 'pending' | 'processing' | 'complete'
  result?: DetectiveResult | ResearchResult | RiskResult | string
}

export interface StateTransactionData {
  state: string
  safeCount: number
  suspiciousCount: number
  fraudCount: number
  totalAmount: number
  dominantStatus: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
}

export interface FraudReport {
  txn_id: string
  user_id: string
  amount: number
  location: string
  timestamp: string
  riskScore: number
  status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  criteria: FraudCriteria
  summary: string
  recommendations: string[]
}

export interface BankRule {
  id: string
  name: string
  description: string
  category: 'amount' | 'location' | 'time' | 'device' | 'pattern' | 'velocity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  threshold?: number
  action: 'flag' | 'block' | 'review' | 'notify'
}
