'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, ArrowRight } from 'lucide-react'
import type { ProcessedTransaction } from '@/lib/types'

interface LiveIndicatorProps {
  transaction: ProcessedTransaction | null
  isActive: boolean
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

export function LiveIndicator({ transaction, isActive }: LiveIndicatorProps) {
  if (!isActive || !transaction) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Activity className="h-5 w-5" />
            <span>Waiting for transactions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
            <span className="text-sm font-medium text-primary">LIVE</span>
          </div>

          {/* Transaction flow */}
          <div className="flex items-center gap-2 flex-1 overflow-hidden animate-slide-in">
            <span className="font-mono text-sm truncate">{transaction.txn_id}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{transaction.user_id}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono">${transaction.amount.toLocaleString()}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{transaction.location}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <Badge variant="outline" className={getStatusColor(transaction.status)}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
