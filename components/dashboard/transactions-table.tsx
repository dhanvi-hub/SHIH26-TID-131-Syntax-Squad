'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ProcessedTransaction } from '@/lib/types'

interface TransactionsTableProps {
  transactions: ProcessedTransaction[]
  latestTxnId?: string | null
}

function getStatusColor(status: string) {
  switch (status) {
    case 'SAFE':
      return 'bg-safe/20 text-safe border-safe/30 hover:bg-safe/30'
    case 'SUSPICIOUS':
      return 'bg-suspicious/20 text-suspicious border-suspicious/30 hover:bg-suspicious/30'
    case 'FRAUD':
      return 'bg-fraud/20 text-fraud border-fraud/30 hover:bg-fraud/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getRiskColor(score: number) {
  if (score >= 60) return 'text-fraud'
  if (score >= 30) return 'text-suspicious'
  return 'text-safe'
}

export function TransactionsTable({ transactions, latestTxnId }: TransactionsTableProps) {
  const router = useRouter()

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Live Transactions</span>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Transaction ID</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground">Location</TableHead>
                <TableHead className="text-muted-foreground text-center">Risk Score</TableHead>
                <TableHead className="text-muted-foreground text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No transactions yet. Click &quot;Start Simulation&quot; to begin.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => (
                  <TableRow
                    key={txn.txn_id}
                    className={`
                      border-border cursor-pointer transition-colors
                      hover:bg-secondary/50
                      ${txn.txn_id === latestTxnId ? 'animate-slide-in bg-primary/10' : ''}
                      ${txn.status === 'FRAUD' ? 'animate-pulse-fraud' : ''}
                    `}
                    onClick={() => router.push(`/investigation/${txn.txn_id}`)}
                  >
                    <TableCell className="font-mono text-sm">{txn.txn_id}</TableCell>
                    <TableCell className="font-medium">{txn.user_id}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${txn.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{txn.location}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${getRiskColor(txn.riskScore)}`}>
                        {txn.riskScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusColor(txn.status)}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
