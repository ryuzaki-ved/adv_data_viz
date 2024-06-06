export interface DataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  xAxis: string;
  yAxis: string | string[];
  chartType: ChartType;
  normalized: boolean;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'footprint';

export type Theme = 'light' | 'dark' | 'accent';

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical';
  values: (string | number)[];
}