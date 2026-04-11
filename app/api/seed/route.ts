import { NextResponse } from 'next/server'
import { generateBatchTransactions } from '@/lib/agents/transaction-generator'
import { processBatchTransactions } from '@/lib/agents/pipeline'
import { transactionStore } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const count = Math.min(body.count || 20, 100) // Max 100 at once
    
    // Generate and process transactions
    const rawTransactions = generateBatchTransactions(count)
    const processedTransactions = await processBatchTransactions(rawTransactions)
    
    const stats = transactionStore.getStats()
    
    return NextResponse.json({
      success: true,
      count: processedTransactions.length,
      stats,
    })
  } catch (error) {
    console.error('[v0] Error seeding transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed transactions' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  transactionStore.clear()
  return NextResponse.json({ success: true, message: 'Store cleared' })
}
