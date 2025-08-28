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
  ChevronDown,
  Check,
  X
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
  
  // Interactive parameter states
  const [newBuildingArea, setNewBuildingArea] = useState(4407);
  const [existingBuildingArea, setExistingBuildingArea] = useState(0);
  const [siteArea, setSiteArea] = useState(972);
  
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
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg text-gray-400">Loading project data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto p-6">
          <Card className="text-center py-12 bg-[#1a1a1a] border-gray-800">
            <CardContent>
              <Building className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2 text-white">Project not found</h3>
              <p className="text-gray-400 mb-4">
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

  const { project, calculations, fees } = data;

  // Mock data for prototype
  const marketPrice = 183658;
  const marketDiscount = 45915;
  const discountedPrice = 137744;
  const contractPrice = 137744;
  const effectiveRate = 31; // $/ft²
  const projectMargin = -33.3;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Louis Amy" className="h-8" />
              <h1 className="text-xl font-semibold">Louis Amy Engineering</h1>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>BUILDING TYPE</span>
              <span className="text-white">Residence - Private</span>
              <span className="mx-2">|</span>
              <span>CATEGORY</span>
              <span className="text-white">Category 5</span>
              <span className="mx-2">|</span>
              <span>DESIGN LEVEL</span>
              <span className="text-white">Full Design</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Project Overview Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Project Overview</h2>
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Building className="h-5 w-5 text-blue-500" />
                  <span className="text-xs text-gray-500">BUILDING AREA</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(859365)}</div>
                <div className="text-sm text-gray-400">100% New Construction</div>
                <div className="text-xs text-green-500">100% Remodel</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-xs text-gray-500">SITE AREA</span>
                </div>
                <div className="text-2xl font-bold">{formatNumber(4407)}</div>
                <div className="text-sm text-gray-400">sq ft existing</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Home className="h-5 w-5 text-purple-500" />
                  <span className="text-xs text-gray-500">SITE</span>
                </div>
                <div className="text-2xl font-bold">{formatNumber(972)}</div>
                <div className="text-sm text-gray-400">m² total site</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                  <span className="text-xs text-gray-500">COST PER SQ FT</span>
                </div>
                <div className="text-2xl font-bold">${formatNumber(195)}</div>
                <div className="text-sm text-gray-400">remodel target</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Budget Distribution */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Budget Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-400">New vs Remodel</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'New Construction', value: 0, fill: '#3b82f6' },
                        { name: 'Remodel', value: 100, fill: '#10b981' }
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={450}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Range Configuration */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Cost Range Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">New Construction ($/ft²)</span>
                    <span className="text-sm">${formatNumber(195)}</span>
                  </div>
                  <div className="relative h-8 bg-gray-800 rounded">
                    <div className="absolute left-0 top-0 h-full w-1/3 bg-red-900 rounded-l" />
                    <div className="absolute left-1/3 top-0 h-full w-1/3 bg-yellow-900" />
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-green-900 rounded-r" />
                    <div className="absolute left-0 right-0 flex justify-between px-2 items-center h-full text-xs">
                      <span>$110</span>
                      <span className="font-bold">$195</span>
                      <span>$280</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Remodel ($/ft²)</span>
                    <span className="text-sm">${formatNumber(195)}</span>
                  </div>
                  <div className="relative h-8 bg-gray-800 rounded">
                    <div className="absolute left-0 top-0 h-full w-1/3 bg-red-900 rounded-l" />
                    <div className="absolute left-1/3 top-0 h-full w-1/3 bg-yellow-900" />
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-green-900 rounded-r" />
                    <div className="absolute left-0 right-0 flex justify-between px-2 items-center h-full text-xs">
                      <span>$110</span>
                      <span className="font-bold">$195</span>
                      <span>$280</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Construction Budget Allocation */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Construction Budget Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Architecture', amount: 567181, percent: 66 },
                    { name: 'Landscape', amount: 103124, percent: 12 },
                    { name: 'Interior', amount: 189060, percent: 22 },
                    { name: 'Structural', amount: 73734, percent: 13 },
                    { name: 'Civil', amount: 28359, percent: 5 },
                    { name: 'Mechanical', amount: 34031, percent: 6 },
                    { name: 'Electrical', amount: 25523, percent: 4.5 },
                    { name: 'Plumbing', amount: 19851, percent: 3.5 },
                    { name: 'Telecommunications', amount: 8508, percent: 1.5 }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#0a0a0a] rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">{item.name.toUpperCase()}</div>
                      <div className="text-lg font-bold">{formatCurrency(item.amount)}</div>
                      <div className="text-xs text-gray-400">{item.percent}% TOTAL SHARE</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Fee Analysis */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Fee Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-400 pb-2 border-b border-gray-800">
                    <div className="col-span-2">SCOPE</div>
                    <div className="text-center">TYPE</div>
                    <div className="text-right">MARKET FEE</div>
                    <div className="text-right">HOURS</div>
                  </div>
                  {[
                    { name: 'Scan to BIM - Building', inHouse: true, fee: 3797, hours: 31 },
                    { name: 'Scan to BIM - Site', inHouse: true, fee: 2101, hours: 13 },
                    { name: 'Architecture', inHouse: true, fee: 61147, hours: 459 },
                    { name: 'Interior', inHouse: true, fee: 45649, hours: 379 },
                    { name: 'Landscape', inHouse: true, fee: 21589, hours: 132 },
                    { name: 'Structural', inHouse: true, fee: 13104, hours: 80 },
                    { name: 'Civil', inHouse: true, fee: 7277, hours: 44 },
                    { name: 'Mechanical', consultant: true, fee: 8040, hours: 0 },
                    { name: 'Electrical', consultant: true, fee: 6030, hours: 0 },
                    { name: 'Plumbing', inHouse: true, fee: 6023, hours: 37 },
                    { name: 'Telecommunications', consultant: true, fee: 2010, hours: 0 }
                  ].map((item, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 items-center text-sm">
                      <div className="col-span-2 text-gray-300">{item.name}</div>
                      <div className="text-center">
                        <Switch 
                          checked={item.inHouse} 
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                      <div className="text-right">{formatCurrency(item.fee)}</div>
                      <div className="text-right text-gray-400">{item.hours}</div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-800">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-blue-500">{formatCurrency(191009)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom-Up Fee Analysis */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Bottom-Up Fee Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Team Member</div>
                    <div className="text-lg font-bold">324</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Hours</div>
                    <div className="text-lg font-bold">{formatCurrency(46600)}</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: 'Designer 1', value: 324, fill: '#3b82f6' },
                        { name: 'Designer 2', value: 324, fill: '#10b981' },
                        { name: 'Architect', value: 207, fill: '#f59e0b' },
                        { name: 'Engineer', value: 171, fill: '#8b5cf6' },
                        { name: 'Principal', value: 58, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                    />
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Average Rate:</span>
                    <span>{formatCurrency(164)}/hour</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Phases */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Project Phases & Hours Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-400 mb-2">Phase Distribution</div>
                  {[
                    { phase: 'Discovery', percent: 8, hours: 95 },
                    { phase: 'Creative - Conceptual', percent: 31, hours: 403 },
                    { phase: 'Creative - Schematic', percent: 34, hours: 403 },
                    { phase: 'Technical - Schematic', percent: 41, hours: 403 },
                    { phase: 'Technical - Preliminary', percent: 61, hours: 403 }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{item.phase} ({item.percent}%)</span>
                        <span>{item.hours} hrs</span>
                      </div>
                      <Progress value={item.percent} className="h-2 bg-gray-800" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{formatNumber(1184)}</div>
                    <div className="text-sm text-gray-400">Total Hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sanity Check & Pricing Section */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Sanity Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs text-gray-500">Top Share</div>
                <div className="text-sm">21.4% of construction × 1,029 hrs</div>
                <div className="space-y-2">
                  {[
                    { name: 'Scan to BIM (2%)', value: 6461 },
                    { name: 'Building share (56%)', value: 26125 },
                    { name: 'Outdoor (21%)', value: 6531 },
                    { name: 'Shell (13%)', value: 9797 },
                    { name: 'LA/Interior (8%)', value: 4812 }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.name}</span>
                      <span>{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-800">
                  <div className="flex justify-between font-bold">
                    <span>Bottom up:</span>
                    <span className="text-blue-500">{formatCurrency(183658)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>21.4% of construction × 1,584 hrs</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scan to BIM (2%)</span>
                    <span>{formatCurrency(5647)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Building (72%)</span>
                    <span>{formatCurrency(131976)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Other (11%)</span>
                    <span>{formatCurrency(8161)}</span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Variance</div>
                  <div className="text-red-500 text-sm">-1.6% difference</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Market Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Market Price</div>
                  <div className="text-2xl font-bold">{formatCurrency(marketPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Maximum Discount</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-red-500">-{formatPercent(0.25)}</span>
                  </div>
                  <div className="text-sm text-gray-400">Discount Selection</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Applied Discount</div>
                  <div className="text-xl font-bold text-green-500">{formatCurrency(discountedPrice)}</div>
                </div>
                <Slider
                  defaultValue={[25]}
                  max={35}
                  min={0}
                  step={5}
                  className="mt-4"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>35%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Contract Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Final Contract Price</div>
                  <div className="text-3xl font-bold text-green-500">{formatCurrency(contractPrice)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Effective Rate</div>
                    <div className="text-lg font-bold">{formatCurrency(effectiveRate)}/ft²</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Project Margin</div>
                    <div className="text-lg font-bold text-red-500">{projectMargin}%</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Total Hours</div>
                  <div className="text-2xl font-bold">{formatNumber(1184)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Investment Summary */}
        <Card className="mt-8 bg-gradient-to-r from-green-900 to-green-800 border-0">
          <CardContent className="py-6">
            <h2 className="text-2xl font-bold text-center mb-6">Your Investment Summary</h2>
            <div className="text-center text-sm text-gray-300 mb-4">
              Comprehensive Design Services by Louis Amy Engineering
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-xs text-gray-300 mb-1">MARKET RATE</div>
                <div className="text-3xl font-bold">{formatCurrency(187099)}</div>
                <div className="text-sm text-gray-300">Industry Standard</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-300 mb-1">LOUIS AMY PRICE</div>
                <div className="text-3xl font-bold text-white">{formatCurrency(183658)}</div>
                <div className="text-sm text-blue-300">In-House Expertise</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-300 mb-1">FINAL CONTRACT PRICE</div>
                <div className="text-3xl font-bold text-green-300">{formatCurrency(137744)}</div>
                <div className="text-sm text-green-300">Your Total Savings: {formatCurrency(49355)}</div>
              </div>
            </div>

            {/* Service Distribution */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  In-House Services Included
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { name: 'Scan to BIM - Building', amount: 3797 },
                    { name: 'Scan to BIM - Site', amount: 1547 },
                    { name: 'Architecture', amount: 49434 },
                    { name: 'Interior Design', amount: 23807 },
                    { name: 'Landscape Architecture', amount: 10884 },
                    { name: 'Structural Engineer', amount: 8848 },
                    { name: 'Civil / Site Engineer', amount: 5358 },
                    { name: 'Plumbing Engineer', amount: 4441 }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-black/20 rounded">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-green-400">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Design Services Distribution
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Scan to BIM</span>
                    <div className="flex items-center gap-2">
                      <Progress value={4} className="w-20 h-2" />
                      <span>4%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Building Shell</span>
                    <div className="flex items-center gap-2">
                      <Progress value={62} className="w-20 h-2" />
                      <span>62%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Interior</span>
                    <div className="flex items-center gap-2">
                      <Progress value={24} className="w-20 h-2" />
                      <span>24%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Landscape</span>
                    <div className="flex items-center gap-2">
                      <Progress value={12} className="w-20 h-2" />
                      <span>12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Louis Amy */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-black/20 rounded-lg p-4">
                <Check className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <h4 className="font-semibold mb-1">Exceptional Value</h4>
                <p className="text-xs text-gray-300">{formatCurrency(49355)} below market rates with premium quality and service</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <h4 className="font-semibold mb-1">Full In-House Team</h4>
                <p className="text-xs text-gray-300">Direct access to architects, engineers, and designers under one roof</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                <h4 className="font-semibold mb-1">Proven Track Record</h4>
                <p className="text-xs text-gray-300">Decades of experience delivering exceptional residential projects</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Ready to Begin Your Project</h3>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                  Accept Proposal
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Schedule Consultation
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-300">
                Final Proposal Price: <span className="text-2xl font-bold text-green-400 ml-2">{formatCurrency(137744)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
            <DollarSign className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Check className="mr-2 h-4 w-4" />
            Generate Proposal
          </Button>
          <Button variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
}