'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, BarChart2 } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ProcessedTransaction } from '@/lib/types'

export interface ChartsProps {
  transactions?: ProcessedTransaction[]
  isActive?: boolean
}

export interface TimeSeriesData {
  timestamp: string
  safe: number
  suspicious: number
  fraud: number
}

export interface RiskDistribution {
  range: string
  count: number
}

/**
 * Computes risk score distribution buckets directly from live transaction records.
 * Exact boundary handling: 20 -> 0-20, 21 -> 21-40, 40 -> 21-40, etc.
 */
export function computeRiskDistribution(transactions: ProcessedTransaction[]): RiskDistribution[] {
  const buckets: RiskDistribution[] = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ]

  if (!transactions || transactions.length === 0) {
    return buckets
  }

  for (const t of transactions) {
    const score = typeof t.riskScore === 'number' && !isNaN(t.riskScore) ? Math.round(t.riskScore) : 0
    if (score <= 20) buckets[0].count++
    else if (score <= 40) buckets[1].count++
    else if (score <= 60) buckets[2].count++
    else if (score <= 80) buckets[3].count++
    else buckets[4].count++
  }

  return buckets
}

/**
 * Computes time-series data dynamically from transaction timestamps.
 * Adapts bucket intervals based on active session range (2m for simulation, 1h for seeded data).
 * Guarantees every transaction is assigned to exactly one bucket.
 */
export function computeTimeSeriesData(transactions: ProcessedTransaction[]): TimeSeriesData[] {
  if (!transactions || transactions.length === 0) {
    return []
  }

  const validTxns = transactions
    .filter((t) => t && t.timestamp && !isNaN(new Date(t.timestamp).getTime()))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  if (validTxns.length === 0) {
    return []
  }

  const firstMs = new Date(validTxns[0].timestamp).getTime()
  const lastMs = new Date(validTxns[validTxns.length - 1].timestamp).getTime()
  const nowMs = Date.now()
  const endMs = Math.max(nowMs, lastMs)
  const spanMs = endMs - firstMs

  // Adaptive interval:
  // - <= 30 mins (live streaming session): 2-minute buckets
  // - <= 2 hours: 10-minute buckets
  // - <= 12 hours (seeded data): 1-hour buckets
  // - > 12 hours: 2-hour buckets
  let intervalMs = 60 * 60 * 1000
  if (spanMs <= 30 * 60 * 1000) {
    intervalMs = 2 * 60 * 1000
  } else if (spanMs <= 2 * 3600 * 1000) {
    intervalMs = 10 * 60 * 1000
  } else if (spanMs <= 12 * 3600 * 1000) {
    intervalMs = 60 * 60 * 1000
  } else {
    intervalMs = 2 * 3600 * 1000
  }

  const startAligned = Math.floor(firstMs / intervalMs) * intervalMs
  const endAligned = Math.ceil(endMs / intervalMs) * intervalMs

  // Minimum 4 ticks for smooth area gradient curves
  const actualStart = Math.min(startAligned, endAligned - 3 * intervalMs)

  const buckets: { start: number; end: number; timestamp: string; safe: number; suspicious: number; fraud: number }[] = []
  
  for (let t = actualStart; t <= endAligned; t += intervalMs) {
    buckets.push({
      start: t,
      end: t + intervalMs,
      timestamp: new Date(t).toISOString(),
      safe: 0,
      suspicious: 0,
      fraud: 0,
    })
  }

  for (const txn of validTxns) {
    const txnMs = new Date(txn.timestamp).getTime()
    let bucket = buckets.find((b) => txnMs >= b.start && txnMs < b.end)
    if (!bucket && txnMs >= buckets[buckets.length - 1].start) {
      bucket = buckets[buckets.length - 1]
    } else if (!bucket && txnMs < buckets[0].end) {
      bucket = buckets[0]
    }

    if (bucket) {
      if (txn.status === 'SAFE') bucket.safe++
      else if (txn.status === 'SUSPICIOUS') bucket.suspicious++
      else if (txn.status === 'FRAUD') bucket.fraud++
    }
  }

  return buckets.map((b) => ({
    timestamp: b.timestamp,
    safe: b.safe,
    suspicious: b.suspicious,
    fraud: b.fraud,
  }))
}

export function DashboardCharts({ transactions, isActive }: ChartsProps) {
  // Fallback state for standalone use when transactions prop is omitted
  const [polledTimeSeries, setPolledTimeSeries] = useState<TimeSeriesData[]>([])
  const [polledRiskDist, setPolledRiskDist] = useState<RiskDistribution[]>([])

  // Only poll /api/stats if transactions prop was NOT provided
  useEffect(() => {
    if (transactions !== undefined) return

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' })
        const data = await res.json()
        setPolledTimeSeries(data.timeSeriesData || [])
        setPolledRiskDist(data.riskDistribution || [])
      } catch (error) {
        console.error('[v0] Error fetching stats:', error)
      }
    }

    fetchStats()
    
    if (isActive) {
      const interval = setInterval(fetchStats, 5000)
      return () => clearInterval(interval)
    }
  }, [transactions, isActive])

  // Reactive calculations derived directly from live transactions state
  const timeSeriesData = useMemo(() => {
    if (transactions !== undefined) {
      return computeTimeSeriesData(transactions)
    }
    return polledTimeSeries
  }, [transactions, polledTimeSeries])

  const riskDistribution = useMemo(() => {
    if (transactions !== undefined) {
      return computeRiskDistribution(transactions)
    }
    return polledRiskDist
  }, [transactions, polledRiskDist])

  const hasData = useMemo(() => {
    if (transactions !== undefined) {
      return transactions.length > 0
    }
    const hasTimeSeriesPoints = polledTimeSeries.some((d) => d.safe > 0 || d.suspicious > 0 || d.fraud > 0)
    const hasRiskPoints = polledRiskDist.some((d) => d.count > 0)
    return hasTimeSeriesPoints || hasRiskPoints
  }, [transactions, polledTimeSeries, polledRiskDist])

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Fraud Over Time Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Transaction Status Over Time</span>
            {hasData && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {timeSeriesData.reduce((sum, d) => sum + d.safe + d.suspicious + d.fraud, 0)} recorded
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {!hasData ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                <Activity className="h-8 w-8 mb-2 opacity-30 text-primary" />
                <p className="text-sm font-medium text-foreground">No transaction activity recorded</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Click &ldquo;Seed Data&rdquo; or &ldquo;Start Simulation&rdquo; to begin streaming and monitoring transactions.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.75 0.18 85)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.75 0.18 85)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="oklch(0.65 0 0)"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="oklch(0.65 0 0)" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.16 0.01 260)',
                      border: '1px solid oklch(0.28 0.01 260)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'oklch(0.95 0 0)' }}
                    labelFormatter={formatTime}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="safe"
                    name="safe"
                    stroke="oklch(0.65 0.18 145)"
                    fill="url(#colorSafe)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="suspicious"
                    name="suspicious"
                    stroke="oklch(0.75 0.18 85)"
                    fill="url(#colorSuspicious)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="fraud"
                    name="fraud"
                    stroke="oklch(0.55 0.22 25)"
                    fill="url(#colorFraud)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Risk Score Distribution</span>
            {hasData && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {riskDistribution.reduce((sum, d) => sum + d.count, 0)} transactions
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {!hasData ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                <BarChart2 className="h-8 w-8 mb-2 opacity-30 text-primary" />
                <p className="text-sm font-medium text-foreground">No risk scores available</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Risk scores evaluated by the ML ensemble and risk engine will appear here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
                  <XAxis dataKey="range" stroke="oklch(0.65 0 0)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="oklch(0.65 0 0)" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.16 0.01 260)',
                      border: '1px solid oklch(0.28 0.01 260)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'oklch(0.95 0 0)' }}
                  />
                  <Bar
                    dataKey="count"
                    name="Transactions"
                    fill="oklch(0.65 0.18 145)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
