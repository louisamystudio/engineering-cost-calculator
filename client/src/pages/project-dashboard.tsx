import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Building, Calculator, DollarSign, Clock, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
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

export default function ProjectDashboardPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const projectId = params.id as string;
  const [expandedFees, setExpandedFees] = useState(true);
  const [expandedHours, setExpandedHours] = useState(false);
  const [expandedBudgets, setExpandedBudgets] = useState(true);

  const { data, isLoading, error } = useQuery<ProjectData>({
    queryKey: ['/api/projects', projectId],
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
        newBuildingArea: parseFloat(data.project.newBuildingArea),
        existingBuildingArea: parseFloat(data.project.existingBuildingArea),
        siteArea: parseFloat(data.project.siteArea),
        historicMultiplier: parseFloat(data.project.historicMultiplier),
        remodelMultiplier: parseFloat(data.project.remodelMultiplier),
        newConstructionTargetCost: data.project.newConstructionTargetCost ? parseFloat(data.project.newConstructionTargetCost) : undefined,
        remodelTargetCost: data.project.remodelTargetCost ? parseFloat(data.project.remodelTargetCost) : undefined,
        shellShareOverride: data.project.shellShareOverride ? parseFloat(data.project.shellShareOverride) : undefined,
        interiorShareOverride: data.project.interiorShareOverride ? parseFloat(data.project.interiorShareOverride) : undefined,
        landscapeShareOverride: data.project.landscapeShareOverride ? parseFloat(data.project.landscapeShareOverride) : undefined,
      };
      
      const response = await apiRequest('POST', '/api/projects/calculate', input);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/projects")}>
              Back to Projects
            </Button>
          </CardContent>
        </Card>
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <Button onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending}>
          {recalculateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Recalculate
        </Button>
      </div>

      {/* Project Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {project.projectName}
          {project.isDemo && (
            <Badge className="ml-3" variant="secondary">Demo</Badge>
          )}
        </h1>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>{project.buildingUse}</span>
          <span>•</span>
          <span>{project.buildingType}</span>
          <span>•</span>
          <span>{project.buildingTier}</span>
          <span>•</span>
          <span>Last updated: {new Date(calculations.calculatedAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculations.totalBudget)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              New: {formatCurrency(calculations.newBudget)} | Remodel: {formatCurrency(calculations.remodelBudget)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Market Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMarketFee)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatPercent(totalMarketFee / parseFloat(calculations.totalBudget))} of budget
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Louis Amy Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLouisAmyFee)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              In-house services only
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalHours, 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Louis Amy team hours
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Project Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>Project Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Design Level:</span>
                    <span className="font-medium">Level {project.designLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">Category {project.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Historic Property:</span>
                    <span className="font-medium">{parseFloat(project.historicMultiplier) > 1 ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remodel Factor:</span>
                    <span className="font-medium">{formatPercent(project.remodelMultiplier)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New Building Area:</span>
                    <span className="font-medium">{formatNumber(project.newBuildingArea)} ft²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Existing Building:</span>
                    <span className="font-medium">{formatNumber(project.existingBuildingArea)} ft²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Site Area:</span>
                    <span className="font-medium">{formatNumber(project.siteArea)} ft²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Area:</span>
                    <span className="font-medium">
                      {formatNumber(parseFloat(project.newBuildingArea) + parseFloat(project.existingBuildingArea))} ft²
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Construction Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">New Construction</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Minimum</div>
                      <div className="font-medium">{formatCurrency(calculations.newCostMin)}/ft²</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Target</div>
                      <div className="font-medium">{formatCurrency(calculations.newCostTarget)}/ft²</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Maximum</div>
                      <div className="font-medium">{formatCurrency(calculations.newCostMax)}/ft²</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Remodel</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Minimum</div>
                      <div className="font-medium">{formatCurrency(calculations.remodelCostMin)}/ft²</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Target</div>
                      <div className="font-medium">{formatCurrency(calculations.remodelCostTarget)}/ft²</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Maximum</div>
                      <div className="font-medium">{formatCurrency(calculations.remodelCostMax)}/ft²</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Collapsible open={expandedBudgets} onOpenChange={setExpandedBudgets}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <CardTitle>Budget Breakdown</CardTitle>
                  {expandedBudgets ? <ChevronUp /> : <ChevronDown />}
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-6">
                    {/* Category Budgets */}
                    <div>
                      <h4 className="font-medium mb-3">Category Budgets</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Shell/Architecture</span>
                          <div className="flex items-center gap-4">
                            <Progress value={parseFloat(calculations.shellBudgetTotal) / parseFloat(calculations.totalBudget) * 100} className="w-32" />
                            <span className="font-medium w-32 text-right">{formatCurrency(calculations.shellBudgetTotal)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Interior Design</span>
                          <div className="flex items-center gap-4">
                            <Progress value={parseFloat(calculations.interiorBudgetTotal) / parseFloat(calculations.totalBudget) * 100} className="w-32" />
                            <span className="font-medium w-32 text-right">{formatCurrency(calculations.interiorBudgetTotal)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Landscape</span>
                          <div className="flex items-center gap-4">
                            <Progress value={parseFloat(calculations.landscapeBudgetTotal) / parseFloat(calculations.totalBudget) * 100} className="w-32" />
                            <span className="font-medium w-32 text-right">{formatCurrency(calculations.landscapeBudgetTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Discipline Budgets */}
                    <div>
                      <h4 className="font-medium mb-3">Discipline Budgets</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Architecture:</span>
                          <span className="font-medium">{formatCurrency(calculations.architectureBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Structural:</span>
                          <span className="font-medium">{formatCurrency(calculations.structuralBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Civil/Site:</span>
                          <span className="font-medium">{formatCurrency(calculations.civilBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mechanical:</span>
                          <span className="font-medium">{formatCurrency(calculations.mechanicalBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Electrical:</span>
                          <span className="font-medium">{formatCurrency(calculations.electricalBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plumbing:</span>
                          <span className="font-medium">{formatCurrency(calculations.plumbingBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telecom:</span>
                          <span className="font-medium">{formatCurrency(calculations.telecomBudget)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Collapsible open={expandedFees} onOpenChange={setExpandedFees}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Fee Matrix</CardTitle>
                    <CardDescription>Detailed breakdown of all service fees</CardDescription>
                  </div>
                  {expandedFees ? <ChevronUp /> : <ChevronDown />}
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-6">
                    {/* In-house Services */}
                    {inhouseFees.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">In-House Services</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Scope</TableHead>
                              <TableHead className="text-right">% of Cost</TableHead>
                              <TableHead className="text-right">$/ft²</TableHead>
                              <TableHead className="text-right">Market Fee</TableHead>
                              <TableHead className="text-right">LA Fee</TableHead>
                              <TableHead className="text-right">Hours</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inhouseFees.map((fee, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{fee.scope}</TableCell>
                                <TableCell className="text-right">
                                  {fee.percentOfCost ? formatPercent(fee.percentOfCost) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fee.ratePerSqFt ? `$${parseFloat(fee.ratePerSqFt).toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(fee.marketFee)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(fee.louisAmyFee)}</TableCell>
                                <TableCell className="text-right">{formatNumber(fee.hours || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Outsourced Services */}
                    {outsourcedFees.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Outsourced Services</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Scope</TableHead>
                              <TableHead className="text-right">% of Cost</TableHead>
                              <TableHead className="text-right">$/ft²</TableHead>
                              <TableHead className="text-right">Market Fee</TableHead>
                              <TableHead className="text-right">Coordination</TableHead>
                              <TableHead className="text-right">Consultant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {outsourcedFees.map((fee, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{fee.scope}</TableCell>
                                <TableCell className="text-right">
                                  {fee.percentOfCost ? formatPercent(fee.percentOfCost) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fee.ratePerSqFt ? `$${parseFloat(fee.ratePerSqFt).toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(fee.marketFee)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(fee.coordinationFee || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(fee.consultantFee || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Fee Summary */}
                    <div className="border-t pt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Total Market Fee:</span>
                            <span className="font-bold">{formatCurrency(totalMarketFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Total Louis Amy Fee:</span>
                            <span className="font-bold">{formatCurrency(totalLouisAmyFee)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Coordination Fees:</span>
                            <span className="font-bold">{formatCurrency(totalCoordinationFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Consultant Fees:</span>
                            <span className="font-bold">{formatCurrency(totalConsultantFee)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Collapsible open={expandedHours} onOpenChange={setExpandedHours}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Hours Distribution</CardTitle>
                    <CardDescription>Phase and role breakdown of project hours</CardDescription>
                  </div>
                  {expandedHours ? <ChevronUp /> : <ChevronDown />}
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phase</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Designer 1</TableHead>
                        <TableHead className="text-right">Designer 2</TableHead>
                        <TableHead className="text-right">Architect</TableHead>
                        <TableHead className="text-right">Engineer</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hours.map((hour, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{hour.phase}</TableCell>
                          <TableCell className="text-right">{formatPercent(hour.phasePercent)}</TableCell>
                          <TableCell className="text-right">{formatNumber(hour.totalHours, 1)}</TableCell>
                          <TableCell className="text-right">{formatNumber(hour.designer1Hours || 0, 1)}</TableCell>
                          <TableCell className="text-right">{formatNumber(hour.designer2Hours || 0, 1)}</TableCell>
                          <TableCell className="text-right">{formatNumber(hour.architectHours || 0, 1)}</TableCell>
                          <TableCell className="text-right">{formatNumber(hour.engineerHours || 0, 1)}</TableCell>
                          <TableCell className="text-right">{formatNumber(hour.principalHours || 0, 1)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.totalHours), 0), 1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.designer1Hours || '0'), 0), 1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.designer2Hours || '0'), 0), 1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.architectHours || '0'), 0), 1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.engineerHours || '0'), 0), 1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(hours.reduce((sum, h) => sum + parseFloat(h.principalHours || '0'), 0), 1)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>
      </Tabs>
    </div>
  );
}