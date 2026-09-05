'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  ArrowLeft,
  MapPin,
  Smartphone,
  Globe,
  Clock,
  DollarSign,
  User,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Search,
  FileSearch,
  Gauge,
  Share2,
  PhoneCall,
  ShieldAlert,
  Brain,
  Shield,
  CheckCircle2,
  Network,
  Send,
  Building2,
  Check,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import type { ProcessedTransaction, HumanValidationDecision } from '@/lib/types'
import { renderPDFEntityGraph } from '@/lib/pdf/graph-renderer'

interface InvestigationPageProps {
  params: Promise<{ txnId: string }>
}

function getStatusColor(status: string) {
  switch (status) {
    case 'SAFE':
      return 'bg-safe/20 text-safe border-safe/30'
    case 'SUSPICIOUS':
      return 'bg-suspicious/20 text-suspicious border-suspicious/30'
    case 'FRAUD':
      return 'bg-fraud/20 text-fraud border-fraud/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getRiskColor(score: number) {
  if (score >= 60) return 'text-fraud'
  if (score >= 30) return 'text-suspicious'
  return 'text-safe'
}

function getRiskBg(score: number) {
  if (score >= 60) return 'bg-fraud/20'
  if (score >= 30) return 'bg-suspicious/20'
  return 'bg-safe/20'
}

export default function InvestigationPage({ params }: InvestigationPageProps) {
  const { txnId } = use(params)
  const router = useRouter()
  const [transaction, setTransaction] = useState<ProcessedTransaction | null>(null)
  const [userHistory, setUserHistory] = useState<ProcessedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Human Investigator Validation State
  const [decision, setDecision] = useState<HumanValidationDecision>('CONFIRMED_FRAUD')
  const [analystNotes, setAnalystNotes] = useState('')
  const [submitToConsortium, setSubmitToConsortium] = useState(true)
  const [reportingBank, setReportingBank] = useState('BANK_A')
  const [isValidating, setIsValidating] = useState(false)
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null)

  const handleValidate = async () => {
    if (!transaction) return
    try {
      setIsValidating(true)
      setValidationSuccess(null)
      const res = await fetch('/api/investigation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnId: transaction.txn_id,
          decision,
          analystNotes,
          submitToConsortium: decision === 'CONFIRMED_FRAUD' && submitToConsortium,
          reportingInstitution: reportingBank,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setTransaction((prev) => (prev ? { ...prev, humanValidation: data.validation } : null))
        setValidationSuccess(data.message)
      }
    } catch (err) {
      console.error('Validation submission failed:', err)
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await fetch(`/api/transactions/${txnId}`)
        if (!res.ok) {
          throw new Error('Transaction not found')
        }
        const data = await res.json()
        setTransaction(data.transaction)
        setUserHistory(data.userHistory || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction')
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [txnId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Transaction Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const downloadPDFReport = (txn: ProcessedTransaction) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)

    // Background
    doc.setFillColor(243, 244, 246)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // White card
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, margin, contentWidth, pageHeight - (margin * 2), 3, 3, 'F')

    let y = 30

    // Header
    doc.setFillColor(251, 191, 36)
    doc.triangle(25, y - 8, 35, y - 8, 30, y - 16, 'F')
    doc.setFillColor(0, 0, 0)
    doc.setFontSize(8)
    doc.text('!', 29, y - 10)

    doc.setTextColor(31, 41, 55)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Fraud Investigation Report', 42, y - 8)

    const badgeText = txn.status === 'FRAUD' ? 'SIZEABLE FRAUD ALERT!' : 
                      txn.status === 'SUSPICIOUS' ? 'SUSPICIOUS ACTIVITY' : 'SAFE TRANSACTION'
    const badgeColor = txn.status === 'FRAUD' ? [220, 38, 38] : 
                       txn.status === 'SUSPICIOUS' ? [245, 158, 11] : [34, 197, 94]

    doc.setFontSize(8)
    doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text(badgeText, pageWidth - margin - 5, y - 12, { align: 'right' })

    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    const dateStr = new Date(txn.timestamp).toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })
    const timeStr = new Date(txn.timestamp).toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    })
    doc.text(`${dateStr} | ${timeStr}`, pageWidth - margin - 5, y - 4, { align: 'right' })

    y += 15
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.5)
    doc.line(margin + 10, y, pageWidth - margin - 10, y)

    y += 15
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction Details', margin + 10, y)
    y += 10

    const tableData = [
      ['Transaction ID', txn.txn_id],
      ['User ID', txn.user_id],
      ['Beneficiary ID', txn.beneficiary_id || 'Direct Transfer'],
      ['Amount', `Rs. ${txn.amount.toLocaleString('en-IN')}`],
      ['Location', txn.location],
      ['IP Address', txn.ip],
      ['Device', txn.device],
      ['Risk Score', `${txn.riskScore}/100 (${txn.status})`],
    ]

    const colWidth = contentWidth - 20
    const labelWidth = 50

    tableData.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(margin + 10, y - 5, colWidth, 10, 'F')
      }
      doc.setDrawColor(229, 231, 235)
      doc.rect(margin + 10, y - 5, colWidth, 10, 'S')
      doc.line(margin + 10 + labelWidth, y - 5, margin + 10 + labelWidth, y + 5)

      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      doc.setFont('helvetica', 'normal')
      doc.text(label, margin + 15, y + 1)

      doc.setTextColor(31, 41, 55)
      doc.setFont('helvetica', 'bold')
      doc.text(value, margin + 15 + labelWidth, y + 1)

      y += 10
    })

    y += 15
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('AI & Detective Agent Findings', margin + 10, y)
    y += 10

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(75, 85, 99)
    const reportText = txn.report || 'No detailed analysis report generated.'
    const splitReport = doc.splitTextToSize(reportText, contentWidth - 20)
    doc.text(splitReport, margin + 10, y)

    y += (splitReport.length * 5) + 15

    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Active Triggered Rules & Risk Indicators', margin + 10, y)
    y += 10

    const flags = txn.ruleFlags || []
    if (flags.length === 0) {
      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      doc.text('No suspicious active rules triggered.', margin + 10, y)
    } else {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(220, 38, 38)
      doc.text(`Triggered Flags (${flags.length}): ${flags.join(', ')}`, margin + 10, y)
    }

    // Page 2: Static Vector Entity Relationship & Consortium Graph
    renderPDFEntityGraph(doc, txn)

    doc.save(`investigation-report-${txn.txn_id}.pdf`)
  }

  const intel = transaction.agentResults?.intelligence
  const social = transaction.agentResults?.socialEngineering
  const signals = transaction.signals
  const escalation = transaction.multiSignalEscalation

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Sub Header */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Transaction Investigation</h1>
              <p className="text-sm text-muted-foreground font-mono">{transaction.txn_id}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPDFReport(transaction)}
                className="gap-2 text-xs font-semibold"
              >
                <Download className="h-4 w-4" />
                Download PDF Report
              </Button>
              <Badge variant="outline" className={getStatusColor(transaction.status)}>
                {transaction.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Multi-Signal Escalation Banner */}
        {escalation?.enabled && (
          <Card className="bg-amber-500/10 border-amber-500/40">
            <CardContent className="py-4 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400 text-base">
                    MULTI-SIGNAL ESCALATION
                  </span>
                  <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-xs">
                    Independent Consensus Safety Net
                  </Badge>
                </div>
                <p className="text-sm text-amber-200/90 mt-1 font-medium">
                  {escalation.reason}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground text-xs self-center">Elevated independent signals:</span>
                  {escalation.contributingSignals.map((sig, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-amber-500/20 text-amber-200 text-xs">
                      {sig}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Score Card */}
        <Card className={`${getRiskBg(transaction.riskScore)} border-none`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Final Risk Score</p>
                <p className={`text-5xl font-bold ${getRiskColor(transaction.riskScore)}`}>
                  {transaction.riskScore}
                </p>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={`text-lg px-4 py-2 ${getStatusColor(transaction.status)}`}>
                  {transaction.status === 'FRAUD' && <AlertTriangle className="h-5 w-5 mr-2" />}
                  {transaction.status === 'SAFE' && <ShieldCheck className="h-5 w-5 mr-2" />}
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Details & Rules Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Transaction Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="font-medium">{transaction.user_id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium">{'\u20B9'}{transaction.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{transaction.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Device</p>
                    <p className="font-medium capitalize">{transaction.device}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-medium font-mono text-sm">{transaction.ip}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="font-medium text-sm">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {transaction.beneficiary_id && (
                  <div className="flex items-center gap-3 col-span-2 pt-2 border-t border-border">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Share2 className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Beneficiary Identifier</p>
                      <p className="font-mono text-sm">{transaction.beneficiary_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rule Flags */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-suspicious" />
                Active Triggered Rules
              </CardTitle>
              <CardDescription>Flags identified by active bank rules</CardDescription>
            </CardHeader>
            <CardContent>
              {transaction.ruleFlags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-safe" />
                  <p>No suspicious active rules triggered</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {transaction.ruleFlags.map((flag, idx) => (
                    <Badge
                      key={`${flag}-${idx}`}
                      variant="outline"
                      className="bg-destructive/10 text-destructive border-destructive/30 text-xs py-1 px-2.5"
                    >
                      {flag.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards: External Intelligence & Social Engineering */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* External Intelligence Card */}
          <Card className={`border ${intel?.matched ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-card border-border'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-cyan-400">
                  <Share2 className="h-5 w-5" />
                  Cross-Institution Intelligence
                </CardTitle>
                <Badge variant="outline" className={intel?.matched ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-muted-foreground'}>
                  {intel?.matched ? 'MATCH FOUND' : 'NO ADVERSE MATCH'}
                </Badge>
              </div>
              <CardDescription>
                Privacy-preserving pseudonymized consortium match across 4 institutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {intel?.matched ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-background/50 border border-cyan-500/20 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signal Type:</span>
                      <span className="font-bold text-cyan-300">{intel.matches[0]?.signalType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Threat Severity:</span>
                      <Badge variant="outline" className="text-[10px] text-fraud border-fraud/40">
                        {intel.matches[0]?.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consortium Confidence:</span>
                      <span className="font-mono font-bold">{(intel.matches[0]?.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reporting Institutions:</span>
                      <span className="font-bold text-cyan-400">
                        {intel.matches[0]?.contributingInstitutions?.join(', ') || `${intel.matches[0]?.reportingInstitutionsCount} participating banks`}
                      </span>
                    </div>
                    {intel.matches[0]?.recencyNote && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Signal Recency:</span>
                        <span className="text-foreground font-medium">{intel.matches[0].recencyNote}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pseudonymized Token:</span>
                      <span className="font-mono text-cyan-300 font-semibold">{intel.matches[0]?.pseudonymizedIdentifier || 'SHA256-***'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {intel.matches[0]?.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-300">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <Link href="/consortium" className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-sans">
                      Inspect Repository <ArrowLeft className="h-3 w-3 rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-safe" />
                  <p>No adverse cross-institution threat signals detected.</p>
                  <p className="text-[11px] mt-1 text-muted-foreground/80">Identifiers clear across 4 participating consortium banks.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Engineering Card */}
          <Card className={`border ${social?.detected ? 'bg-amber-950/20 border-amber-500/40' : 'bg-card border-border'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                  <PhoneCall className="h-5 w-5" />
                  Social Engineering & Scam Context
                </CardTitle>
                <Badge variant="outline" className={social?.detected ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-muted-foreground'}>
                  {social?.detected ? 'POTENTIAL SCAM CONTEXT' : 'NO SCAM SIGNALS'}
                </Badge>
              </div>
              <CardDescription>
                Interaction metadata & coercion pressure signature evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {social?.detected ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-background/50 border border-amber-500/20 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Detected Pattern:</span>
                      <span className="font-bold text-amber-300">{social.detectedPatterns.join(', ') || 'High Coercion Signature'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Contribution:</span>
                      <span className="font-bold text-amber-400 font-mono">+{social.riskScore}</span>
                    </div>
                    {transaction.socialEngineering && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Caller Verified:</span>
                          <span>{transaction.socialEngineering.caller_known ? 'Yes (Known)' : 'No (Unknown Number)'}</span>
                        </div>
                        {transaction.socialEngineering.time_since_call !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Execution Delta:</span>
                            <span>{transaction.socialEngineering.time_since_call} minutes after interaction</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    {social.contributingSignals.map((sig, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-amber-400">•</span>
                        {sig}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-safe" />
                  <p>No suspicious social engineering interaction context.</p>
                  <p className="text-[11px] mt-1 text-muted-foreground/80">Transaction initiated without recent unverified call coercion.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Multi-Signal Decision Matrix */}
        {signals && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Multi-Signal Risk Decomposition
              </CardTitle>
              <CardDescription>
                Independent evidence breakdown preventing ML single-point-of-failure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">ML Model</p>
                  <p className={`text-xl font-bold ${getRiskColor(signals.mlRisk)}`}>{signals.mlRisk}</p>
                  <p className="text-[10px] text-muted-foreground">Stacking Ensemble</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Active Rules</p>
                  <p className={`text-xl font-bold ${getRiskColor(signals.ruleRisk)}`}>{signals.ruleRisk}</p>
                  <p className="text-[10px] text-muted-foreground">Detective Agent</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">External Intel</p>
                  <p className={`text-xl font-bold text-cyan-400`}>{signals.externalIntelligenceRisk}</p>
                  <p className="text-[10px] text-muted-foreground">Consortium DB</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Social Eng.</p>
                  <p className={`text-xl font-bold text-amber-400`}>{signals.socialEngineeringRisk}</p>
                  <p className="text-[10px] text-muted-foreground">Scam Metadata</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Network Graph</p>
                  <p className={`text-xl font-bold ${getRiskColor(signals.networkRisk)}`}>{signals.networkRisk}</p>
                  <p className="text-[10px] text-muted-foreground">Velocity Graph</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Behaviour</p>
                  <p className={`text-xl font-bold ${getRiskColor(signals.behaviouralRisk)}`}>{signals.behaviouralRisk}</p>
                  <p className="text-[10px] text-muted-foreground">Profile Baseline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entity Relationship & Consortium Graph Component */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Entity Relationship & Consortium Graph
              </CardTitle>
              <Badge variant="outline" className="text-xs font-mono">
                Multi-Entity Privacy View
              </Badge>
            </div>
            <CardDescription>
              Privacy-preserving graph topology tracing transaction entities to inter-bank threat intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                {/* User Node */}
                <div className="p-3 rounded-lg bg-card border border-border text-center space-y-1">
                  <div className="p-2 rounded-full bg-primary/10 text-primary w-8 h-8 mx-auto flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Originator Account</p>
                  <p className="font-mono text-xs font-bold text-foreground">{transaction.user_id}</p>
                  <Badge variant="outline" className="text-[9px]">Local Account</Badge>
                </div>

                {/* Connection */}
                <div className="hidden md:flex flex-col items-center text-muted-foreground text-xs font-mono">
                  <span className="text-[10px] text-primary/70">authorizes</span>
                  <span>──────►</span>
                </div>

                {/* Transaction Core */}
                <div className="p-3 rounded-lg bg-card border border-primary/40 text-center space-y-1 shadow-sm">
                  <div className="p-2 rounded-full bg-primary/20 text-primary w-8 h-8 mx-auto flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Active Transaction</p>
                  <p className="font-mono text-xs font-bold text-primary">₹{transaction.amount.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getRiskBg(transaction.riskScore)} ${getRiskColor(transaction.riskScore)}`}>
                    {transaction.status} ({transaction.riskScore}/100)
                  </span>
                </div>

                {/* Connection */}
                <div className="hidden md:flex flex-col items-center text-muted-foreground text-xs font-mono">
                  <span className="text-[10px] text-cyan-400/70">routes to</span>
                  <span>──────►</span>
                </div>

                {/* Beneficiary Node */}
                <div className={`p-3 rounded-lg border text-center space-y-1 ${
                  intel?.matched ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-card border-border'
                }`}>
                  <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-400 w-8 h-8 mx-auto flex items-center justify-center">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Destination Entity</p>
                  <p className="font-mono text-xs font-bold text-foreground">
                    {transaction.beneficiary_id || 'Direct Transfer'}
                  </p>
                  {intel?.matched ? (
                    <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/30">
                      Consortium Flagged
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] text-muted-foreground">Unflagged</Badge>
                  )}
                </div>
              </div>

              {/* Connected Nodes: Device, IP, and Consortium Intelligence Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                <div className="p-2.5 rounded bg-background/50 border border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Hardware Fingerprint</span>
                      <span className="font-mono font-medium">{transaction.device_fingerprint || transaction.device}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-background/50 border border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Network IP / Node</span>
                      <span className="font-mono font-medium">{transaction.ip} ({transaction.location})</span>
                    </div>
                  </div>
                </div>

                <div className={`p-2.5 rounded border flex items-center justify-between text-xs ${
                  intel?.matched ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' : 'bg-background/50 border-border'
                }`}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Consortium Corroboration</span>
                      <span className="font-semibold text-cyan-300">
                        {intel?.matched ? `${intel.matches[0]?.reportingInstitutionsCount} Participating Banks` : 'No External Reports'}
                      </span>
                    </div>
                  </div>
                  {intel?.matched && (
                    <span className="font-mono text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30 text-cyan-300">
                      {intel.matches[0]?.confidence ? `${Math.round(intel.matches[0].confidence * 100)}% Conf` : 'HIGH'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Human Validation & Feedback Loop Panel */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Human Investigator Validation & ML Feedback
                </CardTitle>
                <CardDescription>
                  Record verified fraud determination to close the ML feedback loop and share intelligence across banks
                </CardDescription>
              </div>
              {transaction.humanValidation ? (
                <Badge
                  className={`font-semibold px-2.5 py-1 ${
                    transaction.humanValidation.status === 'CONFIRMED_FRAUD'
                      ? 'bg-destructive text-destructive-foreground'
                      : transaction.humanValidation.status === 'LEGITIMATE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {transaction.humanValidation.status.replace(/_/g, ' ')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-dashed">
                  AWAITING HUMAN REVIEW
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {transaction.humanValidation && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-xs space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Validated by: <strong className="text-foreground">{transaction.humanValidation.validatedBy}</strong></span>
                  <span>{new Date(transaction.humanValidation.validatedAt).toLocaleString()}</span>
                </div>
                {transaction.humanValidation.notes && (
                  <p className="text-foreground italic mt-1">"{transaction.humanValidation.notes}"</p>
                )}
                {transaction.humanValidation.submittedToConsortium && (
                  <p className="text-cyan-400 font-semibold flex items-center gap-1 pt-1">
                    <Share2 className="h-3.5 w-3.5" /> Threat indicator published to Cross-Institution Consortium Network
                  </p>
                )}
              </div>
            )}

            {/* Decision Selection Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Select Investigator Determination:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDecision('CONFIRMED_FRAUD')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    decision === 'CONFIRMED_FRAUD'
                      ? 'bg-destructive text-destructive-foreground border-destructive'
                      : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  CONFIRMED FRAUD
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('LEGITIMATE')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    decision === 'LEGITIMATE'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  LEGITIMATE
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('FALSE_POSITIVE')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    decision === 'FALSE_POSITIVE'
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  FALSE POSITIVE
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('NEEDS_FURTHER_INVESTIGATION')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    decision === 'NEEDS_FURTHER_INVESTIGATION'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  FURTHER REVIEW
                </button>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Investigator Audit Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Beneficiary confirmed connected to impersonation scam syndicate..."
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-secondary border border-border text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Reporting Institution:
                </label>
                <select
                  value={reportingBank}
                  onChange={(e) => setReportingBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-secondary border border-border text-foreground"
                >
                  <option value="BANK_A">Bank A (Apex Bank Ltd)</option>
                  <option value="BANK_B">Bank B (Horizon Financial Corp)</option>
                  <option value="BANK_C">Bank C (Nexus Payments Network)</option>
                  <option value="BANK_D">Bank D (Zenith Credit Union)</option>
                </select>
              </div>
            </div>

            {decision === 'CONFIRMED_FRAUD' && (
              <div className="p-3 rounded bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="consortiumCheck"
                    checked={submitToConsortium}
                    onChange={(e) => setSubmitToConsortium(e.target.checked)}
                    className="rounded border-border text-cyan-500 focus:ring-cyan-400 h-4 w-4"
                  />
                  <label htmlFor="consortiumCheck" className="text-xs text-cyan-200 cursor-pointer">
                    Publish pseudonymized indicator ({transaction.beneficiary_id ? `Beneficiary: ${transaction.beneficiary_id}` : `Device: ${transaction.device}`}) to Consortium
                  </label>
                </div>
                <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30 font-mono">
                  Hashed Token
                </Badge>
              </div>
            )}

            {validationSuccess && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {validationSuccess}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-muted-foreground">
                Feedback stored in ML dataset for offline retraining (captures False Negatives & Positives).
              </p>
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                {isValidating ? 'Recording...' : 'Submit Investigation Verdict'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Explanation Report */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              AI Investigation Report
            </CardTitle>
            <CardDescription>Human-readable analysis generated by the Reporting Agent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed text-sm">{transaction.report}</p>
          </CardContent>
        </Card>

        {/* User Transaction History */}
        {userHistory.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>User Transaction History</CardTitle>
              <CardDescription>Recent transactions from {transaction.user_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userHistory.map((txn) => (
                  <div
                    key={txn.txn_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/investigation/${txn.txn_id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getStatusColor(txn.status)}>
                        {txn.status}
                      </Badge>
                      <span className="font-mono text-sm">{txn.txn_id}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{txn.location}</span>
                      <span className="font-medium">{'\u20B9'}{txn.amount.toLocaleString('en-IN')}</span>
                      <span className={`font-bold ${getRiskColor(txn.riskScore)}`}>
                        {txn.riskScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
