import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'
import { generateTransaction } from '@/lib/agents/transaction-generator'
import { processTransaction } from '@/lib/agents/pipeline'
import type { Transaction, DeviceTelemetry } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  
  const transactions = transactionStore.getTransactions(limit)
  const stats = transactionStore.getStats()
  
  return NextResponse.json({ transactions, stats })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    let transaction: Transaction
    let telemetry: DeviceTelemetry | undefined = body.telemetry
    
    if (body.generate) {
      transaction = generateTransaction(body.forceAnomaly)
    } else {
      transaction = body.transaction as Transaction
    }

    const result = await processTransaction(transaction, telemetry)
    
    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      steps: result.steps,
    })
  } catch (error) {
    console.error('[v0] Error processing transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process transaction' },
      { status: 500 }
    )
  }
}
