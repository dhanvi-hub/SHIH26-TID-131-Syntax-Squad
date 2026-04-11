'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import type { ProcessedTransaction } from '@/lib/types'

interface FraudAlertsProps {
  alerts: ProcessedTransaction[]
  onDismiss: (txnId: string) => void
}

export function FraudAlerts({ alerts, onDismiss }: FraudAlertsProps) {
  const router = useRouter()

  if (alerts.length === 0) {
    return null
  }

  return (
    <Card className="bg-fraud/10 border-fraud/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-fraud">
          <AlertTriangle className="h-5 w-5" />
          <span>Fraud Alerts</span>
          <span className="ml-auto text-sm font-normal px-2 py-0.5 rounded-full bg-fraud/20">
            {alerts.length} active
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.txn_id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-fraud/20 animate-slide-in"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm truncate">{alert.txn_id}</span>
                  <span className="text-sm text-muted-foreground">|</span>
                  <span className="font-bold text-fraud">
                    ${alert.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {alert.report.slice(0, 100)}...
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/20"
                  onClick={() => router.push(`/investigation/${alert.txn_id}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/20"
                  onClick={() => onDismiss(alert.txn_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
