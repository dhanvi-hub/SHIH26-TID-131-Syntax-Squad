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
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Search,
  Clock,
  User,
  MapPin,
  RefreshCw,
  Zap,
  TrendingUp,
  Brain,
  Scale,
  Activity,
  Share2,
  PhoneCall,
  Network,
  AlertTriangle,
  ArrowRight,
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

export default function EscalationsQueuePage() {
  const router = useRouter()
  const { transactions, seedTransactions } = useStreaming()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [isSeeding, setIsSeeding] = useState(false)

  // Authoritative filter: exact same condition as dashboard escalationCount
  const allEscalationCases = useMemo(() => {
    return transactions.filter((t) => Boolean(t.multiSignalEscalation?.enabled))
  }, [transactions])

  const filteredCases = useMemo(() => {
    return allEscalationCases.filter((t) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        t.txn_id.toLowerCase().includes(q) ||
        t.user_id.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.beneficiary_id && t.beneficiary_id.toLowerCase().includes(q))

      const signals = t.signals
      const matchesFilter =
        filterType === 'ALL' ||
        (filterType === 'CONSORTIUM' && (signals?.externalIntelligenceRisk ?? 0) >= 50) ||
        (filterType === 'COERCION' && (signals?.socialEngineeringRisk ?? 0) >= 50) ||
        (filterType === 'RULES' && (signals?.ruleRisk ?? 0) >= 50)

      return matchesSearch && matchesFilter
    })
  }, [allEscalationCases, searchQuery, filterType])

  // Summary Metrics
  const avgMLScore = useMemo(() => {
    if (allEscalationCases.length === 0) return 0
    const sum = allEscalationCases.reduce(
      (acc, t) => acc + (t.multiSignalEscalation?.originalMLScore ?? t.signals?.mlRisk ?? 0),
      0
    )
    return Math.round(sum / allEscalationCases.length)
  }, [allEscalationCases])

  const avgEscalatedScore = useMemo(() => {
    if (allEscalationCases.length === 0) return 0
    const sum = allEscalationCases.reduce(
      (acc, t) => acc + (t.multiSignalEscalation?.escalatedScore ?? t.riskScore ?? 0),
      0
    )
    return Math.round(sum / allEscalationCases.length)
  }, [allEscalationCases])

  const validatedCount = useMemo(() => {
    return allEscalationCases.filter((t) => Boolean(t.humanValidation)).length
  }, [allEscalationCases])

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
              <span className="text-primary font-medium">Multi-Signal Escalations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Multi-Signal Escalations & Safety Fallbacks</h1>
                <p className="text-xs text-muted-foreground">
                  Cases where independent threat vectors (Consortium, Social Engineering, Rules) overrode a low-risk ML prediction to prevent false negatives.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 px-3 py-1 text-xs font-mono">
              {allEscalationCases.length} Rescued {allEscalationCases.length === 1 ? 'Case' : 'Cases'}
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
                  <p className="text-xs text-muted-foreground font-medium">Rescued Transactions</p>
                  <p className="text-2xl font-bold text-primary mt-1">{allEscalationCases.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/20 text-primary">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Prevented false negative escapes</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Original ML Prediction</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {avgMLScore > 0 ? `${avgMLScore}/100` : '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Brain className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">ML model predicted low risk</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Escalated Final Risk</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {avgEscalatedScore > 0 ? `${avgEscalatedScore}/100` : '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Multi-signal elevated assessment</p>
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
              <p className="text-[10px] text-muted-foreground mt-2">Investigator confirmed outcomes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Txn ID, User, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-card border-border"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All Rescues' },
              { id: 'CONSORTIUM', label: 'Consortium Threat' },
              { id: 'COERCION', label: 'Social Engineering' },
              { id: 'RULES', label: 'Severe Rule Flags' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterType(pill.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterType === pill.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
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
              <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-3">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No active multi-signal escalations</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {searchQuery || filterType !== 'ALL'
                  ? 'No escalations match your active filters. Try clearing your search query or selecting "All Rescues".'
                  : 'Currently, no transactions required safety fallback escalation. When the ML model predicts low risk while multiple independent vectors (Consortium, Social Engineering, Rules) indicate high threat, rescued cases will appear here.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Return to Dashboard
                  </Button>
                </Link>
                {allEscalationCases.length === 0 && (
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
              const esc = txn.multiSignalEscalation
              const sig = txn.signals
              const originalML = esc?.originalMLScore ?? sig?.mlRisk ?? 25
              const escalatedRisk = esc?.escalatedScore ?? txn.riskScore
              const delta = escalatedRisk - originalML

              return (
                <Card
                  key={txn.txn_id}
                  className="bg-card border-border hover:border-primary/50 transition-all shadow-sm overflow-hidden"
                >
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/20 text-primary">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-foreground">{txn.txn_id}</span>
                            <Badge variant="outline" className={getStatusBadge(txn.status)}>
                              {txn.status}
                            </Badge>
                            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] font-mono">
                              Safety Fallback Active
                            </Badge>
                            {txn.humanValidation && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]"
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
                        <Button
                          onClick={() => router.push(`/investigation/${txn.txn_id}`)}
                          className="gap-1.5 text-xs font-semibold ml-2"
                        >
                          <Search className="h-3.5 w-3.5" />
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Discrepancy Highlight Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-secondary/30 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-emerald-500/20 text-emerald-400">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Original ML Prediction</p>
                          <p className="text-sm font-bold text-emerald-400 font-mono">
                            {originalML}/100 (Safe / Low Risk)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 border-y md:border-y-0 md:border-x border-border py-2 md:py-0 md:px-3">
                        <div className="p-2 rounded bg-red-500/20 text-red-400">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Escalated Risk Score</p>
                          <p className="text-sm font-bold text-red-400 font-mono">
                            {escalatedRisk}/100 ({txn.status})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-primary/20 text-primary">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Safety Elevation Delta</p>
                          <p className="text-sm font-bold text-primary font-mono">
                            +{delta} Risk Points Corrected
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Escalation Rationale */}
                    {esc?.reason && (
                      <div className="p-2.5 rounded bg-primary/10 border border-primary/20 text-xs text-foreground/90 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-primary block">Safety Escalation Mechanism:</span>
                          <p className="mt-0.5">{esc.reason}</p>
                        </div>
                      </div>
                    )}

                    {/* 6-Signal Radar Breakdown */}
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                        6-DIMENSIONAL INDEPENDENT THREAT MATRIX
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                        <div className="p-2 rounded bg-secondary/40 border border-border">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Brain className="h-3 w-3" /> ML Ensemble
                          </span>
                          <span className="font-bold text-emerald-400 text-sm block mt-1">
                            {sig?.mlRisk ?? originalML}/100
                          </span>
                        </div>

                        <div className="p-2 rounded bg-secondary/40 border border-border">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Scale className="h-3 w-3" /> Active Rules
                          </span>
                          <span className={`font-bold text-sm block mt-1 ${(sig?.ruleRisk ?? 0) >= 50 ? 'text-red-400' : 'text-foreground'}`}>
                            {sig?.ruleRisk ?? 0}/100
                          </span>
                        </div>

                        <div className="p-2 rounded bg-secondary/40 border border-border">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3" /> Behavioural
                          </span>
                          <span className={`font-bold text-sm block mt-1 ${(sig?.behaviouralRisk ?? 0) >= 50 ? 'text-red-400' : 'text-foreground'}`}>
                            {sig?.behaviouralRisk ?? 0}/100
                          </span>
                        </div>

                        <div className="p-2 rounded bg-secondary/40 border border-border">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Network className="h-3 w-3" /> Network Graph
                          </span>
                          <span className={`font-bold text-sm block mt-1 ${(sig?.networkRisk ?? 0) >= 50 ? 'text-red-400' : 'text-foreground'}`}>
                            {sig?.networkRisk ?? 0}/100
                          </span>
                        </div>

                        <div className="p-2 rounded bg-secondary/40 border border-border">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Share2 className="h-3 w-3" /> Consortium
                          </span>
                          <span className={`font-bold text-sm block mt-1 ${(sig?.externalIntelligenceRisk ?? 0) >= 50 ? 'text-red-400' : 'text-foreground'}`}>
                            {sig?.externalIntelligenceRisk ?? 0}/100
                          </span>
                        </div>

                        <div className="p-2 rounded bg-secondary/40 border border-border">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <PhoneCall className="h-3 w-3" /> Social Eng
                          </span>
                          <span className={`font-bold text-sm block mt-1 ${(sig?.socialEngineeringRisk ?? 0) >= 50 ? 'text-red-400' : 'text-foreground'}`}>
                            {sig?.socialEngineeringRisk ?? 0}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contributing Signals Pills */}
                    {esc?.contributingSignals && esc.contributingSignals.length > 0 && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          Signals triggering escalation threshold (≥ 50):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {esc.contributingSignals.map((signalText, sIdx) => (
                            <Badge
                              key={sIdx}
                              variant="outline"
                              className="text-[11px] bg-red-500/10 border-red-500/30 text-red-300 font-mono py-0.5"
                            >
                              {signalText}
                            </Badge>
                          ))}
                        </div>
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
