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
  const [historicPropertyMultiplier, setHistoricPropertyMultiplier] = useState<number>(1.0);
  
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
  const [telecomShareOverride, setTelecomShareOverride] = useState<number | undefined>();
  
  // Non-linear hours and In-house/Outsourced toggles
  const [useNonLinearHours, setUseNonLinearHours] = useState(false);
  const [disciplineInhouse, setDisciplineInhouse] = useState({
    architecture: true,
    interiorDesign: true,
    landscape: true,
    structural: false,
    civil: false,
    mechanical: false,
    electrical: false,
    plumbing: false,
    telecom: false
  });
  
  // Scan to BIM settings
  const [scanToBimEnabled, setScanToBimEnabled] = useState(false);
  const [scanToBimArea, setScanToBimArea] = useState(0);
  const [scanToBimRate, setScanToBimRate] = useState(0.5);
  
  // UI Controls
  const [autoRecalc, setAutoRecalc] = useState(true);
  
  // Preset Management
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<Record<string, any>>({});
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
        historicMultiplier: historicPropertyMultiplier,
        remodelMultiplier: params?.remodelMultiplier ?? remodelMultiplier,
        newConstructionTargetCost: newConstructionTarget,
        remodelTargetCost: remodelTarget,
        shellShareOverride,
        interiorShareOverride,
        landscapeShareOverride,
        architecturePercentageOverride: architecturePercentage,
        interiorDesignPercentageOverride: interiorDesignPercentage,
        landscapePercentageOverride: landscapePercentage,
        structuralPercentageOverride: structuralPercentage,
        civilPercentageOverride: civilPercentage,
        mechanicalPercentageOverride: mechanicalPercentage,
        electricalPercentageOverride: electricalPercentage,
        plumbingPercentageOverride: plumbingPercentage,
        telecomPercentageOverride: telecomPercentage,
        categoryMultiplier,
        coordinationFeePercent,
        useNonLinearHours,
        architectureInhouse: disciplineInhouse.architecture,
        interiorDesignInhouse: disciplineInhouse.interiorDesign,
        landscapeInhouse: disciplineInhouse.landscape,
        structuralInhouse: disciplineInhouse.structural,
        civilInhouse: disciplineInhouse.civil,
        mechanicalInhouse: disciplineInhouse.mechanical,
        electricalInhouse: disciplineInhouse.electrical,
        plumbingInhouse: disciplineInhouse.plumbing,
        telecomInhouse: disciplineInhouse.telecom,
        scanToBimEnabled,
        scanToBimArea,
        scanToBimRate
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
      
      // Load saved presets from localStorage
      const storedPresets = localStorage.getItem('projectPresets');
      if (storedPresets) {
        setSavedPresets(JSON.parse(storedPresets));
      }
    }
  }, [data]);
  
  // Preset management functions
  const savePreset = () => {
    if (!presetName) return;
    
    const preset = {
      name: presetName,
      timestamp: new Date().toISOString(),
      configuration: {
        // Cost and budget settings
        newConstructionTarget,
        remodelTarget,
        shellShareOverride,
        interiorShareOverride,
        landscapeShareOverride,
        
        // Discipline percentages
        architecturePercentage,
        interiorDesignPercentage,
        landscapePercentage,
        structuralPercentage,
        civilPercentage,
        mechanicalPercentage,
        electricalPercentage,
        plumbingPercentage,
        telecomPercentage,
        
        // Bottom-up settings
        laborRate,
        overheadRate,
        markupFactor,
        discountPercent,
        
        // Advanced settings
        useNonLinearHours,
        disciplineInhouse,
        scanToBimEnabled,
        scanToBimArea,
        scanToBimRate,
        
        // Other settings
        categoryMultiplier,
        coordinationFeePercent,
        hoursPerSqFt
      }
    };
    
    const updatedPresets = { ...savedPresets, [presetName]: preset };
    setSavedPresets(updatedPresets);
    localStorage.setItem('projectPresets', JSON.stringify(updatedPresets));
    setPresetName('');
  };
  
  const loadPreset = (presetKey: string) => {
    const preset = savedPresets[presetKey];
    if (!preset) return;
    
    const config = preset.configuration;
    
    // Apply all settings from the preset
    setNewConstructionTarget(config.newConstructionTarget);
    setRemodelTarget(config.remodelTarget);
    setShellShareOverride(config.shellShareOverride);
    setInteriorShareOverride(config.interiorShareOverride);
    setLandscapeShareOverride(config.landscapeShareOverride);
    
    setArchitecturePercentage(config.architecturePercentage);
    setInteriorDesignPercentage(config.interiorDesignPercentage);
    setLandscapePercentage(config.landscapePercentage);
    setStructuralPercentage(config.structuralPercentage);
    setCivilPercentage(config.civilPercentage);
    setMechanicalPercentage(config.mechanicalPercentage);
    setElectricalPercentage(config.electricalPercentage);
    setPlumbingPercentage(config.plumbingPercentage);
    setTelecomPercentage(config.telecomPercentage);
    
    setLaborRate(config.laborRate);
    setOverheadRate(config.overheadRate);
    setMarkupFactor(config.markupFactor);
    setDiscountPercent(config.discountPercent);
    
    setUseNonLinearHours(config.useNonLinearHours);
    setDisciplineInhouse(config.disciplineInhouse);
    setScanToBimEnabled(config.scanToBimEnabled);
    setScanToBimArea(config.scanToBimArea);
    setScanToBimRate(config.scanToBimRate);
    
    setCategoryMultiplier(config.categoryMultiplier);
    setCoordinationFeePercent(config.coordinationFeePercent);
    setHoursPerSqFt(config.hoursPerSqFt);
  };
  
  const exportConfiguration = () => {
    const config = {
      exportDate: new Date().toISOString(),
      projectName: data?.project?.projectName || 'Unknown',
      configuration: {
        newConstructionTarget,
        remodelTarget,
        shellShareOverride,
        interiorShareOverride,
        landscapeShareOverride,
        architecturePercentage,
        interiorDesignPercentage,
        landscapePercentage,
        structuralPercentage,
        civilPercentage,
        mechanicalPercentage,
        electricalPercentage,
        plumbingPercentage,
        telecomPercentage,
        laborRate,
        overheadRate,
        markupFactor,
        discountPercent,
        useNonLinearHours,
        disciplineInhouse,
        scanToBimEnabled,
        scanToBimArea,
        scanToBimRate,
        categoryMultiplier,
        coordinationFeePercent,
        hoursPerSqFt
      }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.configuration) {
          const c = config.configuration;
          setNewConstructionTarget(c.newConstructionTarget);
          setRemodelTarget(c.remodelTarget);
          setShellShareOverride(c.shellShareOverride);
          setInteriorShareOverride(c.interiorShareOverride);
          setLandscapeShareOverride(c.landscapeShareOverride);
          setArchitecturePercentage(c.architecturePercentage);
          setInteriorDesignPercentage(c.interiorDesignPercentage);
          setLandscapePercentage(c.landscapePercentage);
          setStructuralPercentage(c.structuralPercentage);
          setCivilPercentage(c.civilPercentage);
          setMechanicalPercentage(c.mechanicalPercentage);
          setElectricalPercentage(c.electricalPercentage);
          setPlumbingPercentage(c.plumbingPercentage);
          setTelecomPercentage(c.telecomPercentage);
          setLaborRate(c.laborRate);
          setOverheadRate(c.overheadRate);
          setMarkupFactor(c.markupFactor);
          setDiscountPercent(c.discountPercent);
          setUseNonLinearHours(c.useNonLinearHours);
          setDisciplineInhouse(c.disciplineInhouse);
          setScanToBimEnabled(c.scanToBimEnabled);
          setScanToBimArea(c.scanToBimArea);
          setScanToBimRate(c.scanToBimRate);
          setCategoryMultiplier(c.categoryMultiplier);
          setCoordinationFeePercent(c.coordinationFeePercent);
          setHoursPerSqFt(c.hoursPerSqFt);
        }
      } catch (error) {
        console.error('Failed to import configuration:', error);
      }
    };
    reader.readAsText(file);
  };

  // Auto-recalculate when parameters change with debounce
  useEffect(() => {
    if (autoRecalc && data?.project) {
      const timeoutId = setTimeout(() => {
        recalculateMutation.mutate(undefined);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    newBuildingArea, existingBuildingArea, siteArea, remodelMultiplier, isHistoric, historicPropertyMultiplier,
    newConstructionTarget, remodelTarget, shellShareOverride, interiorShareOverride, landscapeShareOverride,
    architecturePercentage, interiorDesignPercentage, landscapePercentage,
    structuralPercentage, civilPercentage, mechanicalPercentage,
    electricalPercentage, plumbingPercentage, telecomPercentage, telecomShareOverride,
    categoryMultiplier, coordinationFeePercent, useNonLinearHours, hoursPerSqFt,
    laborRate, overheadRate, markupFactor, discountPercent, discountRate,
    disciplineInhouse, scanToBimEnabled, scanToBimArea, scanToBimRate, autoRecalc
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
                              value={shellShareOverride ? shellShareOverride * 100 : 66}
                              onChange={(e) => setShellShareOverride(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
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
                              value={interiorShareOverride ? interiorShareOverride * 100 : 22}
                              onChange={(e) => setInteriorShareOverride(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
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
                              value={landscapeShareOverride ? landscapeShareOverride * 100 : 12}
                              onChange={(e) => setLandscapeShareOverride(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
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

        {/* Shell Budget Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Shell Budget Allocation</CardTitle>
            <CardDescription>Budget allocation and percentage overrides for shell components including architecture and engineering disciplines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Architecture */}
              <div className="p-4 rounded-lg border bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Architecture</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Architectural design and shell coordination</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold text-violet-700 dark:text-violet-400 mb-2">
                  {formatCurrency(parseFloat(calculations.architectureBudget || "0"))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {((parseFloat(calculations.architectureBudget || "0") / parseFloat(calculations.shellBudgetTotal || "1")) * 100).toFixed(1)}% of shell budget
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="text-muted-foreground">New</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.architectureBudget || "0") * newBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div className="text-muted-foreground">Remodel</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.architectureBudget || "0") * existingBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={architecturePercentage ? architecturePercentage * 100 : ''}
                    onChange={(e) => setArchitecturePercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="Auto"
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={50}
                    step={1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Structural */}
              <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Structural</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Structural engineering and design</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                  {formatCurrency(parseFloat(calculations.structuralBudget || "0"))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {((parseFloat(calculations.structuralBudget || "0") / parseFloat(calculations.shellBudgetTotal || "1")) * 100).toFixed(1)}% of shell budget
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="text-muted-foreground">New</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.structuralBudget || "0") * newBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div className="text-muted-foreground">Remodel</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.structuralBudget || "0") * existingBuildingArea * remodelMultiplier) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={structuralPercentage ? structuralPercentage * 100 : ''}
                    onChange={(e) => setStructuralPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="Auto"
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Civil */}
              <div className="p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Civil</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Site work and civil engineering</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold text-orange-700 dark:text-orange-400 mb-2">
                  {formatCurrency(parseFloat(calculations.civilBudget || "0"))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {((parseFloat(calculations.civilBudget || "0") / parseFloat(calculations.shellBudgetTotal || "1")) * 100).toFixed(1)}% of shell budget
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="text-muted-foreground">New</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.civilBudget || "0") * newBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div className="text-muted-foreground">Remodel</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.civilBudget || "0") * existingBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={civilPercentage ? civilPercentage * 100 : ''}
                    onChange={(e) => setCivilPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="Auto"
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Mechanical */}
              <div className="p-4 rounded-lg border bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Mechanical</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">HVAC and mechanical systems</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                  {formatCurrency(parseFloat(calculations.mechanicalBudget || "0"))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {((parseFloat(calculations.mechanicalBudget || "0") / parseFloat(calculations.shellBudgetTotal || "1")) * 100).toFixed(1)}% of shell budget
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="text-muted-foreground">New</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.mechanicalBudget || "0") * newBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div className="text-muted-foreground">Remodel</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.mechanicalBudget || "0") * existingBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={mechanicalPercentage ? mechanicalPercentage * 100 : ''}
                    onChange={(e) => setMechanicalPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="Auto"
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Electrical */}
              <div className="p-4 rounded-lg border bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Electrical</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Electrical systems and power distribution</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">
                  {formatCurrency(parseFloat(calculations.electricalBudget || "0"))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {((parseFloat(calculations.electricalBudget || "0") / parseFloat(calculations.shellBudgetTotal || "1")) * 100).toFixed(1)}% of shell budget
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="text-muted-foreground">New</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.electricalBudget || "0") * newBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div className="text-muted-foreground">Remodel</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.electricalBudget || "0") * existingBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={electricalPercentage ? electricalPercentage * 100 : ''}
                    onChange={(e) => setElectricalPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="Auto"
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Plumbing */}
              <div className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Plumbing</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Plumbing and water systems</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-400 mb-2">
                  {formatCurrency(parseFloat(calculations.plumbingBudget || "0"))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {((parseFloat(calculations.plumbingBudget || "0") / parseFloat(calculations.shellBudgetTotal || "1")) * 100).toFixed(1)}% of shell budget
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="text-muted-foreground">New</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.plumbingBudget || "0") * newBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div className="text-muted-foreground">Remodel</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.plumbingBudget || "0") * existingBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={plumbingPercentage ? plumbingPercentage * 100 : ''}
                    onChange={(e) => setPlumbingPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="Auto"
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Telecommunication */}
              <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center justify-between mb-2">
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
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {formatCurrency(parseFloat(calculations.telecomBudget || "0"))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {((parseFloat(calculations.telecomBudget || "0") / parseFloat(calculations.shellBudgetTotal || "1")) * 100).toFixed(1)}% of shell budget
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="text-muted-foreground">New</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.telecomBudget || "0") * newBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                  <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <div className="text-muted-foreground">Remodel</div>
                    <div className="font-medium">{formatCurrency((parseFloat(calculations.telecomBudget || "0") * existingBuildingArea) / (newBuildingArea + existingBuildingArea || 1))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">% Override</Label>
                  <Input
                    type="number"
                    value={telecomPercentage ? telecomPercentage * 100 : ''}
                    onChange={(e) => setTelecomPercentage(e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                    placeholder="Auto"
                    className="w-16 h-6 text-xs"
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
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
                      <Label className="text-sm">Total Market Fee</Label>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Sum of all discipline market fees</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalMarketFee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercent(totalMarketFee / parseFloat(calculations.totalBudget || "1"))} of construction
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Total Louis Amy Fee</Label>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Sum of in-house service fees</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totalLouisAmyFee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercent(totalLouisAmyFee / parseFloat(calculations.totalBudget || "1"))} of construction
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
                        className="w-16 h-6 text-xs"
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
                          <td className="text-right py-2">{formatPercent(totalMarketFee / parseFloat(calculations.totalBudget || "1"))}</td>
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
                        value={laborRate}
                        onChange={(e) => setLaborRate(parseFloat(e.target.value))}
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
                        value={overheadRate}
                        onChange={(e) => setOverheadRate(parseFloat(e.target.value))}
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
                </div>

                <Separator />

                {/* Calculation Breakdown */}
                <div>
                  <Label className="text-sm font-semibold mb-3">Fee Calculation Breakdown</Label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Total Hours</span>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Based on area × hours/ft² factor</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-lg font-bold">
                        {totalHours.toFixed(0)} hrs
                      </span>
                    </div>
                    
                    <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">× Labor Rate</span>
                        <span className="text-sm">${laborRate}/hr</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Labor Cost</span>
                        <span className="font-medium">{formatCurrency(totalHours * laborRate)}</span>
                      </div>
                    </div>
                    
                    <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">+ Overhead</span>
                        <span className="text-sm">${overheadRate}/hr × {totalHours.toFixed(0)} hrs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">With Overhead</span>
                        <span className="font-medium">{formatCurrency(totalHours * (laborRate + overheadRate))}</span>
                      </div>
                    </div>
                    
                    <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">× Markup</span>
                        <span className="text-sm">{((markupFactor - 1) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">With Markup</span>
                        <span className="font-medium">{formatCurrency(totalHours * (laborRate + overheadRate) * markupFactor)}</span>
                      </div>
                    </div>
                    
                    {discountPercent > 0 && (
                      <div className="pl-4 space-y-2 border-l-2 border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">- Discount</span>
                          <span className="text-sm">{(discountPercent * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}
                    
                    <Separator className="my-3" />
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold">Bottom-Up Fee</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalHours * (laborRate + overheadRate) * markupFactor * (1 - discountPercent))}
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
                      <div className="text-lg font-bold">{formatCurrency(totalHours * (laborRate + overheadRate) * markupFactor * (1 - discountPercent))}</div>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        Variance: {formatPercent(Math.abs((totalHours * (laborRate + overheadRate) * markupFactor * (1 - discountPercent) - totalMarketFee) / totalMarketFee))}
                      </span>
                    </div>
                  </div>
                </div>
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
                  onChange={(e) => importConfiguration(e)}
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
                          <span className="font-semibold">{formatCurrency(scanToBimArea * scanToBimRate)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Budget Analysis Charts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Visual Budget Analysis</CardTitle>
            <CardDescription>Interactive charts for budget and fee visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="budget" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="budget">Budget Breakdown</TabsTrigger>
                <TabsTrigger value="fees">Fee Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="budget" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Budget Distribution Donut Chart */}
                  <div className="p-4 border rounded-lg">
                    <Label className="text-sm font-semibold mb-3 block">Overall Budget Distribution</Label>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Shell', value: parseFloat(calculations.shellBudgetTotal || "0") },
                            { name: 'Interior', value: parseFloat(calculations.interiorBudgetTotal || "0") },
                            { name: 'Landscape', value: parseFloat(calculations.landscapeBudgetTotal || "0") }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#8b5cf6" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full" />
                        <span className="text-xs">Shell</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span className="text-xs">Interior</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-xs">Landscape</span>
                      </div>
                    </div>
                  </div>

                  {/* Engineering Disciplines Donut Chart */}
                  <div className="p-4 border rounded-lg">
                    <Label className="text-sm font-semibold mb-3 block">Engineering Disciplines</Label>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Architecture', value: parseFloat(calculations.architectureBudget || "0") },
                            { name: 'Structural', value: parseFloat(calculations.structuralBudget || "0") },
                            { name: 'Civil', value: parseFloat(calculations.civilBudget || "0") },
                            { name: 'Mechanical', value: parseFloat(calculations.mechanicalBudget || "0") },
                            { name: 'Electrical', value: parseFloat(calculations.electricalBudget || "0") },
                            { name: 'Plumbing', value: parseFloat(calculations.plumbingBudget || "0") },
                            { name: 'Telecom', value: parseFloat(calculations.telecomBudget || "0") }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#9333ea" />
                          <Cell fill="#16a34a" />
                          <Cell fill="#ea580c" />
                          <Cell fill="#dc2626" />
                          <Cell fill="#ca8a04" />
                          <Cell fill="#7c3aed" />
                          <Cell fill="#2563eb" />
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full" />
                        <span>Architecture</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        <span>Structural</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-600 rounded-full" />
                        <span>Civil</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                        <span>Mechanical</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full" />
                        <span>Electrical</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-violet-600 rounded-full" />
                        <span>Plumbing</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span>Telecom</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New vs Remodel Stacked Bar Chart */}
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-semibold mb-3 block">New Construction vs Remodel Budget</Label>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        {
                          name: 'Shell',
                          new: parseFloat(calculations.shellBudgetTotal || "0") * (newBuildingArea / (newBuildingArea + existingBuildingArea || 1)),
                          remodel: parseFloat(calculations.shellBudgetTotal || "0") * (existingBuildingArea / (newBuildingArea + existingBuildingArea || 1))
                        },
                        {
                          name: 'Interior',
                          new: parseFloat(calculations.interiorBudgetTotal || "0") * (newBuildingArea / (newBuildingArea + existingBuildingArea || 1)),
                          remodel: parseFloat(calculations.interiorBudgetTotal || "0") * (existingBuildingArea / (newBuildingArea + existingBuildingArea || 1))
                        },
                        {
                          name: 'Landscape',
                          new: parseFloat(calculations.landscapeBudgetTotal || "0") * (newBuildingArea / (newBuildingArea + existingBuildingArea || 1)),
                          remodel: parseFloat(calculations.landscapeBudgetTotal || "0") * (existingBuildingArea / (newBuildingArea + existingBuildingArea || 1))
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="new" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="remodel" stackId="a" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-xs">New Construction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-xs">Remodel</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fees" className="space-y-4 mt-4">
                {/* Fee Distribution Bar Chart */}
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-semibold mb-3 block">Fee Distribution by Discipline</Label>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { discipline: 'Arch', inHouse: fees?.architecture?.louisAmyFee || 0, outsourced: fees?.architecture?.consultantFee || 0 },
                        { discipline: 'Interior', inHouse: fees?.interiorDesign?.louisAmyFee || 0, outsourced: fees?.interiorDesign?.consultantFee || 0 },
                        { discipline: 'Landscape', inHouse: fees?.landscape?.louisAmyFee || 0, outsourced: fees?.landscape?.consultantFee || 0 },
                        { discipline: 'Structural', inHouse: fees?.structural?.louisAmyFee || 0, outsourced: fees?.structural?.consultantFee || 0 },
                        { discipline: 'Civil', inHouse: fees?.civil?.louisAmyFee || 0, outsourced: fees?.civil?.consultantFee || 0 },
                        { discipline: 'Mech', inHouse: fees?.mechanical?.louisAmyFee || 0, outsourced: fees?.mechanical?.consultantFee || 0 },
                        { discipline: 'Elec', inHouse: fees?.electrical?.louisAmyFee || 0, outsourced: fees?.electrical?.consultantFee || 0 },
                        { discipline: 'Plumb', inHouse: fees?.plumbing?.louisAmyFee || 0, outsourced: fees?.plumbing?.consultantFee || 0 },
                        { discipline: 'Telecom', inHouse: fees?.telecom?.louisAmyFee || 0, outsourced: fees?.telecom?.consultantFee || 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="discipline" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="inHouse" stackId="a" fill="#22c55e" />
                      <Bar dataKey="outsourced" stackId="a" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-xs">In-House Fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-xs">Consultant Fee</span>
                    </div>
                  </div>
                </div>

                {/* Hourly Rate Impact Chart */}
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-semibold mb-3 block">Hourly Rate Impact Analysis</Label>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={[
                        { rate: 30, fee: (hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0) * (30 + overheadRate) * markupFactor },
                        { rate: 36, fee: (hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0) * (36 + overheadRate) * markupFactor },
                        { rate: 42, fee: (hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0) * (42 + overheadRate) * markupFactor },
                        { rate: 48, fee: (hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0) * (48 + overheadRate) * markupFactor },
                        { rate: 54, fee: (hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0) * (54 + overheadRate) * markupFactor }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rate" label={{ value: 'Labor Rate ($/hr)', position: 'insideBottom', offset: -5 }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line type="monotone" dataKey="fee" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    Current rate: ${laborRate}/hr | Total fee impact based on labor rate changes
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sanity Check & Contract Price Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sanity Check & Contract Price Comparison</CardTitle>
            <CardDescription>Market price validation and contract rate analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Hours per ft² Sanity Check */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <Label className="text-sm font-semibold">Hours per Square Foot Analysis</Label>
                  </div>
                  <Badge variant={(() => {
                    const totalHours = hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0;
                    const totalArea = newBuildingArea + existingBuildingArea;
                    const hoursPerSqFtActual = totalArea > 0 ? totalHours / totalArea : 0;
                    if (hoursPerSqFtActual < 0.3 || hoursPerSqFtActual > 1.5) return "destructive";
                    if (hoursPerSqFtActual < 0.5 || hoursPerSqFtActual > 1.2) return "secondary";
                    return "default";
                  })()}>
                    {(() => {
                      const totalHours = hours?.reduce((sum, h) => sum + parseFloat(h.totalHours), 0) || 0;
                      const totalArea = newBuildingArea + existingBuildingArea;
                      const hoursPerSqFtActual = totalArea > 0 ? totalHours / totalArea : 0;
                      return `${hoursPerSqFtActual.toFixed(2)} hrs/ft²`;
                    })()}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Low Threshold</div>
                    <div className="text-lg font-bold text-red-600">0.3 hrs/ft²</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Optimal Range</div>
                    <div className="text-lg font-bold text-green-600">0.5-1.0 hrs/ft²</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">High Threshold</div>
                    <div className="text-lg font-bold text-red-600">1.5 hrs/ft²</div>
                  </div>
                </div>
              </div>

              {/* Market vs Contract Price Comparison */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <Label className="text-sm font-semibold">Market vs Contract Price Analysis</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Market Rate (Top-Down)</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totalMarketFee)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(totalMarketFee / (newBuildingArea + existingBuildingArea || 1))} per ft²
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Contract Price (Bottom-Up)</div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(totalLouisAmyFee * (1 - discountRate))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency((totalLouisAmyFee * (1 - discountRate)) / (newBuildingArea + existingBuildingArea || 1))} per ft²
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Contract Discount Override</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[discountRate * 100]}
                        onValueChange={([v]) => setDiscountRate(v / 100)}
                        min={0}
                        max={30}
                        step={1}
                        className="w-32"
                      />
                      <Input
                        type="number"
                        value={(discountRate * 100).toFixed(0)}
                        onChange={(e) => setDiscountRate(parseFloat(e.target.value) / 100)}
                        className="w-16 h-7 text-xs"
                        min={0}
                        max={30}
                        step={1}
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-amber-800 dark:text-amber-200">
                        Variance: {formatPercent(Math.abs((totalLouisAmyFee * (1 - discountRate) - totalMarketFee) / totalMarketFee))}
                        {Math.abs((totalLouisAmyFee * (1 - discountRate) - totalMarketFee) / totalMarketFee) > 0.25 && ' - Consider adjusting rates'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Multiplier Override */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <Label className="text-sm font-semibold">Category Multiplier Override</Label>
                  </div>
                  <Badge variant="outline">
                    Current: {categoryMultiplier?.toFixed(2) || 'Auto'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs flex-1">Override Multiplier</Label>
                    <Slider
                      value={[categoryMultiplier || 1.0]}
                      onValueChange={([v]) => setCategoryMultiplier(v)}
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={categoryMultiplier?.toFixed(2) || ''}
                      onChange={(e) => setCategoryMultiplier(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Auto"
                      className="w-20 h-7 text-xs"
                      min={0.5}
                      max={2.0}
                      step={0.05}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setCategoryMultiplier(undefined)}
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Adjusts construction cost multiplier based on project category complexity
                  </div>
                </div>
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
                    {hours ? hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0).toFixed(0) : "0"} hrs
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
                  
                  const bottomUpFee = totalHours * (laborRate + overheadRate) * markupFactor * (1 - discountPercent);
                  const variance = Math.abs((bottomUpFee - totalMarketFee) / totalMarketFee);
                  
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
                              {((parseFloat(hour.totalHours) / totalProjectHours) * 100).toFixed(0)}%
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
                      {((newBuildingArea + existingBuildingArea) * hoursPerSqFt).toFixed(0)} hrs
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