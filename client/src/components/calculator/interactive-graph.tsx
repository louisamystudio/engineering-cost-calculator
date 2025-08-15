import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { generateChartData } from '@/lib/calculations';

interface InteractiveGraphProps {
  currentPoint: { x: number; y: number };
  graphXMin: number;
  graphXMax: number;
  showGrid: boolean;
  onResetZoom: () => void;
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
  onResetZoom
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
      
      chartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Hourly Factor',
            data: generateChartData(min, max),
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
          }, {
            label: 'Current Point',
            data: [currentPoint],
            borderColor: '#10B981',
            backgroundColor: '#10B981',
            borderWidth: 0,
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
          }]
        },
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
  }, [graphXMin, graphXMax, showGrid]);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.data.datasets[1].data = [currentPoint];
      chartInstance.current.update('none');
    }
  }, [currentPoint]);

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
