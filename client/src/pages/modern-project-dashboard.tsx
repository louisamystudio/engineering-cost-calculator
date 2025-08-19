import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Building, 
  Calculator, 
  DollarSign, 
  Clock, 
  Loader2, 
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  Users,
  Home,
  Target,
  Zap,
  Activity,
  Info,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import type { Project, ProjectCalculation, ProjectFee, ProjectHours } from "@shared/schema";

interface ProjectData {
  project: Project;
  calculations: ProjectCalculation;
  fees: ProjectFee[];
  hours: ProjectHours[];
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(value: string | number, decimals = 0): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${(num * 100).toFixed(1)}%`;
}

export default function ModernProjectDashboard() {
  const params = useParams();
  const [, navigate] = useLocation();
  const projectId = params.id as string;
  
  // Interactive parameter states
  const [newBuildingArea, setNewBuildingArea] = useState(0);
  const [existingBuildingArea, setExistingBuildingArea] = useState(0);
  const [siteArea, setSiteArea] = useState(0);
  const [remodelMultiplier, setRemodelMultiplier] = useState(0.5);
  const [isHistoric, setIsHistoric] = useState(false);
  const [autoRecalc, setAutoRecalc] = useState(true);
  
  // Cost target states
  const [newConstructionTarget, setNewConstructionTarget] = useState<number | undefined>();
  const [remodelTarget, setRemodelTarget] = useState<number | undefined>();
  
  // Engineering percentage overrides
  const [telecomPercentage, setTelecomPercentage] = useState<number | undefined>();
  const [structuralPercentage, setStructuralPercentage] = useState<number | undefined>();
  const [civilPercentage, setCivilPercentage] = useState<number | undefined>();
  const [mechanicalPercentage, setMechanicalPercentage] = useState<number | undefined>();
  const [electricalPercentage, setElectricalPercentage] = useState<number | undefined>();
  const [plumbingPercentage, setPlumbingPercentage] = useState<number | undefined>();
  
  // Labor and pricing overrides
  const [laborRate, setLaborRate] = useState<number | undefined>();
  const [overheadRate, setOverheadRate] = useState<number | undefined>();
  const [markupFactor, setMarkupFactor] = useState<number | undefined>();
  
  // Fee adjustments
  const [architectureFeeAdj, setArchitectureFeeAdj] = useState<number>(1.0);
  const [interiorFeeAdj, setInteriorFeeAdj] = useState<number>(1.0);
  const [landscapeFeeAdj, setLandscapeFeeAdj] = useState<number>(1.0);
  const [structuralFeeAdj, setStructuralFeeAdj] = useState<number>(1.0);
  const [civilFeeAdj, setCivilFeeAdj] = useState<number>(1.0);
  const [mechanicalFeeAdj, setMechanicalFeeAdj] = useState<number>(1.0);
  const [electricalFeeAdj, setElectricalFeeAdj] = useState<number>(1.0);
  const [plumbingFeeAdj, setPlumbingFeeAdj] = useState<number>(1.0);
  const [telecomFeeAdj, setTelecomFeeAdj] = useState<number>(1.0);
  
  // UI state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const { data, isLoading, error } = useQuery<ProjectData>({
    queryKey: ['/api/projects', projectId],
  });

  const recalculateMutation = useMutation({
    mutationFn: async (params?: any) => {
      if (!data?.project) return;
      
      const input = {
        projectName: data.project.projectName,
        buildingUse: data.project.buildingUse,
        buildingType: data.project.buildingType,
        buildingTier: data.project.buildingTier,
        designLevel: data.project.designLevel,
        category: data.project.category,
        newBuildingArea: params?.newBuildingArea ?? newBuildingArea,
        existingBuildingArea: params?.existingBuildingArea ?? existingBuildingArea,
        siteArea: params?.siteArea ?? siteArea,
        historicMultiplier: isHistoric ? 1.2 : 1.0,
        remodelMultiplier: params?.remodelMultiplier ?? remodelMultiplier,
        newConstructionTargetCost: newConstructionTarget ?? (data.project.newConstructionTargetCost ? parseFloat(data.project.newConstructionTargetCost) : undefined),
        remodelTargetCost: remodelTarget ?? (data.project.remodelTargetCost ? parseFloat(data.project.remodelTargetCost) : undefined),
        shellShareOverride: data.project.shellShareOverride ? parseFloat(data.project.shellShareOverride) : undefined,
        interiorShareOverride: data.project.interiorShareOverride ? parseFloat(data.project.interiorShareOverride) : undefined,
        landscapeShareOverride: data.project.landscapeShareOverride ? parseFloat(data.project.landscapeShareOverride) : undefined,
        // Engineering percentage overrides
        telecomPercentageOverride: telecomPercentage,
        structuralPercentageOverride: structuralPercentage,
        civilPercentageOverride: civilPercentage,
        mechanicalPercentageOverride: mechanicalPercentage,
        electricalPercentageOverride: electricalPercentage,
        plumbingPercentageOverride: plumbingPercentage,
        // Labor and pricing overrides
        laborRateOverride: laborRate,
        overheadRateOverride: overheadRate,
        markupFactorOverride: markupFactor,
        // Fee adjustments
        architectureFeeAdjustment: architectureFeeAdj !== 1.0 ? architectureFeeAdj : undefined,
        interiorFeeAdjustment: interiorFeeAdj !== 1.0 ? interiorFeeAdj : undefined,
        landscapeFeeAdjustment: landscapeFeeAdj !== 1.0 ? landscapeFeeAdj : undefined,
        structuralFeeAdjustment: structuralFeeAdj !== 1.0 ? structuralFeeAdj : undefined,
        civilFeeAdjustment: civilFeeAdj !== 1.0 ? civilFeeAdj : undefined,
        mechanicalFeeAdjustment: mechanicalFeeAdj !== 1.0 ? mechanicalFeeAdj : undefined,
        electricalFeeAdjustment: electricalFeeAdj !== 1.0 ? electricalFeeAdj : undefined,
        plumbingFeeAdjustment: plumbingFeeAdj !== 1.0 ? plumbingFeeAdj : undefined,
        telecomFeeAdjustment: telecomFeeAdj !== 1.0 ? telecomFeeAdj : undefined,
      };
      
      const response = await apiRequest('POST', '/api/projects/calculate', input);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
  });

  // Initialize states when data loads
  useEffect(() => {
    if (data?.project) {
      setNewBuildingArea(parseFloat(data.project.newBuildingArea));
      setExistingBuildingArea(parseFloat(data.project.existingBuildingArea));
      setSiteArea(parseFloat(data.project.siteArea));
      setRemodelMultiplier(parseFloat(data.project.remodelMultiplier));
      setIsHistoric(parseFloat(data.project.historicMultiplier) > 1.0);
    }
  }, [data]);

  // Auto-recalculate when parameters change
  useEffect(() => {
    if (autoRecalc && data?.project) {
      const timeoutId = setTimeout(() => {
        recalculateMutation.mutate(undefined);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [
    newBuildingArea, existingBuildingArea, siteArea, remodelMultiplier, isHistoric, 
    newConstructionTarget, remodelTarget,
    telecomPercentage, structuralPercentage, civilPercentage, mechanicalPercentage, electricalPercentage, plumbingPercentage,
    laborRate, overheadRate, markupFactor,
    architectureFeeAdj, interiorFeeAdj, landscapeFeeAdj, structuralFeeAdj, civilFeeAdj, mechanicalFeeAdj, electricalFeeAdj, plumbingFeeAdj, telecomFeeAdj,
    autoRecalc
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-muted-foreground">Loading project data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto p-6">
          <Card className="text-center py-12 border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardContent>
              <Building className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Project not found</h3>
              <p className="text-muted-foreground mb-4">
                The project you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate("/projects")} className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { project, calculations, fees, hours } = data;

  // Calculate totals
  const totalMarketFee = fees.reduce((sum, f) => sum + parseFloat(f.marketFee), 0);
  const totalLouisAmyFee = fees.reduce((sum, f) => sum + parseFloat(f.louisAmyFee), 0);
  const totalCoordinationFee = fees.reduce((sum, f) => sum + parseFloat(f.coordinationFee || '0'), 0);
  const totalConsultantFee = fees.reduce((sum, f) => sum + parseFloat(f.consultantFee || '0'), 0);
  const totalHours = fees.reduce((sum, f) => sum + parseFloat(f.hours || '0'), 0);

  const inhouseFees = fees.filter(f => f.isInhouse);
  const outsourcedFees = fees.filter(f => !f.isInhouse);

  // Chart data
  const budgetChartData = [
    {
      name: 'New Construction',
      value: parseFloat(calculations.newBudget),
      color: '#3b82f6'
    },
    {
      name: 'Remodel',
      value: parseFloat(calculations.remodelBudget),
      color: '#10b981'
    }
  ];

  const feeBreakdownData = [
    { name: 'Market Fee', value: totalMarketFee, color: '#8b5cf6' },
    { name: 'Louis Amy Fee', value: totalLouisAmyFee, color: '#f59e0b' },
    { name: 'Coordination', value: totalCoordinationFee, color: '#ef4444' },
    { name: 'Consultant', value: totalConsultantFee, color: '#06b6d4' }
  ];

  const costPerSqFtData = [
    {
      category: 'New Construction',
      minimum: parseFloat(calculations.newCostMin),
      target: parseFloat(calculations.newCostTarget),
      maximum: parseFloat(calculations.newCostMax)
    },
    {
      category: 'Remodel',
      minimum: parseFloat(calculations.remodelCostMin),
      target: parseFloat(calculations.remodelCostTarget),
      maximum: parseFloat(calculations.remodelCostMax)
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/projects")} className="hover:bg-white/60">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {project.projectName}
                  {project.isDemo && (
                    <Badge className="ml-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">Demo</Badge>
                  )}
                </h1>
                <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {project.buildingUse}
                  </span>
                  <span>•</span>
                  <span>{project.buildingType}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {project.buildingTier}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Switch 
                  checked={autoRecalc} 
                  onCheckedChange={setAutoRecalc}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label className="text-xs font-medium">Auto-recalc</Label>
              </div>
              <Button 
                onClick={() => recalculateMutation.mutate(undefined)} 
                disabled={recalculateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              >
                {recalculateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Recalculate
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        {/* Key Metrics Hero Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-100">Total Budget</CardTitle>
                <DollarSign className="h-5 w-5 text-blue-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(calculations.totalBudget)}</div>
              <div className="text-xs text-blue-200 mt-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                New: {formatCurrency(calculations.newBudget)} | Remodel: {formatCurrency(calculations.remodelBudget)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-100">Market Fee</CardTitle>
                <BarChart3 className="h-5 w-5 text-emerald-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalMarketFee)}</div>
              <div className="text-xs text-emerald-200 mt-2 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                {formatPercent(totalMarketFee / parseFloat(calculations.totalBudget))} of budget
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-pink-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-orange-100">Louis Amy Fee</CardTitle>
                <Home className="h-5 w-5 text-orange-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalLouisAmyFee)}</div>
              <div className="text-xs text-orange-200 mt-2 flex items-center gap-2">
                <Zap className="h-3 w-3" />
                In-house services only
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-100">Total Hours</CardTitle>
                <Clock className="h-5 w-5 text-purple-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(totalHours, 0)}</div>
              <div className="text-xs text-purple-200 mt-2 flex items-center gap-2">
                <Users className="h-3 w-3" />
                Louis Amy team hours
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shell, Interior, and Landscape Budget Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-cyan-600" />
                  Shell Budget
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {((parseFloat(calculations.shellBudgetTotal) / parseFloat(calculations.totalBudget)) * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                {formatCurrency(calculations.shellBudgetTotal)}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">New Construction</span>
                  <span className="font-medium">{formatCurrency(parseFloat(calculations.newBudget) * 0.66)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Remodel</span>
                  <span className="font-medium">{formatCurrency(parseFloat(calculations.remodelBudget) * 0.66)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Home className="h-4 w-4 text-amber-600" />
                  Interior Budget
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {((parseFloat(calculations.interiorBudgetTotal) / parseFloat(calculations.totalBudget)) * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {formatCurrency(calculations.interiorBudgetTotal)}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">New Construction</span>
                  <span className="font-medium">{formatCurrency(parseFloat(calculations.newBudget) * 0.22)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Remodel</span>
                  <span className="font-medium">{formatCurrency(parseFloat(calculations.remodelBudget) * 0.22)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-green-600" />
                  Landscape Budget
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {((parseFloat(calculations.landscapeBudgetTotal) / parseFloat(calculations.totalBudget)) * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(calculations.landscapeBudgetTotal)}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">New Construction</span>
                  <span className="font-medium">{formatCurrency(parseFloat(calculations.newBudget) * 0.12)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Remodel</span>
                  <span className="font-medium">{formatCurrency(parseFloat(calculations.remodelBudget) * 0.12)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engineering Discipline Budgets */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Settings className="h-5 w-5 text-indigo-600" />
              Engineering Discipline Budgets
            </CardTitle>
            <CardDescription>Detailed budget allocation by engineering discipline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Architecture */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Architecture</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatPercent(parseFloat(calculations.architectureBudget) / parseFloat(calculations.shellBudgetTotal))}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-violet-700 dark:text-violet-400">
                  {formatCurrency(calculations.architectureBudget)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Design + Consultant Admin</div>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">New</p>
                    <p className="text-xs font-medium">{formatCurrency(parseFloat(calculations.architectureBudget) * (newBuildingArea / (newBuildingArea + existingBuildingArea)))}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Remodel (50%)</p>
                    <p className="text-xs font-medium">{formatCurrency(parseFloat(calculations.architectureBudget) * (existingBuildingArea / (newBuildingArea + existingBuildingArea)))}</p>
                  </div>
                </div>
              </div>

              {/* Structural */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Structural</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatPercent(parseFloat(calculations.structuralBudget) / parseFloat(calculations.shellBudgetTotal))}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {formatCurrency(calculations.structuralBudget)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">50% reduction for remodel</div>
              </div>

              {/* Civil */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Civil / Site</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatPercent(parseFloat(calculations.civilBudget) / parseFloat(calculations.shellBudgetTotal))}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-teal-700 dark:text-teal-400">
                  {formatCurrency(calculations.civilBudget)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Site engineering</div>
              </div>

              {/* Mechanical */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Mechanical</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatPercent(parseFloat(calculations.mechanicalBudget) / parseFloat(calculations.shellBudgetTotal))}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
                  {formatCurrency(calculations.mechanicalBudget)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">HVAC systems</div>
              </div>

              {/* Electrical */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Electrical</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatPercent(parseFloat(calculations.electricalBudget) / parseFloat(calculations.shellBudgetTotal))}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                  {formatCurrency(calculations.electricalBudget)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Power & lighting</div>
              </div>

              {/* Plumbing */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Plumbing</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatPercent(parseFloat(calculations.plumbingBudget) / parseFloat(calculations.shellBudgetTotal))}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-red-700 dark:text-red-400">
                  {formatCurrency(calculations.plumbingBudget)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Water systems</div>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">New</p>
                    <p className="text-xs font-medium">{formatCurrency(parseFloat(calculations.plumbingBudget) * (newBuildingArea / (newBuildingArea + existingBuildingArea)))}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Remodel</p>
                    <p className="text-xs font-medium">{formatCurrency(parseFloat(calculations.plumbingBudget) * (existingBuildingArea / (newBuildingArea + existingBuildingArea)))}</p>
                  </div>
                </div>
              </div>

              {/* Telecommunication */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Telecommunication</span>
                  <Badge variant="secondary" className="text-xs">Low-Voltage</Badge>
                </div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
                  {formatCurrency(
                    parseFloat(fees.find(f => f.scope === 'Telecommunication')?.louisAmyFee || '0')
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Outsourced service</div>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">New</p>
                    <p className="text-xs font-medium">
                      {formatCurrency(
                        parseFloat(fees.find(f => f.scope === 'Telecommunication')?.louisAmyFee || '0') * 
                        (newBuildingArea / (newBuildingArea + existingBuildingArea))
                      )}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Remodel</p>
                    <p className="text-xs font-medium">
                      {formatCurrency(
                        parseFloat(fees.find(f => f.scope === 'Telecommunication')?.louisAmyFee || '0') * 
                        (existingBuildingArea / (newBuildingArea + existingBuildingArea))
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Parameters & Budget Breakdown Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Interactive Parameters */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Settings className="h-5 w-5 text-blue-600" />
                Project Parameters
              </CardTitle>
              <CardDescription>Adjust parameters and see real-time updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">New Building Area</Label>
                  <Badge variant="outline">{formatNumber(newBuildingArea)} ft²</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[newBuildingArea]}
                    onValueChange={(value) => setNewBuildingArea(value[0])}
                    max={50000}
                    min={0}
                    step={100}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newBuildingArea}
                    onChange={(e) => setNewBuildingArea(Math.max(0, Math.min(50000, parseInt(e.target.value) || 0)))}
                    className="w-24 text-center"
                    min={0}
                    max={50000}
                    step={100}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Existing Building Area</Label>
                  <Badge variant="outline">{formatNumber(existingBuildingArea)} ft²</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[existingBuildingArea]}
                    onValueChange={(value) => setExistingBuildingArea(value[0])}
                    max={50000}
                    min={0}
                    step={100}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={existingBuildingArea}
                    onChange={(e) => setExistingBuildingArea(Math.max(0, Math.min(50000, parseInt(e.target.value) || 0)))}
                    className="w-24 text-center"
                    min={0}
                    max={50000}
                    step={100}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Site Area</Label>
                  <Badge variant="outline">{formatNumber(siteArea)} ft²</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[siteArea]}
                    onValueChange={(value) => setSiteArea(value[0])}
                    max={100000}
                    min={0}
                    step={500}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={siteArea}
                    onChange={(e) => setSiteArea(Math.max(0, Math.min(100000, parseInt(e.target.value) || 0)))}
                    className="w-24 text-center"
                    min={0}
                    max={100000}
                    step={500}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Remodel Cost Factor</Label>
                  <Badge variant="outline">{formatPercent(remodelMultiplier)}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[remodelMultiplier]}
                    onValueChange={(value) => setRemodelMultiplier(value[0])}
                    max={1}
                    min={0.1}
                    step={0.05}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={Math.round(remodelMultiplier * 100)}
                    onChange={(e) => setRemodelMultiplier(Math.max(10, Math.min(100, parseInt(e.target.value) || 50)) / 100)}
                    className="w-20 text-center"
                    min={10}
                    max={100}
                    step={5}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-amber-600" />
                  <div>
                    <Label className="text-sm font-medium">Historic Property</Label>
                    <p className="text-xs text-muted-foreground">20% cost increase</p>
                  </div>
                </div>
                <Switch 
                  checked={isHistoric} 
                  onCheckedChange={setIsHistoric}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>
              
              {/* Advanced Settings Toggle */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Advanced Settings
                  </span>
                  {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings Panel */}
          {showAdvancedSettings && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Advanced Configuration
                </CardTitle>
                <CardDescription>Fine-tune calculation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cost Range Targets */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Range Targets
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">New Construction Target ($/ft²)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[newConstructionTarget || parseFloat(calculations.newCostTarget) || 300]}
                          onValueChange={(value) => setNewConstructionTarget(value[0])}
                          max={800}
                          min={100}
                          step={10}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={newConstructionTarget || parseFloat(calculations.newCostTarget) || 300}
                          onChange={(e) => setNewConstructionTarget(parseFloat(e.target.value) || undefined)}
                          className="w-20 text-center text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Remodel Target ($/ft²)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[remodelTarget || parseFloat(calculations.remodelCostTarget) || 150]}
                          onValueChange={(value) => setRemodelTarget(value[0])}
                          max={400}
                          min={50}
                          step={5}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={remodelTarget || parseFloat(calculations.remodelCostTarget) || 150}
                          onChange={(e) => setRemodelTarget(parseFloat(e.target.value) || undefined)}
                          className="w-20 text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engineering Percentages */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Engineering Discipline Percentages
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Telecom %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={telecomPercentage !== undefined ? telecomPercentage * 100 : ''}
                          onChange={(e) => setTelecomPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                          placeholder="Auto"
                          className="w-full text-xs"
                          step={0.1}
                          min={0}
                          max={100}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Structural %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={structuralPercentage !== undefined ? structuralPercentage * 100 : ''}
                          onChange={(e) => setStructuralPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                          placeholder="Auto"
                          className="w-full text-xs"
                          step={0.1}
                          min={0}
                          max={100}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Civil %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={civilPercentage !== undefined ? civilPercentage * 100 : ''}
                          onChange={(e) => setCivilPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                          placeholder="Auto"
                          className="w-full text-xs"
                          step={0.1}
                          min={0}
                          max={100}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Mechanical %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={mechanicalPercentage !== undefined ? mechanicalPercentage * 100 : ''}
                          onChange={(e) => setMechanicalPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                          placeholder="Auto"
                          className="w-full text-xs"
                          step={0.1}
                          min={0}
                          max={100}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Electrical %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={electricalPercentage !== undefined ? electricalPercentage * 100 : ''}
                          onChange={(e) => setElectricalPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                          placeholder="Auto"
                          className="w-full text-xs"
                          step={0.1}
                          min={0}
                          max={100}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Plumbing %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={plumbingPercentage !== undefined ? plumbingPercentage * 100 : ''}
                          onChange={(e) => setPlumbingPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                          placeholder="Auto"
                          className="w-full text-xs"
                          step={0.1}
                          min={0}
                          max={100}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Labor and Pricing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Labor and Pricing
                  </h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Labor Rate ($/hr)</Label>
                      <Input
                        type="number"
                        value={laborRate || ''}
                        onChange={(e) => setLaborRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Auto ($250)"
                        className="w-full text-xs"
                        step={10}
                        min={50}
                        max={500}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Overhead Rate ($/hr)</Label>
                      <Input
                        type="number"
                        value={overheadRate || ''}
                        onChange={(e) => setOverheadRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Auto ($150)"
                        className="w-full text-xs"
                        step={10}
                        min={50}
                        max={300}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Markup Factor</Label>
                      <Input
                        type="number"
                        value={markupFactor || ''}
                        onChange={(e) => setMarkupFactor(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Auto (1.2x)"
                        className="w-full text-xs"
                        step={0.05}
                        min={1}
                        max={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Fee Adjustments */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Fee Adjustments (Multipliers)
                  </h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Architecture</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[architectureFeeAdj]}
                          onValueChange={(value) => setArchitectureFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{architectureFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Interior</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[interiorFeeAdj]}
                          onValueChange={(value) => setInteriorFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{interiorFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Landscape</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[landscapeFeeAdj]}
                          onValueChange={(value) => setLandscapeFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{landscapeFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Structural</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[structuralFeeAdj]}
                          onValueChange={(value) => setStructuralFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{structuralFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Civil</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[civilFeeAdj]}
                          onValueChange={(value) => setCivilFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{civilFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Mechanical</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[mechanicalFeeAdj]}
                          onValueChange={(value) => setMechanicalFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{mechanicalFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Electrical</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[electricalFeeAdj]}
                          onValueChange={(value) => setElectricalFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{electricalFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Plumbing</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[plumbingFeeAdj]}
                          onValueChange={(value) => setPlumbingFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{plumbingFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Telecom</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[telecomFeeAdj]}
                          onValueChange={(value) => setTelecomFeeAdj(value[0])}
                          max={2}
                          min={0.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-10 text-right">{telecomFeeAdj.toFixed(2)}x</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewConstructionTarget(undefined);
                      setRemodelTarget(undefined);
                      setTelecomPercentage(undefined);
                      setStructuralPercentage(undefined);
                      setCivilPercentage(undefined);
                      setMechanicalPercentage(undefined);
                      setElectricalPercentage(undefined);
                      setPlumbingPercentage(undefined);
                      setLaborRate(undefined);
                      setOverheadRate(undefined);
                      setMarkupFactor(undefined);
                      setArchitectureFeeAdj(1.0);
                      setInteriorFeeAdj(1.0);
                      setLandscapeFeeAdj(1.0);
                      setStructuralFeeAdj(1.0);
                      setCivilFeeAdj(1.0);
                      setMechanicalFeeAdj(1.0);
                      setElectricalFeeAdj(1.0);
                      setPlumbingFeeAdj(1.0);
                      setTelecomFeeAdj(1.0);
                    }}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Breakdown Donut Chart */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <PieChart className="h-4 w-4 text-emerald-600" />
                Budget Breakdown
              </CardTitle>
              <CardDescription className="text-xs">Construction cost distribution</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={budgetChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      fill="#8884d8"
                      paddingAngle={2}
                    >
                      {budgetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground">Total</div>
                    <div className="text-sm font-bold">{formatCurrency(calculations.totalBudget)}</div>
                  </div>
                </div>
              </div>
              {/* Compact Legend */}
              <div className="space-y-1 mt-2">
                {budgetChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Analysis Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cost Range Analysis */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Cost Range Analysis
              </CardTitle>
              <CardDescription>Construction cost ranges per square foot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Construction Range */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-green-700">New Construction</h4>
                  <span className="text-sm text-muted-foreground">per ft²</span>
                </div>
                <div className="relative">
                  <div className="h-8 bg-gradient-to-r from-red-200 via-blue-200 to-green-200 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-gray-700">
                      <span>{formatCurrency(costPerSqFtData[0].minimum)}</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold text-blue-700">
                        {formatCurrency(costPerSqFtData[0].target)}
                      </span>
                      <span>{formatCurrency(costPerSqFtData[0].maximum)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Minimum</span>
                    <span>Target</span>
                    <span>Maximum</span>
                  </div>
                </div>
              </div>

              {/* Remodel Range */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-orange-700">Remodel</h4>
                  <span className="text-sm text-muted-foreground">per ft²</span>
                </div>
                <div className="relative">
                  <div className="h-8 bg-gradient-to-r from-red-200 via-blue-200 to-green-200 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium text-gray-700">
                      <span>{formatCurrency(costPerSqFtData[1].minimum)}</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold text-blue-700">
                        {formatCurrency(costPerSqFtData[1].target)}
                      </span>
                      <span>{formatCurrency(costPerSqFtData[1].maximum)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Minimum</span>
                    <span>Target</span>
                    <span>Maximum</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Breakdown Pie Chart */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <PieChart className="h-5 w-5 text-purple-600" />
                Fee Distribution
              </CardTitle>
              <CardDescription>Professional service fee breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={feeBreakdownData.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {feeBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              {/* Fee Legend */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {feeBreakdownData.filter(item => item.value > 0).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium ml-auto">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fees Detail */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="h-5 w-5 text-green-600" />
                Professional Fees Analysis
              </CardTitle>
              <CardDescription>Comprehensive fee breakdown with metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fees.map((fee, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{fee.scope}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {fee.isInhouse ? (
                            <Badge variant="secondary" className="text-xs">In-house</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Outsourced</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(fee.marketFee)}</div>
                        <div className="text-xs text-muted-foreground">Market Fee</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">% of Cost</div>
                        <div className="font-medium text-sm">{formatPercent(parseFloat(fee.percentOfCost || '0'))}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Rate/ft²</div>
                        <div className="font-medium text-sm">${formatNumber(parseFloat(fee.ratePerSqFt || '0'), 2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Louis Amy Fee</div>
                        <div className="font-medium text-sm">{formatCurrency(fee.louisAmyFee)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Hours</div>
                        <div className="font-medium text-sm">{formatNumber(parseFloat(fee.hours || '0'), 0)} hrs</div>
                      </div>
                      {fee.coordinationFee && parseFloat(fee.coordinationFee) > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground">Coordination</div>
                          <div className="font-medium text-sm">{formatCurrency(fee.coordinationFee)}</div>
                        </div>
                      )}
                      {fee.consultantFee && parseFloat(fee.consultantFee) > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground">Consultant</div>
                          <div className="font-medium text-sm">{formatCurrency(fee.consultantFee)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hours Distribution */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5 text-orange-600" />
                Detailed Hours Distribution
              </CardTitle>
              <CardDescription>Team effort breakdown by phase and role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hours.map((hour, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-sm">{hour.phase}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatPercent(parseFloat(hour.phasePercent))}
                        </Badge>
                        <span className="text-sm font-semibold">{formatNumber(parseFloat(hour.totalHours), 0)} hrs</span>
                      </div>
                    </div>
                    <Progress 
                      value={(parseFloat(hour.totalHours) / totalHours) * 100} 
                      className="h-2 bg-gradient-to-r from-blue-200 to-purple-200 mb-3"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Designer 1:</span>
                        <span className="font-medium">{formatNumber(parseFloat(hour.designer1Hours || '0'), 0)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Designer 2:</span>
                        <span className="font-medium">{formatNumber(parseFloat(hour.designer2Hours || '0'), 0)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Architect:</span>
                        <span className="font-medium">{formatNumber(parseFloat(hour.architectHours || '0'), 0)} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Engineer:</span>
                        <span className="font-medium">{formatNumber(parseFloat(hour.engineerHours || '0'), 0)} hrs</span>
                      </div>
                      {hour.principalHours && parseFloat(hour.principalHours) > 0 && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-muted-foreground">Principal:</span>
                          <span className="font-medium">{formatNumber(parseFloat(hour.principalHours), 0)} hrs</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Hours Summary by Role */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Total Hours by Role</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Designer 1:</span>
                    <span className="font-medium">
                      {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.designer1Hours || '0'), 0), 0)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Designer 2:</span>
                    <span className="font-medium">
                      {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.designer2Hours || '0'), 0), 0)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Architect:</span>
                    <span className="font-medium">
                      {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.architectHours || '0'), 0), 0)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engineer:</span>
                    <span className="font-medium">
                      {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.engineerHours || '0'), 0), 0)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm col-span-2">
                    <span className="text-muted-foreground">Principal:</span>
                    <span className="font-medium">
                      {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.principalHours || '0'), 0), 0)} hrs
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calculation Methodology Summary */}
        <TooltipProvider>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Calculator className="h-5 w-5 text-indigo-600" />
                Budget Calculation Methodology
              </CardTitle>
              <CardDescription>Understanding how your budget is calculated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Category Multiplier */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Category {project.category} Multiplier</span>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Category multipliers adjust costs based on project complexity (1-5 scale)</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Badge variant="secondary">{(0.8 + 0.1 * project.category).toFixed(1)}x</Badge>
                </div>

                {/* Historic Property Multiplier */}
                {parseFloat(project.historicMultiplier) > 1.0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Historic Property Adjustment</span>
                      <UITooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>20% cost increase for historic property preservation requirements</p>
                        </TooltipContent>
                      </UITooltip>
                    </div>
                    <Badge variant="secondary">+20%</Badge>
                  </div>
                )}

                {/* Remodel Cost Factor */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Remodel Cost Factor</span>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Remodel costs are calculated as a percentage of new construction costs</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Badge variant="secondary">{formatPercent(project.remodelMultiplier)}</Badge>
                </div>

                {/* Building Type & Tier */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Building Configuration</span>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Type: {project.buildingType}<br/>Tier: {project.buildingTier}<br/>Design Level: {project.designLevel}</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <Badge variant="outline">{project.buildingTier}</Badge>
                </div>

                {/* Working Minimum Budget */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Working Minimum Budget</span>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Sum of all engineering discipline budgets - the minimum required budget for project completion</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(
                        parseFloat(calculations.architectureBudget || '0') +
                        parseFloat(calculations.structuralBudget || '0') +
                        parseFloat(calculations.civilBudget || '0') +
                        parseFloat(calculations.mechanicalBudget || '0') +
                        parseFloat(calculations.electricalBudget || '0') +
                        parseFloat(calculations.plumbingBudget || '0')
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Required minimum</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>

        {/* Construction Cost Summary */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Building className="h-6 w-6 text-blue-600" />
              Construction Cost Summary
            </CardTitle>
            <CardDescription>Detailed cost analysis for construction phases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-green-700 dark:text-green-400">New Construction</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">Minimum</div>
                    <div className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(calculations.newCostMin)}/ft²</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Target</div>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(calculations.newCostTarget)}/ft²</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">Maximum</div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(calculations.newCostMax)}/ft²</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-orange-700 dark:text-orange-400">Remodel</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">Minimum</div>
                    <div className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(calculations.remodelCostMin)}/ft²</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Target</div>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(calculations.remodelCostTarget)}/ft²</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">Maximum</div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(calculations.remodelCostMax)}/ft²</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm">Last calculated: {new Date(calculations.calculatedAt).toLocaleString()}</p>
                <p className="text-blue-200 text-xs">Project parameters and calculations are updated in real-time</p>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-200" />
                <span className="text-blue-100 text-sm">Live Dashboard</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}