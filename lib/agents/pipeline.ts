import type { Transaction, ProcessedTransaction, AgentStep, DeviceTelemetry } from '@/lib/types'
import { detectiveAgent } from './detective-agent'
import { researchAgent } from './research-agent'
import { intelligenceAgent } from './intelligence-agent'
import { socialEngineeringAgent } from './social-engineering-agent'
import { telecomAgent } from './telecom-agent'
import { enhancedRiskEngine } from './risk-engine'
import { reportingAgent } from './reporting-agent'
import { transactionStore } from '@/lib/store'

export interface PipelineResult {
  transaction: ProcessedTransaction
  steps: AgentStep[]
}

export async function processTransaction(
  transaction: Transaction,
  telemetry?: DeviceTelemetry,
  onStepComplete?: (step: AgentStep) => void
): Promise<PipelineResult> {
  const steps: AgentStep[] = [
    { name: 'Intelligence Agent', status: 'pending' },
    { name: 'Social Engineering Agent', status: 'pending' },
    { name: 'Detective Agent', status: 'pending' },
    { name: 'Research Agent', status: 'pending' },
    { name: 'Risk Engine', status: 'pending' },
    { name: 'Reporting Agent', status: 'pending' },
  ]

  const allTransactions = transactionStore.getAllTransactions()

  // Step 1: Intelligence Agent (Privacy-Preserving Consortium Lookup)
  steps[0].status = 'processing'
  onStepComplete?.(steps[0])
  await simulateDelay(60)
  const intelligenceResult = intelligenceAgent(transaction)
  steps[0].status = 'complete'
  steps[0].result = intelligenceResult
  onStepComplete?.(steps[0])

  // Step 2: Social Engineering Agent (Interaction Metadata & Telephony Analysis)
  steps[1].status = 'processing'
  onStepComplete?.(steps[1])
  await simulateDelay(50)
  const socialEngineeringResult = socialEngineeringAgent(transaction)
  const telecomResult = telemetry ? telecomAgent(telemetry) : undefined
  steps[1].status = 'complete'
  steps[1].result = socialEngineeringResult
  onStepComplete?.(steps[1])

  // Step 3: Detective Agent (Active Rules Evaluation)
  steps[2].status = 'processing'
  onStepComplete?.(steps[2])
  await simulateDelay(70)
  const detectiveResult = detectiveAgent(
    transaction,
    allTransactions,
    intelligenceResult,
    socialEngineeringResult
  )
  steps[2].status = 'complete'
  steps[2].result = detectiveResult
  onStepComplete?.(steps[2])

  // Step 4: Research Agent (Behavioral baseline & network graph)
  steps[3].status = 'processing'
  onStepComplete?.(steps[3])
  await simulateDelay(80)
  const researchResult = researchAgent(transaction, allTransactions)
  steps[3].status = 'complete'
  steps[3].result = researchResult
  onStepComplete?.(steps[3])

  // Step 5: Enhanced Risk Engine with Multi-Signal Fusion & Escalation
  steps[4].status = 'processing'
  onStepComplete?.(steps[4])
  await simulateDelay(80)
  const riskResult = enhancedRiskEngine(
    transaction,
    detectiveResult,
    researchResult,
    allTransactions,
    intelligenceResult,
    socialEngineeringResult,
    undefined,
    telecomResult
  )
  steps[4].status = 'complete'
  steps[4].result = riskResult
  onStepComplete?.(steps[4])

  // Step 6: Reporting Agent
  steps[5].status = 'processing'
  onStepComplete?.(steps[5])
  await simulateDelay(60)
  const report = reportingAgent(
    transaction,
    detectiveResult,
    researchResult,
    riskResult,
    intelligenceResult,
    socialEngineeringResult
  )
  steps[5].status = 'complete'
  steps[5].result = report
  onStepComplete?.(steps[5])

  // Combine rule flags
  const combinedFlags = Array.from(new Set([
    ...detectiveResult.ruleFlags,
    ...(telecomResult?.ruleFlags || [])
  ]))

  // Create processed transaction
  const processedTransaction: ProcessedTransaction = {
    ...transaction,
    telemetry,
    ruleFlags: combinedFlags,
    riskScore: riskResult.riskScore,
    status: riskResult.status,
    report,
    processedAt: new Date().toISOString(),
    agentResults: {
      detective: detectiveResult,
      research: researchResult,
      risk: riskResult,
      telecom: telecomResult,
      intelligence: intelligenceResult,
      socialEngineering: socialEngineeringResult,
    },
    multiSignalEscalation: riskResult.multiSignalEscalation,
    signals: riskResult.signals,
  }

  transactionStore.addTransaction(processedTransaction)

  return {
    transaction: processedTransaction,
    steps,
  }
}

function simulateDelay(ms: number): Promise<void> {
  return Promise.resolve()
}

export async function processBatchTransactions(
  transactions: Transaction[]
): Promise<ProcessedTransaction[]> {
  const results: ProcessedTransaction[] = []
  
  for (const txn of transactions) {
    const { transaction } = await processTransaction(txn)
    results.push(transaction)
  }
  
  return results
}
