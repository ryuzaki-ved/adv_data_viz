import Papa from 'papaparse';
import { DataPoint, ColumnInfo } from '../types';

export const parseCSV = (file: File): Promise<{ data: DataPoint[]; columns: ColumnInfo[] }> => {
  return new Promise((resolve, reject) => {
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
  });
};

const analyzeColumns = (data: DataPoint[]): ColumnInfo[] => {
  if (data.length === 0) return [];

  const columns: ColumnInfo[] = [];
  const firstRow = data[0];

  Object.keys(firstRow).forEach(columnName => {
    const values = data.map(row => row[columnName]).filter(val => val !== null && val !== undefined && val !== '');
    const numericValues = values.map(val => {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }).filter(val => val !== null) as number[];

    const isNumeric = numericValues.length > values.length * 0.8; // 80% threshold for numeric classification

    columns.push({
      name: columnName,
      type: isNumeric ? 'numeric' : 'categorical',
      values: isNumeric ? numericValues : values as string[]
    });
  });

  return columns;
};

export const normalizeData = (data: DataPoint[], columns: string[]): DataPoint[] => {
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