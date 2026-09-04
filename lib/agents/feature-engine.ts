/**
 * Feature Engineering Engine
 * Adapted from Smart-Horizon ml-service
 * Extracts 22 numerical features from a raw transaction for the ML ensemble.
 * Each feature is carefully designed to capture known fraud patterns.
 */

import type { Transaction, ProcessedTransaction } from '@/lib/types'

// FATF-derived country/state risk scores (0=safe, 100=extreme)
export const STATE_RISK_SCORES: Record<string, number> = {
  'Maharashtra': 15,
  'Delhi': 18,
  'Karnataka': 12,
  'Tamil Nadu': 10,
  'West Bengal': 20,
  'Telangana': 14,
  'Gujarat': 16,
  'Rajasthan': 22,
  'Uttar Pradesh': 25,
  'Bihar': 28,
  'Punjab': 18,
  'Madhya Pradesh': 20,
  'Odisha': 15,
  'Jharkhand': 24,
  'Chhattisgarh': 22,
  'Uttarakhand': 12,
  'Himachal Pradesh': 8,
  'Jammu & Kashmir': 35,
  'Goa': 10,
  'Kerala': 8,
  'Assam': 18,
  'Manipur': 25,
  'Meghalaya': 20,
  'Mizoram': 18,
  'Nagaland': 22,
  'Sikkim': 10,
  'Tripura': 20,
  'Arunachal Pradesh': 15,
  'Andaman & Nicobar': 8,
  'Ladakh': 30,
  'Chandigarh': 12,
}

// Suspicious locations that indicate VPN/proxy usage
export const SUSPICIOUS_LOCATIONS = ['Unknown Location', 'VPN-Hidden', 'Foreign IP', 'Proxy Detected']

// Transaction type risk encoding
const TX_TYPE_RISK: Record<string, number> = {
  'internal': 0,
  'card': 1,
  'ach': 2,
  'wire': 3,
  'crypto': 4,
}

// Benford's Law expected first-digit distribution
const BENFORD_EXPECTED: Record<number, number> = {
  1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 5: 0.079,
  6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
}

// Round amount thresholds (in INR)
const ROUND_AMOUNTS = new Set([1000, 2000, 2500, 5000, 10000, 15000, 20000, 25000, 50000, 75000, 100000])

/**
 * Calculate Benford's Law deviation
 * Fraudulent transactions often have unusual leading digit distributions
 */
function getBenfordDeviation(amount: number): number {
  if (amount <= 0) return 0.5
  const leadingDigit = parseInt(String(Math.abs(Math.floor(amount)))[0])
  if (leadingDigit === 0) return 0.5
  const expected = BENFORD_EXPECTED[leadingDigit] || 0.05
  return Math.round((1.0 - expected) * 1000) / 1000
}

/**
 * Check if amount is suspiciously round
 */
function isRoundAmount(amount: number): boolean {
  if (ROUND_AMOUNTS.has(amount)) return true
  if (amount >= 1000 && amount % 1000 === 0) return true
  if (amount >= 500 && amount % 500 === 0) return true
  return false
}

/**
 * Calculate IP risk score
 */
function getIPRiskScore(ip: string, location: string): number {
  if (!ip) return 30 // Missing IP is moderately suspicious

  // Private IPs are low risk (internal network)
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.')) {
    return 5
  }

  // VPN/Tor-like patterns (simplified heuristic)
  const octets = ip.split('.')
  if (octets.length === 4) {
    const firstOctet = parseInt(octets[0])
    // Known ranges associated with data centers / VPNs
    if ([41, 95, 185, 193, 194, 198].includes(firstOctet)) {
      return 60
    }
  }

  // Check if location is suspicious
  if (SUSPICIOUS_LOCATIONS.some(loc => location.includes(loc))) {
    return 80
  }

  // Extract state from location and get base risk
  const parts = location.split(', ')
  const state = parts[1] || parts[0]
  const baseRisk = STATE_RISK_SCORES[state] || 30
  return Math.min(100, baseRisk + 10)
}

/**
 * Extract features from a transaction
 * Returns an object with all feature values
 */
export function extractFeatures(
  transaction: Transaction,
  recentTransactions: ProcessedTransaction[]
): FeatureSet {
  const amount = transaction.amount
  const timestamp = new Date(transaction.timestamp)
  const hour = timestamp.getHours()
  const dayOfWeek = timestamp.getDay()
  
  // Extract state from location
  const locationParts = transaction.location.split(', ')
  const state = locationParts[1] || locationParts[0]

  // Get user's recent transactions
  const userTransactions = recentTransactions.filter(t => t.user_id === transaction.user_id)
  
  // Calculate user's average balance/transaction
  const avgUserAmount = userTransactions.length > 0
    ? userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length
    : 1500

  // ── Amount Features ──
  const amountLog = Math.log1p(amount)
  const amountZScore = (amount - 1500) / 2000
  
  // ── Temporal Features ──
  const hourOfDay = hour
  const hourSin = Math.sin(2 * Math.PI * hour / 24)
  const hourCos = Math.cos(2 * Math.PI * hour / 24)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0
  const isNight = (hour < 6 || hour >= 22) ? 1 : 0

  // ── Geographic Features ──
  const isSuspiciousLocation = SUSPICIOUS_LOCATIONS.some(loc => transaction.location.includes(loc))
  const stateRiskScore = isSuspiciousLocation ? 80 : (STATE_RISK_SCORES[state] || 30) / 100
  const isCrossBorder = isSuspiciousLocation ? 1 : 0

  // ── Transaction Type Features ──
  const txTypeRisk = 0.5 // Default for card transactions

  // ── Account Features ──
  const estimatedBalance = avgUserAmount * 10 // Estimate
  const amountToBalance = Math.min(amount / Math.max(estimatedBalance, 100), 5.0) / 5.0

  // ── Statistical Features ──
  const benfordDev = getBenfordDeviation(amount)
  const isRound = isRoundAmount(amount) ? 1 : 0

  // ── Sender Risk Features ──
  // Determine sender risk based on patterns
  let senderRisk = 0
  if (userTransactions.length === 0) senderRisk = 0.3 // New user
  else if (userTransactions.some(t => t.status === 'FRAUD')) senderRisk = 0.9
  else if (userTransactions.some(t => t.status === 'SUSPICIOUS')) senderRisk = 0.5

  // ── Velocity Features ──
  const now = new Date(transaction.timestamp).getTime()
  const txnsLast1Hour = userTransactions.filter(t => {
    const diff = now - new Date(t.timestamp).getTime()
    return diff < 60 * 60 * 1000
  }).length
  
  const txnsLast24Hours = userTransactions.filter(t => {
    const diff = now - new Date(t.timestamp).getTime()
    return diff < 24 * 60 * 60 * 1000
  }).length

  const velocity1h = Math.min(txnsLast1Hour / 5.0, 1.0)
  const velocity24h = Math.min(txnsLast24Hours / 15.0, 1.0)

  // ── Amount vs Average ──
  const amountVsAvg = Math.min(amount / Math.max(avgUserAmount, 100), 20.0) / 20.0

  // ── Device Features ──
  const commonDevice = userTransactions.length > 0
    ? userTransactions.filter(t => t.device === transaction.device).length / userTransactions.length
    : 1
  const deviceConsistency = commonDevice < 0.5 ? 0.7 : 0

  // ── IP Risk ──
  const ipRisk = getIPRiskScore(transaction.ip, transaction.location) / 100

  // ── Travel Speed Flag ──
  let travelSpeedFlag = 0
  if (userTransactions.length > 0) {
    const lastTxn = userTransactions[userTransactions.length - 1]
    const lastState = lastTxn.location.split(', ')[1]
    if (lastState && lastState !== state) {
      const timeDiff = now - new Date(lastTxn.timestamp).getTime()
      if (timeDiff < 60 * 60 * 1000) { // Less than 1 hour
        travelSpeedFlag = 1.0 // Impossible travel
      }
    }
  }

  return {
    amountLog,
    amountZScore,
    hourOfDay,
    hourSin,
    hourCos,
    isWeekend,
    isNight,
    stateRiskScore,
    isSuspiciousLocation: isSuspiciousLocation ? 1 : 0,
    isCrossBorder,
    txTypeRisk,
    amountToBalance,
    benfordDev,
    isRound,
    senderRisk,
    kycRisk: 0, // Assume verified
    velocity1h,
    velocity24h,
    amountVsAvg,
    deviceConsistency,
    ipRisk,
    travelSpeedFlag,
  }
}

export interface FeatureSet {
  amountLog: number
  amountZScore: number
  hourOfDay: number
  hourSin: number
  hourCos: number
  isWeekend: number
  isNight: number
  stateRiskScore: number
  isSuspiciousLocation: number
  isCrossBorder: number
  txTypeRisk: number
  amountToBalance: number
  benfordDev: number
  isRound: number
  senderRisk: number
  kycRisk: number
  velocity1h: number
  velocity24h: number
  amountVsAvg: number
  deviceConsistency: number
  ipRisk: number
  travelSpeedFlag: number
}

export const FEATURE_NAMES = [
  'amountLog', 'amountZScore', 'hourOfDay', 'hourSin', 'hourCos',
  'isWeekend', 'isNight', 'stateRiskScore', 'isSuspiciousLocation',
  'isCrossBorder', 'txTypeRisk', 'amountToBalance',
  'benfordDev', 'isRound', 'senderRisk', 'kycRisk',
  'velocity1h', 'velocity24h', 'amountVsAvg',
  'deviceConsistency', 'ipRisk', 'travelSpeedFlag',
]
