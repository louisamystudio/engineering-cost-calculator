import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Building, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  FileText,
  Download,
  Edit,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import type { BudgetCalculationResult, FeeMatrixResult } from '@shared/schema';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(hours);
}

export default function ProjectDashboard() {
  const [budgetResult, setBudgetResult] = useState<BudgetCalculationResult | null>(null);
  const [feeResult, setFeeResult] = useState<FeeMatrixResult | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    // Load saved data
    const savedBudgetResult = localStorage.getItem('budgetResult');
    const savedFeeResult = localStorage.getItem('feeMatrixResult');
    const savedProjectName = localStorage.getItem('projectName') || 'Untitled Project';

    if (savedBudgetResult) {
      try {
        setBudgetResult(JSON.parse(savedBudgetResult));
      } catch (error) {
        console.error('Failed to parse budget result:', error);
      }
    }

    if (savedFeeResult) {
      try {
        setFeeResult(JSON.parse(savedFeeResult));
      } catch (error) {
        console.error('Failed to parse fee result:', error);
      }
    }

    setProjectName(savedProjectName);
  }, []);

  const updateProjectName = (name: string) => {
    setProjectName(name);
    localStorage.setItem('projectName', name);
  };

  const exportCompleteReport = () => {
    if (!budgetResult || !feeResult) return;

    const reportData = {
      project: {
        name: projectName,
        building_type: budgetResult.inputs.building_type,
        tier: budgetResult.inputs.tier,
        total_area: budgetResult.area.total_sf,
        new_area: budgetResult.inputs.new_area_ft2,
        existing_area: budgetResult.inputs.existing_area_ft2,
        site_area: budgetResult.inputs.site_area_m2
      },
      budget_summary: {
        total_construction_cost: budgetResult.total_cost.proposed,
        shell_budget: budgetResult.minimum_budgets.shell,
        interior_budget: budgetResult.minimum_budgets.interior,
        landscape_budget: budgetResult.minimum_budgets.landscape,
        architecture_budget: budgetResult.architecture_budget,
        engineering_total: budgetResult.engineering_budgets.sum
      },
      fee_summary: {
        market_fee: feeResult.totals.market_fee,
        consultant_fees: feeResult.totals.consultant_total,
        internal_fees: feeResult.totals.discounted_total,
        overall_percentage: feeResult.totals.overall_percentage,
        rate_per_sf: feeResult.totals.rate_per_ft2,
        total_hours: feeResult.totals.total_hours
      }
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/[^a-z0-9]/gi, '_')}_complete_report.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all project data? This action cannot be undone.')) {
      localStorage.removeItem('budgetResult');
      localStorage.removeItem('feeMatrixResult');
      localStorage.removeItem('projectName');
      setBudgetResult(null);
      setFeeResult(null);
      setProjectName('Untitled Project');
    }
  };

  const completionPercentage = () => {
    let completed = 0;
    if (budgetResult) completed += 50;
    if (feeResult) completed += 50;
    return completed;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, variant = 'default', onClick }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    variant?: 'default' | 'success' | 'warning';
    onClick?: () => void;
  }) => (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        variant === 'success' ? 'border-green-200 bg-green-50' : 
        variant === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
        {onClick && (
          <div className="text-xs text-blue-600 mt-1 flex items-center">
            View Details <ArrowRight className="h-3 w-3 ml-1" />
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
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => updateProjectName(e.target.value)}
                  className="text-lg sm:text-xl font-semibold text-dark-slate bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 focus:rounded px-2"
                  placeholder="Enter project name..."
                />
                <p className="text-xs sm:text-sm text-gray-500">Project Analysis Dashboard</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-4">
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                {completionPercentage()}% Complete
              </Badge>
              {budgetResult && feeResult && (
                <Button
                  onClick={exportCompleteReport}
                  className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-scientific-blue hover:bg-blue-600"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Export Report</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Project Progress
            </CardTitle>
            <CardDescription>
              Complete both budget and fee calculations for full project analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{completionPercentage()}%</span>
              </div>
              <Progress value={completionPercentage()} className="h-2" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  budgetResult ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    budgetResult ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {budgetResult ? <CheckCircle2 className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Budget Analysis</div>
                    <div className="text-xs text-gray-600">
                      {budgetResult ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={budgetResult ? "outline" : "default"}
                    onClick={() => window.location.href = '/minimum-budget'}
                  >
                    {budgetResult ? <Edit className="h-3 w-3" /> : 'Start'}
                  </Button>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  feeResult ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    feeResult ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {feeResult ? <CheckCircle2 className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Fee Calculation</div>
                    <div className="text-xs text-gray-600">
                      {feeResult ? 'Completed' : budgetResult ? 'Ready' : 'Requires Budget'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={feeResult ? "outline" : "default"}
                    disabled={!budgetResult}
                    onClick={() => window.location.href = '/fee-matrix'}
                  >
                    {feeResult ? <Edit className="h-3 w-3" /> : 'Start'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {(!budgetResult || !feeResult) && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {!budgetResult && !feeResult && "Start by completing the Budget Analysis to begin your project evaluation."}
              {budgetResult && !feeResult && "Great! Your budget is complete. Now calculate professional fees to finish the analysis."}
            </AlertDescription>
          </Alert>
        )}

        {budgetResult && feeResult && (
          <>
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <StatCard
                title="Total Project Cost"
                value={formatCurrency(budgetResult.total_cost.proposed)}
                subtitle={`${budgetResult.area.total_sf.toLocaleString()} SF`}
                icon={Building}
                onClick={() => window.location.href = '/minimum-budget'}
              />
              <StatCard
                title="Professional Fees"
                value={formatCurrency(feeResult.totals.market_fee)}
                subtitle={`${formatPercent(feeResult.totals.overall_percentage)}`}
                icon={DollarSign}
                variant="success"
                onClick={() => window.location.href = '/fee-matrix'}
              />
              <StatCard
                title="Design Hours"
                value={formatHours(feeResult.totals.total_hours)}
                subtitle={`$${feeResult.inputs.average_billable_rate}/hr avg`}
                icon={Clock}
                onClick={() => window.location.href = '/fee-matrix'}
              />
              <StatCard
                title="Rate per SF"
                value={`$${feeResult.totals.rate_per_ft2.toFixed(0)}`}
                subtitle="Professional fees"
                icon={TrendingUp}
                onClick={() => window.location.href = '/fee-matrix'}
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Budget Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Construction Budget
                  </CardTitle>
                  <CardDescription>
                    Breakdown by project component
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Shell & Architecture</span>
                      <span className="font-medium">{formatCurrency(budgetResult.architecture_budget)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Interior Design</span>
                      <span className="font-medium">{formatCurrency(budgetResult.minimum_budgets.interior)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Landscape</span>
                      <span className="font-medium">{formatCurrency(budgetResult.minimum_budgets.landscape)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Engineering</span>
                      <span className="font-medium">{formatCurrency(budgetResult.engineering_budgets.sum)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Construction</span>
                      <span>{formatCurrency(budgetResult.total_cost.proposed)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Professional Fees
                  </CardTitle>
                  <CardDescription>
                    Internal vs consultant breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Internal Services</span>
                      <span className="font-medium">{formatCurrency(feeResult.totals.discounted_total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">External Consultants</span>
                      <span className="font-medium">{formatCurrency(feeResult.totals.consultant_total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Hours</span>
                      <span className="font-medium">{formatHours(feeResult.totals.total_hours)} hrs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Complexity Factor</span>
                      <span className="font-medium">{(feeResult.inputs.complexity_multiplier * 100).toFixed(0)}%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Fees</span>
                      <span>{formatCurrency(feeResult.totals.market_fee)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = '/hourly-factor'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Hourly Factor Calculator
              </Button>
              <Button
                onClick={() => window.location.href = '/minimum-budget'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Modify Budget
              </Button>
              <Button
                onClick={() => window.location.href = '/fee-matrix'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Adjust Fees
              </Button>
              <Button
                onClick={clearAllData}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}