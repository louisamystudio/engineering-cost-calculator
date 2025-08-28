import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Project, ProjectCalculation, ProjectFee, ProjectHours } from "@shared/schema";

type ProjectData = {
  project: Project;
  calculations: ProjectCalculation;
  fees: ProjectFee[];
  hours: ProjectHours[];
};

function currency(n: string | number): string {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
}

function num(n: string | number, d = 0): string {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v || 0);
}

export default function ProjectDashboardSimple() {
  const params = useParams();
  const [, navigate] = useLocation();
  const projectId = params.id as string;

  const { data, isLoading, error } = useQuery<ProjectData>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error || !data) return <div className="p-6">Project not found</div>;

  const { project, calculations, fees, hours } = data;

  const totalMarketFee = fees.reduce((s, f) => s + parseFloat(f.marketFee || '0'), 0);
  const totalLouisAmyFee = fees.reduce((s, f) => s + parseFloat(f.louisAmyFee || '0'), 0);
  const totalConsultantFee = fees.reduce((s, f) => s + parseFloat(f.consultantFee || '0'), 0);
  const totalHours = hours.reduce((s, h) => s + parseFloat(h.totalHours || '0'), 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>Back</Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm text-muted-foreground">Simple Calculation Sheet</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate(`/projects/${project.id}`)}>Modern View</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Top summary */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Market Fee</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{currency(totalMarketFee)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Louis Amy Fee</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{currency(totalLouisAmyFee)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Consultant Fee</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{currency(totalConsultantFee)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Total Hours</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{num(totalHours, 0)}</div></CardContent>
          </Card>
        </div>

        {/* Inputs */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Project Inputs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-muted-foreground">Use</div><div>{project.buildingUse}</div></div>
              <div><div className="text-muted-foreground">Type</div><div>{project.buildingType}</div></div>
              <div><div className="text-muted-foreground">Design Level</div><div>{project.designLevel}</div></div>
              <div><div className="text-muted-foreground">Category</div><div>{project.category}</div></div>
              <div><div className="text-muted-foreground">New Area (ft²)</div><div>{num(project.newBuildingArea)}</div></div>
              <div><div className="text-muted-foreground">Existing Area (ft²)</div><div>{num(project.existingBuildingArea)}</div></div>
              <div><div className="text-muted-foreground">Site Area</div><div>{num(project.siteArea)}</div></div>
              <div><div className="text-muted-foreground">Remodel Factor</div><div>{num(project.remodelMultiplier)}</div></div>
            </div>
          </CardContent>
        </Card>

        {/* Budgets */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Calculated Budgets</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">New Cost ($/ft²)</div>
                <div>Min {num(calculations.newCostMin,2)} • Target {num(calculations.newCostTarget,2)} • Max {num(calculations.newCostMax,2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Remodel Cost ($/ft²)</div>
                <div>Min {num(calculations.remodelCostMin,2)} • Target {num(calculations.remodelCostTarget,2)} • Max {num(calculations.remodelCostMax,2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Totals</div>
                <div>New {currency(calculations.newBudget)} • Remodel {currency(calculations.remodelBudget)} • Total {currency(calculations.totalBudget)}</div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>Shell Budget: <b>{currency(calculations.shellBudgetTotal)}</b></div>
              <div>Interior Budget: <b>{currency(calculations.interiorBudgetTotal)}</b></div>
              <div>Landscape Budget: <b>{currency(calculations.landscapeBudgetTotal)}</b></div>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
              <div>Architecture: <b>{currency(calculations.architectureBudget)}</b></div>
              <div>Structural: <b>{currency(calculations.structuralBudget)}</b></div>
              <div>Civil: <b>{currency(calculations.civilBudget)}</b></div>
              <div>Mechanical: <b>{currency(calculations.mechanicalBudget)}</b></div>
              <div>Electrical: <b>{currency(calculations.electricalBudget)}</b></div>
              <div>Plumbing: <b>{currency(calculations.plumbingBudget)}</b></div>
              <div>Telecom: <b>{currency(calculations.telecomBudget)}</b></div>
            </div>
          </CardContent>
        </Card>

        {/* Fees table */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Fees (Calculated)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Scope</th>
                    <th className="text-right py-2">% of Cost</th>
                    <th className="text-right py-2">Rate/ft²</th>
                    <th className="text-right py-2">Market Fee</th>
                    <th className="text-right py-2">Louis Amy</th>
                    <th className="text-right py-2">Consultant</th>
                    <th className="text-right py-2">Coordination</th>
                    <th className="text-center py-2">In-House</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f.id} className="border-b">
                      <td className="py-1">{f.scope}</td>
                      <td className="text-right">{num(parseFloat(f.percentOfCost || '0') * 100, 2)}%</td>
                      <td className="text-right">{num(f.ratePerSqFt || '0', 2)}</td>
                      <td className="text-right">{currency(f.marketFee)}</td>
                      <td className="text-right">{f.isInhouse ? currency(f.louisAmyFee) : '-'}</td>
                      <td className="text-right">{!f.isInhouse ? currency(f.consultantFee || '0') : '-'}</td>
                      <td className="text-right">{!f.isInhouse ? currency(f.coordinationFee || '0') : '-'}</td>
                      <td className="text-center">{f.isInhouse ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="py-2">TOTAL</td>
                    <td></td>
                    <td></td>
                    <td className="text-right">{currency(totalMarketFee)}</td>
                    <td className="text-right">{currency(totalLouisAmyFee)}</td>
                    <td className="text-right">{currency(totalConsultantFee)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Hours table */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Hours Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Phase</th>
                    <th className="text-right py-2">% Phase</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Designer 1</th>
                    <th className="text-right py-2">Designer 2</th>
                    <th className="text-right py-2">Architect</th>
                    <th className="text-right py-2">Engineer</th>
                    <th className="text-right py-2">Principal</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map((h) => (
                    <tr key={h.id} className="border-b">
                      <td className="py-1">{h.phase}</td>
                      <td className="text-right">{num(parseFloat(h.phasePercent) * 100, 2)}%</td>
                      <td className="text-right">{num(h.totalHours, 0)}</td>
                      <td className="text-right">{num(h.designer1Hours || '0', 0)}</td>
                      <td className="text-right">{num(h.designer2Hours || '0', 0)}</td>
                      <td className="text-right">{num(h.architectHours || '0', 0)}</td>
                      <td className="text-right">{num(h.engineerHours || '0', 0)}</td>
                      <td className="text-right">{num(h.principalHours || '0', 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

