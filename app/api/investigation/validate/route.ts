import { NextResponse } from 'next/server'
import { transactionStore } from '@/lib/store'
import { addOrUpdateConsortiumRecord } from '@/lib/intelligence/cross-institution-db'
import type { HumanValidation, HumanValidationDecision } from '@/lib/types'

/**
 * POST /api/investigation/validate
 * 
 * Handles human investigator review of flagged transactions.
 * Closes the feedback loop:
 * 1. Attaches human validation metadata to the transaction in store.
 * 2. Adds sample to the ML feedback dataset (capturing False Negatives & False Positives for retraining).
 * 3. If CONFIRMED_FRAUD and submitToConsortium is checked:
 *    Automatically generates pseudonymous threat intelligence and submits it to the Consortium layer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      txnId,
      decision,
      analystNotes,
      submitToConsortium = false,
      reportingInstitution = 'BANK_A',
      entityToReport,
    } = body

    if (!txnId || !decision) {
      return NextResponse.json(
        { error: 'txnId and decision are required' },
        { status: 400 }
      )
    }

    const validDecisions: HumanValidationDecision[] = [
      'CONFIRMED_FRAUD',
      'LEGITIMATE',
      'FALSE_POSITIVE',
      'NEEDS_FURTHER_INVESTIGATION',
    ]

    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      )
    }

    const txn = transactionStore.getTransactionById(txnId)
    if (!txn) {
      return NextResponse.json(
        { error: 'Transaction not found in active store' },
        { status: 404 }
      )
    }

    let consortiumSubmitted = false
    let reportedEntityInfo = undefined

    // If human confirms fraud and opted to share intelligence:
    if (decision === 'CONFIRMED_FRAUD' && submitToConsortium) {
      // Determine entity to submit: explicitly provided or fallback to beneficiary_id / device
      const entityType = entityToReport?.type || (txn.beneficiary_id ? 'BENEFICIARY' : txn.device_fingerprint ? 'DEVICE' : 'ACCOUNT')
      const rawIdentifier = entityToReport?.identifier || txn.beneficiary_id || txn.device_fingerprint || txn.user_id

      if (rawIdentifier) {
        const submission = addOrUpdateConsortiumRecord({
          institutionId: reportingInstitution,
          entityType,
          identifier: rawIdentifier,
          riskScore: Math.max(88, txn.riskScore),
          confidence: 0.95,
          signalType: entityType === 'BENEFICIARY' ? 'KNOWN_SCAM_ACCOUNT' : 'DEVICE_REPUTATION',
          tags: ['investigator_validated_fraud', 'human_verified'],
          notes: analystNotes || `Confirmed fraud on txn ${txn.txn_id}`
        })
        consortiumSubmitted = true
        reportedEntityInfo = {
          type: entityType,
          identifier: rawIdentifier,
          displayToken: submission.record.pseudonymousIdentifier
        }
      }
    }

    const validation: HumanValidation = {
      status: decision,
      validatedBy: 'Senior Fraud Analyst (Security Desk)',
      validatedAt: new Date().toISOString(),
      notes: analystNotes,
      submittedToConsortium: consortiumSubmitted,
      reportedEntity: reportedEntityInfo,
    }

    const updatedTxn = transactionStore.updateTransactionValidation(txnId, validation)

    return NextResponse.json({
      success: true,
      message: `Transaction successfully validated as ${decision}.`,
      validation,
      consortiumSubmitted,
      transaction: updatedTxn,
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Failed to record human validation' },
      { status: 500 }
    )
  }
}
