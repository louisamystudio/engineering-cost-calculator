export interface CalculationResult {
  squareFeet: number;
  hourlyFactor: number;
}

export interface RangeData extends CalculationResult {
  difference: number | null;
}

export function calculateHourlyFactor(squareFeet: number): number {
  if (squareFeet <= 0) return 0;
  return 0.21767 + 11.21274 * Math.pow(squareFeet, -0.53816);
}

export function generateRangeData(
  start: number,
  end: number,
  interval: number
): RangeData[] {
  const results: RangeData[] = [];
  let previousValue: number | null = null;

  for (let sqFt = start; sqFt <= end; sqFt += interval) {
    const hf = calculateHourlyFactor(sqFt);
    const difference = previousValue !== null ? hf - previousValue : null;
    
    results.push({
      squareFeet: sqFt,
      hourlyFactor: hf,
      difference
    });
    
    previousValue = hf;
  }

  return results;
}

export function generateChartData(
  min: number = 100,
  max: number = 10000,
  points: number = 100
): { x: number; y: number }[] {
  const data: { x: number; y: number }[] = [];
  const step = (max - min) / points;
  
  for (let x = min; x <= max; x += step) {
    data.push({
      x: x,
      y: calculateHourlyFactor(x)
    });
  }
  
  return data;
}

export function exportToCSV(data: RangeData[]): string {
  const headers = ['Square Feet', 'Hourly Factor', 'Difference'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.squareFeet.toFixed(0),
      row.hourlyFactor.toFixed(5),
      row.difference?.toFixed(5) || '-'
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

export function downloadCSV(data: RangeData[], filename: string = 'hourly-factor-data.csv'): void {
  const csvContent = exportToCSV(data);
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
