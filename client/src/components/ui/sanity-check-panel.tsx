
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SanityCheckPanelProps {
  topDownFee: number;
  bottomUpFee: number;
  totalHours: number;
  totalArea: number;
  marketPrice: number;
  discountedPrice: number;
  appliedDiscount: number;
  maxDiscount: number;
}

export function SanityCheckPanel({
  topDownFee,
  bottomUpFee,
  totalHours,
  totalArea,
  marketPrice,
  discountedPrice,
  appliedDiscount,
  maxDiscount
}: SanityCheckPanelProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Calculate variance between top-down and bottom-up
  const feeVariance = topDownFee > 0 ? Math.abs(topDownFee - bottomUpFee) / topDownFee : 0;
  const feeVariancePercent = feeVariance * 100;

  // Calculate hours per square foot
  const hoursPerSqFt = totalArea > 0 ? totalHours / totalArea : 0;

  // Sanity check thresholds
  const checks = [
    {
      name: "Fee Method Variance",
      value: feeVariancePercent,
      threshold: 25,
      unit: "%",
      status: feeVariancePercent <= 10 ? "good" : feeVariancePercent <= 25 ? "warning" : "error",
      description: "Difference between top-down and bottom-up fee calculations"
    },
    {
      name: "Hours per Sq Ft",
      value: hoursPerSqFt,
      threshold: [0.3, 1.5],
      unit: " hrs/ft²",
      status: hoursPerSqFt >= 0.3 && hoursPerSqFt <= 1.5 ? "good" : "warning",
      description: "Total project hours divided by building area"
    },
    {
      name: "Discount Application",
      value: appliedDiscount * 100,
      threshold: maxDiscount * 100,
      unit: "%",
      status: appliedDiscount <= maxDiscount ? "good" : "error",
      description: "Applied discount vs maximum allowable discount"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "good":
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Caution</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sanity Check & Market Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Market Price</div>
            <div className="text-xl font-bold">{formatCurrency(marketPrice)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Discounted Final Price</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(discountedPrice)}</div>
          </div>
        </div>

        {/* Applied Discount */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Applied Discount</span>
            <span className="text-sm font-medium">{formatPercent(appliedDiscount)}</span>
          </div>
          <Progress 
            value={(appliedDiscount / maxDiscount) * 100} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            Maximum allowable: {formatPercent(maxDiscount)}
          </div>
        </div>

        {/* Sanity Checks */}
        <div className="space-y-3">
          <h4 className="font-medium">Validation Checks</h4>
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <div className="font-medium text-sm">{check.name}</div>
                  <div className="text-xs text-muted-foreground">{check.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {check.value.toFixed(2)}{check.unit}
                </div>
                {getStatusBadge(check.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Fee Variance Alert */}
        {feeVariancePercent > 25 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Large variance ({feeVariancePercent.toFixed(1)}%) between fee calculation methods. 
              Consider reviewing project parameters or consulting with management.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
