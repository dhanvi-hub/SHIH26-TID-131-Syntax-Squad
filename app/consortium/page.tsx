'use client'

import { useState, useEffect, useMemo } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Share2,
  ShieldAlert,
  Building2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Info,
  AlertTriangle,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react'
import type { ConsortiumRecord, ConsortiumStats } from '@/lib/types'

export default function ConsortiumPage() {
  const [records, setRecords] = useState<ConsortiumRecord[]>([])
  const [stats, setStats] = useState<ConsortiumStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<ConsortiumRecord | null>(null)
  const [filterType, setFilterType] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Submit Modal state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [submitForm, setSubmitForm] = useState({
    institutionId: 'BANK_A',
    entityType: 'BENEFICIARY',
    identifier: '',
    riskScore: 88,
    confidence: 0.92,
    signalType: 'BENEFICIARY_RISK',
    tags: 'mule_account, high_velocity',
    notes: 'Observed suspicious layer dispersal across clearing cycles.',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null)

  // Direct Lookup Sandbox state
  const [lookupIdentifier, setLookupIdentifier] = useState('BEN-7723')
  const [lookupEntityType, setLookupEntityType] = useState('BENEFICIARY')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const fetchConsortiumData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/consortium/records')
      const data = await res.json()
      if (data.success) {
        setRecords(data.records || [])
        setStats(data.stats || null)
        if (data.records?.length > 0 && !selectedRecord) {
          setSelectedRecord(data.records[0])
        }
      }
    } catch (err) {
      console.error('Failed to load consortium data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsortiumData()
  }, [])

  const handleLookupTest = async () => {
    if (!lookupIdentifier) return
    try {
      setIsLookingUp(true)
      const res = await fetch('/api/consortium/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: lookupEntityType,
          identifier: lookupIdentifier,
        }),
      })
      const data = await res.json()
      setLookupResult(data)
    } catch (err) {
      console.error('Lookup failed:', err)
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitForm.identifier.trim()) return

    try {
      setIsSubmitting(true)
      setSubmitFeedback(null)
      const res = await fetch('/api/consortium/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submitForm,
          tags: submitForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitFeedback(data.message)
        fetchConsortiumData()
        setTimeout(() => {
          setIsSubmitOpen(false)
          setSubmitFeedback(null)
          setSubmitForm({
            institutionId: 'BANK_A',
            entityType: 'BENEFICIARY',
            identifier: '',
            riskScore: 88,
            confidence: 0.92,
            signalType: 'BENEFICIARY_RISK',
            tags: 'mule_account, high_velocity',
            notes: '',
          })
        }, 1500)
      }
    } catch (err) {
      console.error('Submit report failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredRecords = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()

    return records.filter((r) => {
      if (!r) return false

      // 1. Entity type filter
      const entity = String(r.entityType ?? '').toUpperCase()
      const matchesFilter = filterType === 'ALL' || entity === filterType.toUpperCase()
      if (!matchesFilter) return false

      // 2. Search query filter
      if (!search) return true

      // Safe field matching with null coalescing and string normalization
      const idMatch = String(r.id ?? '').toLowerCase().includes(search)
      const tokenMatch = String(r.pseudonymousIdentifier ?? r.pseudonymizedIdentifier ?? '').toLowerCase().includes(search)
      const signalMatch = String(r.signalType ?? '').toLowerCase().includes(search)
      const notesMatch = String(r.notes ?? '').toLowerCase().includes(search)
      const statusMatch = String(r.status ?? '').toLowerCase().includes(search)
      const institutionIdMatch = String(r.institutionId ?? '').toLowerCase().includes(search)
      
      const tagMatch = Array.isArray(r.tags) && r.tags.some((t) => 
        String(t ?? '').toLowerCase().includes(search)
      )
      
      const institutionMatch = Array.isArray(r.contributingInstitutions) && r.contributingInstitutions.some((i) => 
        String(i ?? '').toLowerCase().includes(search)
      )

      return idMatch || tokenMatch || signalMatch || tagMatch || institutionMatch || notesMatch || statusMatch || institutionIdMatch
    })
  }, [records, filterType, searchQuery])

  // Active selected record: falls back cleanly if current selection is not in filtered list
  const activeRecord = useMemo(() => {
    if (selectedRecord && filteredRecords.some((r) => r.id === selectedRecord.id)) {
      return selectedRecord
    }
    return filteredRecords.length > 0 ? filteredRecords[0] : null
  }, [selectedRecord, filteredRecords])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto p-6 space-y-6">
        {/* Header with Title & Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Cross-Institution Fraud Intelligence</h1>
                <p className="text-sm text-muted-foreground">
                  Privacy-preserving pseudonymized threat sharing network across participating financial institutions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConsortiumData}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsSubmitOpen(!isSubmitOpen)}
              className="gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <Plus className="h-4 w-4" />
              Submit Threat Signal
            </Button>
          </div>
        </div>

        {/* Governance & Privacy Notice Banner */}
        <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
          <Lock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-cyan-200/90">
            <p className="font-semibold text-cyan-300">
              Prototype Privacy Architecture: Hashed / Pseudonymous Identifiers
            </p>
            <p>
              No raw customer PII (e.g. names, raw account numbers, phone numbers) is stored or exchanged. 
              Matching is computed deterministically via salted SHA-256 tokens. Shared signals provide independent risk evidence 
              and do not constitute an automatic block.
            </p>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Total Indexed Indicators</span>
                <Database className="h-4 w-4 text-cyan-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                {stats?.totalSignalsIndexed ?? records.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Across 4 entity types</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Participating Banks</span>
                <Building2 className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats?.participatingInstitutions ?? 4}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Apex, Horizon, Nexus, Zenith</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>High / Critical Threats</span>
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats?.highRiskIndicators ?? records.filter((r) => r.riskScore >= 75).length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Risk score ≥ 75/100</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Recent Reports (7d)</span>
                <Clock className="h-4 w-4 text-emerald-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {stats?.recentReportsCount ?? records.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Active sync window</p>
            </CardContent>
          </Card>
        </div>

        {/* Submit Threat Signal Drawer / Modal (Collapsible) */}
        {isSubmitOpen && (
          <Card className="bg-card border-cyan-500/40 shadow-lg">
            <CardHeader className="border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-cyan-400" />
                  Submit Validated Fraud Intelligence Signal
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">Simulate Bank Reporting</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Reporting Institution</Label>
                    <select
                      value={submitForm.institutionId}
                      onChange={(e) => setSubmitForm({ ...submitForm, institutionId: e.target.value })}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-md bg-secondary border border-border text-foreground"
                    >
                      <option value="BANK_A">Bank A (Apex Bank Ltd)</option>
                      <option value="BANK_B">Bank B (Horizon Financial Corp)</option>
                      <option value="BANK_C">Bank C (Nexus Payments Network)</option>
                      <option value="BANK_D">Bank D (Zenith Credit Union)</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Entity Type</Label>
                    <select
                      value={submitForm.entityType}
                      onChange={(e) => setSubmitForm({ ...submitForm, entityType: e.target.value as any })}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-md bg-secondary border border-border text-foreground"
                    >
                      <option value="BENEFICIARY">Beneficiary ID / Account</option>
                      <option value="DEVICE">Device Hardware Fingerprint</option>
                      <option value="IP">IP Address</option>
                      <option value="ACCOUNT">User Account ID</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Raw Identifier (Will be pseudonymized)</Label>
                    <Input
                      placeholder="e.g. BEN-7723 or FP-DEV-9812"
                      value={submitForm.identifier}
                      onChange={(e) => setSubmitForm({ ...submitForm, identifier: e.target.value })}
                      className="mt-1.5 font-mono text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Assessed Risk Score (1-100)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={submitForm.riskScore}
                      onChange={(e) => setSubmitForm({ ...submitForm, riskScore: Number(e.target.value) })}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Signal Type</Label>
                    <select
                      value={submitForm.signalType}
                      onChange={(e) => setSubmitForm({ ...submitForm, signalType: e.target.value as any })}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-md bg-secondary border border-border text-foreground"
                    >
                      <option value="BENEFICIARY_RISK">Beneficiary Mule Risk</option>
                      <option value="KNOWN_SCAM_ACCOUNT">Known Scam / Phishing Collector</option>
                      <option value="DEVICE_REPUTATION">Compromised Device Fingerprint</option>
                      <option value="IP_THREAT">Threat Actor IP</option>
                      <option value="MULE_NETWORK_SIGNAL">Mule Syndicate Cluster</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Tags (comma-separated)</Label>
                    <Input
                      placeholder="mule_account, rapid_dispersal"
                      value={submitForm.tags}
                      onChange={(e) => setSubmitForm({ ...submitForm, tags: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Investigator Notes (Evidence metadata)</Label>
                  <Input
                    placeholder="Observed multi-hop layering transfers..."
                    value={submitForm.notes}
                    onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                {submitFeedback && (
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {submitFeedback}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSubmitOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !submitForm.identifier.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    {isSubmitting ? 'Indexing Hash...' : 'Register Intelligence Signal'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Live Lookup Sandbox & Demonstration Helper */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Live Consortium Query Sandbox (Verify Privacy-Preserving Match)
              </CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setLookupEntityType('BENEFICIARY')
                    setLookupIdentifier('BEN-SCAM-7723')
                  }}
                  className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono text-[11px] text-foreground border border-border"
                >
                  BEN-SCAM-7723
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLookupEntityType('DEVICE')
                    setLookupIdentifier('FP-DEV-EMULATOR-77')
                  }}
                  className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono text-[11px] text-foreground border border-border"
                >
                  FP-DEV-EMULATOR-77
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLookupEntityType('BENEFICIARY')
                    setLookupIdentifier('BEN-CLEAN-1001')
                  }}
                  className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono text-[11px] text-foreground border border-border"
                >
                  BEN-CLEAN-1001
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={lookupEntityType}
                onChange={(e) => setLookupEntityType(e.target.value)}
                className="w-full md:w-44 px-3 py-2 text-sm rounded-md bg-secondary border border-border text-foreground"
              >
                <option value="BENEFICIARY">Beneficiary</option>
                <option value="DEVICE">Device</option>
                <option value="IP">IP Address</option>
                <option value="ACCOUNT">Account</option>
              </select>

              <div className="flex-1 relative">
                <Input
                  placeholder="Enter raw identifier (e.g. BEN-SCAM-7723 or BEN-7723) or token (BEN-****7723)..."
                  value={lookupIdentifier}
                  onChange={(e) => setLookupIdentifier(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleLookupTest}
                disabled={isLookingUp || !lookupIdentifier.trim()}
                className="gap-1.5"
              >
                <Search className="h-4 w-4" />
                {isLookingUp ? 'Hashing & Querying...' : 'Query Shared Layer'}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              <span className="text-cyan-400 font-semibold">Privacy Sandbox:</span> Enter a raw bank identifier (e.g. <code className="text-cyan-300">BEN-SCAM-7723</code>), shorthand (<code className="text-cyan-300">BEN-7723</code>), or pseudonymous token (<code className="text-cyan-300">BEN-****7723</code>) to simulate an inter-bank SHA-256 threat verification.
            </p>

            {lookupResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                  lookupResult.match
                    ? 'bg-destructive/10 border-destructive/30 text-destructive-foreground'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {lookupResult.match ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        MATCH FOUND IN CONSORTIUM REPOSITORY
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        NO ADVERSE INTELLIGENCE FOUND
                      </>
                    )}
                  </span>
                  <span className="font-mono text-[11px] bg-background/50 px-2 py-0.5 rounded border border-border">
                    Token: {lookupResult.pseudonymizedIdentifier}
                  </span>
                </div>

                {lookupResult.match && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Risk / Confidence</span>
                      <span className="font-bold text-foreground">
                        {lookupResult.riskScore}/100 ({Math.round(lookupResult.confidence * 100)}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Reporting Institutions</span>
                      <span className="font-bold text-cyan-400">
                        {lookupResult.institutionCount} Banks ({lookupResult.reportCount} reports)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Recency</span>
                      <span className="font-medium text-foreground">{lookupResult.recencyNote || 'Active'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Tags</span>
                      <span className="font-mono text-[10px] text-foreground">
                        {lookupResult.tags?.join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intelligence Repository Table & Detail Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table (2 Columns on Large) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Active Threat Indicators</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredRecords.length}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl justify-end">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search token, signal, tag, bank, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-8 bg-secondary/40 border-border"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1">
                  {['ALL', 'BENEFICIARY', 'DEVICE', 'IP', 'ACCOUNT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2 py-1 text-[11px] rounded-md transition-colors font-medium ${
                        filterType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50 text-muted-foreground text-left">
                      <th className="p-3 font-medium">Entity / Token</th>
                      <th className="p-3 font-medium">Signal Type</th>
                      <th className="p-3 font-medium">Risk</th>
                      <th className="p-3 font-medium">Confidence</th>
                      <th className="p-3 font-medium">Institutions</th>
                      <th className="p-3 font-medium">Reports</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-sans">
                          {records.length === 0 ? (
                            <div className="space-y-1.5 py-4">
                              <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                              <p className="font-semibold text-sm text-foreground">No Consortium Threat Indicators</p>
                              <p className="text-xs">No records currently registered in the shared inter-bank store.</p>
                            </div>
                          ) : (
                            <div className="space-y-2 py-4">
                              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                              <p className="font-semibold text-sm text-foreground">No matching threat indicators</p>
                              <p className="text-xs">
                                No indicators match &quot;{searchQuery}&quot; under {filterType} filter.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
                                className="text-xs h-7 gap-1 mt-2"
                              >
                                Clear Search & Filters
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => {
                        const isSelected = activeRecord?.id === r.id
                        const token = r.pseudonymousIdentifier || r.pseudonymizedIdentifier || 'UNKNOWN_TOKEN'
                        const signal = String(r.signalType ?? '').replace(/_/g, ' ')
                        const banksCount = Array.isArray(r.contributingInstitutions) ? r.contributingInstitutions.length : 1
                        const reportCount = r.reportCount ?? 1
                        const status = r.status ?? 'ACTIVE'
                        const riskScore = r.riskScore ?? 75

                        return (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedRecord(r)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400'
                                : 'hover:bg-secondary/40'
                            }`}
                          >
                            <td className="p-3">
                              <div className="font-semibold text-foreground">{token}</div>
                              <div className="text-[10px] text-muted-foreground font-sans uppercase">
                                {r.entityType}
                              </div>
                            </td>
                            <td className="p-3 font-sans text-muted-foreground">
                              {signal}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  riskScore >= 90
                                    ? 'bg-destructive/20 text-destructive'
                                    : riskScore >= 70
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {riskScore}/100
                              </span>
                            </td>
                            <td className="p-3 text-foreground">
                              {Math.round((r.confidence ?? 0.8) * 100)}%
                            </td>
                            <td className="p-3 text-cyan-400 font-semibold">
                              {banksCount} Banks
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {reportCount}
                            </td>
                            <td className="p-3 font-sans">
                              <Badge
                                variant="outline"
                                className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-950/20"
                              >
                                {status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Selected Record Intelligence Details Inspector */}
          <div className="space-y-4">
            <Card className="bg-card border-border sticky top-20">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Intelligence Evidence Details</span>
                  {activeRecord && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {activeRecord.id}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {activeRecord ? (
                  <>
                    <div className="p-3 rounded bg-secondary/50 border border-border space-y-1.5">
                      <span className="text-[10px] text-muted-foreground block">Pseudonymous Identifier</span>
                      <p className="font-mono text-sm font-bold text-foreground">
                        {activeRecord.pseudonymousIdentifier || activeRecord.pseudonymizedIdentifier || 'UNKNOWN_TOKEN'}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {activeRecord.entityType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            (activeRecord.riskScore ?? 0) >= 75
                              ? 'border-destructive/40 text-destructive bg-destructive/10'
                              : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          {activeRecord.riskLevel || 'HIGH'} RISK ({activeRecord.riskScore ?? 75}/100)
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-semibold text-foreground block">Contributing Institutions</span>
                      {Array.isArray(activeRecord.contributingInstitutions) && activeRecord.contributingInstitutions.length > 0 ? (
                        <div className="space-y-1.5">
                          {activeRecord.contributingInstitutions.map((bank, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-secondary/30 border border-border flex items-center justify-between"
                            >
                              <span className="text-foreground font-medium flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                                {bank}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">Verified</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">No contributing institutions recorded</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded bg-secondary/30 border border-border">
                        <span className="text-muted-foreground block text-[10px]">First Reported</span>
                        <span className="font-mono text-foreground">
                          {activeRecord.firstSeen ? new Date(activeRecord.firstSeen).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-secondary/30 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Last Corroborated</span>
                        <span className="font-mono text-foreground">
                          {activeRecord.lastSeen ? new Date(activeRecord.lastSeen).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-foreground block mb-1">Threat Tags</span>
                      {Array.isArray(activeRecord.tags) && activeRecord.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeRecord.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">No tags associated</p>
                      )}
                    </div>

                    {activeRecord.notes && (
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Evidence Metadata</span>
                        <p className="text-muted-foreground italic bg-secondary/20 p-2 rounded border border-border">
                          &quot;{activeRecord.notes}&quot;
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="font-medium text-xs">No Threat Indicator Selected</p>
                    <p className="text-[11px] mt-1 text-muted-foreground/70">
                      Select a threat record from the table to inspect cross-institution intelligence evidence.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
