import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface SanityCheckPanelProps {
  projectData: any;
}

export function SanityCheckPanel({ projectData }: SanityCheckPanelProps) {
  if (!projectData) return null;

  const { project, calculations, fees } = projectData;

  // Calculate sanity metrics
  const totalArea = parseFloat(project.newBuildingArea) + parseFloat(project.existingBuildingArea);
  const totalMarketFee = fees?.reduce((sum: number, fee: any) => sum + (fee.marketFee || 0), 0) || 0;
  const totalLouisAmyFee = fees?.reduce((sum: number, fee: any) => sum + (fee.louisAmyFee || 0), 0) || 0;
  const totalConsultantFee = fees?.reduce((sum: number, fee: any) => sum + (fee.consultantFee || 0), 0) || 0;

  const hoursPerSqFt = totalMarketFee > 0 && totalArea > 0 ? totalMarketFee / totalArea / 172.17 : 0; // Assuming $172.17/hr average rate

  const warnings = [];
  if (hoursPerSqFt < 0.3) warnings.push("Hours per sq ft is unusually low (< 0.3)");
  if (hoursPerSqFt > 1.5) warnings.push("Hours per sq ft is unusually high (> 1.5)");

  const feePercentage = calculations?.totalBudget ? (totalMarketFee / parseFloat(calculations?.totalBudget || '1')) * 100 : 0;
  if (feePercentage < 3) warnings.push("Total fee percentage is very low (< 3%)");
  if (feePercentage > 15) warnings.push("Total fee percentage is very high (> 15%)");

  // Contract pricing calculations
  const standardDiscountRate = 0.15; // 15% standard discount
  const maxDiscountRate = 0.35; // 35% maximum discount
  const contractPriceStandard = totalMarketFee * (1 - standardDiscountRate);
  const contractPriceMax = totalMarketFee * (1 - maxDiscountRate);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Sanity Check & Contract Pricing
        </CardTitle>
        <CardDescription>
          Validation checks and pricing scenarios for your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Hours per sq ft</Label>
              <div className={`text-lg font-semibold ${hoursPerSqFt < 0.3 || hoursPerSqFt > 1.5 ? 'text-red-600' : 'text-green-600'}`}>
                {hoursPerSqFt.toFixed(2)}
              </div>
            </div>
            <div>
              <Label>Fee percentage</Label>
              <div className={`text-lg font-semibold ${feePercentage < 3 || feePercentage > 15 ? 'text-red-600' : 'text-green-600'}`}>
                {feePercentage.toFixed(1)}%
              </div>
            </div>
            <div>
              <Label>Rate per sq ft</Label>
              <div className="text-lg font-semibold">
                ${(totalMarketFee / totalArea).toFixed(2)}
              </div>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Warnings:</h4>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3">💰 Contract Pricing Scenarios</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">Market Rate (100%)</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(totalMarketFee)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Standard Contract (15% discount)</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(contractPriceStandard)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Maximum Discount (35%)</div>
                  <div className="text-xl font-bold text-orange-600">
                    {formatCurrency(contractPriceMax)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">Louis Amy Internal</div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatCurrency(totalLouisAmyFee)}
                  </div>
                  <div className="text-sm text-purple-600">
                    {((totalLouisAmyFee - totalMarketFee) / totalMarketFee * 100).toFixed(1)}% vs market
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Consultant Fees</div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(totalConsultantFee)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Total Project Cost</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(totalLouisAmyFee + totalConsultantFee)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">📊 Fee Analysis Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Internal vs Market Variance:</strong><br/>
                <span className={`${totalLouisAmyFee < totalMarketFee ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(totalMarketFee - totalLouisAmyFee))} 
                  ({Math.abs((totalLouisAmyFee - totalMarketFee) / totalMarketFee * 100).toFixed(1)}%)
                </span>
              </div>
              <div>
                <strong>Recommended Contract Range:</strong><br/>
                {formatCurrency(contractPriceMax)} - {formatCurrency(contractPriceStandard)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}