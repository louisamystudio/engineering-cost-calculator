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
import { Separator } from "@/components/ui/separator";
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
  Check,
  X,
  Download,
  Save,
  Send,
  Calendar,
  FileText,
  MapPin,
  Compass,
  Trees,
  Wrench,
  PencilRuler,
  HardHat,
  Droplets,
  Radio,
  Palette,
  Mountain,
  Wifi
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
  Legend
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

export default function LouisAmyDashboard() {
  const params = useParams();
  const [, navigate] = useLocation();
  const projectId = params.id as string;
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Cost range sliders
  const [newConstructionCost, setNewConstructionCost] = useState(195);
  const [remodelCost, setRemodelCost] = useState(195);
  
  // Discount slider
  const [discountPercent, setDiscountPercent] = useState(25);
  
  // Fee toggles for in-house vs consultant
  const [feeToggles, setFeeToggles] = useState({
    scanToBimBuilding: true,
    scanToBimSite: true,
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

  const { data, isLoading, error } = useQuery<ProjectData>({
    queryKey: ['/api/projects', projectId],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600" />
              <p className="text-gray-600">Loading project data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error Loading Project</CardTitle>
              <CardDescription className="text-red-600">
                Failed to load project data. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const { project, calculations, fees, hours } = data;
  
  // Calculated values
  const totalBudget = parseFloat(calculations.minimumBudget || '859365');
  const buildingArea = parseFloat(project.newBuildingArea || '4407');
  const siteArea = parseFloat(project.siteArea || '972');
  const costPerSqFt = totalBudget / buildingArea;
  const isRemodel = parseFloat(project.existingBuildingArea || '0') > 0;
  const remodelPercent = isRemodel ? 100 : 0;
  const newPercent = isRemodel ? 0 : 100;
  
  // Budget allocations
  const shellBudget = 567181;
  const interiorBudget = 189060;
  const landscapeBudget = 103124;
  
  // Fee calculations
  const marketPrice = 183658;
  const discountAmount = marketPrice * (discountPercent / 100);
  const contractPrice = marketPrice - discountAmount;
  const effectiveRate = contractPrice / buildingArea;
  const projectMargin = -33.3;
  
  // Pie chart data
  const budgetDistributionData = [
    { name: 'New Construction', value: newPercent, fill: '#10b981' },
    { name: 'Remodel', value: remodelPercent, fill: '#3b82f6' }
  ];
  
  const teamHoursData = [
    { name: 'Designer 1', value: 324, fill: '#3b82f6' },
    { name: 'Designer 2', value: 324, fill: '#10b981' },
    { name: 'Architect', value: 307, fill: '#f59e0b' },
    { name: 'Engineer', value: 171, fill: '#8b5cf6' },
    { name: 'Principal', value: 58, fill: '#ef4444' }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              <span className="text-xl font-semibold">Louis Amy</span>
            </div>
            <span className="text-sm text-gray-400">Project Analysis Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">BUILDING TYPE</span>
            <Badge className="bg-white text-black">Residence - Private</Badge>
            <span className="text-sm text-gray-400">CATEGORY</span>
            <Badge className="bg-green-600">Full Design</Badge>
            <span className="text-sm text-gray-400">DESIGN LEVEL</span>
            <Badge className="bg-blue-600">5</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Project Overview */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Project Overview</h1>
          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase">Total Budget</span>
                </div>
                <div className="text-3xl font-bold">{formatCurrency(totalBudget)}</div>
                <div className="text-sm text-green-600 mt-1">100% Remodel</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Building className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase">Building Area</span>
                </div>
                <div className="text-3xl font-bold">{formatNumber(buildingArea)}</div>
                <div className="text-sm text-gray-500 mt-1">sq ft existing</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase">Site Area</span>
                </div>
                <div className="text-3xl font-bold">{formatNumber(siteArea)}</div>
                <div className="text-sm text-gray-500 mt-1">m² total site</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Calculator className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-500 uppercase">Cost per sq ft</span>
                </div>
                <div className="text-3xl font-bold">${formatNumber(costPerSqFt)}</div>
                <div className="text-sm text-gray-500 mt-1">remodel target</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Budget Distribution */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Budget Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">New vs Remodel</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm">New Construction</span>
                    <span className="text-sm font-semibold">{newPercent}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm">Remodel</span>
                    <span className="text-sm font-semibold">{remodelPercent}%</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={budgetDistributionData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={450}
                    >
                      {budgetDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Shell Budget</span>
                    <span className="font-semibold">{formatCurrency(shellBudget)}</span>
                  </div>
                  <div className="text-xs text-gray-500">66% of total</div>
                  <Progress value={66} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Interior Budget</span>
                    <span className="font-semibold">{formatCurrency(interiorBudget)}</span>
                  </div>
                  <div className="text-xs text-gray-500">22% of total</div>
                  <Progress value={22} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Landscape Budget</span>
                    <span className="font-semibold">{formatCurrency(landscapeBudget)}</span>
                  </div>
                  <div className="text-xs text-gray-500">12% of total</div>
                  <Progress value={12} className="h-2 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Range Configuration */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Cost Range Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">New Construction ($/ft²)</span>
                  <span className="text-sm font-semibold">${formatNumber(newConstructionCost)}</span>
                </div>
                <div className="relative h-10 bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 rounded-lg">
                  <div className="absolute inset-0 flex items-center px-4">
                    <div className="flex justify-between w-full text-xs">
                      <span>$380</span>
                      <span className="font-bold">${formatNumber(newConstructionCost)}</span>
                      <span>$400</span>
                    </div>
                  </div>
                  <Slider
                    value={[newConstructionCost]}
                    onValueChange={(val) => setNewConstructionCost(val[0])}
                    min={380}
                    max={400}
                    step={1}
                    className="absolute inset-0 opacity-0"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Remodel ($/ft²)</span>
                  <span className="text-sm font-semibold">${formatNumber(remodelCost)}</span>
                </div>
                <div className="relative h-10 bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 rounded-lg">
                  <div className="absolute inset-0 flex items-center px-4">
                    <div className="flex justify-between w-full text-xs">
                      <span>$190</span>
                      <span className="font-bold">${formatNumber(remodelCost)}</span>
                      <span>$200</span>
                    </div>
                  </div>
                  <Slider
                    value={[remodelCost]}
                    onValueChange={(val) => setRemodelCost(val[0])}
                    min={190}
                    max={200}
                    step={1}
                    className="absolute inset-0 opacity-0"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Advanced Settings & Overrides
                    {showAdvanced ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Shell Share Override (%)</Label>
                        <Input type="number" defaultValue={66} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Interior Share Override (%)</Label>
                        <Input type="number" defaultValue={22} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Landscape Share Override (%)</Label>
                        <Input type="number" defaultValue={12} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Category Multiplier</Label>
                        <Input type="number" defaultValue={1.0} step={0.1} className="mt-1" />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        {/* Construction Budget Allocation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Construction Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'Architecture', amount: 377175, percent: 44, icon: Building },
                { name: 'Interior', amount: 189060, percent: 22, icon: Palette },
                { name: 'Landscape', amount: 103124, percent: 12, icon: Trees },
                { name: 'Structural', amount: 73734, percent: 9, icon: HardHat },
                { name: 'Civil', amount: 28359, percent: 3, icon: Compass },
                { name: 'Mechanical', amount: 34031, percent: 4, icon: Wrench },
                { name: 'Electrical', amount: 25523, percent: 3, icon: Zap },
                { name: 'Plumbing', amount: 19851, percent: 2, icon: Droplets },
                { name: 'Telecommunications', amount: 8508, percent: 1, icon: Wifi }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="h-5 w-5 text-gray-400" />
                      <span className="text-xs text-gray-500 uppercase">{item.name}</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatCurrency(item.amount)}</div>
                    <div className="text-sm text-gray-600">{item.percent}% total share</div>
                    <div className="text-xs text-blue-600 mt-2">Remodel: {formatCurrency(item.amount)}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fee Analysis */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Top-Down Fee Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top-Down Fee Analysis
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Market-based fee calculation</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                  <div className="col-span-2">Scope</div>
                  <div>Type</div>
                  <div className="text-right">Assignment</div>
                  <div className="text-right">Market Fee</div>
                  <div className="text-right">Hours</div>
                </div>
                {[
                  { name: 'Scan to BIM - Building', inHouse: true, fee: 5157, hours: 31 },
                  { name: 'Scan to BIM - Site', inHouse: true, fee: 2101, hours: 13 },
                  { name: 'Architecture', inHouse: true, fee: 67147, hours: 409 },
                  { name: 'Interior', inHouse: true, fee: 45649, hours: 278 },
                  { name: 'Landscape', inHouse: true, fee: 21589, hours: 132 },
                  { name: 'Structural', inHouse: true, fee: 13104, hours: 80 },
                  { name: 'Civil', inHouse: true, fee: 7277, hours: 44 },
                  { name: 'Mechanical', consultant: true, fee: 8062, hours: 0 },
                  { name: 'Electrical', consultant: true, fee: 6873, hours: 0 },
                  { name: 'Plumbing', inHouse: true, fee: 6033, hours: 37 },
                  { name: 'Telecommunications', consultant: true, fee: 4107, hours: 0 }
                ].map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 py-2 text-sm border-b border-gray-100">
                    <div className="col-span-2">{item.name}</div>
                    <div>
                      <Badge variant={item.inHouse ? "default" : "secondary"} className="text-xs">
                        {item.inHouse ? "In-House" : "Consultant"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <Switch 
                        checked={item.inHouse} 
                        className="ml-auto"
                      />
                    </div>
                    <div className="text-right font-semibold">{formatCurrency(item.fee)}</div>
                    <div className="text-right text-gray-500">{item.hours || '-'}</div>
                  </div>
                ))}
                <div className="pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <div className="flex gap-4">
                      <span>{formatCurrency(187099)}</span>
                      <span>1,025</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom-Up Fee Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bottom-Up Fee Analysis
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hours-based fee calculation</p>
                  </TooltipContent>
                </UITooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="col-span-1">Team Member</div>
                  <div className="text-right">Hours</div>
                  <div className="text-right">Total Cost</div>
                </div>
                {[
                  { name: 'Designer 1', hours: 324, cost: 48600 },
                  { name: 'Designer 2', hours: 324, cost: 48600 },
                  { name: 'Architect', hours: 307, cost: 47892 },
                  { name: 'Engineer', hours: 171, cost: 26676 },
                  { name: 'Principal', hours: 58, cost: 11890 }
                ].map((member, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 py-2 text-sm border-b border-gray-100">
                    <div>{member.name}</div>
                    <div className="text-right">{member.hours}</div>
                    <div className="text-right font-semibold">{formatCurrency(member.cost)}</div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="grid grid-cols-3 gap-2 font-bold">
                    <div>Total</div>
                    <div className="text-right">1,184</div>
                    <div className="text-right text-blue-600">{formatCurrency(183658)}</div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm font-medium mb-2">Average Rate: {formatCurrency(164)}/hour</div>
                </div>

                {/* Team Leverage Pie Chart */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Team Leverage</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={teamHoursData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        label={(entry) => `${entry.name}: ${entry.value}h`}
                      >
                        {teamHoursData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <div className="text-2xl font-bold">1,184</div>
                    <div className="text-sm text-gray-500">Total Hours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Phases & Hours Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Phases & Hours Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-medium mb-4">Phase Distribution</h4>
                <div className="space-y-3">
                  {[
                    { phase: 'Discovery', percent: 8, hours: 95 },
                    { phase: 'Creative - Conceptual', percent: 8, hours: 95 },
                    { phase: 'Creative - Schematic', percent: 34, hours: 403 },
                    { phase: 'Creative - Preliminary', percent: 8, hours: 95 },
                    { phase: 'Technical - Schematic', percent: 34, hours: 403 },
                    { phase: 'Technical - Preliminary', percent: 8, hours: 95 }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.phase} ({item.percent}%)</span>
                        <span className="text-gray-600">{item.hours} hrs</span>
                      </div>
                      <Progress value={item.percent} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-4">Team Leverage</h4>
                <div className="space-y-2">
                  {[
                    { role: 'Designer 1', hours: 324, color: 'bg-blue-500' },
                    { role: 'Designer 2', hours: 324, color: 'bg-green-500' },
                    { role: 'Architect', hours: 307, color: 'bg-yellow-500' },
                    { role: 'Engineer', hours: 171, color: 'bg-purple-500' },
                    { role: 'Principal', hours: 58, color: 'bg-red-500' }
                  ].map((member, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded ${member.color}`}></div>
                      <span className="text-sm flex-1">{member.role}:</span>
                      <span className="text-sm font-semibold">{member.hours}h</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded text-center">
                  <div className="text-3xl font-bold text-blue-600">1,184</div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sanity Check & Pricing */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Sanity Check */}
          <Card>
            <CardHeader>
              <CardTitle>Sanity Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-blue-600 mb-2">Top-Down</div>
                  <div className="text-2xl font-bold">{formatCurrency(187099)}</div>
                  <div className="text-xs text-gray-500">21.8% of construction • 1,025 hrs</div>
                  <div className="mt-2 space-y-1">
                    {[
                      { name: 'Scan to BIM', percent: 1, amount: 1871 },
                      { name: 'Building Shell', percent: 13, amount: 24323 },
                      { name: 'Interior', percent: 5, amount: 9355 },
                      { name: 'Landscape', percent: 3, amount: 5613 }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-600">{item.name} ({item.percent}%)</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="text-sm font-medium text-green-600 mb-2">Bottom-Up</div>
                  <div className="text-2xl font-bold">{formatCurrency(183658)}</div>
                  <div className="text-xs text-gray-500">21.4% of construction • 1,184 hrs</div>
                  <div className="mt-2 space-y-1">
                    {[
                      { name: 'Scan to BIM', percent: 1, amount: 1837 },
                      { name: 'Building Shell', percent: 13, amount: 23876 },
                      { name: 'Interior', percent: 5, amount: 9183 },
                      { name: 'Landscape', percent: 3, amount: 5510 }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-600">{item.name} ({item.percent}%)</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium text-red-600 mb-1">Variance</div>
                  <div className="text-xl font-bold text-red-600">-{formatCurrency(3441)}</div>
                  <div className="text-xs text-gray-500">-1.8% difference</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Market Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Market Price</div>
                  <div className="text-3xl font-bold">{formatCurrency(marketPrice)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Maximum Discount</div>
                  <div className="text-2xl font-bold text-orange-600">-{discountPercent}%</div>
                  <div className="text-xs text-gray-500">Discount Selection</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Applied Discount</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(discountAmount)}</div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Discount Amount</span>
                    <span className="font-semibold">{discountPercent}%</span>
                  </div>
                  <Slider
                    value={[discountPercent]}
                    onValueChange={(val) => setDiscountPercent(val[0])}
                    max={35}
                    min={0}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>35%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Price */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Final Contract Price</div>
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(contractPrice)}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Effective Rate</div>
                    <div className="text-xl font-bold">${formatNumber(effectiveRate)}/ft²</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Project Margin</div>
                    <div className="text-xl font-bold text-red-600">{projectMargin}%</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <div className="text-3xl font-bold">1,184</div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Investment Summary */}
        <Card className="bg-gray-900 text-white border-0">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-2">Your Investment Summary</h2>
            <p className="text-center text-gray-400 mb-8">Comprehensive Design Services by Louis Amy Engineering</p>
            
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">MARKET RATE</div>
                <div className="text-4xl font-bold">{formatCurrency(187099)}</div>
                <div className="text-sm text-gray-400">Industry Standard</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">LOUIS AMY PRICE</div>
                <div className="text-4xl font-bold text-blue-400">{formatCurrency(183658)}</div>
                <div className="text-sm text-blue-400">In-House Expertise</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">FINAL CONTRACT PRICE</div>
                <div className="text-4xl font-bold text-green-400">{formatCurrency(137744)}</div>
                <div className="text-sm text-green-400">Total Savings: {formatCurrency(45915)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* In-House Services */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  In-House Services Included
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: '📡', name: 'Scan to BIM - Building', amount: 3797 },
                    { icon: '🗺️', name: 'Scan to BIM - Site', amount: 1547 },
                    { icon: '🏛️', name: 'Architecture', amount: 49434 },
                    { icon: '🎨', name: 'Interior Design', amount: 33607 },
                    { icon: '🌳', name: 'Landscape Architecture', amount: 15894 },
                    { icon: '🔧', name: 'Structural Engineer', amount: 9648 },
                    { icon: '📐', name: 'Civil / Site Engineer', amount: 5358 },
                    { icon: '🚿', name: 'Plumbing Engineer', amount: 4441 }
                  ].map((service, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        <span>{service.icon}</span>
                        <span className="text-sm">{service.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-green-400">{formatCurrency(service.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Design Services Distribution */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Design Services Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Scan to BIM', percent: 4, amount: 5344 },
                    { name: 'Building Shell', percent: 60, amount: 82554 },
                    { name: 'Interior', percent: 24, amount: 33607 },
                    { name: 'Landscape', percent: 12, amount: 16238 }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span className="text-gray-400">{item.percent}%</span>
                      </div>
                      <Progress value={item.percent} className="h-2 bg-gray-700" />
                      <div className="text-right text-xs text-gray-400 mt-1">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Why Choose Louis Amy */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <Check className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <h4 className="font-semibold mb-1">Exceptional Value</h4>
                <p className="text-xs text-gray-400">{formatCurrency(45915)} below market rates with premium quality and service</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <h4 className="font-semibold mb-1">Full In-House Team</h4>
                <p className="text-xs text-gray-400">Direct access to architects, engineers, and designers under one roof</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                <h4 className="font-semibold mb-1">Integrated Design Approach</h4>
                <p className="text-xs text-gray-400">Seamless coordination between all disciplines for optimal results</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="text-center">
                <Check className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <h4 className="font-semibold mb-1">Proven Track Record</h4>
                <p className="text-xs text-gray-400">Decades of experience delivering exceptional residential projects</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-4">Ready to Begin Your Project</h3>
              <p className="text-gray-400 mb-6">Final Proposal Price: {formatCurrency(137744)}</p>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                  <Check className="h-4 w-4 mr-2" />
                  Accept Proposal
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Consultation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Generate Proposal
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}