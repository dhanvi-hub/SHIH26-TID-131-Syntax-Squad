import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'

export async function GET() {
  const stats = transactionStore.getStats()
  const timeSeriesData = transactionStore.getTimeSeriesData(12)
  const riskDistribution = transactionStore.getRiskDistribution()
  
  return NextResponse.json({
    stats,
    timeSeriesData,
    riskDistribution,
  })
}
