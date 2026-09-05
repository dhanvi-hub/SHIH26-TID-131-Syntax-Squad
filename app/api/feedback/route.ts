import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'

/**
 * GET /api/feedback
 * 
 * Returns the ML retraining feedback dataset compiled from human investigator decisions.
 * Displays false-negative samples (caught by consortium/rules despite low ML scores)
 * and false-positive samples (investigator confirmed legitimate despite high alerts).
 */
export async function GET() {
  try {
    const samples = transactionStore.getFeedbackSamples()
    const stats = transactionStore.getFeedbackStats()

    return NextResponse.json({
      success: true,
      stats,
      sampleCount: samples.length,
      samples,
      retrainingPipelineNotice: 'Dataset formatted for periodic offline retraining and evaluation of tree ensembles.',
    })
  } catch (error) {
    console.error('Failed to fetch ML feedback samples:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve feedback dataset' },
      { status: 500 }
    )
  }
}
