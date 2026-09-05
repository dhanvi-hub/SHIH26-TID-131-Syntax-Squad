import { transactionStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let isActive = true
  let controllerClosed = false

  request.signal.addEventListener('abort', () => {
    isActive = false
    controllerClosed = true
  })

  const stream = new ReadableStream({
    async start(controller) {
      const safeEnqueue = (data: string) => {
        if (controllerClosed || !isActive) return false
        try {
          controller.enqueue(encoder.encode(data))
          return true
        } catch {
          controllerClosed = true
          return false
        }
      }

      const safeClose = () => {
        if (controllerClosed) return
        controllerClosed = true
        try {
          controller.close()
        } catch {
          // Controller might already be closed
        }
      }

      // 1. Send initial stats on connection
      const stats = transactionStore.getStats()
      safeEnqueue(`data: ${JSON.stringify({ type: 'stats', data: stats })}\n\n`)

      // 2. Subscribe to transactionStore events (captures Expo Go app, simulation & seed)
      const unsubscribe = transactionStore.subscribe((txn) => {
        if (!isActive || controllerClosed) return
        safeEnqueue(`data: ${JSON.stringify({ type: 'transaction', data: txn })}\n\n`)
        const updatedStats = transactionStore.getStats()
        safeEnqueue(`data: ${JSON.stringify({ type: 'stats', data: updatedStats })}\n\n`)
      })

      // 3. Heartbeat interval every 3s to keep SSE connection alive and prevent browser timeouts
      const heartbeatInterval = setInterval(() => {
        if (!isActive || controllerClosed) {
          clearInterval(heartbeatInterval)
          unsubscribe()
          safeClose()
          return
        }
        safeEnqueue(`: heartbeat\n\n`)
      }, 3000)

      request.signal.addEventListener('abort', () => {
        isActive = false
        controllerClosed = true
        if (heartbeatInterval) clearInterval(heartbeatInterval)
        unsubscribe()
        safeClose()
      })
    },
    cancel() {
      isActive = false
      controllerClosed = true
    }
  })

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
