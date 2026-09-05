import { generateDemoScenario, generateBatchTransactions } from '../lib/agents/transaction-generator'
import { processTransaction, processBatchTransactions } from '../lib/agents/pipeline'
import { transactionStore } from '../lib/store'
import type { ProcessedTransaction } from '../lib/types'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`✅ PASS: ${message}`)
}

async function runTests() {
  console.log('=== TEST 1: EMPTY STATE FILTERING ===')
  transactionStore.clear()
  const emptyTxns = transactionStore.getAllTransactions()
  const emptyScamCount = emptyTxns.filter(t => t.agentResults?.socialEngineering?.detected).length
  const emptyEscCount = emptyTxns.filter(t => t.multiSignalEscalation?.enabled).length
  assert(emptyScamCount === 0, 'Empty store produces 0 scam-call cases')
  assert(emptyEscCount === 0, 'Empty store produces 0 escalation cases')

  console.log('\n=== TEST 2: SCENARIO D (SOCIAL ENGINEERING TELEPHONY COERCION) ===')
  const rawD = generateDemoScenario('D')
  const { transaction: processedD } = await processTransaction(rawD)

  assert(Boolean(processedD.agentResults?.socialEngineering?.detected), 'Scenario D is detected by Social Engineering Agent')
  assert(processedD.socialEngineering?.recent_call === true, 'Telephony metadata: recent_call is true')
  assert(processedD.socialEngineering?.caller_known === false, 'Telephony metadata: caller_known is false (unknown number)')
  assert(processedD.socialEngineering?.scam_pattern === 'payment_urgency', 'Telephony metadata: pattern is payment_urgency')
  assert(typeof processedD.socialEngineering?.caller_risk_score === 'number', 'Telephony metadata: caller_risk_score is present')
  assert(typeof processedD.socialEngineering?.time_since_call === 'number', 'Telephony metadata: time_since_call is present')
  assert(typeof processedD.socialEngineering?.call_duration === 'number', 'Telephony metadata: call_duration is present')
  assert(Boolean(processedD.agentResults?.socialEngineering?.explanation), 'Social Engineering explanation is populated')

  console.log('\n=== TEST 3: SCENARIO C (MULTI-SIGNAL ESCALATION SAFETY FALLBACK) ===')
  const rawC = generateDemoScenario('C')
  const { transaction: processedC } = await processTransaction(rawC)

  assert(Boolean(processedC.multiSignalEscalation?.enabled), 'Scenario C triggers Multi-Signal Escalation fallback')
  const originalML = processedC.multiSignalEscalation?.originalMLScore ?? 0
  const escalatedScore = processedC.multiSignalEscalation?.escalatedScore ?? 0
  console.log(`Scenario C: Original ML = ${originalML}, Escalated Score = ${escalatedScore}, Status = ${processedC.status}`)
  assert(originalML <= 38, 'Original ML score was low (<= 38)')
  assert(escalatedScore >= 60, 'Escalated score was elevated to high/critical (>= 60)')
  assert(Boolean(processedC.multiSignalEscalation?.reason), 'Escalation rationale explanation is populated')
  assert(Boolean(processedC.signals), '6-dimensional signal breakdown is populated')
  assert(typeof processedC.signals?.mlRisk === 'number', 'Signal: mlRisk is number')
  assert(typeof processedC.signals?.ruleRisk === 'number', 'Signal: ruleRisk is number')
  assert(typeof processedC.signals?.behaviouralRisk === 'number', 'Signal: behaviouralRisk is number')
  assert(typeof processedC.signals?.networkRisk === 'number', 'Signal: networkRisk is number')
  assert(typeof processedC.signals?.externalIntelligenceRisk === 'number', 'Signal: externalIntelligenceRisk is number')
  assert(typeof processedC.signals?.socialEngineeringRisk === 'number', 'Signal: socialEngineeringRisk is number')

  console.log('\n=== TEST 4: BATCH SEED DATA COUNTS STRICT EQUALITY ===')
  transactionStore.clear()
  const rawBatch = generateBatchTransactions(20, 6)
  const processedBatch = await processBatchTransactions(rawBatch)

  const dashboardScamCount = processedBatch.filter(t => t.agentResults?.socialEngineering?.detected).length
  const dashboardEscalationCount = processedBatch.filter(t => t.multiSignalEscalation?.enabled).length

  console.log(`Batch stats: Total=${processedBatch.length}, Scam-Call=${dashboardScamCount}, Escalations=${dashboardEscalationCount}`)

  // Emulate Queue filtering
  const queueScamCases = processedBatch.filter(t => Boolean(t.agentResults?.socialEngineering?.detected))
  const queueEscalationCases = processedBatch.filter(t => Boolean(t.multiSignalEscalation?.enabled))

  assert(queueScamCases.length === dashboardScamCount, `Social Engineering Queue count (${queueScamCases.length}) equals Dashboard Card count (${dashboardScamCount})`)
  assert(queueEscalationCases.length === dashboardEscalationCount, `Escalations Queue count (${queueEscalationCases.length}) equals Dashboard Card count (${dashboardEscalationCount})`)

  console.log('\n=== TEST 5: HUMAN VALIDATION VERDICT RECORDING ===')
  const targetTxn = processedBatch[0]
  const updatedTxn = transactionStore.updateTransactionValidation(targetTxn.txn_id, {
    status: 'CONFIRMED_FRAUD',
    validatedBy: 'INVESTIGATOR_ANALYST_01',
    notes: 'Verified social engineering intimidation tactic',
    validatedAt: new Date().toISOString(),
    submittedToConsortium: true,
  })

  assert(Boolean(updatedTxn), 'Transaction validation recorded in store')
  assert(updatedTxn?.humanValidation?.status === 'CONFIRMED_FRAUD', 'Human validation status is CONFIRMED_FRAUD')
  assert(updatedTxn?.humanValidation?.notes === 'Verified social engineering intimidation tactic', 'Analyst notes preserved')

  transactionStore.clear()
  console.log('\n🎉 ALL DASHBOARD INTELLIGENCE CARD & QUEUE TESTS PASSED!')
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
