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
]

export const INDIAN_CITIES_DATA: { city: string; state: string; region: string; coordinates: [number, number] }[] = [
  { city: 'Mumbai', state: 'Maharashtra', region: 'Maharashtra', coordinates: [72.8777, 19.0760] },
  { city: 'Delhi', state: 'Delhi', region: 'Delhi', coordinates: [77.1025, 28.7041] },
  { city: 'Bengaluru', state: 'Karnataka', region: 'Karnataka', coordinates: [77.5946, 12.9716] },
  { city: 'Chennai', state: 'Tamil Nadu', region: 'Tamil Nadu', coordinates: [80.2707, 13.0827] },
  { city: 'Kolkata', state: 'West Bengal', region: 'West Bengal', coordinates: [88.3639, 22.5726] },
  { city: 'Hyderabad', state: 'Telangana', region: 'Telangana', coordinates: [78.4867, 17.3850] },
  { city: 'Pune', state: 'Maharashtra', region: 'Maharashtra', coordinates: [73.8567, 18.5204] },
  { city: 'Ahmedabad', state: 'Gujarat', region: 'Gujarat', coordinates: [72.5714, 23.0225] },
  { city: 'Jaipur', state: 'Rajasthan', region: 'Rajasthan', coordinates: [75.7873, 26.9124] },
  { city: 'Lucknow', state: 'Uttar Pradesh', region: 'Uttar Pradesh', coordinates: [80.9462, 26.8467] },
  { city: 'Chandigarh', state: 'Punjab', region: 'Punjab', coordinates: [76.7794, 30.7333] },
  { city: 'Bhopal', state: 'Madhya Pradesh', region: 'Madhya Pradesh', coordinates: [77.4126, 23.2599] },
  { city: 'Patna', state: 'Bihar', region: 'Bihar', coordinates: [85.1376, 25.5941] },
  { city: 'Thiruvananthapuram', state: 'Kerala', region: 'Kerala', coordinates: [76.9366, 8.5241] },
  { city: 'Guwahati', state: 'Assam', region: 'Assam', coordinates: [91.7362, 26.1445] },
  { city: 'Bhubaneswar', state: 'Odisha', region: 'Odisha', coordinates: [85.8245, 20.2961] },
  { city: 'Ranchi', state: 'Jharkhand', region: 'Jharkhand', coordinates: [85.3096, 23.3441] },
  { city: 'Raipur', state: 'Chhattisgarh', region: 'Chhattisgarh', coordinates: [81.6296, 21.2514] },
  { city: 'Dehradun', state: 'Uttarakhand', region: 'Uttarakhand', coordinates: [78.0322, 30.3165] },
  { city: 'Shimla', state: 'Himachal Pradesh', region: 'Himachal Pradesh', coordinates: [77.1734, 31.1048] },
  { city: 'Srinagar', state: 'Jammu & Kashmir', region: 'Jammu & Kashmir', coordinates: [74.7973, 34.0837] },
  { city: 'Panaji', state: 'Goa', region: 'Goa', coordinates: [73.8278, 15.4909] },
  { city: 'Imphal', state: 'Manipur', region: 'Manipur', coordinates: [93.9368, 24.8170] },
  { city: 'Shillong', state: 'Meghalaya', region: 'Meghalaya', coordinates: [91.8933, 25.5788] },
  { city: 'Aizawl', state: 'Mizoram', region: 'Mizoram', coordinates: [92.7176, 23.7271] },
  { city: 'Kohima', state: 'Nagaland', region: 'Nagaland', coordinates: [94.1086, 25.6751] },
  { city: 'Gangtok', state: 'Sikkim', region: 'Sikkim', coordinates: [88.6138, 27.3389] },
  { city: 'Agartala', state: 'Tripura', region: 'Tripura', coordinates: [91.2868, 23.8315] },
  { city: 'Itanagar', state: 'Arunachal Pradesh', region: 'Arunachal Pradesh', coordinates: [93.6053, 27.0844] },
  { city: 'Port Blair', state: 'Andaman & Nicobar', region: 'Andaman & Nicobar', coordinates: [92.7265, 11.6233] },
]

export const WORLD_CITIES: { city: string; region: string; country: string }[] = [
  { city: 'Mumbai', region: 'Maharashtra', country: 'India' },
  { city: 'Delhi', region: 'Delhi', country: 'India' },
  { city: 'Bengaluru', region: 'Karnataka', country: 'India' },
  { city: 'Chennai', region: 'Tamil Nadu', country: 'India' },
  { city: 'Kolkata', region: 'West Bengal', country: 'India' },
  { city: 'Hyderabad', region: 'Telangana', country: 'India' },
  { city: 'Pune', region: 'Maharashtra', country: 'India' },
  { city: 'Ahmedabad', region: 'Gujarat', country: 'India' },
  { city: 'Jaipur', region: 'Rajasthan', country: 'India' },
  { city: 'Lucknow', region: 'Uttar Pradesh', country: 'India' },
  { city: 'London', region: 'United Kingdom', country: 'UK' },
  { city: 'New York', region: 'United States', country: 'USA' },
  { city: 'Singapore', region: 'Singapore', country: 'Singapore' },
  { city: 'Dubai', region: 'UAE', country: 'UAE' },
]


const ANOMALY_LOCATIONS = ['Unknown Location', 'VPN-Hidden', 'Foreign IP', 'Proxy Detected']

function generateIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function generateTxnId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

// Distribution: 84% safe, 10% suspicious, 6% fraud
function determineTransactionType(): 'safe' | 'suspicious' | 'fraud' {
  const rand = Math.random()
  if (rand < 0.84) return 'safe'
  if (rand < 0.94) return 'suspicious'
  return 'fraud'
}

export function generateTransaction(
  forceType?: 'safe' | 'suspicious' | 'fraud',
  customTimestamp?: string
): Transaction {
  const transactionType = forceType || determineTransactionType()
  
  const cityData = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)]
  let amount: number
  let location: string
  let device: 'mobile' | 'desktop' = Math.random() > 0.5 ? 'mobile' : 'desktop'
  let beneficiary_id: string | undefined
  let device_fingerprint: string | undefined
  let socialEngineering: Transaction['socialEngineering']

  switch (transactionType) {
    case 'safe':
      // Normal transactions: ₹100-₹25,000
      amount = Math.floor(Math.random() * 24900) + 100
      location = `${cityData.city}, ${cityData.state}`
      beneficiary_id = `BEN-NORMAL-${Math.floor(Math.random() * 9000) + 1000}`
      device_fingerprint = `FP-STD-${Math.floor(Math.random() * 900) + 100}`
      break
    
    case 'suspicious':
      // Moderately suspicious
      const suspiciousType = Math.floor(Math.random() * 4)
      if (suspiciousType === 0) {
        // Higher amount
        amount = Math.floor(Math.random() * 125000) + 25000
        location = `${cityData.city}, ${cityData.state}`
        beneficiary_id = `BEN-STD-${Math.floor(Math.random() * 9000) + 1000}`
      } else if (suspiciousType === 1) {
        // Social engineering urgency pattern
        amount = Math.floor(Math.random() * 40000) + 15000
        location = `${cityData.city}, ${cityData.state}`
        beneficiary_id = `BEN-GEN-${Math.floor(Math.random() * 9000) + 1000}`
        socialEngineering = {
          recent_call: true,
          caller_known: false,
          call_duration: 220,
          time_since_call: 4,
          caller_risk_score: 65,
          scam_pattern: 'payment_urgency',
        }
      } else if (suspiciousType === 2) {
        // Normal amount but odd time
        amount = Math.floor(Math.random() * 20000) + 5000
        location = `${cityData.city}, ${cityData.state}`
      } else {
        // Multiple small transactions pattern
        amount = Math.floor(Math.random() * 5000) + 500
        location = `${cityData.city}, ${cityData.state}`
      }
      break
    
    case 'fraud':
      // Highly suspicious: Very high amount + suspicious location or consortium threat
      const fraudType = Math.floor(Math.random() * 4)
      if (fraudType === 0) {
        // Very high amount
        amount = Math.floor(Math.random() * 500000) + 200000
        location = `${cityData.city}, ${cityData.state}`
        beneficiary_id = 'BEN-SCAM-7723' // Known threat
      } else if (fraudType === 1) {
        // Suspicious location with high amount
        amount = Math.floor(Math.random() * 300000) + 100000
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
        device_fingerprint = 'FP-DEV-EMULATOR-77'
      } else if (fraudType === 2) {
        // Coercive fake KYC / account closure scam
        amount = Math.floor(Math.random() * 85000) + 35000
        location = `${cityData.city}, ${cityData.state}`
        beneficiary_id = 'BEN-MULE-8801'
        socialEngineering = {
          recent_call: true,
          caller_known: false,
          call_duration: 480,
          time_since_call: 2,
          caller_risk_score: 90,
          scam_pattern: 'fake_kyc_request',
        }
      } else {
        // Multiple red flags
        amount = Math.floor(Math.random() * 400000) + 150000
        location = ANOMALY_LOCATIONS[Math.floor(Math.random() * ANOMALY_LOCATIONS.length)]
        device = 'mobile'
        beneficiary_id = 'BEN-LAUNDER-9912'
        device_fingerprint = 'FP-DEV-EMULATOR-77'
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
    timestamp: customTimestamp || new Date().toISOString(),
    beneficiary_id,
    device_fingerprint,
    socialEngineering,
  }
}

/**
 * Deterministic Hackathon Demo Scenarios
 */
export function generateDemoScenario(scenario: 'A' | 'B' | 'C' | 'D' | 'E'): Transaction {
  const baseTxn = {
    txn_id: generateTxnId(),
    user_id: 'USR001',
    timestamp: new Date().toISOString(),
  }

  switch (scenario) {
    case 'A':
      // SCENARIO A: Normal transaction, no external match, no scam signal (Low Risk)
      return {
        ...baseTxn,
        amount: 2500,
        location: 'Mumbai, Maharashtra',
        ip: '103.21.124.5',
        device: 'mobile',
        beneficiary_id: 'BEN-REGULAR-1001',
        device_fingerprint: 'FP-IPHONE-USR001',
      }

    case 'B':
      // SCENARIO B: High amount detected by standard rules
      return {
        ...baseTxn,
        amount: 550000,
        location: 'Bengaluru, Karnataka',
        ip: '103.21.124.5',
        device: 'desktop',
        beneficiary_id: 'BEN-VENDOR-4091',
      }

    case 'C':
      // SCENARIO C: Looks normal to ML (e.g. ₹8,500 normal city), BUT matches Cross-Institution Mule Beneficiary
      // and High-Risk IP -> Multi-Signal Escalation
      return {
        ...baseTxn,
        user_id: 'USR002',
        amount: 8500,
        location: 'Delhi, Delhi',
        ip: '198.51.100.44', // Consortium flagged threat IP
        device: 'mobile',
        beneficiary_id: 'BEN-MULE-8801', // Consortium flagged beneficiary (3 banks)
      }

    case 'D':
      // SCENARIO D: Moderate transaction amount, but High-Risk Call + Payment Urgency Scam Pattern
      // -> Social Engineering elevates risk
      return {
        ...baseTxn,
        user_id: 'USR003',
        amount: 32000,
        location: 'Pune, Maharashtra',
        ip: '103.44.12.9',
        device: 'mobile',
        beneficiary_id: 'BEN-UNKNOWN-3312',
        socialEngineering: {
          recent_call: true,
          caller_known: false,
          call_duration: 380, // > 6 min call
          time_since_call: 2, // 2 mins before transfer
          caller_risk_score: 88,
          scam_pattern: 'payment_urgency',
        },
      }

    case 'E':
      // SCENARIO E: Dual High-Threat (Known Scam Beneficiary + Fake KYC / Account Threat Pattern)
      return {
        ...baseTxn,
        user_id: 'USR004',
        amount: 95000,
        location: 'Kolkata, West Bengal',
        ip: '185.220.101.5', // Known TOR exit / threat
        device: 'mobile',
        beneficiary_id: 'BEN-SCAM-7723', // Flagged across 4 banks
        device_fingerprint: 'FP-DEV-EMULATOR-77',
        socialEngineering: {
          recent_call: true,
          caller_known: false,
          call_duration: 650,
          time_since_call: 1,
          caller_risk_score: 95,
          scam_pattern: 'fake_kyc_request',
        },
      }
  }
}

export function generateBatchTransactions(count: number, hoursWindow = 6): Transaction[] {
  const now = Date.now()
  return Array.from({ length: count }, (_, idx) => {
    // Distribute timestamps chronologically across the recent hours window leading up to now
    const progress = idx / Math.max(1, count - 1) // 0 (earliest) to 1 (latest)
    const jitterMs = (Math.random() * 8 - 4) * 60 * 1000 // +/- 4 minutes jitter
    const offsetMs = (1 - progress) * hoursWindow * 3600 * 1000 + jitterMs
    const targetMs = Math.min(now, Math.max(now - hoursWindow * 3600 * 1000, now - Math.max(0, offsetMs)))
    const timestamp = new Date(targetMs).toISOString()

    // Ensure representative coverage of key threat scenarios in demo batches
    if (idx === 1 && count >= 5) {
      // Guaranteed Scenario D: Social Engineering / Scam-Call Coercion
      const txn = generateDemoScenario('D')
      return { ...txn, timestamp }
    }
    if (idx === 3 && count >= 5) {
      // Guaranteed Scenario C: Consortium Match -> Multi-Signal Escalation
      const txn = generateDemoScenario('C')
      return { ...txn, timestamp }
    }
    if (idx === 7 && count >= 10) {
      // Guaranteed Scenario E: Dual Threat (Known Scam Beneficiary + Fake KYC Pressure)
      const txn = generateDemoScenario('E')
      return { ...txn, timestamp }
    }
    if (idx === 9 && count >= 15) {
      // Additional Coercion case
      const txn = generateDemoScenario('D')
      return { ...txn, txn_id: `TXN-${Date.now()}-COERCE2`, amount: 48000, timestamp }
    }

    return generateTransaction(undefined, timestamp)
  })
}

// Helper to get state from location string
export function getStateFromLocation(location: string): string | null {
  const cityData = INDIAN_CITIES.find(c => location.includes(c.city))
  return cityData?.state || null
}
