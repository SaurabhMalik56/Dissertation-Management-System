import React from 'react';

const DataTable = ({ 
  columns, 
  data, 
  pagination = null,
  onPageChange = null,
  emptyMessage = 'No data available',
  isLoading = false,
  tableCssClass = 'table'
}) => {
  const { page, limit, total } = pagination || { page: 1, limit: 10, total: data?.length || 0 };
  const pageCount = Math.ceil(total / limit);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {data && data.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className={tableCssClass}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className={col.cssClass || ''}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.id || index}>
                    {columns.map(col => (
                      <td key={`${row.id || index}-${col.key}`} className={col.cellClass || ''}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {pagination && pageCount > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={() => onPageChange && onPageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pageCount} ({total} items)
              </span>
              <button 
                onClick={() => onPageChange && onPageChange(page + 1)}
                disabled={page >= pageCount}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">{emptyMessage}</div>
      )}
    </div>
  );
};

export default React.memo(DataTable); 