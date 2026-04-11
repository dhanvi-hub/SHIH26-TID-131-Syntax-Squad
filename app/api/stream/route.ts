import { generateTransaction } from '@/lib/agents/transaction-generator'
import { processTransaction } from '@/lib/agents/pipeline'
import { transactionStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let isActive = true
  
  // Listen for client disconnect
  request.signal.addEventListener('abort', () => {
    isActive = false
  })
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial stats
      try {
        const stats = transactionStore.getStats()
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'stats', data: stats })}\n\n`)
        )
      } catch {
        return
      }
      
      // Function to send transaction updates
      const sendTransaction = async () => {
        if (!isActive) return false
        
        try {
          const transaction = generateTransaction()
          const result = await processTransaction(transaction)
          
          if (!isActive) return false
          
          // Send the processed transaction
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'transaction', 
                data: result.transaction,
                steps: result.steps 
              })}\n\n`
            )
          )
          
          // Send updated stats
          const updatedStats = transactionStore.getStats()
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'stats', data: updatedStats })}\n\n`)
          )
          
          return true
        } catch (error) {
          if (isActive) {
            console.error('[v0] Error generating transaction:', error)
          }
          return false
        }
      }
      
      // Generate transactions at random intervals (1-3 seconds)
      const generateAtInterval = async () => {
        while (isActive) {
          const success = await sendTransaction()
          if (!success || !isActive) break
          
          const delay = Math.floor(Math.random() * 2000) + 1000 // 1-3 seconds
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        
        // Close the controller when done
        try {
          controller.close()
        } catch {
          // Controller might already be closed
        }
      }
      
      generateAtInterval()
    },
    cancel() {
      isActive = false
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
