import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const stats = transactionStore.getStats()
  const timeSeriesData = transactionStore.getTimeSeriesData(12)
  const riskDistribution = transactionStore.getRiskDistribution()
  
  return NextResponse.json(
    {
      stats,
      timeSeriesData,
      riskDistribution,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  )
}
