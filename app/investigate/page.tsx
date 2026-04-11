'use client'

import { useState, useCallback } from 'react'
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
import type { Transaction, ProcessedTransaction, AgentStep, DetectiveResult, ResearchResult, RiskResult } from '@/lib/types'

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

export default function InvestigatePage() {
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setIsInvestigating(true)
    setSteps(initialSteps)
    setCurrentStepIndex(0)

    const transaction: Transaction = {
      txn_id: `TXN-INV-${Date.now()}`,
      user_id: formData.user_id || `USER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: parseFloat(formData.amount) || 0,
      location: formData.location || indianCities[0],
      ip: formData.ip || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device: formData.device,
      timestamp: new Date().toISOString(),
    }

    try {
      // Simulate step-by-step processing with visual feedback
      const updatedSteps = [...initialSteps]

      // Step 1: Detective Agent
      updatedSteps[0].status = 'processing'
      setSteps([...updatedSteps])
      await new Promise(resolve => setTimeout(resolve, 1500))
      
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
      await new Promise(resolve => setTimeout(resolve, 1800))
      
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
      await new Promise(resolve => setTimeout(resolve, 1200))
      
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
      await new Promise(resolve => setTimeout(resolve, 1000))

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

      // Update steps with actual results
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Transaction Investigation</h1>
          <p className="text-muted-foreground">Enter transaction details to run a comprehensive fraud analysis</p>
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
                Enter the bank transaction details to investigate
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
                      className="bg-secondary/50"
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
                      placeholder="e.g., 192.168.1.1"
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
                      Investigating...
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
                AI Agent Pipeline
              </CardTitle>
              <CardDescription>
                Watch each agent analyze the transaction in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Enter transaction details and click &quot;Start Investigation&quot;</p>
                    <p className="text-sm mt-2">to see the AI agents in action</p>
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
                                    animation: step.status === 'processing' && i === currentStepIndex % 5 
                                      ? 'pulse 1s infinite' 
                                      : 'none'
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
        </div>

        {/* Investigation Result */}
        {result && (
          <Card className="mt-6 bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Investigation Complete
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
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-sm">{result.txn_id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-lg">{'\u20B9'}{result.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Location</span>
                      <span>{result.location}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Device</span>
                      <span className="capitalize">{result.device}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Timestamp</span>
                      <span className="flex items-center gap-1">
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
                          {/* Background arc */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-secondary"
                          />
                          {/* Colored arc based on risk */}
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
                        <div className="absolute inset-0 flex items-center justify-center pt-4">
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
                            <Badge key={flag} variant="outline" className="text-xs">
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
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">{result.report}</p>
                  </div>

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
                              <span className="text-xs w-20 text-right">
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
      </main>
    </div>
  )
}
