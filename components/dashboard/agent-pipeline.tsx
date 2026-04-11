'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, FileSearch, Gauge, FileText, CheckCircle2, Loader2, Circle } from 'lucide-react'
import type { AgentStep } from '@/lib/types'

interface AgentPipelineProps {
  steps: AgentStep[]
  isActive: boolean
}

const STEP_ICONS = {
  'Detective Agent': Search,
  'Research Agent': FileSearch,
  'Risk Engine': Gauge,
  'Reporting Agent': FileText,
}

const STEP_DESCRIPTIONS = {
  'Detective Agent': 'Rule-based fraud detection',
  'Research Agent': 'User behavior analysis',
  'Risk Engine': 'Risk score calculation',
  'Reporting Agent': 'Generate explanation',
}

function getStepIcon(step: AgentStep) {
  const IconComponent = STEP_ICONS[step.name as keyof typeof STEP_ICONS] || Circle
  
  if (step.status === 'complete') {
    return <CheckCircle2 className="h-5 w-5 text-safe" />
  }
  if (step.status === 'processing') {
    return <Loader2 className="h-5 w-5 text-primary animate-spin" />
  }
  return <IconComponent className="h-5 w-5 text-muted-foreground" />
}

export function AgentPipeline({ steps, isActive }: AgentPipelineProps) {
  const defaultSteps: AgentStep[] = [
    { name: 'Detective Agent', status: 'pending' },
    { name: 'Research Agent', status: 'pending' },
    { name: 'Risk Engine', status: 'pending' },
    { name: 'Reporting Agent', status: 'pending' },
  ]

  const displaySteps = steps.length > 0 ? steps : defaultSteps

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Agent Pipeline</span>
          {isActive && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
              Active
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Pipeline flow visualization */}
          <div className="flex items-center justify-between">
            {displaySteps.map((step, index) => (
              <div key={step.name} className="flex items-center flex-1">
                {/* Step node */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${step.status === 'complete' ? 'bg-safe/20 border-2 border-safe' : ''}
                      ${step.status === 'processing' ? 'bg-primary/20 border-2 border-primary' : ''}
                      ${step.status === 'pending' ? 'bg-secondary border-2 border-muted' : ''}
                    `}
                  >
                    {getStepIcon(step)}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-foreground">{step.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {STEP_DESCRIPTIONS[step.name as keyof typeof STEP_DESCRIPTIONS]}
                    </p>
                  </div>
                </div>
                
                {/* Connector line */}
                {index < displaySteps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <svg className="w-full h-2" viewBox="0 0 100 8">
                      <line
                        x1="0"
                        y1="4"
                        x2="100"
                        y2="4"
                        stroke={
                          displaySteps[index + 1].status !== 'pending'
                            ? 'oklch(0.65 0.18 145)'
                            : 'oklch(0.28 0.01 260)'
                        }
                        strokeWidth="2"
                        className={
                          step.status === 'complete' && displaySteps[index + 1].status !== 'pending'
                            ? 'animate-flow-line'
                            : ''
                        }
                      />
                      {/* Arrow head */}
                      <polygon
                        points="95,0 100,4 95,8"
                        fill={
                          displaySteps[index + 1].status !== 'pending'
                            ? 'oklch(0.65 0.18 145)'
                            : 'oklch(0.28 0.01 260)'
                        }
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
