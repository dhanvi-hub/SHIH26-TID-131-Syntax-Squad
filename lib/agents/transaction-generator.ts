import type { Transaction } from '@/lib/types'

const USERS = ['USR001', 'USR002', 'USR003', 'USR004', 'USR005', 'USR006', 'USR007', 'USR008', 'USR009', 'USR010']

export interface LocationData {
  city: string
  region: string // State for India
  country: string
  coordinates: [number, number]
}

// Indian cities with coordinates [longitude, latitude]
export const INDIAN_CITIES_DATA: LocationData[] = [
  { city: 'Mumbai', region: 'Maharashtra', country: 'India', coordinates: [72.8777, 19.0760] },
  { city: 'Delhi', region: 'Delhi', country: 'India', coordinates: [77.1025, 28.7041] },
  { city: 'Bengaluru', region: 'Karnataka', country: 'India', coordinates: [77.5946, 12.9716] },
  { city: 'Chennai', region: 'Tamil Nadu', country: 'India', coordinates: [80.2707, 13.0827] },
  { city: 'Kolkata', region: 'West Bengal', country: 'India', coordinates: [88.3639, 22.5726] },
  { city: 'Hyderabad', region: 'Telangana', country: 'India', coordinates: [78.4867, 17.3850] },
  { city: 'Pune', region: 'Maharashtra', country: 'India', coordinates: [73.8567, 18.5204] },
  { city: 'Ahmedabad', region: 'Gujarat', country: 'India', coordinates: [72.5714, 23.0225] },
  { city: 'Jaipur', region: 'Rajasthan', country: 'India', coordinates: [75.7873, 26.9124] },
  { city: 'Lucknow', region: 'Uttar Pradesh', country: 'India', coordinates: [80.9462, 26.8467] },
  { city: 'Chandigarh', region: 'Punjab', country: 'India', coordinates: [76.7794, 30.7333] },
  { city: 'Bhopal', region: 'Madhya Pradesh', country: 'India', coordinates: [77.4126, 23.2599] },
  { city: 'Patna', region: 'Bihar', country: 'India', coordinates: [85.1376, 25.5941] },
  { city: 'Thiruvananthapuram', region: 'Kerala', country: 'India', coordinates: [76.9366, 8.5241] },
  { city: 'Guwahati', region: 'Assam', country: 'India', coordinates: [91.7362, 26.1445] },
  { city: 'Bhubaneswar', region: 'Odisha', country: 'India', coordinates: [85.8245, 20.2961] },
  { city: 'Ranchi', region: 'Jharkhand', country: 'India', coordinates: [85.3096, 23.3441] },
  { city: 'Raipur', region: 'Chhattisgarh', country: 'India', coordinates: [81.6296, 21.2514] },
  { city: 'Dehradun', region: 'Uttarakhand', country: 'India', coordinates: [78.0322, 30.3165] },
  { city: 'Shimla', region: 'Himachal Pradesh', country: 'India', coordinates: [77.1734, 31.1048] },
  { city: 'Srinagar', region: 'Jammu & Kashmir', country: 'India', coordinates: [74.7973, 34.0837] },
  { city: 'Panaji', region: 'Goa', country: 'India', coordinates: [73.8278, 15.4909] },
]

export const WORLD_CITIES = INDIAN_CITIES_DATA

export const INDIAN_CITIES = INDIAN_CITIES_DATA.map(c => ({ city: c.city, state: c.region }))

const ANOMALY_LOCATIONS = ['Unknown Location', 'VPN-Hidden', 'Foreign IP', 'Proxy Detected']

function generateIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function generateTxnId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

// Distribution: 88% safe, 10% suspicious, 2% fraud
function determineTransactionType(): 'safe' | 'suspicious' | 'fraud' {
  const rand = Math.random()
  if (rand < 0.88) return 'safe'
  if (rand < 0.98) return 'suspicious'
  return 'fraud'
}

export function generateTransaction(forceType?: 'safe' | 'suspicious' | 'fraud'): Transaction {
  const transactionType = forceType || determineTransactionType()
  
  const cityData = INDIAN_CITIES_DATA[Math.floor(Math.random() * INDIAN_CITIES_DATA.length)]
  let amount: number
  let location: string
  let device: 'mobile' | 'desktop' = Math.random() > 0.5 ? 'mobile' : 'desktop'

  switch (transactionType) {
    case 'safe':
      // Normal Indian transactions: ₹100-₹25,000
      amount = Math.floor(Math.random() * 24900) + 100
      location = `${cityData.city}, ${cityData.region}`
      break
    
    case 'suspicious':
      // Moderately suspicious: ₹25,000-₹150,000
      const suspiciousType = Math.floor(Math.random() * 3)
      if (suspiciousType === 0) {
        amount = Math.floor(Math.random() * 125000) + 25000
        location = `${cityData.city}, ${cityData.region}`
      } else if (suspiciousType === 1) {
        amount = Math.floor(Math.random() * 20000) + 5000
        location = `${cityData.city}, ${cityData.region}`
      } else {
        amount = Math.floor(Math.random() * 5000) + 500
        location = `${cityData.city}, ${cityData.region}`
      }
      break
    
    case 'fraud':
      // Highly suspicious: Very high amount + anomaly location
      const fraudType = Math.floor(Math.random() * 3)
      if (fraudType === 0) {
        amount = Math.floor(Math.random() * 500000) + 200000
        location = `${cityData.city}, ${cityData.region}`
      } else if (fraudType === 1) {
        amount = Math.floor(Math.random() * 300000) + 100000
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
      } else {
        amount = Math.floor(Math.random() * 400000) + 150000
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
        device = 'mobile'
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

export function getStateFromLocation(location: string): string | null {
  const cityData = INDIAN_CITIES_DATA.find(c => location.includes(c.city) || location.includes(c.region))
  return cityData?.region || null
}
