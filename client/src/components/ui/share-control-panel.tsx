import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface ShareControlPanelProps {
  shellShare: number;
  interiorShare: number;
  landscapeShare: number;
  onShareChange: (type: 'shell' | 'interior' | 'landscape', value: number) => void;
  disabled?: boolean;
  // New props for discipline percentages
  structuralPercentage: number;
  civilPercentage: number;
  mechanicalPercentage: number;
  electricalPercentage: number;
  plumbingPercentage: number;
  telecomPercentage: number;
  onDisciplinePercentageChange: (
    type: 'structural' | 'civil' | 'mechanical' | 'electrical' | 'plumbing' | 'telecom',
    value: number
  ) => void;
  // New prop for category override
  categoryOverride: number | undefined;
  onCategoryChange: (value: number) => void;
}

export function ShareControlPanel({
  shellShare,
  interiorShare,
  landscapeShare,
  onShareChange,
  disabled = false,
  structuralPercentage,
  civilPercentage,
  mechanicalPercentage,
  electricalPercentage,
  plumbingPercentage,
  telecomPercentage,
  onDisciplinePercentageChange,
  categoryOverride,
  onCategoryChange
}: ShareControlPanelProps) {
  const totalShare = shellShare + interiorShare + landscapeShare;
  const isValid = Math.abs(totalShare - 1.0) < 0.001;

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const handleShareSliderChange = (type: 'shell' | 'interior' | 'landscape', value: number) => {
    onShareChange(type, value / 100);
  };

  const handleShareInputChange = (type: 'shell' | 'interior' | 'landscape', value: string) => {
    const numValue = parseFloat(value) / 100;
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      onShareChange(type, numValue);
    }
  };

  const handleDisciplineInputChange = (type: 'structural' | 'civil' | 'mechanical' | 'electrical' | 'plumbing' | 'telecom', value: string) => {
    const numValue = parseFloat(value) / 100;
    if (!isNaN(numValue)) {
      onDisciplinePercentageChange(type, numValue);
    }
  };

  const handleDisciplineSliderChange = (type: 'structural' | 'civil' | 'mechanical' | 'electrical' | 'plumbing' | 'telecom', value: number) => {
    onDisciplinePercentageChange(type, value / 100);
  };

  const handleCategoryChange = (value: string) => {
    onCategoryChange(Number(value));
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
        <div className="space-y-4">
          <div>
            <Label htmlFor="category-override">Project Category</Label>
            <Select value={categoryOverride?.toString()} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Category 1 (Simple)</SelectItem>
                <SelectItem value="2">Category 2 (Standard)</SelectItem>
                <SelectItem value="3">Category 3 (Moderate)</SelectItem>
                <SelectItem value="4">Category 4 (Complex)</SelectItem>
                <SelectItem value="5">Category 5 (Highly Complex)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shell Share */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Shell Budget Share</Label>
              <Input
                type="number"
                value={(shellShare * 100).toFixed(1)}
                onChange={(e) => handleShareInputChange('shell', e.target.value)}
                className="w-20 text-right"
                disabled={disabled}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <Slider
              value={[shellShare * 100]}
              onValueChange={([value]) => handleShareSliderChange('shell', value)}
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
                onChange={(e) => handleShareInputChange('interior', e.target.value)}
                className="w-20 text-right"
                disabled={disabled}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <Slider
              value={[interiorShare * 100]}
              onValueChange={([value]) => handleShareSliderChange('interior', value)}
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
                onChange={(e) => handleShareInputChange('landscape', e.target.value)}
                className="w-20 text-right"
                disabled={disabled}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <Slider
              value={[landscapeShare * 100]}
              onValueChange={([value]) => handleShareSliderChange('landscape', value)}
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
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium">Engineering Discipline Percentages</h4>

          <div>
            <Label htmlFor="structural-percentage">Structural (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="structural-percentage"
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={(structuralPercentage * 100).toFixed(1)}
                onChange={(e) => handleDisciplineInputChange('structural', e.target.value)}
                className="w-20"
              />
              <Slider
                value={[structuralPercentage * 100]}
                onValueChange={([value]) => handleDisciplineSliderChange('structural', value)}
                max={20}
                min={0}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="civil-percentage">Civil (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="civil-percentage"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={(civilPercentage * 100).toFixed(1)}
                onChange={(e) => handleDisciplineInputChange('civil', e.target.value)}
                className="w-20"
              />
              <Slider
                value={[civilPercentage * 100]}
                onValueChange={([value]) => handleDisciplineSliderChange('civil', value)}
                max={10}
                min={0}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mechanical-percentage">Mechanical (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="mechanical-percentage"
                type="number"
                min="0"
                max="15"
                step="0.1"
                value={(mechanicalPercentage * 100).toFixed(1)}
                onChange={(e) => handleDisciplineInputChange('mechanical', e.target.value)}
                className="w-20"
              />
              <Slider
                value={[mechanicalPercentage * 100]}
                onValueChange={([value]) => handleDisciplineSliderChange('mechanical', value)}
                max={15}
                min={0}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="electrical-percentage">Electrical (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="electrical-percentage"
                type="number"
                min="0"
                max="15"
                step="0.1"
                value={(electricalPercentage * 100).toFixed(1)}
                onChange={(e) => handleDisciplineInputChange('electrical', e.target.value)}
                className="w-20"
              />
              <Slider
                value={[electricalPercentage * 100]}
                onValueChange={([value]) => handleDisciplineSliderChange('electrical', value)}
                max={15}
                min={0}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plumbing-percentage">Plumbing (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="plumbing-percentage"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={(plumbingPercentage * 100).toFixed(1)}
                onChange={(e) => handleDisciplineInputChange('plumbing', e.target.value)}
                className="w-20"
              />
              <Slider
                value={[plumbingPercentage * 100]}
                onValueChange={([value]) => handleDisciplineSliderChange('plumbing', value)}
                max={10}
                min={0}
                step={0.1}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="telecom-percentage">Telecommunication (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="telecom-percentage"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={(telecomPercentage * 100).toFixed(1)}
                onChange={(e) => handleDisciplineInputChange('telecom', e.target.value)}
                className="w-20"
              />
              <Slider
                value={[telecomPercentage * 100]}
                onValueChange={([value]) => handleDisciplineSliderChange('telecom', value)}
                max={5}
                min={0}
                step={0.1}
                className="flex-1"
              />
            </div>
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