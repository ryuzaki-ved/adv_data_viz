import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { DataPoint } from '../../types';

interface OrderflowChartComponentProps {
  data: DataPoint[];
  xAxis: string;
  yAxis: string | string[];
  normalized?: boolean;
  width?: number | string;
  height?: number;
  theme?: 'light' | 'dark' | 'accent';
  orderflowType?: 'delta' | 'heatmap';
}

interface OrderflowSettings {
  showImbalances: boolean;
  imbalanceThreshold: number;
  showVolumeProfile: boolean;
  showPOC: boolean;
  showVAH: boolean;
  showVAL: boolean;
  valueAreaPercentage: number;
  showCumulativeDelta: boolean;
  enableAggregation: boolean;
  aggregationTicks: number;
  showLevels: boolean;
  levelThreshold: number;
  enableFiltering: boolean;
  minVolumeFilter: number;
  showBidAskRatio: boolean;
  enableSmoothing: boolean;
  smoothingPeriod: number;
  precision: number;
  showGrid: boolean;
  compactMode: boolean;
}

const fontFamily = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced settings with precision focus
  const [settings, setSettings] = useState<OrderflowSettings>({
    showImbalances: true,
    imbalanceThreshold: 2.0,
    showVolumeProfile: true,
    showPOC: true,
    showVAH: true,
    showVAL: true,
    valueAreaPercentage: 70,
    showCumulativeDelta: false,
    enableAggregation: false,
    aggregationTicks: 4,
    showLevels: true,
    levelThreshold: 1000,
    enableFiltering: false,
    minVolumeFilter: 100,
    showBidAskRatio: false,
    enableSmoothing: false,
    smoothingPeriod: 3,
    precision: 2,
    showGrid: true,
    compactMode: false
  });

  // Process data with enhanced precision
  const orderflowData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let processedData = data.map((row, index) => {
      const price = Number(row.price || row.Price || row.PRICE || row.close || row.Close || (100 + index * 0.25));
      const bidVolume = Number(row.bid_volume || row.bidVolume || row.bid || row.Bid || row.BID_VOLUME || Math.random() * 1000 + 500);
      const askVolume = Number(row.ask_volume || row.askVolume || row.ask || row.Ask || row.ASK_VOLUME || Math.random() * 1000 + 500);
      const delta = Number(row.delta || row.Delta || row.DELTA || (askVolume - bidVolume));
      const totalVolume = bidVolume + askVolume;

      return {
        price: isNaN(price) ? 100 + index * 0.25 : Number(price.toFixed(settings.precision)),
        bidVolume: isNaN(bidVolume) ? Math.floor(Math.random() * 1000) + 500 : Math.floor(bidVolume),
        askVolume: isNaN(askVolume) ? Math.floor(Math.random() * 1000) + 500 : Math.floor(askVolume),
        delta: isNaN(delta) ? (askVolume - bidVolume) : delta,
        totalVolume,
        bidAskRatio: askVolume > 0 ? bidVolume / askVolume : 0,
        imbalance: totalVolume > 0 ? Math.abs(bidVolume - askVolume) / totalVolume : 0,
        timestamp: row.timestamp || row.time || row.Time || new Date().toISOString(),
        originalIndex: index
      };
    });

    // Apply filters and processing
    if (settings.enableFiltering) {
      processedData = processedData.filter(d => d.totalVolume >= settings.minVolumeFilter);
    }

    if (settings.enableAggregation && settings.aggregationTicks > 1) {
      const aggregated = new Map<number, any>();
      processedData.forEach(d => {
        const aggregatedPrice = Math.round(d.price / settings.aggregationTicks) * settings.aggregationTicks;
        if (aggregated.has(aggregatedPrice)) {
          const existing = aggregated.get(aggregatedPrice);
          existing.bidVolume += d.bidVolume;
          existing.askVolume += d.askVolume;
          existing.totalVolume += d.totalVolume;
          existing.delta += d.delta;
        } else {
          aggregated.set(aggregatedPrice, { ...d, price: aggregatedPrice });
        }
      });
      processedData = Array.from(aggregated.values());
    }

    if (settings.enableSmoothing && settings.smoothingPeriod > 1) {
      const smoothed = processedData.map((d, i) => {
        const start = Math.max(0, i - Math.floor(settings.smoothingPeriod / 2));
        const end = Math.min(processedData.length, i + Math.ceil(settings.smoothingPeriod / 2));
        const subset = processedData.slice(start, end);
        
        const avgBid = subset.reduce((sum, item) => sum + item.bidVolume, 0) / subset.length;
        const avgAsk = subset.reduce((sum, item) => sum + item.askVolume, 0) / subset.length;
        
        return {
          ...d,
          bidVolume: Math.round(avgBid),
          askVolume: Math.round(avgAsk),
          delta: Math.round(avgAsk - avgBid),
          totalVolume: Math.round(avgBid + avgAsk)
        };
      });
      processedData = smoothed;
    }

    return processedData.sort((a, b) => a.price - b.price).slice(0, 80);
  }, [data, settings]);

  // Enhanced analytics with precision
  const analytics = useMemo(() => {
    if (orderflowData.length === 0) return null;

    const totalVolume = orderflowData.reduce((sum, d) => sum + d.totalVolume, 0);
    const totalDelta = orderflowData.reduce((sum, d) => sum + d.delta, 0);
    
    const volumeProfile = orderflowData.map(d => ({
      price: d.price,
      volume: d.totalVolume,
      percentage: (d.totalVolume / totalVolume) * 100
    })).sort((a, b) => b.volume - a.volume);

    const poc = volumeProfile[0];
    const targetVolume = totalVolume * (settings.valueAreaPercentage / 100);
    let accumulatedVolume = 0;
    let valueAreaPrices = [];
    
    for (const level of volumeProfile) {
      if (accumulatedVolume < targetVolume) {
        valueAreaPrices.push(level.price);
        accumulatedVolume += level.volume;
      } else {
        break;
      }
    }

    const vah = Math.max(...valueAreaPrices);
    const val = Math.min(...valueAreaPrices);

    const imbalances = orderflowData.filter(d => 
      settings.showImbalances && d.imbalance > (settings.imbalanceThreshold / 100)
    );

    const significantLevels = orderflowData.filter(d => 
      settings.showLevels && d.totalVolume > settings.levelThreshold
    );

    let runningDelta = 0;
    const cumulativeDeltaData = orderflowData.map(d => {
      runningDelta += d.delta;
      return { price: d.price, cumulativeDelta: runningDelta };
    });

    return {
      totalVolume,
      totalDelta,
      poc,
      vah,
      val,
      imbalances,
      significantLevels,
      cumulativeDeltaData,
      volumeProfile
    };
  }, [orderflowData, settings]);

  const maxBidVolume = Math.max(...orderflowData.map(d => d.bidVolume), 1);
  const maxAskVolume = Math.max(...orderflowData.map(d => d.askVolume), 1);
  const maxDelta = Math.max(...orderflowData.map(d => Math.abs(d.delta)), 1);
  const maxTotalVolume = Math.max(...orderflowData.map(d => d.totalVolume), 1);

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

  // Enhanced rendering with precision and cool aesthetics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !orderflowData || orderflowData.length === 0 || !analytics) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const margin = { 
      top: settings.compactMode ? 20 : 30, 
      right: settings.showVolumeProfile ? 100 : 30, 
      bottom: settings.compactMode ? 20 : 30, 
      left: 70 
    };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;
    const rowHeight = chartHeight / orderflowData.length;

    // Enhanced rendering
    if (orderflowType === 'delta') {
      renderPrecisionDeltaChart(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, maxDelta, theme, analytics);
    } else {
      renderPrecisionHeatmapChart(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, maxBidVolume, maxAskVolume, theme, analytics);
    }

    if (settings.showVolumeProfile) {
      renderMinimalVolumeProfile(ctx, analytics.volumeProfile, margin, chartWidth, chartHeight, maxTotalVolume, theme);
    }

    renderPrecisionPriceLabels(ctx, orderflowData, margin, rowHeight, theme, analytics);
    
    if (settings.showGrid) {
      renderMinimalGrid(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, theme);
    }

  }, [orderflowData, containerWidth, containerHeight, theme, orderflowType, hoveredPrice, maxBidVolume, maxAskVolume, maxDelta, maxTotalVolume, analytics, settings]);

  // Precision Delta Chart with cool aesthetics
  const renderPrecisionDeltaChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, maxDelta: number, theme: string, analytics: any) => {
    const centerX = margin.left + chartWidth / 2;
    
    // Ultra-thin center line
    ctx.strokeStyle = theme === 'dark' ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, margin.top + chartHeight);
    ctx.stroke();

    // Precision delta bars with modern aesthetics
    data.forEach((d, i) => {
      const y = margin.top + i * rowHeight;
      const barHeight = Math.max(2, rowHeight * 0.7);
      const barY = y + (rowHeight - barHeight) / 2;
      
      const deltaRatio = Math.abs(d.delta) / maxDelta;
      const maxBarWidth = (chartWidth / 2) * 0.85;
      const barWidth = maxBarWidth * deltaRatio;
      
      const intensity = Math.min(1, d.totalVolume / maxTotalVolume);
      const isHovered = hoveredPrice === d.price;
      const isSelected = selectedPriceLevel === d.price;
      
      if (d.delta > 0) {
        // Ask pressure - modern green gradient
        const gradient = ctx.createLinearGradient(centerX + 1, barY, centerX + 1 + barWidth, barY);
        if (theme === 'dark') {
          gradient.addColorStop(0, `rgba(52, 211, 153, ${0.2 + intensity * 0.6})`);
          gradient.addColorStop(1, `rgba(16, 185, 129, ${0.8 + intensity * 0.2})`);
        } else {
          gradient.addColorStop(0, `rgba(16, 185, 129, ${0.15 + intensity * 0.4})`);
          gradient.addColorStop(1, `rgba(5, 150, 105, ${0.6 + intensity * 0.3})`);
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX + 1, barY, barWidth, barHeight);
        
        // Glow effect for hovered/selected
        if (isHovered || isSelected) {
          ctx.shadowColor = theme === 'dark' ? 'rgba(52, 211, 153, 0.5)' : 'rgba(16, 185, 129, 0.4)';
          ctx.shadowBlur = 8;
          ctx.fillRect(centerX + 1, barY, barWidth, barHeight);
          ctx.shadowBlur = 0;
        }
        
      } else if (d.delta < 0) {
        // Bid pressure - modern red gradient
        const gradient = ctx.createLinearGradient(centerX - barWidth - 1, barY, centerX - 1, barY);
        if (theme === 'dark') {
          gradient.addColorStop(0, `rgba(248, 113, 113, ${0.8 + intensity * 0.2})`);
          gradient.addColorStop(1, `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`);
        } else {
          gradient.addColorStop(0, `rgba(239, 68, 68, ${0.6 + intensity * 0.3})`);
          gradient.addColorStop(1, `rgba(220, 38, 38, ${0.15 + intensity * 0.4})`);
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - barWidth - 1, barY, barWidth, barHeight);
        
        // Glow effect for hovered/selected
        if (isHovered || isSelected) {
          ctx.shadowColor = theme === 'dark' ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)';
          ctx.shadowBlur = 8;
          ctx.fillRect(centerX - barWidth - 1, barY, barWidth, barHeight);
          ctx.shadowBlur = 0;
        }
      }
      
      // Minimal imbalance indicators
      if (settings.showImbalances && d.imbalance > (settings.imbalanceThreshold / 100)) {
        ctx.strokeStyle = theme === 'dark' ? 'rgba(251, 191, 36, 0.6)' : 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(centerX - barWidth - 3, barY - 1, barWidth * 2 + 6, barHeight + 2);
        ctx.setLineDash([]);
      }
      
      // Precision delta values with better typography
      if (barWidth > 20) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(243, 244, 246, 0.9)' : 'rgba(31, 41, 55, 0.8)';
        ctx.textAlign = 'center';
        ctx.font = `500 ${Math.min(9, rowHeight * 0.35)}px ${fontFamily}`;
        const deltaText = Math.abs(d.delta) > 999 ? 
          `${(d.delta / 1000).toFixed(1)}k` : 
          d.delta.toLocaleString();
        const textX = d.delta > 0 ? centerX + barWidth/2 + 5 : centerX - barWidth/2 - 5;
        ctx.fillText(deltaText, textX, barY + barHeight/2);
      }
    });

    // Minimal cumulative delta line
    if (settings.showCumulativeDelta && analytics.cumulativeDeltaData) {
      ctx.strokeStyle = theme === 'dark' ? 'rgba(167, 139, 250, 0.6)' : 'rgba(139, 92, 246, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      analytics.cumulativeDeltaData.forEach((point, i) => {
        const y = margin.top + i * rowHeight + rowHeight / 2;
        const maxCumDelta = Math.max(...analytics.cumulativeDeltaData.map(p => Math.abs(p.cumulativeDelta)));
        const x = centerX + (point.cumulativeDelta / maxCumDelta) * (chartWidth / 6);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();
    }

    // Clean labels
    ctx.fillStyle = theme === 'dark' ? 'rgba(248, 113, 113, 0.8)' : 'rgba(239, 68, 68, 0.7)';
    ctx.textAlign = 'center';
    ctx.font = `600 10px ${fontFamily}`;
    ctx.fillText('BID', margin.left + chartWidth/4, margin.top - 10);
    
    ctx.fillStyle = theme === 'dark' ? 'rgba(52, 211, 153, 0.8)' : 'rgba(16, 185, 129, 0.7)';
    ctx.fillText('ASK', margin.left + 3*chartWidth/4, margin.top - 10);
  };

  // Precision Heatmap Chart
  const renderPrecisionHeatmapChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, maxBidVolume: number, maxAskVolume: number, theme: string, analytics: any) => {
    const centerX = margin.left + chartWidth / 2;
    const maxBarWidth = (chartWidth / 2) * 0.9;

    data.forEach((d, i) => {
      const y = margin.top + i * rowHeight;
      const barHeight = Math.max(2, rowHeight * 0.8);
      const barY = y + (rowHeight - barHeight) / 2;
      
      const isHovered = hoveredPrice === d.price;
      const isSelected = selectedPriceLevel === d.price;
      
      // Bid volume with precision
      const bidRatio = d.bidVolume / maxBidVolume;
      const bidWidth = maxBarWidth * bidRatio;
      const bidIntensity = Math.min(1, bidRatio);
      
      const bidGradient = ctx.createLinearGradient(centerX - bidWidth, barY, centerX - 1, barY);
      if (theme === 'dark') {
        bidGradient.addColorStop(0, `rgba(248, 113, 113, ${0.3 + bidIntensity * 0.7})`);
        bidGradient.addColorStop(1, `rgba(248, 113, 113, ${0.6 + bidIntensity * 0.4})`);
      } else {
        bidGradient.addColorStop(0, `rgba(239, 68, 68, ${0.2 + bidIntensity * 0.5})`);
        bidGradient.addColorStop(1, `rgba(239, 68, 68, ${0.4 + bidIntensity * 0.4})`);
      }
      
      ctx.fillStyle = bidGradient;
      ctx.fillRect(centerX - bidWidth, barY, bidWidth - 1, barHeight);
      
      // Ask volume with precision
      const askRatio = d.askVolume / maxAskVolume;
      const askWidth = maxBarWidth * askRatio;
      const askIntensity = Math.min(1, askRatio);
      
      const askGradient = ctx.createLinearGradient(centerX + 1, barY, centerX + askWidth, barY);
      if (theme === 'dark') {
        askGradient.addColorStop(0, `rgba(52, 211, 153, ${0.6 + askIntensity * 0.4})`);
        askGradient.addColorStop(1, `rgba(52, 211, 153, ${0.3 + askIntensity * 0.7})`);
      } else {
        askGradient.addColorStop(0, `rgba(16, 185, 129, ${0.4 + askIntensity * 0.4})`);
        askGradient.addColorStop(1, `rgba(16, 185, 129, ${0.2 + askIntensity * 0.5})`);
      }
      
      ctx.fillStyle = askGradient;
      ctx.fillRect(centerX + 1, barY, askWidth - 1, barHeight);
      
      // Glow effects for interaction
      if (isHovered || isSelected) {
        ctx.shadowColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = theme === 'dark' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - bidWidth - 1, barY - 1, bidWidth + askWidth + 2, barHeight + 2);
        ctx.shadowBlur = 0;
      }
      
      // Significant level indicators
      if (settings.showLevels && d.totalVolume > settings.levelThreshold) {
        ctx.strokeStyle = theme === 'dark' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(centerX - bidWidth - 2, barY - 1, bidWidth + askWidth + 4, barHeight + 2);
        ctx.setLineDash([]);
      }
      
      // Precision volume text
      if (bidWidth > 25 || askWidth > 25) {
        ctx.save();
        ctx.fillStyle = theme === 'dark' ? 'rgba(243, 244, 246, 0.9)' : 'rgba(31, 41, 55, 0.8)';
        ctx.font = `500 ${Math.min(8, rowHeight * 0.3)}px ${fontFamily}`;
        
        if (bidWidth > 25) {
          ctx.textAlign = 'right';
          const bidText = d.bidVolume > 999 ? `${(d.bidVolume / 1000).toFixed(1)}k` : d.bidVolume.toLocaleString();
          ctx.fillText(bidText, centerX - 3, barY + barHeight/2);
        }
        
        if (askWidth > 25) {
          ctx.textAlign = 'left';
          const askText = d.askVolume > 999 ? `${(d.askVolume / 1000).toFixed(1)}k` : d.askVolume.toLocaleString();
          ctx.fillText(askText, centerX + 3, barY + barHeight/2);
        }
        
        ctx.restore();
      }
    });

    // Ultra-minimal center line
    ctx.strokeStyle = theme === 'dark' ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, margin.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Clean labels
    ctx.fillStyle = theme === 'dark' ? 'rgba(248, 113, 113, 0.8)' : 'rgba(239, 68, 68, 0.7)';
    ctx.textAlign = 'center';
    ctx.font = `600 10px ${fontFamily}`;
    ctx.fillText('BID', margin.left + chartWidth/4, margin.top - 10);
    
    ctx.fillStyle = theme === 'dark' ? 'rgba(52, 211, 153, 0.8)' : 'rgba(16, 185, 129, 0.7)';
    ctx.fillText('ASK', margin.left + 3*chartWidth/4, margin.top - 10);
  };

  // Minimal Volume Profile
  const renderMinimalVolumeProfile = (ctx: CanvasRenderingContext2D, volumeProfile: any[], margin: any, chartWidth: number, chartHeight: number, maxTotalVolume: number, theme: string) => {
    const profileX = margin.left + chartWidth + 8;
    const profileWidth = 80;
    
    volumeProfile.forEach((level, i) => {
      const dataPoint = orderflowData.find(d => d.price === level.price);
      if (!dataPoint) return;
      
      const dataIndex = orderflowData.indexOf(dataPoint);
      const y = margin.top + dataIndex * (chartHeight / orderflowData.length);
      const barHeight = Math.max(1, (chartHeight / orderflowData.length) * 0.7);
      
      const volumeRatio = level.volume / maxTotalVolume;
      const barWidth = profileWidth * volumeRatio;
      
      const intensity = volumeRatio;
      ctx.fillStyle = theme === 'dark' 
        ? `rgba(139, 92, 246, ${0.2 + intensity * 0.6})` 
        : `rgba(99, 102, 241, ${0.15 + intensity * 0.5})`;
      
      ctx.fillRect(profileX, y, barWidth, barHeight);
      
      // Minimal percentage indicators
      if (level.percentage > 5) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(229, 231, 235, 0.7)' : 'rgba(55, 65, 81, 0.6)';
        ctx.textAlign = 'left';
        ctx.font = `400 7px ${fontFamily}`;
        ctx.fillText(`${level.percentage.toFixed(0)}%`, profileX + barWidth + 2, y + barHeight/2);
      }
    });
    
    // Profile label
    ctx.fillStyle = theme === 'dark' ? 'rgba(167, 139, 250, 0.8)' : 'rgba(139, 92, 246, 0.7)';
    ctx.textAlign = 'center';
    ctx.font = `600 8px ${fontFamily}`;
    ctx.fillText('VOLUME', profileX + profileWidth/2, margin.top - 10);
  };

  // Precision Price Labels
  const renderPrecisionPriceLabels = (ctx: CanvasRenderingContext2D, data: any[], margin: any, rowHeight: number, theme: string, analytics: any) => {
    ctx.textAlign = 'right';
    
    data.forEach((d, i) => {
      const y = margin.top + i * rowHeight + rowHeight / 2;
      const isHovered = hoveredPrice === d.price;
      const isPOC = analytics.poc && Math.abs(d.price - analytics.poc.price) < 0.01;
      const isVAH = analytics.vah && Math.abs(d.price - analytics.vah) < 0.01;
      const isVAL = analytics.val && Math.abs(d.price - analytics.val) < 0.01;
      const isSelected = selectedPriceLevel === d.price;
      
      // Enhanced styling for special levels
      if (isPOC && settings.showPOC) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(251, 191, 36, 0.9)' : 'rgba(245, 158, 11, 0.8)';
        ctx.font = `700 11px ${fontFamily}`;
      } else if ((isVAH || isVAL) && (settings.showVAH || settings.showVAL)) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(167, 139, 250, 0.8)' : 'rgba(139, 92, 246, 0.7)';
        ctx.font = `600 10px ${fontFamily}`;
      } else if (isHovered || isSelected) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(96, 165, 250, 0.9)' : 'rgba(59, 130, 246, 0.8)';
        ctx.font = `600 11px ${fontFamily}`;
      } else {
        ctx.fillStyle = theme === 'dark' ? 'rgba(229, 231, 235, 0.7)' : 'rgba(55, 65, 81, 0.6)';
        ctx.font = `500 10px ${fontFamily}`;
      }
      
      ctx.fillText(d.price.toFixed(settings.precision), margin.left - 8, y);
      
      // Minimal level indicators
      if (isPOC && settings.showPOC) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(251, 191, 36, 0.6)' : 'rgba(245, 158, 11, 0.5)';
        ctx.font = `600 7px ${fontFamily}`;
        ctx.fillText('POC', margin.left - 45, y);
      } else if (isVAH && settings.showVAH) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(167, 139, 250, 0.6)' : 'rgba(139, 92, 246, 0.5)';
        ctx.font = `600 7px ${fontFamily}`;
        ctx.fillText('VAH', margin.left - 45, y);
      } else if (isVAL && settings.showVAL) {
        ctx.fillStyle = theme === 'dark' ? 'rgba(167, 139, 250, 0.6)' : 'rgba(139, 92, 246, 0.5)';
        ctx.font = `600 7px ${fontFamily}`;
        ctx.fillText('VAL', margin.left - 45, y);
      }
    });
  };

  // Minimal Grid
  const renderMinimalGrid = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, theme: string) => {
    ctx.strokeStyle = theme === 'dark' ? 'rgba(55, 65, 81, 0.15)' : 'rgba(229, 231, 235, 0.3)';
    ctx.lineWidth = 0.5;
    
    // Every 5th line only
    data.forEach((_, i) => {
      if (i % 5 === 0) {
        const y = margin.top + i * rowHeight;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartWidth, y);
        ctx.stroke();
      }
    });
  };

  // Enhanced mouse interactions
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const margin = { top: settings.compactMode ? 20 : 30, right: settings.showVolumeProfile ? 100 : 30, bottom: settings.compactMode ? 20 : 30, left: 70 };
    const chartHeight = containerHeight - margin.top - margin.bottom;
    const rowHeight = chartHeight / orderflowData.length;
    
    const idx = Math.floor((y - margin.top) / rowHeight);
    if (idx >= 0 && idx < orderflowData.length) {
      setHoveredPrice(orderflowData[idx].price);
    } else {
      setHoveredPrice(null);
    }
  }, [orderflowData, containerHeight, settings]);

  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPrice !== null) {
      setSelectedPriceLevel(selectedPriceLevel === hoveredPrice ? null : hoveredPrice);
    }
  }, [hoveredPrice, selectedPriceLevel]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredPrice(null);
  }, []);

  const updateSetting = useCallback((key: keyof OrderflowSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const hoveredData = orderflowData.find(d => d.price === hoveredPrice);

  if (!orderflowData || orderflowData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-gray-600 dark:text-gray-400 mb-2 font-medium">No orderflow data available</div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Upload CSV with: price, bid_volume, ask_volume, delta
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ width, height }}>
      {/* Minimal Settings Panel */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl px-3 py-1.5 text-xs border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm"
        >
          ⚙️ Settings
        </button>
        
        {showSettings && (
          <div className="absolute top-10 left-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 w-72 max-h-80 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Precision</label>
                <select
                  value={settings.precision}
                  onChange={(e) => updateSetting('precision', Number(e.target.value))}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value={0}>0 decimals</option>
                  <option value={1}>1 decimal</option>
                  <option value={2}>2 decimals</option>
                  <option value={3}>3 decimals</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Compact Mode</label>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => updateSetting('compactMode', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Grid Lines</label>
                <input
                  type="checkbox"
                  checked={settings.showGrid}
                  onChange={(e) => updateSetting('showGrid', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Volume Profile</label>
                <input
                  type="checkbox"
                  checked={settings.showVolumeProfile}
                  onChange={(e) => updateSetting('showVolumeProfile', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">POC & Value Area</label>
                <input
                  type="checkbox"
                  checked={settings.showPOC && settings.showVAH && settings.showVAL}
                  onChange={(e) => {
                    updateSetting('showPOC', e.target.checked);
                    updateSetting('showVAH', e.target.checked);
                    updateSetting('showVAL', e.target.checked);
                  }}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Imbalances</label>
                <input
                  type="checkbox"
                  checked={settings.showImbalances}
                  onChange={(e) => updateSetting('showImbalances', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Cumulative Δ</label>
                <input
                  type="checkbox"
                  checked={settings.showCumulativeDelta}
                  onChange={(e) => updateSetting('showCumulativeDelta', e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Status Indicator */}
      <div className="absolute top-3 right-3 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl px-3 py-1.5 text-xs border border-gray-200/50 dark:border-gray-700/50">
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          {orderflowType === 'delta' ? 'Δ' : 'VOL'} • {orderflowData.length}
          {analytics && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              • {analytics.totalDelta > 0 ? '+' : ''}{Math.abs(analytics.totalDelta) > 999 ? `${(analytics.totalDelta / 1000).toFixed(1)}k` : analytics.totalDelta.toLocaleString()}
            </span>
          )}
        </span>
      </div>

      {/* High-precision Canvas */}
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block', 
          cursor: 'crosshair'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleMouseClick}
      />
      
      {/* Precision Tooltip */}
      {hoveredData && (
        <div
          className="absolute z-30 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium pointer-events-none backdrop-blur-xl"
          style={{
            left: containerWidth / 2 + 20,
            top: 60,
            background: theme === 'dark' ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#fff' : '#1E293B',
            borderColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
            minWidth: 200,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-yellow-500 font-semibold">Price</span>
              <span className="font-bold text-lg">${hoveredData.price.toFixed(settings.precision)}</span>
            </div>
            
            {orderflowType === 'delta' ? (
              <div className="flex justify-between items-center">
                <span className="text-blue-500 font-semibold">Delta</span>
                <span className={`font-bold ${
                  hoveredData.delta >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {(hoveredData.delta >= 0 ? '+' : '') + (Math.abs(hoveredData.delta) > 999 ? `${(hoveredData.delta / 1000).toFixed(1)}k` : hoveredData.delta.toLocaleString())}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-red-500 font-semibold">Bid</span>
                  <span className="font-bold">{hoveredData.bidVolume > 999 ? `${(hoveredData.bidVolume / 1000).toFixed(1)}k` : hoveredData.bidVolume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-500 font-semibold">Ask</span>
                  <span className="font-bold">{hoveredData.askVolume > 999 ? `${(hoveredData.askVolume / 1000).toFixed(1)}k` : hoveredData.askVolume.toLocaleString()}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-semibold">Volume</span>
              <span className="font-bold">{hoveredData.totalVolume > 999 ? `${(hoveredData.totalVolume / 1000).toFixed(1)}k` : hoveredData.totalVolume.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-purple-500 font-semibold">Imbalance</span>
              <span className="font-bold">{(hoveredData.imbalance * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Minimal Legend */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            {orderflowType === 'delta' ? 'Bid Pressure' : 'Bid Volume'}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            {orderflowType === 'delta' ? 'Ask Pressure' : 'Ask Volume'}
          </span>
        </div>
        {analytics && analytics.poc && settings.showPOC && (
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400 font-medium">POC: ${analytics.poc.price.toFixed(settings.precision)}</span>
          </div>
        )}
      </div>
    </div>
  );
};