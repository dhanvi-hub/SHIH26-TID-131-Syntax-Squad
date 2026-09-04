'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStreaming } from '@/contexts/streaming-context'
import { Navigation } from '@/components/navigation'
import { Play, Square, ShieldAlert, Zap, Radio, Activity, AlertTriangle, ChevronRight, Filter, ZoomIn, ZoomOut, RotateCcw, Globe } from 'lucide-react'
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

export default function CommandCenterMapPage() {
  const { isStreaming, startStreaming, stopStreaming, stats, transactions } = useStreaming()
  const [stateData, setStateData] = useState<StateTransactionData[]>([])
  const [selectedState, setSelectedState] = useState<StateTransactionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uptime, setUptime] = useState({ hours: 0, minutes: 0, seconds: 0 })

  // Map Mode: 'globe' vs 'india'
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
      console.error('Failed to fetch state data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStateData()
    const interval = setInterval(fetchStateData, 2000)
    return () => clearInterval(interval)
  }, [fetchStateData])

  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setUptime({
        hours: Math.floor(elapsed / 3600),
        minutes: Math.floor((elapsed % 3600) / 60),
        seconds: elapsed % 60
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const liveThreatTxns = transactions.filter(t => t.is_fraud || t.risk_level === 'CRITICAL' || t.risk_level === 'HIGH')

  // Smooth mode transition function - Forces [0, 0] for globe mode!
  const transitionToMode = (newMode: 'globe' | 'india') => {
    if (mapMode === newMode) return
    setIsTransitioning(true)
    setTimeout(() => {
      setMapMode(newMode)
      setRotationAngle(-78) // Perfectly centers World Globe
      setZoom(1)
      if (newMode === 'globe') {
        setCenter([0, 0]) // Always [0, 0] in 3D orthographic projection!
      } else {
        setCenter([82.5, 22.5])
      }
      setIsTransitioning(false)
    }, 350)
  }

  // Smooth zoom transition to India map when simulation starts
  useEffect(() => {
    if (isStreaming && mapMode !== 'india') {
      transitionToMode('india')
    }
  }, [isStreaming])

  // Continuous ambient globe rotation
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
  
  // Total Stats
  const totalScanned = stats?.totalTransactions || stateData.reduce((acc, s) => acc + s.safeCount + s.suspiciousCount + s.fraudCount, 0)
  const totalFraud = stats?.fraudCount || stateData.reduce((acc, s) => acc + s.fraudCount, 0)
  const totalSuspicious = stats?.suspiciousCount || stateData.reduce((acc, s) => acc + s.suspiciousCount, 0)
  const totalSafe = stats?.safeCount || stateData.reduce((acc, s) => acc + s.safeCount, 0)
  const threatRate = totalScanned > 0 ? (((totalFraud + totalSuspicious) / totalScanned) * 100).toFixed(1) : '0.0'

  const globeOrthographicScale = 280 * zoom

  // Find matching transaction for selected state to transfer data to /investigate
  const matchingTxn = selectedState ? liveThreatTxns.find(t => t.location.includes(selectedState.state)) : null
  const investigateUrl = selectedState 
    ? matchingTxn 
      ? `/investigate?txn_id=${encodeURIComponent(matchingTxn.txn_id)}&user_id=${encodeURIComponent(matchingTxn.user_id)}&amount=${matchingTxn.amount}&location=${encodeURIComponent(matchingTxn.location)}&ip=${encodeURIComponent(matchingTxn.ip)}&device=${encodeURIComponent(matchingTxn.device)}`
      : `/investigate?location=${encodeURIComponent(selectedState.state)}&amount=${selectedState.totalAmount || 50000}&user_id=USER-${selectedState.state.toUpperCase().replace(/\s+/g, '').slice(0, 5)}`
    : '/investigate'

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans flex flex-col">
      <Navigation />

      {/* COMMAND CENTER MAIN WORKSPACE - FIT 100% INTO VIEWPORT WITHOUT SCROLLBARS */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Background Cyber Grid */}
        <div className="absolute inset-0 cyber-grid-pattern opacity-30 pointer-events-none" />

        {/* LEFT HUD PANEL - THREAT ANALYTICS & DISTRIBUTION */}
        <aside className="w-full lg:w-80 border-r border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl p-4 flex flex-col gap-4 z-10 overflow-y-auto h-full">
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400 animate-pulse" />
              <h2 className="font-mono text-sm font-bold tracking-wider text-cyan-300 uppercase">
                THREAT ANALYTICS
              </h2>
            </div>
            <span className="font-mono text-[10px] bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 px-2 py-0.5 rounded">
              SOC v6.0
            </span>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="cyber-hud-card p-3 rounded-lg border-l-2 border-l-red-500">
              <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">CRITICAL FRAUD</p>
              <p className="font-mono text-2xl font-extrabold text-red-400 mt-1">{totalFraud}</p>
            </div>

            <div className="cyber-hud-card p-3 rounded-lg border-l-2 border-l-amber-500">
              <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">SUSPICIOUS</p>
              <p className="font-mono text-2xl font-extrabold text-amber-400 mt-1">{totalSuspicious}</p>
            </div>
          </div>

          {/* Threat Rate Gauge */}
          <div className="cyber-hud-card p-3.5 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-xs text-slate-300 font-semibold">THREAT EXPOSURE RATE</span>
              <span className="font-mono text-xs text-red-400 font-bold">{threatRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(5, parseFloat(threatRate)))}%` }}
              />
            </div>
          </div>

          {/* Regional Threat Intensity Ranking */}
          <div className="cyber-hud-card p-3.5 rounded-lg flex-1 flex flex-col">
            <h3 className="font-mono text-xs text-cyan-300 font-bold uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>ACTIVE THREAT ZONES</span>
              <span className="text-[10px] text-slate-400 font-normal">STRICT BLIPS</span>
            </h3>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {threatStates.length === 0 ? (
                <p className="font-mono text-xs text-slate-500 py-4 text-center">No active state threat blips</p>
              ) : (
                threatStates.map((st) => (
                  <div 
                    key={st.state}
                    onClick={() => {
                      setSelectedState(st)
                      const coords = stateCoordinates[st.state]
                      if (coords) {
                        transitionToMode('india')
                        setCenter(coords)
                        setZoom(1.8)
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-red-500/20 hover:border-red-500/60 transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-200 group-hover:text-red-400">
                        {st.state}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        Exposure: {'\u20B9'}{(st.totalAmount / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-extrabold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                        {st.fraudCount > 0 ? `${st.fraudCount} FRAUD` : `${st.suspiciousCount} SUSP`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Filter Status Badge */}
          <div className="cyber-hud-card p-3 rounded-lg flex items-center gap-2 text-xs font-mono text-cyan-300 border border-cyan-500/40">
            <Filter className="h-4 w-4 text-cyan-400" />
            <span>DISPLAY: STRICT THREAT BLIPS ONLY</span>
          </div>
        </aside>

        {/* CENTER MAIN MAP VIEWPORT */}
        <main className="flex-1 min-h-0 relative flex flex-col bg-[#02050b] overflow-hidden">
          {/* Top Telemetry Overlay Bar */}
          <div className="h-12 border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between z-20">
            <div className="flex items-center gap-6 font-mono text-xs">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-cyan-400 font-bold">
                  CYBER COMMAND RADAR
                </span>
              </span>
              <span className="text-slate-400">TOTAL SCANNED: <strong className="text-slate-200">{totalScanned}</strong></span>
              <span className="text-slate-400">CLEARED SAFE: <strong className="text-emerald-400">{totalSafe}</strong></span>
            </div>

            <div className="flex items-center gap-3">
              {!isStreaming ? (
                <Button 
                  onClick={startStreaming} 
                  size="sm"
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-mono text-xs gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Play className="h-3.5 w-3.5" /> INITIATE SIMULATION
                </Button>
              ) : (
                <Button 
                  onClick={stopStreaming} 
                  size="sm"
                  variant="destructive"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 font-mono text-xs gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <Square className="h-3.5 w-3.5" /> HALT SIMULATION
                </Button>
              )}
            </div>
          </div>

          {/* View Controls */}
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

          {/* Map Viewport Canvas with Smooth Transition Animation */}
          <div className={`flex-1 min-h-0 relative flex items-center justify-center p-4 z-10 transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Radio className="h-10 w-10 text-cyan-400 animate-spin" />
                <span className="text-cyan-400 font-mono text-xs tracking-widest animate-pulse">
                  ESTABLISHING COMMAND RADAR...
                </span>
              </div>
            ) : mapMode === 'globe' ? (
              /* 3D GLOBE IDLE MODE - IMMUTABLY CENTERED AT [0, 0] WITHOUT DRAG PANNING TRANSLATION */
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
                    <Marker key={`cmd-globe-${st.state}`} coordinates={coords} onClick={() => setSelectedState(st)}>
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
                  scale: 1050,
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
                        const isThreatRegion = stateInfo && (stateInfo.fraudCount > 0 || stateInfo.suspiciousCount > 0)
                        
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => {
                              if (stateInfo) {
                                setSelectedState(stateInfo)
                                const coords = stateCoordinates[stateName]
                                if (coords) {
                                  setCenter(coords)
                                  setZoom(1.8)
                                }
                              }
                            }}
                            style={{
                              default: {
                                fill: isThreatRegion ? '#250b18' : '#081424',
                                stroke: isThreatRegion ? '#ef4444' : '#1e3a5f',
                                strokeWidth: isThreatRegion ? 0.9 : 0.5,
                                outline: 'none',
                              },
                              hover: {
                                fill: isThreatRegion ? '#3b0d25' : '#0e233d',
                                stroke: isThreatRegion ? '#f87171' : '#38bdf8',
                                strokeWidth: 1.2,
                                outline: 'none',
                                cursor: 'pointer',
                              },
                            }}
                          />
                        )
                      })
                    }
                  </Geographies>

                  {/* Laser Trajectories */}
                  {threatStates.length > 1 && threatStates.slice(0, -1).map((fromSt, idx) => {
                    const toSt = threatStates[idx + 1]
                    const fromCoords = stateCoordinates[fromSt.state]
                    const toCoords = stateCoordinates[toSt.state]
                    if (!fromCoords || !toCoords) return null

                    return (
                      <Line
                        key={`cmd-arc-${fromSt.state}-${toSt.state}`}
                        from={fromCoords}
                        to={toCoords}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        opacity={0.8}
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
                        key={`cmd-marker-${st.state}`}
                        coordinates={coords}
                        onClick={() => setSelectedState(st)}
                      >
                        <circle
                          r={hasFraud ? 18 : 12}
                          fill="none"
                          stroke={markerColor}
                          strokeWidth="2"
                          opacity="0.8"
                        >
                          <animate
                            attributeName="r"
                            from={hasFraud ? 10 : 6}
                            to={hasFraud ? 35 : 24}
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

                        <circle
                          r={hasFraud ? 8 : 5.5}
                          fill={markerColor}
                          style={{
                            filter: `drop-shadow(0 0 12px ${markerColor})`,
                            cursor: 'pointer'
                          }}
                        />

                        <circle r={3} fill="#ffffff" />

                        <g transform="translate(12, -12)">
                          <rect
                            x="0"
                            y="0"
                            width={hasFraud ? "90" : "70"}
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
                        key={`cmd-live-txn-${txn.txn_id}`}
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
                            to="40"
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

          {/* Selected State HUD Card */}
          {selectedState && (
            <div className="absolute top-16 left-6 z-30 cyber-hud-card-threat rounded-xl p-5 w-80 shadow-2xl animate-slide-in">
              <div className="flex items-center justify-between border-b border-red-500/40 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-400 animate-bounce" />
                  <h4 className="font-mono text-sm font-bold text-red-400 uppercase tracking-wider">
                    {selectedState.state} THREAT DOSSIER
                  </h4>
                </div>
                <button 
                  onClick={() => setSelectedState(null)}
                  className="text-slate-400 hover:text-red-400 font-mono text-xs px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30"
                >
                  [X]
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-red-950/40 px-3 py-1.5 rounded border border-red-500/30">
                  <span className="text-red-300 font-semibold">CONFIRMED FRAUD:</span>
                  <span className="text-red-400 font-bold text-sm">{selectedState.fraudCount}</span>
                </div>

                <div className="flex justify-between items-center bg-amber-950/40 px-3 py-1.5 rounded border border-amber-500/30">
                  <span className="text-amber-300 font-semibold">SUSPICIOUS FLAGS:</span>
                  <span className="text-amber-400 font-bold text-sm">{selectedState.suspiciousCount}</span>
                </div>

                <div className="flex justify-between items-center bg-cyan-950/40 px-3 py-1.5 rounded border border-cyan-500/30">
                  <span className="text-slate-300">TOTAL EXPOSURE:</span>
                  <span className="text-cyan-300 font-bold text-sm">
                    {'\u20B9'}{selectedState.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2">
                  <Link 
                    href={investigateUrl}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/60 py-2 rounded text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                  >
                    INVESTIGATE INCOMING VECTORS <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Status Bar */}
          <div className="h-10 border-t border-cyan-500/20 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between text-xs font-mono text-slate-400 z-20">
            <div className="flex items-center gap-6">
              <span>ACTIVE THREAT BLIPS: <strong className="text-red-400">{threatStates.length}</strong></span>
              <span>RADAR MODE: {mapMode.toUpperCase()}</span>
            </div>
            <div className="text-cyan-400">
              COMMAND UPTIME: {String(uptime.hours).padStart(2, '0')}:{String(uptime.minutes).padStart(2, '0')}:{String(uptime.seconds).padStart(2, '0')}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
