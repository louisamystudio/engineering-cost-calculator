export interface CalculationResult {
  squareFeet: number;
  hourlyFactor: number;
  hourlyFactorAlt?: number;
  totalHours: number;
  totalHoursAlt?: number;
}

export interface RangeData extends CalculationResult {
  hoursDifference: number | null;
  hoursDifferenceAlt?: number | null;
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
  let previousTotalHours: number | null = null;
  let previousAltTotalHours: number | null = null;

  for (let sqFt = start; sqFt <= end; sqFt += interval) {
    const calculations = calculateBothEquations(sqFt);
    const hf = calculations.original;
    const hfAlt = calculations.alternative;
    const totalHours = hf * sqFt;
    const totalHoursAlt = hfAlt * sqFt;
    
    const hoursDifference = previousTotalHours !== null ? totalHours - previousTotalHours : null;
    const hoursDifferenceAlt = previousAltTotalHours !== null ? totalHoursAlt - previousAltTotalHours : null;
    
    const result: RangeData = {
      squareFeet: sqFt,
      hourlyFactor: hf,
      totalHours: totalHours,
      hoursDifference
    };
    
    if (equationType === 'alternative' || equationType === 'both') {
      result.hourlyFactorAlt = hfAlt;
      result.totalHoursAlt = totalHoursAlt;
      result.hoursDifferenceAlt = hoursDifferenceAlt;
    }
    
    results.push(result);
    
    previousTotalHours = totalHours;
    previousAltTotalHours = totalHoursAlt;
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
  let headers = ['Square Feet', 'Hourly Factor (Original)', 'Total Hours (Original)', 'Hours Difference (Original)'];
  
  if (equationType === 'alternative') {
    headers = ['Square Feet', 'Hourly Factor (Alternative)', 'Total Hours (Alternative)', 'Hours Difference (Alternative)'];
  } else if (equationType === 'both') {
    headers = ['Square Feet', 'Hourly Factor (Original)', 'Total Hours (Original)', 'Hours Difference (Original)', 'Hourly Factor (Alternative)', 'Total Hours (Alternative)', 'Hours Difference (Alternative)'];
  }
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => {
      if (equationType === 'alternative') {
        return [
          row.squareFeet.toFixed(0),
          row.hourlyFactorAlt?.toFixed(5) || '-',
          row.totalHoursAlt?.toFixed(2) || '-',
          row.hoursDifferenceAlt?.toFixed(2) || '-'
        ].join(',');
      } else if (equationType === 'both') {
        return [
          row.squareFeet.toFixed(0),
          row.hourlyFactor.toFixed(5),
          row.totalHours.toFixed(2),
          row.hoursDifference?.toFixed(2) || '-',
          row.hourlyFactorAlt?.toFixed(5) || '-',
          row.totalHoursAlt?.toFixed(2) || '-',
          row.hoursDifferenceAlt?.toFixed(2) || '-'
        ].join(',');
      } else {
        return [
          row.squareFeet.toFixed(0),
          row.hourlyFactor.toFixed(5),
          row.totalHours.toFixed(2),
          row.hoursDifference?.toFixed(2) || '-'
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
