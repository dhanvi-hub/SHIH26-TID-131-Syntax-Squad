import { generateTransaction } from '@/lib/agents/transaction-generator'
import { processTransaction } from '@/lib/agents/pipeline'
import { transactionStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let isActive = true
  let controllerClosed = false
  
  // Listen for client disconnect
  request.signal.addEventListener('abort', () => {
    isActive = false
  })
  
  const stream = new ReadableStream({
    async start(controller) {
      // Safe enqueue function that checks if controller is still open
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
      
      // Safe close function
      const safeClose = () => {
        if (controllerClosed) return
        controllerClosed = true
        try {
          controller.close()
        } catch {
          // Controller might already be closed
        }
      }
      
      // Send initial stats
      const stats = transactionStore.getStats()
      if (!safeEnqueue(`data: ${JSON.stringify({ type: 'stats', data: stats })}\n\n`)) {
        return
      }
      
      // Function to send transaction updates
      const sendTransaction = async () => {
        if (!isActive || controllerClosed) return false
        
        try {
          const transaction = generateTransaction()
          const result = await processTransaction(transaction)
          
          if (!isActive || controllerClosed) return false
          
          // Send the processed transaction
          if (!safeEnqueue(
            `data: ${JSON.stringify({ 
              type: 'transaction', 
              data: result.transaction,
              steps: result.steps 
            })}\n\n`
          )) {
            return false
          }
          
          // Send updated stats
          const updatedStats = transactionStore.getStats()
          if (!safeEnqueue(`data: ${JSON.stringify({ type: 'stats', data: updatedStats })}\n\n`)) {
            return false
          }
          
          return true
        } catch (error) {
          if (isActive && !controllerClosed) {
            console.error('[v0] Error generating transaction:', error)
          }
          return false
        }
      }
      
      // Generate transactions at random intervals (1-3 seconds)
      const generateAtInterval = async () => {
        while (isActive && !controllerClosed) {
          const success = await sendTransaction()
          if (!success || !isActive || controllerClosed) break
          
          const delay = Math.floor(Math.random() * 2000) + 1000 // 1-3 seconds
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        
        safeClose()
      }
      
      generateAtInterval()
    },
    cancel() {
      isActive = false
      controllerClosed = true
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
