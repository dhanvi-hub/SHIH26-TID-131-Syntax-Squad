'use client'

import { useTransactions } from '@/hooks/use-transactions'
import { DashboardHeader } from '@/components/dashboard/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TransactionsTable } from '@/components/dashboard/transactions-table'
import { AgentPipeline } from '@/components/dashboard/agent-pipeline'
import { FraudAlerts } from '@/components/dashboard/fraud-alerts'
import { DashboardCharts } from '@/components/dashboard/charts'
import { LiveIndicator } from '@/components/dashboard/live-indicator'

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
      <DashboardHeader
        isStreaming={isStreaming}
        onStartStreaming={startStreaming}
        onStopStreaming={stopStreaming}
        onSeed={() => seedTransactions(20)}
        onClear={clearTransactions}
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
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
