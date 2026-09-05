import { NextResponse } from 'next/server'
import { processTransaction } from '@/lib/agents/pipeline'
import type { Transaction } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const transaction: Transaction = await request.json()
    
    // Process the transaction through the agent pipeline
    const { transaction: processedTxn } = await processTransaction(transaction)
    
    // Calculate fraud criteria percentages based on rule flags
    const fraudCriteria = calculateFraudCriteria(processedTxn.ruleFlags, processedTxn.riskScore)
    
    return NextResponse.json({
      ...processedTxn,
      fraudCriteria,
    })
  } catch (error) {
    console.error('Investigation error:', error)
    return NextResponse.json(
      { error: 'Investigation failed' },
      { status: 500 }
    )
  }
}

function calculateFraudCriteria(ruleFlags: string[], totalRiskScore: number): Record<string, number> {
  if (totalRiskScore === 0 || ruleFlags.length === 0) {
    return {
      rapidTransactions: 0,
      differentLocation: 0,
      lateNightTransaction: 0,
      differentDevice: 0,
      highAmount: 0,
      suspiciousIP: 0,
      unusualPattern: 0,
    }
  }

  // Base weights for each criteria
  const criteriaWeights: Record<string, number> = {
    RAPID_TRANSACTIONS: 20,
    VELOCITY_ANOMALY: 15,
    MULTIPLE_RECENT_TRANSACTIONS: 10,
    RAPID_LOCATION_CHANGE: 25,
    LOCATION_CHANGE: 15,
    SUSPICIOUS_LOCATION: 20,
    LATE_NIGHT: 15,
    NEW_DEVICE: 15,
    DEVICE_CHANGE: 10,
    VERY_HIGH_AMOUNT: 25,
    HIGH_AMOUNT: 15,
    SUSPICIOUS_IP: 20,
    IP_CHANGE: 5,
    UNUSUAL_PATTERN: 20,
    KNOWN_SCAM_BENEFICIARY: 30,
    CROSS_INSTITUTION_DEVICE_MATCH: 25,
    SOCIAL_ENG_URGENCY: 25,
    FAKE_KYC_PRESSURE: 30,
  }

  // Calculate raw scores
  let rapidTransactions = 0
  let differentLocation = 0
  let lateNightTransaction = 0
  let differentDevice = 0
  let highAmount = 0
  let suspiciousIP = 0
  let unusualPattern = 0
  let crossInstitutionIntelligence = 0
  let socialEngineering = 0

  ruleFlags.forEach(flag => {
    const weight = criteriaWeights[flag] || 5

    if (['RAPID_TRANSACTIONS', 'VELOCITY_ANOMALY', 'MULTIPLE_RECENT_TRANSACTIONS'].includes(flag)) {
      rapidTransactions += weight
    }
    if (['RAPID_LOCATION_CHANGE', 'LOCATION_CHANGE', 'SUSPICIOUS_LOCATION'].includes(flag)) {
      differentLocation += weight
    }
    if (flag === 'LATE_NIGHT') {
      lateNightTransaction += weight
    }
    if (['NEW_DEVICE', 'DEVICE_CHANGE', 'CROSS_INSTITUTION_DEVICE_MATCH'].includes(flag)) {
      differentDevice += weight
    }
    if (['VERY_HIGH_AMOUNT', 'HIGH_AMOUNT'].includes(flag)) {
      highAmount += weight
    }
    if (['SUSPICIOUS_IP', 'IP_CHANGE'].includes(flag)) {
      suspiciousIP += weight
    }
    if (flag === 'UNUSUAL_PATTERN') {
      unusualPattern += weight
    }
    if (['KNOWN_SCAM_BENEFICIARY', 'CROSS_INSTITUTION_DEVICE_MATCH'].includes(flag)) {
      crossInstitutionIntelligence += weight
    }
    if (['SOCIAL_ENG_URGENCY', 'FAKE_KYC_PRESSURE'].includes(flag)) {
      socialEngineering += weight
    }
  })

  // Calculate total and normalize to percentages
  const total = rapidTransactions + differentLocation + lateNightTransaction + 
                differentDevice + highAmount + suspiciousIP + unusualPattern +
                crossInstitutionIntelligence + socialEngineering

  if (total === 0) {
    return {
      rapidTransactions: 0,
      differentLocation: 0,
      lateNightTransaction: 0,
      differentDevice: 0,
      highAmount: 0,
      suspiciousIP: 0,
      unusualPattern: 0,
      crossInstitutionIntelligence: 0,
      socialEngineering: 0,
    }
  }

  return {
    rapidTransactions: Math.round((rapidTransactions / total) * 100),
    differentLocation: Math.round((differentLocation / total) * 100),
    lateNightTransaction: Math.round((lateNightTransaction / total) * 100),
    differentDevice: Math.round((differentDevice / total) * 100),
    highAmount: Math.round((highAmount / total) * 100),
    suspiciousIP: Math.round((suspiciousIP / total) * 100),
    unusualPattern: Math.round((unusualPattern / total) * 100),
    crossInstitutionIntelligence: Math.round((crossInstitutionIntelligence / total) * 100),
    socialEngineering: Math.round((socialEngineering / total) * 100),
  }
}

