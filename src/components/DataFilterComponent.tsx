import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Filter, RotateCcw } from 'lucide-react';
import { DataFilter, ColumnInfo } from '../types';

interface DataFilterComponentProps {
  columns: ColumnInfo[];
  filters: DataFilter[];
  onFiltersChange: (filters: DataFilter[]) => void;
  theme: string;
  data: any[];
}

export const DataFilterComponent: React.FC<DataFilterComponentProps> = ({
  columns,
  filters,
  onFiltersChange,
  theme,
  data
}) => {
  const [localFilters, setLocalFilters] = useState<DataFilter[]>(filters);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Calculate min/max values for each numeric column for better slider ranges
  const columnRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number; step: number }> = {};
    
    columns.forEach(column => {
      const values = data
        .map(row => Number(row[column.name]))
        .filter(val => !isNaN(val) && isFinite(val));
      
      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        
        // Calculate appropriate step size based on range
        let step = 1;
        if (range < 1) step = 0.01;
        else if (range < 10) step = 0.1;
        else if (range < 100) step = 1;
        else if (range < 1000) step = 10;
        else step = 100;
        
        ranges[column.name] = { min, max, step };
      }
    });
    
    return ranges;
  }, [columns, data]);

  // Debounced filter update
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 150); // Reduced debounce time for smoother experience
    
    setDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [localFilters]);

  // Sync with external filter changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          card: 'bg-gray-800 border-gray-700',
          input: 'bg-gray-700 border-gray-600 text-white',
          slider: 'bg-gray-700',
          button: 'bg-gray-700 text-white hover:bg-gray-600',
          addButton: 'bg-green-600 hover:bg-green-700 text-white',
          removeButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'accent':
        return {
          card: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200',
          input: 'bg-white border-purple-200 text-purple-900',
          slider: 'bg-purple-100',
          button: 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200',
          addButton: 'bg-green-500 hover:bg-green-600 text-white',
          removeButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
      default:
        return {
          card: 'bg-white border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900',
          slider: 'bg-gray-100',
          button: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          addButton: 'bg-green-500 hover:bg-green-600 text-white',
          removeButton: 'bg-red-500 hover:bg-red-600 text-white'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const addFilter = () => {
    const firstColumn = columns[0];
    const range = columnRanges[firstColumn?.name];
    
    const newFilter: DataFilter = {
      id: `filter-${Date.now()}`,
      column: firstColumn?.name || '',
      operator: 'greater',
      value: range ? range.min : 0
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<DataFilter>) => {
    const updatedFilters = localFilters.map(filter =>
      filter.id === id ? { ...filter, ...updates } : filter
    );
    setLocalFilters(updatedFilters);
  };

  const removeFilter = (id: string) => {
    setLocalFilters(localFilters.filter(filter => filter.id !== id));
  };

  const clearAllFilters = () => {
    setLocalFilters([]);
  };

  const resetFilterValue = (filterId: string, columnName: string) => {
    const range = columnRanges[columnName];
    if (range) {
      updateFilter(filterId, { value: range.min });
    }
  };

  const operatorLabels = {
    greater: '>',
    less: '<',
    equal: '=',
    greaterEqual: '≥',
    lessEqual: '≤'
  };

  const operatorFullLabels = {
    greater: 'Greater than',
    less: 'Less than',
    equal: 'Equal to',
    greaterEqual: 'Greater than or equal',
    lessEqual: 'Less than or equal'
  };

  if (columns.length === 0) return null;

  return (
    <div className={`mb-6 p-4 rounded-lg border ${themeClasses.card} transition-all duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Data Filters
          </h3>
          {localFilters.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full animate-pulse">
              {localFilters.length} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {localFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={addFilter}
            className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${themeClasses.addButton} transform hover:scale-105`}
          >
            <Plus className="h-3 w-3" />
            <span>Add Filter</span>
          </button>
        </div>
      </div>

      {localFilters.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No filters applied. Click "Add Filter" to filter your data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localFilters.map((filter, index) => {
            const range = columnRanges[filter.column];
            const currentValue = filter.value;
            
            return (
              <div key={filter.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {index === 0 ? 'Show data where:' : 'AND:'}
                  </span>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className={`p-1 rounded transition-all duration-200 ${themeClasses.removeButton} hover:scale-110`}
                    title="Remove filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Column Selection */}
                  <div className="col-span-3">
                    <select
                      value={filter.column}
                      onChange={(e) => {
                        const newColumn = e.target.value;
                        const newRange = columnRanges[newColumn];
                        updateFilter(filter.id, { 
                          column: newColumn,
                          value: newRange ? newRange.min : 0
                        });
                      }}
                      className={`w-full text-xs px-2 py-2 rounded border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                    >
                      {columns.map(column => (
                        <option key={column.name} value={column.name}>
                          {column.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator Selection */}
                  <div className="col-span-2">
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, { operator: e.target.value as DataFilter['operator'] })}
                      className={`w-full text-xs px-2 py-2 rounded border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                      title={operatorFullLabels[filter.operator]}
                    >
                      {Object.entries(operatorLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value Slider */}
                  <div className="col-span-5">
                    {range && (
                      <div className="space-y-1">
                        <input
                          type="range"
                          min={range.min}
                          max={range.max}
                          step={range.step}
                          value={currentValue}
                          onChange={(e) => updateFilter(filter.id, { value: Number(e.target.value) })}
                          className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all duration-200 ${themeClasses.slider} 
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
                            [&::-webkit-slider-thumb]:hover:bg-blue-600 [&::-webkit-slider-thumb]:hover:scale-110
                            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                            [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none
                            [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200`}
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{range.min.toFixed(range.step < 1 ? 2 : 0)}</span>
                          <span>{range.max.toFixed(range.step < 1 ? 2 : 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Value Input */}
                  <div className="col-span-2 flex items-center space-x-1">
                    <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => updateFilter(filter.id, { value: Number(e.target.value) })}
                      step={range?.step || 1}
                      min={range?.min}
                      max={range?.max}
                      className={`w-full text-xs px-2 py-2 rounded border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                    />
                    {range && (
                      <button
                        onClick={() => resetFilterValue(filter.id, filter.column)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        title="Reset to minimum"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress indicator */}
                {range && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-out"
                        style={{ 
                          width: `${((currentValue - range.min) / (range.max - range.min)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};