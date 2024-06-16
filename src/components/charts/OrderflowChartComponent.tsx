import React, { useRef, useEffect, useState } from 'react';
import { OrderflowDataPoint } from '../../types';

interface OrderflowChartComponentProps {
  data: OrderflowDataPoint[];
  width?: number | string;
  height?: number;
  theme?: 'light' | 'dark' | 'accent';
}

// Utility for color based on delta/imbalance
function getCellColor(bid: number, ask: number, theme: string) {
  const delta = ask - bid;
  if (delta > 0) {
    // More aggressive buying
    return theme === 'dark' ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.15)'; // green
  } else if (delta < 0) {
    // More aggressive selling
    return theme === 'dark' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)'; // red
  } else {
    return theme === 'dark' ? 'rgba(156,163,175,0.15)' : 'rgba(156,163,175,0.08)'; // neutral
  }
}

const fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';

export const OrderflowChartComponent: React.FC<OrderflowChartComponentProps> = ({
  data,
  width = 600,
  height = 400,
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(typeof width === 'number' ? width : 600);
  const [containerHeight, setContainerHeight] = useState<number>(typeof height === 'number' ? height : 400);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!canvas || !data || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Layout
    const rowHeight = Math.max(18, Math.floor(containerHeight / Math.max(data.length, 1)));
    const colWidth = Math.floor(containerWidth / 3);
    const priceColX = colWidth;
    const bidColX = 0;
    const askColX = colWidth * 2;
    
    ctx.font = `bold 12px ${fontFamily}`;
    ctx.textBaseline = 'middle';

    // Draw grid lines
    ctx.strokeStyle = theme === 'dark' ? '#374151' : '#E5E7EB';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= data.length; i++) {
      const y = i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(containerWidth, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i <= 3; i++) {
      const x = i * colWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, containerHeight);
      ctx.stroke();
    }

    // Draw cells and data
    data.forEach((d, i) => {
      const y = i * rowHeight;
      
      // Bid cell background
      ctx.fillStyle = getCellColor(d.bidVolume, d.askVolume, theme);
      ctx.fillRect(bidColX, y, colWidth, rowHeight);
      
      // Ask cell background
      ctx.fillStyle = getCellColor(d.askVolume, d.bidVolume, theme);
      ctx.fillRect(askColX, y, colWidth, rowHeight);
      
      // Highlight hovered row
      if (hoveredIdx === i) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = theme === 'dark' ? '#3B82F6' : '#2563EB';
        ctx.fillRect(0, y, containerWidth, rowHeight);
        ctx.restore();
      }
      
      // Bid text
      ctx.fillStyle = theme === 'dark' ? '#F87171' : '#DC2626';
      ctx.textAlign = 'right';
      ctx.fillText(d.bidVolume.toLocaleString(), bidColX + colWidth - 8, y + rowHeight / 2);
      
      // Price text
      ctx.fillStyle = theme === 'dark' ? '#FBBF24' : '#1E293B';
      ctx.textAlign = 'center';
      ctx.fillText(d.price.toFixed(2), priceColX + colWidth / 2, y + rowHeight / 2);
      
      // Ask text
      ctx.fillStyle = theme === 'dark' ? '#34D399' : '#059669';
      ctx.textAlign = 'left';
      ctx.fillText(d.askVolume.toLocaleString(), askColX + 8, y + rowHeight / 2);
    });
  }, [data, containerWidth, containerHeight, theme, hoveredIdx]);

  // Mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rowHeight = Math.max(18, Math.floor(containerHeight / Math.max(data.length, 1)));
    const idx = Math.floor(y / rowHeight);
    setHoveredIdx(idx >= 0 && idx < data.length ? idx : null);
  };
  
  const handleMouseLeave = () => setHoveredIdx(null);

  // Tooltip content
  const hovered = hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx] : null;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-2">No orderflow data available</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">Mock data will be generated automatically</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ width, height }}>
      {/* Column headers */}
      <div className="absolute top-0 left-0 w-full flex text-xs font-bold select-none z-10" style={{ height: 24 }}>
        <div className="flex-1 text-right pr-2 bg-red-50 dark:bg-red-900/20 border-r border-gray-200 dark:border-gray-700" style={{ color: theme === 'dark' ? '#F87171' : '#DC2626' }}>
          Bid Volume
        </div>
        <div className="flex-1 text-center bg-yellow-50 dark:bg-yellow-900/20 border-r border-gray-200 dark:border-gray-700" style={{ color: theme === 'dark' ? '#FBBF24' : '#1E293B' }}>
          Price Level
        </div>
        <div className="flex-1 text-left pl-2 bg-green-50 dark:bg-green-900/20" style={{ color: theme === 'dark' ? '#34D399' : '#059669' }}>
          Ask Volume
        </div>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: 'calc(100% - 24px)', 
          display: 'block', 
          cursor: 'pointer', 
          borderRadius: '0 0 12px 12px',
          marginTop: '24px'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-30 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium pointer-events-none"
          style={{
            left: 32,
            top: (hoveredIdx ?? 0) * Math.max(18, Math.floor((containerHeight - 24) / Math.max(data.length, 1))) + 48,
            background: theme === 'dark' ? 'rgba(17,24,39,0.98)' : 'rgba(255,255,255,0.98)',
            color: theme === 'dark' ? '#fff' : '#1E293B',
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            minWidth: 160,
            boxShadow: '0 8px 32px 0 rgba(31, 41, 55, 0.18)'
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Price:</span>
              <span className="font-bold">${hovered.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-600 dark:text-red-400 font-semibold">Bid Volume:</span>
              <span className="font-bold">{hovered.bidVolume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600 dark:text-green-400 font-semibold">Ask Volume:</span>
              <span className="font-bold">{hovered.askVolume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Delta:</span>
              <span className={`font-bold ${
                (hovered.askVolume - hovered.bidVolume) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {((hovered.askVolume - hovered.bidVolume) >= 0 ? '+' : '') + (hovered.askVolume - hovered.bidVolume).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-200 dark:bg-red-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Sell Pressure</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Buy Pressure</span>
        </div>
      </div>
    </div>
  );
};