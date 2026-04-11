'use client'

import { useEffect, useState, useCallback } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, RefreshCw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import type { StateTransactionData } from '@/lib/types'

// India TopoJSON URL
const INDIA_TOPO_JSON = 'https://cdn.jsdelivr.net/npm/india-topojson@1.0.0/india.json'

// State center coordinates for markers
const stateCoordinates: Record<string, [number, number]> = {
  'Jammu & Kashmir': [74.797, 34.083],
  'Ladakh': [77.577, 34.152],
  'Himachal Pradesh': [77.173, 31.105],
  'Punjab': [75.341, 31.147],
  'Uttarakhand': [79.019, 30.067],
  'Haryana': [76.085, 29.059],
  'Delhi': [77.103, 28.704],
  'Rajasthan': [74.218, 27.023],
  'Uttar Pradesh': [80.946, 26.846],
  'Bihar': [85.313, 25.096],
  'Sikkim': [88.512, 27.533],
  'Arunachal Pradesh': [94.728, 28.218],
  'Nagaland': [94.562, 26.158],
  'Manipur': [93.906, 24.664],
  'Mizoram': [92.937, 23.164],
  'Tripura': [91.988, 23.940],
  'Meghalaya': [91.366, 25.467],
  'Assam': [92.937, 26.200],
  'West Bengal': [87.855, 22.987],
  'Jharkhand': [85.280, 23.610],
  'Odisha': [85.099, 20.952],
  'Chhattisgarh': [81.869, 21.279],
  'Madhya Pradesh': [78.656, 22.973],
  'Gujarat': [71.192, 22.259],
  'Maharashtra': [75.713, 19.751],
  'Telangana': [79.019, 18.112],
  'Andhra Pradesh': [79.740, 15.912],
  'Karnataka': [75.714, 15.317],
  'Goa': [74.124, 15.299],
  'Kerala': [76.271, 10.851],
  'Tamil Nadu': [78.657, 11.127],
  'Andaman & Nicobar': [92.736, 11.741],
  'Lakshadweep': [72.183, 10.567],
  'Puducherry': [79.808, 11.942],
  'Chandigarh': [76.779, 30.734],
}

// Map state names from TopoJSON to our naming convention
const stateNameMapping: Record<string, string> = {
  'JAMMU & KASHMIR': 'Jammu & Kashmir',
  'LADAKH': 'Ladakh',
  'HIMACHAL PRADESH': 'Himachal Pradesh',
  'PUNJAB': 'Punjab',
  'UTTARAKHAND': 'Uttarakhand',
  'HARYANA': 'Haryana',
  'NCT OF DELHI': 'Delhi',
  'DELHI': 'Delhi',
  'RAJASTHAN': 'Rajasthan',
  'UTTAR PRADESH': 'Uttar Pradesh',
  'BIHAR': 'Bihar',
  'SIKKIM': 'Sikkim',
  'ARUNACHAL PRADESH': 'Arunachal Pradesh',
  'NAGALAND': 'Nagaland',
  'MANIPUR': 'Manipur',
  'MIZORAM': 'Mizoram',
  'TRIPURA': 'Tripura',
  'MEGHALAYA': 'Meghalaya',
  'ASSAM': 'Assam',
  'WEST BENGAL': 'West Bengal',
  'JHARKHAND': 'Jharkhand',
  'ODISHA': 'Odisha',
  'ORISSA': 'Odisha',
  'CHHATTISGARH': 'Chhattisgarh',
  'MADHYA PRADESH': 'Madhya Pradesh',
  'GUJARAT': 'Gujarat',
  'MAHARASHTRA': 'Maharashtra',
  'TELANGANA': 'Telangana',
  'ANDHRA PRADESH': 'Andhra Pradesh',
  'KARNATAKA': 'Karnataka',
  'GOA': 'Goa',
  'KERALA': 'Kerala',
  'TAMIL NADU': 'Tamil Nadu',
  'ANDAMAN & NICOBAR': 'Andaman & Nicobar',
  'ANDAMAN & NICOBAR ISLANDS': 'Andaman & Nicobar',
  'LAKSHADWEEP': 'Lakshadweep',
  'PUDUCHERRY': 'Puducherry',
  'PONDICHERRY': 'Puducherry',
  'CHANDIGARH': 'Chandigarh',
  'DADRA & NAGAR HAVELI': 'Dadra & Nagar Haveli',
  'DAMAN & DIU': 'Daman & Diu',
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

function getStateColor(stateData: StateTransactionData | undefined) {
  if (!stateData) return '#1e293b' // Default dark color for no data
  
  const total = stateData.safeCount + stateData.suspiciousCount + stateData.fraudCount
  if (total === 0) return '#1e293b'
  
  // Color based on dominant status
  switch (stateData.dominantStatus) {
    case 'SAFE': return '#166534' // Dark green
    case 'SUSPICIOUS': return '#92400e' // Dark orange
    case 'FRAUD': return '#991b1b' // Dark red
    default: return '#1e293b'
  }
}

export default function MapPage() {
  const [stateData, setStateData] = useState<StateTransactionData[]>([])
  const [selectedState, setSelectedState] = useState<StateTransactionData | null>(null)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
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

  const getStateDataByName = (name: string) => {
    const normalizedName = stateNameMapping[name.toUpperCase()] || name
    return stateData.find(s => s.state === normalizedName)
  }

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
              <div className="relative bg-secondary/20 rounded-xl overflow-hidden" style={{ height: '600px' }}>
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  </div>
                ) : (
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 1000,
                      center: [82, 22],
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
                      <Geographies geography={INDIA_TOPO_JSON}>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const stateName = geo.properties.NAME_1 || geo.properties.name || geo.properties.ST_NM
                            const stateInfo = getStateDataByName(stateName)
                            const isHovered = hoveredState === stateName
                            const isSelected = selectedState?.state === (stateNameMapping[stateName?.toUpperCase()] || stateName)
                            
                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                onMouseEnter={() => setHoveredState(stateName)}
                                onMouseLeave={() => setHoveredState(null)}
                                onClick={() => {
                                  if (stateInfo) {
                                    setSelectedState(stateInfo)
                                  }
                                }}
                                style={{
                                  default: {
                                    fill: getStateColor(stateInfo),
                                    stroke: '#374151',
                                    strokeWidth: 0.5,
                                    outline: 'none',
                                  },
                                  hover: {
                                    fill: stateInfo ? getStatusColor(stateInfo.dominantStatus) : '#374151',
                                    stroke: '#fff',
                                    strokeWidth: 1,
                                    outline: 'none',
                                    cursor: 'pointer',
                                  },
                                  pressed: {
                                    fill: stateInfo ? getStatusColor(stateInfo.dominantStatus) : '#4b5563',
                                    stroke: '#fff',
                                    strokeWidth: 1,
                                    outline: 'none',
                                  },
                                }}
                              />
                            )
                          })
                        }
                      </Geographies>

                      {/* State Markers with pins */}
                      {stateData.map((state) => {
                        const coords = stateCoordinates[state.state]
                        if (!coords) return null

                        const total = state.safeCount + state.suspiciousCount + state.fraudCount
                        const pinSize = Math.min(Math.max(total * 1.5, 8), 20)

                        return (
                          <Marker
                            key={state.state}
                            coordinates={coords}
                            onClick={() => setSelectedState(state)}
                          >
                            <g transform="translate(-12, -24)" style={{ cursor: 'pointer' }}>
                              {/* Pin shape */}
                              <path
                                d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"
                                fill={getStatusColor(state.dominantStatus)}
                                stroke="#fff"
                                strokeWidth="1"
                              />
                              <circle
                                cx="12"
                                cy="8"
                                r="4"
                                fill="#fff"
                                opacity="0.9"
                              />
                              <text
                                x="12"
                                y="10"
                                textAnchor="middle"
                                fontSize="6"
                                fontWeight="bold"
                                fill={getStatusColor(state.dominantStatus)}
                              >
                                {total}
                              </text>
                            </g>
                            {/* Pulse animation for fraud states */}
                            {state.dominantStatus === 'FRAUD' && (
                              <circle
                                r={pinSize}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                opacity="0.5"
                              >
                                <animate
                                  attributeName="r"
                                  from={pinSize}
                                  to={pinSize + 15}
                                  dur="1.5s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="opacity"
                                  from="0.5"
                                  to="0"
                                  dur="1.5s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}
                          </Marker>
                        )
                      })}
                    </ZoomableGroup>
                  </ComposableMap>
                )}

                {/* Tooltip */}
                {hoveredState && (
                  <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
                    <p className="font-medium text-sm">
                      {stateNameMapping[hoveredState?.toUpperCase()] || hoveredState}
                    </p>
                    {getStateDataByName(hoveredState) && (
                      <p className="text-xs text-muted-foreground">
                        Click to view details
                      </p>
                    )}
                  </div>
                )}

                {stateData.length === 0 && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
                      <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No transaction data yet.</p>
                      <p className="text-sm text-muted-foreground">Start the simulation from the dashboard.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-safe" />
                  <span className="text-sm text-muted-foreground">Safe (75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-suspicious" />
                  <span className="text-sm text-muted-foreground">Suspicious (20%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-fraud" />
                  <span className="text-sm text-muted-foreground">Fraud (5%)</span>
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

                  {/* Risk Level Indicator */}
                  <div className="bg-secondary/20 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Risk Level</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const total = selectedState.safeCount + selectedState.suspiciousCount + selectedState.fraudCount
                        const riskPercent = total > 0 
                          ? Math.round(((selectedState.suspiciousCount * 0.5 + selectedState.fraudCount) / total) * 100) 
                          : 0
                        return (
                          <>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${riskPercent > 50 ? 'bg-fraud' : riskPercent > 25 ? 'bg-suspicious' : 'bg-safe'}`}
                                style={{ width: `${riskPercent}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{riskPercent}%</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a state to view details</p>
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
                      <span className="text-safe">{state.safeCount} Safe</span>
                      <span className="text-suspicious">{state.suspiciousCount} Sus</span>
                      <span className="text-fraud">{state.fraudCount} Fraud</span>
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
