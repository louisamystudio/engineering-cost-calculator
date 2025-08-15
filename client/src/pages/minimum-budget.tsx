import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Calculator, Building, DollarSign, PieChart, BarChart3, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { BudgetInput, BudgetCalculationResult } from '@shared/schema';

interface BudgetFormData {
  building_type: string;
  tier: number;
  new_area_ft2: number;
  existing_area_ft2: number;
  site_area_m2: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export default function MinimumBudgetCalculator() {
  const [formData, setFormData] = useState<BudgetFormData>({
    building_type: '',
    tier: 1,
    new_area_ft2: 1000,
    existing_area_ft2: 4407,
    site_area_m2: 973,
  });

  const [result, setResult] = useState<BudgetCalculationResult | null>(null);
  const queryClient = useQueryClient();

  // Calculate total area immediately from form inputs
  const totalArea = formData.new_area_ft2 + formData.existing_area_ft2;

  // Fetch building types
  const { data: buildingTypes = [] } = useQuery<string[]>({
    queryKey: ['/api/building-types'],
    queryFn: async () => {
      const response = await fetch('/api/building-types');
      return response.json();
    },
  });

  // Fetch tiers for selected building type
  const { data: tiersData } = useQuery<{ building_type: string; tiers: number[] }>({
    queryKey: ['/api/building-types', formData.building_type, 'tiers'],
    queryFn: async () => {
      const response = await fetch(`/api/building-types/${encodeURIComponent(formData.building_type)}/tiers`);
      return response.json();
    },
    enabled: !!formData.building_type,
  });

  // Calculate budget mutation
  const calculateBudget = useMutation<BudgetCalculationResult, Error, BudgetInput>({
    mutationFn: async (input: BudgetInput) => {
      const response = await fetch('/api/calc/minimum-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error('Failed to calculate budget');
      }
      return response.json();
    },
    onSuccess: (data: BudgetCalculationResult) => {
      setResult(data);
    },
  });

  // Auto-calculate when form changes
  useEffect(() => {
    if (formData.building_type && formData.tier) {
      const input: BudgetInput = {
        building_type: formData.building_type,
        tier: formData.tier,
        new_area_ft2: formData.new_area_ft2,
        existing_area_ft2: formData.existing_area_ft2,
        site_area_m2: formData.site_area_m2,
      };
      calculateBudget.mutate(input);
    }
  }, [formData]);

  const handleInputChange = (field: keyof BudgetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset tier when building type changes
  useEffect(() => {
    if (tiersData?.tiers?.length > 0 && !tiersData.tiers.includes(formData.tier)) {
      setFormData(prev => ({ ...prev, tier: tiersData.tiers[0] }));
    }
  }, [tiersData, formData.tier]);

  const StatCard = ({ title, value, change, icon: Icon, trend }: {
    title: string;
    value: string;
    change?: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-gray-50 font-inter text-dark-slate min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-light-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-scientific-blue rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-dark-slate">Minimum Budget Calculator</h1>
                <p className="text-sm text-gray-500">Project budget calculation & analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                Live Calculation
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Project Details
                </CardTitle>
                <CardDescription>
                  Enter your project specifications for budget calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="building-type">Building Type</Label>
                  <Select 
                    value={formData.building_type} 
                    onValueChange={(value) => handleInputChange('building_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildingTypes.map((type: string) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {tiersData?.tiers && (
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Select 
                      value={formData.tier.toString()} 
                      onValueChange={(value) => handleInputChange('tier', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiersData.tiers.map((tier: number) => (
                          <SelectItem key={tier} value={tier.toString()}>
                            Tier {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-area">New Building Area (ft²)</Label>
                  <Input
                    id="new-area"
                    type="number"
                    value={formData.new_area_ft2}
                    onChange={(e) => handleInputChange('new_area_ft2', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="existing-area">Existing Building Area (ft²)</Label>
                  <Input
                    id="existing-area"
                    type="number"
                    value={formData.existing_area_ft2}
                    onChange={(e) => handleInputChange('existing_area_ft2', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-area">Site Area (m²)</Label>
                  <Input
                    id="site-area"
                    type="number"
                    value={formData.site_area_m2}
                    onChange={(e) => handleInputChange('site_area_m2', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>

                {calculateBudget.isPending && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-scientific-blue"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Area"
                    value={`${totalArea.toLocaleString()} ft²`}
                    icon={Building}
                  />
                  <StatCard
                    title="Cost per sq ft"
                    value={`$${result.all_in.min_psf} - $${result.all_in.max_psf}`}
                    icon={DollarSign}
                  />
                  <StatCard
                    title="Total Budget Range"
                    value={`${formatCurrency(result.total_cost.low)} - ${formatCurrency(result.total_cost.high)}`}
                    icon={TrendingUp}
                  />
                  <StatCard
                    title="Proposed Budget"
                    value={formatCurrency(result.total_cost.proposed)}
                    icon={Calculator}
                    trend="neutral"
                  />
                </div>

                {/* Project Shares Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Project Budget Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Shell ({formatPercent(result.shares.shell)})</span>
                            <span className="text-sm text-gray-500">{formatCurrency(result.minimum_budgets.shell)}</span>
                          </div>
                          <Progress value={result.shares.shell * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Interior ({formatPercent(result.shares.interior)})</span>
                            <span className="text-sm text-gray-500">{formatCurrency(result.minimum_budgets.interior)}</span>
                          </div>
                          <Progress value={result.shares.interior * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Landscape ({formatPercent(result.shares.landscape)})</span>
                            <span className="text-sm text-gray-500">{formatCurrency(result.minimum_budgets.landscape)}</span>
                          </div>
                          <Progress value={result.shares.landscape * 100} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold mb-3">Detailed Budget Breakdown</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Discipline</TableHead>
                              <TableHead className="text-right">Budget</TableHead>
                              <TableHead className="text-right">Share</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Architecture</TableCell>
                              <TableCell className="text-right">{formatCurrency(result.architecture_budget)}</TableCell>
                              <TableCell className="text-right">{formatPercent(result.design_shares.Architecture || 0)}</TableCell>
                            </TableRow>
                            {Object.entries(result.engineering_budgets)
                              .filter(([key]) => key !== 'sum' && key !== 'Architecture')
                              .map(([discipline, budget]) => (
                                <TableRow key={discipline}>
                                  <TableCell>{discipline}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                                  <TableCell className="text-right">{formatPercent(result.design_shares[discipline] || 0)}</TableCell>
                                </TableRow>
                              ))}
                            <TableRow>
                              <TableCell className="font-medium">Interior</TableCell>
                              <TableCell className="text-right">{formatCurrency(result.minimum_budgets.interior)}</TableCell>
                              <TableCell className="text-right">{formatPercent(result.design_shares.Interior || 0)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Landscape</TableCell>
                              <TableCell className="text-right">{formatCurrency(result.minimum_budgets.landscape)}</TableCell>
                              <TableCell className="text-right">{formatPercent(result.design_shares.Landscape || 0)}</TableCell>
                            </TableRow>
                            <TableRow className="border-t-2 font-semibold">
                              <TableCell>Working Budget</TableCell>
                              <TableCell className="text-right">{formatCurrency(result.working_budget)}</TableCell>
                              <TableCell className="text-right">100.0%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Engineering Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Engineering Disciplines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(result.engineering_budgets)
                        .filter(([key]) => key !== 'sum')
                        .map(([discipline, budget]) => (
                          <div key={discipline} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-medium">{discipline}</h4>
                              <span className="text-xs text-gray-500">
                                {formatPercent(result.design_shares[discipline] || 0)}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {formatCurrency(budget)}
                            </div>
                            <Progress 
                              value={(budget / result.total_cost.proposed) * 100} 
                              className="h-1 mt-2" 
                            />
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes & Warnings */}
                {result.notes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Notes & Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.notes.map((note, index) => (
                        <Alert key={index} className="mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{note}</AlertDescription>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {calculateBudget.isError && (
              <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Error calculating budget. Please check your inputs and try again.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {!result && !calculateBudget.isPending && (
              <>
                {/* Show Total Area even before calculation */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    title="Total Area"
                    value={`${totalArea.toLocaleString()} ft²`}
                    icon={Building}
                  />
                </div>
                
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Calculate</h3>
                    <p className="text-gray-500">
                      Select a building type and tier to start calculating your project budget.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-light-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Minimum Budget Calculator v1.0 - Real-time project budget analysis
            </div>
            <div className="text-xs text-gray-500">
              Calculations update automatically as you type
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}