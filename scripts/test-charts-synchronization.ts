import { computeRiskDistribution, computeTimeSeriesData } from '../components/dashboard/charts'
import { generateBatchTransactions } from '../lib/agents/transaction-generator'
import { transactionStore } from '../lib/store'
import type { ProcessedTransaction } from '../lib/types'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`✅ PASS: ${message}`)
}

console.log('=== TEST 1: RISK DISTRIBUTION BOUNDARY CONDITIONS ===')
function createMockTxn(id: string, riskScore: number, status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD', timestamp?: string): ProcessedTransaction {
  return {
    txn_id: id,
    user_id: 'USR001',
    amount: 1000,
    location: 'Mumbai, Maharashtra',
    ip: '103.21.124.5',
    device: 'mobile',
    timestamp: timestamp || new Date().toISOString(),
    riskScore,
    status,
    ruleFlags: [],
    report: 'Test report',
    processedAt: new Date().toISOString(),
    agentResults: {} as any,
  }
}

const boundaryTestTxns: ProcessedTransaction[] = [
  createMockTxn('T-0', 0, 'SAFE'),
  createMockTxn('T-20', 20, 'SAFE'),
  createMockTxn('T-21', 21, 'SAFE'),
  createMockTxn('T-40', 40, 'SUSPICIOUS'),
  createMockTxn('T-41', 41, 'SUSPICIOUS'),
  createMockTxn('T-60', 60, 'FRAUD'),
  createMockTxn('T-61', 61, 'FRAUD'),
  createMockTxn('T-80', 80, 'FRAUD'),
  createMockTxn('T-81', 81, 'FRAUD'),
  createMockTxn('T-100', 100, 'FRAUD'),
]

const riskBuckets = computeRiskDistribution(boundaryTestTxns)
console.log('Risk Buckets computed:', riskBuckets)

assert(riskBuckets.find(b => b.range === '0-20')?.count === 2, 'Bucket 0-20 has 2 transactions (scores 0 and 20)')
assert(riskBuckets.find(b => b.range === '21-40')?.count === 2, 'Bucket 21-40 has 2 transactions (scores 21 and 40)')
assert(riskBuckets.find(b => b.range === '41-60')?.count === 2, 'Bucket 41-60 has 2 transactions (scores 41 and 60)')
assert(riskBuckets.find(b => b.range === '61-80')?.count === 2, 'Bucket 61-80 has 2 transactions (scores 61 and 80)')
assert(riskBuckets.find(b => b.range === '81-100')?.count === 2, 'Bucket 81-100 has 2 transactions (scores 81 and 100)')
const totalCount = riskBuckets.reduce((sum, b) => sum + b.count, 0)
assert(totalCount === boundaryTestTxns.length, `Total bucket sum (${totalCount}) equals input transactions (${boundaryTestTxns.length})`)

console.log('\n=== TEST 2: EMPTY STATE HANDLING ===')
const emptyRisk = computeRiskDistribution([])
assert(emptyRisk.every(b => b.count === 0), 'Empty transactions array produces all 0 counts in risk distribution')
const emptyTimeSeries = computeTimeSeriesData([])
assert(emptyTimeSeries.length === 0, 'Empty transactions array produces 0 time series points')

console.log('\n=== TEST 3: SEED DATA RECENT TIME DISTRIBUTION ===')
const seededBatch = generateBatchTransactions(20, 6)
assert(seededBatch.length === 20, 'generateBatchTransactions produces 20 transactions')
const timestamps = seededBatch.map(t => new Date(t.timestamp).getTime())
const minTime = Math.min(...timestamps)
const maxTime = Math.max(...timestamps)
const timeSpanHours = (maxTime - minTime) / (3600 * 1000)
console.log(`Seeded batch time span: ${timeSpanHours.toFixed(2)} hours (min: ${new Date(minTime).toISOString()}, max: ${new Date(maxTime).toISOString()})`)
assert(timeSpanHours > 3 && timeSpanHours <= 6.5, `Seeded timestamps are spread across recent hours (~${timeSpanHours.toFixed(1)}h), eliminating the 11-hour flatline`)

console.log('\n=== TEST 4: TIME SERIES BUCKETING & CONSERVATION ===')
const processedSeedTxns: ProcessedTransaction[] = seededBatch.map((t, idx) => ({
  ...t,
  riskScore: 10 + (idx * 4),
  status: idx % 3 === 0 ? 'FRAUD' : idx % 3 === 1 ? 'SUSPICIOUS' : 'SAFE',
  ruleFlags: [],
  report: 'Test',
  processedAt: new Date().toISOString(),
  agentResults: {} as any,
}))

const timeSeries = computeTimeSeriesData(processedSeedTxns)
console.log(`Time Series points generated: ${timeSeries.length}`)
assert(timeSeries.length >= 4, 'Generates smooth multi-point time series curve')

const sumSafe = timeSeries.reduce((s, b) => s + b.safe, 0)
const sumSuspicious = timeSeries.reduce((s, b) => s + b.suspicious, 0)
const sumFraud = timeSeries.reduce((s, b) => s + b.fraud, 0)
const totalChartTxns = sumSafe + sumSuspicious + sumFraud

const expectedSafe = processedSeedTxns.filter(t => t.status === 'SAFE').length
const expectedSuspicious = processedSeedTxns.filter(t => t.status === 'SUSPICIOUS').length
const expectedFraud = processedSeedTxns.filter(t => t.status === 'FRAUD').length

console.log(`Chart totals: Safe=${sumSafe}, Suspicious=${sumSuspicious}, Fraud=${sumFraud}, Total=${totalChartTxns}`)
console.log(`Input totals: Safe=${expectedSafe}, Suspicious=${expectedSuspicious}, Fraud=${expectedFraud}, Total=${processedSeedTxns.length}`)

assert(sumSafe === expectedSafe, `Chart Safe (${sumSafe}) matches Input Safe (${expectedSafe})`)
assert(sumSuspicious === expectedSuspicious, `Chart Suspicious (${sumSuspicious}) matches Input Suspicious (${expectedSuspicious})`)
assert(sumFraud === expectedFraud, `Chart Fraud (${sumFraud}) matches Input Fraud (${expectedFraud})`)
assert(totalChartTxns === processedSeedTxns.length, `Total transactions conserved across time-series (${totalChartTxns} === ${processedSeedTxns.length})`)

console.log('\n=== TEST 5: TIMEZONE UTC ISO INTEGRITY ===')
assert(timeSeries.every(b => b.timestamp.endsWith('Z')), 'All bucket timestamps are valid UTC ISO-8601 strings ending with Z')
const localLabels = timeSeries.map(b => new Date(b.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
console.log('Sample local time labels on X-axis:', localLabels.slice(0, 5))
assert(localLabels.every(l => l.includes('AM') || l.includes('PM')), 'Local labels format cleanly in 12-hour format')

console.log('\n=== TEST 6: STORE TIME-SERIES & RISK-DISTRIBUTION ===')
transactionStore.clear()
assert(transactionStore.getAllTransactions().length === 0, 'Store clears cleanly')
processedSeedTxns.forEach(t => transactionStore.addTransaction(t))
assert(transactionStore.getAllTransactions().length === 20, 'Store contains 20 transactions')

const storeRisk = transactionStore.getRiskDistribution()
const storeRiskTotal = storeRisk.reduce((s, b) => s + b.count, 0)
assert(storeRiskTotal === 20, `Store risk distribution count (${storeRiskTotal}) equals 20`)

transactionStore.clear()
assert(transactionStore.getAllTransactions().length === 0, 'Store cleared after tests')

console.log('\n🎉 ALL CHART SYNCHRONIZATION AUDIT TESTS PASSED!')
