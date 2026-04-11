'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  MapPin,
  Smartphone,
  Banknote,
  Wifi,
  TrendingUp
} from 'lucide-react'
import type { ProcessedTransaction, FraudCriteria } from '@/lib/types'

const criteriaIcons = {
  rapidTransactions: TrendingUp,
  differentLocation: MapPin,
  lateNightTransaction: Clock,
  differentDevice: Smartphone,
  highAmount: Banknote,
  suspiciousIP: Wifi,
  unusualPattern: AlertTriangle,
}

const criteriaLabels = {
  rapidTransactions: 'Rapid Transactions',
  differentLocation: 'Different Location',
  lateNightTransaction: 'Late Night Transaction',
  differentDevice: 'Different Device',
  highAmount: 'High Amount',
  suspiciousIP: 'Suspicious IP/VPN',
  unusualPattern: 'Unusual Pattern',
}

function CriteriaBar({ criteria }: { criteria: FraudCriteria }) {
  const entries = Object.entries(criteria).filter(([, value]) => value > 0)
  
  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No specific fraud criteria detected - Transaction is safe
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const Icon = criteriaIcons[key as keyof typeof criteriaIcons]
        const label = criteriaLabels[key as keyof typeof criteriaLabels]
        
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </div>
              <span className="font-mono font-bold text-fraud">{value}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-suspicious to-fraud transition-all"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReportCard({ transaction, onDownload }: { 
  transaction: ProcessedTransaction
  onDownload: (txn: ProcessedTransaction) => void 
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE': return 'bg-safe/20 text-safe border-safe/30'
      case 'SUSPICIOUS': return 'bg-suspicious/20 text-suspicious border-suspicious/30'
      case 'FRAUD': return 'bg-fraud/20 text-fraud border-fraud/30'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              transaction.status === 'FRAUD' ? 'bg-fraud/20' : 
              transaction.status === 'SUSPICIOUS' ? 'bg-suspicious/20' : 'bg-safe/20'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                transaction.status === 'FRAUD' ? 'text-fraud' : 
                transaction.status === 'SUSPICIOUS' ? 'text-suspicious' : 'text-safe'
              }`} />
            </div>
            <div>
              <CardTitle className="text-base">{transaction.txn_id}</CardTitle>
              <p className="text-sm text-muted-foreground">{transaction.user_id}</p>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(transaction.status)}>
            {transaction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-mono font-bold">{'\u20B9'}{transaction.amount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Risk Score</p>
            <p className={`font-bold ${
              transaction.riskScore >= 60 ? 'text-fraud' : 
              transaction.riskScore >= 30 ? 'text-suspicious' : 'text-safe'
            }`}>{transaction.riskScore}/100</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{transaction.location}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Device</p>
            <p className="font-medium capitalize">{transaction.device}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="font-semibold mb-3">Fraud Criteria Analysis</h4>
          <CriteriaBar criteria={transaction.fraudCriteria || {
            rapidTransactions: 0,
            differentLocation: 0,
            lateNightTransaction: 0,
            differentDevice: 0,
            highAmount: 0,
            suspiciousIP: 0,
            unusualPattern: 0,
          }} />
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="font-semibold mb-2">AI Analysis</h4>
          <p className="text-sm text-muted-foreground">{transaction.report}</p>
        </div>

        <Button 
          onClick={() => onDownload(transaction)} 
          className="w-full gap-2"
          variant={transaction.status === 'SAFE' ? 'outline' : 'default'}
        >
          <Download className="h-4 w-4" />
          Download PDF Report
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [filter, setFilter] = useState<'all' | 'FRAUD' | 'SUSPICIOUS'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const reportRef = useRef<HTMLDivElement>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
    const interval = setInterval(fetchTransactions, 10000)
    return () => clearInterval(interval)
  }, [fetchTransactions])

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') return txn.status !== 'SAFE'
    return txn.status === filter
  })

  const generatePDFContent = (txn: ProcessedTransaction): string => {
    const criteria = txn.fraudCriteria || {
      rapidTransactions: 0,
      differentLocation: 0,
      lateNightTransaction: 0,
      differentDevice: 0,
      highAmount: 0,
      suspiciousIP: 0,
      unusualPattern: 0,
    }

    const activeCriteria = Object.entries(criteria)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `${criteriaLabels[key as keyof typeof criteriaLabels]}: ${value}%`)
      .join('\n    ')

    return `
================================================================================
                        FRAUD DETECTION REPORT
================================================================================

TRANSACTION DETAILS
-------------------
Transaction ID: ${txn.txn_id}
Account ID: ${txn.user_id}
Amount: INR ${txn.amount.toLocaleString('en-IN')}
Location: ${txn.location}
Device: ${txn.device}
IP Address: ${txn.ip}
Timestamp: ${new Date(txn.timestamp).toLocaleString('en-IN')}

RISK ASSESSMENT
---------------
Risk Score: ${txn.riskScore}/100
Status: ${txn.status}
Rule Flags: ${txn.ruleFlags.join(', ') || 'None'}

FRAUD CRITERIA BREAKDOWN
------------------------
${activeCriteria || '    No specific fraud criteria detected - Transaction is safe'}

AI ANALYSIS
-----------
${txn.report}

RECOMMENDATIONS
---------------
${txn.status === 'FRAUD' 
  ? '1. Block the transaction immediately\n2. Freeze the account temporarily\n3. Contact the account holder for verification\n4. Report to fraud investigation team\n5. Review recent account activity'
  : txn.status === 'SUSPICIOUS'
  ? '1. Flag for manual review\n2. Request additional verification from user\n3. Monitor subsequent transactions closely\n4. Consider temporary transaction limits'
  : '1. No action required\n2. Continue standard monitoring'}

================================================================================
Report Generated: ${new Date().toLocaleString('en-IN')}
Fraud Detection System - AI-Powered Transaction Monitoring
================================================================================
    `.trim()
  }

  const downloadPDF = (txn: ProcessedTransaction) => {
    const content = generatePDFContent(txn)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fraud-report-${txn.txn_id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllReports = () => {
    const allContent = filteredTransactions
      .map(txn => generatePDFContent(txn))
      .join('\n\n' + '='.repeat(80) + '\n\n')
    
    const blob = new Blob([allContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `all-fraud-reports-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fraud Reports</h1>
            <p className="text-muted-foreground">Generate and download detailed fraud analysis reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchTransactions} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {filteredTransactions.length > 0 && (
              <Button onClick={downloadAllReports} className="gap-2">
                <Download className="h-4 w-4" />
                Download All Reports
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            All Flagged ({transactions.filter(t => t.status !== 'SAFE').length})
          </Button>
          <Button
            variant={filter === 'FRAUD' ? 'default' : 'outline'}
            onClick={() => setFilter('FRAUD')}
            className="gap-2 text-fraud"
          >
            <AlertTriangle className="h-4 w-4" />
            Fraud Only ({transactions.filter(t => t.status === 'FRAUD').length})
          </Button>
          <Button
            variant={filter === 'SUSPICIOUS' ? 'default' : 'outline'}
            onClick={() => setFilter('SUSPICIOUS')}
            className="gap-2 text-suspicious"
          >
            <AlertTriangle className="h-4 w-4" />
            Suspicious Only ({transactions.filter(t => t.status === 'SUSPICIOUS').length})
          </Button>
        </div>

        {/* Reports Grid */}
        <div ref={reportRef}>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardHeader>
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-20 w-full bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {filter === 'all' 
                    ? 'No suspicious or fraudulent transactions detected yet. Start the simulation from the dashboard to generate transactions.'
                    : `No ${filter.toLowerCase()} transactions found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredTransactions.map(txn => (
                  <ReportCard 
                    key={txn.txn_id} 
                    transaction={txn} 
                    onDownload={downloadPDF}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  )
}
