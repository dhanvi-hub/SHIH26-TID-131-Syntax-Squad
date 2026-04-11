import { generateTransaction } from '@/lib/agents/transaction-generator'
import { processTransaction } from '@/lib/agents/pipeline'
import { transactionStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial stats
      const stats = transactionStore.getStats()
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'stats', data: stats })}\n\n`)
      )
      
      // Function to send transaction updates
      const sendTransaction = async () => {
        try {
          const transaction = generateTransaction()
          const result = await processTransaction(transaction)
          
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
        } catch (error) {
          console.error('[v0] Error generating transaction:', error)
        }
      }
      
      // Generate transactions at random intervals (1-3 seconds)
      const generateAtInterval = async () => {
        while (true) {
          await sendTransaction()
          const delay = Math.floor(Math.random() * 2000) + 1000 // 1-3 seconds
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
      
      generateAtInterval().catch(console.error)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
