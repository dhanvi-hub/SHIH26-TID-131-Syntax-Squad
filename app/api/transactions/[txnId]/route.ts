import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ txnId: string }> }
) {
  const { txnId } = await params
  const transaction = transactionStore.getTransactionById(txnId)
  
  if (!transaction) {
    return NextResponse.json(
      { error: 'Transaction not found' },
      { status: 404 }
    )
  }
  
  // Get user's transaction history for context
  const userHistory = transactionStore.getUserTransactions(transaction.user_id, 10)
  
  return NextResponse.json({
    transaction,
    userHistory: userHistory.filter((t) => t.txn_id !== txnId),
  })
}
