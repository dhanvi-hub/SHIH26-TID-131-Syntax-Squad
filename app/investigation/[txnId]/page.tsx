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
} from 'lucide-react'
import type { ProcessedTransaction } from '@/lib/types'

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
            <Badge variant="outline" className={`ml-auto ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Risk Score Card */}
        <Card className={`${getRiskBg(transaction.riskScore)} border-none`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Rule Flags */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-suspicious" />
                Triggered Rules
              </CardTitle>
              <CardDescription>Flags identified by the detection system</CardDescription>
            </CardHeader>
            <CardContent>
              {transaction.ruleFlags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-safe" />
                  <p>No suspicious rules triggered</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {transaction.ruleFlags.map((flag) => (
                    <Badge
                      key={flag}
                      variant="outline"
                      className="bg-destructive/10 text-destructive border-destructive/30"
                    >
                      {flag.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Agent Analysis Results */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Agent Analysis Results</CardTitle>
            <CardDescription>Detailed findings from each AI agent in the pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Detective Agent */}
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Detective Agent</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Rule-based detection score:</p>
                <p className={`text-2xl font-bold ${getRiskColor(transaction.agentResults.detective.riskScore)}`}>
                  {transaction.agentResults.detective.riskScore}
                </p>
              </div>

              {/* Research Agent */}
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <FileSearch className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Research Agent</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Behavioral analysis:</p>
                <ul className="text-sm space-y-1">
                  <li>Avg Amount: {'\u20B9'}{transaction.agentResults.research.averageAmount.toLocaleString('en-IN')}</li>
                  <li>Known Locations: {transaction.agentResults.research.commonLocations.join(', ') || 'N/A'}</li>
                  <li>Additional Risk: +{transaction.agentResults.research.additionalRiskScore}</li>
                </ul>
              </div>

              {/* Risk Engine */}
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Risk Engine</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Final assessment:</p>
                <p className={`text-2xl font-bold ${getRiskColor(transaction.agentResults.risk.riskScore)}`}>
                  {transaction.agentResults.risk.status}
                </p>
              </div>
            </div>

            {/* Research Findings */}
            {transaction.agentResults.research.findings.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
                <h4 className="font-medium mb-2">Behavioral Findings</h4>
                <ul className="space-y-1">
                  {transaction.agentResults.research.findings.map((finding, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Explanation */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              AI Explanation
            </CardTitle>
            <CardDescription>Human-readable analysis generated by the Reporting Agent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{transaction.report}</p>
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
