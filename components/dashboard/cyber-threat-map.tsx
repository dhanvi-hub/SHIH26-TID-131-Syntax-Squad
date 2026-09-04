'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStreaming } from '@/contexts/streaming-context'
import { Play, Square, ShieldAlert, Zap, Radio, Crosshair, ArrowUpRight, ZoomIn, ZoomOut, RotateCcw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from 'react-simple-maps'
import type { StateTransactionData } from '@/lib/types'
import { INDIAN_CITIES_DATA } from '@/lib/agents/transaction-generator'
import Link from 'next/link'

const INDIA_TOPO_JSON = 'https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson'
const WORLD_TOPO_JSON = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// State Coordinates lookup dictionary
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
}

interface CyberThreatMapProps {
  compact?: boolean
  className?: string
}

export function CyberThreatMap({ compact = false, className = '' }: CyberThreatMapProps) {
  const { isStreaming, startStreaming, stopStreaming, stats, transactions } = useStreaming()
  const [stateData, setStateData] = useState<StateTransactionData[]>([])
  const [selectedState, setSelectedState] = useState<StateTransactionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Map Mode: 'globe' (3D Rotating World Globe) vs 'india' (Complete India Threat Map)
  const [mapMode, setMapMode] = useState<'globe' | 'india'>('globe')
  const [rotationAngle, setRotationAngle] = useState(-78)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 0])
  const [isTransitioning, setIsTransitioning] = useState(false)

  const fetchStateData = useCallback(async () => {
    try {
      const res = await fetch('/api/map-data')
      if (res.ok) {
        const data = await res.json()
        setStateData(data)
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStateData()
    const interval = setInterval(fetchStateData, 2000)
    return () => clearInterval(interval)
  }, [fetchStateData])

  // Extract live threat transactions directly from memory (500ms updates)
  const liveThreatTxns = transactions.filter(t => t.is_fraud || t.risk_level === 'CRITICAL' || t.risk_level === 'HIGH')

  // Smooth mode transition function - Forces [0, 0] for globe mode so it never shifts right!
  const transitionToMode = (newMode: 'globe' | 'india') => {
    if (mapMode === newMode) return
    setIsTransitioning(true)
    setTimeout(() => {
      setMapMode(newMode)
      setRotationAngle(-78) // Perfectly centers World Globe
      setZoom(1)
      if (newMode === 'globe') {
        setCenter([0, 0]) // CRITICAL: Always [0, 0] for 3D Globe canvas!
      } else {
        setCenter([82.5, 22.5])
      }
      setIsTransitioning(false)
    }, 350)
  }

  // When simulation starts, smoothly switch to the complete India map view!
  useEffect(() => {
    if (isStreaming && mapMode !== 'india') {
      transitionToMode('india')
    }
  }, [isStreaming])

  // Ambient rotation when in globe mode and idle
  useEffect(() => {
    if (mapMode !== 'globe' || isStreaming) return
    const timer = setInterval(() => {
      setRotationAngle((prev) => (prev > 180 ? -180 : prev + 0.25))
    }, 50)
    return () => clearInterval(timer)
  }, [mapMode, isStreaming])

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 3.5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.8))
  const handleResetView = () => {
    setZoom(1)
    setRotationAngle(-78)
    if (mapMode === 'globe') {
      setCenter([0, 0])
    } else {
      setCenter([82.5, 22.5])
    }
  }

  // Filter ONLY threat states (fraud/suspicious)
  const threatStates = stateData.filter(s => s.fraudCount > 0 || s.suspiciousCount > 0)
  
  const totalFraud = stats?.fraudCount || stateData.reduce((acc, s) => acc + s.fraudCount, 0)
  const totalSuspicious = stats?.suspiciousCount || stateData.reduce((acc, s) => acc + s.suspiciousCount, 0)

  // Calibrated projection scales so 100% of India fits inside without any cropping!
  const indiaMercatorScale = compact ? 880 : 1050
  const globeOrthographicScale = (compact ? 220 : 280) * zoom

  // Find matching transaction for selected state to transfer data to /investigate
  const matchingTxn = selectedState ? liveThreatTxns.find(t => t.location.includes(selectedState.state)) : null
  const investigateUrl = selectedState 
    ? matchingTxn 
      ? `/investigate?txn_id=${encodeURIComponent(matchingTxn.txn_id)}&user_id=${encodeURIComponent(matchingTxn.user_id)}&amount=${matchingTxn.amount}&location=${encodeURIComponent(matchingTxn.location)}&ip=${encodeURIComponent(matchingTxn.ip)}&device=${encodeURIComponent(matchingTxn.device)}`
      : `/investigate?location=${encodeURIComponent(selectedState.state)}&amount=${selectedState.totalAmount || 50000}&user_id=USER-${selectedState.state.toUpperCase().replace(/\s+/g, '').slice(0, 5)}`
    : '/investigate'

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#040814] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] ${compact ? 'h-[540px]' : 'h-[720px]'} ${className}`}>
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid-pattern opacity-30 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950/80 to-[#02050b] pointer-events-none z-0" />

      {/* Top Left Header Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
        <div className="h-3 w-3 border-t-2 border-l-2 border-cyan-400" />
        <span className="font-mono text-[10px] tracking-widest text-cyan-400 uppercase flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded backdrop-blur-md">
          <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          GEOSPATIAL THREAT RADAR
        </span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-3 z-20">
        <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/40 px-3 py-1 rounded backdrop-blur-md">
          <ShieldAlert className="h-4 w-4 text-red-400 animate-bounce" />
          <span className="font-mono text-xs text-red-400 font-bold">
            LIVE THREATS: {totalFraud + totalSuspicious}
          </span>
        </div>
        <div className="h-3 w-3 border-t-2 border-r-2 border-cyan-400" />
      </div>

      {/* View Switcher & Interactive Zoom Controls */}
      <div className="absolute top-16 right-3 flex flex-col gap-1.5 z-20 bg-slate-950/80 border border-cyan-500/30 p-1.5 rounded-lg backdrop-blur-md shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/60 rounded transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/60 rounded transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => transitionToMode(mapMode === 'globe' ? 'india' : 'globe')}
          title={mapMode === 'globe' ? 'Zoom to India Map' : 'Switch to 3D Globe'}
          className="p-1.5 text-cyan-300 hover:bg-cyan-950/60 rounded transition-colors border-t border-cyan-500/20 mt-1 pt-1"
        >
          <Globe className="h-4 w-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Reset View"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/60 rounded transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <div className="h-3 w-3 border-b-2 border-l-2 border-cyan-400 mb-1" />
        {!isStreaming ? (
          <Button 
            onClick={startStreaming}
            size="sm"
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-mono text-xs gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Play className="h-3.5 w-3.5" />
            START SIMULATION RADAR
          </Button>
        ) : (
          <Button 
            onClick={stopStreaming}
            size="sm"
            variant="destructive"
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 font-mono text-xs gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            <Square className="h-3.5 w-3.5" />
            HALT SIMULATION
          </Button>
        )}
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-4">
        <Link 
          href="/map" 
          className="flex items-center gap-1 font-mono text-xs text-cyan-400 hover:text-cyan-200 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1 rounded transition-colors"
        >
          FULL COMMAND CENTER <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <div className="h-3 w-3 border-b-2 border-r-2 border-cyan-400" />
      </div>

      {/* Map Viewport Canvas with Smooth Transition Animation */}
      <div className={`absolute inset-0 flex items-center justify-center p-4 z-10 transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Crosshair className="h-10 w-10 text-cyan-400 animate-spin" />
            <span className="text-cyan-400 font-mono text-xs tracking-widest animate-pulse">
              INITIALIZING GEOSPATIAL RADAR...
            </span>
          </div>
        ) : mapMode === 'globe' ? (
          /* 3D WORLD GLOBE VIEW MODE - IMMUTABLY CENTERED AT [0, 0] WITHOUT DRAG PANNING TRANSLATION */
          <ComposableMap
            projection="geoOrthographic"
            projectionConfig={{
              scale: globeOrthographicScale,
              rotate: [rotationAngle, -20, 0],
              center: [0, 0],
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <Geographies geography={WORLD_TOPO_JSON}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isIndia = (geo.properties.name || '') === 'India'
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (isIndia) transitionToMode('india')
                      }}
                      style={{
                        default: {
                          fill: isIndia ? '#143048' : '#081424',
                          stroke: isIndia ? '#38bdf8' : '#1a375a',
                          strokeWidth: isIndia ? 1.2 : 0.4,
                          outline: 'none',
                        },
                        hover: {
                          fill: isIndia ? '#1f4568' : '#0e223c',
                          stroke: '#38bdf8',
                          strokeWidth: 1.5,
                          outline: 'none',
                          cursor: isIndia ? 'pointer' : 'default',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Threat Dots on Globe */}
            {threatStates.map((st) => {
              const coords = stateCoordinates[st.state]
              if (!coords) return null
              const hasFraud = st.fraudCount > 0
              const markerColor = hasFraud ? '#ef4444' : '#f59e0b'

              return (
                <Marker key={`globe-${st.state}`} coordinates={coords} onClick={() => setSelectedState(st)}>
                  <circle r={hasFraud ? 8 : 5} fill={markerColor} style={{ filter: `drop-shadow(0 0 8px ${markerColor})` }} />
                  <circle r={2.5} fill="#ffffff" />
                </Marker>
              )
            })}
          </ComposableMap>
        ) : (
          /* ZOOMED INDIA MAP RADAR MODE */
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: indiaMercatorScale,
              center: [82.5, 22.5],
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup 
              zoom={zoom} 
              center={[82.5, 22.5]}
              minZoom={0.8} 
              maxZoom={5}
            >
              <Geographies geography={INDIA_TOPO_JSON}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateName = geo.properties.ST_NM || geo.properties.st_nm || geo.properties.NAME_1 || geo.properties.name || geo.properties.state || ''
                    const stateInfo = stateData.find(s => s.state === stateName)
                    const isThreat = stateInfo && (stateInfo.fraudCount > 0 || stateInfo.suspiciousCount > 0)
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => {
                          if (stateInfo) setSelectedState(stateInfo)
                        }}
                        style={{
                          default: {
                            fill: isThreat ? '#250b18' : '#0a1a2e',
                            stroke: isThreat ? '#ef4444' : '#225188',
                            strokeWidth: isThreat ? 1 : 0.5,
                            outline: 'none',
                          },
                          hover: {
                            fill: isThreat ? '#3b0e26' : '#102a4a',
                            stroke: isThreat ? '#f87171' : '#38bdf8',
                            strokeWidth: 1.5,
                            outline: 'none',
                            cursor: 'pointer',
                          },
                        }}
                      />
                    )
                  })
                }
              </Geographies>

              {/* Trajectory Arcs between active threat centers */}
              {threatStates.length > 1 && threatStates.slice(0, -1).map((fromSt, idx) => {
                const toSt = threatStates[idx + 1]
                const fromCoords = stateCoordinates[fromSt.state]
                const toCoords = stateCoordinates[toSt.state]
                if (!fromCoords || !toCoords) return null

                return (
                  <Line
                    key={`india-arc-${fromSt.state}-${toSt.state}`}
                    from={fromCoords}
                    to={toCoords}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    opacity={0.8}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.9))'
                    }}
                  />
                )
              })}

              {/* STRICT THREAT BLIPS ONLY */}
              {threatStates.map((st) => {
                const coords = stateCoordinates[st.state]
                if (!coords) return null

                const hasFraud = st.fraudCount > 0
                const markerColor = hasFraud ? '#ef4444' : '#f59e0b'

                return (
                  <Marker
                    key={`threat-dot-${st.state}`}
                    coordinates={coords}
                    onClick={() => setSelectedState(st)}
                  >
                    {/* Outer Pulsing Sonar Ring */}
                    <circle
                      r={hasFraud ? 16 : 10}
                      fill="none"
                      stroke={markerColor}
                      strokeWidth="2"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        from={hasFraud ? 10 : 6}
                        to={hasFraud ? 35 : 22}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.9"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Main Glowing Dot */}
                    <circle
                      r={hasFraud ? 8 : 5.5}
                      fill={markerColor}
                      style={{
                        filter: `drop-shadow(0 0 12px ${markerColor})`,
                        cursor: 'pointer'
                      }}
                    />

                    {/* Bright Center */}
                    <circle r={3} fill="#ffffff" />

                    {/* HUD Tag Label */}
                    <g transform="translate(12, -12)">
                      <rect
                        x="0"
                        y="0"
                        width={hasFraud ? "90" : "72"}
                        height="20"
                        rx="3"
                        fill="rgba(10, 15, 26, 0.95)"
                        stroke={markerColor}
                        strokeWidth="1.2"
                      />
                      <text
                        x="6"
                        y="13"
                        fill={markerColor}
                        fontSize="9px"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {st.state}: {hasFraud ? `${st.fraudCount} FRAUD` : `${st.suspiciousCount} SUSP`}
                      </text>
                    </g>
                  </Marker>
                )
              })}

              {/* LIVE STREAMING FRAUD DOTS */}
              {isStreaming && liveThreatTxns.map((txn) => {
                const matchedCity = INDIAN_CITIES_DATA.find(c => txn.location.includes(c.city) || txn.location.includes(c.region))
                if (!matchedCity) return null

                return (
                  <Marker
                    key={`live-txn-${txn.txn_id}`}
                    coordinates={matchedCity.coordinates}
                  >
                    <circle
                      r={24}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                    >
                      <animate
                        attributeName="r"
                        from="8"
                        to="45"
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="1"
                        to="0"
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </Marker>
                )
              })}
            </ZoomableGroup>
          </ComposableMap>
        )}
      </div>

      {/* Selected Threat Popup Card */}
      {selectedState && (
        <div className="absolute top-16 right-14 z-30 cyber-hud-card-threat rounded-lg p-4 w-72 animate-slide-in">
          <div className="flex items-center justify-between border-b border-red-500/30 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-400 animate-pulse" />
              <h4 className="text-red-400 font-mono text-sm font-bold uppercase tracking-wider">
                {selectedState.state} THREAT DOSSIER
              </h4>
            </div>
            <button 
              onClick={() => setSelectedState(null)}
              className="text-gray-400 hover:text-red-400 font-mono text-xs px-1.5 py-0.5 rounded bg-red-950/40 border border-red-500/30"
            >
              ESC
            </button>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center bg-red-950/30 px-2 py-1 rounded">
              <span className="text-red-300 font-semibold">CONFIRMED FRAUDS:</span>
              <span className="text-red-400 font-bold text-sm">{selectedState.fraudCount}</span>
            </div>

            <div className="flex justify-between items-center bg-yellow-950/30 px-2 py-1 rounded">
              <span className="text-yellow-300 font-semibold">SUSPICIOUS FLAGS:</span>
              <span className="text-yellow-400 font-bold text-sm">{selectedState.suspiciousCount}</span>
            </div>

            <div className="flex justify-between items-center bg-cyan-950/30 px-2 py-1 rounded">
              <span className="text-gray-300">EXPOSURE VOLUME:</span>
              <span className="text-cyan-400 font-bold">
                {'\u20B9'}{selectedState.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-2 border-t border-red-500/20">
              <Link 
                href={investigateUrl}
                className="w-full flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 py-1.5 rounded text-xs font-bold transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              >
                OPEN INVESTIGATION DOSSIER
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* No Detected Threats Overlay */}
      {threatStates.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="cyber-hud-card p-6 rounded-xl border border-cyan-500/40 text-center max-w-sm pointer-events-auto">
            <ShieldAlert className="h-8 w-8 text-cyan-400 mx-auto mb-2 opacity-80" />
            <p className="text-cyan-300 font-mono text-sm font-bold mb-1">NO ACTIVE THREAT BLIPS ON RADAR</p>
            <p className="text-slate-400 font-mono text-xs mb-4">
              All transactions in scanned Indian states are evaluated as safe. Initiate simulation to stream real-time threat vectors.
            </p>
            {!isStreaming && (
              <Button
                onClick={startStreaming}
                size="sm"
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-mono text-xs"
              >
                START SIMULATION RADAR
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
