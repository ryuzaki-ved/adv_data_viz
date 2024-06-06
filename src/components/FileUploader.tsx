import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
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

  return (
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
  );
};