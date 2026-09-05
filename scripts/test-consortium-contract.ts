import { 
  getAllConsortiumRecords, 
  getConsortiumStats, 
  normalizeConsortiumRecord,
  addOrUpdateConsortiumRecord,
  queryConsortium,
  PARTICIPATING_INSTITUTIONS
} from '../lib/intelligence/cross-institution-db'
import type { ConsortiumRecord } from '../lib/types'

async function runContractAudit() {
  console.log('========================================================')
  console.log('CONSORTIUM DATA CONTRACT & RUNTIME AUDIT TEST')
  console.log('========================================================\n')

  // 1. Audit Seed Records
  console.log('--- TEST 1: AUDITING SEED RECORDS CANONICAL SHAPE ---')
  const records = getAllConsortiumRecords()
  console.log(`Retrieved ${records.length} records from getAllConsortiumRecords().`)
  if (records.length < 8) {
    throw new Error(`Expected at least 8 seeded records, got ${records.length}`)
  }

  for (const r of records) {
    if (!r.id || typeof r.id !== 'string') throw new Error(`Record missing id: ${JSON.stringify(r)}`)
    if (!r.pseudonymousIdentifier || typeof r.pseudonymousIdentifier !== 'string') {
      throw new Error(`Record ${r.id} missing pseudonymousIdentifier!`)
    }
    if (!r.pseudonymizedIdentifier || typeof r.pseudonymizedIdentifier !== 'string') {
      throw new Error(`Record ${r.id} missing pseudonymizedIdentifier alias!`)
    }
    if (!r.signalType || typeof r.signalType !== 'string') {
      throw new Error(`Record ${r.id} missing signalType!`)
    }
    if (!Array.isArray(r.tags)) {
      throw new Error(`Record ${r.id} tags is not an array!`)
    }
    if (!Array.isArray(r.contributingInstitutions) || r.contributingInstitutions.length === 0) {
      throw new Error(`Record ${r.id} contributingInstitutions is invalid!`)
    }
    if (typeof r.riskScore !== 'number' || isNaN(r.riskScore)) {
      throw new Error(`Record ${r.id} riskScore is not a valid number!`)
    }
    if (typeof r.confidence !== 'number' || isNaN(r.confidence)) {
      throw new Error(`Record ${r.id} confidence is not a valid number!`)
    }
    if (typeof r.reportCount !== 'number' || isNaN(r.reportCount)) {
      throw new Error(`Record ${r.id} reportCount is not a valid number!`)
    }
    if (!r.riskLevel || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(r.riskLevel)) {
      throw new Error(`Record ${r.id} has invalid riskLevel: ${r.riskLevel}`)
    }
  }
  console.log(`All ${records.length} records verified: Every record strictly adheres to the schema!`)
  console.log('TEST 1 PASSED\n')

  // 2. Normalization Engine Resiliency against Malformed/Empty Objects
  console.log('--- TEST 2: TESTING NORMALIZATION ON CORRUPT / PARTIAL OBJECTS ---')
  const emptyNormalized = normalizeConsortiumRecord({})
  console.log('Normalized empty object:', {
    id: emptyNormalized.id,
    pseudonymousIdentifier: emptyNormalized.pseudonymousIdentifier,
    signalType: emptyNormalized.signalType,
    tags: emptyNormalized.tags,
    institutions: emptyNormalized.contributingInstitutions
  })
  if (typeof emptyNormalized.pseudonymousIdentifier !== 'string') throw new Error('pseudonymousIdentifier must be string')
  if (!Array.isArray(emptyNormalized.tags)) throw new Error('tags must be an array')
  if (!Array.isArray(emptyNormalized.contributingInstitutions)) throw new Error('contributingInstitutions must be an array')

  const partialMalformed = normalizeConsortiumRecord({
    pseudonymousIdentifier: undefined,
    pseudonymizedIdentifier: undefined,
    tags: null as any,
    contributingInstitutions: null as any,
    riskScore: 'not_a_number' as any,
    signalType: undefined,
  })
  if (!partialMalformed.pseudonymousIdentifier) throw new Error('Must have fallback identifier')
  if (!Array.isArray(partialMalformed.tags)) throw new Error('tags must be array even when given null')
  if (!Array.isArray(partialMalformed.contributingInstitutions)) throw new Error('institutions must be array even when given null')
  console.log('TEST 2 PASSED\n')

  // 3. Frontend Filtering Logic Simulation
  console.log('--- TEST 3: FRONTEND FILTERING RESILIENCY & SEARCH MODES ---')
  
  // Test dataset with intentional tricky cases:
  // - clean record
  // - record with empty tags
  // - record with undefined optional fields
  // - record with empty institutions
  const testPool: ConsortiumRecord[] = [
    ...records,
    normalizeConsortiumRecord({
      id: 'INTEL-TEST-EMPTY-TAGS',
      pseudonymousIdentifier: 'BEN-****9999',
      signalType: 'BENEFICIARY_RISK',
      tags: [],
      contributingInstitutions: ['Apex Bank Ltd'],
    }),
    normalizeConsortiumRecord({
      id: 'INTEL-TEST-EMPTY-INSTITUTIONS',
      pseudonymousIdentifier: 'DEV-****1111',
      entityType: 'DEVICE',
      signalType: 'DEVICE_REPUTATION',
      tags: ['botnet'],
      contributingInstitutions: [],
    }),
  ]

  const safeFilter = (data: ConsortiumRecord[], filterType: string, searchQuery: string) => {
    const search = searchQuery.trim().toLowerCase()

    return data.filter((r) => {
      if (!r) return false

      // 1. Entity type filter
      const entity = String(r.entityType ?? '').toUpperCase()
      const matchesFilter = filterType === 'ALL' || entity === filterType.toUpperCase()
      if (!matchesFilter) return false

      // 2. Search query filter
      if (!search) return true

      const idMatch = String(r.id ?? '').toLowerCase().includes(search)
      const tokenMatch = String(r.pseudonymousIdentifier ?? r.pseudonymizedIdentifier ?? '').toLowerCase().includes(search)
      const signalMatch = String(r.signalType ?? '').toLowerCase().includes(search)
      const notesMatch = String(r.notes ?? '').toLowerCase().includes(search)
      const statusMatch = String(r.status ?? '').toLowerCase().includes(search)
      const institutionIdMatch = String(r.institutionId ?? '').toLowerCase().includes(search)
      
      const tagMatch = Array.isArray(r.tags) && r.tags.some((t) => 
        String(t ?? '').toLowerCase().includes(search)
      )
      
      const institutionMatch = Array.isArray(r.contributingInstitutions) && r.contributingInstitutions.some((i) => 
        String(i ?? '').toLowerCase().includes(search)
      )

      return idMatch || tokenMatch || signalMatch || tagMatch || institutionMatch || notesMatch || statusMatch || institutionIdMatch
    })
  }

  // 3a. Search by Pseudonymous Identifier
  const searchByIdentifier = safeFilter(testPool, 'ALL', 'BEN-****7723')
  console.log(`Search by 'BEN-****7723': found ${searchByIdentifier.length} match(es)`)
  if (searchByIdentifier.length === 0) throw new Error('Search by token failed')

  // Partial token search (e.g. "7723")
  const searchByPartial = safeFilter(testPool, 'ALL', '7723')
  console.log(`Search by partial '7723': found ${searchByPartial.length} match(es)`)
  if (searchByPartial.length === 0) throw new Error('Search by partial token failed')

  // 3b. Search by Signal Type
  const searchBySignal = safeFilter(testPool, 'ALL', 'KNOWN_SCAM_ACCOUNT')
  console.log(`Search by 'KNOWN_SCAM_ACCOUNT': found ${searchBySignal.length} match(es)`)
  if (searchBySignal.length === 0) throw new Error('Search by signalType failed')

  // 3c. Search by Tag
  const searchByTag = safeFilter(testPool, 'ALL', 'tor_exit_node')
  console.log(`Search by tag 'tor_exit_node': found ${searchByTag.length} match(es)`)
  if (searchByTag.length === 0) throw new Error('Search by tag failed')

  // 3d. Search by Institution Name
  const searchByBank = safeFilter(testPool, 'ALL', 'Horizon Financial Corp')
  console.log(`Search by bank 'Horizon Financial Corp': found ${searchByBank.length} match(es)`)
  if (searchByBank.length === 0) throw new Error('Search by institution name failed')

  // 3e. Entity Type Filter Tests
  const allCount = safeFilter(testPool, 'ALL', '').length
  const benCount = safeFilter(testPool, 'BENEFICIARY', '').length
  const devCount = safeFilter(testPool, 'DEVICE', '').length
  const ipCount = safeFilter(testPool, 'IP', '').length
  const accCount = safeFilter(testPool, 'ACCOUNT', '').length
  console.log(`Entity Filters: ALL=${allCount}, BENEFICIARY=${benCount}, DEVICE=${devCount}, IP=${ipCount}, ACCOUNT=${accCount}`)
  if (benCount === 0 || devCount === 0 || ipCount === 0) {
    throw new Error('Entity filters must return matching types')
  }

  // 3f. Search that matches nothing
  const emptySearch = safeFilter(testPool, 'ALL', 'totally_nonexistent_gibberish_xyz_123')
  console.log(`Search for nonexistent query: found ${emptySearch.length} match(es)`)
  if (emptySearch.length !== 0) throw new Error('Expected 0 results for nonexistent query')

  // 3g. Test filtering with records containing undefined/null fields
  const corruptedList: any[] = [
    { id: 'CORRUPT-1', pseudonymousIdentifier: undefined, tags: null, contributingInstitutions: undefined },
    { id: 'CORRUPT-2', pseudonymousIdentifier: null, signalType: null, tags: [null, undefined, 'valid_tag'] },
  ]
  const corruptedFilterResult = safeFilter(corruptedList, 'ALL', 'valid_tag')
  console.log(`Filtering corrupted records array: safely handled without throwing! Matches: ${corruptedFilterResult.length}`)
  if (corruptedFilterResult.length !== 1) throw new Error('Corrupted array filtering failed')

  console.log('TEST 3 PASSED\n')

  // 4. Verification of Live Consortium Stats & Dashboard Sync
  console.log('--- TEST 4: VERIFYING DYNAMIC STATS CONSISTENCY ---')
  const stats = getConsortiumStats()
  console.log(`Total Indexed: ${stats.totalSignalsIndexed}`)
  console.log(`Participating Institutions: ${stats.participatingInstitutions}`)
  console.log(`High Risk Indicators: ${stats.highRiskIndicators}`)
  if (stats.totalSignalsIndexed !== records.length) {
    throw new Error(`Stats mismatch: stats says ${stats.totalSignalsIndexed} but records array has ${records.length}`)
  }
  if (stats.participatingInstitutions !== PARTICIPATING_INSTITUTIONS.length) {
    throw new Error(`Institutions mismatch: stats says ${stats.participatingInstitutions} but list has ${PARTICIPATING_INSTITUTIONS.length}`)
  }
  console.log('TEST 4 PASSED\n')

  console.log('========================================================')
  console.log('ALL CONSORTIUM DATA CONTRACT TESTS PASSED WITH 0 ERRORS!')
  console.log('========================================================')
}

runContractAudit().catch(err => {
  console.error('Audit failure:', err)
  process.exit(1)
})
