export interface Transaction {
  txn_id: string
  user_id: string
  amount: number
  location: string
  ip: string
  device: 'mobile' | 'desktop'
  timestamp: string
  beneficiary_id?: string
  device_fingerprint?: string
  socialEngineering?: SocialEngineeringContext
}

export interface DeviceTelemetry {
  recentSms?: string
  smsSender?: string
  isOnActiveCall?: boolean
  callDurationSec?: number
}

export interface TelecomResult {
  ruleFlags: string[]
  riskScore: number
  scamCategory: 'KYC_EXPIRY' | 'ELECTRICITY_BILL' | 'LOTTERY_JOB' | 'SCREEN_SHARE_CALL' | 'PHISHING_URL' | 'NONE'
  evidenceSummary: string[]
}

export interface SocialEngineeringContext {
  recent_call?: boolean
  caller_known?: boolean
  call_duration?: number // duration in seconds
  time_since_call?: number // minutes before transaction
  caller_risk_score?: number // 0 - 100
  scam_pattern?: 'payment_urgency' | 'account_closure_threat' | 'fake_kyc_request' | 'otp_payment_request' | 'lottery_prize' | 'none'
}

export interface IntelligenceSignalMatch {
  id?: string
  entityType?: 'BENEFICIARY' | 'DEVICE' | 'IP' | 'ACCOUNT' | 'TRANSACTION_PATTERN'
  signalType: 'BENEFICIARY_RISK' | 'DEVICE_REPUTATION' | 'IP_THREAT' | 'KNOWN_SCAM_ACCOUNT' | 'MULE_NETWORK_SIGNAL'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskScore?: number
  confidence: number // 0.0 - 1.0
  reportingInstitutionsCount: number
  firstSeen: string
  lastSeen: string
  reportedAt?: string
  reportCount?: number
  contributingInstitutions?: string[]
  tags: string[]
  pseudonymizedIdentifier?: string
  pseudonymousIdentifier?: string
  status?: 'ACTIVE' | 'RESOLVED' | 'UNDER_REVIEW'
  recencyNote?: string
}

export interface CrossInstitutionIntelligenceResult {
  matched: boolean
  riskScore: number // 0 - 100
  matches: IntelligenceSignalMatch[]
  summary: string
  participatingInstitutionsCount: number
}

export interface SocialEngineeringResult {
  detected: boolean
  riskScore: number // 0 - 100
  detectedPatterns: string[]
  explanation: string
  contributingSignals: string[]
}

export interface MultiSignalEscalation {
  enabled: boolean
  reason: string
  contributingSignals: string[]
  originalMLScore?: number
  escalatedScore?: number
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
  mlRisk?: number
  ruleRisk?: number
  behaviouralRisk?: number
  networkRisk?: number
  externalIntelligenceRisk?: number
  socialEngineeringRisk?: number
  finalRisk?: number
  multiSignalEscalation?: MultiSignalEscalation
  signals?: SignalBreakdown
}

export interface SignalBreakdown {
  mlRisk: number
  ruleRisk: number
  behaviouralRisk: number
  networkRisk: number
  externalIntelligenceRisk: number
  socialEngineeringRisk: number
  finalRisk: number
}

export interface ProcessedTransaction extends Transaction {
  telemetry?: DeviceTelemetry
  ruleFlags: string[]
  riskScore: number
  status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  report: string
  processedAt: string
  agentResults: {
    detective: DetectiveResult
    research: ResearchResult
    risk: RiskResult
    telecom?: TelecomResult
    intelligence?: CrossInstitutionIntelligenceResult
    socialEngineering?: SocialEngineeringResult
  }
  fraudCriteria?: FraudCriteria
  multiSignalEscalation?: MultiSignalEscalation
  signals?: SignalBreakdown
  humanValidation?: HumanValidation
  institutionId?: string
}

export interface FraudCriteria {
  rapidTransactions: number // percentage contribution
  differentLocation: number
  lateNightTransaction: number
  differentDevice: number
  highAmount: number
  suspiciousIP: number
  unusualPattern: number
  crossInstitutionIntelligence?: number
  socialEngineering?: number
}

export interface DashboardStats {
  totalTransactions: number
  fraudCount: number
  suspiciousCount: number
  safeCount: number
  totalAmount: number
  averageRiskScore: number
  crossInstitutionAlerts?: number
  socialEngineeringAlerts?: number
  multiSignalEscalations?: number
}

export interface AgentStep {
  name: string
  status: 'pending' | 'processing' | 'complete'
  result?: DetectiveResult | ResearchResult | RiskResult | CrossInstitutionIntelligenceResult | SocialEngineeringResult | string
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
  multiSignalEscalation?: MultiSignalEscalation
  signals?: SignalBreakdown
}

export interface BankRule {
  id: string
  name: string
  description: string
  category: 'amount' | 'location' | 'time' | 'device' | 'pattern' | 'velocity' | 'intelligence' | 'social_engineering'
  severity: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  threshold?: number
  action: 'flag' | 'block' | 'review' | 'notify'
}

export type EnhancedRiskResult = RiskResult

export interface ConsortiumRecord {
  id: string
  institutionId: string
  signalType: 'BENEFICIARY_RISK' | 'DEVICE_REPUTATION' | 'IP_THREAT' | 'KNOWN_SCAM_ACCOUNT' | 'MULE_NETWORK_SIGNAL'
  entityType: 'BENEFICIARY' | 'DEVICE' | 'IP' | 'ACCOUNT' | 'TRANSACTION_PATTERN'
  pseudonymousIdentifier: string
  pseudonymizedIdentifier?: string
  hashedIdentifier: string
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
  status: 'ACTIVE' | 'RESOLVED' | 'UNDER_REVIEW'
  tags: string[]
  firstSeen: string
  lastSeen: string
  reportedAt: string
  reportCount: number
  contributingInstitutions: string[]
  notes?: string
}

export type HumanValidationDecision = 'CONFIRMED_FRAUD' | 'LEGITIMATE' | 'FALSE_POSITIVE' | 'NEEDS_FURTHER_INVESTIGATION'

export interface HumanValidation {
  status: HumanValidationDecision
  validatedBy: string
  validatedAt: string
  notes?: string
  submittedToConsortium?: boolean
  reportedEntity?: {
    type: 'BENEFICIARY' | 'DEVICE' | 'IP' | 'ACCOUNT'
    identifier: string
    displayToken?: string
  }
}

export interface MLFeedbackSample {
  id: string
  txnId: string
  modelPredictionScore: number
  modelStatus: 'SAFE' | 'SUSPICIOUS' | 'FRAUD'
  humanLabel: HumanValidationDecision
  sampleType: 'FALSE_NEGATIVE' | 'FALSE_POSITIVE' | 'TRUE_POSITIVE' | 'TRUE_NEGATIVE'
  featuresSummary?: {
    amount: number
    location: string
    userId: string
    beneficiaryId?: string
    device?: string
  }
  submittedToConsortium: boolean
  createdAt: string
}

export interface FeedbackStats {
  totalReviewed: number
  falseNegatives: number
  falsePositives: number
  truePositives: number
  trueNegatives: number
  pendingReviewCount: number
}

export interface ConsortiumStats {
  totalSignalsIndexed: number
  participatingInstitutions: number
  highRiskIndicators: number
  recentReportsCount: number
  activeThreatClusters: number
  lastSyncTimestamp: string
  totalMatchesEncountered?: number
}
