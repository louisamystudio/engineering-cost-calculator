
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardContent } from "./card";

interface DisciplineShareControlProps {
  label: string;
  budget: number;
  shareOverride?: number;
  onShareChange: (value: number | undefined) => void;
  placeholder?: string;
}

export function DisciplineShareControl({
  label,
  budget,
  shareOverride,
  onShareChange,
  placeholder = "5.0"
}: DisciplineShareControlProps) {
  return (
    <Card className="p-3">
      <div className="text-center">
        <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
          ${budget.toLocaleString()}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{label}</div>
        <div>
          <Label className="text-xs">Share Override (%)</Label>
          <Input
            type="number"
            value={shareOverride ? (shareOverride * 100).toFixed(2) : ''}
            onChange={(e) => {
              const val = e.target.value;
              onShareChange(val ? parseFloat(val) / 100 : undefined);
            }}
            placeholder={placeholder}
            className="mt-1 text-center text-xs"
            step="0.01"
          />
        </div>
      </div>
    </Card>
  );
}
