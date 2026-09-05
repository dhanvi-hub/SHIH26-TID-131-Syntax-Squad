'use client'

import { useEffect, useState, useRef } from 'react'
import { useStreaming } from '@/contexts/streaming-context'
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
  TrendingUp,
  Building2,
  PhoneCall,
  ShieldAlert
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import type { ProcessedTransaction, FraudCriteria } from '@/lib/types'
import { renderPDFEntityGraph } from '@/lib/pdf/graph-renderer'

const criteriaIcons = {
  rapidTransactions: TrendingUp,
  differentLocation: MapPin,
  lateNightTransaction: Clock,
  differentDevice: Smartphone,
  highAmount: Banknote,
  suspiciousIP: Wifi,
  unusualPattern: AlertTriangle,
  crossInstitutionIntelligence: Building2,
  socialEngineering: PhoneCall,
}

const criteriaLabels = {
  rapidTransactions: 'Rapid Transactions',
  differentLocation: 'Different Location',
  lateNightTransaction: 'Late Night Transaction',
  differentDevice: 'Different Device',
  highAmount: 'High Amount',
  suspiciousIP: 'Suspicious IP/VPN',
  unusualPattern: 'Unusual Pattern',
  crossInstitutionIntelligence: 'Cross-Bank Consortium Signal',
  socialEngineering: 'Scam-Call Coercion Signal',
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
        const Icon = criteriaIcons[key as keyof typeof criteriaIcons] || ShieldAlert
        const label = criteriaLabels[key as keyof typeof criteriaLabels] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        
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
  const { transactions, refresh, isStreaming } = useStreaming()
  const [filter, setFilter] = useState<'all' | 'FRAUD' | 'SUSPICIOUS'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Refresh on mount
  useEffect(() => {
    setIsLoading(true)
    refresh().finally(() => setIsLoading(false))
  }, [refresh])

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
      crossInstitutionIntelligence: 0,
      socialEngineering: 0,
    }

    const activeCriteria = Object.entries(criteria)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => {
        const label = criteriaLabels[key as keyof typeof criteriaLabels] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        return `${label}: ${value}%`
      })
      .join('\n    ')

    const flags = txn.ruleFlags || []

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
Rule Flags: ${flags.join(', ') || 'None'}

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
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)
    
    // Background
    doc.setFillColor(243, 244, 246) // Light gray background
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    
    // White card
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, margin, contentWidth, pageHeight - (margin * 2), 3, 3, 'F')
    
    let y = 30
    
    // === HEADER SECTION ===
    // Warning triangle icon (yellow)
    doc.setFillColor(251, 191, 36) // Yellow
    doc.triangle(25, y - 8, 35, y - 8, 30, y - 16, 'F')
    doc.setFillColor(0, 0, 0)
    doc.setFontSize(8)
    doc.text('!', 29, y - 10)
    
    // Title
    doc.setTextColor(31, 41, 55) // Dark gray
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Fraud Detection Report', 42, y - 8)
    
    // Status badge (top right)
    const badgeText = txn.status === 'FRAUD' ? 'SIZEABLE FRAUD ALERT!' : 
                      txn.status === 'SUSPICIOUS' ? 'SUSPICIOUS ACTIVITY' : 'SAFE TRANSACTION'
    const badgeColor = txn.status === 'FRAUD' ? [220, 38, 38] : 
                       txn.status === 'SUSPICIOUS' ? [245, 158, 11] : [34, 197, 94]
    
    doc.setFontSize(8)
    doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text(badgeText, pageWidth - margin - 5, y - 12, { align: 'right' })
    
    // Date/time
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128) // Gray
    doc.setFont('helvetica', 'normal')
    const dateStr = new Date(txn.timestamp).toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })
    const timeStr = new Date(txn.timestamp).toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    })
    doc.text(`${dateStr} | ${timeStr}`, pageWidth - margin - 5, y - 4, { align: 'right' })
    
    y += 15
    
    // Separator line
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.5)
    doc.line(margin + 10, y, pageWidth - margin - 10, y)
    
    y += 15
    
    // === TRANSACTION DETAILS SECTION ===
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction Details', margin + 10, y)
    y += 10
    
    // Table
    const tableData = [
      ['Transaction ID', txn.txn_id],
      ['User ID', txn.user_id],
      ['Amount', `Rs. ${txn.amount.toLocaleString('en-IN')}`],
      ['Location', txn.location],
      ['IP Address', txn.ip],
      ['Device', txn.device],
    ]
    
    const colWidth = contentWidth - 20
    const labelWidth = 50
    
    tableData.forEach(([label, value], index) => {
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(margin + 10, y - 5, colWidth, 10, 'F')
      }
      
      // Border
      doc.setDrawColor(229, 231, 235)
      doc.rect(margin + 10, y - 5, colWidth, 10, 'S')
      doc.line(margin + 10 + labelWidth, y - 5, margin + 10 + labelWidth, y + 5)
      
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128)
      doc.setFont('helvetica', 'normal')
      doc.text(label, margin + 15, y + 1)
      
      doc.setTextColor(31, 41, 55)
      doc.setFont('helvetica', 'bold')
      doc.text(value, margin + 15 + labelWidth, y + 1)
      
      y += 10
    })
    
    y += 15
    
    // === REASONS FOR FLAGGING SECTION ===
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Reasons for Flagging', margin + 10, y)
    y += 12
    
    // Use ruleFlags from the transaction to determine reasons
    const flags = txn.ruleFlags || []
    const reasons: Array<{icon: string, title: string, description: string, color: number[]}> = []
    
    // Check for high amount flags
    if (flags.includes('VERY_HIGH_AMOUNT') || flags.includes('HIGH_AMOUNT')) {
      reasons.push({
        icon: '!',
        title: 'High Transaction Amount',
        description: `Rs.${txn.amount.toLocaleString('en-IN')} is significantly higher than user's usual spending`,
        color: [220, 38, 38]
      })
    }
    
    // Check for location-related flags
    if (flags.includes('SUSPICIOUS_LOCATION') || flags.includes('RAPID_LOCATION_CHANGE') || flags.includes('LOCATION_CHANGE')) {
      const locDesc = flags.includes('RAPID_LOCATION_CHANGE') 
        ? `Impossible travel detected - Transaction from ${txn.location} occurred too quickly after previous location`
        : `Transaction from ${txn.location} is an unusual location for this user`
      reasons.push({
        icon: '!',
        title: 'Unusual Location',
        description: locDesc,
        color: [245, 158, 11]
      })
    }
    
    // Check for device-related flags
    if (flags.includes('NEW_DEVICE') || flags.includes('DEVICE_CHANGE')) {
      reasons.push({
        icon: '!',
        title: 'New Device',
        description: `Transaction initiated from an unrecognized ${txn.device} device`,
        color: [34, 197, 94]
      })
    }
    
    // Check for rapid/velocity flags
    if (flags.includes('RAPID_TRANSACTIONS') || flags.includes('VELOCITY_ANOMALY') || flags.includes('MULTIPLE_RECENT_TRANSACTIONS')) {
      reasons.push({
        icon: '!',
        title: 'Rapid Transactions',
        description: 'Multiple transactions detected in a short time period - possible automated fraud',
        color: [245, 158, 11]
      })
    }
    
    // Check for suspicious IP flags
    if (flags.includes('SUSPICIOUS_IP') || flags.includes('IP_CHANGE')) {
      const ipDesc = flags.includes('SUSPICIOUS_IP')
        ? `IP address ${txn.ip} flagged as potentially suspicious (VPN/Proxy detected)`
        : `IP address changed from previous transaction to ${txn.ip}`
      reasons.push({
        icon: '!',
        title: 'Suspicious IP/Network',
        description: ipDesc,
        color: [220, 38, 38]
      })
    }
    
    // Check for late night flag
    if (flags.includes('LATE_NIGHT')) {
      const hour = new Date(txn.timestamp).getHours()
      reasons.push({
        icon: '!',
        title: 'Late Night Transaction',
        description: `Transaction occurred at ${hour}:00 hours - unusual activity time`,
        color: [107, 114, 128]
      })
    }
    
    // Check for unusual pattern
    if (flags.includes('UNUSUAL_PATTERN')) {
      reasons.push({
        icon: '!',
        title: 'Unusual Pattern',
        description: 'Combination of high amount with new device detected - high risk pattern',
        color: [220, 38, 38]
      })
    }

    // Check for cross institution / consortium flags
    if (flags.includes('CROSS_INSTITUTION_MATCH') || flags.includes('KNOWN_SCAM_BENEFICIARY') || txn.agentResults?.intelligence?.matched) {
      reasons.push({
        icon: '!',
        title: 'Cross-Bank Consortium Threat Match',
        description: txn.agentResults?.intelligence?.summary || 'Beneficiary or entity matched known scam patterns in inter-bank consortium DB',
        color: [220, 38, 38]
      })
    }

    // Check for social engineering / scam call flags
    if (flags.includes('SCAM_CALL_COERCION') || flags.includes('ACTIVE_VOICE_CALL_DURING_TX') || flags.includes('VISHING_PLUS_SMS_CORRELATION') || txn.agentResults?.socialEngineering?.detected) {
      reasons.push({
        icon: '!',
        title: 'Scam-Call Coercion / Vishing Threat',
        description: txn.agentResults?.socialEngineering?.explanation || 'Active phone call or vishing coercion pattern detected during transaction',
        color: [220, 38, 38]
      })
    }
    
    if (reasons.length === 0 && txn.status !== 'SAFE') {
      // If flagged but no specific rules, add generic reason based on risk score
      reasons.push({
        icon: '!',
        title: 'Elevated Risk Score',
        description: `Transaction flagged due to cumulative risk factors scoring ${txn.riskScore}/100`,
        color: [245, 158, 11]
      })
    }
    
    if (reasons.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128)
      doc.setFont('helvetica', 'normal')
      doc.text('No specific fraud criteria detected - Transaction appears safe', margin + 15, y)
      y += 10
    } else {
      reasons.forEach(reason => {
        // Icon circle
        doc.setFillColor(reason.color[0], reason.color[1], reason.color[2])
        doc.circle(margin + 18, y - 2, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(6)
        doc.text(reason.icon, margin + 16.5, y - 0.5)
        
        // Title
        doc.setTextColor(31, 41, 55)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(reason.title + ':', margin + 25, y)
        
        // Description
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(75, 85, 99)
        const descLines = doc.splitTextToSize(reason.description, contentWidth - 50)
        doc.text(descLines, margin + 25, y + 6)
        
        y += 8 + (descLines.length * 5)
      })
    }
    
    y += 10
    
    // === FRAUD SCORE SECTION ===
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Fraud Score:', margin + 10, y)
    y += 5
    
    // Large score number
    const scoreColor = txn.riskScore >= 60 ? [220, 38, 38] : 
                       txn.riskScore >= 30 ? [245, 158, 11] : [34, 197, 94]
    const severityText = txn.riskScore >= 60 ? '(High)' : 
                         txn.riskScore >= 30 ? '(Medium)' : '(Low)'
    
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
    const scoreText = txn.riskScore.toString()
    doc.text(scoreText, margin + 15, y + 20)
    
    // Get the width of the score text while font is still set to 36
    const scoreTextWidth = doc.getTextWidth(scoreText)
    
    // Now set smaller font for severity label and position it after the score
    doc.setFontSize(14)
    doc.setTextColor(107, 114, 128)
    doc.text(severityText, margin + 15 + scoreTextWidth + 5, y + 20)
    
    // Description
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const scoreDesc = txn.riskScore >= 60 
      ? 'Transaction likely fraudulent, immediate review recommended.'
      : txn.riskScore >= 30 
      ? 'Transaction requires further verification.'
      : 'Transaction appears safe, no action required.'
    doc.text(scoreDesc, margin + 15, y + 30)
    
    // Draw speedometer gauge on the right
    const gaugeX = pageWidth - margin - 50
    const gaugeY = y + 15
    const gaugeRadius = 30
    
    // Gauge background arc (gradient effect with segments)
    const segments = [
      { start: Math.PI, end: Math.PI + (Math.PI * 0.33), color: [34, 197, 94] },   // Green
      { start: Math.PI + (Math.PI * 0.33), end: Math.PI + (Math.PI * 0.66), color: [245, 158, 11] }, // Yellow
      { start: Math.PI + (Math.PI * 0.66), end: Math.PI * 2, color: [220, 38, 38] }  // Red
    ]
    
    doc.setLineWidth(8)
    segments.forEach(seg => {
      doc.setDrawColor(seg.color[0], seg.color[1], seg.color[2])
      // Draw arc using lines
      const steps = 20
      for (let i = 0; i < steps; i++) {
        const angle1 = seg.start + ((seg.end - seg.start) * i / steps)
        const angle2 = seg.start + ((seg.end - seg.start) * (i + 1) / steps)
        const x1 = gaugeX + Math.cos(angle1) * gaugeRadius
        const y1 = gaugeY + Math.sin(angle1) * gaugeRadius
        const x2 = gaugeX + Math.cos(angle2) * gaugeRadius
        const y2 = gaugeY + Math.sin(angle2) * gaugeRadius
        doc.line(x1, y1, x2, y2)
      }
    })
    
    // Needle
    const needleAngle = Math.PI + (Math.PI * (txn.riskScore / 100))
    const needleLength = gaugeRadius - 5
    doc.setLineWidth(2)
    doc.setDrawColor(31, 41, 55)
    doc.line(
      gaugeX,
      gaugeY,
      gaugeX + Math.cos(needleAngle) * needleLength,
      gaugeY + Math.sin(needleAngle) * needleLength
    )
    
    // Center dot
    doc.setFillColor(31, 41, 55)
    doc.circle(gaugeX, gaugeY, 3, 'F')
    
    // Score in gauge
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(txn.riskScore.toString(), gaugeX, gaugeY + 18, { align: 'center' })
    
    // Footer line
    y = pageHeight - margin - 15
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.5)
    doc.line(margin + 10, y, pageWidth - margin - 10, y)
    
    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin + 10, y + 8)
    doc.text('AI-Powered Fraud Detection System', pageWidth - margin - 10, y + 8, { align: 'right' })
    
    // Render static vector Entity Relationship & Consortium Graph on Page 2
    renderPDFEntityGraph(doc, txn)

    doc.save(`fraud-report-${txn.txn_id}.pdf`)
  }

  const downloadAllReports = () => {
    if (filteredTransactions.length === 0) return

    const combinedDoc = new jsPDF()
    const pageWidth = combinedDoc.internal.pageSize.getWidth()

    filteredTransactions.forEach((txn, index) => {
      if (index > 0) combinedDoc.addPage()
      
      const pageHeight = combinedDoc.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)
      
      // Background
      combinedDoc.setFillColor(243, 244, 246)
      combinedDoc.rect(0, 0, pageWidth, pageHeight, 'F')
      
      // White card
      combinedDoc.setFillColor(255, 255, 255)
      combinedDoc.roundedRect(margin, margin, contentWidth, pageHeight - (margin * 2), 3, 3, 'F')
      
      let y = 28
      
      // Page indicator
      combinedDoc.setTextColor(107, 114, 128)
      combinedDoc.setFontSize(8)
      combinedDoc.text(`Report ${index + 1} of ${filteredTransactions.length}`, pageWidth - margin - 5, y - 10, { align: 'right' })
      
      // Title
      combinedDoc.setTextColor(31, 41, 55)
      combinedDoc.setFontSize(18)
      combinedDoc.setFont('helvetica', 'bold')
      combinedDoc.text('Fraud Detection Report', margin + 10, y)
      
      // Status badge
      const badgeColor = txn.status === 'FRAUD' ? [220, 38, 38] : 
                         txn.status === 'SUSPICIOUS' ? [245, 158, 11] : [34, 197, 94]
      combinedDoc.setFontSize(10)
      combinedDoc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2])
      combinedDoc.setFont('helvetica', 'bold')
      combinedDoc.text(txn.status, margin + 10, y + 8)
      
      y += 20
      
      // Details grid
      const details = [
        ['Transaction ID', txn.txn_id],
        ['User ID', txn.user_id],
        ['Amount', `Rs. ${txn.amount.toLocaleString('en-IN')}`],
        ['Location', txn.location],
        ['Device', txn.device],
        ['Risk Score', `${txn.riskScore}/100`],
      ]
      
      combinedDoc.setFontSize(9)
      details.forEach(([label, value], i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const xOffset = col * 90
        
        combinedDoc.setTextColor(107, 114, 128)
        combinedDoc.setFont('helvetica', 'normal')
        combinedDoc.text(label + ':', margin + 10 + xOffset, y + (row * 10))
        
        combinedDoc.setTextColor(31, 41, 55)
        combinedDoc.setFont('helvetica', 'bold')
        combinedDoc.text(value, margin + 45 + xOffset, y + (row * 10))
      })
      
      y += 35
      
      // AI Analysis
      combinedDoc.setTextColor(31, 41, 55)
      combinedDoc.setFontSize(11)
      combinedDoc.setFont('helvetica', 'bold')
      combinedDoc.text('Analysis:', margin + 10, y)
      y += 7
      
      combinedDoc.setFont('helvetica', 'normal')
      combinedDoc.setFontSize(9)
      combinedDoc.setTextColor(75, 85, 99)
      const splitReport = combinedDoc.splitTextToSize(txn.report || 'No analysis available', contentWidth - 20)
      combinedDoc.text(splitReport, margin + 10, y)

      // Render static vector Entity Relationship & Consortium Graph for each report
      renderPDFEntityGraph(combinedDoc, txn)
    })
    
    combinedDoc.save(`all-fraud-reports-${new Date().toISOString().split('T')[0]}.pdf`)
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
            {isStreaming && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-green-500" />
                </div>
                <span className="text-sm font-medium text-green-500">Live</span>
              </div>
            )}
            <Button onClick={refresh} variant="outline" className="gap-2">
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
