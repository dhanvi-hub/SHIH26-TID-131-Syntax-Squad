import type { Transaction, ProcessedTransaction, AgentStep } from '@/lib/types'
import { detectiveAgent } from './detective-agent'
import { researchAgent } from './research-agent'
import { riskEngine } from './risk-engine'
import { reportingAgent } from './reporting-agent'
import { transactionStore } from '@/lib/store'

export interface PipelineResult {
  transaction: ProcessedTransaction
  steps: AgentStep[]
}

export async function processTransaction(
  transaction: Transaction,
  onStepComplete?: (step: AgentStep) => void
): Promise<PipelineResult> {
  const steps: AgentStep[] = [
    { name: 'Detective Agent', status: 'pending' },
    { name: 'Research Agent', status: 'pending' },
    { name: 'Risk Engine', status: 'pending' },
    { name: 'Reporting Agent', status: 'pending' },
  ]

  // Get existing transactions for analysis
  const allTransactions = transactionStore.getAllTransactions()

  // Step 1: Detective Agent
  steps[0].status = 'processing'
  onStepComplete?.(steps[0])
  
  await simulateDelay(100) // Simulate processing time
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

  // Step 3: Risk Engine
  steps[2].status = 'processing'
  onStepComplete?.(steps[2])
  
  await simulateDelay(80)
  const riskResult = riskEngine(detectiveResult, researchResult)
  steps[2].status = 'complete'
  steps[2].result = riskResult
  onStepComplete?.(steps[2])

  // Step 4: Reporting Agent
  steps[3].status = 'processing'
  onStepComplete?.(steps[3])
  
  await simulateDelay(100)
  const report = reportingAgent(transaction, detectiveResult, researchResult, riskResult)
  steps[3].status = 'complete'
  steps[3].result = report
  onStepComplete?.(steps[3])

  // Create processed transaction
  const processedTransaction: ProcessedTransaction = {
    ...transaction,
    ruleFlags: detectiveResult.ruleFlags,
    riskScore: riskResult.riskScore,
    status: riskResult.status,
    report,
    processedAt: new Date().toISOString(),
    agentResults: {
      detective: detectiveResult,
      research: researchResult,
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
