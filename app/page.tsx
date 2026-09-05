'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStreaming } from '@/contexts/streaming-context'
import { Navigation } from '@/components/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TransactionsTable } from '@/components/dashboard/transactions-table'
import { FraudAlerts } from '@/components/dashboard/fraud-alerts'
import { DashboardCharts } from '@/components/dashboard/charts'
import { LiveIndicator } from '@/components/dashboard/live-indicator'
import { Button } from '@/components/ui/button'
import { Play, Square, RefreshCw, Trash2, Share2, PhoneCall, ShieldAlert, ChevronRight } from 'lucide-react'
import type { ConsortiumStats } from '@/lib/types'

export default function DashboardPage() {
  const [consortiumStats, setConsortiumStats] = useState<ConsortiumStats | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/consortium/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setConsortiumStats(data.stats)
        }
      })
      .catch((err) => console.error('Failed to load dashboard consortium stats:', err))
  }, [])

  const {
    transactions,
    stats,
    latestTransaction,
    latestSteps,
    isStreaming,
    fraudAlerts,
    startStreaming,
    stopStreaming,
    seedTransactions,
    clearTransactions,
    dismissFraudAlert,
    refresh,
  } = useStreaming()

  const crossBankCount = transactions.filter(t => t.agentResults?.intelligence?.matched).length
  const scamCallCount = transactions.filter(t => t.agentResults?.socialEngineering?.detected).length
  const escalationCount = transactions.filter(t => t.multiSignalEscalation?.enabled).length

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Transaction Dashboard</h2>
            <p className="text-muted-foreground">Real-time AI-powered fraud monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            {!isStreaming ? (
              <Button onClick={startStreaming} className="gap-2 font-mono text-xs">
                <Play className="h-4 w-4" />
                Start Simulation
              </Button>
            ) : (
              <Button onClick={stopStreaming} variant="destructive" className="gap-2 font-mono text-xs">
                <Square className="h-4 w-4" />
                Stop Simulation
              </Button>
            )}
            
            <Button onClick={() => seedTransactions(20)} variant="outline" className="gap-2 font-mono text-xs">
              <RefreshCw className="h-4 w-4" />
              Seed Data
            </Button>
            
            <Button onClick={clearTransactions} variant="outline" className="gap-2 font-mono text-xs">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsCards stats={stats} />

        {/* Emerging Threat Signals - 3 Data-Driven Intelligence Entry Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/consortium"
            className="p-4 rounded-lg bg-card border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/20 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium group-hover:text-cyan-300 transition-colors">Cross-Bank Consortium</p>
                  <ChevronRight className="h-3 w-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-lg font-bold text-cyan-400">
                  {consortiumStats !== null ? `${consortiumStats.totalSignalsIndexed} Indicators` : `${crossBankCount} Matches`}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-cyan-400/80 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                {consortiumStats !== null ? `${consortiumStats.participatingInstitutions} Banks Sync` : 'Consortium Sync'}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {crossBankCount > 0 ? `${crossBankCount} live match${crossBankCount === 1 ? '' : 'es'}` : 'Click to inspect store'}
              </span>
            </div>
          </Link>

          <Link
            href="/social-engineering"
            className="p-4 rounded-lg bg-card border border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/20 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium group-hover:text-amber-300 transition-colors">Scam-Call Coercion</p>
                  <ChevronRight className="h-3 w-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-lg font-bold text-amber-400">
                  {scamCallCount} Detected
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-amber-400/80 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Metadata Signal
              </span>
              <span className="text-[9px] text-muted-foreground">
                {scamCallCount > 0 ? `${scamCallCount} active case${scamCallCount === 1 ? '' : 's'}` : 'Click to inspect queue'}
              </span>
            </div>
          </Link>

          <Link
            href="/escalations"
            className="p-4 rounded-lg bg-card border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/20 text-primary group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">Multi-Signal Escalations</p>
                  <ChevronRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-lg font-bold text-primary">
                  {escalationCount} Rescues
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-primary/80 font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                Safety Fallback
              </span>
              <span className="text-[9px] text-muted-foreground">
                {escalationCount > 0 ? `${escalationCount} rescued case${escalationCount === 1 ? '' : 's'}` : 'Click to inspect queue'}
              </span>
            </div>
          </Link>
        </div>
        
        {/* Live Transaction Indicator */}
        <LiveIndicator transaction={latestTransaction} isActive={isStreaming} />
        
        {/* Fraud Alerts */}
        <FraudAlerts alerts={fraudAlerts} onDismiss={dismissFraudAlert} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-1">
          {/* Transactions Table */}
          <TransactionsTable
            transactions={transactions}
            latestTxnId={latestTransaction?.txn_id}
          />
        </div>
        
        {/* Dynamic Real-Time Charts */}
        <DashboardCharts transactions={transactions} isActive={isStreaming} />
      </main>
    </div>
  )
}
