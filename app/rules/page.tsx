'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  Scale, 
  Banknote, 
  MapPin, 
  Clock, 
  Smartphone, 
  TrendingUp,
  Shield,
  AlertTriangle,
  Ban,
  Bell,
  Eye,
  Zap
} from 'lucide-react'
import type { BankRule } from '@/lib/types'

const initialRules: BankRule[] = [
  // Amount Rules
  {
    id: 'rule-001',
    name: 'High Value Transaction Alert',
    description: 'Flag transactions exceeding ₹1,00,000 for manual review',
    category: 'amount',
    severity: 'medium',
    isActive: true,
    threshold: 100000,
    action: 'review',
  },
  {
    id: 'rule-002',
    name: 'Very High Value Block',
    description: 'Block and hold transactions exceeding ₹5,00,000 until verified',
    category: 'amount',
    severity: 'critical',
    isActive: true,
    threshold: 500000,
    action: 'block',
  },
  {
    id: 'rule-003',
    name: 'Micro Transaction Pattern',
    description: 'Detect multiple small transactions under ₹500 in quick succession (possible card testing)',
    category: 'amount',
    severity: 'high',
    isActive: true,
    threshold: 500,
    action: 'flag',
  },

  // Location Rules
  {
    id: 'rule-004',
    name: 'Cross-State Rapid Transaction',
    description: 'Flag if transactions occur in different states within 30 minutes',
    category: 'location',
    severity: 'high',
    isActive: true,
    action: 'flag',
  },
  {
    id: 'rule-005',
    name: 'VPN/Proxy Detection',
    description: 'Block transactions originating from known VPN or proxy servers',
    category: 'location',
    severity: 'critical',
    isActive: true,
    action: 'block',
  },
  {
    id: 'rule-006',
    name: 'International Location Alert',
    description: 'Notify customer service when transaction location differs from registered address country',
    category: 'location',
    severity: 'medium',
    isActive: true,
    action: 'notify',
  },

  // Time-Based Rules
  {
    id: 'rule-007',
    name: 'Late Night Transaction Review',
    description: 'Flag transactions between 12 AM - 5 AM for additional verification',
    category: 'time',
    severity: 'medium',
    isActive: true,
    action: 'review',
  },
  {
    id: 'rule-008',
    name: 'Holiday Fraud Protection',
    description: 'Enhanced monitoring during bank holidays and weekends',
    category: 'time',
    severity: 'low',
    isActive: true,
    action: 'flag',
  },
  {
    id: 'rule-009',
    name: 'First Transaction After Dormancy',
    description: 'Flag large transactions from accounts inactive for 90+ days',
    category: 'time',
    severity: 'high',
    isActive: true,
    threshold: 90,
    action: 'review',
  },

  // Device Rules
  {
    id: 'rule-010',
    name: 'New Device Detection',
    description: 'Require OTP verification for transactions from unregistered devices',
    category: 'device',
    severity: 'medium',
    isActive: true,
    action: 'review',
  },
  {
    id: 'rule-011',
    name: 'Multiple Device Alert',
    description: 'Flag accounts accessed from more than 3 devices in 24 hours',
    category: 'device',
    severity: 'high',
    isActive: true,
    threshold: 3,
    action: 'flag',
  },
  {
    id: 'rule-012',
    name: 'Device-Location Mismatch',
    description: 'Block if device timezone differs significantly from transaction location',
    category: 'device',
    severity: 'critical',
    isActive: true,
    action: 'block',
  },

  // Pattern Rules
  {
    id: 'rule-013',
    name: 'Spending Pattern Deviation',
    description: 'Alert when transaction amount exceeds 3x user\'s average spending',
    category: 'pattern',
    severity: 'medium',
    isActive: true,
    threshold: 3,
    action: 'notify',
  },
  {
    id: 'rule-014',
    name: 'Merchant Category Anomaly',
    description: 'Flag unusual merchant categories for the user\'s transaction history',
    category: 'pattern',
    severity: 'low',
    isActive: true,
    action: 'flag',
  },
  {
    id: 'rule-015',
    name: 'Round Amount Pattern',
    description: 'Monitor multiple transactions with round amounts (₹10,000, ₹50,000)',
    category: 'pattern',
    severity: 'medium',
    isActive: true,
    action: 'review',
  },

  // Velocity Rules
  {
    id: 'rule-016',
    name: 'Daily Transaction Limit',
    description: 'Block if daily transaction count exceeds 20 transactions',
    category: 'velocity',
    severity: 'high',
    isActive: true,
    threshold: 20,
    action: 'block',
  },
  {
    id: 'rule-017',
    name: 'Hourly Velocity Check',
    description: 'Flag accounts with more than 5 transactions per hour',
    category: 'velocity',
    severity: 'medium',
    isActive: true,
    threshold: 5,
    action: 'flag',
  },
  {
    id: 'rule-018',
    name: 'Daily Amount Limit',
    description: 'Require additional verification if daily spend exceeds ₹10,00,000',
    category: 'velocity',
    severity: 'critical',
    isActive: true,
    threshold: 1000000,
    action: 'review',
  },
]

const categoryIcons = {
  amount: Banknote,
  location: MapPin,
  time: Clock,
  device: Smartphone,
  pattern: TrendingUp,
  velocity: Zap,
}

const severityColors = {
  low: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  medium: 'bg-suspicious/20 text-suspicious border-suspicious/30',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  critical: 'bg-fraud/20 text-fraud border-fraud/30',
}

const actionIcons = {
  flag: AlertTriangle,
  block: Ban,
  review: Eye,
  notify: Bell,
}

const actionColors = {
  flag: 'text-suspicious',
  block: 'text-fraud',
  review: 'text-chart-2',
  notify: 'text-primary',
}

export default function RulesPage() {
  const [rules, setRules] = useState<BankRule[]>(initialRules)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const toggleRule = (ruleId: string) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    )
  }

  const filteredRules = selectedCategory 
    ? rules.filter(rule => rule.category === selectedCategory)
    : rules

  const categories = ['amount', 'location', 'time', 'device', 'pattern', 'velocity']

  const getCategoryStats = (category: string) => {
    const categoryRules = rules.filter(r => r.category === category)
    const activeCount = categoryRules.filter(r => r.isActive).length
    return { total: categoryRules.length, active: activeCount }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bank Transaction Rules</h1>
            <p className="text-muted-foreground">Configure fraud detection rules and thresholds</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{rules.filter(r => r.isActive).length}</span> of {rules.length} rules active
            </div>
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            className="gap-2"
          >
            <Scale className="h-4 w-4" />
            All Rules
          </Button>
          {categories.map(category => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons]
            const stats = getCategoryStats(category)
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="gap-2 capitalize"
              >
                <Icon className="h-4 w-4" />
                {category}
                <Badge variant="secondary" className="ml-1">
                  {stats.active}/{stats.total}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Rules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map(rule => {
            const CategoryIcon = categoryIcons[rule.category]
            const ActionIcon = actionIcons[rule.action]
            
            return (
              <Card 
                key={rule.id} 
                className={`bg-card border-border transition-opacity ${
                  !rule.isActive ? 'opacity-60' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        rule.isActive ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <CategoryIcon className={`h-5 w-5 ${
                          rule.isActive ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">
                          {rule.category} Rule
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {rule.description}
                  </CardDescription>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={severityColors[rule.severity]}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                      {rule.threshold && (
                        <Badge variant="secondary" className="font-mono">
                          {rule.category === 'amount' || rule.category === 'velocity' && rule.threshold > 100
                            ? `₹${rule.threshold.toLocaleString('en-IN')}`
                            : rule.threshold}
                        </Badge>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${actionColors[rule.action]}`}>
                      <ActionIcon className="h-4 w-4" />
                      <span className="capitalize">{rule.action}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Rule Categories Summary */}
        <div className="mt-8 grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(category => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons]
            const stats = getCategoryStats(category)
            const criticalCount = rules.filter(r => r.category === category && r.severity === 'critical' && r.isActive).length
            
            return (
              <Card key={category} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="h-8 w-8 text-primary" />
                    {criticalCount > 0 && (
                      <Badge variant="outline" className="bg-fraud/20 text-fraud border-fraud/30">
                        {criticalCount} Critical
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold capitalize mb-1">{category}</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.active} active / {stats.total} total
                  </p>
                  <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(stats.active / stats.total) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Rule Engine Information</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  These rules are evaluated in real-time for every transaction. Rules with higher severity 
                  take precedence. When multiple rules are triggered, the strictest action is applied.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-suspicious" />
                    <span className="text-muted-foreground">Flag: Mark for review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-chart-2" />
                    <span className="text-muted-foreground">Review: Manual approval required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Notify: Alert sent to customer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-fraud" />
                    <span className="text-muted-foreground">Block: Transaction declined</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
