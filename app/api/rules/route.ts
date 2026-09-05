import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'

export async function GET() {
  try {
    const rules = transactionStore.getRules()
    return NextResponse.json({ success: true, rules })
  } catch (error) {
    console.error('Error fetching rules:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { id, isActive } = await request.json()
    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }
    
    transactionStore.updateRule(id, isActive)
    
    return NextResponse.json({ success: true, rules: transactionStore.getRules() })
  } catch (error) {
    console.error('Error updating rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to update rule' }, { status: 500 })
  }
}
