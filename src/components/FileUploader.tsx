import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoading }) => {
  const { theme } = useTheme();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    if (csvFile) {
      onFileUpload(csvFile);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700';
      case 'accent':
        return 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 text-purple-900 hover:from-purple-100 hover:to-blue-100';
      default:
        return 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${getThemeClasses()} ${
          isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('csv-upload')?.click()}
      >
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          ) : (
            <div className="relative">
              <Upload className="h-12 w-12 text-blue-500 mx-auto" />
              <FileText className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
            </div>
          )}
          
          <div>
            <p className="text-lg font-semibold mb-2">
              {isLoading ? 'Processing CSV...' : 'Upload your CSV file'}
            </p>
            <p className="text-sm opacity-70">
              Drag and drop or click to select a CSV file
            </p>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Performance Tips:</p>
            <ul className="text-blue-700 dark:text-blue-400 space-y-1 text-xs">
              <li>• Files larger than 5MB will be processed using optimized streaming</li>
              <li>• Very large datasets (&gt;10,000 rows) will use sampling for faster analysis</li>
              <li>• Consider filtering your data before upload for better performance</li>
              <li>• Supported formats: CSV files with headers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};