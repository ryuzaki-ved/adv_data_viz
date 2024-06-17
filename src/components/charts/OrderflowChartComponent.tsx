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
  showPOC: boolean; // Point of Control
  showVAH: boolean; // Value Area High
  showVAL: boolean; // Value Area Low
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
  const [showSettings, setShowSettings] = useState(false);
  const [cumulativeDelta, setCumulativeDelta] = useState(0);
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Advanced orderflow settings
  const [settings, setSettings] = useState<OrderflowSettings>({
    showImbalances: true,
    imbalanceThreshold: 2.0,
    showVolumeProfile: true,
    showPOC: true,
    showVAH: true,
    showVAL: true,
    valueAreaPercentage: 70,
    showCumulativeDelta: true,
    enableAggregation: false,
    aggregationTicks: 4,
    showLevels: true,
    levelThreshold: 1000,
    enableFiltering: false,
    minVolumeFilter: 100,
    showBidAskRatio: true,
    enableSmoothing: false,
    smoothingPeriod: 3
  });

  // Process uploaded data with advanced analytics
  const orderflowData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let processedData = data.map((row, index) => {
      const price = Number(row.price || row.Price || row.PRICE || row.close || row.Close || (100 + index * 0.25));
      const bidVolume = Number(row.bid_volume || row.bidVolume || row.bid || row.Bid || row.BID_VOLUME || Math.random() * 1000 + 500);
      const askVolume = Number(row.ask_volume || row.askVolume || row.ask || row.Ask || row.ASK_VOLUME || Math.random() * 1000 + 500);
      const delta = Number(row.delta || row.Delta || row.DELTA || (askVolume - bidVolume));
      const totalVolume = bidVolume + askVolume;

      return {
        price: isNaN(price) ? 100 + index * 0.25 : price,
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

    // Apply filtering
    if (settings.enableFiltering) {
      processedData = processedData.filter(d => d.totalVolume >= settings.minVolumeFilter);
    }

    // Apply price aggregation
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

    // Apply smoothing
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

    // Sort by price and limit for performance
    return processedData.sort((a, b) => a.price - b.price).slice(0, 100);
  }, [data, settings]);

  // Advanced analytics calculations
  const analytics = useMemo(() => {
    if (orderflowData.length === 0) return null;

    const totalVolume = orderflowData.reduce((sum, d) => sum + d.totalVolume, 0);
    const totalDelta = orderflowData.reduce((sum, d) => sum + d.delta, 0);
    
    // Volume Profile calculations
    const volumeProfile = orderflowData.map(d => ({
      price: d.price,
      volume: d.totalVolume,
      percentage: (d.totalVolume / totalVolume) * 100
    })).sort((a, b) => b.volume - a.volume);

    // Point of Control (highest volume price)
    const poc = volumeProfile[0];

    // Value Area calculations (70% of volume by default)
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

    const vah = Math.max(...valueAreaPrices); // Value Area High
    const val = Math.min(...valueAreaPrices); // Value Area Low

    // Imbalance detection
    const imbalances = orderflowData.filter(d => 
      settings.showImbalances && d.imbalance > (settings.imbalanceThreshold / 100)
    );

    // Significant levels (high volume areas)
    const significantLevels = orderflowData.filter(d => 
      settings.showLevels && d.totalVolume > settings.levelThreshold
    );

    // Cumulative delta calculation
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

  // Calculate max values for scaling
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

  // Main canvas rendering with advanced features
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !orderflowData || orderflowData.length === 0 || !analytics) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const margin = { top: 40, right: settings.showVolumeProfile ? 120 : 40, bottom: 40, left: 80 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;
    const rowHeight = chartHeight / orderflowData.length;

    ctx.font = `12px ${fontFamily}`;
    ctx.textBaseline = 'middle';

    // Render main chart
    if (orderflowType === 'delta') {
      renderAdvancedDeltaChart(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, maxDelta, theme, analytics);
    } else {
      renderAdvancedHeatmapChart(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, maxBidVolume, maxAskVolume, theme, analytics);
    }

    // Render volume profile if enabled
    if (settings.showVolumeProfile) {
      renderVolumeProfile(ctx, analytics.volumeProfile, margin, chartWidth, chartHeight, maxTotalVolume, theme);
    }

    // Render price labels with enhanced styling
    renderPriceLabels(ctx, orderflowData, margin, rowHeight, theme, analytics);

    // Render grid and reference lines
    renderGridAndReferences(ctx, orderflowData, margin, chartWidth, chartHeight, rowHeight, theme, analytics);

  }, [orderflowData, containerWidth, containerHeight, theme, orderflowType, hoveredPrice, maxBidVolume, maxAskVolume, maxDelta, maxTotalVolume, analytics, settings]);

  // Advanced Delta Chart Renderer
  const renderAdvancedDeltaChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, maxDelta: number, theme: string, analytics: any) => {
    const centerX = margin.left + chartWidth / 2;
    
    // Draw center line
    ctx.strokeStyle = theme === 'dark' ? '#6B7280' : '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, margin.top + chartHeight);
    ctx.stroke();

    // Draw delta bars with enhanced styling
    data.forEach((d, i) => {
      const y = margin.top + i * rowHeight;
      const barHeight = rowHeight * 0.8;
      const barY = y + (rowHeight - barHeight) / 2;
      
      const deltaRatio = Math.abs(d.delta) / maxDelta;
      const barWidth = (chartWidth / 2 - 20) * deltaRatio;
      
      // Enhanced color with intensity based on volume
      const intensity = Math.min(1, d.totalVolume / maxTotalVolume);
      
      if (d.delta > 0) {
        // Positive delta - gradient green
        const gradient = ctx.createLinearGradient(centerX + 2, barY, centerX + 2 + barWidth, barY);
        gradient.addColorStop(0, theme === 'dark' ? `rgba(52, 211, 153, ${0.4 + intensity * 0.6})` : `rgba(16, 185, 129, ${0.3 + intensity * 0.5})`);
        gradient.addColorStop(1, theme === 'dark' ? `rgba(34, 197, 94, ${0.8 + intensity * 0.2})` : `rgba(5, 150, 105, ${0.6 + intensity * 0.3})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX + 2, barY, barWidth, barHeight);
      } else if (d.delta < 0) {
        // Negative delta - gradient red
        const gradient = ctx.createLinearGradient(centerX - barWidth - 2, barY, centerX - 2, barY);
        gradient.addColorStop(0, theme === 'dark' ? `rgba(248, 113, 113, ${0.8 + intensity * 0.2})` : `rgba(239, 68, 68, ${0.6 + intensity * 0.3})`);
        gradient.addColorStop(1, theme === 'dark' ? `rgba(239, 68, 68, ${0.4 + intensity * 0.6})` : `rgba(220, 38, 38, ${0.3 + intensity * 0.5})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - barWidth - 2, barY, barWidth, barHeight);
      }
      
      // Highlight imbalances
      if (settings.showImbalances && d.imbalance > (settings.imbalanceThreshold / 100)) {
        ctx.strokeStyle = theme === 'dark' ? '#FBBF24' : '#F59E0B';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - barWidth - 4, barY - 2, barWidth * 2 + 8, barHeight + 4);
      }
      
      // Draw delta value with better positioning
      ctx.fillStyle = theme === 'dark' ? '#F3F4F6' : '#1F2937';
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.min(10, rowHeight * 0.4)}px ${fontFamily}`;
      const deltaText = d.delta > 0 ? `+${d.delta.toLocaleString()}` : d.delta.toLocaleString();
      const textX = d.delta > 0 ? centerX + barWidth/2 + 10 : centerX - barWidth/2 - 10;
      ctx.fillText(deltaText, textX, barY + barHeight/2);
    });

    // Draw cumulative delta line if enabled
    if (settings.showCumulativeDelta && analytics.cumulativeDeltaData) {
      ctx.strokeStyle = theme === 'dark' ? '#A78BFA' : '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      analytics.cumulativeDeltaData.forEach((point, i) => {
        const y = margin.top + i * rowHeight + rowHeight / 2;
        const maxCumDelta = Math.max(...analytics.cumulativeDeltaData.map(p => Math.abs(p.cumulativeDelta)));
        const x = centerX + (point.cumulativeDelta / maxCumDelta) * (chartWidth / 4);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();
    }

    // Enhanced labels
    ctx.fillStyle = theme === 'dark' ? '#F87171' : '#EF4444';
    ctx.textAlign = 'center';
    ctx.font = `bold 12px ${fontFamily}`;
    ctx.fillText('BID PRESSURE', margin.left + chartWidth/4, margin.top - 15);
    
    ctx.fillStyle = theme === 'dark' ? '#34D399' : '#10B981';
    ctx.fillText('ASK PRESSURE', margin.left + 3*chartWidth/4, margin.top - 15);
  };

  // Advanced Heatmap Chart Renderer
  const renderAdvancedHeatmapChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, maxBidVolume: number, maxAskVolume: number, theme: string, analytics: any) => {
    const centerX = margin.left + chartWidth / 2;
    const maxBarWidth = chartWidth / 2 - 20;

    data.forEach((d, i) => {
      const y = margin.top + i * rowHeight;
      const barHeight = rowHeight * 0.9;
      const barY = y + (rowHeight - barHeight) / 2;
      
      // Enhanced bid volume visualization
      const bidRatio = d.bidVolume / maxBidVolume;
      const bidWidth = maxBarWidth * bidRatio;
      const bidIntensity = Math.min(1, bidRatio);
      
      // Multi-layer gradient for depth
      const bidGradient = ctx.createLinearGradient(centerX - bidWidth, barY, centerX, barY);
      bidGradient.addColorStop(0, theme === 'dark' ? `rgba(248, 113, 113, ${0.2 + bidIntensity * 0.8})` : `rgba(239, 68, 68, ${0.1 + bidIntensity * 0.7})`);
      bidGradient.addColorStop(0.5, theme === 'dark' ? `rgba(248, 113, 113, ${0.5 + bidIntensity * 0.5})` : `rgba(239, 68, 68, ${0.3 + bidIntensity * 0.4})`);
      bidGradient.addColorStop(1, theme === 'dark' ? `rgba(248, 113, 113, ${0.7 + bidIntensity * 0.3})` : `rgba(239, 68, 68, ${0.5 + bidIntensity * 0.3})`);
      
      ctx.fillStyle = bidGradient;
      ctx.fillRect(centerX - bidWidth, barY, bidWidth, barHeight);
      
      // Enhanced ask volume visualization
      const askRatio = d.askVolume / maxAskVolume;
      const askWidth = maxBarWidth * askRatio;
      const askIntensity = Math.min(1, askRatio);
      
      const askGradient = ctx.createLinearGradient(centerX, barY, centerX + askWidth, barY);
      askGradient.addColorStop(0, theme === 'dark' ? `rgba(52, 211, 153, ${0.7 + askIntensity * 0.3})` : `rgba(16, 185, 129, ${0.5 + askIntensity * 0.3})`);
      askGradient.addColorStop(0.5, theme === 'dark' ? `rgba(52, 211, 153, ${0.5 + askIntensity * 0.5})` : `rgba(16, 185, 129, ${0.3 + askIntensity * 0.4})`);
      askGradient.addColorStop(1, theme === 'dark' ? `rgba(52, 211, 153, ${0.2 + askIntensity * 0.8})` : `rgba(16, 185, 129, ${0.1 + askIntensity * 0.7})`);
      
      ctx.fillStyle = askGradient;
      ctx.fillRect(centerX, barY, askWidth, barHeight);
      
      // Highlight significant levels
      if (settings.showLevels && d.totalVolume > settings.levelThreshold) {
        ctx.strokeStyle = theme === 'dark' ? '#FBBF24' : '#F59E0B';
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - bidWidth - 2, barY - 1, bidWidth + askWidth + 4, barHeight + 2);
      }
      
      // Enhanced volume text with better contrast
      ctx.save();
      ctx.shadowColor = theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
      ctx.shadowBlur = 2;
      ctx.fillStyle = theme === 'dark' ? '#F3F4F6' : '#1F2937';
      ctx.textAlign = 'right';
      ctx.font = `bold ${Math.min(9, rowHeight * 0.3)}px ${fontFamily}`;
      ctx.fillText(d.bidVolume.toLocaleString(), centerX - 5, barY + barHeight/2);
      
      ctx.textAlign = 'left';
      ctx.fillText(d.askVolume.toLocaleString(), centerX + 5, barY + barHeight/2);
      ctx.restore();

      // Show bid/ask ratio if enabled
      if (settings.showBidAskRatio && d.bidAskRatio !== 0) {
        ctx.fillStyle = theme === 'dark' ? '#A78BFA' : '#8B5CF6';
        ctx.textAlign = 'center';
        ctx.font = `${Math.min(8, rowHeight * 0.25)}px ${fontFamily}`;
        ctx.fillText(`${d.bidAskRatio.toFixed(2)}`, centerX, barY + barHeight + 12);
      }
    });

    // Center line with enhanced styling
    ctx.strokeStyle = theme === 'dark' ? '#6B7280' : '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, margin.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Enhanced labels
    ctx.fillStyle = theme === 'dark' ? '#F87171' : '#EF4444';
    ctx.textAlign = 'center';
    ctx.font = `bold 12px ${fontFamily}`;
    ctx.fillText('BID VOLUME', margin.left + chartWidth/4, margin.top - 15);
    
    ctx.fillStyle = theme === 'dark' ? '#34D399' : '#10B981';
    ctx.fillText('ASK VOLUME', margin.left + 3*chartWidth/4, margin.top - 15);
  };

  // Volume Profile Renderer
  const renderVolumeProfile = (ctx: CanvasRenderingContext2D, volumeProfile: any[], margin: any, chartWidth: number, chartHeight: number, maxTotalVolume: number, theme: string) => {
    const profileX = margin.left + chartWidth + 10;
    const profileWidth = 100;
    
    volumeProfile.forEach((level, i) => {
      const dataPoint = orderflowData.find(d => d.price === level.price);
      if (!dataPoint) return;
      
      const dataIndex = orderflowData.indexOf(dataPoint);
      const y = margin.top + dataIndex * (chartHeight / orderflowData.length);
      const barHeight = (chartHeight / orderflowData.length) * 0.8;
      
      const volumeRatio = level.volume / maxTotalVolume;
      const barWidth = profileWidth * volumeRatio;
      
      // Color based on volume intensity
      const intensity = volumeRatio;
      ctx.fillStyle = theme === 'dark' 
        ? `rgba(139, 92, 246, ${0.3 + intensity * 0.7})` 
        : `rgba(99, 102, 241, ${0.2 + intensity * 0.6})`;
      
      ctx.fillRect(profileX, y, barWidth, barHeight);
      
      // Volume percentage text
      if (level.percentage > 2) { // Only show for significant levels
        ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#374151';
        ctx.textAlign = 'left';
        ctx.font = `8px ${fontFamily}`;
        ctx.fillText(`${level.percentage.toFixed(1)}%`, profileX + barWidth + 2, y + barHeight/2);
      }
    });
    
    // Profile label
    ctx.fillStyle = theme === 'dark' ? '#A78BFA' : '#8B5CF6';
    ctx.textAlign = 'center';
    ctx.font = `bold 10px ${fontFamily}`;
    ctx.fillText('VOLUME PROFILE', profileX + profileWidth/2, margin.top - 15);
  };

  // Enhanced Price Labels Renderer
  const renderPriceLabels = (ctx: CanvasRenderingContext2D, data: any[], margin: any, rowHeight: number, theme: string, analytics: any) => {
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
        ctx.fillStyle = theme === 'dark' ? '#FBBF24' : '#F59E0B';
        ctx.font = `bold 12px ${fontFamily}`;
      } else if ((isVAH || isVAL) && (settings.showVAH || settings.showVAL)) {
        ctx.fillStyle = theme === 'dark' ? '#A78BFA' : '#8B5CF6';
        ctx.font = `bold 11px ${fontFamily}`;
      } else if (isHovered || isSelected) {
        ctx.fillStyle = theme === 'dark' ? '#60A5FA' : '#3B82F6';
        ctx.font = `bold 12px ${fontFamily}`;
      } else {
        ctx.fillStyle = theme === 'dark' ? '#E5E7EB' : '#374151';
        ctx.font = `11px ${fontFamily}`;
      }
      
      ctx.fillText(d.price.toFixed(2), margin.left - 10, y);
      
      // Add level indicators
      if (isPOC && settings.showPOC) {
        ctx.fillText('POC', margin.left - 50, y);
      } else if (isVAH && settings.showVAH) {
        ctx.fillText('VAH', margin.left - 50, y);
      } else if (isVAL && settings.showVAL) {
        ctx.fillText('VAL', margin.left - 50, y);
      }
    });
  };

  // Grid and Reference Lines Renderer
  const renderGridAndReferences = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, rowHeight: number, theme: string, analytics: any) => {
    // Horizontal grid lines
    ctx.strokeStyle = theme === 'dark' ? '#374151' : '#E5E7EB';
    ctx.lineWidth = 0.5;
    
    data.forEach((_, i) => {
      const y = margin.top + i * rowHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    });

    // Value Area highlighting
    if (settings.showVAH && settings.showVAL && analytics.vah && analytics.val) {
      const vahIndex = data.findIndex(d => Math.abs(d.price - analytics.vah) < 0.01);
      const valIndex = data.findIndex(d => Math.abs(d.price - analytics.val) < 0.01);
      
      if (vahIndex !== -1 && valIndex !== -1) {
        const startY = margin.top + Math.min(vahIndex, valIndex) * rowHeight;
        const endY = margin.top + Math.max(vahIndex, valIndex) * rowHeight + rowHeight;
        
        ctx.fillStyle = theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.05)';
        ctx.fillRect(margin.left, startY, chartWidth, endY - startY);
      }
    }
  };

  // Mouse interaction handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const margin = { top: 40, right: settings.showVolumeProfile ? 120 : 40, bottom: 40, left: 80 };
    const chartHeight = containerHeight - margin.top - margin.bottom;
    const rowHeight = chartHeight / orderflowData.length;
    
    const idx = Math.floor((y - margin.top) / rowHeight);
    if (idx >= 0 && idx < orderflowData.length) {
      setHoveredPrice(orderflowData[idx].price);
    } else {
      setHoveredPrice(null);
    }
  }, [orderflowData, containerHeight, settings.showVolumeProfile]);

  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPrice !== null) {
      setSelectedPriceLevel(selectedPriceLevel === hoveredPrice ? null : hoveredPrice);
    }
  }, [hoveredPrice, selectedPriceLevel]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredPrice(null);
  }, []);

  // Settings update handler
  const updateSetting = useCallback((key: keyof OrderflowSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Find hovered data
  const hoveredData = orderflowData.find(d => d.price === hoveredPrice);
  const selectedData = orderflowData.find(d => d.price === selectedPriceLevel);

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
      {/* Advanced Settings Panel */}
      <div className="absolute top-2 left-2 z-20">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all"
        >
          ⚙️ Advanced Settings
        </button>
        
        {showSettings && (
          <div className="absolute top-8 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Show Imbalances</label>
                <input
                  type="checkbox"
                  checked={settings.showImbalances}
                  onChange={(e) => updateSetting('showImbalances', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Imbalance Threshold (%)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={settings.imbalanceThreshold}
                  onChange={(e) => updateSetting('imbalanceThreshold', Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs">{settings.imbalanceThreshold}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Volume Profile</label>
                <input
                  type="checkbox"
                  checked={settings.showVolumeProfile}
                  onChange={(e) => updateSetting('showVolumeProfile', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Show POC</label>
                <input
                  type="checkbox"
                  checked={settings.showPOC}
                  onChange={(e) => updateSetting('showPOC', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Show Value Area</label>
                <input
                  type="checkbox"
                  checked={settings.showVAH && settings.showVAL}
                  onChange={(e) => {
                    updateSetting('showVAH', e.target.checked);
                    updateSetting('showVAL', e.target.checked);
                  }}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Cumulative Delta</label>
                <input
                  type="checkbox"
                  checked={settings.showCumulativeDelta}
                  onChange={(e) => updateSetting('showCumulativeDelta', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Price Aggregation</label>
                <input
                  type="checkbox"
                  checked={settings.enableAggregation}
                  onChange={(e) => updateSetting('enableAggregation', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Smoothing</label>
                <input
                  type="checkbox"
                  checked={settings.enableSmoothing}
                  onChange={(e) => updateSetting('enableSmoothing', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Volume Filter</label>
                <input
                  type="checkbox"
                  checked={settings.enableFiltering}
                  onChange={(e) => updateSetting('enableFiltering', e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chart Type Indicator */}
      <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {orderflowType === 'delta' ? 'Advanced Delta Orderflow' : 'Advanced Volume Heatmap'} • {orderflowData.length} levels
          {analytics && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              • Total Δ: {analytics.totalDelta > 0 ? '+' : ''}{analytics.totalDelta.toLocaleString()}
            </span>
          )}
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
        onClick={handleMouseClick}
      />
      
      {/* Enhanced Tooltip */}
      {hoveredData && (
        <div
          className="absolute z-30 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium pointer-events-none"
          style={{
            left: containerWidth / 2 + 20,
            top: 60,
            background: theme === 'dark' ? 'rgba(17,24,39,0.98)' : 'rgba(255,255,255,0.98)',
            color: theme === 'dark' ? '#fff' : '#1E293B',
            borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            minWidth: 220,
            boxShadow: '0 8px 32px 0 rgba(31, 41, 55, 0.18)'
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Price:</span>
              <span className="font-bold text-lg">${hoveredData.price.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">Total Volume:</span>
              <span className="font-bold">{hoveredData.totalVolume.toLocaleString()}</span>
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
            
            <div className="flex justify-between items-center">
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Imbalance:</span>
              <span className="font-bold">{(hoveredData.imbalance * 100).toFixed(1)}%</span>
            </div>
            
            {settings.showBidAskRatio && (
              <div className="flex justify-between items-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Bid/Ask Ratio:</span>
                <span className="font-bold">{hoveredData.bidAskRatio.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Enhanced Legend */}
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
        {analytics && analytics.poc && settings.showPOC && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">POC: ${analytics.poc.price.toFixed(2)}</span>
          </div>
        )}
        {settings.showCumulativeDelta && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-400 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Cumulative Δ</span>
          </div>
        )}
      </div>
    </div>
  );
};