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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  ChevronDown,
  HelpCircle,
  Layers,
  Percent,
  FileText,
  ChevronRight,
  AlertCircle
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
  AreaChart,
  Legend,
  ReferenceLine
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

// Custom Range Slider Component for Cost Ranges
function CostRangeSlider({ 
  label, 
  min, 
  target, 
  max, 
  onChange,
  unit = "$/ft²" 
}: {
  label: string;
  min: number;
  target: number;
  max: number;
  onChange: (value: number) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="outline">{unit} {formatNumber(target)}</Badge>
      </div>
      <div className="relative pt-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Min: {formatNumber(min)}</span>
          <span>Max: {formatNumber(max)}</span>
        </div>
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="absolute h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              style={{ 
                left: '0%',
                width: `${((target - min) / (max - min)) * 100}%` 
              }}
            />
          </div>
          <Slider
            value={[target]}
            onValueChange={(value) => onChange(value[0])}
            max={max}
            min={min}
            step={(max - min) / 100}
            className="absolute top-0 w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDashboardV2() {
  const params = useParams();
  const [, navigate] = useLocation();
  const projectId = params.id as string;
  
  // Section 1: Project Inputs & Parameters
  const [newBuildingArea, setNewBuildingArea] = useState(0);
  const [existingBuildingArea, setExistingBuildingArea] = useState(0);
  const [siteArea, setSiteArea] = useState(0);
  const [remodelMultiplier, setRemodelMultiplier] = useState(0.5);
  const [isHistoric, setIsHistoric] = useState(false);
  
  // Section 2: Cost Range Controls
  const [newConstructionTarget, setNewConstructionTarget] = useState<number | undefined>();
  const [remodelTarget, setRemodelTarget] = useState<number | undefined>();
  
  // Section 3: Budget Share Overrides
  const [shellShareOverride, setShellShareOverride] = useState<number | undefined>();
  const [interiorShareOverride, setInteriorShareOverride] = useState<number | undefined>();
  const [landscapeShareOverride, setLandscapeShareOverride] = useState<number | undefined>();
  
  // Section 4: Discipline Percentage Overrides
  const [architecturePercentage, setArchitecturePercentage] = useState<number | undefined>();
  const [interiorDesignPercentage, setInteriorDesignPercentage] = useState<number | undefined>();
  const [landscapePercentage, setLandscapePercentage] = useState<number | undefined>();
  const [structuralPercentage, setStructuralPercentage] = useState<number | undefined>();
  const [civilPercentage, setCivilPercentage] = useState<number | undefined>();
  const [mechanicalPercentage, setMechanicalPercentage] = useState<number | undefined>();
  const [electricalPercentage, setElectricalPercentage] = useState<number | undefined>();
  const [plumbingPercentage, setPlumbingPercentage] = useState<number | undefined>();
  const [telecomPercentage, setTelecomPercentage] = useState<number | undefined>();
  
  // Section 5: Fee Analysis Controls
  const [categoryMultiplier, setCategoryMultiplier] = useState<number | undefined>();
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [coordinationFeePercent, setCoordinationFeePercent] = useState<number>(15);
  
  // Bottom-up Controls
  const [laborRate, setLaborRate] = useState<number>(36);
  const [overheadRate, setOverheadRate] = useState<number>(46);
  const [markupFactor, setMarkupFactor] = useState<number>(1.5);
  
  // Service Selection
  const [includedServices, setIncludedServices] = useState({
    architecture: true,
    interior: true,
    landscape: true,
    structural: true,
    civil: true,
    mechanical: false,
    electrical: false,
    plumbing: true,
    telecom: false
  });
  
  // Section 6: Hours Factor Override
  const [hoursFactorOverride, setHoursFactorOverride] = useState<number | undefined>();
  const [hoursPerSqFt, setHoursPerSqFt] = useState<number>(0.5);
  const [discountPercent, setDiscountPercent] = useState<number>(0.0);
  const [telecomShareOverride, setTelecomShareOverride] = useState<number>(0.02);
  
  // UI Controls
  const [autoRecalc, setAutoRecalc] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    inputs: true,
    costRanges: true,
    budgets: true,
    disciplines: true,
    fees: true,
    hours: false,
    summary: false
  });

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
        newConstructionTargetCost: newConstructionTarget,
        remodelTargetCost: remodelTarget,
        shellShareOverride,
        interiorShareOverride,
        landscapeShareOverride,
        // Add all other overrides here
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
    newConstructionTarget, remodelTarget, shellShareOverride, interiorShareOverride, landscapeShareOverride,
    autoRecalc
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Project not found</h3>
              <p className="text-muted-foreground mb-4">
                The project you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate("/projects")}>
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
  
  // Calculate Working Minimum Budget
  const workingMinimumBudget = 
    parseFloat(calculations.shellBudgetTotal) + 
    parseFloat(calculations.interiorBudgetTotal) + 
    parseFloat(calculations.landscapeBudgetTotal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Projects
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold">{project.projectName}</h1>
                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-xs">
                    {project.buildingUse}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {project.buildingType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {project.buildingTier}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Category {project.category}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoRecalc} 
                  onCheckedChange={setAutoRecalc}
                  id="auto-recalc"
                />
                <Label htmlFor="auto-recalc" className="text-sm">Auto-recalc</Label>
              </div>
              <Button 
                onClick={() => recalculateMutation.mutate(undefined)} 
                disabled={recalculateMutation.isPending}
                size="sm"
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

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Quick Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Total Budget
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">New: {formatCurrency(calculations.newBudget)}</p>
                    <p className="text-xs">Remodel: {formatCurrency(calculations.remodelBudget)}</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(calculations.totalBudget)}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Market Fee
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-semibold mb-1">Market Fee Calculation:</p>
                    <p className="text-xs">Base Fee: {formatPercent(totalMarketFee / parseFloat(calculations.totalBudget))}</p>
                    <p className="text-xs">Category Multiplier: {categoryMultiplier || project.category}</p>
                    <p className="text-xs">Remodel Factor: {formatPercent(remodelMultiplier)}</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMarketFee)}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Louis Amy Fee
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-semibold mb-1">In-house Services:</p>
                    {fees.filter(f => f.isInhouse).map(f => (
                      <p key={f.id} className="text-xs">{f.scope}: {formatCurrency(f.louisAmyFee)}</p>
                    ))}
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalLouisAmyFee)}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Total Hours
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-semibold mb-1">Hours Calculation:</p>
                    <p className="text-xs">Base Factor: {hoursFactorOverride || 0.31} hrs/ft²</p>
                    <p className="text-xs">Total Area: {formatNumber(newBuildingArea + existingBuildingArea)} ft²</p>
                    <p className="text-xs">Calculated: {formatNumber(totalHours, 0)} hours</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalHours, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Inputs & Cost Ranges */}
        <Card className="mb-6">
          <Collapsible open={expandedSections.inputs} onOpenChange={(open) => setExpandedSections({...expandedSections, inputs: open})}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    1. Project Inputs & Cost Ranges
                  </span>
                  {expandedSections.inputs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Area Inputs */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>New Building Area (ft²)</Label>
                    <div className="flex gap-2">
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
                        onChange={(e) => setNewBuildingArea(parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Existing Building Area (ft²)</Label>
                    <div className="flex gap-2">
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
                        onChange={(e) => setExistingBuildingArea(parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Site Area (m²)</Label>
                    <div className="flex gap-2">
                      <Slider
                        value={[siteArea]}
                        onValueChange={(value) => setSiteArea(value[0])}
                        max={10000}
                        min={0}
                        step={50}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={siteArea}
                        onChange={(e) => setSiteArea(parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Cost Range Sliders */}
                <div className="grid gap-6 md:grid-cols-2">
                  <CostRangeSlider
                    label="New Construction Target"
                    min={parseFloat(calculations.newCostMin)}
                    target={newConstructionTarget || parseFloat(calculations.newCostTarget)}
                    max={parseFloat(calculations.newCostMax)}
                    onChange={setNewConstructionTarget}
                  />
                  
                  <CostRangeSlider
                    label="Remodel Target"
                    min={parseFloat(calculations.remodelCostMin)}
                    target={remodelTarget || parseFloat(calculations.remodelCostTarget)}
                    max={parseFloat(calculations.remodelCostMax)}
                    onChange={setRemodelTarget}
                  />
                </div>

                <Separator />

                {/* Multipliers */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Remodel Cost Factor</Label>
                    <div className="flex gap-2">
                      <Slider
                        value={[remodelMultiplier * 100]}
                        onValueChange={(value) => setRemodelMultiplier(value[0] / 100)}
                        max={100}
                        min={10}
                        step={5}
                        className="flex-1"
                      />
                      <div className="w-20 text-center">
                        <Badge>{formatPercent(remodelMultiplier)}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-amber-600" />
                      <div>
                        <Label>Historic Property</Label>
                        <p className="text-xs text-muted-foreground">20% cost increase when enabled</p>
                      </div>
                    </div>
                    <Switch 
                      checked={isHistoric} 
                      onCheckedChange={setIsHistoric}
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Section 2: Budget Allocation */}
        <Card className="mb-6">
          <Collapsible open={expandedSections.budgets} onOpenChange={(open) => setExpandedSections({...expandedSections, budgets: open})}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    2. Budget Allocation
                  </span>
                  {expandedSections.budgets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* New vs Remodel Budgets */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">New Construction Budget</span>
                        <Badge>{formatPercent(parseFloat(calculations.newBudget) / parseFloat(calculations.totalBudget))}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{formatCurrency(calculations.newBudget)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatNumber(newBuildingArea)} ft² × {formatCurrency(newConstructionTarget || parseFloat(calculations.newCostTarget))}/ft²
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Remodel Budget</span>
                        <Badge>{formatPercent(parseFloat(calculations.remodelBudget) / parseFloat(calculations.totalBudget))}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(calculations.remodelBudget)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatNumber(existingBuildingArea)} ft² × {formatCurrency(remodelTarget || parseFloat(calculations.remodelCostTarget))}/ft²
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Shell/Interior/Landscape with Share Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Component Budgets</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      Working Minimum Budget: {formatCurrency(workingMinimumBudget)}
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {/* Shell Budget */}
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium">Shell Budget</span>
                          <div className="text-2xl font-bold mt-1">{formatCurrency(calculations.shellBudgetTotal)}</div>
                        </div>
                        <div className="text-right">
                          <Label className="text-xs">Share Override</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={shellShareOverride || 66}
                              onChange={(e) => setShellShareOverride(parseFloat(e.target.value) / 100)}
                              className="w-16 h-8 text-xs"
                              min={0}
                              max={100}
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-muted-foreground">New</p>
                          <p className="font-medium">{formatCurrency(
                            (newBuildingArea + existingBuildingArea) > 0
                              ? parseFloat(calculations.shellBudgetTotal) * (newBuildingArea / (newBuildingArea + existingBuildingArea))
                              : 0
                          )}</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-muted-foreground">Remodel</p>
                          <p className="font-medium">{formatCurrency(
                            (newBuildingArea + existingBuildingArea) > 0
                              ? parseFloat(calculations.shellBudgetTotal) * (existingBuildingArea / (newBuildingArea + existingBuildingArea))
                              : 0
                          )}</p>
                        </div>
                      </div>
                    </div>

                    {/* Interior Budget */}
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium">Interior Budget</span>
                          <div className="text-2xl font-bold mt-1">{formatCurrency(calculations.interiorBudgetTotal)}</div>
                        </div>
                        <div className="text-right">
                          <Label className="text-xs">Share Override</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={interiorShareOverride || 22}
                              onChange={(e) => setInteriorShareOverride(parseFloat(e.target.value) / 100)}
                              className="w-16 h-8 text-xs"
                              min={0}
                              max={100}
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-muted-foreground">New</p>
                          <p className="font-medium">{formatCurrency(
                            (newBuildingArea + existingBuildingArea) > 0
                              ? parseFloat(calculations.interiorBudgetTotal) * (newBuildingArea / (newBuildingArea + existingBuildingArea))
                              : 0
                          )}</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-muted-foreground">Remodel</p>
                          <p className="font-medium">{formatCurrency(
                            (newBuildingArea + existingBuildingArea) > 0
                              ? parseFloat(calculations.interiorBudgetTotal) * (existingBuildingArea / (newBuildingArea + existingBuildingArea))
                              : 0
                          )}</p>
                        </div>
                      </div>
                    </div>

                    {/* Landscape Budget */}
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium">Landscape Budget</span>
                          <div className="text-2xl font-bold mt-1">{formatCurrency(calculations.landscapeBudgetTotal)}</div>
                        </div>
                        <div className="text-right">
                          <Label className="text-xs">Share Override</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={landscapeShareOverride || 12}
                              onChange={(e) => setLandscapeShareOverride(parseFloat(e.target.value) / 100)}
                              className="w-16 h-8 text-xs"
                              min={0}
                              max={100}
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-muted-foreground">New</p>
                          <p className="font-medium">{formatCurrency(
                            (newBuildingArea + existingBuildingArea) > 0
                              ? parseFloat(calculations.landscapeBudgetTotal) * (newBuildingArea / (newBuildingArea + existingBuildingArea))
                              : 0
                          )}</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-muted-foreground">Remodel</p>
                          <p className="font-medium">{formatCurrency(
                            (newBuildingArea + existingBuildingArea) > 0
                              ? parseFloat(calculations.landscapeBudgetTotal) * (existingBuildingArea / (newBuildingArea + existingBuildingArea))
                              : 0
                          )}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Engineering Discipline Budgets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Engineering Discipline Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Telecom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Telecommunication</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Low-voltage and IT infrastructure design</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(parseFloat(calculations.telecomBudget || "0"))}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={telecomShareOverride * 100 || 2}
                    onChange={(e) => setTelecomShareOverride(parseFloat(e.target.value) / 100)}
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={10}
                    step={0.5}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Structural */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Structural</span>
                  <span className="text-xs text-muted-foreground">
                    {((parseFloat(calculations.structuralBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(parseFloat(calculations.structuralBudget || "0"))}
                </div>
                <Progress 
                  value={(parseFloat(calculations.structuralBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100} 
                  className="h-1"
                />
              </div>

              {/* Civil */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Civil</span>
                  <span className="text-xs text-muted-foreground">
                    {((parseFloat(calculations.civilBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(parseFloat(calculations.civilBudget || "0"))}
                </div>
                <Progress 
                  value={(parseFloat(calculations.civilBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100} 
                  className="h-1"
                />
              </div>

              {/* Mechanical */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mechanical</span>
                  <span className="text-xs text-muted-foreground">
                    {((parseFloat(calculations.mechanicalBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(parseFloat(calculations.mechanicalBudget || "0"))}
                </div>
                <Progress 
                  value={(parseFloat(calculations.mechanicalBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100} 
                  className="h-1"
                />
              </div>

              {/* Electrical */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Electrical</span>
                  <span className="text-xs text-muted-foreground">
                    {((parseFloat(calculations.electricalBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(parseFloat(calculations.electricalBudget || "0"))}
                </div>
                <Progress 
                  value={(parseFloat(calculations.electricalBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100} 
                  className="h-1"
                />
              </div>

              {/* Plumbing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plumbing</span>
                  <span className="text-xs text-muted-foreground">
                    {((parseFloat(calculations.plumbingBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(parseFloat(calculations.plumbingBudget || "0"))}
                </div>
                <Progress 
                  value={(parseFloat(calculations.plumbingBudget || "0") / parseFloat(calculations.totalBudget || "1")) * 100} 
                  className="h-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Fees Analysis with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Professional Fees Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="topdown" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="topdown">Top-Down Analysis</TabsTrigger>
                <TabsTrigger value="bottomup">Bottom-Up Calculation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="topdown" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Market Fee (10-15%)</Label>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Industry standard fee as percentage of construction cost</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(parseFloat(calculations.totalBudget || "0") * 0.125)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      12.5% of construction
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Louis Amy Fee</Label>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Custom fee structure based on project complexity</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(parseFloat(calculations.totalBudget || "0") * 0.115)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      11.5% of construction
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm mb-2">Fee Breakdown by Discipline</Label>
                  <div className="space-y-2">
                    {fees && fees.map((fee) => (
                      <div key={fee.scope} className="flex items-center justify-between py-1">
                        <span className="text-sm">{fee.scope}</span>
                        <div className="flex items-center gap-2 md:gap-4">
                          <span className="text-sm font-medium">{formatCurrency(parseFloat(fee.louisAmyFee))}</span>
                          <Badge variant={fee.isInhouse ? "default" : "secondary"} className="text-xs">
                            {fee.isInhouse ? "In-House" : "Outsourced"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bottomup" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Labor Rate ($/hr)</Label>
                    <Input
                      type="number"
                      value={laborRate}
                      onChange={(e) => setLaborRate(parseFloat(e.target.value))}
                      className="h-8"
                      min={50}
                      max={500}
                      step={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Overhead Rate</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={overheadRate * 100}
                        onChange={(e) => setOverheadRate(parseFloat(e.target.value) / 100)}
                        className="h-8"
                        min={100}
                        max={300}
                        step={10}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Markup Factor</Label>
                    <Input
                      type="number"
                      value={markupFactor}
                      onChange={(e) => setMarkupFactor(parseFloat(e.target.value))}
                      className="h-8"
                      min={1}
                      max={3}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Discount %</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={discountPercent * 100}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) / 100)}
                        className="h-8"
                        min={0}
                        max={50}
                        step={5}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Hours</span>
                    <span className="text-xl font-bold">
                      {hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0).toFixed(0) : "0"} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Labor Cost</span>
                    <span className="font-medium">
                      {formatCurrency((hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) : 0) * laborRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">With Overhead</span>
                    <span className="font-medium">
                      {formatCurrency((hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) : 0) * laborRate * overheadRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">With Markup</span>
                    <span className="font-medium">
                      {formatCurrency((hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) : 0) * laborRate * overheadRate * markupFactor)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-semibold">Bottom-Up Fee</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency((hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) : 0) * laborRate * overheadRate * markupFactor * (1 - discountPercent))}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Hours Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hours Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Total Project Hours</Label>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Based on area × hours/ft² × complexity factor</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold">
                  {hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0).toFixed(0) : "0"} hrs
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Hours per ft² Factor</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[hoursPerSqFt]}
                    onValueChange={([value]) => setHoursPerSqFt(value)}
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={hoursPerSqFt}
                    onChange={(e) => setHoursPerSqFt(parseFloat(e.target.value))}
                    className="w-20 h-8"
                    min={0.1}
                    max={2}
                    step={0.1}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm mb-2">Distribution by Phase</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {hours && hours.map((hour) => (
                    <div key={hour.phase} className="p-2 border rounded">
                      <div className="text-xs text-muted-foreground">{hour.phase}</div>
                      <div className="font-semibold">{parseFloat(hour.totalHours).toFixed(0)} hrs</div>
                      <Progress value={(parseFloat(hour.totalHours) / (hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 1) : 1)) * 100} className="h-1 mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm mb-2">Distribution by Role</Label>
                <div className="space-y-2">
                  {[
                    { label: "Designer1", key: "designer1Hours" },
                    { label: "Designer2", key: "designer2Hours" },
                    { label: "Architect", key: "architectHours" },
                    { label: "Engineer", key: "engineerHours" },
                    { label: "Principal", key: "principalHours" }
                  ].map((role) => {
                    const roleHours = hours?.reduce((sum, h) => 
                      sum + parseFloat(h[role.key as keyof typeof h] as string || "0"), 0
                    ) || 0;
                    return (
                      <div key={role.label} className="flex items-center justify-between">
                        <span className="text-sm">{role.label}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(roleHours / (hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 1) : 1)) * 100} className="w-24 h-2" />
                          <span className="text-sm font-medium w-16 text-right">{roleHours.toFixed(0)} hrs</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}