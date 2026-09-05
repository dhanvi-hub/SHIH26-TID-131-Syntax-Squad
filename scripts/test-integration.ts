import { processTransaction } from '../lib/agents/pipeline'
import { generateDemoScenario } from '../lib/agents/transaction-generator'
import { transactionStore } from '../lib/store'

async function runTests() {
  console.log('========================================')
  console.log('RUNNING END-TO-END VERIFICATION SUITE')
  console.log('========================================\n')

  // Test 1: Scenario A (Normal)
  console.log('--- TEST 1: SCENARIO A (Normal Transaction) ---')
  const txnA = generateDemoScenario('A')
  const resA = await processTransaction(txnA)
  console.log(`Status: ${resA.transaction.status} (Score: ${resA.transaction.riskScore})`)
  console.log(`Rules Triggered: ${resA.transaction.ruleFlags.join(', ') || 'None'}`)
  console.log(`Consortium Matched: ${resA.transaction.agentResults?.intelligence?.matched}`)
  console.log(`Social Eng Detected: ${resA.transaction.agentResults?.socialEngineering?.detected}`)
  console.log(`Escalation Enabled: ${resA.transaction.multiSignalEscalation?.enabled}`)
  if (resA.transaction.status !== 'SAFE') {
    throw new Error(`Scenario A should be SAFE, got ${resA.transaction.status}`)
  }
  console.log('TEST 1 PASSED\n')

  // Test 2: Scenario B (High Amount Rule)
  console.log('--- TEST 2: SCENARIO B (High Amount Rule) ---')
  const txnB = generateDemoScenario('B')
  const resB = await processTransaction(txnB)
  console.log(`Status: ${resB.transaction.status} (Score: ${resB.transaction.riskScore})`)
  console.log(`Rules Triggered: ${resB.transaction.ruleFlags.join(', ')}`)
  if (!resB.transaction.ruleFlags.includes('VERY_HIGH_AMOUNT')) {
    throw new Error('Scenario B should flag VERY_HIGH_AMOUNT')
  }
  console.log('TEST 2 PASSED\n')

  // Test 3: Scenario C (Consortium Match + ML Normal -> Multi-Signal Escalation)
  console.log('--- TEST 3: SCENARIO C (Consortium Match -> Multi-Signal Escalation) ---')
  const txnC = generateDemoScenario('C')
  const resC = await processTransaction(txnC)
  console.log(`Status: ${resC.transaction.status} (Score: ${resC.transaction.riskScore})`)
  console.log(`ML Risk: ${resC.transaction.signals?.mlRisk}`)
  console.log(`External Intel Risk: ${resC.transaction.signals?.externalIntelligenceRisk}`)
  console.log(`Escalation: ${resC.transaction.multiSignalEscalation?.enabled} - ${resC.transaction.multiSignalEscalation?.reason}`)
  if (!resC.transaction.multiSignalEscalation?.enabled) {
    throw new Error('Scenario C should trigger Multi-Signal Escalation')
  }
  if (resC.transaction.status === 'SAFE') {
    throw new Error('Scenario C should escalate from SAFE to SUSPICIOUS or FRAUD')
  }
  console.log('TEST 3 PASSED\n')

  // Test 4: Scenario D (Social Engineering Scam Urgency)
  console.log('--- TEST 4: SCENARIO D (Social Engineering Coercion) ---')
  const txnD = generateDemoScenario('D')
  const resD = await processTransaction(txnD)
  console.log(`Status: ${resD.transaction.status} (Score: ${resD.transaction.riskScore})`)
  console.log(`Social Eng Risk: ${resD.transaction.signals?.socialEngineeringRisk}`)
  console.log(`Patterns: ${resD.transaction.agentResults?.socialEngineering?.detectedPatterns.join(', ')}`)
  if (!resD.transaction.agentResults?.socialEngineering?.detected) {
    throw new Error('Scenario D should detect social engineering')
  }
  console.log('TEST 4 PASSED\n')

  // Test 5: Scenario E (Dual Threat: Consortium + Fake KYC)
  console.log('--- TEST 5: SCENARIO E (Dual Threat Consortium + Fake KYC) ---')
  const txnE = generateDemoScenario('E')
  const resE = await processTransaction(txnE)
  console.log(`Status: ${resE.transaction.status} (Score: ${resE.transaction.riskScore})`)
  console.log(`Intel Matched: ${resE.transaction.agentResults?.intelligence?.matched}`)
  console.log(`Social Eng Detected: ${resE.transaction.agentResults?.socialEngineering?.detected}`)
  if (resE.transaction.status !== 'FRAUD') {
    throw new Error(`Scenario E should be FRAUD, got ${resE.transaction.status}`)
  }
  console.log('TEST 5 PASSED\n')

  // Test 6: Strict Rule Toggle Verification (Single Source of Truth)
  console.log('--- TEST 6: RULE TOGGLE VERIFICATION (rule-019 OFF / ON) ---')
  // 6a: Toggle rule-019 OFF in store
  transactionStore.updateRule('rule-019', false)
  console.log('Set rule-019 isActive = false in transactionStore')
  const resC_Disabled = await processTransaction(generateDemoScenario('C'))
  console.log(`Triggered rules when rule-019 is OFF: [${resC_Disabled.transaction.ruleFlags.join(', ')}]`)
  if (resC_Disabled.transaction.ruleFlags.includes('KNOWN_SCAM_BENEFICIARY')) {
    throw new Error('rule-019 MUST NOT trigger when disabled')
  }
  
  // 6b: Toggle rule-019 ON in store
  transactionStore.updateRule('rule-019', true)
  console.log('Set rule-019 isActive = true in transactionStore')
  const resC_Enabled = await processTransaction(generateDemoScenario('C'))
  console.log(`Triggered rules when rule-019 is ON: [${resC_Enabled.transaction.ruleFlags.join(', ')}]`)
  if (!resC_Enabled.transaction.ruleFlags.includes('KNOWN_SCAM_BENEFICIARY')) {
    throw new Error('rule-019 MUST trigger when active')
  }
  console.log('TEST 6 PASSED\n')

  // Test 7: Normalization Consistency
  console.log('--- TEST 7: NORMALIZATION CONSISTENCY ---')
  const { normalizeIdentifier, createPseudonymousIdentifier } = await import('../lib/intelligence/privacy-engine')
  const norm1 = normalizeIdentifier('  ben-scam-7723  ', 'BENEFICIARY')
  const norm2 = normalizeIdentifier('BEN-SCAM-7723', 'beneficiary')
  console.log(`Normalized variations: "${norm1}" vs "${norm2}"`)
  if (norm1 !== 'BEN-SCAM-7723' || norm2 !== 'BEN-SCAM-7723') {
    throw new Error('Normalization failed to standardize case and whitespace')
  }
  console.log('TEST 7 PASSED\n')

  // Test 8: Deterministic Salted Pseudonymous Hashing
  console.log('--- TEST 8: DETERMINISTIC PSEUDONYMOUS HASHING ---')
  const tokenA = createPseudonymousIdentifier('  ben-scam-7723  ', 'BENEFICIARY')
  const tokenB = createPseudonymousIdentifier('BEN-SCAM-7723', 'beneficiary')
  const tokenDiff = createPseudonymousIdentifier('BEN-DIFF-1234', 'beneficiary')
  console.log(`Hash A: ${tokenA.hash.slice(0, 16)}... Token: ${tokenA.displayToken}`)
  console.log(`Hash B: ${tokenB.hash.slice(0, 16)}... Token: ${tokenB.displayToken}`)
  if (tokenA.hash !== tokenB.hash) {
    throw new Error('Identical identifiers with whitespace/case differences must produce identical hashes')
  }
  if (tokenA.hash === tokenDiff.hash) {
    throw new Error('Distinct identifiers must produce distinct hashes')
  }
  console.log('TEST 8 PASSED\n')

  // Test 9: Consortium Lookup Service (Match vs Non-Match)
  console.log('--- TEST 9: CONSORTIUM LOOKUP SERVICE ---')
  const { queryConsortium } = await import('../lib/intelligence/cross-institution-db')
  const matchSuccess = queryConsortium('BENEFICIARY', 'BEN-SCAM-7723')
  console.log(`Query BEN-SCAM-7723: Matched=${!!matchSuccess}, Institutions=${matchSuccess?.reportingInstitutionsCount}, Risk=${matchSuccess?.riskLevel}`)
  if (!matchSuccess || matchSuccess.riskLevel !== 'CRITICAL') {
    throw new Error('BEN-SCAM-7723 must match seeded CRITICAL consortium threat')
  }
  const matchClean = queryConsortium('BENEFICIARY', 'BEN-CLEAN-RANDOM-001')
  console.log(`Query BEN-CLEAN-RANDOM-001: Matched=${!!matchClean}`)
  if (matchClean !== null) {
    throw new Error('Unknown clean beneficiary must return null')
  }
  console.log('TEST 9 PASSED\n')

  // Test 10: Dynamic Multi-Institution Corroboration & Aggregation
  console.log('--- TEST 10: MULTI-INSTITUTION REPORT AGGREGATION ---')
  const { addOrUpdateConsortiumRecord } = await import('../lib/intelligence/cross-institution-db')
  const testBeneficiary = 'BEN-TEST-MULE-2026'
  
  // Bank A reports
  const rep1 = addOrUpdateConsortiumRecord({
    institutionId: 'BANK_A',
    entityType: 'BENEFICIARY',
    identifier: testBeneficiary,
    riskScore: 80,
    confidence: 0.85,
    signalType: 'BENEFICIARY_RISK',
    tags: ['first_report']
  })
  console.log(`First report by Bank A: isNew=${rep1.isNew}, Banks=${rep1.record.contributingInstitutions.join(', ')}, Conf=${rep1.record.confidence}`)
  if (!rep1.isNew || rep1.record.contributingInstitutions.length !== 1) {
    throw new Error('First report should create a new record with 1 institution')
  }

  // Bank C corroborates
  const rep2 = addOrUpdateConsortiumRecord({
    institutionId: 'BANK_C',
    entityType: 'BENEFICIARY',
    identifier: testBeneficiary,
    riskScore: 88,
    confidence: 0.90,
    signalType: 'BENEFICIARY_RISK',
    tags: ['second_report', 'layering']
  })
  console.log(`Second report by Bank C: isNew=${rep2.isNew}, Banks=${rep2.record.contributingInstitutions.join(', ')}, Reports=${rep2.record.reportCount}, Conf=${rep2.record.confidence}`)
  if (rep2.isNew) {
    throw new Error('Second report of same entity must aggregate existing record, not create duplicate')
  }
  if (rep2.record.contributingInstitutions.length !== 2) {
    throw new Error('Record must list 2 contributing institutions after corroboration')
  }
  if (rep2.record.reportCount !== 2) {
    throw new Error('Report count must be 2')
  }
  if (rep2.record.confidence <= rep1.record.confidence) {
    throw new Error('Corroboration from independent bank must increase confidence')
  }
  console.log('TEST 10 PASSED\n')

  // Test 11: Privacy Protection (No Raw Cross-Bank PII Leaked)
  console.log('--- TEST 11: PRIVACY PRESERVATION (ZERO RAW PII EXPOSURE) ---')
  const lookedUp = queryConsortium('BENEFICIARY', testBeneficiary)
  console.log(`Inspecting shared intelligence record for ${testBeneficiary}:`)
  console.log(`- pseudonymizedIdentifier: ${lookedUp?.pseudonymizedIdentifier}`)
  console.log(`- raw text present in tags: ${JSON.stringify(lookedUp?.tags)}`)
  if (!lookedUp?.pseudonymizedIdentifier || lookedUp.pseudonymizedIdentifier.includes(testBeneficiary)) {
    throw new Error('Shared intelligence must NOT expose the raw unmasked identifier')
  }
  console.log('TEST 11 PASSED\n')

  // Test 12: Human Validation & ML Retraining Feedback Dataset
  console.log('--- TEST 12: HUMAN VALIDATION & ML FEEDBACK DATASET ---')
  const dummyTxn = {
    ...resA.transaction,
    txn_id: `TXN-VALIDATE-TEST-${Date.now()}`
  }
  transactionStore.addTransaction(dummyTxn)
  
  const validated = transactionStore.updateTransactionValidation(dummyTxn.txn_id, {
    status: 'CONFIRMED_FRAUD',
    validatedBy: 'Test Senior Analyst',
    validatedAt: new Date().toISOString(),
    notes: 'Caught via manual inspection',
    submittedToConsortium: true
  })
  
  console.log(`Transaction validation attached: ${validated?.humanValidation?.status}`)
  const feedbackSamples = transactionStore.getFeedbackSamples()
  const feedbackStats = transactionStore.getFeedbackStats()
  console.log(`Feedback dataset sample count: ${feedbackSamples.length}`)
  console.log(`Feedback Stats: False Negatives=${feedbackStats.falseNegatives}, True Positives=${feedbackStats.truePositives}`)
  
  const recentSample = feedbackSamples.find(s => s.txnId === dummyTxn.txn_id)
  if (!recentSample) {
    throw new Error('Validated transaction must produce an ML feedback sample')
  }
  // Because resA was SAFE (low ML score), confirming fraud makes it a FALSE_NEGATIVE sample!
  if (recentSample.sampleType !== 'FALSE_NEGATIVE') {
    throw new Error(`Low-risk model prediction with CONFIRMED_FRAUD human label must be classified as FALSE_NEGATIVE, got ${recentSample.sampleType}`)
  }
  console.log('TEST 12 PASSED\n')

  // Test 13: Dynamic Consortium Stats
  console.log('--- TEST 13: DYNAMIC CONSORTIUM STATS ---')
  const { getConsortiumStats } = await import('../lib/intelligence/cross-institution-db')
  const stats = getConsortiumStats()
  console.log(`Total Indexed: ${stats.totalSignalsIndexed}`)
  console.log(`Participating Banks: ${stats.participatingInstitutions}`)
  console.log(`High-Risk Indicators: ${stats.highRiskIndicators}`)
  if (stats.totalSignalsIndexed < 8) {
    throw new Error('Indexed signals should reflect all seeds plus newly reported records')
  }
  if (stats.participatingInstitutions !== 4) {
    throw new Error('Must list 4 participating institutions')
  }
  console.log('TEST 13 PASSED\n')

  // Test 14: Safety Fallback Consensus Preservation
  console.log('--- TEST 14: SAFETY FALLBACK CONSENSUS PRESERVATION ---')
  // Scenario with ML=LOW (< 35), but 2 independent non-ML signals (Consortium Match + Scam Pressure)
  const txnConsensus = {
    txn_id: `TXN-CONSENSUS-${Date.now()}`,
    user_id: 'USR001',
    amount: 3200, // Very low/normal amount -> ML predicts low risk
    location: 'Mumbai, Maharashtra',
    ip: '103.21.124.5',
    device: 'mobile' as const,
    timestamp: new Date().toISOString(),
    beneficiary_id: 'BEN-MULE-8801', // Consortium threat match (84/100)
    socialEngineering: {
      recent_call: true,
      time_since_call: 2,
      call_duration: 240,
      caller_risk_score: 92,
      caller_known: false,
      detected_patterns: ['PAYMENT_URGENCY' as const],
    }
  }
  const resConsensus = await processTransaction(txnConsensus)
  console.log('Signals:', resConsensus.transaction.signals)
  console.log(`ML Score: ${resConsensus.transaction.signals?.mlRisk} (should be low)`)
  console.log(`Intel Risk: ${resConsensus.transaction.signals?.externalIntelligenceRisk}, Social Eng: ${resConsensus.transaction.signals?.socialEngineeringRisk}`)
  console.log(`Multi-Signal Fallback Active: ${resConsensus.transaction.multiSignalEscalation?.enabled}`)
  console.log(`Final Escalated Score: ${resConsensus.transaction.riskScore}, Status: ${resConsensus.transaction.status}`)
  if (!resConsensus.transaction.multiSignalEscalation?.enabled) {
    throw new Error('Multi-signal fallback must activate when 2 independent signals indicate threat despite low ML score')
  }
  if (resConsensus.transaction.status !== 'FRAUD') {
    throw new Error(`Escalated consensus must yield FRAUD status, got ${resConsensus.transaction.status}`)
  }
  console.log('TEST 14 PASSED\n')

  console.log('========================================================')
  console.log('ALL 14 COMPREHENSIVE VERIFICATION SUITE TESTS PASSED!')
  console.log('========================================================')
}

runTests().catch(err => {
  console.error('Test run error:', err)
  process.exit(1)
})
