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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TrendingUp, TrendingDown, Calculator, Building, DollarSign, PieChart, BarChart3, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
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
    if (tiersData?.tiers && tiersData.tiers.length > 0 && !tiersData.tiers.includes(formData.tier)) {
      setFormData(prev => ({ ...prev, tier: tiersData.tiers[0] }));
    }
  }, [tiersData, formData.tier]);

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

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

  const DisciplineCard = ({ 
    title, 
    budget, 
    share, 
    breakdown, 
    isSelected, 
    onToggleSelection, 
    cardId 
  }: {
    title: string;
    budget: number;
    share: number;
    breakdown: { total: number; new_construction: number; existing_remodel: number };
    isSelected: boolean;
    onToggleSelection: () => void;
    cardId: string;
  }) => {
    const isExpanded = expandedCards.has(cardId);
    
    return (
      <Collapsible>
        <Card className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected 
            ? 'border-scientific-blue bg-blue-50 ring-2 ring-blue-200' 
            : 'border-gray-200 hover:border-gray-300'
        }`}>
          <CollapsibleTrigger asChild>
            <div className="p-4" onClick={() => toggleCardExpansion(cardId)}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">{title}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection();
                    }}
                  >
                    {isSelected ? '✓' : '+'}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatPercent(share)}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(budget)}
              </div>
              <Progress 
                value={(budget / (result?.total_cost.proposed || 1)) * 100} 
                className="h-1 mt-2" 
              />
              {isSelected && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  ✓ Selected
                </div>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-3 space-y-2">
                <div className="text-xs font-semibold text-gray-700 mb-2">Project Breakdown:</div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">New Construction ({formatPercent(result?.construction_ratios.new_construction || 0)})</span>
                  <span className="text-xs font-medium">{formatCurrency(breakdown.new_construction)}</span>
                </div>
                <Progress value={(breakdown.new_construction / budget) * 100} className="h-1" />
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-600">Existing Remodel ({formatPercent(result?.construction_ratios.existing_remodel || 0)})</span>
                  <span className="text-xs font-medium">{formatCurrency(breakdown.existing_remodel)}</span>
                </div>
                <Progress value={(breakdown.existing_remodel / budget) * 100} className="h-1" />
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

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
                    title="Budget Range"
                    value={`${formatCurrency(result.total_cost.low)} - ${formatCurrency(result.total_cost.high)}`}
                    icon={TrendingUp}
                  />
                  <StatCard
                    title="Minimum Budget"
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
                        <h4 className="text-sm font-semibold mb-3">Minimum Budget Breakdown</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Discipline</TableHead>
                              <TableHead className="text-right">Budget</TableHead>
                              <TableHead className="text-right">Share</TableHead>
                              <TableHead className="w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Architecture */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <TableRow className="cursor-pointer hover:bg-gray-50">
                                  <TableCell className="font-medium">Architecture</TableCell>
                                  <TableCell className="text-right">{formatCurrency(result.architecture_budget)}</TableCell>
                                  <TableCell className="text-right">{formatPercent(result.design_shares.Architecture || 0)}</TableCell>
                                  <TableCell className="text-center">
                                    <ChevronDown className="h-4 w-4" />
                                  </TableCell>
                                </TableRow>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <TableRow className="bg-gray-50">
                                  <TableCell colSpan={4} className="p-0">
                                    <div className="px-4 py-2 space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span>New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                        <span>{formatCurrency(result.discipline_breakdown.architecture.new_construction)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)})</span>
                                        <span>{formatCurrency(result.discipline_breakdown.architecture.existing_remodel)}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Engineering Disciplines */}
                            {Object.entries(result.engineering_budgets)
                              .filter(([key]) => key !== 'sum' && key !== 'Architecture')
                              .map(([discipline, budget]) => {
                                const disciplineKey = discipline.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                const breakdown = result.discipline_breakdown[disciplineKey];
                                return (
                                  <Collapsible key={discipline}>
                                    <CollapsibleTrigger asChild>
                                      <TableRow className="cursor-pointer hover:bg-gray-50">
                                        <TableCell>{discipline}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                                        <TableCell className="text-right">{formatPercent(result.design_shares[discipline] || 0)}</TableCell>
                                        <TableCell className="text-center">
                                          <ChevronDown className="h-4 w-4" />
                                        </TableCell>
                                      </TableRow>
                                    </CollapsibleTrigger>
                                    {breakdown && (
                                      <CollapsibleContent asChild>
                                        <TableRow className="bg-gray-50">
                                          <TableCell colSpan={4} className="p-0">
                                            <div className="px-4 py-2 space-y-1">
                                              <div className="flex justify-between text-xs">
                                                <span>New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                                <span>{formatCurrency(breakdown.new_construction)}</span>
                                              </div>
                                              <div className="flex justify-between text-xs">
                                                <span>Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)}) - 50% rate</span>
                                                <span>{formatCurrency(breakdown.existing_remodel)}</span>
                                              </div>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      </CollapsibleContent>
                                    )}
                                  </Collapsible>
                                );
                              })}

                            {/* Interior */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <TableRow className="cursor-pointer hover:bg-gray-50">
                                  <TableCell className="font-medium">Interior</TableCell>
                                  <TableCell className="text-right">{formatCurrency(result.minimum_budgets.interior)}</TableCell>
                                  <TableCell className="text-right">{formatPercent(result.design_shares.Interior || 0)}</TableCell>
                                  <TableCell className="text-center">
                                    <ChevronDown className="h-4 w-4" />
                                  </TableCell>
                                </TableRow>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <TableRow className="bg-gray-50">
                                  <TableCell colSpan={4} className="p-0">
                                    <div className="px-4 py-2 space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span>New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                        <span>{formatCurrency(result.discipline_breakdown.interior.new_construction)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)})</span>
                                        <span>{formatCurrency(result.discipline_breakdown.interior.existing_remodel)}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Landscape */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <TableRow className="cursor-pointer hover:bg-gray-50">
                                  <TableCell className="font-medium">Landscape</TableCell>
                                  <TableCell className="text-right">{formatCurrency(result.minimum_budgets.landscape)}</TableCell>
                                  <TableCell className="text-right">{formatPercent(result.design_shares.Landscape || 0)}</TableCell>
                                  <TableCell className="text-center">
                                    <ChevronDown className="h-4 w-4" />
                                  </TableCell>
                                </TableRow>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <TableRow className="bg-gray-50">
                                  <TableCell colSpan={4} className="p-0">
                                    <div className="px-4 py-2 space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span>New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                        <span>{formatCurrency(result.discipline_breakdown.landscape.new_construction)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)})</span>
                                        <span>{formatCurrency(result.discipline_breakdown.landscape.existing_remodel)}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                            </Collapsible>

                            <TableRow className="border-t-2 font-semibold">
                              <TableCell>Working Budget</TableCell>
                              <TableCell className="text-right">{formatCurrency(result.working_budget)}</TableCell>
                              <TableCell className="text-right">100.0%</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Design Discipline Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Design Discipline Selection
                    </CardTitle>
                    <CardDescription>
                      Click + to select disciplines, expand cards to see breakdown details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Architecture */}
                      <DisciplineCard
                        title="Architecture"
                        budget={result.architecture_budget}
                        share={result.design_shares.Architecture || 0}
                        breakdown={result.discipline_breakdown.architecture}
                        isSelected={selectedDisciplines.has('Architecture')}
                        onToggleSelection={() => {
                          const newSelected = new Set(selectedDisciplines);
                          if (newSelected.has('Architecture')) {
                            newSelected.delete('Architecture');
                          } else {
                            newSelected.add('Architecture');
                          }
                          setSelectedDisciplines(newSelected);
                        }}
                        cardId="architecture"
                      />
                      
                      {/* Engineering Disciplines */}
                      {Object.entries(result.engineering_budgets)
                        .filter(([key]) => key !== 'sum')
                        .map(([discipline, budget]) => {
                          const disciplineKey = discipline.toLowerCase().replace(/[^a-z0-9]/g, '_');
                          const breakdown = result.discipline_breakdown[disciplineKey] || { total: budget, new_construction: 0, existing_remodel: 0 };
                          return (
                            <DisciplineCard
                              key={discipline}
                              title={discipline}
                              budget={budget}
                              share={result.design_shares[discipline] || 0}
                              breakdown={breakdown}
                              isSelected={selectedDisciplines.has(discipline)}
                              onToggleSelection={() => {
                                const newSelected = new Set(selectedDisciplines);
                                if (newSelected.has(discipline)) {
                                  newSelected.delete(discipline);
                                } else {
                                  newSelected.add(discipline);
                                }
                                setSelectedDisciplines(newSelected);
                              }}
                              cardId={disciplineKey}
                            />
                          );
                        })}
                      
                      {/* Interior */}
                      <DisciplineCard
                        title="Interior"
                        budget={result.minimum_budgets.interior}
                        share={result.design_shares.Interior || 0}
                        breakdown={result.discipline_breakdown.interior}
                        isSelected={selectedDisciplines.has('Interior')}
                        onToggleSelection={() => {
                          const newSelected = new Set(selectedDisciplines);
                          if (newSelected.has('Interior')) {
                            newSelected.delete('Interior');
                          } else {
                            newSelected.add('Interior');
                          }
                          setSelectedDisciplines(newSelected);
                        }}
                        cardId="interior"
                      />
                      
                      {/* Landscape */}
                      <DisciplineCard
                        title="Landscape"
                        budget={result.minimum_budgets.landscape}
                        share={result.design_shares.Landscape || 0}
                        breakdown={result.discipline_breakdown.landscape}
                        isSelected={selectedDisciplines.has('Landscape')}
                        onToggleSelection={() => {
                          const newSelected = new Set(selectedDisciplines);
                          if (newSelected.has('Landscape')) {
                            newSelected.delete('Landscape');
                          } else {
                            newSelected.add('Landscape');
                          }
                          setSelectedDisciplines(newSelected);
                        }}
                        cardId="landscape"
                      />
                    </div>
                    
                    {selectedDisciplines.size > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                          Selected Disciplines ({selectedDisciplines.size})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(selectedDisciplines).map(discipline => (
                            <Badge key={discipline} className="bg-blue-100 text-blue-800 border-blue-300">
                              {discipline}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-3 text-sm text-blue-700">
                          <strong>New Construction:</strong> {formatPercent(result.construction_ratios.new_construction)} • 
                          <strong>Existing Remodel:</strong> {formatPercent(result.construction_ratios.existing_remodel)}
                        </div>
                      </div>
                    )}
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