import type { DeviceTelemetry, TelecomResult } from '@/lib/types'

const SCAM_PATTERNS = [
  {
    category: 'KYC_EXPIRY' as const,
    regex: /(kyc|account|bank|sbi|hdfc|icici|axis)\b.*(block|suspend|deactivate|expire|update|verify|immediately)/i,
    flag: 'SMS_KYC_PHISHING_ATTEMPT',
    score: 45,
    summary: 'SMS indicates urgent KYC/Bank account suspension phishing scam'
  },
  {
    category: 'ELECTRICITY_BILL' as const,
    regex: /(electricity|power|bill|light)\b.*(disconnect|unpaid|tonight|power cut|update)/i,
    flag: 'SMS_ELECTRICITY_SCAM',
    score: 40,
    summary: 'SMS threatens immediate electricity disconnection'
  },
  {
    category: 'LOTTERY_JOB' as const,
    regex: /(lottery|prize|won|reward|cashback|claim|job|part-time|salary|daily income)/i,
    flag: 'SMS_LOTTERY_JOB_SCAM',
    score: 35,
    summary: 'SMS lures user with fake prize, lottery win, or job offer'
  },
  {
    category: 'PHISHING_URL' as const,
    regex: /(http:\/\/|https:\/\/|bit\.ly|tinyurl|t\.co|goo\.gl|apk|download)/i,
    flag: 'SMS_SUSPICIOUS_URL_DETECTED',
    score: 35,
    summary: 'SMS contains suspicious unverified URL or APK link'
  }
]

export function telecomAgent(telemetry?: DeviceTelemetry): TelecomResult {
  const ruleFlags: string[] = []
  let riskScore = 0
  let scamCategory: TelecomResult['scamCategory'] = 'NONE'
  const evidenceSummary: string[] = []

  if (!telemetry) {
    return { ruleFlags, riskScore: 0, scamCategory: 'NONE', evidenceSummary: [] }
  }

  // 1. Evaluate Voice Call Vishing Risk
  if (telemetry.isOnActiveCall) {
    ruleFlags.push('ACTIVE_VOICE_CALL_DURING_TX')
    riskScore += 35
    scamCategory = 'SCREEN_SHARE_CALL'
    evidenceSummary.push('Payment initiated while active voice call is connected (Vishing indicator)')
    
    if (telemetry.callDurationSec && telemetry.callDurationSec > 120) {
      ruleFlags.push('LONG_DURATION_SCAM_CALL')
      riskScore += 15
      evidenceSummary.push(`Active call duration exceeding 2 minutes (${Math.floor(telemetry.callDurationSec / 60)}m)`)
    }
  }

  // 2. Evaluate SMS Social Engineering NLP
  if (telemetry.recentSms) {
    const smsText = telemetry.recentSms

    for (const pattern of SCAM_PATTERNS) {
      if (pattern.regex.test(smsText)) {
        ruleFlags.push(pattern.flag)
        riskScore += pattern.score
        if (scamCategory === 'NONE') {
          scamCategory = pattern.category
        }
        evidenceSummary.push(pattern.summary)
      }
    }

    // High risk if unknown mobile number sent bank-like SMS
    if (telemetry.smsSender && /^\+?91[6-9]\d{9}$/.test(telemetry.smsSender.replace(/\s+/g, ''))) {
      ruleFlags.push('UNVERIFIED_PERSONAL_SENDER_SMS')
      riskScore += 15
      evidenceSummary.push(`Scam SMS received from non-bank personal phone number (${telemetry.smsSender})`)
    }
  }

  // Combination Rule: Active Call + Phishing SMS = High Confidence Fraud
  if (telemetry.isOnActiveCall && telemetry.recentSms && ruleFlags.length > 1) {
    ruleFlags.push('VISHING_PLUS_SMS_CORRELATION')
    riskScore += 25
    evidenceSummary.push('HIGH ALERT: Live call correlated with scam SMS received prior to transaction')
  }

  return {
    ruleFlags,
    riskScore: Math.min(riskScore, 100),
    scamCategory,
    evidenceSummary
  }
}
