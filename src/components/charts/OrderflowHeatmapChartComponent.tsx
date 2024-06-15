import React, { useRef, useEffect, useState } from 'react';
import type { OrderbookSnapshot, TradePrint } from '../../types';

interface OrderflowHeatmapChartComponentProps {
  orderbook: OrderbookSnapshot[];
  trades: TradePrint[];
  width?: number | string;
  height?: number;
  theme?: 'light' | 'dark' | 'accent';
}

// Color scale for liquidity heatmap
function getHeatmapColor(size: number, maxSize: number, theme: string) {
  // Bookmap: yellow/white = high, black/blue = low
  const ratio = Math.min(1, size / (maxSize || 1));
  if (theme === 'dark') {
    // Black (low) to yellow (high)
    const r = Math.floor(255 * ratio);
    const g = Math.floor(255 * ratio);
    const b = Math.floor(40 * ratio);
    return `rgba(${r},${g},${b},${0.85 * ratio + 0.1})`;
  } else {
    // White (low) to orange (high)
    const r = Math.floor(255 * ratio + 255 * (1 - ratio));
    const g = Math.floor(200 * ratio + 255 * (1 - ratio));
    const b = Math.floor(40 * ratio + 255 * (1 - ratio));
    return `rgba(${r},${g},${b},${0.85 * ratio + 0.1})`;
  }
}

// Color for trade bubbles
function getTradeColor(side: 'buy' | 'sell', theme: string) {
  if (side === 'buy') return theme === 'dark' ? '#34D399' : '#059669';
  return theme === 'dark' ? '#F87171' : '#DC2626';
}

export const OrderflowHeatmapChartComponent: React.FC<OrderflowHeatmapChartComponentProps> = ({
  orderbook,
  trades,
  width = 800,
  height = 500,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<{ price: number; time: number; size: number; type: 'liquidity' | 'trade'; side?: string } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(typeof width === 'number' ? width : 800);
  const [containerHeight, setContainerHeight] = useState<number>(typeof height === 'number' ? height : 500);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find price range and time range
  const allPrices = Array.from(new Set(orderbook.flatMap(snap => snap.levels.map(l => l.price)))).sort((a, b) => a - b);
  const minPrice = allPrices[0];
  const maxPrice = allPrices[allPrices.length - 1];
  const priceStep = allPrices.length > 1 ? allPrices[1] - allPrices[0] : 1;
  const priceCount = allPrices.length;
  const minTime = orderbook[0]?.time || 0;
  const maxTime = orderbook[orderbook.length - 1]?.time || 1;
  const timeCount = orderbook.length;
  const maxSize = Math.max(...orderbook.flatMap(snap => snap.levels.map(l => l.size)), 1);

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
    const cellH = containerHeight / priceCount;
    const cellW = containerWidth / timeCount;

    // Draw heatmap (liquidity)
    orderbook.forEach((snap, tIdx) => {
      snap.levels.forEach(level => {
        const pIdx = allPrices.indexOf(level.price);
        if (pIdx === -1) return;
        ctx.fillStyle = getHeatmapColor(level.size, maxSize, theme);
        ctx.fillRect(tIdx * cellW, containerHeight - (pIdx + 1) * cellH, cellW, cellH);
      });
    });

    // Draw trade bubbles
    trades.forEach(trade => {
      // Find closest time index
      const tIdx = Math.round(((trade.time - minTime) / (maxTime - minTime)) * (timeCount - 1));
      const pIdx = allPrices.indexOf(trade.price);
      if (pIdx === -1) return;
      const x = tIdx * cellW + cellW / 2;
      const y = containerHeight - (pIdx + 1) * cellH + cellH / 2;
      const r = Math.max(3, Math.sqrt(trade.size) * 0.9);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = getTradeColor(trade.side, theme);
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Axes (price)
    ctx.save();
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = theme === 'dark' ? '#fff' : '#222';
    ctx.textAlign = 'right';
    for (let i = 0; i < priceCount; i += Math.ceil(priceCount / 20)) {
      const y = containerHeight - (i + 1) * cellH + cellH / 2;
      ctx.fillText(allPrices[i].toFixed(2), 40, y + 4);
    }
    ctx.restore();
    // Axes (time)
    ctx.save();
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = theme === 'dark' ? '#fff' : '#222';
    ctx.textAlign = 'center';
    for (let i = 0; i < timeCount; i += Math.ceil(timeCount / 10)) {
      const x = i * cellW + cellW / 2;
      const t = new Date(minTime + ((maxTime - minTime) * i) / (timeCount - 1));
      ctx.fillText(t.toLocaleTimeString(), x, containerHeight - 4);
    }
    ctx.restore();
  }, [orderbook, trades, containerWidth, containerHeight, theme]);

  // Mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellH = containerHeight / priceCount;
    const cellW = containerWidth / timeCount;
    const tIdx = Math.floor(x / cellW);
    const pIdx = priceCount - 1 - Math.floor(y / cellH);
    const price = allPrices[pIdx];
    const time = orderbook[tIdx]?.time;
    // Check for trade bubble
    const trade = trades.find(tr => {
      const ttIdx = Math.round(((tr.time - minTime) / (maxTime - minTime)) * (timeCount - 1));
      const ppIdx = allPrices.indexOf(tr.price);
      if (Math.abs(ttIdx - tIdx) <= 0.5 && Math.abs(ppIdx - pIdx) <= 0.5) {
        const cx = ttIdx * cellW + cellW / 2;
        const cy = containerHeight - (ppIdx + 1) * cellH + cellH / 2;
        const r = Math.max(3, Math.sqrt(tr.size) * 0.9);
        return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
      }
      return false;
    });
    if (trade) {
      setHovered({ price: trade.price, time: trade.time, size: trade.size, type: 'trade', side: trade.side });
      return;
    }
    // Otherwise, show liquidity
    const snap = orderbook[tIdx];
    const level = snap?.levels.find(l => l.price === price);
    if (level) {
      setHovered({ price, time, size: level.size, type: 'liquidity', side: level.side });
    } else {
      setHovered(null);
    }
  };
  const handleMouseLeave = () => setHovered(null);

  // Tooltip content
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
      {hovered && (
        <div
          className="absolute z-30 px-4 py-2 rounded-xl shadow-2xl border text-xs font-medium pointer-events-none"
          style={{
            left: 60,
            top: 40,
            background: theme === 'dark' ? 'rgba(17,24,39,0.98)' : 'rgba(255,255,255,0.98)',
            color: theme === 'dark' ? '#fff' : '#1E293B',
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            minWidth: 120,
            boxShadow: '0 8px 32px 0 rgba(31, 41, 55, 0.18)'
          }}
        >
          {hovered.type === 'trade' ? (
            <>
              <div>Trade: <b>{hovered.side}</b></div>
              <div>Price: <b>{hovered.price.toFixed(2)}</b></div>
              <div>Size: <b>{hovered.size}</b></div>
              <div>Time: <b>{new Date(hovered.time).toLocaleTimeString()}</b></div>
            </>
          ) : (
            <>
              <div>Liquidity: <b>{hovered.side}</b></div>
              <div>Price: <b>{hovered.price.toFixed(2)}</b></div>
              <div>Size: <b>{hovered.size}</b></div>
              <div>Time: <b>{new Date(hovered.time).toLocaleTimeString()}</b></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 