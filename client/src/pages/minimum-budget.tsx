import React, { useState, useEffect } from 'react';
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
  const [expandedTableRows, setExpandedTableRows] = useState<Set<string>>(new Set());
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


  const toggleTableRow = (rowId: string) => {
    const newExpanded = new Set(expandedTableRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedTableRows(newExpanded);
  };

  const toggleDisciplineSelection = (discipline: string) => {
    const newSelected = new Set(selectedDisciplines);
    if (newSelected.has(discipline)) {
      newSelected.delete(discipline);
    } else {
      newSelected.add(discipline);
    }
    setSelectedDisciplines(newSelected);
  };

  const getSelectedBudgetTotal = () => {
    if (!result) return 0;
    let total = 0;
    
    if (selectedDisciplines.has('Architecture')) {
      total += result.architecture_budget;
    }
    
    Object.entries(result.engineering_budgets)
      .filter(([key]) => key !== 'sum' && selectedDisciplines.has(key))
      .forEach(([_, budget]) => {
        total += budget;
      });
    
    if (selectedDisciplines.has('Interior')) {
      total += result.minimum_budgets.interior;
    }
    
    if (selectedDisciplines.has('Landscape')) {
      total += result.minimum_budgets.landscape;
    }
    
    return total;
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


  return (
    <div className="bg-gray-50 font-inter text-dark-slate min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-light-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 py-3 sm:py-0">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 bg-scientific-blue rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-dark-slate">Minimum Budget Calculator</h1>
                <p className="text-xs sm:text-sm text-gray-500">Project budget calculation & analysis</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-4">
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                Live Calculation
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

                {/* Discipline Selection & Budget Breakdown */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Discipline Selection & Budget Breakdown
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Select disciplines and view detailed budget allocation
                        </CardDescription>
                      </div>
                      {selectedDisciplines.size > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Selected Budget</div>
                          <div className="text-lg font-bold text-scientific-blue">
                            {formatCurrency(getSelectedBudgetTotal())}
                          </div>
                          <div className="text-xs text-gray-500">
                            {selectedDisciplines.size} discipline{selectedDisciplines.size !== 1 ? 's' : ''} selected
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead>Discipline</TableHead>
                              <TableHead className="text-right">Budget</TableHead>
                              <TableHead className="text-right">Share</TableHead>
                              <TableHead className="w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Architecture */}
                            <TableRow className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedDisciplines.has('Architecture') ? 'bg-blue-50 border-l-4 border-l-scientific-blue' : ''
                            }`}>
                              <TableCell className="w-8">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDisciplineSelection('Architecture');
                                  }}
                                >
                                  {selectedDisciplines.has('Architecture') ? '✓' : '+'}
                                </Button>
                              </TableCell>
                              <TableCell 
                                className="font-medium cursor-pointer" 
                                onClick={() => toggleTableRow('architecture')}
                              >
                                Architecture
                                {selectedDisciplines.has('Architecture') && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Selected</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(result.architecture_budget)}</TableCell>
                              <TableCell className="text-right">{formatPercent(result.design_shares.Architecture || 0)}</TableCell>
                              <TableCell className="text-center cursor-pointer" onClick={() => toggleTableRow('architecture')}>
                                {expandedTableRows.has('architecture') ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </TableCell>
                            </TableRow>
                            {expandedTableRows.has('architecture') && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={5} className="py-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                      <span className="font-medium">{formatCurrency(result.discipline_breakdown.architecture.new_construction)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)})</span>
                                      <span className="font-medium">{formatCurrency(result.discipline_breakdown.architecture.existing_remodel)}</span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}

                            {/* Engineering Disciplines */}
                            {Object.entries(result.engineering_budgets)
                              .filter(([key]) => key !== 'sum' && key !== 'Architecture')
                              .map(([discipline, budget]) => {
                                const disciplineKey = discipline.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                const breakdown = result.discipline_breakdown[disciplineKey];
                                const rowId = `eng_${disciplineKey}`;
                                return (
                                  <React.Fragment key={discipline}>
                                    <TableRow className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                                      selectedDisciplines.has(discipline) ? 'bg-blue-50 border-l-4 border-l-scientific-blue' : ''
                                    }`}>
                                      <TableCell className="w-8">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="p-1 h-6 w-6"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDisciplineSelection(discipline);
                                          }}
                                        >
                                          {selectedDisciplines.has(discipline) ? '\u2713' : '+'}
                                        </Button>
                                      </TableCell>
                                      <TableCell 
                                        className="cursor-pointer" 
                                        onClick={() => toggleTableRow(rowId)}
                                      >
                                        {discipline}
                                        {selectedDisciplines.has(discipline) && (
                                          <Badge variant="secondary" className="ml-2 text-xs">Selected</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                                      <TableCell className="text-right">{formatPercent(result.design_shares[discipline] || 0)}</TableCell>
                                      <TableCell className="text-center cursor-pointer" onClick={() => toggleTableRow(rowId)}>
                                        {expandedTableRows.has(rowId) ? 
                                          <ChevronUp className="h-4 w-4" /> : 
                                          <ChevronDown className="h-4 w-4" />
                                        }
                                      </TableCell>
                                    </TableRow>
                                    {expandedTableRows.has(rowId) && breakdown && (
                                      <TableRow className="bg-gray-50">
                                        <TableCell colSpan={5} className="py-3">
                                          <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-gray-600">New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                              <span className="font-medium">{formatCurrency(breakdown.new_construction)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-gray-600">Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)}) - 50% rate</span>
                                              <span className="font-medium">{formatCurrency(breakdown.existing_remodel)}</span>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </React.Fragment>
                                );
                              })}

                            {/* Interior */}
                            <TableRow className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedDisciplines.has('Interior') ? 'bg-blue-50 border-l-4 border-l-scientific-blue' : ''
                            }`}>
                              <TableCell className="w-8">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDisciplineSelection('Interior');
                                  }}
                                >
                                  {selectedDisciplines.has('Interior') ? '\u2713' : '+'}
                                </Button>
                              </TableCell>
                              <TableCell 
                                className="font-medium cursor-pointer" 
                                onClick={() => toggleTableRow('interior')}
                              >
                                Interior
                                {selectedDisciplines.has('Interior') && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Selected</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(result.minimum_budgets.interior)}</TableCell>
                              <TableCell className="text-right">{formatPercent(result.design_shares.Interior || 0)}</TableCell>
                              <TableCell className="text-center cursor-pointer" onClick={() => toggleTableRow('interior')}>
                                {expandedTableRows.has('interior') ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </TableCell>
                            </TableRow>
                            {expandedTableRows.has('interior') && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={5} className="py-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                      <span className="font-medium">{formatCurrency(result.discipline_breakdown.interior.new_construction)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)})</span>
                                      <span className="font-medium">{formatCurrency(result.discipline_breakdown.interior.existing_remodel)}</span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}

                            {/* Landscape */}
                            <TableRow className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedDisciplines.has('Landscape') ? 'bg-blue-50 border-l-4 border-l-scientific-blue' : ''
                            }`}>
                              <TableCell className="w-8">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDisciplineSelection('Landscape');
                                  }}
                                >
                                  {selectedDisciplines.has('Landscape') ? '\u2713' : '+'}
                                </Button>
                              </TableCell>
                              <TableCell 
                                className="font-medium cursor-pointer" 
                                onClick={() => toggleTableRow('landscape')}
                              >
                                Landscape
                                {selectedDisciplines.has('Landscape') && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Selected</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(result.minimum_budgets.landscape)}</TableCell>
                              <TableCell className="text-right">{formatPercent(result.design_shares.Landscape || 0)}</TableCell>
                              <TableCell className="text-center cursor-pointer" onClick={() => toggleTableRow('landscape')}>
                                {expandedTableRows.has('landscape') ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </TableCell>
                            </TableRow>
                            {expandedTableRows.has('landscape') && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={5} className="py-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">New Construction ({formatPercent(result.construction_ratios.new_construction)})</span>
                                      <span className="font-medium">{formatCurrency(result.discipline_breakdown.landscape.new_construction)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Existing Remodel ({formatPercent(result.construction_ratios.existing_remodel)})</span>
                                      <span className="font-medium">{formatCurrency(result.discipline_breakdown.landscape.existing_remodel)}</span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}

                            <TableRow className="border-t-2 font-semibold">
                              <TableCell>Working Budget</TableCell>
                              <TableCell className="text-right">{formatCurrency(result.working_budget)}</TableCell>
                              <TableCell className="text-right">100.0%</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
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