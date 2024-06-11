import Papa from 'papaparse';
import { DataPoint, ColumnInfo } from '../types';

// Web Worker for CSV processing
const createCSVWorker = () => {
  const workerCode = `
    importScripts('https://unpkg.com/papaparse@5.4.1/papaparse.min.js');
    
    self.onmessage = function(e) {
      const { file, isLargeFile } = e.data;
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        worker: false, // Already in worker
        chunk: isLargeFile ? (results) => {
          self.postMessage({ type: 'chunk', data: results.data });
        } : undefined,
        complete: (results) => {
          self.postMessage({ type: 'complete', data: results.data });
        },
        error: (error) => {
          self.postMessage({ type: 'error', error: error.message });
        }
      });
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export const parseCSV = (file: File): Promise<{ data: DataPoint[]; columns: ColumnInfo[] }> => {
  return new Promise((resolve, reject) => {
    const isLargeFile = file.size > 5 * 1024 * 1024; // 5MB threshold
    const isVeryLargeFile = file.size > 50 * 1024 * 1024; // 50MB threshold
    
    if (isVeryLargeFile) {
      // Use streaming with progressive loading for very large files
      parseCSVStreaming(file, resolve, reject);
    } else if (isLargeFile) {
      // Use web worker for large files
      parseCSVWithWorker(file, resolve, reject);
    } else {
      // Standard parsing for smaller files
      parseCSVStandard(file, resolve, reject);
    }
  });
};

const parseCSVStandard = (
  file: File, 
  resolve: (value: { data: DataPoint[]; columns: ColumnInfo[] }) => void,
  reject: (reason?: any) => void
) => {
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
};

const parseCSVWithWorker = (
  file: File,
  resolve: (value: { data: DataPoint[]; columns: ColumnInfo[] }) => void,
  reject: (reason?: any) => void
) => {
  try {
    const worker = createCSVWorker();
    let allData: DataPoint[] = [];
    
    worker.onmessage = (e) => {
      const { type, data, error } = e.data;
      
      if (type === 'chunk') {
        allData = allData.concat(data);
      } else if (type === 'complete') {
        try {
          const finalData = data || allData;
          const columns = analyzeColumns(finalData, finalData.length);
          worker.terminate();
          resolve({ data: finalData, columns });
        } catch (err) {
          worker.terminate();
          reject(err);
        }
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(error));
      }
    };
    
    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };
    
    worker.postMessage({ file, isLargeFile: true });
  } catch (error) {
    // Fallback to standard parsing if worker fails
    parseCSVStandard(file, resolve, reject);
  }
};

const parseCSVStreaming = (
  file: File,
  resolve: (value: { data: DataPoint[]; columns: ColumnInfo[] }) => void,
  reject: (reason?: any) => void
) => {
  let allData: DataPoint[] = [];
  let processedRows = 0;
  const maxRows = 100000; // Limit for very large files
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    chunk: (results) => {
      const chunkData = results.data as DataPoint[];
      
      // Limit total rows for performance
      const remainingCapacity = maxRows - processedRows;
      const dataToAdd = chunkData.slice(0, remainingCapacity);
      
      allData = allData.concat(dataToAdd);
      processedRows += dataToAdd.length;
      
      // Stop parsing if we've reached the limit
      if (processedRows >= maxRows) {
        results.meta.cursor = file.size; // Force completion
      }
    },
    complete: () => {
      try {
        const columns = analyzeColumns(allData, allData.length);
        resolve({ data: allData, columns });
      } catch (error) {
        reject(error);
      }
    },
    error: (error) => {
      reject(error);
    }
  });
};

const analyzeColumns = (data: DataPoint[], totalRows?: number): ColumnInfo[] => {
  if (data.length === 0) return [];

  const columns: ColumnInfo[] = [];
  const firstRow = data[0];
  const sampleSize = Math.min(1000, data.length); // Increased sample size for better accuracy

  Object.keys(firstRow).forEach(columnName => {
    const sampleData = data.slice(0, sampleSize);
    const values = sampleData
      .map(row => row[columnName])
      .filter(val => val !== null && val !== undefined && val !== '');
    
    const numericValues = values.map(val => {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }).filter(val => val !== null) as number[];

    // More sophisticated numeric detection
    const isNumeric = numericValues.length > values.length * 0.7; // 70% threshold
    
    // For large datasets, store limited values to save memory
    const shouldStoreAllValues = (totalRows || data.length) < 50000;
    const maxStoredValues = 1000;
    
    columns.push({
      name: columnName,
      type: isNumeric ? 'numeric' : 'categorical',
      values: shouldStoreAllValues 
        ? (isNumeric ? numericValues : values as string[])
        : (isNumeric 
            ? numericValues.slice(0, maxStoredValues) 
            : (values as string[]).slice(0, maxStoredValues))
    });
  });

  return columns;
};

export const normalizeData = (data: DataPoint[], columns: string[]): DataPoint[] => {
  const isLargeDataset = data.length > 10000;
  
  if (isLargeDataset) {
    return normalizeDataOptimized(data, columns);
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

const normalizeDataOptimized = (data: DataPoint[], columns: string[]): DataPoint[] => {
  // Use more efficient approach for large datasets
  const normalizedData = [...data];
  
  // Pre-calculate statistics in a single pass
  const columnStats = columns.reduce((stats, column) => {
    let min = Infinity;
    let max = -Infinity;
    let count = 0;
    
    // Single pass through data for each column
    for (const row of data) {
      const value = Number(row[column]);
      if (!isNaN(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
        count++;
      }
    }
    
    stats[column] = {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      range: max === -Infinity || min === Infinity ? 0 : max - min,
      count
    };
    return stats;
  }, {} as Record<string, { min: number; max: number; range: number; count: number }>);
  
  // Apply normalization in batches using requestIdleCallback for better performance
  const batchSize = 5000;
  let currentIndex = 0;
  
  const processBatch = () => {
    const endIndex = Math.min(currentIndex + batchSize, data.length);
    
    for (let i = currentIndex; i < endIndex; i++) {
      const row = normalizedData[i];
      columns.forEach(column => {
        const value = Number(row[column]);
        const stats = columnStats[column];
        
        if (!isNaN(value) && stats.range > 0) {
          row[`${column}_normalized`] = (value - stats.min) / stats.range;
        }
      });
    }
    
    currentIndex = endIndex;
    
    // Continue processing if there's more data
    if (currentIndex < data.length) {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(processBatch);
      } else {
        setTimeout(processBatch, 0);
      }
    }
  };
  
  processBatch();
  return normalizedData;
};