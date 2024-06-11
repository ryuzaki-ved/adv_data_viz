import React from 'react';
import { Plus, X, Filter } from 'lucide-react';
import { DataFilter, ColumnInfo } from '../types';

interface DataFilterComponentProps {
  columns: ColumnInfo[];
  filters: DataFilter[];
  onFiltersChange: (filters: DataFilter[]) => void;
  theme: string;
}

export const DataFilterComponent: React.FC<DataFilterComponentProps> = ({
  columns,
  filters,
  onFiltersChange,
  theme
}) => {
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          card: 'bg-gray-800 border-gray-700',
          input: 'bg-gray-700 border-gray-600 text-white',
          button: 'bg-gray-700 text-white hover:bg-gray-600',
          addButton: 'bg-green-600 hover:bg-green-700 text-white',
          removeButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'accent':
        return {
          card: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200',
          input: 'bg-white border-purple-200 text-purple-900',
          button: 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200',
          addButton: 'bg-green-500 hover:bg-green-600 text-white',
          removeButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
      default:
        return {
          card: 'bg-white border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900',
          button: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          addButton: 'bg-green-500 hover:bg-green-600 text-white',
          removeButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const addFilter = () => {
    const newFilter: DataFilter = {
      id: `filter-${Date.now()}`,
      column: columns[0]?.name || '',
      operator: 'greater',
      value: 0
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<DataFilter>) => {
    const updatedFilters = filters.map(filter =>
      filter.id === id ? { ...filter, ...updates } : filter
    );
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(filter => filter.id !== id));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const operatorLabels = {
    greater: 'Greater than',
    less: 'Less than',
    equal: 'Equal to',
    greaterEqual: 'Greater than or equal',
    lessEqual: 'Less than or equal'
  };

  if (columns.length === 0) return null;

  return (
    <div className={`mb-6 p-4 rounded-lg border ${themeClasses.card}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Data Filters
          </h3>
          {filters.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {filters.length} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {filters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={addFilter}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${themeClasses.addButton}`}
          >
            <Plus className="h-3 w-3" />
            <span>Add Filter</span>
          </button>
        </div>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No filters applied. Click "Add Filter" to filter your data.
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={filter.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-0">
                  {index === 0 ? 'Show data where' : 'AND'}
                </span>
                
                <select
                  value={filter.column}
                  onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                  className={`text-xs px-2 py-1 rounded border ${themeClasses.input} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                >
                  {columns.map(column => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value as DataFilter['operator'] })}
                  className={`text-xs px-2 py-1 rounded border ${themeClasses.input} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                >
                  {Object.entries(operatorLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: Number(e.target.value) })}
                  className={`text-xs px-2 py-1 rounded border w-20 ${themeClasses.input} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Value"
                />
              </div>

              <button
                onClick={() => removeFilter(filter.id)}
                className={`p-1 rounded ${themeClasses.removeButton}`}
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};