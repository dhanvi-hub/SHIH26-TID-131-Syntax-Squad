import type { Transaction } from '@/lib/types'

const USERS = ['USR001', 'USR002', 'USR003', 'USR004', 'USR005', 'USR006', 'USR007', 'USR008']
const LOCATIONS = ['New York', 'London', 'Tokyo', 'Singapore', 'Dubai', 'Paris', 'Sydney', 'Hong Kong']
const ANOMALY_LOCATIONS = ['Lagos', 'Moscow', 'Unknown', 'VPN-Hidden']

function generateIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function generateTxnId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export function generateTransaction(forceAnomaly = false): Transaction {
  const isAnomaly = forceAnomaly || Math.random() < 0.25 // 25% chance of anomaly
  const anomalyType = Math.floor(Math.random() * 4)

  let amount = Math.floor(Math.random() * 500) + 10 // Normal: $10-$510
  let location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
  let device: 'mobile' | 'desktop' = Math.random() > 0.5 ? 'mobile' : 'desktop'

  if (isAnomaly) {
    switch (anomalyType) {
      case 0: // High amount
        amount = Math.floor(Math.random() * 9000) + 5000 // $5,000-$14,000
        break
      case 1: // Strange location
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
        break
      case 2: // Combined anomaly
        amount = Math.floor(Math.random() * 5000) + 2000
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
        break
      case 3: // Sudden device change (marked in metadata)
        device = 'mobile' // Force mobile for "new device" scenario
        break
    }
  }

  return {
    txn_id: generateTxnId(),
    user_id: USERS[Math.floor(Math.random() * USERS.length)],
    amount,
    location,
    ip: generateIP(),
    device,
    timestamp: new Date().toISOString(),
  }
}

export function generateBatchTransactions(count: number): Transaction[] {
  return Array.from({ length: count }, () => generateTransaction())
}
