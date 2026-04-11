'use client'

import { Button } from '@/components/ui/button'
import { Play, Square, RefreshCw, Trash2, Shield } from 'lucide-react'

interface HeaderProps {
  isStreaming: boolean
  onStartStreaming: () => void
  onStopStreaming: () => void
  onSeed: () => void
  onClear: () => void
}

export function DashboardHeader({
  isStreaming,
  onStartStreaming,
  onStopStreaming,
  onSeed,
  onClear,
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Fraud Detection System</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Transaction Monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isStreaming ? (
              <Button onClick={onStartStreaming} className="gap-2">
                <Play className="h-4 w-4" />
                Start Simulation
              </Button>
            ) : (
              <Button onClick={onStopStreaming} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                Stop Simulation
              </Button>
            )}
            
            <Button onClick={onSeed} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Seed Data
            </Button>
            
            <Button onClick={onClear} variant="outline" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
