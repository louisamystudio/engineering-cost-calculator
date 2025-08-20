
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DisciplineBudgetCardProps {
  title: string;
  totalBudget: number;
  newBudget: number;
  remodelBudget: number;
  sharePercentage?: number;
  hasRemodelReduction?: boolean;
  remodelMultiplier?: number;
  className?: string;
}

export function DisciplineBudgetCard({
  title,
  totalBudget,
  newBudget,
  remodelBudget,
  sharePercentage,
  hasRemodelReduction = false,
  remodelMultiplier = 1.0,
  className = ""
}: DisciplineBudgetCardProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const newPercentage = totalBudget > 0 ? (newBudget / totalBudget) * 100 : 0;
  const remodelPercentage = totalBudget > 0 ? (remodelBudget / totalBudget) * 100 : 0;

  return (
    <TooltipProvider>
      <Card className={`${className} border-l-4 border-l-blue-500`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{title}</span>
            {sharePercentage && (
              <Badge variant="secondary" className="text-xs">
                {formatPercent(sharePercentage)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Budget */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalBudget)}
            </div>
            <div className="text-sm text-muted-foreground">Total Budget</div>
          </div>

          {/* New vs Remodel Breakdown */}
          <div className="space-y-3">
            {/* New Construction */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">New Construction</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(newBudget)}</div>
                <div className="text-xs text-muted-foreground">
                  {newPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Remodel */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Remodel</span>
                {hasRemodelReduction && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Structural remodel costs reduced by {formatPercent(1 - remodelMultiplier)}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(remodelBudget)}</div>
                <div className="text-xs text-muted-foreground">
                  {remodelPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${newPercentage}%` }}
                />
                <div 
                  className="bg-orange-500" 
                  style={{ width: `${remodelPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>New: {newPercentage.toFixed(1)}%</span>
                <span>Remodel: {remodelPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
