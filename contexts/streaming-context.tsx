'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import type { ProcessedTransaction, DashboardStats, AgentStep } from '@/lib/types'

interface StreamEvent {
  type: 'transaction' | 'stats'
  data: ProcessedTransaction | DashboardStats
  steps?: AgentStep[]
}

interface StreamingContextType {
  transactions: ProcessedTransaction[]
  stats: DashboardStats
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
  const [latestTransaction, setLatestTransaction] = useState<ProcessedTransaction | null>(null)
  const [latestSteps, setLatestSteps] = useState<AgentStep[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [fraudAlerts, setFraudAlerts] = useState<ProcessedTransaction[]>([])

  // Dynamic real-time stats computation from transactions state (100% synced, 0 side effects)
  const stats: DashboardStats = useMemo(() => {
    const totalTransactions = transactions.length
    const fraudCount = transactions.filter((t) => t.status === 'FRAUD').length
    const suspiciousCount = transactions.filter((t) => t.status === 'SUSPICIOUS').length
    const safeCount = transactions.filter((t) => t.status === 'SAFE').length
    const totalAmount = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const averageRiskScore =
      totalTransactions > 0
        ? transactions.reduce((sum, t) => sum + (Number(t.riskScore) || 0), 0) / totalTransactions
        : 0

    const crossInstitutionAlerts = transactions.filter((t) => t.agentResults?.intelligence?.matched).length
    const socialEngineeringAlerts = transactions.filter((t) => t.agentResults?.socialEngineering?.detected).length
    const multiSignalEscalations = transactions.filter((t) => t.multiSignalEscalation?.enabled).length

    return {
      totalTransactions,
      fraudCount,
      suspiciousCount,
      safeCount,
      totalAmount,
      averageRiskScore,
      crossInstitutionAlerts,
      socialEngineeringAlerts,
      multiSignalEscalations,
    }
  }, [transactions])

  // Fetch initial data & check simulation status on server
  const fetchInitialData = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions?limit=50')
      const data = await res.json()
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions)
      }

      // Sync simulation state with server controller
      const simRes = await fetch('/api/simulation').then(r => r.json()).catch(() => ({}))
      if (simRes.success && typeof simRes.isSimulating === 'boolean') {
        setIsStreaming(simRes.isSimulating)
      }
    } catch (error) {
      console.error('[StreamingContext] Error fetching initial data:', error)
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Resilient dual real-time engine: Auto-reconnecting SSE + 2s Polling Fallback
  useEffect(() => {
    let es: EventSource | null = null
    let isSubscribed = true

    const connectSSE = () => {
      if (!isSubscribed) return
      try {
        es = new EventSource('/api/stream')

        es.onmessage = (event) => {
          if (!isSubscribed) return
          try {
            const parsed: StreamEvent = JSON.parse(event.data)
            if (parsed.type === 'transaction') {
              const txn = parsed.data as ProcessedTransaction
              setLatestTransaction(txn)
              setLatestSteps(parsed.steps || [])

              setTransactions((prev) => {
                if (prev.some((t) => t.txn_id === txn.txn_id)) return prev
                return [txn, ...prev].slice(0, 100)
              })

              if (txn.status === 'FRAUD') {
                setFraudAlerts((prev) => [txn, ...prev].slice(0, 10))
              }
            }
          } catch {
            // Ignore non-JSON comments
          }
        }

        es.onerror = () => {
          if (es) {
            es.close()
            es = null
          }
          if (isSubscribed) {
            setTimeout(connectSSE, 2500)
          }
        }
      } catch {
        if (isSubscribed) {
          setTimeout(connectSSE, 3000)
        }
      }
    }

    connectSSE()

    // 2s Safety Net Polling (guarantees automatic UI updates even if SSE drops or hot reloads)
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/transactions?limit=50')
        const data = await res.json()
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions((prev) => {
            const newTxns = data.transactions.filter(
              (t: ProcessedTransaction) => !prev.some((p) => p.txn_id === t.txn_id)
            )
            if (newTxns.length === 0) return prev
            const combined = [...newTxns, ...prev]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 100)
            return combined
          })

          // Check simulation status periodically
          const simRes = await fetch('/api/simulation').then(r => r.json()).catch(() => ({}))
          if (simRes.success && typeof simRes.isSimulating === 'boolean') {
            setIsStreaming(simRes.isSimulating)
          }
        }
      } catch {
        // Silently maintain state
      }
    }, 2000)

    return () => {
      isSubscribed = false
      if (es) es.close()
      clearInterval(pollInterval)
    }
  }, [])

  // Start Simulation — triggers server-side background generator loop
  const startStreaming = useCallback(async () => {
    try {
      setIsStreaming(true)
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      }).then(r => r.json()).catch(() => ({}))

      if (res.success && typeof res.isSimulating === 'boolean') {
        setIsStreaming(res.isSimulating)
      }
    } catch (err) {
      console.error('[StreamingContext] Error starting simulation:', err)
    }
  }, [])

  // Stop Simulation — stops server-side background generator loop
  const stopStreaming = useCallback(async () => {
    try {
      setIsStreaming(false)
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      }).then(r => r.json()).catch(() => ({}))

      if (res.success && typeof res.isSimulating === 'boolean') {
        setIsStreaming(res.isSimulating)
      }
    } catch (err) {
      console.error('[StreamingContext] Error stopping simulation:', err)
    }
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
      console.error('[StreamingContext] Error seeding transactions:', error)
    }
  }, [fetchInitialData])

  const clearTransactions = useCallback(async () => {
    try {
      await stopStreaming()
      await fetch('/api/seed', { method: 'DELETE' })
      setTransactions([])
      setFraudAlerts([])
      setLatestTransaction(null)
    } catch (error) {
      console.error('[StreamingContext] Error clearing transactions:', error)
    }
  }, [stopStreaming])

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
