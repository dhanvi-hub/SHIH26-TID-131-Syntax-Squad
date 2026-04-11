import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'

export async function GET() {
  const stateData = transactionStore.getStateWiseData()
  return NextResponse.json(stateData)
}
