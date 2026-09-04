'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { ProcessedTransaction } from '@/lib/types'
import { Activity, ShieldAlert, BarChart3, PieChart as PieChartIcon } from 'lucide-react'

interface ChartsProps {
  transactions?: ProcessedTransaction[]
  isActive?: boolean
}

interface TimeSeriesData {
  timestamp: string
  safe: number
  suspicious: number
  fraud: number
}

interface RiskDistribution {
  range: string
  count: number
}

interface ChannelData {
  name: string
  total: number
  fraud: number
  safe: number
}

export function DashboardCharts({ transactions = [], isActive = false }: ChartsProps) {
  const [apiTimeSeries, setApiTimeSeries] = useState<TimeSeriesData[]>([])
  const [apiRiskDist, setApiRiskDist] = useState<RiskDistribution[]>([])

  // Fetch initial baseline from /api/stats if local transactions array is empty
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          if (data.timeSeriesData) setApiTimeSeries(data.timeSeriesData)
          if (data.riskDistribution) setApiRiskDist(data.riskDistribution)
        }
      } catch (error) {
        console.error('Error fetching baseline stats:', error)
      }
    }

    fetchStats()
  }, [])

  // 1. DYNAMIC REAL-TIME TIME SERIES (Status over time)
  const timeSeriesData = useMemo(() => {
    if (transactions.length === 0) return apiTimeSeries

    // Group transactions into 1-minute time buckets or recent batches
    const timeBuckets: Record<string, { safe: number; suspicious: number; fraud: number }> = {}

    // Sort chronologically
    const sorted = [...transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    sorted.forEach((txn) => {
      const date = new Date(txn.timestamp)
      const minutes = Math.floor(date.getMinutes() / 2) * 2
      const timeKey = `${String(date.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

      if (!timeBuckets[timeKey]) {
        timeBuckets[timeKey] = { safe: 0, suspicious: 0, fraud: 0 }
      }

      if (txn.status === 'SAFE') timeBuckets[timeKey].safe++
      else if (txn.status === 'SUSPICIOUS') timeBuckets[timeKey].suspicious++
      else if (txn.status === 'FRAUD') timeBuckets[timeKey].fraud++
    })

    const chartData = Object.entries(timeBuckets).map(([timestamp, data]) => ({
      timestamp,
      ...data,
    }))

    return chartData.length > 0 ? chartData.slice(-12) : apiTimeSeries
  }, [transactions, apiTimeSeries])

  // 2. DYNAMIC REAL-TIME RISK SCORE DISTRIBUTION (0-20 to 81-100)
  const riskDistribution = useMemo(() => {
    if (transactions.length === 0) return apiRiskDist

    const ranges = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ]

    transactions.forEach((t) => {
      const score = t.riskScore
      if (score <= 20) ranges[0].count++
      else if (score <= 40) ranges[1].count++
      else if (score <= 60) ranges[2].count++
      else if (score <= 80) ranges[3].count++
      else ranges[4].count++
    })

    return ranges
  }, [transactions, apiRiskDist])

  // 3. DYNAMIC PAYMENT CHANNEL RISK BREAKDOWN
  const channelData = useMemo(() => {
    const channels: Record<string, { total: number; fraud: number; safe: number }> = {
      'UPI': { total: 0, fraud: 0, safe: 0 },
      'Credit Card': { total: 0, fraud: 0, safe: 0 },
      'Debit Card': { total: 0, fraud: 0, safe: 0 },
      'NetBanking': { total: 0, fraud: 0, safe: 0 },
      'ATM Withdrawal': { total: 0, fraud: 0, safe: 0 },
    }

    transactions.forEach((txn) => {
      const channel = txn.payment_channel || 'UPI'
      if (!channels[channel]) {
        channels[channel] = { total: 0, fraud: 0, safe: 0 }
      }
      channels[channel].total++
      if (txn.status === 'FRAUD' || txn.status === 'SUSPICIOUS') {
        channels[channel].fraud++
      } else {
        channels[channel].safe++
      }
    })

    return Object.entries(channels).map(([name, data]) => ({
      name,
      ...data,
    }))
  }, [transactions])

  const formatTime = (timestamp: string) => {
    if (timestamp.includes(':')) return timestamp
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. Transaction Status Over Time Chart */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Real-Time Transaction Status Telemetry
            </CardTitle>
            <span className="font-mono text-[10px] bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded">
              {isActive ? 'STREAMING LIVE' : 'HISTORICAL FEED'}
            </span>
          </div>
          <CardDescription className="text-xs">
            Dynamic volume trajectory of Safe, Suspicious, and Critical Fraud transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="safe"
                  name="Safe Transactions"
                  stroke="#22c55e"
                  fill="url(#colorSafe)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="suspicious"
                  name="Suspicious Flags"
                  stroke="#f59e0b"
                  fill="url(#colorSuspicious)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="fraud"
                  name="Confirmed Frauds"
                  stroke="#ef4444"
                  fill="url(#colorFraud)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Risk Score Distribution Bar Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            Risk Score Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Volume of evaluated transactions across risk score spectrums
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="range" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="count"
                  name="Transaction Count"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Payment Channel Risk Breakdown */}
      <Card className="bg-card border-border lg:col-span-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              Payment Vector Channel Risk Breakdown
            </CardTitle>
            <span className="font-mono text-[10px] text-slate-400">
              UPDATED LIVE: {transactions.length} SCANNED
            </span>
          </div>
          <CardDescription className="text-xs">
            Comparison of Safe vs Threat volume across payment channels (UPI, Cards, NetBanking, ATM)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#f87171', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                <Bar dataKey="safe" name="Safe Volume" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fraud" name="Threat & Fraud Volume" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
