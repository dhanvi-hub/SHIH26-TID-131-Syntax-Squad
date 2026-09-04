'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
} from 'lucide-react'
import type { Transaction, ProcessedTransaction, DetectiveResult, ResearchResult, RiskResult } from '@/lib/types'

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
  result?: DetectiveResult | ResearchResult | RiskResult | string
  color: string
}

function InvestigateContent() {
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    location: '',
    ip: '',
    device: 'mobile' as 'mobile' | 'desktop',
  })
  
  const [isInvestigating, setIsInvestigating] = useState(false)
  const [steps, setSteps] = useState<InvestigationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [result, setResult] = useState<ProcessedTransaction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoStarted, setAutoStarted] = useState(false)

  const initialSteps: InvestigationStep[] = [
    {
      agent: 'Detective Agent',
      icon: Search,
      status: 'pending',
      description: 'Analyzing transaction patterns and applying rule-based detection',
      color: 'text-blue-500',
    },
    {
      agent: 'Research Agent',
      icon: UserCheck,
      status: 'pending',
      description: 'Investigating user history and behavioral patterns',
      color: 'text-purple-500',
    },
    {
      agent: 'Telecom & NLP Agent',
      icon: Smartphone,
      status: 'pending',
      description: 'Parsing SMS phishing triggers & voice vishing risk telemetry',
      color: 'text-cyan-500',
    },
    {
      agent: 'Risk Engine',
      icon: Brain,
      status: 'pending',
      description: 'Calculating comprehensive risk score',
      color: 'text-orange-500',
    },
    {
      agent: 'Reporting Agent',
      icon: FileText,
      status: 'pending',
      description: 'Generating detailed fraud analysis report',
      color: 'text-green-500',
    },
  ]

  const runInvestigationForData = useCallback(async (data: typeof formData, customTxnId?: string) => {
    setError(null)
    setResult(null)
    setIsInvestigating(true)
    setSteps(initialSteps)
    setCurrentStepIndex(0)

    const transaction: Transaction = {
      txn_id: customTxnId || `TXN-INV-${Date.now()}`,
      user_id: data.user_id || `USER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: parseFloat(data.amount) || 0,
      location: data.location || indianCities[0],
      ip: data.ip || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device: data.device,
      timestamp: new Date().toISOString(),
    }

    try {
      const updatedSteps = [...initialSteps]

      // Step 1: Detective Agent
      updatedSteps[0].status = 'processing'
      setSteps([...updatedSteps])
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Step 2: Research Agent
      updatedSteps[0].status = 'complete'
      updatedSteps[0].details = [
        'Checking transaction amount thresholds',
        'Analyzing velocity patterns',
        'Validating location data',
        'Checking IP reputation',
        'Reviewing device fingerprint',
      ]
      updatedSteps[1].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(1)
      await new Promise(resolve => setTimeout(resolve, 1400))
      
      // Step 3: Risk Engine
      updatedSteps[1].status = 'complete'
      updatedSteps[1].details = [
        'Fetching user transaction history',
        'Computing average transaction amount',
        'Analyzing common transaction locations',
        'Reviewing device usage patterns',
        'Generating behavioral profile',
      ]
      updatedSteps[2].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(2)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 4: Reporting Agent
      updatedSteps[2].status = 'complete'
      updatedSteps[2].details = [
        'Combining detective findings',
        'Weighting research insights',
        'Calculating final risk score',
        'Determining transaction status',
      ]
      updatedSteps[3].status = 'processing'
      setSteps([...updatedSteps])
      setCurrentStepIndex(3)
      await new Promise(resolve => setTimeout(resolve, 800))

      // Complete - Make actual API call
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        throw new Error('Investigation failed')
      }

      const processedTxn: ProcessedTransaction = await response.json()

      updatedSteps[3].status = 'complete'
      updatedSteps[3].details = [
        'Compiling investigation findings',
        'Generating human-readable summary',
        'Creating actionable recommendations',
        'Finalizing fraud analysis report',
      ]

      if (processedTxn.agentResults) {
        updatedSteps[0].result = processedTxn.agentResults.detective
        updatedSteps[1].result = processedTxn.agentResults.research
        updatedSteps[2].result = processedTxn.agentResults.risk
        updatedSteps[3].result = processedTxn.report
      }

      setSteps([...updatedSteps])
      setResult(processedTxn)
      setCurrentStepIndex(4)
    } catch (err) {
      setError('Investigation failed. Please try again.')
      console.error(err)
    } finally {
      setIsInvestigating(false)
    }
  }, [])

  // Synchronize transaction parameters from URL search query on load
  useEffect(() => {
    if (autoStarted) return
    const txn_id = searchParams.get('txn_id')
    const user_id = searchParams.get('user_id')
    const amount = searchParams.get('amount')
    const locationParam = searchParams.get('location')
    const ip = searchParams.get('ip')
    const device = searchParams.get('device')

    if (amount || locationParam || user_id || txn_id) {
      let matchedLocation = ''
      if (locationParam) {
        const found = indianCities.find(c => c.toLowerCase().includes(locationParam.toLowerCase()))
        if (found) matchedLocation = found
        else matchedLocation = locationParam
      }

      const transferredData = {
        user_id: user_id || `USER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        amount: amount || '50000',
        location: matchedLocation || indianCities[0],
        ip: ip || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        device: (device as 'mobile' | 'desktop') || 'mobile',
      }

      setFormData(transferredData)
      setAutoStarted(true)
      
      // Auto trigger investigation pipeline for transferred transaction data!
      runInvestigationForData(transferredData, txn_id || undefined)
    }
  }, [searchParams, autoStarted, runInvestigationForData])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    runInvestigationForData(formData)
  }, [formData, runInvestigationForData])

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
Timestamp: ${new Date(result.timestamp).toLocaleString('en-IN')}

INVESTIGATION RESULTS
---------------------
Final Status: ${result.status}
Risk Score: ${result.riskScore}/100

DETECTIVE AGENT FINDINGS
------------------------
Rule Flags Triggered: ${result.agentResults.detective.ruleFlags.join(', ') || 'None'}
Initial Risk Score: ${result.agentResults.detective.riskScore}

RESEARCH AGENT FINDINGS
-----------------------
Average Transaction Amount: ₹${result.agentResults.research.averageAmount.toLocaleString('en-IN')}
Common Locations: ${result.agentResults.research.commonLocations.join(', ') || 'N/A'}
Common Devices: ${result.agentResults.research.commonDevices.join(', ') || 'N/A'}
Research Findings: ${result.agentResults.research.findings.join('; ') || 'None'}
Additional Risk Score: ${result.agentResults.research.additionalRiskScore}

RISK ENGINE ASSESSMENT
----------------------
Combined Risk Score: ${result.agentResults.risk.riskScore}
Final Classification: ${result.agentResults.risk.status}

FRAUD CRITERIA ANALYSIS
-----------------------
${result.fraudCriteria ? Object.entries(result.fraudCriteria)
  .filter(([, value]) => value > 0)
  .map(([key, value]) => `- ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}%`)
  .join('\n') : 'N/A'}

DETAILED ANALYSIS
-----------------
${result.report}

RECOMMENDATIONS
---------------
${result.status === 'FRAUD' ? '- Block the transaction immediately\n- Notify the account holder\n- Escalate to fraud investigation team\n- Consider temporary account freeze' : 
  result.status === 'SUSPICIOUS' ? '- Request additional verification\n- Monitor subsequent transactions\n- Flag for manual review' :
  '- Transaction appears legitimate\n- No immediate action required'}

---
Report generated by AI Fraud Detection System
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
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Transaction Data Entry
          </CardTitle>
          <CardDescription>
            Enter or review bank transaction details to investigate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_id" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  User/Account ID
                </Label>
                <Input
                  id="user_id"
                  placeholder="e.g., USER-ABC123"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="bg-secondary/50 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Transaction Amount (INR)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-secondary/50 font-mono text-xs"
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
                <SelectTrigger className="bg-secondary/50 font-mono text-xs">
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
                  placeholder="e.g., 192.168.1.1"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  className="bg-secondary/50 font-mono text-xs"
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
                  <SelectTrigger className="bg-secondary/50 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-4" />

            <Button
              type="submit"
              className="w-full font-mono text-xs"
              size="lg"
              disabled={isInvestigating || !formData.amount}
            >
              {isInvestigating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Running Multi-Agent AI Pipeline...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Start AI Investigation
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
            AI Agent Pipeline
          </CardTitle>
          <CardDescription>
            Watch each autonomous agent analyze the transaction in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Enter transaction details or click on a threat vector in the map</p>
                <p className="text-sm mt-2">to trigger real-time AI investigation</p>
              </div>
            ) : (
              steps.map((step, index) => (
                <div
                  key={step.agent}
                  className={`relative p-4 rounded-lg border transition-all duration-500 ${
                    step.status === 'processing'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : step.status === 'complete'
                      ? 'border-safe/50 bg-safe/5'
                      : 'border-border bg-secondary/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        step.status === 'processing'
                          ? 'bg-primary/20'
                          : step.status === 'complete'
                          ? 'bg-safe/20'
                          : 'bg-secondary'
                      }`}
                    >
                      {step.status === 'processing' ? (
                        <Loader2 className={`h-6 w-6 ${step.color} animate-spin`} />
                      ) : step.status === 'complete' ? (
                        <CheckCircle2 className="h-6 w-6 text-safe" />
                      ) : (
                        <step.icon className={`h-6 w-6 ${step.color} opacity-50`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{step.agent}</h3>
                        <Badge
                          variant="outline"
                          className={
                            step.status === 'processing'
                              ? 'text-primary border-primary'
                              : step.status === 'complete'
                              ? 'text-safe border-safe'
                              : 'text-muted-foreground'
                          }
                        >
                          {step.status === 'processing' ? 'Analyzing...' : step.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      
                      {/* Show details when processing or complete */}
                      {step.details && step.status !== 'pending' && (
                        <div className="mt-3 space-y-1">
                          {step.details.map((detail, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 text-xs ${
                                step.status === 'complete' ? 'text-muted-foreground' : 'text-foreground'
                              }`}
                              style={{
                                opacity: step.status === 'processing' ? (i <= currentStepIndex ? 1 : 0.3) : 1,
                              }}
                            >
                              {step.status === 'complete' ? (
                                <CheckCircle2 className="h-3 w-3 text-safe" />
                              ) : (
                                <ArrowRight className="h-3 w-3" />
                              )}
                              {detail}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Show result summary for completed agents */}
                      {step.status === 'complete' && step.result && (
                        <div className="mt-3 p-2 bg-secondary/50 rounded text-xs">
                          {step.agent === 'Detective Agent' && (
                            <span className="text-blue-400">
                              {(step.result as DetectiveResult).ruleFlags.length > 0
                                ? `Flags: ${(step.result as DetectiveResult).ruleFlags.join(', ')}`
                                : 'No flags triggered'}
                            </span>
                          )}
                          {step.agent === 'Research Agent' && (
                            <span className="text-purple-400">
                              {(step.result as ResearchResult).findings.length > 0
                                ? (step.result as ResearchResult).findings[0]
                                : 'User profile analyzed'}
                            </span>
                          )}
                          {step.agent === 'Risk Engine' && (
                            <span className={
                              (step.result as RiskResult).status === 'SAFE' ? 'text-safe' :
                              (step.result as RiskResult).status === 'SUSPICIOUS' ? 'text-suspicious' :
                              'text-fraud'
                            }>
                              Risk Score: {(step.result as RiskResult).riskScore}/100 - {(step.result as RiskResult).status}
                            </span>
                          )}
                          {step.agent === 'Reporting Agent' && (
                            <span className="text-green-400">
                              Report generated successfully
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-[2.1rem] top-full w-0.5 h-4 bg-border" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Investigation Result */}
      {result && (
        <Card className="lg:col-span-2 mt-2 bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Investigation Dossier Complete
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
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="text-cyan-400 font-bold">{result.txn_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg text-slate-100">{'\u20B9'}{result.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-slate-200">{result.location}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Device</span>
                    <span className="capitalize text-slate-200">{result.device}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Timestamp</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="h-3 w-3" />
                      {new Date(result.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Risk Assessment</h3>
                <div className="space-y-4">
                  {/* Risk Score Gauge */}
                  <div className="relative h-32 flex items-center justify-center">
                    <div className="relative">
                      <svg viewBox="0 0 100 50" className="w-full h-auto">
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-secondary"
                        />
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke={
                            result.riskScore < 30 ? '#22c55e' :
                            result.riskScore < 60 ? '#f59e0b' : '#ef4444'
                          }
                          strokeWidth="8"
                          strokeDasharray={`${(result.riskScore / 100) * 126} 126`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pt-4 font-mono">
                        <span className="text-3xl font-bold">{result.riskScore}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Rule Flags */}
                  <div>
                    <p className="text-sm font-medium mb-2">Triggered Rules</p>
                    <div className="flex flex-wrap gap-2">
                      {result.ruleFlags.length > 0 ? (
                        result.ruleFlags.map((flag) => (
                          <Badge key={flag} variant="outline" className="text-xs font-mono border-red-500/40 text-red-400">
                            {flag.replace(/_/g, ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No rules triggered</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Report */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">AI Analysis Report</h3>
                <div className="bg-secondary/30 rounded-lg p-4 font-mono text-xs">
                  <p className="leading-relaxed">{result.report}</p>
                </div>

                {/* Telecom & SMS Telemetry Evidence */}
                {result.telemetry && (result.telemetry.recentSms || result.telemetry.isOnActiveCall) && (
                  <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-4 space-y-3 font-mono text-xs">
                    <h4 className="text-cyan-400 font-bold flex items-center gap-2">
                      <Smartphone className="h-4 w-4" /> Device Telemetry & Social Engineering Evidence
                    </h4>
                    {result.telemetry.recentSms && (
                      <div className="bg-black/50 p-2 rounded border border-cyan-500/20">
                        <span className="text-slate-400 block text-[10px] uppercase">Captured Inbox SMS Content:</span>
                        <span className="text-red-400 font-semibold">"{result.telemetry.recentSms}"</span>
                      </div>
                    )}
                    {result.agentResults?.telecom?.evidenceSummary && result.agentResults.telecom.evidenceSummary.length > 0 && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase mb-1">Threat Intel Findings:</span>
                        <ul className="list-disc list-inside text-amber-300 space-y-1">
                          {result.agentResults.telecom.evidenceSummary.map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Fraud Criteria Breakdown */}
                {result.fraudCriteria && Object.values(result.fraudCriteria).some(v => v > 0) && (
                  <div>
                    <p className="text-sm font-medium mb-2">Fraud Criteria Contribution</p>
                    <div className="space-y-2">
                      {Object.entries(result.fraudCriteria)
                        .filter(([, value]) => value > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-fraud rounded-full"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-xs w-24 text-right font-mono">
                              {key.replace(/([A-Z])/g, ' $1').trim()}: {value}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function InvestigatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Transaction Investigation</h1>
          <p className="text-muted-foreground">Enter transaction details or auto-investigate incoming geospatial vectors</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center p-12 font-mono text-cyan-400 gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>SYNCHRONIZING THREAT DOSSIER DATA...</span>
          </div>
        }>
          <InvestigateContent />
        </Suspense>
      </main>
    </div>
  )
}
