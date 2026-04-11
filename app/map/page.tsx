'use client'

import { useEffect, useState, useCallback } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StateTransactionData } from '@/lib/types'

// State coordinates for India map (approximate positions for visualization)
const stateCoordinates: Record<string, { x: number; y: number }> = {
  'Jammu & Kashmir': { x: 32, y: 8 },
  'Himachal Pradesh': { x: 35, y: 15 },
  'Punjab': { x: 30, y: 18 },
  'Uttarakhand': { x: 42, y: 18 },
  'Delhi': { x: 38, y: 22 },
  'Rajasthan': { x: 25, y: 30 },
  'Uttar Pradesh': { x: 50, y: 28 },
  'Bihar': { x: 65, y: 30 },
  'Sikkim': { x: 73, y: 25 },
  'Arunachal Pradesh': { x: 88, y: 22 },
  'Nagaland': { x: 90, y: 30 },
  'Manipur': { x: 88, y: 35 },
  'Mizoram': { x: 85, y: 42 },
  'Tripura': { x: 82, y: 40 },
  'Meghalaya': { x: 80, y: 32 },
  'Assam': { x: 82, y: 28 },
  'West Bengal': { x: 72, y: 38 },
  'Jharkhand': { x: 62, y: 38 },
  'Odisha': { x: 60, y: 48 },
  'Chhattisgarh': { x: 52, y: 45 },
  'Madhya Pradesh': { x: 42, y: 40 },
  'Gujarat': { x: 22, y: 45 },
  'Maharashtra': { x: 35, y: 55 },
  'Telangana': { x: 45, y: 58 },
  'Andhra Pradesh': { x: 48, y: 65 },
  'Karnataka': { x: 35, y: 68 },
  'Goa': { x: 28, y: 65 },
  'Kerala': { x: 32, y: 82 },
  'Tamil Nadu': { x: 45, y: 80 },
  'Andaman & Nicobar': { x: 92, y: 70 },
}

function getStatusColor(status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD') {
  switch (status) {
    case 'SAFE': return '#22c55e'
    case 'SUSPICIOUS': return '#f59e0b'
    case 'FRAUD': return '#ef4444'
    default: return '#6b7280'
  }
}

function getStatusBgColor(status: 'SAFE' | 'SUSPICIOUS' | 'FRAUD') {
  switch (status) {
    case 'SAFE': return 'bg-safe/20 text-safe border-safe/30'
    case 'SUSPICIOUS': return 'bg-suspicious/20 text-suspicious border-suspicious/30'
    case 'FRAUD': return 'bg-fraud/20 text-fraud border-fraud/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

export default function MapPage() {
  const [stateData, setStateData] = useState<StateTransactionData[]>([])
  const [selectedState, setSelectedState] = useState<StateTransactionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStateData = useCallback(async () => {
    try {
      const res = await fetch('/api/map-data')
      if (res.ok) {
        const data = await res.json()
        setStateData(data)
      }
    } catch (error) {
      console.error('Failed to fetch state data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStateData()
    const interval = setInterval(fetchStateData, 5000)
    return () => clearInterval(interval)
  }, [fetchStateData])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">India Transaction Map</h1>
            <p className="text-muted-foreground">Real-time fraud visualization by state</p>
          </div>
          <Button onClick={fetchStateData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-secondary/30 rounded-xl p-4 min-h-[500px]">
                {/* India Map Outline SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                  {/* Simplified India outline */}
                  <path
                    d="M30 5 L40 5 L45 10 L50 8 L55 12 L60 10 L70 15 L80 12 L90 15 L95 25 L92 35 L95 45 L90 55 L88 65 L85 75 L80 82 L70 85 L60 90 L50 95 L45 90 L40 85 L35 90 L30 85 L25 75 L20 65 L15 50 L18 40 L15 30 L20 20 L25 10 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-border"
                  />
                </svg>

                {/* State Pins */}
                {stateData.map((state) => {
                  const coords = stateCoordinates[state.state]
                  if (!coords) return null

                  const totalTxns = state.safeCount + state.suspiciousCount + state.fraudCount
                  const pinSize = Math.min(Math.max(totalTxns * 2, 12), 32)

                  return (
                    <button
                      key={state.state}
                      onClick={() => setSelectedState(state)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                      style={{
                        left: `${coords.x}%`,
                        top: `${coords.y}%`,
                      }}
                    >
                      <div
                        className="rounded-full flex items-center justify-center shadow-lg animate-pulse"
                        style={{
                          width: pinSize,
                          height: pinSize,
                          backgroundColor: getStatusColor(state.dominantStatus),
                          boxShadow: `0 0 ${pinSize}px ${getStatusColor(state.dominantStatus)}40`,
                        }}
                      >
                        <MapPin className="h-3 w-3 text-white" />
                      </div>
                    </button>
                  )
                })}

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  </div>
                )}

                {!isLoading && stateData.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">No transaction data yet. Start the simulation from the dashboard.</p>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-safe" />
                  <span className="text-sm text-muted-foreground">Safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-suspicious" />
                  <span className="text-sm text-muted-foreground">Suspicious</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-fraud" />
                  <span className="text-sm text-muted-foreground">Fraud</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* State Details Panel */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>State Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedState ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{selectedState.state}</h3>
                    <Badge variant="outline" className={getStatusBgColor(selectedState.dominantStatus)}>
                      {selectedState.dominantStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-safe/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-safe">{selectedState.safeCount}</p>
                      <p className="text-xs text-muted-foreground">Safe</p>
                    </div>
                    <div className="bg-suspicious/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-suspicious">{selectedState.suspiciousCount}</p>
                      <p className="text-xs text-muted-foreground">Suspicious</p>
                    </div>
                    <div className="bg-fraud/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-fraud">{selectedState.fraudCount}</p>
                      <p className="text-xs text-muted-foreground">Fraud</p>
                    </div>
                  </div>

                  <div className="bg-secondary/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Volume</p>
                    <p className="text-xl font-bold text-foreground">
                      {'\u20B9'}{selectedState.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Transaction Distribution</p>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
                      {(() => {
                        const total = selectedState.safeCount + selectedState.suspiciousCount + selectedState.fraudCount
                        if (total === 0) return <div className="w-full bg-muted" />
                        return (
                          <>
                            <div
                              className="bg-safe transition-all"
                              style={{ width: `${(selectedState.safeCount / total) * 100}%` }}
                            />
                            <div
                              className="bg-suspicious transition-all"
                              style={{ width: `${(selectedState.suspiciousCount / total) * 100}%` }}
                            />
                            <div
                              className="bg-fraud transition-all"
                              style={{ width: `${(selectedState.fraudCount / total) * 100}%` }}
                            />
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a state pin to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* State Summary Table */}
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle>All States Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stateData
                .sort((a, b) => (b.fraudCount + b.suspiciousCount) - (a.fraudCount + a.suspiciousCount))
                .map((state) => (
                  <button
                    key={state.state}
                    onClick={() => setSelectedState(state)}
                    className="bg-secondary/30 rounded-lg p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{state.state}</span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(state.dominantStatus) }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="text-safe">{state.safeCount}S</span>
                      <span className="text-suspicious">{state.suspiciousCount}M</span>
                      <span className="text-fraud">{state.fraudCount}F</span>
                    </div>
                  </button>
                ))}
            </div>
            {stateData.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-8">
                No transaction data available. Start the simulation from the dashboard.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
