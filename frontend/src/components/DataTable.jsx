import React from 'react';
import PropTypes from 'prop-types';

const DataTable = ({ 
  columns, 
  data, 
  pagination, 
  onPageChange, 
  isLoading,
  emptyMessage = "No data available." 
}) => {
  return (
    <div className="overflow-x-auto">
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-left text-sm uppercase">
                {columns.map(column => (
                  <th key={column.key} className="py-3 px-4 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {data.length === 0 ? (
                <tr>
                  <td 
                    className="py-4 px-4 text-center text-gray-500" 
                    colSpan={columns.length}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    {columns.map(column => (
                      <td key={`${item.id || index}-${column.key}`} className="py-3 px-4">
                        {column.render ? 
                          column.render(item) : 
                          item[column.key] || '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-4">
              <div className="text-sm text-gray-500">
                Showing page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className={`px-3 py-1 rounded ${
                    pagination.currentPage <= 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className={`px-3 py-1 rounded ${
                    pagination.currentPage >= pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired
  }),
  onPageChange: PropTypes.func,
  isLoading: PropTypes.bool,
  emptyMessage: PropTypes.string
};

export default DataTable; 