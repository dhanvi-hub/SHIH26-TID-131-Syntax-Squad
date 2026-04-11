'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { Navigation } from '@/components/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TransactionsTable } from '@/components/dashboard/transactions-table'
import { AgentPipeline } from '@/components/dashboard/agent-pipeline'
import { FraudAlerts } from '@/components/dashboard/fraud-alerts'
import { DashboardCharts } from '@/components/dashboard/charts'
import { LiveIndicator } from '@/components/dashboard/live-indicator'
import { Button } from '@/components/ui/button'
import { Play, Square, RefreshCw, Trash2 } from 'lucide-react'

export default function DashboardPage() {
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
  } = useTransactions()

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
              <Button onClick={startStreaming} className="gap-2">
                <Play className="h-4 w-4" />
                Start Simulation
              </Button>
            ) : (
              <Button onClick={stopStreaming} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                Stop Simulation
              </Button>
            )}
            
            <Button onClick={() => seedTransactions(20)} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Seed Data
            </Button>
            
            <Button onClick={clearTransactions} variant="outline" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsCards stats={stats} />
        
        {/* Live Transaction Indicator */}
        <LiveIndicator transaction={latestTransaction} isActive={isStreaming} />
        
        {/* Fraud Alerts */}
        <FraudAlerts alerts={fraudAlerts} onDismiss={dismissFraudAlert} />
        
        {/* Agent Pipeline Visualization */}
        <AgentPipeline steps={latestSteps} isActive={isStreaming} />
        
        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-1">
          {/* Transactions Table */}
          <TransactionsTable
            transactions={transactions}
            latestTxnId={latestTransaction?.txn_id}
          />
        </div>
        
        {/* Charts */}
        <DashboardCharts isActive={isStreaming} />
      </main>
    </div>
  )
}
