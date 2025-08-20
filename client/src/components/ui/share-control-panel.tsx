
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface ShareControlPanelProps {
  shellShare: number;
  interiorShare: number;
  landscapeShare: number;
  onShareChange: (type: 'shell' | 'interior' | 'landscape', value: number) => void;
  disabled?: boolean;
}

export function ShareControlPanel({
  shellShare,
  interiorShare,
  landscapeShare,
  onShareChange,
  disabled = false
}: ShareControlPanelProps) {
  const totalShare = shellShare + interiorShare + landscapeShare;
  const isValid = Math.abs(totalShare - 1.0) < 0.001;

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const handleSliderChange = (type: 'shell' | 'interior' | 'landscape', newValue: number[]) => {
    onShareChange(type, newValue[0] / 100);
  };

  const handleInputChange = (type: 'shell' | 'interior' | 'landscape', value: string) => {
    const numValue = parseFloat(value) / 100;
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      onShareChange(type, numValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Budget Share Distribution
          {!isValid && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Must sum to 100%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shell Share */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Shell Budget Share</Label>
            <Input
              type="number"
              value={(shellShare * 100).toFixed(1)}
              onChange={(e) => handleInputChange('shell', e.target.value)}
              className="w-20 text-right"
              disabled={disabled}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <Slider
            value={[shellShare * 100]}
            onValueChange={(value) => handleSliderChange('shell', value)}
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground text-right">
            {formatPercent(shellShare)}
          </div>
        </div>

        {/* Interior Share */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Interior Budget Share</Label>
            <Input
              type="number"
              value={(interiorShare * 100).toFixed(1)}
              onChange={(e) => handleInputChange('interior', e.target.value)}
              className="w-20 text-right"
              disabled={disabled}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <Slider
            value={[interiorShare * 100]}
            onValueChange={(value) => handleSliderChange('interior', value)}
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground text-right">
            {formatPercent(interiorShare)}
          </div>
        </div>

        {/* Landscape Share */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Landscape Budget Share</Label>
            <Input
              type="number"
              value={(landscapeShare * 100).toFixed(1)}
              onChange={(e) => handleInputChange('landscape', e.target.value)}
              className="w-20 text-right"
              disabled={disabled}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <Slider
            value={[landscapeShare * 100]}
            onValueChange={(value) => handleSliderChange('landscape', value)}
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground text-right">
            {formatPercent(landscapeShare)}
          </div>
        </div>

        {/* Total Validation */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total:</span>
            <Badge variant={isValid ? "secondary" : "destructive"}>
              {formatPercent(totalShare)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
