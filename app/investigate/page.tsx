'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  UserCheck,
  Brain,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  MapPin,
  Smartphone,
  IndianRupee,
  Wifi,
  Download,
  PhoneCall,
  Share2,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import type { 
  Transaction, 
  ProcessedTransaction, 
  DetectiveResult, 
  ResearchResult, 
  RiskResult,
  CrossInstitutionIntelligenceResult,
  SocialEngineeringResult,
  SocialEngineeringContext
} from '@/lib/types'

// Indian cities with their states
const indianCities = [
  'Mumbai, Maharashtra',
  'Delhi, Delhi',
  'Bangalore, Karnataka',
  'Hyderabad, Telangana',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Pune, Maharashtra',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
  'Lucknow, Uttar Pradesh',
  'Surat, Gujarat',
  'Kochi, Kerala',
  'Chandigarh, Punjab',
  'Indore, Madhya Pradesh',
  'Bhopal, Madhya Pradesh',
  'Patna, Bihar',
  'Guwahati, Assam',
  'Bhubaneswar, Odisha',
  'Thiruvananthapuram, Kerala',
  'Nagpur, Maharashtra',
]

interface InvestigationStep {
  agent: string
  icon: React.ElementType
  status: 'pending' | 'processing' | 'complete'
  description: string
  details?: string[]
  result?: DetectiveResult | ResearchResult | RiskResult | CrossInstitutionIntelligenceResult | SocialEngineeringResult | string
  color: string
}

export default function InvestigatePage() {
  const router = useRouter()

  const loadPresetScenario = (type: 'SCAM_MATCH' | 'NORMAL' | 'COERCION' | 'EMULATOR') => {
    if (type === 'SCAM_MATCH') {
      setFormData({
        user_id: 'USR002',
        amount: '20000',
        location: 'Delhi, Delhi',
        ip: '198.51.100.44',
        device: 'mobile',
        beneficiary_id: 'BEN-SCAM-7723',
        device_fingerprint: '',
        recent_call: 'no',
        caller_known: 'yes',
        call_duration: '',
        time_since_call: '',
        caller_risk_score: '',
        scam_pattern: 'none',
      })
    } else if (type === 'NORMAL') {
      setFormData({
        user_id: 'USR001',
        amount: '1500',
        location: 'Mumbai, Maharashtra',
        ip: '103.21.244.2',
        device: 'mobile',
        beneficiary_id: 'BEN-CLEAN-1001',
        device_fingerprint: '',
        recent_call: 'no',
        caller_known: 'yes',
        call_duration: '',
        time_since_call: '',
        caller_risk_score: '',
        scam_pattern: 'none',
      })
    } else if (type === 'COERCION') {
      setFormData({
        user_id: 'USR003',
        amount: '32000',
        location: 'Pune, Maharashtra',
        ip: '49.36.12.8',
        device: 'mobile',
        beneficiary_id: 'BEN-MERCHANT-55',
        device_fingerprint: '',
        recent_call: 'yes',
        caller_known: 'no',
        call_duration: '380',
        time_since_call: '2',
        caller_risk_score: '88',
        scam_pattern: 'payment_urgency',
      })
    } else if (type === 'EMULATOR') {
      setFormData({
        user_id: 'USR004',
        amount: '75000',
        location: 'Bangalore, Karnataka',
        ip: '185.220.101.5',
        device: 'desktop',
        beneficiary_id: 'BEN-UNKNOWN-44',
        device_fingerprint: 'FP-DEV-EMULATOR-77',
        recent_call: 'no',
        caller_known: 'yes',
        call_duration: '',
        time_since_call: '',
        caller_risk_score: '',
        scam_pattern: 'none',
      })
    }
  }

  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    location: '',
    ip: '',
    device: 'mobile' as 'mobile' | 'desktop',
    beneficiary_id: '',
    device_fingerprint: '',
    recent_call: 'no',
    caller_known: 'yes',
    call_duration: '',
    time_since_call: '',
    caller_risk_score: '',
    scam_pattern: 'none' as 'none' | 'payment_urgency' | 'account_closure_threat' | 'fake_kyc_request' | 'otp_payment_request' | 'lottery_prize',
  })
  
  const [isInvestigating, setIsInvestigating] = useState(false)
  const [steps, setSteps] = useState<InvestigationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [result, setResult] = useState<ProcessedTransaction | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialSteps: InvestigationStep[] = [
    {
      agent: 'Intelligence Agent',
      icon: Share2,
      status: 'pending',
      description: 'Privacy-preserving consortium lookup across participating banks',
      color: 'text-cyan-500',
    },
    {
      agent: 'Social Engineering Agent',
      icon: PhoneCall,
      status: 'pending',
      description: 'Analyzing communication metadata & scam pressure signatures',
      color: 'text-amber-500',
    },
    {
      agent: 'Detective Agent',
      icon: Search,
      status: 'pending',
      description: 'Evaluating active bank fraud rules from configuration',
      color: 'text-blue-500',
    },
    {
      agent: 'Research Agent',
      icon: UserCheck,
      status: 'pending',
      description: 'Investigating user history & behavioral baseline anomalies',
      color: 'text-purple-500',
    },
    {
      agent: 'Risk Engine',
      icon: Brain,
      status: 'pending',
      description: 'Executing ML ensemble & multi-signal fallback fusion',
      color: 'text-orange-500',
    },
    {
      agent: 'Reporting Agent',
      icon: FileText,
      status: 'pending',
      description: 'Compiling explainable investigation report & recommendations',
      color: 'text-green-500',
    },
  ]

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setIsInvestigating(true)
    setSteps(initialSteps)
    setCurrentStepIndex(0)

    const socialEngineering: SocialEngineeringContext = {
      recent_call: formData.recent_call === 'yes',
      caller_known: formData.caller_known === 'yes',
      call_duration: formData.call_duration ? parseInt(formData.call_duration) : undefined,
      time_since_call: formData.time_since_call ? parseInt(formData.time_since_call) : undefined,
      caller_risk_score: formData.caller_risk_score ? parseInt(formData.caller_risk_score) : undefined,
      scam_pattern: formData.scam_pattern,
    }

    const transaction: Transaction = {
      txn_id: `TXN-INV-${Date.now()}`,
      user_id: formData.user_id || `USER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: parseFloat(formData.amount) || 0,
      location: formData.location || indianCities[0],
      ip: formData.ip || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device: formData.device,
      timestamp: new Date().toISOString(),
      beneficiary_id: formData.beneficiary_id ? formData.beneficiary_id.trim() : undefined,
      device_fingerprint: formData.device_fingerprint ? formData.device_fingerprint.trim() : undefined,
      socialEngineering: (formData.recent_call === 'yes' || (formData.scam_pattern && formData.scam_pattern !== 'none')) ? socialEngineering : undefined,
    }

    try {
      const updatedSteps = [...initialSteps]

      // Step 1: Intelligence Agent
      updatedSteps[0].status = 'processing'
      setSteps([...updatedSteps])
      await new Promise(resolve => setTimeout(resolve, 600))
      updatedSteps[0].status = 'complete'
      updatedSteps[0].details = [
        'Hashing beneficiary identifier with SHA-256',
        'Querying privacy consortium database',
        'Verifying device reputation across 4 institutions',
      ]

      // Step 2: Social Engineering Agent
      updatedSteps[1].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(1)
      await new Promise(resolve => setTimeout(resolve, 600))
      updatedSteps[1].status = 'complete'
      updatedSteps[1].details = [
        'Evaluating recent interaction metadata',
        'Checking call-to-transaction velocity window',
        'Matching known coercion/urgency patterns',
      ]

      // Step 3: Detective Agent
      updatedSteps[2].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(2)
      await new Promise(resolve => setTimeout(resolve, 600))
      updatedSteps[2].status = 'complete'
      updatedSteps[2].details = [
        'Fetching active bank rules from store',
        'Evaluating threshold, velocity & pattern rules',
        'Checking cross-institution and scam rules',
      ]

      // Step 4: Research Agent
      updatedSteps[3].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(3)
      await new Promise(resolve => setTimeout(resolve, 600))
      updatedSteps[3].status = 'complete'
      updatedSteps[3].details = [
        'Computing spending baseline vs historical avg',
        'Analyzing device and location consistency',
        'Profiling velocity anomalies',
      ]

      // Step 5: Risk Engine
      updatedSteps[4].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(4)
      await new Promise(resolve => setTimeout(resolve, 700))
      updatedSteps[4].status = 'complete'
      updatedSteps[4].details = [
        'Running 3-layer ML Stacking Ensemble (IF + RF + XGBoost)',
        'Synthesizing 6 independent signal vectors',
        'Executing Multi-Signal Fallback & Escalation check',
      ]

      // Step 6: Reporting Agent
      updatedSteps[5].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(5)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Complete - API call
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        throw new Error('Investigation failed')
      }

      const processedTxn: ProcessedTransaction = await response.json()

      updatedSteps[5].status = 'complete'
      updatedSteps[5].details = [
        'Compiling findings and multi-signal disclosures',
        'Generating explainable AI analysis report',
        'Formulating recommended actions',
      ]

      if (processedTxn.agentResults) {
        updatedSteps[0].result = processedTxn.agentResults.intelligence
        updatedSteps[1].result = processedTxn.agentResults.socialEngineering
        updatedSteps[2].result = processedTxn.agentResults.detective
        updatedSteps[3].result = processedTxn.agentResults.research
        updatedSteps[4].result = processedTxn.agentResults.risk
        updatedSteps[5].result = processedTxn.report
      }

      setSteps([...updatedSteps])
      setResult(processedTxn)
      setCurrentStepIndex(6)
    } catch (err) {
      setError('Investigation failed. Please try again.')
      console.error(err)
    } finally {
      setIsInvestigating(false)
    }
  }, [formData])

  const downloadReport = useCallback(() => {
    if (!result) return

    const reportContent = `
FRAUD INVESTIGATION REPORT
==========================
Generated: ${new Date().toLocaleString('en-IN')}

TRANSACTION DETAILS
-------------------
Transaction ID: ${result.txn_id}
User ID: ${result.user_id}
Amount: ₹${result.amount.toLocaleString('en-IN')}
Location: ${result.location}
Device: ${result.device}
IP Address: ${result.ip}
Beneficiary ID: ${result.beneficiary_id || 'N/A'}
Device Fingerprint: ${result.device_fingerprint || 'N/A'}
Timestamp: ${new Date(result.timestamp).toLocaleString('en-IN')}

FINAL ASSESSMENT
----------------
Final Status: ${result.status}
Final Risk Score: ${result.riskScore}/100
${result.multiSignalEscalation?.enabled ? `
MULTI-SIGNAL ESCALATION
-----------------------
Status: TRIGGERED
Reason: ${result.multiSignalEscalation.reason}
Original ML Score: ${result.multiSignalEscalation.originalMLScore}/100
Escalated Score: ${result.multiSignalEscalation.escalatedScore}/100
Contributing Signals:
${result.multiSignalEscalation.contributingSignals.map(s => `  - ${s}`).join('\n')}
` : ''}

SIGNAL BREAKDOWN
----------------
ML Ensemble Risk: ${result.signals?.mlRisk ?? result.agentResults?.risk?.riskScore ?? 0}/100
Active Rules Risk: ${result.signals?.ruleRisk ?? result.agentResults?.detective?.riskScore ?? 0}/100
External Intelligence Risk: ${result.signals?.externalIntelligenceRisk ?? result.agentResults?.intelligence?.riskScore ?? 0}/100
Social Engineering Risk: ${result.signals?.socialEngineeringRisk ?? result.agentResults?.socialEngineering?.riskScore ?? 0}/100
Network Graph Risk: ${result.signals?.networkRisk ?? 0}/100
Behavioural Risk: ${result.signals?.behaviouralRisk ?? 0}/100

CROSS-INSTITUTION CONSORTIUM FINDINGS
-------------------------------------
${result.agentResults?.intelligence?.matched 
  ? `${result.agentResults.intelligence.summary}\nMatches: ${result.agentResults.intelligence.matches.map(m => `${m.signalType} (${m.riskLevel}, ${m.reportingInstitutionsCount} banks)`).join(', ')}`
  : 'No adverse consortium intelligence matches found.'}

SOCIAL ENGINEERING SCAM CONTEXT
-------------------------------
${result.agentResults?.socialEngineering?.detected
  ? `${result.agentResults.socialEngineering.explanation}\nSignals: ${result.agentResults.socialEngineering.contributingSignals.join('; ')}`
  : 'No suspicious social engineering context reported.'}

ACTIVE RULES TRIGGERED
----------------------
${result.agentResults?.detective?.ruleFlags?.join(', ') || 'None'}

AI ANALYSIS & RECOMMENDATIONS
-----------------------------
${result.report}

---
Report generated by AI Fraud Detection System with Multi-Signal Verification
    `.trim()

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fraud-report-${result.txn_id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE': return 'bg-safe text-white'
      case 'SUSPICIOUS': return 'bg-suspicious text-white'
      case 'FRAUD': return 'bg-fraud text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Transaction Investigation</h1>
          <p className="text-muted-foreground">Enter transaction details to run a comprehensive multi-signal fraud analysis</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Transaction Data Entry
              </CardTitle>
              <CardDescription>
                Enter transaction parameters along with optional consortium and interaction signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quick Demonstration Presets */}
                <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      Quick Demonstration Presets:
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">1-Click Injector</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadPresetScenario('SCAM_MATCH')}
                      className="text-[11px] h-7 px-2 font-mono hover:border-cyan-400 hover:text-cyan-400"
                    >
                      Cross-Bank Match
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadPresetScenario('NORMAL')}
                      className="text-[11px] h-7 px-2 font-mono hover:border-emerald-400 hover:text-emerald-400"
                    >
                      Normal Safe Txn
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadPresetScenario('COERCION')}
                      className="text-[11px] h-7 px-2 font-mono hover:border-amber-400 hover:text-amber-400"
                    >
                      Scam Coercion
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadPresetScenario('EMULATOR')}
                      className="text-[11px] h-7 px-2 font-mono hover:border-destructive hover:text-destructive"
                    >
                      Device Emulator
                    </Button>
                  </div>
                </div>

                {/* Core Transaction Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_id" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      User/Account ID
                    </Label>
                    <Input
                      id="user_id"
                      placeholder="e.g., USR001"
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Amount (INR)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="e.g., 50000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="bg-secondary/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Transaction Location
                  </Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip" className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      IP Address
                    </Label>
                    <Input
                      id="ip"
                      placeholder="e.g., 198.51.100.44"
                      value={formData.ip}
                      onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="device" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Device Type
                    </Label>
                    <Select
                      value={formData.device}
                      onValueChange={(value: 'mobile' | 'desktop') => setFormData({ ...formData, device: value })}
                    >
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cross-Institution Identifiers */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5" />
                      Consortium Identifiers (Optional)
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">SHA-256 Hashed before lookup</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="beneficiary_id" className="text-xs">Beneficiary Identifier</Label>
                      <Input
                        id="beneficiary_id"
                        placeholder="e.g., BEN-SCAM-7723"
                        value={formData.beneficiary_id}
                        onChange={(e) => setFormData({ ...formData, beneficiary_id: e.target.value })}
                        className="bg-secondary/50 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="device_fingerprint" className="text-xs">Device Hardware Fingerprint</Label>
                      <Input
                        id="device_fingerprint"
                        placeholder="e.g., FP-DEV-EMULATOR-77"
                        value={formData.device_fingerprint}
                        onChange={(e) => setFormData({ ...formData, device_fingerprint: e.target.value })}
                        className="bg-secondary/50 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Engineering Context */}
                <div className="pt-2 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <PhoneCall className="h-3.5 w-3.5" />
                      Social Engineering Context (Simulated Metadata)
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                      Metadata Only
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="recent_call" className="text-xs">Recent Inbound Call?</Label>
                      <Select
                        value={formData.recent_call}
                        onValueChange={(val) => setFormData({ ...formData, recent_call: val })}
                      >
                        <SelectTrigger className="bg-secondary/50 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No recent call</SelectItem>
                          <SelectItem value="yes">Yes (active call prior to transfer)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="caller_known" className="text-xs">Caller in Address Book?</Label>
                      <Select
                        value={formData.caller_known}
                        onValueChange={(val) => setFormData({ ...formData, caller_known: val })}
                      >
                        <SelectTrigger className="bg-secondary/50 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Known / Verified contact</SelectItem>
                          <SelectItem value="no">Unknown / Unregistered number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.recent_call === 'yes' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="time_since_call" className="text-[11px]">Minutes Before Txn</Label>
                        <Input
                          id="time_since_call"
                          type="number"
                          placeholder="e.g., 2"
                          value={formData.time_since_call}
                          onChange={(e) => setFormData({ ...formData, time_since_call: e.target.value })}
                          className="bg-secondary/50 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="call_duration" className="text-[11px]">Duration (Seconds)</Label>
                        <Input
                          id="call_duration"
                          type="number"
                          placeholder="e.g., 340"
                          value={formData.call_duration}
                          onChange={(e) => setFormData({ ...formData, call_duration: e.target.value })}
                          className="bg-secondary/50 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="caller_risk_score" className="text-[11px]">Caller Threat (0-100)</Label>
                        <Input
                          id="caller_risk_score"
                          type="number"
                          placeholder="e.g., 85"
                          value={formData.caller_risk_score}
                          onChange={(e) => setFormData({ ...formData, caller_risk_score: e.target.value })}
                          className="bg-secondary/50 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="scam_pattern" className="text-xs">Simulated Scam Pattern Signature</Label>
                    <Select
                      value={formData.scam_pattern}
                      onValueChange={(val: any) => setFormData({ ...formData, scam_pattern: val })}
                    >
                      <SelectTrigger className="bg-secondary/50 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Normal interaction</SelectItem>
                        <SelectItem value="payment_urgency">Payment Urgency (immediate emergency transfer)</SelectItem>
                        <SelectItem value="account_closure_threat">Account Closure Threat (imminent freeze warning)</SelectItem>
                        <SelectItem value="fake_kyc_request">Fake KYC Request (coercive verification transfer)</SelectItem>
                        <SelectItem value="otp_payment_request">OTP / Authorization Request (active solicitation)</SelectItem>
                        <SelectItem value="lottery_prize">Advance Fee / Lottery Prize Claim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-4" />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isInvestigating || !formData.amount}
                >
                  {isInvestigating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Evaluating Multi-Signal Pipeline...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Start Investigation
                    </>
                  )}
                </Button>

                {error && (
                  <p className="text-sm text-fraud text-center">{error}</p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Agent Pipeline Visualization */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Multi-Agent Intelligence Pipeline
              </CardTitle>
              <CardDescription>
                Real-time execution across 6 specialized fraud & intelligence agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Enter transaction details and click &quot;Start Investigation&quot;</p>
                    <p className="text-sm mt-2">to execute the multi-agent detection pipeline</p>
                  </div>
                ) : (
                  steps.map((step, index) => (
                    <div
                      key={step.agent}
                      className={`relative p-3.5 rounded-lg border transition-all duration-500 ${
                        step.status === 'processing'
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : step.status === 'complete'
                          ? 'border-safe/50 bg-safe/5'
                          : 'border-border bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-lg ${
                            step.status === 'processing'
                              ? 'bg-primary/20'
                              : step.status === 'complete'
                              ? 'bg-safe/20'
                              : 'bg-secondary'
                          }`}
                        >
                          {step.status === 'processing' ? (
                            <Loader2 className={`h-5 w-5 ${step.color} animate-spin`} />
                          ) : step.status === 'complete' ? (
                            <CheckCircle2 className="h-5 w-5 text-safe" />
                          ) : (
                            <step.icon className={`h-5 w-5 ${step.color} opacity-50`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">{step.agent}</h3>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${
                                step.status === 'processing'
                                  ? 'text-primary border-primary'
                                  : step.status === 'complete'
                                  ? 'text-safe border-safe'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {step.status === 'processing' ? 'Analyzing...' : step.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </p>

                          {step.status === 'complete' && step.result && (
                            <div className="mt-2 p-1.5 bg-secondary/50 rounded text-xs">
                              {step.agent === 'Intelligence Agent' && (
                                <span className={(step.result as CrossInstitutionIntelligenceResult).matched ? 'text-cyan-400 font-medium' : 'text-muted-foreground'}>
                                  {(step.result as CrossInstitutionIntelligenceResult).matched
                                    ? `Consortium Match: ${(step.result as CrossInstitutionIntelligenceResult).matches[0]?.signalType} (${(step.result as CrossInstitutionIntelligenceResult).riskScore}/100)`
                                    : 'No consortium match (Clear)'}
                                </span>
                              )}
                              {step.agent === 'Social Engineering Agent' && (
                                <span className={(step.result as SocialEngineeringResult).detected ? 'text-amber-400 font-medium' : 'text-muted-foreground'}>
                                  {(step.result as SocialEngineeringResult).detected
                                    ? `Scam Context Detected: ${(step.result as SocialEngineeringResult).detectedPatterns.join(', ') || 'Risk Elevating Interaction'}`
                                    : 'No social engineering context'}
                                </span>
                              )}
                              {step.agent === 'Detective Agent' && (
                                <span className="text-blue-400">
                                  {(step.result as DetectiveResult).ruleFlags.length > 0
                                    ? `Active Flags: ${(step.result as DetectiveResult).ruleFlags.join(', ')}`
                                    : 'No active rule flags'}
                                </span>
                              )}
                              {step.agent === 'Research Agent' && (
                                <span className="text-purple-400">
                                  {(step.result as ResearchResult).findings[0] || 'User baseline profile analyzed'}
                                </span>
                              )}
                              {step.agent === 'Risk Engine' && (
                                <span className={
                                  (step.result as RiskResult).status === 'SAFE' ? 'text-safe font-semibold' :
                                  (step.result as RiskResult).status === 'SUSPICIOUS' ? 'text-suspicious font-semibold' :
                                  'text-fraud font-semibold'
                                }>
                                  Final Risk Score: {(step.result as RiskResult).riskScore}/100 [{(step.result as RiskResult).status}]
                                </span>
                              )}
                              {step.agent === 'Reporting Agent' && (
                                <span className="text-green-400">
                                  Comprehensive investigation report generated
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investigation Result */}
        {result && (
          <div className="mt-6 space-y-6">
            {/* Multi-Signal Escalation Banner */}
            {result.multiSignalEscalation?.enabled && (
              <Card className="bg-amber-500/10 border-amber-500/40 animate-slide-in">
                <CardContent className="py-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 text-sm tracking-wide">
                        MULTI-SIGNAL ESCALATION TRIGGERED
                      </span>
                      <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-[10px]">
                        Safety Fallback Active
                      </Badge>
                    </div>
                    <p className="text-xs text-amber-200/90 mt-1">
                      {result.multiSignalEscalation.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="text-muted-foreground text-[11px]">Contributing evidence:</span>
                      {result.multiSignalEscalation.contributingSignals.map((sig, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[11px] bg-amber-500/20 text-amber-200">
                          {sig}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Investigation Assessment
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(result.status)} variant="default">
                      {result.status}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={downloadReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Transaction Summary */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Transaction Summary</h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Transaction ID</span>
                        <span className="font-mono text-xs">{result.txn_id}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-bold text-base">{'\u20B9'}{result.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Location</span>
                        <span>{result.location}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Device / IP</span>
                        <span className="capitalize">{result.device} ({result.ip})</span>
                      </div>
                      {result.beneficiary_id && (
                        <div className="flex justify-between items-center py-1.5 border-b border-border">
                          <span className="text-muted-foreground">Beneficiary</span>
                          <span className="font-mono text-xs">{result.beneficiary_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-muted-foreground">Timestamp</span>
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {new Date(result.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Signal Matrix */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Risk Contribution Matrix</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">ML Model Risk</span>
                        <span className="font-bold">{result.signals?.mlRisk ?? 0}/100</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${result.signals?.mlRisk ?? 0}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Active Bank Rules Risk</span>
                        <span className="font-bold">{result.signals?.ruleRisk ?? 0}/100</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${result.signals?.ruleRisk ?? 0}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">External Consortium Risk</span>
                        <span className="font-bold text-cyan-400">{result.signals?.externalIntelligenceRisk ?? 0}/100</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${result.signals?.externalIntelligenceRisk ?? 0}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Social Engineering Risk</span>
                        <span className="font-bold text-amber-400">{result.signals?.socialEngineeringRisk ?? 0}/100</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${result.signals?.socialEngineeringRisk ?? 0}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Network / Graph Velocity</span>
                        <span className="font-bold">{result.signals?.networkRisk ?? 0}/100</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${result.signals?.networkRisk ?? 0}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium mb-1.5">Triggered Active Rules</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.ruleFlags.length > 0 ? (
                          result.ruleFlags.map((flag, idx) => (
                            <Badge key={`${flag}-${idx}`} variant="outline" className="text-[10px]">
                              {flag.replace(/_/g, ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No active rules triggered</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Report */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">AI Investigation Report</h3>
                    <div className="bg-secondary/30 rounded-lg p-3.5 text-xs leading-relaxed text-foreground">
                      <p>{result.report}</p>
                    </div>

                    {result.agentResults?.intelligence?.matched && (
                      <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-500/30 text-xs">
                        <p className="font-semibold text-cyan-400 flex items-center gap-1.5 mb-1">
                          <Share2 className="h-3.5 w-3.5" />
                          Consortium Match Found
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {result.agentResults.intelligence.summary}
                        </p>
                      </div>
                    )}

                    {result.agentResults?.socialEngineering?.detected && (
                      <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-xs">
                        <p className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                          <PhoneCall className="h-3.5 w-3.5" />
                          Scam Pressure Context
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {result.agentResults.socialEngineering.explanation}
                        </p>
                      </div>
                    )}

                    {/* Actions: Download Report & Open Full Investigation Workspace */}
                    <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadReport}
                        className="w-full sm:w-auto gap-1.5"
                      >
                        <Download className="h-4 w-4" />
                        Download TXT Audit Log
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => router.push(`/investigation/${result.txn_id}`)}
                        className="w-full sm:w-auto gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        Open Workspace & Validate Case <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
