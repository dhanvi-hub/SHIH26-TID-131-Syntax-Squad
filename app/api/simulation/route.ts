import { NextResponse } from 'next/server'
import { generateTransaction } from '@/lib/agents/transaction-generator'
import { processTransaction } from '@/lib/agents/pipeline'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

let isSimulating = false
let simTimer: NodeJS.Timeout | null = null
let simSessionId = 0

function stopSimulation() {
  isSimulating = false
  simSessionId++
  if (simTimer) {
    clearTimeout(simTimer)
    simTimer = null
  }
}

function startSimulation() {
  stopSimulation()
  isSimulating = true
  const currentSession = simSessionId
  runSimulationStep(currentSession)
}

async function runSimulationStep(sessionId: number) {
  if (!isSimulating || sessionId !== simSessionId) return
  
  try {
    const randomTxn = generateTransaction()
    await processTransaction(randomTxn)
  } catch (err) {
    console.error('[Global Simulation Engine] Error generating transaction:', err)
  }

  if (isSimulating && sessionId === simSessionId) {
    const delay = Math.floor(Math.random() * 1500) + 1200 // 1.2s - 2.7s
    simTimer = setTimeout(() => runSimulationStep(sessionId), delay)
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  return NextResponse.json({ success: true, isSimulating }, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action || (isSimulating ? 'stop' : 'start')

    if (action === 'start') {
      startSimulation()
    } else if (action === 'stop') {
      stopSimulation()
    } else if (action === 'toggle') {
      if (isSimulating) {
        stopSimulation()
      } else {
        startSimulation()
      }
    }

    return NextResponse.json({ success: true, isSimulating }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update simulation state' }, { status: 500, headers: corsHeaders })
  }
}
