'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { useStreaming } from '@/contexts/streaming-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  PhoneCall,
  PhoneOff,
  AlertTriangle,
  ArrowLeft,
  Search,
  Clock,
  User,
  MapPin,
  IndianRupee,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import type { ProcessedTransaction } from '@/lib/types'

function getStatusBadge(status: string) {
  switch (status) {
    case 'SAFE':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'SUSPICIOUS':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'FRAUD':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getRiskColor(score: number) {
  if (score >= 60) return 'text-red-400'
  if (score >= 30) return 'text-amber-400'
  return 'text-emerald-400'
}

export default function SocialEngineeringQueuePage() {
  const router = useRouter()
  const { transactions, seedTransactions } = useStreaming()
  const [searchQuery, setSearchQuery] = useState('')
  const [patternFilter, setPatternFilter] = useState('ALL')
  const [isSeeding, setIsSeeding] = useState(false)

  // Authoritative filter: exact same condition as dashboard scamCallCount
  const allCoercionCases = useMemo(() => {
    return transactions.filter((t) => Boolean(t.agentResults?.socialEngineering?.detected))
  }, [transactions])

  const filteredCases = useMemo(() => {
    return allCoercionCases.filter((t) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        t.txn_id.toLowerCase().includes(q) ||
        t.user_id.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.beneficiary_id && t.beneficiary_id.toLowerCase().includes(q)) ||
        (t.socialEngineering?.scam_pattern && t.socialEngineering.scam_pattern.toLowerCase().includes(q))

      const pattern = t.socialEngineering?.scam_pattern || 'none'
      const matchesPattern =
        patternFilter === 'ALL' ||
        (patternFilter === 'PAYMENT_URGENCY' && pattern === 'payment_urgency') ||
        (patternFilter === 'FAKE_KYC' && pattern === 'fake_kyc_request') ||
        (patternFilter === 'ACCOUNT_THREAT' && pattern === 'account_closure_threat') ||
        (patternFilter === 'UNKNOWN_CALLER' && t.socialEngineering?.caller_known === false)

      return matchesSearch && matchesPattern
    })
  }, [allCoercionCases, searchQuery, patternFilter])

  // Summary Metrics
  const highRiskPatternsCount = useMemo(() => {
    return allCoercionCases.filter((t) => {
      const pat = t.socialEngineering?.scam_pattern
      return pat === 'payment_urgency' || pat === 'fake_kyc_request' || pat === 'account_closure_threat'
    }).length
  }, [allCoercionCases])

  const avgCallerRisk = useMemo(() => {
    if (allCoercionCases.length === 0) return 0
    const sum = allCoercionCases.reduce(
      (acc, t) => acc + (t.socialEngineering?.caller_risk_score ?? t.agentResults?.socialEngineering?.riskScore ?? 0),
      0
    )
    return Math.round(sum / allCoercionCases.length)
  }, [allCoercionCases])

  const validatedCount = useMemo(() => {
    return allCoercionCases.filter((t) => Boolean(t.humanValidation)).length
  }, [allCoercionCases])

  const handleSeed = async () => {
    try {
      setIsSeeding(true)
      await seedTransactions(20)
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/" className="hover:text-foreground flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-amber-400 font-medium">Scam-Call Coercion Queue</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Social Engineering & Scam-Call Queue</h1>
                <p className="text-xs text-muted-foreground">
                  Transactions flagged by telephony metadata telemetry, high-pressure urgency patterns, and coercive scam context.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 px-3 py-1 text-xs">
              {allCoercionCases.length} Active {allCoercionCases.length === 1 ? 'Case' : 'Cases'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={isSeeding}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Seeding...' : 'Seed Data'}
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Coercion Cases</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{allCoercionCases.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <PhoneCall className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Active metadata signals</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">High-Urgency Patterns</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{highRiskPatternsCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Payment urgency & fake KYC</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avg Caller Risk Score</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {avgCallerRisk > 0 ? `${avgCallerRisk}/100` : '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/20 text-primary">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Aggregated caller threat level</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Human Audited Verdicts</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{validatedCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Investigator reviewed outcomes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Txn ID, User, Pattern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-card border-border"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All Patterns' },
              { id: 'PAYMENT_URGENCY', label: 'Payment Urgency' },
              { id: 'FAKE_KYC', label: 'Fake KYC Pressure' },
              { id: 'ACCOUNT_THREAT', label: 'Account Closure Threat' },
              { id: 'UNKNOWN_CALLER', label: 'Unknown Caller' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setPatternFilter(pill.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  patternFilter === pill.id
                    ? 'bg-amber-500 text-black font-semibold shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cases List */}
        {filteredCases.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 w-fit mx-auto mb-3">
                <PhoneOff className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No active social-engineering cases</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {searchQuery || patternFilter !== 'ALL'
                  ? 'No cases match your active filters. Try clearing your search query or selecting "All Patterns".'
                  : 'Currently, no transactions in memory exhibit active scam-call coercion. Click "Seed Data" on the dashboard or simulation stream to generate realistic coercion scenarios.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Return to Dashboard
                  </Button>
                </Link>
                {allCoercionCases.length === 0 && (
                  <Button size="sm" onClick={handleSeed} disabled={isSeeding} className="gap-1">
                    <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                    Seed Demo Cases
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((txn) => {
              const se = txn.socialEngineering
              const result = txn.agentResults?.socialEngineering
              const durationMins = se?.call_duration ? (se.call_duration / 60).toFixed(1) : null

              return (
                <Card
                  key={txn.txn_id}
                  className="bg-card border-border hover:border-amber-500/50 transition-all shadow-sm overflow-hidden"
                >
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-amber-500/20 text-amber-400">
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-foreground">{txn.txn_id}</span>
                            <Badge variant="outline" className={getStatusBadge(txn.status)}>
                              {txn.status}
                            </Badge>
                            {txn.humanValidation && (
                              <Badge
                                variant="outline"
                                className="bg-primary/20 text-primary border-primary/40 text-[10px]"
                              >
                                Audited: {txn.humanValidation.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {txn.user_id}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {txn.location}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {new Date(txn.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-base font-bold text-foreground">
                            {'\u20B9'}{txn.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="text-right pl-4 border-l border-border">
                          <p className="text-xs text-muted-foreground">Risk Score</p>
                          <p className={`text-base font-bold ${getRiskColor(txn.riskScore)}`}>
                            {txn.riskScore}/100
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push(`/investigation/${txn.txn_id}`)}
                          className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold ml-2"
                        >
                          <Search className="h-3.5 w-3.5" />
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3">
                    {/* Telephony Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-secondary/30 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Recent Communication</span>
                        <span className="font-semibold text-amber-400">
                          {se?.recent_call ? 'Yes (Incoming Call)' : 'No'}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-[10px] block">Caller Identity</span>
                        <span className={`font-semibold ${se?.caller_known === false ? 'text-red-400' : 'text-foreground'}`}>
                          {se?.caller_known === false ? 'Unknown Caller' : se?.caller_known === true ? 'Known Contact' : 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-[10px] block">Call Duration</span>
                        <span className="font-mono text-foreground">
                          {se?.call_duration ? `${se.call_duration}s (${durationMins}m)` : 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-[10px] block">Time Before Transfer</span>
                        <span className={`font-semibold ${se?.time_since_call && se.time_since_call <= 5 ? 'text-red-400' : 'text-foreground'}`}>
                          {se?.time_since_call !== undefined ? `${se.time_since_call} mins` : 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-[10px] block">Caller Risk Score</span>
                        <span className={`font-bold ${se?.caller_risk_score && se.caller_risk_score >= 75 ? 'text-red-400' : 'text-amber-400'}`}>
                          {se?.caller_risk_score !== undefined ? `${se.caller_risk_score}/100` : 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-[10px] block">Scam Pattern</span>
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300 font-mono mt-0.5">
                          {se?.scam_pattern || result?.detectedPatterns?.[0] || 'coercion_detected'}
                        </Badge>
                      </div>
                    </div>

                    {/* Agent Explanation */}
                    {result?.explanation && (
                      <div className="p-2.5 rounded bg-muted/40 text-xs text-foreground/90 border border-border/50">
                        <span className="font-semibold text-amber-400 mr-1.5">Social Engineering Agent:</span>
                        {result.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
