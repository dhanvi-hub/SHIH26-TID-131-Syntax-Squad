'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, ShieldCheck, TrendingUp, DollarSign, Gauge } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'

interface StatsCardsProps {
  stats: DashboardStats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      icon: Activity,
      color: 'text-chart-2',
    },
    {
      title: 'Total Volume',
      value: `$${stats.totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-chart-1',
    },
    {
      title: 'Safe',
      value: stats.safeCount.toLocaleString(),
      icon: ShieldCheck,
      color: 'text-safe',
    },
    {
      title: 'Suspicious',
      value: stats.suspiciousCount.toLocaleString(),
      icon: TrendingUp,
      color: 'text-suspicious',
    },
    {
      title: 'Fraud Detected',
      value: stats.fraudCount.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-fraud',
    },
    {
      title: 'Avg Risk Score',
      value: stats.averageRiskScore.toFixed(1),
      icon: Gauge,
      color: stats.averageRiskScore > 40 ? 'text-suspicious' : 'text-chart-2',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
