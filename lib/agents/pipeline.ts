import type { Transaction, ProcessedTransaction, AgentStep, DeviceTelemetry } from '@/lib/types'
import { detectiveAgent } from './detective-agent'
import { researchAgent } from './research-agent'
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
    { name: 'Detective Agent', status: 'pending' },
    { name: 'Research Agent', status: 'pending' },
    { name: 'Telecom & NLP Agent', status: 'pending' },
    { name: 'Risk Engine', status: 'pending' },
    { name: 'Reporting Agent', status: 'pending' },
  ]

  // Get existing transactions for analysis
  const allTransactions = transactionStore.getAllTransactions()

  // Step 1: Detective Agent
  steps[0].status = 'processing'
  onStepComplete?.(steps[0])
  
  await simulateDelay(100)
  const detectiveResult = detectiveAgent(transaction, allTransactions)
  steps[0].status = 'complete'
  steps[0].result = detectiveResult
  onStepComplete?.(steps[0])

  // Step 2: Research Agent
  steps[1].status = 'processing'
  onStepComplete?.(steps[1])
  
  await simulateDelay(150)
  const researchResult = researchAgent(transaction, allTransactions)
  steps[1].status = 'complete'
  steps[1].result = researchResult
  onStepComplete?.(steps[1])

  // Step 3: Telecom & Social Engineering NLP Agent
  steps[2].status = 'processing'
  onStepComplete?.(steps[2])

  await simulateDelay(100)
  const telecomResult = telecomAgent(telemetry)
  steps[2].status = 'complete'
  steps[2].result = telecomResult as any
  onStepComplete?.(steps[2])

  // Step 4: Enhanced Risk Engine with ML Ensemble
  steps[3].status = 'processing'
  onStepComplete?.(steps[3])
  
  await simulateDelay(80)
  const riskResult = enhancedRiskEngine(transaction, detectiveResult, researchResult, telecomResult, allTransactions)
  steps[3].status = 'complete'
  steps[3].result = riskResult
  onStepComplete?.(steps[3])

  // Step 5: Reporting Agent
  steps[4].status = 'processing'
  onStepComplete?.(steps[4])
  
  await simulateDelay(100)
  const report = reportingAgent(transaction, detectiveResult, researchResult, riskResult, telecomResult)
  steps[4].status = 'complete'
  steps[4].result = report
  onStepComplete?.(steps[4])

  // Combine rule flags
  const combinedFlags = Array.from(new Set([...detectiveResult.ruleFlags, ...(telecomResult.ruleFlags || [])]))

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
      telecom: telecomResult,
      risk: riskResult,
    },
  }

  // Store in database
  transactionStore.addTransaction(processedTransaction)

  return {
    transaction: processedTransaction,
    steps,
  }
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
