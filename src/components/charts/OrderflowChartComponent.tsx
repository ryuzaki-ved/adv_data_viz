import React, { useRef, useEffect, useState } from 'react';
import type { OrderflowDataPoint } from '../../types';

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
  width = 400,
  height = 600,
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(typeof width === 'number' ? width : 400);
  const [containerHeight, setContainerHeight] = useState<number>(typeof height === 'number' ? height : 600);
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Layout
    const rowHeight = Math.max(18, Math.floor(containerHeight / Math.max(data.length, 1)));
    const colWidth = Math.floor(containerWidth / 3);
    const priceColX = colWidth;
    const bidColX = 0;
    const askColX = colWidth * 2;
    ctx.font = `bold 13px ${fontFamily}`;
    ctx.textBaseline = 'middle';

    // Draw grid lines
    ctx.strokeStyle = theme === 'dark' ? '#374151' : '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= data.length; i++) {
      const y = i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(containerWidth, y);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const x = i * colWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, containerHeight);
      ctx.stroke();
    }

    // Draw cells
    data.forEach((d, i) => {
      const y = i * rowHeight;
      // Bid cell
      ctx.fillStyle = getCellColor(d.bidVolume, d.askVolume, theme);
      ctx.fillRect(bidColX, y, colWidth, rowHeight);
      // Ask cell
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
  const hovered = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={containerWidth}
        height={containerHeight}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer', borderRadius: 12 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {/* Column headers */}
      <div className="absolute top-0 left-0 w-full flex text-xs font-bold select-none" style={{ height: 24, pointerEvents: 'none' }}>
        <div className="flex-1 text-right pr-2" style={{ color: theme === 'dark' ? '#F87171' : '#DC2626' }}>Bid</div>
        <div className="flex-1 text-center" style={{ color: theme === 'dark' ? '#FBBF24' : '#1E293B' }}>Price</div>
        <div className="flex-1 text-left pl-2" style={{ color: theme === 'dark' ? '#34D399' : '#059669' }}>Ask</div>
      </div>
      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-30 px-4 py-2 rounded-xl shadow-2xl border text-xs font-medium pointer-events-none"
          style={{
            left: 32,
            top: (hoveredIdx ?? 0) * Math.max(18, Math.floor(containerHeight / Math.max(data.length, 1))) + 28,
            background: theme === 'dark' ? 'rgba(17,24,39,0.98)' : 'rgba(255,255,255,0.98)',
            color: theme === 'dark' ? '#fff' : '#1E293B',
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            minWidth: 120,
            boxShadow: '0 8px 32px 0 rgba(31, 41, 55, 0.18)'
          }}
        >
          <div>Price: <b>{hovered.price.toFixed(2)}</b></div>
          <div>Bid Volume: <b>{hovered.bidVolume.toLocaleString()}</b></div>
          <div>Ask Volume: <b>{hovered.askVolume.toLocaleString()}</b></div>
          <div>Delta: <b>{((hovered.askVolume - hovered.bidVolume) >= 0 ? '+' : '') + (hovered.askVolume - hovered.bidVolume)}</b></div>
        </div>
      )}
    </div>
  );
}; 