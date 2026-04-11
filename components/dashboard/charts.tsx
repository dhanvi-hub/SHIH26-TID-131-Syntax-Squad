'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface ChartsProps {
  isActive: boolean
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

export function DashboardCharts({ isActive }: ChartsProps) {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setTimeSeriesData(data.timeSeriesData || [])
        setRiskDistribution(data.riskDistribution || [])
      } catch (error) {
        console.error('[v0] Error fetching stats:', error)
      }
    }

    fetchStats()
    
    if (isActive) {
      const interval = setInterval(fetchStats, 5000)
      return () => clearInterval(interval)
    }
  }, [isActive])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Fraud Over Time Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Transaction Status Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
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
                <YAxis stroke="oklch(0.65 0 0)" tick={{ fontSize: 10 }} />
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
                  stroke="oklch(0.65 0.18 145)"
                  fill="url(#colorSafe)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="suspicious"
                  stroke="oklch(0.75 0.18 85)"
                  fill="url(#colorSuspicious)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="fraud"
                  stroke="oklch(0.55 0.22 25)"
                  fill="url(#colorFraud)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Risk Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" />
                <XAxis dataKey="range" stroke="oklch(0.65 0 0)" tick={{ fontSize: 10 }} />
                <YAxis stroke="oklch(0.65 0 0)" tick={{ fontSize: 10 }} />
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
                  fill="oklch(0.65 0.18 145)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
