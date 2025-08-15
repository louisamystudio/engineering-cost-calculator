export interface CalculationResult {
  squareFeet: number;
  hourlyFactor: number;
  hourlyFactorAlt?: number;
  totalHours: number;
  totalHoursAlt?: number;
}

export interface RangeData extends CalculationResult {
  difference: number | null;
  differenceAlt?: number | null;
}

export type EquationType = 'original' | 'alternative' | 'both';

export function calculateHourlyFactor(squareFeet: number, equation: 'original' | 'alternative' = 'original'): number {
  if (squareFeet <= 0) return 0;
  const baseValue = 0.21767 + 11.21274 * Math.pow(squareFeet, -0.53816);
  return equation === 'alternative' ? baseValue - 0.08 : baseValue;
}

export function calculateBothEquations(squareFeet: number): { original: number; alternative: number } {
  if (squareFeet <= 0) return { original: 0, alternative: 0 };
  const baseValue = 0.21767 + 11.21274 * Math.pow(squareFeet, -0.53816);
  return {
    original: baseValue,
    alternative: baseValue - 0.08
  };
}

export function generateRangeData(
  start: number,
  end: number,
  interval: number,
  equationType: EquationType = 'original'
): RangeData[] {
  const results: RangeData[] = [];
  let previousValue: number | null = null;
  let previousAltValue: number | null = null;

  for (let sqFt = start; sqFt <= end; sqFt += interval) {
    const calculations = calculateBothEquations(sqFt);
    const hf = calculations.original;
    const hfAlt = calculations.alternative;
    
    const difference = previousValue !== null ? hf - previousValue : null;
    const differenceAlt = previousAltValue !== null ? hfAlt - previousAltValue : null;
    
    const result: RangeData = {
      squareFeet: sqFt,
      hourlyFactor: hf,
      totalHours: hf * sqFt,
      difference
    };
    
    if (equationType === 'alternative' || equationType === 'both') {
      result.hourlyFactorAlt = hfAlt;
      result.totalHoursAlt = hfAlt * sqFt;
      result.differenceAlt = differenceAlt;
    }
    
    results.push(result);
    
    previousValue = hf;
    previousAltValue = hfAlt;
  }

  return results;
}

export function generateChartData(
  min: number = 100,
  max: number = 10000,
  points: number = 100,
  equationType: EquationType = 'original'
): { x: number; y: number; yAlt?: number }[] {
  const data: { x: number; y: number; yAlt?: number }[] = [];
  const step = (max - min) / points;
  
  for (let x = min; x <= max; x += step) {
    const calculations = calculateBothEquations(x);
    const point: { x: number; y: number; yAlt?: number } = {
      x: x,
      y: calculations.original
    };
    
    if (equationType === 'alternative' || equationType === 'both') {
      point.yAlt = calculations.alternative;
    }
    
    data.push(point);
  }
  
  return data;
}

export function exportToCSV(data: RangeData[], equationType: EquationType = 'original'): string {
  let headers = ['Square Feet', 'Hourly Factor (Original)', 'Total Hours (Original)', 'Difference (Original)'];
  
  if (equationType === 'alternative') {
    headers = ['Square Feet', 'Hourly Factor (Alternative)', 'Total Hours (Alternative)', 'Difference (Alternative)'];
  } else if (equationType === 'both') {
    headers = ['Square Feet', 'Hourly Factor (Original)', 'Total Hours (Original)', 'Difference (Original)', 'Hourly Factor (Alternative)', 'Total Hours (Alternative)', 'Difference (Alternative)'];
  }
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => {
      if (equationType === 'alternative') {
        return [
          row.squareFeet.toFixed(0),
          row.hourlyFactorAlt?.toFixed(5) || '-',
          row.totalHoursAlt?.toFixed(2) || '-',
          row.differenceAlt?.toFixed(5) || '-'
        ].join(',');
      } else if (equationType === 'both') {
        return [
          row.squareFeet.toFixed(0),
          row.hourlyFactor.toFixed(5),
          row.totalHours.toFixed(2),
          row.difference?.toFixed(5) || '-',
          row.hourlyFactorAlt?.toFixed(5) || '-',
          row.totalHoursAlt?.toFixed(2) || '-',
          row.differenceAlt?.toFixed(5) || '-'
        ].join(',');
      } else {
        return [
          row.squareFeet.toFixed(0),
          row.hourlyFactor.toFixed(5),
          row.totalHours.toFixed(2),
          row.difference?.toFixed(5) || '-'
        ].join(',');
      }
    })
  ].join('\n');
  
  return csvContent;
}

export function downloadCSV(data: RangeData[], equationType: EquationType = 'original', filename: string = 'hourly-factor-data.csv'): void {
  const csvContent = exportToCSV(data, equationType);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
