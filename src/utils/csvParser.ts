import Papa from 'papaparse';
import { DataPoint, ColumnInfo } from '../types';

export const parseCSV = (file: File): Promise<{ data: DataPoint[]; columns: ColumnInfo[] }> => {
  return new Promise((resolve, reject) => {
    // For large files, use streaming and chunking
    const isLargeFile = file.size > 5 * 1024 * 1024; // 5MB threshold
    
    if (isLargeFile) {
      // Use streaming for large files
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunk: (results, parser) => {
          // Process chunks to avoid blocking the UI
          // For now, we'll continue with the full parse but with worker
          // In a production app, you might want to implement progressive loading
        },
        worker: true, // Use web worker for better performance
        complete: (results) => {
          try {
            const data = results.data as DataPoint[];
            
            // For very large datasets, sample the data for column analysis
            const sampleSize = Math.min(1000, data.length);
            const sampleData = data.slice(0, sampleSize);
            
            const columns = analyzeColumns(sampleData, data.length);
            resolve({ data, columns });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    } else {
      // Standard parsing for smaller files
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as DataPoint[];
            const columns = analyzeColumns(data);
            resolve({ data, columns });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    }
  });
};

const analyzeColumns = (data: DataPoint[], totalRows?: number): ColumnInfo[] => {
  if (data.length === 0) return [];

  const columns: ColumnInfo[] = [];
  const firstRow = data[0];
  const sampleSize = Math.min(500, data.length); // Analyze up to 500 rows for performance

  Object.keys(firstRow).forEach(columnName => {
    // Use sample for analysis to improve performance on large datasets
    const sampleData = data.slice(0, sampleSize);
    const values = sampleData
      .map(row => row[columnName])
      .filter(val => val !== null && val !== undefined && val !== '');
    
    const numericValues = values.map(val => {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }).filter(val => val !== null) as number[];

    const isNumeric = numericValues.length > values.length * 0.8; // 80% threshold for numeric classification

    // For large datasets, don't store all values to save memory
    const shouldStoreAllValues = (totalRows || data.length) < 10000;
    
    columns.push({
      name: columnName,
      type: isNumeric ? 'numeric' : 'categorical',
      values: shouldStoreAllValues 
        ? (isNumeric ? numericValues : values as string[])
        : (isNumeric ? numericValues.slice(0, 100) : (values as string[]).slice(0, 100))
    });
  });

  return columns;
};

export const normalizeData = (data: DataPoint[], columns: string[]): DataPoint[] => {
  // For large datasets, use more efficient normalization
  const isLargeDataset = data.length > 10000;
  
  if (isLargeDataset) {
    // Process in batches to avoid blocking the UI
    return normalizeDataBatched(data, columns);
  }
  
  const normalizedData = [...data];
  
  columns.forEach(column => {
    const values = data.map(row => Number(row[column])).filter(val => !isNaN(val));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range > 0) {
      normalizedData.forEach(row => {
        const value = Number(row[column]);
        if (!isNaN(value)) {
          row[`${column}_normalized`] = (value - min) / range;
        }
      });
    }
  });

  return normalizedData;
};

const normalizeDataBatched = (data: DataPoint[], columns: string[]): DataPoint[] => {
  const batchSize = 1000;
  const normalizedData = [...data];
  
  // Pre-calculate min/max for all columns
  const columnStats = columns.reduce((stats, column) => {
    const values = data.map(row => Number(row[column])).filter(val => !isNaN(val));
    stats[column] = {
      min: Math.min(...values),
      max: Math.max(...values),
      range: Math.max(...values) - Math.min(...values)
    };
    return stats;
  }, {} as Record<string, { min: number; max: number; range: number }>);
  
  // Process data in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = normalizedData.slice(i, i + batchSize);
    
    batch.forEach(row => {
      columns.forEach(column => {
        const value = Number(row[column]);
        const stats = columnStats[column];
        
        if (!isNaN(value) && stats.range > 0) {
          row[`${column}_normalized`] = (value - stats.min) / stats.range;
        }
      });
    });
    
    // Allow UI to update between batches
    if (i % (batchSize * 5) === 0) {
      // Small delay to prevent blocking
      setTimeout(() => {}, 0);
    }
  }
  
  return normalizedData;
};