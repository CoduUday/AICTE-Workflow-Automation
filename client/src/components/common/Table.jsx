import { Loader2 } from 'lucide-react';

export default function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found matching your criteria.',
  emptyAction = null,
  keyExtractor = (item, idx) => item.id || idx
}) {
  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Fetching records...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center px-4">
        <p className="text-sm text-slate-500 font-medium mb-3">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75">
            {columns.map((col, index) => (
              <th
                key={index}
                className={`py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row, rowIndex)}
              className="hover:bg-blue-50/30 transition-colors group"
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`py-3.5 px-4 text-slate-700 align-middle ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.cellClassName || ''}`}
                >
                  {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
