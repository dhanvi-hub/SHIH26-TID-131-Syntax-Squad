import type { Transaction } from '@/lib/types'

const USERS = ['USR001', 'USR002', 'USR003', 'USR004', 'USR005', 'USR006', 'USR007', 'USR008', 'USR009', 'USR010']

// Indian cities with their states
export const INDIAN_CITIES: { city: string; state: string }[] = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Thiruvananthapuram', state: 'Kerala' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Ranchi', state: 'Jharkhand' },
  { city: 'Raipur', state: 'Chhattisgarh' },
  { city: 'Dehradun', state: 'Uttarakhand' },
  { city: 'Shimla', state: 'Himachal Pradesh' },
  { city: 'Srinagar', state: 'Jammu & Kashmir' },
  { city: 'Panaji', state: 'Goa' },
  { city: 'Imphal', state: 'Manipur' },
  { city: 'Shillong', state: 'Meghalaya' },
  { city: 'Aizawl', state: 'Mizoram' },
  { city: 'Kohima', state: 'Nagaland' },
  { city: 'Gangtok', state: 'Sikkim' },
  { city: 'Agartala', state: 'Tripura' },
  { city: 'Itanagar', state: 'Arunachal Pradesh' },
  { city: 'Port Blair', state: 'Andaman & Nicobar' },
]

const ANOMALY_LOCATIONS = ['Unknown Location', 'VPN-Hidden', 'Foreign IP', 'Proxy Detected']

function generateIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function generateTxnId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

// Distribution: 75% safe, 20% suspicious, 5% fraud
function determineTransactionType(): 'safe' | 'suspicious' | 'fraud' {
  const rand = Math.random()
  if (rand < 0.75) return 'safe'
  if (rand < 0.95) return 'suspicious'
  return 'fraud'
}

export function generateTransaction(forceType?: 'safe' | 'suspicious' | 'fraud'): Transaction {
  const transactionType = forceType || determineTransactionType()
  
  const cityData = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)]
  let amount: number
  let location: string
  let device: 'mobile' | 'desktop' = Math.random() > 0.5 ? 'mobile' : 'desktop'

  switch (transactionType) {
    case 'safe':
      // Normal transactions: ₹100-₹25,000
      amount = Math.floor(Math.random() * 24900) + 100
      location = `${cityData.city}, ${cityData.state}`
      break
    
    case 'suspicious':
      // Moderately suspicious: ₹25,000-₹150,000 or unusual patterns
      const suspiciousType = Math.floor(Math.random() * 3)
      if (suspiciousType === 0) {
        // Higher amount
        amount = Math.floor(Math.random() * 125000) + 25000
        location = `${cityData.city}, ${cityData.state}`
      } else if (suspiciousType === 1) {
        // Normal amount but odd time (late night) - flagged by timestamp
        amount = Math.floor(Math.random() * 20000) + 5000
        location = `${cityData.city}, ${cityData.state}`
      } else {
        // Multiple small transactions pattern
        amount = Math.floor(Math.random() * 5000) + 500
        location = `${cityData.city}, ${cityData.state}`
      }
      break
    
    case 'fraud':
      // Highly suspicious: Very high amount + suspicious location
      const fraudType = Math.floor(Math.random() * 3)
      if (fraudType === 0) {
        // Very high amount
        amount = Math.floor(Math.random() * 500000) + 200000
        location = `${cityData.city}, ${cityData.state}`
      } else if (fraudType === 1) {
        // Suspicious location with high amount
        amount = Math.floor(Math.random() * 300000) + 100000
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
      } else {
        // Multiple red flags
        amount = Math.floor(Math.random() * 400000) + 150000
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
        device = 'mobile' // New device flag
      }
      break
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

// Helper to get state from location string
export function getStateFromLocation(location: string): string | null {
  const cityData = INDIAN_CITIES.find(c => location.includes(c.city))
  return cityData?.state || null
}
