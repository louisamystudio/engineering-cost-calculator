import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { generateChartData, EquationType } from '@/lib/calculations';

interface InteractiveGraphProps {
  currentPoint: { x: number; y: number; yAlt?: number };
  graphXMin: number;
  graphXMax: number;
  showGrid: boolean;
  onResetZoom: () => void;
  selectedEquation: EquationType;
}

declare global {
  interface Window {
    Chart: any;
  }
}

export default function InteractiveGraph({
  currentPoint,
  graphXMin,
  graphXMax,
  showGrid,
  onResetZoom,
  selectedEquation
}: InteractiveGraphProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    // Load Chart.js dynamically
    const loadChart = async () => {
      if (!window.Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = initChart;
        document.head.appendChild(script);
      } else {
        initChart();
      }
    };

    const initChart = () => {
      if (!chartRef.current || !window.Chart) return;

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const min = graphXMin || 100;
      const max = graphXMax || 10000;
      const chartData = generateChartData(min, max, 100, selectedEquation);
      
      const datasets: any[] = [];
      
      // Original equation dataset
      if (selectedEquation === 'original' || selectedEquation === 'both') {
        datasets.push({
          label: 'Original Equation',
          data: chartData.map(point => ({ x: point.x, y: point.y })),
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#2563EB',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2
        });
      }
      
      // Alternative equation dataset
      if (selectedEquation === 'alternative' || selectedEquation === 'both') {
        datasets.push({
          label: 'Alternative Equation',
          data: chartData.map(point => ({ x: point.x, y: point.yAlt || point.y - 0.08 })),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#EF4444',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2
        });
      }
      
      // Current point for original equation
      if (selectedEquation === 'original' || selectedEquation === 'both') {
        datasets.push({
          label: 'Current Point (Original)',
          data: [{ x: currentPoint.x, y: currentPoint.y }],
          borderColor: '#10B981',
          backgroundColor: '#10B981',
          borderWidth: 0,
          pointRadius: 8,
          pointHoverRadius: 10,
          showLine: false
        });
      }
      
      // Current point for alternative equation
      if ((selectedEquation === 'alternative' || selectedEquation === 'both') && currentPoint.yAlt !== undefined) {
        datasets.push({
          label: 'Current Point (Alternative)',
          data: [{ x: currentPoint.x, y: currentPoint.yAlt }],
          borderColor: '#F97316',
          backgroundColor: '#F97316',
          borderWidth: 0,
          pointRadius: 8,
          pointHoverRadius: 10,
          showLine: false
        });
      }
      
      chartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: 'Square Feet',
                font: {
                  family: 'Inter',
                  weight: '500'
                },
                color: '#1E293B'
              },
              grid: {
                display: showGrid,
                color: '#E2E8F0'
              },
              ticks: {
                color: '#64748B'
              },
              min: min,
              max: max
            },
            y: {
              title: {
                display: true,
                text: 'Hourly Factor',
                font: {
                  family: 'Inter',
                  weight: '500'
                },
                color: '#1E293B'
              },
              grid: {
                display: showGrid,
                color: '#E2E8F0'
              },
              ticks: {
                color: '#64748B'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'nearest',
              intersect: false,
              backgroundColor: 'white',
              titleColor: '#1E293B',
              bodyColor: '#64748B',
              borderColor: '#E2E8F0',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              titleFont: {
                family: 'JetBrains Mono',
                weight: '500'
              },
              bodyFont: {
                family: 'JetBrains Mono'
              },
              callbacks: {
                title: function(tooltipItems: any[]) {
                  return `Square Feet: ${tooltipItems[0].parsed.x.toFixed(0)}`;
                },
                label: function(tooltipItem: any) {
                  return `Hourly Factor: ${tooltipItem.parsed.y.toFixed(5)}`;
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'nearest'
          }
        }
      });
    };

    loadChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [graphXMin, graphXMax, showGrid, selectedEquation]);

  useEffect(() => {
    if (chartInstance.current && chartInstance.current.data && chartInstance.current.data.datasets) {
      // Update current point datasets based on selected equation
      const datasets = chartInstance.current.data.datasets;
      
      // Find and update original current point dataset
      const originalPointIndex = datasets.findIndex((d: any) => d.label === 'Current Point (Original)');
      if (originalPointIndex !== -1 && (selectedEquation === 'original' || selectedEquation === 'both')) {
        datasets[originalPointIndex].data = [{ x: currentPoint.x, y: currentPoint.y }];
      }
      
      // Find and update alternative current point dataset
      const altPointIndex = datasets.findIndex((d: any) => d.label === 'Current Point (Alternative)');
      if (altPointIndex !== -1 && (selectedEquation === 'alternative' || selectedEquation === 'both') && currentPoint.yAlt !== undefined) {
        datasets[altPointIndex].data = [{ x: currentPoint.x, y: currentPoint.yAlt }];
      }
      
      chartInstance.current.update('none');
    }
  }, [currentPoint, selectedEquation]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-dark-slate">Interactive Graph</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 font-mono">
            Point: ({currentPoint.x.toFixed(0)}, {currentPoint.y.toFixed(5)})
          </div>
          <Button
            variant="ghost"
            onClick={onResetZoom}
            className="text-scientific-blue hover:text-blue-700 text-sm font-medium"
          >
            Reset Zoom
          </Button>
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={chartRef}
          className="w-full h-96 border border-light-border rounded-lg"
        />
      </div>
    </div>
  );
}
