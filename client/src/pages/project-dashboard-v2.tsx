import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Save
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
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

  // State for interactive controls
  const [newBuildingArea, setNewBuildingArea] = useState(0);
  const [existingBuildingArea, setExistingBuildingArea] = useState(0);
  const [siteArea, setSiteArea] = useState(0);
  const [newConstructionTargetCost, setNewConstructionTargetCost] = useState<number | undefined>();
  const [remodelTargetCost, setRemodelTargetCost] = useState<number | undefined>();
  const [remodelMultiplier, setRemodelMultiplier] = useState(0.5);
  const [isHistoric, setIsHistoric] = useState(false);
  const [historicPropertyMultiplier, setHistoricPropertyMultiplier] = useState(1.0);
  const [autoRecalc, setAutoRecalc] = useState(true);
  const [savedPresets, setSavedPresets] = useState<any[]>([]);

  // Share override states
  const [shellShareOverride, setShellShareOverride] = useState<number | undefined>();
  const [interiorShareOverride, setInteriorShareOverride] = useState<number | undefined>();
  const [landscapeShareOverride, setLandscapeShareOverride] = useState<number | undefined>();

  // Discipline share override states
  const [structuralShareOverride, setStructuralShareOverride] = useState<number | undefined>();
  const [civilShareOverride, setCivilShareOverride] = useState<number | undefined>();
  const [mechanicalShareOverride, setMechanicalShareOverride] = useState<number | undefined>();
  const [electricalShareOverride, setElectricalShareOverride] = useState<number | undefined>();
  const [plumbingShareOverride, setPlumbingShareOverride] = useState<number | undefined>();
  const [telecomShareOverride, setTelecomShareOverride] = useState<number | undefined>();

  // Bottom-up calculation states
  const [laborRateOverride, setLaborRateOverride] = useState<number | undefined>();
  const [overheadRateOverride, setOverheadRateOverride] = useState<number | undefined>();
  const [markupFactorOverride, setMarkupFactorOverride] = useState<number | undefined>();
  const [contractDiscountOverride, setContractDiscountOverride] = useState<number>(0.15);

  // Fee adjustment states
  const [architectureFeeAdjustment, setArchitectureFeeAdjustment] = useState<number>(1.0);
  const [interiorFeeAdjustment, setInteriorFeeAdjustment] = useState<number>(1.0);
  const [landscapeFeeAdjustment, setLandscapeFeeAdjustment] = useState<number>(1.0);
  const [structuralFeeAdjustment, setStructuralFeeAdjustment] = useState<number>(1.0);
  const [civilFeeAdjustment, setCivilFeeAdjustment] = useState<number>(1.0);
  const [mechanicalFeeAdjustment, setMechanicalFeeAdjustment] = useState<number>(1.0);
  const [electricalFeeAdjustment, setElectricalFeeAdjustment] = useState<number>(1.0);
  const [plumbingFeeAdjustment, setPlumbingFeeAdjustment] = useState<number>(1.0);
  const [telecomFeeAdjustment, setTelecomFeeAdjustment] = useState<number>(1.0);

  // Additional UI state variables
  const [coordinationFeePercent, setCoordinationFeePercent] = useState<number>(15);
  const [presetName, setPresetName] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [useNonLinearHours, setUseNonLinearHours] = useState(false);
  const [disciplineInhouse, setDisciplineInhouse] = useState<Record<string, boolean>>({});
  const [scanToBimEnabled, setScanToBimEnabled] = useState(false);
  const [scanToBimArea, setScanToBimArea] = useState(0);
  const [scanToBimRate, setScanToBimRate] = useState(0.5);
  const [hoursPerSqFt, setHoursPerSqFt] = useState(0.22);

  // Fetch project data
  const { data, isLoading, error } = useQuery<ProjectData>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      if (!data?.project) return;

      const input = {
        projectName: data.project.projectName,
        buildingUse: data.project.buildingUse,
        buildingType: data.project.buildingType,
        buildingTier: data.project.buildingTier,
        designLevel: data.project.designLevel,
        category: data.project.category,
        newBuildingArea,
        existingBuildingArea,
        siteArea,
        historicMultiplier: isHistoric ? historicPropertyMultiplier : 1.0,
        remodelMultiplier,
        newConstructionTargetCost,
        remodelTargetCost,
        shellShareOverride,
        interiorShareOverride,
        landscapeShareOverride,
        structuralPercentageOverride: structuralShareOverride,
        civilPercentageOverride: civilShareOverride,
        mechanicalPercentageOverride: mechanicalShareOverride,
        electricalPercentageOverride: electricalShareOverride,
        plumbingPercentageOverride: plumbingShareOverride,
        telecomPercentageOverride: telecomShareOverride,
        laborRateOverride,
        overheadRateOverride,
        markupFactorOverride,
        architectureFeeAdjustment,
        interiorFeeAdjustment,
        landscapeFeeAdjustment,
        structuralFeeAdjustment,
        civilFeeAdjustment,
        mechanicalFeeAdjustment,
        electricalFeeAdjustment,
        plumbingFeeAdjustment,
        telecomFeeAdjustment,
        contractDiscountOverride,
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
      setHistoricPropertyMultiplier(parseFloat(data.project.historicMultiplier) > 1.0 ? 1.2 : 1.0);

      // Initialize target costs from calculations if available
      if (data.calculations) {
        setNewConstructionTargetCost(parseFloat(data.calculations.newCostTarget));
        setRemodelTargetCost(parseFloat(data.calculations.remodelCostTarget));
      }

      // Initialize share overrides if saved
      if (data.project.shellShareOverride) {
        setShellShareOverride(parseFloat(data.project.shellShareOverride));
      }
      if (data.project.interiorShareOverride) {
        setInteriorShareOverride(parseFloat(data.project.interiorShareOverride));
      }
      if (data.project.landscapeShareOverride) {
        setLandscapeShareOverride(parseFloat(data.project.landscapeShareOverride));
      }

      // Initialize discipline percentage overrides if saved
      if (data.project.structuralPercentageOverride) {
        setStructuralShareOverride(parseFloat(data.project.structuralPercentageOverride));
      }
      if (data.project.civilPercentageOverride) {
        setCivilShareOverride(parseFloat(data.project.civilPercentageOverride));
      }
      if (data.project.mechanicalPercentageOverride) {
        setMechanicalShareOverride(parseFloat(data.project.mechanicalPercentageOverride));
      }
      if (data.project.electricalPercentageOverride) {
        setElectricalShareOverride(parseFloat(data.project.electricalPercentageOverride));
      }
      if (data.project.plumbingPercentageOverride) {
        setPlumbingShareOverride(parseFloat(data.project.plumbingPercentageOverride));
      }
      if (data.project.telecomPercentageOverride) {
        setTelecomShareOverride(parseFloat(data.project.telecomPercentageOverride));
      }

      // Initialize bottom-up calculation overrides if saved
      if (data.project.laborRateOverride) {
        setLaborRateOverride(parseFloat(data.project.laborRateOverride));
      }
      if (data.project.overheadRateOverride) {
        setOverheadRateOverride(parseFloat(data.project.overheadRateOverride));
      }
      if (data.project.markupFactorOverride) {
        setMarkupFactorOverride(parseFloat(data.project.markupFactorOverride));
      }
      // Contract discount override is initialized at state declaration with default 0.15

      // Initialize fee adjustments if saved
      if (data.project.architectureFeeAdjustment) {
        setArchitectureFeeAdjustment(parseFloat(data.project.architectureFeeAdjustment));
      }
      if (data.project.interiorFeeAdjustment) {
        setInteriorFeeAdjustment(parseFloat(data.project.interiorFeeAdjustment));
      }
      if (data.project.landscapeFeeAdjustment) {
        setLandscapeFeeAdjustment(parseFloat(data.project.landscapeFeeAdjustment));
      }
      if (data.project.structuralFeeAdjustment) {
        setStructuralFeeAdjustment(parseFloat(data.project.structuralFeeAdjustment));
      }
      if (data.project.civilFeeAdjustment) {
        setCivilFeeAdjustment(parseFloat(data.project.civilFeeAdjustment));
      }
      if (data.project.mechanicalFeeAdjustment) {
        setMechanicalFeeAdjustment(parseFloat(data.project.mechanicalFeeAdjustment));
      }
      if (data.project.electricalFeeAdjustment) {
        setElectricalFeeAdjustment(parseFloat(data.project.electricalFeeAdjustment));
      }
      if (data.project.plumbingFeeAdjustment) {
        setPlumbingFeeAdjustment(parseFloat(data.project.plumbingFeeAdjustment));
      }
      if (data.project.telecomFeeAdjustment) {
        setTelecomFeeAdjustment(parseFloat(data.project.telecomFeeAdjustment));
      }

      // Load saved presets from localStorage
      const storedPresets = localStorage.getItem('projectPresets');
      if (storedPresets) {
        setSavedPresets(JSON.parse(storedPresets));
      }
    }
  }, [data]);

  // Memoize the recalculation function to prevent infinite loops
  const performRecalculation = useCallback(() => {
    if (data?.project && !recalculateMutation.isPending) {
        // Mutation function already derives necessary input from current state
        recalculateMutation.mutate();
      }
    }, [
      // Area and settings
      newBuildingArea,
      existingBuildingArea,
    siteArea,
    newConstructionTargetCost,
    remodelTargetCost,
    remodelMultiplier,
    isHistoric,
    historicPropertyMultiplier,
    shellShareOverride,
    interiorShareOverride,
    landscapeShareOverride,

    // Engineering percentage overrides
    structuralShareOverride,
    civilShareOverride,
    mechanicalShareOverride,
    electricalShareOverride,
    plumbingShareOverride,
    telecomShareOverride,

    // Bottom-up parameters
    laborRateOverride,
    overheadRateOverride,
    markupFactorOverride,
    contractDiscountOverride,

    // Fee adjustments
    architectureFeeAdjustment,
    interiorFeeAdjustment,
    landscapeFeeAdjustment,
    structuralFeeAdjustment,
    civilFeeAdjustment,
    mechanicalFeeAdjustment,
    electricalFeeAdjustment,
    plumbingFeeAdjustment,
    telecomFeeAdjustment,
    data?.project,
    recalculateMutation.mutate
  ]);

  // Auto-recalculation effect
  useEffect(() => {
    if (autoRecalc) {
      performRecalculation();
    }
  }, [autoRecalc, performRecalculation]);

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

  // Safely derive the category multiplier from project or calculation data
  const categoryMultiplier = parseFloat(
    ((project as any)?.categoryMultiplier ??
      (calculations as any)?.categoryMultiplier ??
      1).toString()
  );

  // Helper functions for presets
  const loadPreset = (presetKey: string) => {
    const preset = savedPresets[presetKey as keyof typeof savedPresets] as any;
    if (preset) {
      // Load all override values from preset
      if (preset.shellShareOverride !== undefined) setShellShareOverride(preset.shellShareOverride);
      if (preset.interiorShareOverride !== undefined) setInteriorShareOverride(preset.interiorShareOverride);
      if (preset.landscapeShareOverride !== undefined) setLandscapeShareOverride(preset.landscapeShareOverride);
      // Add more preset loading logic as needed
    }
  };

  const savePreset = () => {
    if (!presetName) return;
    const preset = {
      name: presetName,
      shellShareOverride,
      interiorShareOverride,
      landscapeShareOverride,
      structuralShareOverride,
      civilShareOverride,
      mechanicalShareOverride,
      electricalShareOverride,
      plumbingShareOverride,
      telecomShareOverride,
      laborRateOverride,
      overheadRateOverride,
      markupFactorOverride,
      contractDiscountOverride,
    };
    const newPresets = { ...savedPresets, [presetName]: preset };
    setSavedPresets(newPresets);
    localStorage.setItem('projectPresets', JSON.stringify(newPresets));
    setPresetName('');
  };

  const exportConfiguration = () => {
    const config = {
      projectName: project.projectName,
      buildingType: project.buildingType,
      overrides: {
        shellShareOverride,
        interiorShareOverride,
        landscapeShareOverride,
        structuralShareOverride,
        civilShareOverride,
        mechanicalShareOverride,
        electricalShareOverride,
        plumbingShareOverride,
        telecomShareOverride,
        laborRateOverride,
        overheadRateOverride,
        markupFactorOverride,
        contractDiscountOverride,
      }
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.projectName}_config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate totals
  const totalMarketFee = fees.reduce((sum, f) => sum + parseFloat(f.marketFee), 0);
  const totalLouisAmyFee = fees.reduce((sum, f) => sum + parseFloat(f.louisAmyFee), 0);
  const totalCoordinationFee = fees.reduce((sum, f) => sum + parseFloat(f.coordinationFee || '0'), 0);
  const totalConsultantFee = fees.reduce((sum, f) => sum + parseFloat(f.consultantFee || '0'), 0);
  const totalHours = hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0;

  // Calculate Working Minimum Budget
  const workingMinimumBudget = 
    parseFloat(calculations.shellBudgetTotal) + 
    parseFloat(calculations.interiorBudgetTotal) + 
    parseFloat(calculations.landscapeBudgetTotal);

  // Determine target costs with overrides
  const newConstructionTarget = newConstructionTargetCost || parseFloat(calculations?.newCostTarget || "0");
  const remodelTarget = remodelTargetCost || parseFloat(calculations?.remodelCostTarget || "0");

  // Calculate reactive budgets based on current form values
  const calculatedNewBudget = newBuildingArea * newConstructionTarget;
  const calculatedRemodelBudget = existingBuildingArea * remodelTarget;
  const calculatedTotalBudget = calculatedNewBudget + calculatedRemodelBudget;

  // Duplicate functions removed - already defined above

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
                    <p className="text-xs">New: {formatCurrency(calculatedNewBudget)}</p>
                    <p className="text-xs">Remodel: {formatCurrency(calculatedRemodelBudget)}</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(calculatedTotalBudget)}</div>
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
                    <p className="text-xs">Base Fee: {formatPercent(totalMarketFee / parseFloat(calculatedTotalBudget.toString() || "1"))}</p>
                    <p className="text-xs">Category: {project.category}</p>
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
                    <p className="text-xs">Base Factor: 0.31 hrs/ft²</p>
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
                        onValueChange={([value]) => setNewBuildingArea(value)}
                        max={20000}
                        step={10}
                        className="w-full"
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
                        onValueChange={([value]) => setExistingBuildingArea(value)}
                        max={20000}
                        step={10}
                        className="w-full"
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
                    <Label>Site Area (ft²)</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        type="number"
                        value={siteArea}
                        onChange={(e) => setSiteArea(parseFloat(e.target.value) || 0)}
                        className="text-center font-mono"
                      />
                      <Slider
                        value={[siteArea]}
                        onValueChange={([value]) => setSiteArea(value)}
                        max={100000}
                        step={100}
                        className="w-full"
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
                    target={newConstructionTarget}
                    max={parseFloat(calculations.newCostMax)}
                    onChange={setNewConstructionTargetCost}
                  />

                  <CostRangeSlider
                    label="Remodel Target"
                    min={parseFloat(calculations.remodelCostMin)}
                    target={remodelTarget}
                    max={parseFloat(calculations.remodelCostMax)}
                    onChange={setRemodelTargetCost}
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
                      checked={historicPropertyMultiplier === 1.2} 
                      onCheckedChange={(checked) => {
                        setIsHistoric(checked);
                        setHistoricPropertyMultiplier(checked ? 1.2 : 1.0);
                      }}
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
                        <Badge>{formatPercent(calculatedNewBudget / parseFloat(calculatedTotalBudget.toString() || "1"))}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{formatCurrency(calculatedNewBudget)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatNumber(newBuildingArea)} ft² × {formatCurrency(newConstructionTarget)}/ft²
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Remodel Budget</span>
                        <Badge>{formatPercent(calculatedRemodelBudget / parseFloat(calculatedTotalBudget.toString() || "1"))}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(calculatedRemodelBudget)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatNumber(existingBuildingArea)} ft² × {formatCurrency(remodelTarget)}/ft²
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

                  <div className="grid grid-cols-2 gap-4">
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
                              value={shellShareOverride ? shellShareOverride * 100 : 70}
                              onChange={(e) => {
                                const val = e.target.value;
                                setShellShareOverride(val ? parseFloat(val) / 100 : undefined);
                              }}
                              placeholder="70.0"
                              className="w-16 h-8 text-xs"
                              min={0}
                              max={100}
                              step={1}
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
                              value={interiorShareOverride ? interiorShareOverride * 100 : 20}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInteriorShareOverride(val ? parseFloat(val) / 100 : undefined);
                              }}
                              placeholder="20.0"
                              className="w-16 h-8 text-xs"
                              min={0}
                              max={100}
                              step={1}
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
                              value={landscapeShareOverride ? landscapeShareOverride * 100 : 10}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLandscapeShareOverride(val ? parseFloat(val) / 100 : undefined);
                              }}
                              placeholder="10.0"
                              className="w-16 h-8 text-xs"
                              min={0}
                              max={100}
                              step={1}
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

        {/* Professional Fees Analysis with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Professional Fees Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="topdown" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="inputs" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Inputs
                </TabsTrigger>
                <TabsTrigger value="budget-allocation" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Budget
                </TabsTrigger>
                <TabsTrigger value="discipline-budgets" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Disciplines
                </TabsTrigger>
                <TabsTrigger value="topdown" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top-Down
                </TabsTrigger>
                <TabsTrigger value="bottomup" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Bottom-Up
                </TabsTrigger>
                <TabsTrigger value="sanity-check" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Analysis
                </TabsTrigger>
              </TabsList>

              {/* Inputs Tab - Discipline Percentage Controls */}
              <TabsContent value="inputs" className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-semibold mb-3">Engineering Discipline Percentages</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Structural %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={structuralShareOverride ? structuralShareOverride * 100 : 35}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStructuralShareOverride(val ? parseFloat(val) / 100 : undefined);
                          }}
                          placeholder="35.0"
                          className="h-8"
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Civil %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={civilShareOverride ? civilShareOverride * 100 : 7}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCivilShareOverride(val ? parseFloat(val) / 100 : undefined);
                          }}
                          placeholder="7.0"
                          className="h-8"
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Mechanical %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={mechanicalShareOverride ? mechanicalShareOverride * 100 : 10}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMechanicalShareOverride(val ? parseFloat(val) / 100 : undefined);
                          }}
                          placeholder="10.0"
                          className="h-8"
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Electrical %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={electricalShareOverride ? electricalShareOverride * 100 : 8}
                          onChange={(e) => {
                            const val = e.target.value;
                            setElectricalShareOverride(val ? parseFloat(val) / 100 : undefined);
                          }}
                          placeholder="8.0"
                          className="h-8"
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Plumbing %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={plumbingShareOverride ? plumbingShareOverride * 100 : 5}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPlumbingShareOverride(val ? parseFloat(val) / 100 : undefined);
                          }}
                          placeholder="5.0"
                          className="h-8"
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Telecom %</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={telecomShareOverride ? telecomShareOverride * 100 : 3}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTelecomShareOverride(val ? parseFloat(val) / 100 : undefined);
                          }}
                          placeholder="3.0"
                          className="h-8"
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold mb-3">Fee Adjustment Multipliers</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Architecture', value: architectureFeeAdjustment, setter: setArchitectureFeeAdjustment },
                      { label: 'Interior', value: interiorFeeAdjustment, setter: setInteriorFeeAdjustment },
                      { label: 'Landscape', value: landscapeFeeAdjustment, setter: setLandscapeFeeAdjustment },
                      { label: 'Structural', value: structuralFeeAdjustment, setter: setStructuralFeeAdjustment },
                      { label: 'Civil', value: civilFeeAdjustment, setter: setCivilFeeAdjustment },
                      { label: 'Mechanical', value: mechanicalFeeAdjustment, setter: setMechanicalFeeAdjustment },
                      { label: 'Electrical', value: electricalFeeAdjustment, setter: setElectricalFeeAdjustment },
                      { label: 'Plumbing', value: plumbingFeeAdjustment, setter: setPlumbingFeeAdjustment },
                      { label: 'Telecom', value: telecomFeeAdjustment, setter: setTelecomFeeAdjustment },
                    ].map(({ label, value, setter }) => (
                      <div key={label} className="space-y-2">
                        <Label className="text-xs">{label}</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[value]}
                            onValueChange={(v) => setter(v[0])}
                            max={2}
                            min={0.5}
                            step={0.05}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="w-12 text-xs">
                            {value.toFixed(2)}x
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="topdown" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Total Market Fee</Label>
                      <UITooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Sum of all discipline market fees</p>
                        </TooltipContent>
                      </UITooltip>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalMarketFee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercent(totalMarketFee / parseFloat(calculatedTotalBudget.toString() || "1"))} of construction
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Total Louis Amy Fee</Label>
                      <UITooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Sum of in-house service fees</p>
                        </TooltipContent>
                      </UITooltip>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totalLouisAmyFee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercent(totalLouisAmyFee / parseFloat(calculatedTotalBudget.toString() || "1"))} of construction
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Detailed Fee Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold">Detailed Fee Analysis by Discipline</Label>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Coordination Fee</Label>
                      <Input
                        type="number"
                        value={coordinationFeePercent}
                        onChange={(e) => setCoordinationFeePercent(parseFloat(e.target.value))}
                        className="w-16 h-8 text-xs"
                        min={10}
                        max={25}
                        step={1}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Discipline</th>
                          <th className="text-right py-2">% of Cost</th>
                          <th className="text-right py-2">Rate/ft²</th>
                          <th className="text-right py-2">Market Fee</th>
                          <th className="text-right py-2">Louis Amy</th>
                          <th className="text-right py-2">Consultant</th>
                          <th className="text-right py-2">Coordination</th>
                          <th className="text-center py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees && fees.map((fee) => {
                          const coordinationFee = !fee.isInhouse ? parseFloat(fee.consultantFee || "0") * (coordinationFeePercent / 100) : 0;
                          return (
                            <tr key={fee.scope} className="border-b hover:bg-gray-50">
                              <td className="py-2">{fee.scope}</td>
                              <td className="text-right py-2">{formatPercent(parseFloat(fee.percentOfCost || "0"))}</td>
                              <td className="text-right py-2">${formatNumber(parseFloat(fee.ratePerSqFt || "0"), 2)}</td>
                              <td className="text-right py-2 font-medium">{formatCurrency(parseFloat(fee.marketFee))}</td>
                              <td className="text-right py-2">{fee.isInhouse ? formatCurrency(parseFloat(fee.louisAmyFee)) : '-'}</td>
                              <td className="text-right py-2">{!fee.isInhouse ? formatCurrency(parseFloat(fee.consultantFee || "0")) : '-'}</td>
                              <td className="text-right py-2">{!fee.isInhouse ? formatCurrency(coordinationFee) : '-'}</td>
                              <td className="text-center py-2">
                                <Badge variant={fee.isInhouse ? "default" : "secondary"} className="text-xs">
                                  {fee.isInhouse ? "In-House" : "Outsourced"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-semibold">
                          <td className="py-2">TOTAL</td>
                          <td className="text-right py-2">{formatPercent(totalMarketFee / parseFloat(calculatedTotalBudget.toString() || "1"))}</td>
                          <td className="text-right py-2">${formatNumber(totalMarketFee / (newBuildingArea + existingBuildingArea || 1), 2)}</td>
                          <td className="text-right py-2">{formatCurrency(totalMarketFee)}</td>
                          <td className="text-right py-2">{formatCurrency(totalLouisAmyFee)}</td>
                          <td className="text-right py-2">{formatCurrency(totalConsultantFee)}</td>
                          <td className="text-right py-2">{formatCurrency(totalConsultantFee * (coordinationFeePercent / 100))}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bottomup" className="space-y-4 mt-4">
                {/* Input Parameters */}
                <div>
                  <Label className="text-sm font-semibold mb-3">Bottom-Up Parameters</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Labor Rate ($/hr)</Label>
                      <Input
                        type="number"
                        value={laborRateOverride || 40}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLaborRateOverride(val ? parseFloat(val) : undefined);
                        }}
                        className="h-8"
                        min={20}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Overhead Rate ($/hr)</Label>
                      <Input
                        type="number"
                        value={overheadRateOverride || 50}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOverheadRateOverride(val ? parseFloat(val) : undefined);
                        }}
                        className="h-8"
                        min={20}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Markup Factor</Label>
                      <Input
                        type="number"
                        value={markupFactorOverride || 2.2}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMarkupFactorOverride(val ? parseFloat(val) : undefined);
                        }}
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
                          value={contractDiscountOverride * 100}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContractDiscountOverride(val ? parseFloat(val) / 100 : 0);
                          }}
                          className="h-8"
                          min={0}
                          max={50}
                          step={5}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Calculation Breakdown */}
                <div>
                  <Label className="text-sm font-semibold mb-3">Fee Calculation Breakdown</Label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Total Hours</span>
                        <UITooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Based on area × hours/ft² factor</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <span className="text-lg font-bold">
                        {totalHours.toFixed(0)} hrs
                      </span>
                    </div>

                    <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">× Labor Rate</span>
                        <span className="text-sm">${laborRateOverride || 40}/hr</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Labor Cost</span>
                        <span className="font-medium">{formatCurrency(totalHours * (laborRateOverride || 40))}</span>
                      </div>
                    </div>

                    <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">+ Overhead</span>
                        <span className="text-sm">${overheadRateOverride || 50}/hr × {totalHours.toFixed(0)} hrs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">With Overhead</span>
                        <span className="font-medium">{formatCurrency(totalHours * ((laborRateOverride || 40) + (overheadRateOverride || 50)))}</span>
                      </div>
                    </div>

                    <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">× Markup</span>
                        <span className="text-sm">{(((markupFactorOverride || 2.2) - 1) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">With Markup</span>
                        <span className="font-medium">{formatCurrency(totalHours * ((laborRateOverride || 40) + (overheadRateOverride || 50)) * (markupFactorOverride || 2.2))}</span>
                      </div>
                    </div>

                    {contractDiscountOverride > 0 && (
                      <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">- Discount</span>
                          <span className="text-sm">{(contractDiscountOverride * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}

                    <Separator className="my-3" />

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold">Bottom-Up Fee</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalHours * ((laborRateOverride || 40) + (overheadRateOverride || 50)) * (markupFactorOverride || 2.2) * (1 - contractDiscountOverride))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparison with Top-Down */}
                <div>
                  <Label className="text-sm font-semibold mb-3">Top-Down vs Bottom-Up Comparison</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Top-Down (Market)</div>
                      <div className="text-lg font-bold">{formatCurrency(totalMarketFee)}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Bottom-Up</div>
                      <div className="text-lg font-bold">{formatCurrency(totalHours * ((laborRateOverride || 40) + (overheadRateOverride || 50)) * (markupFactorOverride || 2.2) * (1 - contractDiscountOverride))}</div>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        Variance: {formatPercent(Math.abs((totalHours * ((laborRateOverride || 40) + (overheadRateOverride || 50)) * (markupFactorOverride || 2.2) * (1 - contractDiscountOverride) - totalMarketFee) / totalMarketFee))}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Sanity Check & Analysis */}
              <TabsContent value="sanity-check">
                <Card>
                  <CardHeader>
                    <CardTitle>Comprehensive Sanity Checks</CardTitle>
                    <CardDescription>Review key project metrics for potential discrepancies.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Hours per SqFt Check */}
                      <div>
                        <Label className="text-sm font-semibold">Hours per SqFt Analysis</Label>
                        <div className="p-4 border rounded-lg mt-2">
                          {(() => {
                            const totalHours = hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0;
                            const totalArea = newBuildingArea + existingBuildingArea;
                            const hoursPerSqFtActual = totalArea > 0 ? totalHours / totalArea : 0;
                            let status = 'info';
                            let message = `Actual: ${hoursPerSqFtActual.toFixed(2)} hrs/ft²`;

                            if (hoursPerSqFtActual < 0.2) {
                              status = 'error';
                              message += ' (Unusually Low)';
                            } else if (hoursPerSqFtActual < 0.3) {
                              status = 'warning';
                              message += ' (Low)';
                            } else if (hoursPerSqFtActual > 2.0) {
                              status = 'error';
                              message += ' (Unusually High)';
                            } else if (hoursPerSqFtActual > 1.5) {
                              status = 'warning';
                              message += ' (High)';
                            }

                            return <Alert variant={status === 'error' ? 'destructive' : 'default'}>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{message}</AlertDescription>
                            </Alert>;
                          })()}
                        </div>
                      </div>

                      <Separator />

                      {/* Fee Variance Check */}
                      <div>
                        <Label className="text-sm font-semibold">Fee Variance (Top-Down vs Bottom-Up)</Label>
                        <div className="p-4 border rounded-lg mt-2">
                          {(() => {
                            const bottomUpFee = totalHours * ((laborRateOverride || 40) + (overheadRateOverride || 50)) * (markupFactorOverride || 2.2) * (1 - contractDiscountOverride);
                            const variance = totalMarketFee ? Math.abs((bottomUpFee - totalMarketFee) / totalMarketFee) : 0;
                            let status = 'info';
                            let message = `Variance: ${formatPercent(variance)}`;

                            if (variance > 0.5) {
                              status = 'error';
                              message += ' (High)';
                            } else if (variance > 0.25) {
                              status = 'warning';
                              message += ' (Moderate)';
                            } else {
                              status = 'success';
                              message += ' (Normal)';
                            }

                            return <Alert variant={status === 'error' ? 'destructive' : 'default'}>
                              <Activity className="h-4 w-4" />
                              <AlertDescription>{message}</AlertDescription>
                            </Alert>;
                          })()}
                        </div>
                      </div>

                      <Separator />

                      {/* Missing Discipline Shares */}
                      <div>
                        <Label className="text-sm font-semibold">Missing Discipline Shares</Label>
                        <div className="p-4 border rounded-lg mt-2">
                          {(() => {
                            const missingShares = [
                              { label: 'Structural', value: structuralShareOverride },
                              { label: 'Civil', value: civilShareOverride },
                              { label: 'Mechanical', value: mechanicalShareOverride },
                              { label: 'Electrical', value: electricalShareOverride },
                              { label: 'Plumbing', value: plumbingShareOverride },
                              { label: 'Telecom', value: telecomShareOverride },
                            ].filter(share => share.value === undefined || share.value === null);

                            if (missingShares.length > 0) {
                              return <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Please define share overrides for: {missingShares.map(s => s.label).join(', ')}.
                                </AlertDescription>
                              </Alert>;
                            } else {
                              return <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>All discipline share overrides are defined.</AlertDescription>
                              </Alert>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Advanced Settings</CardTitle>
                <CardDescription>Configure calculation methods and discipline assignments</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {Object.keys(savedPresets).length > 0 && (
                  <Select onValueChange={loadPreset}>
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="Load preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(savedPresets).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  type="text"
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-32 h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => savePreset()}
                  disabled={!presetName}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportConfiguration()}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById('import-config')?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Import
                </Button>
                <input
                  id="import-config"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        try {
                          const config = JSON.parse(evt.target?.result as string);
                          // Apply imported configuration
                          if (config.overrides) {
                            setShellShareOverride(config.overrides.shellShareOverride);
                            setInteriorShareOverride(config.overrides.interiorShareOverride);
                            setLandscapeShareOverride(config.overrides.landscapeShareOverride);
                            setStructuralShareOverride(config.overrides.structuralShareOverride);
                            setCivilShareOverride(config.overrides.civilShareOverride);
                            setMechanicalShareOverride(config.overrides.mechanicalShareOverride);
                            setElectricalShareOverride(config.overrides.electricalShareOverride);
                            setPlumbingShareOverride(config.overrides.plumbingShareOverride);
                            setTelecomShareOverride(config.overrides.telecomShareOverride);
                            setLaborRateOverride(config.overrides.laborRateOverride);
                            setOverheadRateOverride(config.overrides.overheadRateOverride);
                            setMarkupFactorOverride(config.overrides.markupFactorOverride);
                            setContractDiscountOverride(config.overrides.contractDiscountOverride);
                          }
                        } catch (err) {
                          console.error('Failed to import configuration:', err);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Non-Linear Hours Formula */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Non-Linear Hours Formula</Label>
                    <p className="text-xs text-muted-foreground">Use logarithmic formula for hours calculation</p>
                  </div>
                  <Switch
                    checked={useNonLinearHours}
                    onCheckedChange={setUseNonLinearHours}
                  />
                </div>
                {useNonLinearHours && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs">Formula: hours = 1000 × (1 + ln(totalFee / 100,000))</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* In-House vs Outsourced Toggles */}
              <div>
                <Label className="text-sm font-semibold mb-3">In-House vs Outsourced Services</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'architecture', label: 'Architecture', default: true },
                    { key: 'interiorDesign', label: 'Interior Design', default: true },
                    { key: 'landscape', label: 'Landscape', default: true },
                    { key: 'structural', label: 'Structural', default: false },
                    { key: 'civil', label: 'Civil', default: false },
                    { key: 'mechanical', label: 'Mechanical', default: false },
                    { key: 'electrical', label: 'Electrical', default: false },
                    { key: 'plumbing', label: 'Plumbing', default: false },
                    { key: 'telecom', label: 'Telecom', default: false }
                  ].map((discipline) => (
                    <div key={discipline.key} className="flex items-center justify-between p-2 border rounded-lg">
                      <span className="text-sm">{discipline.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={disciplineInhouse[discipline.key as keyof typeof disciplineInhouse] ? 'default' : 'secondary'}>
                          {disciplineInhouse[discipline.key as keyof typeof disciplineInhouse] ? 'In-House' : 'Outsourced'}
                        </Badge>
                        <Switch
                          checked={disciplineInhouse[discipline.key as keyof typeof disciplineInhouse]}
                          onCheckedChange={(checked) => 
                            setDisciplineInhouse({ ...disciplineInhouse, [discipline.key]: checked })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Scan to BIM Settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Scan to BIM</Label>
                    <p className="text-xs text-muted-foreground">Enable 3D scanning and BIM model generation</p>
                  </div>
                  <Switch
                    checked={scanToBimEnabled}
                    onCheckedChange={setScanToBimEnabled}
                  />
                </div>
                {scanToBimEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Scan Area (ft²)</Label>
                      <Input
                        type="number"
                        value={scanToBimArea}
                        onChange={(e) => setScanToBimArea(parseFloat(e.target.value))}
                        className="h-8"
                        min={0}
                        step={1000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Rate ($/ft²)</Label>
                      <Input
                        type="number"
                        value={scanToBimRate}
                        onChange={(e) => setScanToBimRate(parseFloat(e.target.value))}
                        className="h-8"
                        min={0}
                        max={5}
                        step={0.1}
                      />
                    </div>
                    {scanToBimArea > 0 && (
                      <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Scan to BIM Cost</span>
                          <span className="font-semibold">{formatCurrency(scanToBimArea * scanToBimRate * categoryMultiplier)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hours Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hours Distribution & Analysis</CardTitle>
            <CardDescription>Comprehensive phase-based hours allocation with role distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Total Hours Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <Label className="text-sm font-semibold">Total Project Hours</Label>
                    {useNonLinearHours && (
                      <Badge variant="secondary" className="text-xs">
                        Non-Linear Formula
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatNumber(totalHours, 0)} hrs
                  </div>
                </div>
              </div>

              {/* Sanity Checks */}
              <div className="space-y-2">
                {(() => {
                  const totalHours = hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0;
                  const totalArea = newBuildingArea + existingBuildingArea;
                  const hoursPerSqFtActual = totalArea > 0 ? totalHours / totalArea : 0;
                  const warnings = [];

                  if (hoursPerSqFtActual < 0.2) {
                    warnings.push({ level: 'error', message: 'Hours per ft² is unusually low (< 0.2)' });
                  } else if (hoursPerSqFtActual < 0.3) {
                    warnings.push({ level: 'warning', message: 'Hours per ft² is low (< 0.3)' });
                  }

                  if (hoursPerSqFtActual > 2.0) {
                    warnings.push({ level: 'error', message: 'Hours per ft² is unusually high (> 2.0)' });
                  } else if (hoursPerSqFtActual > 1.5) {
                    warnings.push({ level: 'warning', message: 'Hours per ft² is high (> 1.5)' });
                  }

                  const bottomUpFee = totalHours * ((laborRateOverride || 35.73) + (overheadRateOverride || 46.10)) * (markupFactorOverride || 2.0) * (1 - contractDiscountOverride / 100);
                  const variance = totalMarketFee ? Math.abs((bottomUpFee - totalMarketFee) / totalMarketFee) : 0;

                  if (variance > 0.5) {
                    warnings.push({ level: 'error', message: `Fee variance exceeds 50% (${(variance * 100).toFixed(0)}%)` });
                  } else if (variance > 0.25) {
                    warnings.push({ level: 'warning', message: `Fee variance exceeds 25% (${(variance * 100).toFixed(0)}%)` });
                  }

                  return warnings.length > 0 ? (
                    <div className="space-y-2">
                      {warnings.map((warning, idx) => (
                        <div key={idx} className={`p-2 rounded-lg flex items-center gap-2 ${
                          warning.level === 'error' 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-amber-50 border border-amber-200'
                        }`}>
                          <AlertCircle className={`h-4 w-4 ${
                            warning.level === 'error' ? 'text-red-600' : 'text-amber-600'
                          }`} />
                          <span className={`text-sm ${
                            warning.level === 'error' ? 'text-red-800' : 'text-amber-800'
                          }`}>
                            {warning.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">All metrics within normal ranges</span>
                    </div>
                  );
                })()}
              </div>

              <Separator />

              {/* Missing Discipline Shares */}
              <div>
                <Label className="text-sm font-semibold">Missing Discipline Shares</Label>
                <div className="p-4 border rounded-lg mt-2">
                  {(() => {
                    const missingShares = [
                      { label: 'Structural', value: structuralShareOverride },
                      { label: 'Civil', value: civilShareOverride },
                      { label: 'Mechanical', value: mechanicalShareOverride },
                      { label: 'Electrical', value: electricalShareOverride },
                      { label: 'Plumbing', value: plumbingShareOverride },
                      { label: 'Telecom', value: telecomShareOverride },
                    ].filter(share => share.value === undefined || share.value === null);

                    if (missingShares.length > 0) {
                      return <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Please define share overrides for: {missingShares.map(s => s.label).join(', ')}.
                        </AlertDescription>
                      </Alert>;
                    } else {
                      return <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>All discipline share overrides are defined.</AlertDescription>
                      </Alert>;
                    }
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase-Based Hours Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hours Distribution</CardTitle>
            <CardDescription>Detailed phase and role distribution for project hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Phase-Based Hours Table */}
              <div>
                <Label className="text-sm font-semibold mb-3">Detailed Phase & Role Distribution</Label>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2 text-left text-xs font-medium">Phase</th>
                        <th className="border p-2 text-right text-xs font-medium">Total Hours</th>
                        <th className="border p-2 text-right text-xs font-medium">%</th>
                        <th className="border p-2 text-right text-xs font-medium">Designer 1</th>
                        <th className="border p-2 text-right text-xs font-medium">Designer 2</th>
                        <th className="border p-2 text-right text-xs font-medium">Architect</th>
                        <th className="border p-2 text-right text-xs font-medium">Engineer</th>
                        <th className="border p-2 text-right text-xs font-medium">Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hours && hours.map((hour, idx) => {
                        const totalProjectHours = hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0);
                        return (
                          <tr key={hour.phase} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="border p-2 text-xs font-medium">{hour.phase}</td>
                            <td className="border p-2 text-right text-xs">{parseFloat(hour.totalHours).toFixed(0)}</td>
                            <td className="border p-2 text-right text-xs">
                              {totalProjectHours > 0 ? ((parseFloat(hour.totalHours) / totalProjectHours) * 100).toFixed(0) : '0'}%
                            </td>
                            <td className="border p-2 text-right text-xs">{parseFloat(hour.designer1Hours || '0').toFixed(0)}</td>
                            <td className="border p-2 text-right text-xs">{parseFloat(hour.designer2Hours || '0').toFixed(0)}</td>
                            <td className="border p-2 text-right text-xs">{parseFloat(hour.architectHours || '0').toFixed(0)}</td>
                            <td className="border p-2 text-right text-xs">{parseFloat(hour.engineerHours || '0').toFixed(0)}</td>
                            <td className="border p-2 text-right text-xs">{parseFloat(hour.principalHours || '0').toFixed(0)}</td>
                          </tr>
                        );
                      })}
                      {hours && (
                        <tr className="font-semibold bg-gray-100">
                          <td className="border p-2 text-xs">Total</td>
                          <td className="border p-2 text-right text-xs">
                            {hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0).toFixed(0)}
                          </td>
                          <td className="border p-2 text-right text-xs">100%</td>
                          <td className="border p-2 text-right text-xs">
                            {hours.reduce((sum, h) => sum + parseFloat(h.designer1Hours || '0'), 0).toFixed(0)}
                          </td>
                          <td className="border p-2 text-right text-xs">
                            {hours.reduce((sum, h) => sum + parseFloat(h.designer2Hours || '0'), 0).toFixed(0)}
                          </td>
                          <td className="border p-2 text-right text-xs">
                            {hours.reduce((sum, h) => sum + parseFloat(h.architectHours || '0'), 0).toFixed(0)}
                          </td>
                          <td className="border p-2 text-right text-xs">
                            {hours.reduce((sum, h) => sum + parseFloat(h.engineerHours || '0'), 0).toFixed(0)}
                          </td>
                          <td className="border p-2 text-right text-xs">
                            {hours.reduce((sum, h) => sum + parseFloat(h.principalHours || '0'), 0).toFixed(0)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Distribution Chart */}
              <div>
                <Label className="text-sm font-semibold mb-3">Role Distribution Overview</Label>
                <div className="space-y-3">
                  {[
                    { label: "Designer 1", key: "designer1Hours", color: "bg-blue-500" },
                    { label: "Designer 2", key: "designer2Hours", color: "bg-green-500" },
                    { label: "Architect", key: "architectHours", color: "bg-purple-500" },
                    { label: "Engineer", key: "engineerHours", color: "bg-orange-500" },
                    { label: "Principal", key: "principalHours", color: "bg-red-500" }
                  ].map((role) => {
                    const roleHours = hours?.reduce((sum, h) => 
                      sum + parseFloat(h[role.key as keyof typeof h] as string || "0"), 0
                    ) || 0;
                    const totalHours = hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 1;
                    const percentage = (roleHours / totalHours) * 100;

                    return (
                      <div key={role.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{role.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{roleHours.toFixed(0)} hrs</span>
                            <Badge variant="outline" className="text-xs">
                              {percentage.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="relative w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`absolute left-0 top-0 h-full ${role.color} opacity-80 transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hours Configuration */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <Label className="text-sm font-semibold mb-3">Hours Configuration</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Hours per ft² Factor</Label>
                    <div className="flex items-center gap-2 mt-1">
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
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-xs">Effective Rate</span>
                    <span className="text-sm font-bold">
                      {formatNumber((newBuildingArea + existingBuildingArea) * hoursPerSqFt * categoryMultiplier, 0)} hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}