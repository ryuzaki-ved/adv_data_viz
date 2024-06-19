import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Zap, BarChart3, TrendingUp, Database, Sparkles, ArrowRight, FileSpreadsheet, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoading }) => {
  const { theme } = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    if (csvFile) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      onFileUpload(csvFile);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          background: 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900',
          card: 'bg-gray-800/50 border-gray-700/50',
          uploadArea: 'bg-gradient-to-br from-gray-800/80 to-gray-700/80 border-gray-600/50',
          uploadAreaHover: 'bg-gradient-to-br from-gray-700/90 to-gray-600/90 border-blue-500/50',
          uploadAreaDrag: 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-400',
          text: 'text-white',
          subtext: 'text-gray-300',
          accent: 'text-blue-400',
          feature: 'bg-gray-800/60 border-gray-700/50',
          button: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        };
      case 'accent':
        return {
          background: 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100',
          card: 'bg-white/70 border-purple-200/50',
          uploadArea: 'bg-gradient-to-br from-purple-50/80 to-blue-50/80 border-purple-300/50',
          uploadAreaHover: 'bg-gradient-to-br from-purple-100/90 to-blue-100/90 border-purple-400/50',
          uploadAreaDrag: 'bg-gradient-to-br from-purple-200/50 to-blue-200/50 border-purple-500',
          text: 'text-purple-900',
          subtext: 'text-purple-700',
          accent: 'text-purple-600',
          feature: 'bg-white/60 border-purple-200/50',
          button: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
        };
      default:
        return {
          background: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
          card: 'bg-white/80 border-gray-200/50',
          uploadArea: 'bg-gradient-to-br from-gray-50/80 to-blue-50/80 border-gray-300/50',
          uploadAreaHover: 'bg-gradient-to-br from-gray-100/90 to-blue-100/90 border-blue-400/50',
          uploadAreaDrag: 'bg-gradient-to-br from-blue-100/50 to-purple-100/50 border-blue-500',
          text: 'text-gray-900',
          subtext: 'text-gray-600',
          accent: 'text-blue-600',
          feature: 'bg-white/60 border-gray-200/50',
          button: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Multiple Chart Types",
      description: "Bar, Line, Pie, Scatter, Heatmap & Orderflow charts"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Advanced Analytics",
      description: "Statistical analysis, normalization & data filtering"
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Professional Orderflow",
      description: "Delta analysis, volume heatmaps & market depth"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Interactive Features",
      description: "Zoom, pan, brush selection & real-time updates"
    }
  ];

  const supportedFormats = [
    { name: "CSV Files", extension: ".csv", icon: <FileSpreadsheet className="h-5 w-5" /> },
    { name: "Headers Required", extension: "✓", icon: <CheckCircle className="h-5 w-5" /> },
    { name: "Large Files", extension: "50MB+", icon: <Database className="h-5 w-5" /> }
  ];

  return (
    <div className={`min-h-screen ${themeClasses.background} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-3xl">
                <TrendingUp className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className={`text-5xl md:text-6xl font-bold ${themeClasses.text} mb-6 leading-tight`}>
            Transform Your Data Into
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Beautiful Insights
            </span>
          </h1>
          
          <p className={`text-xl md:text-2xl ${themeClasses.subtext} mb-8 max-w-3xl mx-auto leading-relaxed`}>
            Upload your CSV file and create stunning, interactive visualizations with advanced analytics, 
            multi-chart combinations, and professional orderflow analysis.
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center space-x-8 mb-12">
            <div className="text-center">
              <div className={`text-3xl font-bold ${themeClasses.accent}`}>7+</div>
              <div className={`text-sm ${themeClasses.subtext}`}>Chart Types</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${themeClasses.accent}`}>50MB+</div>
              <div className={`text-sm ${themeClasses.subtext}`}>File Support</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${themeClasses.accent}`}>∞</div>
              <div className={`text-sm ${themeClasses.subtext}`}>Data Points</div>
            </div>
          </div>
        </div>

        {/* Main Upload Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Upload Area */}
          <div className="space-y-8">
            <div
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 backdrop-blur-sm ${
                isLoading 
                  ? 'opacity-50 pointer-events-none' 
                  : isDragOver
                  ? `${themeClasses.uploadAreaDrag} scale-105 shadow-2xl`
                  : `${themeClasses.uploadArea} hover:${themeClasses.uploadAreaHover} hover:scale-102 shadow-xl`
              } ${!isLoading ? 'cursor-pointer' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isLoading && document.getElementById('csv-upload')?.click()}
            >
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                disabled={isLoading}
              />
              
              <div className="flex flex-col items-center space-y-6">
                {isLoading ? (
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                      <Upload className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                
                <div>
                  <p className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                    {isLoading ? 'Processing Your Data...' : isDragOver ? 'Drop Your CSV File' : 'Upload Your CSV File'}
                  </p>
                  <p className={`text-lg ${themeClasses.subtext} mb-4`}>
                    {isLoading ? 'Analyzing columns and preparing visualizations' : 'Drag and drop or click to select'}
                  </p>
                  
                  {!isLoading && (
                    <button className={`inline-flex items-center space-x-2 px-6 py-3 ${themeClasses.button} text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}>
                      <span>Choose File</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {isLoading && uploadProgress > 0 && (
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={themeClasses.subtext}>Processing...</span>
                      <span className={themeClasses.accent}>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supported Formats */}
            <div className={`${themeClasses.feature} backdrop-blur-sm rounded-2xl p-6 border`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Supported Formats
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {supportedFormats.map((format, index) => (
                  <div key={index} className="text-center">
                    <div className={`${themeClasses.accent} mb-2 flex justify-center`}>
                      {format.icon}
                    </div>
                    <div className={`text-sm font-medium ${themeClasses.text}`}>{format.name}</div>
                    <div className={`text-xs ${themeClasses.subtext}`}>{format.extension}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-8">
            <div>
              <h2 className={`text-3xl font-bold ${themeClasses.text} mb-6`}>
                Powerful Features
              </h2>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className={`${themeClasses.feature} backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`${themeClasses.accent} p-3 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                          {feature.title}
                        </h3>
                        <p className={`${themeClasses.subtext}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="mt-16">
          <div className={`${themeClasses.feature} backdrop-blur-sm rounded-2xl p-8 border`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 p-3 rounded-xl">
                  <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold ${themeClasses.text} mb-4`}>
                  Performance & Optimization Tips
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className={`text-sm ${themeClasses.subtext}`}>
                        Files up to 50MB are processed using optimized streaming
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${themeClasses.subtext}`}>
                        Large datasets (10,000+ rows) use intelligent sampling
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className={`text-sm ${themeClasses.subtext}`}>
                        Headers are automatically detected and analyzed
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className={`text-sm ${themeClasses.subtext}`}>
                        Real-time data normalization and filtering available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Data Suggestion */}
        <div className="mt-12 text-center">
          <div className={`inline-flex items-center space-x-2 ${themeClasses.feature} backdrop-blur-sm rounded-full px-6 py-3 border`}>
            <Database className="h-4 w-4 text-blue-500" />
            <span className={`text-sm ${themeClasses.subtext}`}>
              Don't have data? Try our sample orderflow dataset included in the project
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};