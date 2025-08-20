
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ComprehensiveSanityCheckProps {
  projectData: any;
}

export function ComprehensiveSanityCheck({ projectData }: ComprehensiveSanityCheckProps) {
  if (!projectData) return null;

  const { project, calculations, fees } = projectData;

  // Calculate key metrics
  const totalArea = parseFloat(project.newBuildingArea) + parseFloat(project.existingBuildingArea);
  const totalBudget = parseFloat(calculations?.totalBudget || '0');
  const totalMarketFee = fees?.reduce((sum: number, fee: any) => sum + parseFloat(fee.marketFee || '0'), 0) || 0;
  const totalLouisAmyFee = fees?.reduce((sum: number, fee: any) => sum + parseFloat(fee.louisAmyFee || '0'), 0) || 0;
  const totalConsultantFee = fees?.reduce((sum: number, fee: any) => sum + parseFloat(fee.consultantFee || '0'), 0) || 0;

  // Calculate ratios and percentages
  const feePercentage = totalBudget > 0 ? (totalMarketFee / totalBudget) * 100 : 0;
  const ratePerSqFt = totalArea > 0 ? totalMarketFee / totalArea : 0;
  const hoursPerSqFt = totalArea > 0 && totalMarketFee > 0 ? totalMarketFee / totalArea / 172.17 : 0; // Assuming $172.17/hr

  // Generate warnings and checks
  const warnings: string[] = [];
  const passes: string[] = [];
  
  if (hoursPerSqFt < 0.3) warnings.push("Hours per sq ft unusually low (< 0.3)");
  else if (hoursPerSqFt > 1.5) warnings.push("Hours per sq ft unusually high (> 1.5)");
  else passes.push(`Hours per sq ft within normal range (${hoursPerSqFt.toFixed(2)})`);
  
  if (feePercentage < 3) warnings.push("Total fee percentage very low (< 3%)");
  else if (feePercentage > 15) warnings.push("Total fee percentage very high (> 15%)");
  else passes.push(`Fee percentage within normal range (${feePercentage.toFixed(1)}%)`);
  
  if (ratePerSqFt < 10) warnings.push("Rate per sq ft unusually low (< $10)");
  else if (ratePerSqFt > 50) warnings.push("Rate per sq ft unusually high (> $50)");
  else passes.push(`Rate per sq ft within normal range ($${ratePerSqFt.toFixed(2)})`);

  // Budget allocation checks
  const shellBudget = parseFloat(calculations?.shellBudgetTotal || '0');
  const interiorBudget = parseFloat(calculations?.interiorBudgetTotal || '0');
  const landscapeBudget = parseFloat(calculations?.landscapeBudgetTotal || '0');
  const budgetSum = shellBudget + interiorBudget + landscapeBudget;
  
  if (Math.abs(budgetSum - totalBudget) > 100) {
    warnings.push(`Budget allocation mismatch: ${((budgetSum - totalBudget) / totalBudget * 100).toFixed(1)}% variance`);
  } else {
    passes.push("Budget allocation properly balanced");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold">Total Area</div>
              <div>{totalArea.toLocaleString()} ft²</div>
            </div>
            <div>
              <div className="font-semibold">Total Budget</div>
              <div>${totalBudget.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-semibold">Market Fee</div>
              <div>${totalMarketFee.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-semibold">Fee Percentage</div>
              <div>{feePercentage.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Sanity Checks Passed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {passes.map((pass, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{pass}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warnings.map((warning, idx) => (
                <Alert key={idx} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Market Rate</span>
              <Badge variant="outline">${totalMarketFee.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Louis Amy Fee</span>
              <Badge variant="secondary">${totalLouisAmyFee.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Consultant Fee</span>
              <Badge variant="destructive">${totalConsultantFee.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Rate per ft²</span>
              <Badge>${ratePerSqFt.toFixed(2)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
