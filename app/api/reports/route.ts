import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'

export async function GET() {
  const transactions = transactionStore.getAllTransactions()
  // Return all transactions, sorted by risk score (highest first)
  const sorted = transactions.sort((a, b) => b.riskScore - a.riskScore)
  return NextResponse.json(sorted)
}
