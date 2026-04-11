'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import type { ProcessedTransaction, DashboardStats, AgentStep } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface StreamEvent {
  type: 'transaction' | 'stats'
  data: ProcessedTransaction | DashboardStats
  steps?: AgentStep[]
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [latestTransaction, setLatestTransaction] = useState<ProcessedTransaction | null>(null)
  const [latestSteps, setLatestSteps] = useState<AgentStep[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [fraudAlerts, setFraudAlerts] = useState<ProcessedTransaction[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  // Initial data fetch
  const { data: initialData, mutate } = useSWR('/api/transactions?limit=50', fetcher, {
    revalidateOnFocus: false,
    revalidateInterval: 0,
  })

  useEffect(() => {
    if (initialData) {
      setTransactions(initialData.transactions || [])
      setStats(initialData.stats || null)
    }
  }, [initialData])

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
    }

    return () => {
      eventSource.close()
      setIsStreaming(false)
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
      mutate()
    } catch (error) {
      console.error('[v0] Error seeding transactions:', error)
    }
  }, [mutate])

  const clearTransactions = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'DELETE' })
      setTransactions([])
      setStats(null)
      setFraudAlerts([])
      mutate()
    } catch (error) {
      console.error('[v0] Error clearing transactions:', error)
    }
  }, [mutate])

  const dismissFraudAlert = useCallback((txnId: string) => {
    setFraudAlerts((prev) => prev.filter((t) => t.txn_id !== txnId))
  }, [])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
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
    refresh: mutate,
  }
}
