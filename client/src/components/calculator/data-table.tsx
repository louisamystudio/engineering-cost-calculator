import { Button } from '@/components/ui/button';
import { RangeData, downloadCSV, EquationType } from '@/lib/calculations';

interface DataTableProps {
  data: RangeData[];
  onExportCSV: () => void;
  selectedEquation: EquationType;
}

export default function DataTable({ data, onExportCSV, selectedEquation }: DataTableProps) {
  const handleExportCSV = () => {
    if (data.length > 0) {
      downloadCSV(data, selectedEquation);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-dark-slate">Generated Data Table</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{data.length} entries</span>
          <Button
            variant="ghost"
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
          >
            Export CSV
          </Button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            📊
          </div>
          <h4 className="font-medium mb-2">No data generated yet</h4>
          <p className="text-sm">Use the range calculator to generate a data table</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-light-border">
                <th className="text-left py-3 px-4 font-semibold text-dark-slate text-sm">Square Feet</th>
                {(selectedEquation === 'original' || selectedEquation === 'both') && (
                  <>
                    <th className="text-left py-3 px-4 font-semibold text-dark-slate text-sm">Original HF</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-slate text-sm">Original Diff</th>
                  </>
                )}
                {(selectedEquation === 'alternative' || selectedEquation === 'both') && (
                  <>
                    <th className="text-left py-3 px-4 font-semibold text-dark-slate text-sm">
                      {selectedEquation === 'alternative' ? 'Hourly Factor' : 'Alternative HF'}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-slate text-sm">
                      {selectedEquation === 'alternative' ? 'Difference' : 'Alternative Diff'}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-3 px-4 font-mono text-sm">{row.squareFeet.toFixed(0)}</td>
                  {(selectedEquation === 'original' || selectedEquation === 'both') && (
                    <>
                      <td className="py-3 px-4 font-mono text-sm text-scientific-blue font-medium">
                        {row.hourlyFactor.toFixed(5)}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">
                        {row.difference?.toFixed(5) || '-'}
                      </td>
                    </>
                  )}
                  {(selectedEquation === 'alternative' || selectedEquation === 'both') && (
                    <>
                      <td className="py-3 px-4 font-mono text-sm text-red-500 font-medium">
                        {row.hourlyFactorAlt?.toFixed(5) || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">
                        {row.differenceAlt?.toFixed(5) || '-'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
