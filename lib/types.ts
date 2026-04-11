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
