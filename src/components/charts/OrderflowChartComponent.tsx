import React, { useRef, useEffect, useState } from 'react';
import { DataPoint } from '../../types';

interface OrderflowChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string | string[];
  normalized?: boolean;
  width?: number | string;
  height?: number;
  theme?: 'light' | 'dark' | 'accent';
  orderflowType?: 'delta' | 'heatmap'; // New prop to control chart type
}

const fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';

export const OrderflowChartComponent: React.FC<OrderflowChartComponentProps> = ({
  data,
  xAxis,
  yAxis,
  normalized,
  width = 800,
  height = 400,
  theme = 'light',
  orderflowType = 'delta'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(typeof width === 'number' ? width : 800);
  const [containerHeight, setContainerHeight] = useState<number>(typeof height === 'number' ? height : 400);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process uploaded data for orderflow visualization
  const orderflowData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const processedData = data.map((row, index) => {
      const price = Number(row.price || row.Price || row.PRICE || row.close || row.Close || (100 + index * 0.25));
      const bidVolume = Number(row.bid_volume || row.bidVolume || row.bid || row.Bid || row.BID_VOLUME || Math.random() * 1000 + 500);
      const askVolume = Number(row.ask_volume || row.askVolume || row.ask || row.Ask || row.ASK_VOLUME || Math.random() * 1000 + 500);
      const delta = Number(row.delta || row.Delta || row.DELTA || (askVolume - bidVolume));

      return {
        price: isNaN(price) ? 100 + index * 0.25 : price,
        bidVolume: isNaN(bidVolume) ? Math.floor(Math.random() * 1000) + 500 : Math.floor(bidVolume),
        askVolume: isNaN(askVolume) ? Math.floor(Math.random() * 1000) + 500 : Math.floor(askVolume),
        delta: isNaN(delta) ? (askVolume - bidVolume) : delta,
        timestamp: row.timestamp || row.time || row.Time || new Date().toISOString()
      };
    });

    // Sort by price for proper horizontal display
    return processedData.sort((a, b) => a.price - b.price).slice(0, 50); // Limit for performance
  }, [data]);

  // Calculate max values for scaling
  const maxBidVolume = Math.max(...orderflowData.map(d => d.bidVolume), 1);
  const maxAskVolume = Math.max(...orderflowData.map(d => d.askVolume), 1);
  const maxDelta = Math.max(...orderflowData.map(d => Math.abs(d.delta)), 1);

  // Responsive resize
  useEffect(() => {
    if (typeof width === 'string' && width.endsWith('%')) {
      const handleResize = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [width]);

  // Main canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !orderflowData || orderflowData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const margin = { top: 40, right: 40, bottom: 40, left: 80 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;
    const rowHeight = chartHeight / orderflowData.length;

    ctx.font = `12px ${fontFamily}`;
    ctx.textBaseline = 'middle';

    if (orderflowType === 'delta') {
      // TYPE 1: Price and Delta only
      renderDeltaChart(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, maxDelta, theme);
    } else {
      // TYPE 2: Price with Bid/Ask Heatmap
      renderHeatmapChart(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, maxBidVolume, maxAskVolume, theme);
    }

    // Draw price labels (Y-axis)
    ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#374151';
    ctx.textAlign = 'right';
    ctx.font = `bold 11px ${fontFamily}`;
    
    orderflowData.forEach((d, i) => {
      const y = margin.top + i * rowHeight + rowHeight / 2;
      const isHovered = hoveredPrice === d.price;
      
      if (isHovered) {
        ctx.fillStyle = theme === 'dark' ? '#FBBF24' : '#F59E0B';
        ctx.font = `bold 12px ${fontFamily}`;
      } else {
        ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#374151';
        ctx.font = `bold 11px ${fontFamily}`;
      }
      
      ctx.fillText(d.price.toFixed(2), margin.left - 10, y);
    });

    // Draw horizontal grid lines
    ctx.strokeStyle = theme === 'dark' ? '#374151' : '#E5E7EB';
    ctx.lineWidth = 0.5;
    orderflowData.forEach((_, i) => {
      const y = margin.top + i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    });

  }, [orderflowData, containerWidth, containerHeight, theme, orderflowType, hoveredPrice, maxBidVolume, maxAskVolume, maxDelta]);

  // Render Delta Chart (Type 1)
  const renderDeltaChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, maxDelta: number, theme: string) => {
    const centerX = margin.left + chartWidth / 2;
    
    // Draw center line
    ctx.strokeStyle = theme === 'dark' ? '#6B7280' : '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, margin.top + chartHeight);
    ctx.stroke();

    // Draw delta bars
    data.forEach((d, i) => {
      const y = margin.top + i * rowHeight;
      const barHeight = rowHeight * 0.8;
      const barY = y + (rowHeight - barHeight) / 2;
      
      const deltaRatio = Math.abs(d.delta) / maxDelta;
      const barWidth = (chartWidth / 2 - 20) * deltaRatio;
      
      // Color based on delta direction
      if (d.delta > 0) {
        // Positive delta (more ask volume) - green, extends right
        ctx.fillStyle = theme === 'dark' ? '#34D399' : '#10B981';
        ctx.fillRect(centerX + 2, barY, barWidth, barHeight);
      } else if (d.delta < 0) {
        // Negative delta (more bid volume) - red, extends left
        ctx.fillStyle = theme === 'dark' ? '#F87171' : '#EF4444';
        ctx.fillRect(centerX - barWidth - 2, barY, barWidth, barHeight);
      }
      
      // Draw delta value
      ctx.fillStyle = theme === 'dark' ? '#F3F4F6' : '#1F2937';
      ctx.textAlign = 'center';
      ctx.font = `bold 10px ${fontFamily}`;
      const deltaText = d.delta > 0 ? `+${d.delta.toLocaleString()}` : d.delta.toLocaleString();
      ctx.fillText(deltaText, centerX + (d.delta > 0 ? barWidth/2 + 10 : -barWidth/2 - 10), barY + barHeight/2);
    });

    // Draw labels
    ctx.fillStyle = theme === 'dark' ? '#F87171' : '#EF4444';
    ctx.textAlign = 'center';
    ctx.font = `bold 12px ${fontFamily}`;
    ctx.fillText('BID PRESSURE', margin.left + chartWidth/4, margin.top - 15);
    
    ctx.fillStyle = theme === 'dark' ? '#34D399' : '#10B981';
    ctx.fillText('ASK PRESSURE', margin.left + 3*chartWidth/4, margin.top - 15);
  };

  // Render Heatmap Chart (Type 2)
  const renderHeatmapChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, maxBidVolume: number, maxAskVolume: number, theme: string) => {
    const centerX = margin.left + chartWidth / 2;
    const maxBarWidth = chartWidth / 2 - 20;

    data.forEach((d, i) => {
      const y = margin.top + i * rowHeight;
      const barHeight = rowHeight * 0.9;
      const barY = y + (rowHeight - barHeight) / 2;
      
      // Bid volume bar (left side)
      const bidRatio = d.bidVolume / maxBidVolume;
      const bidWidth = maxBarWidth * bidRatio;
      const bidIntensity = Math.min(1, bidRatio);
      
      // Create gradient for bid
      const bidGradient = ctx.createLinearGradient(centerX - bidWidth, barY, centerX, barY);
      bidGradient.addColorStop(0, theme === 'dark' ? `rgba(248, 113, 113, ${0.3 + bidIntensity * 0.7})` : `rgba(239, 68, 68, ${0.2 + bidIntensity * 0.6})`);
      bidGradient.addColorStop(1, theme === 'dark' ? `rgba(248, 113, 113, ${0.6 + bidIntensity * 0.4})` : `rgba(239, 68, 68, ${0.4 + bidIntensity * 0.4})`);
      
      ctx.fillStyle = bidGradient;
      ctx.fillRect(centerX - bidWidth, barY, bidWidth, barHeight);
      
      // Ask volume bar (right side)
      const askRatio = d.askVolume / maxAskVolume;
      const askWidth = maxBarWidth * askRatio;
      const askIntensity = Math.min(1, askRatio);
      
      // Create gradient for ask
      const askGradient = ctx.createLinearGradient(centerX, barY, centerX + askWidth, barY);
      askGradient.addColorStop(0, theme === 'dark' ? `rgba(52, 211, 153, ${0.6 + askIntensity * 0.4})` : `rgba(16, 185, 129, ${0.4 + askIntensity * 0.4})`);
      askGradient.addColorStop(1, theme === 'dark' ? `rgba(52, 211, 153, ${0.3 + askIntensity * 0.7})` : `rgba(16, 185, 129, ${0.2 + askIntensity * 0.6})`);
      
      ctx.fillStyle = askGradient;
      ctx.fillRect(centerX, barY, askWidth, barHeight);
      
      // Draw volume text
      ctx.fillStyle = theme === 'dark' ? '#F3F4F6' : '#1F2937';
      ctx.textAlign = 'right';
      ctx.font = `bold 9px ${fontFamily}`;
      ctx.fillText(d.bidVolume.toLocaleString(), centerX - 5, barY + barHeight/2);
      
      ctx.textAlign = 'left';
      ctx.fillText(d.askVolume.toLocaleString(), centerX + 5, barY + barHeight/2);
    });

    // Draw center line
    ctx.strokeStyle = theme === 'dark' ? '#6B7280' : '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, margin.top + chartHeight);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = theme === 'dark' ? '#F87171' : '#EF4444';
    ctx.textAlign = 'center';
    ctx.font = `bold 12px ${fontFamily}`;
    ctx.fillText('BID VOLUME', margin.left + chartWidth/4, margin.top - 15);
    
    ctx.fillStyle = theme === 'dark' ? '#34D399' : '#10B981';
    ctx.fillText('ASK VOLUME', margin.left + 3*chartWidth/4, margin.top - 15);
  };

  // Mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const margin = { top: 40, right: 40, bottom: 40, left: 80 };
    const chartHeight = containerHeight - margin.top - margin.bottom;
    const rowHeight = chartHeight / orderflowData.length;
    
    const idx = Math.floor((y - margin.top) / rowHeight);
    if (idx >= 0 && idx < orderflowData.length) {
      setHoveredPrice(orderflowData[idx].price);
    } else {
      setHoveredPrice(null);
    }
  };
  
  const handleMouseLeave = () => setHoveredPrice(null);

  // Find hovered data
  const hoveredData = orderflowData.find(d => d.price === hoveredPrice);

  if (!orderflowData || orderflowData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-2">No orderflow data available</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Please upload a CSV file with columns: price, bid_volume, ask_volume
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ width, height }}>
      {/* Chart Type Indicator */}
      <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {orderflowType === 'delta' ? 'Delta Orderflow' : 'Volume Heatmap'} • {orderflowData.length} levels
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block', 
          cursor: 'crosshair', 
          borderRadius: '12px'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Tooltip */}
      {hoveredData && (
        <div
          className="absolute z-30 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium pointer-events-none"
          style={{
            left: containerWidth / 2 + 20,
            top: 60,
            background: theme === 'dark' ? 'rgba(17,24,39,0.98)' : 'rgba(255,255,255,0.98)',
            color: theme === 'dark' ? '#fff' : '#1E293B',
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            minWidth: 180,
            boxShadow: '0 8px 32px 0 rgba(31, 41, 55, 0.18)'
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Price:</span>
              <span className="font-bold text-lg">${hoveredData.price.toFixed(2)}</span>
            </div>
            
            {orderflowType === 'delta' ? (
              <div className="flex justify-between items-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Delta:</span>
                <span className={`font-bold ${
                  hoveredData.delta >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {(hoveredData.delta >= 0 ? '+' : '') + hoveredData.delta.toLocaleString()}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 dark:text-red-400 font-semibold">Bid Volume:</span>
                  <span className="font-bold">{hoveredData.bidVolume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600 dark:text-green-400 font-semibold">Ask Volume:</span>
                  <span className="font-bold">{hoveredData.askVolume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Delta:</span>
                  <span className={`font-bold ${
                    hoveredData.delta >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(hoveredData.delta >= 0 ? '+' : '') + hoveredData.delta.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-400 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">
            {orderflowType === 'delta' ? 'Bid Pressure' : 'Bid Volume'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">
            {orderflowType === 'delta' ? 'Ask Pressure' : 'Ask Volume'}
          </span>
        </div>
      </div>
    </div>
  );
};