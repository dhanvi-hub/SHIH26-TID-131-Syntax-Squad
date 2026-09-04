'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import type { ProcessedTransaction, DashboardStats, AgentStep } from '@/lib/types'

interface StreamEvent {
  type: 'transaction' | 'stats'
  data: ProcessedTransaction | DashboardStats
  steps?: AgentStep[]
}

interface StreamingContextType {
  transactions: ProcessedTransaction[]
  stats: DashboardStats | null
  latestTransaction: ProcessedTransaction | null
  latestSteps: AgentStep[]
  isStreaming: boolean
  fraudAlerts: ProcessedTransaction[]
  startStreaming: () => void
  stopStreaming: () => void
  seedTransactions: (count?: number) => Promise<void>
  clearTransactions: () => Promise<void>
  dismissFraudAlert: (txnId: string) => void
  refresh: () => Promise<void>
}

const StreamingContext = createContext<StreamingContextType | null>(null)

export function StreamingProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [latestTransaction, setLatestTransaction] = useState<ProcessedTransaction | null>(null)
  const [latestSteps, setLatestSteps] = useState<AgentStep[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [fraudAlerts, setFraudAlerts] = useState<ProcessedTransaction[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions?limit=50')
      const data = await res.json()
      setTransactions(data.transactions || [])
      setStats(data.stats || null)
      setIsInitialized(true)
    } catch (error) {
      console.error('[v0] Error fetching initial data:', error)
    }
  }, [])

  useEffect(() => {
    if (!isInitialized) {
      fetchInitialData()
    }
  }, [isInitialized, fetchInitialData])

  const startStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource('/api/stream')
    eventSourceRef.current = eventSource
    setIsStreaming(true)

    eventSource.onmessage = (event) => {
      try {
        const parsed: StreamEvent = JSON.parse(event.data)
        
        if (parsed.type === 'transaction') {
          const txn = parsed.data as ProcessedTransaction
          setLatestTransaction(txn)
          setLatestSteps(parsed.steps || [])
          
          setTransactions((prev) => {
            const newTxns = [txn, ...prev].slice(0, 100)
            return newTxns
          })

          // Add to fraud alerts if FRAUD status
          if (txn.status === 'FRAUD') {
            setFraudAlerts((prev) => [txn, ...prev].slice(0, 10))
          }
        } else if (parsed.type === 'stats') {
          setStats(parsed.data as DashboardStats)
        }
      } catch (error) {
        console.error('[v0] Error parsing stream event:', error)
      }
    }

    eventSource.onerror = () => {
      setIsStreaming(false)
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [])

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const seedTransactions = useCallback(async (count = 20) => {
    try {
      await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      })
      await fetchInitialData()
    } catch (error) {
      console.error('[v0] Error seeding transactions:', error)
    }
  }, [fetchInitialData])

  const clearTransactions = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'DELETE' })
      setTransactions([])
      setStats(null)
      setFraudAlerts([])
    } catch (error) {
      console.error('[v0] Error clearing transactions:', error)
    }
  }, [])

  const dismissFraudAlert = useCallback((txnId: string) => {
    setFraudAlerts((prev) => prev.filter((t) => t.txn_id !== txnId))
  }, [])

  const refresh = useCallback(async () => {
    await fetchInitialData()
  }, [fetchInitialData])

  return (
    <StreamingContext.Provider
      value={{
        transactions,
        stats,
        latestTransaction,
        latestSteps,
        isStreaming,
        fraudAlerts,
        startStreaming,
        stopStreaming,
        seedTransactions,
        clearTransactions,
        dismissFraudAlert,
        refresh,
      }}
    >
      {children}
    </StreamingContext.Provider>
  )
}

export function useStreaming() {
  const context = useContext(StreamingContext)
  if (!context) {
    throw new Error('useStreaming must be used within a StreamingProvider')
  }
  return context
}
