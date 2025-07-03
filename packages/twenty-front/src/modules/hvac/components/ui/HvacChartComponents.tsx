/**
 * HvacChartComponents - Lightweight Chart Components
 * "Pasja rodzi profesjonalizm" - Bundle Size Optimized Charts
 * 
 * This module provides lightweight chart components to replace PrimeReact Chart
 * Uses SVG and CSS animations instead of heavy chart libraries
 */

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';

// HVAC Error Handling
import { HVACErrorBoundary } from '../HVACErrorBoundary';
import { trackHVACUserAction } from '../../index';

// Styled Components
const StyledChartContainer = styled.div<{ theme: any; height?: string }>`
  width: 100%;
  height: ${({ height }) => height || '300px'};
  background: ${({ theme }) => theme.background.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(4)};
  position: relative;
  overflow: hidden;
`;

const StyledChartTitle = styled.div<{ theme: any }>`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  color: ${({ theme }) => theme.font.color.primary};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  text-align: center;
`;

const StyledLegend = styled.div<{ theme: any }>`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(4)};
  margin-top: ${({ theme }) => theme.spacing(3)};
  flex-wrap: wrap;
`;

const StyledLegendItem = styled.div<{ theme: any; color: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.secondary};
  
  &::before {
    content: '';
    width: 12px;
    height: 12px;
    background: ${({ color }) => color};
    border-radius: 2px;
  }
`;

// Interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface HvacBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: string;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
}

export interface HvacLineChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: string;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
  smooth?: boolean;
}

export interface HvacPieChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: string;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
  donut?: boolean;
}

// Default colors for charts
const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

// HvacBarChart Component
export const HvacBarChart: React.FC<HvacBarChartProps> = ({
  data,
  title,
  height = '300px',
  showLegend = true,
  animated = true,
  className = ''
}) => {
  const theme = useTheme();

  const processedData = useMemo(() => {
    const maxValue = Math.max(...data.map(d => d.value));
    return data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      percentage: (item.value / maxValue) * 100
    }));
  }, [data]);

  React.useEffect(() => {
    trackHVACUserAction('bar_chart_rendered', 'UI_INTERACTION', {
      dataPoints: data.length,
      hasTitle: !!title
    });
  }, [data.length, title]);

  return (
    <HVACErrorBoundary context="BAR_CHART">
      <StyledChartContainer theme={theme} height={height} className={className}>
        {title && <StyledChartTitle theme={theme}>{title}</StyledChartTitle>}
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'end', 
          justifyContent: 'space-around',
          height: 'calc(100% - 80px)',
          gap: theme.spacing(2)
        }}>
          {processedData.map((item, index) => (
            <div key={item.label} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              flex: 1,
              maxWidth: '80px'
            }}>
              <motion.div
                initial={animated ? { height: 0 } : { height: `${item.percentage}%` }}
                animate={{ height: `${item.percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                style={{
                  width: '100%',
                  background: item.color,
                  borderRadius: `${theme.border.radius.sm} ${theme.border.radius.sm} 0 0`,
                  minHeight: '4px',
                  position: 'relative'
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: theme.font.size.xs,
                    color: theme.font.color.tertiary,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.value}
                </motion.div>
              </motion.div>
              <div style={{
                marginTop: theme.spacing(2),
                fontSize: theme.font.size.xs,
                color: theme.font.color.secondary,
                textAlign: 'center',
                wordBreak: 'break-word'
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {showLegend && (
          <StyledLegend theme={theme}>
            {processedData.map((item) => (
              <StyledLegendItem key={item.label} theme={theme} color={item.color}>
                {item.label}: {item.value}
              </StyledLegendItem>
            ))}
          </StyledLegend>
        )}
      </StyledChartContainer>
    </HVACErrorBoundary>
  );
};

// HvacLineChart Component
export const HvacLineChart: React.FC<HvacLineChartProps> = ({
  data,
  title,
  height = '300px',
  showLegend = true,
  animated = true,
  className = '',
  smooth = true
}) => {
  const theme = useTheme();

  const { pathData, points } = useMemo(() => {
    if (data.length === 0) return { pathData: '', points: [] };

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const chartWidth = 100; // percentage
    const chartHeight = 80; // percentage
    const stepX = chartWidth / (data.length - 1 || 1);

    const processedPoints = data.map((item, index) => ({
      x: index * stepX,
      y: chartHeight - ((item.value - minValue) / range) * chartHeight,
      value: item.value,
      label: item.label,
      color: item.color || DEFAULT_COLORS[0]
    }));

    let path = '';
    if (processedPoints.length > 0) {
      path = `M ${processedPoints[0].x} ${processedPoints[0].y}`;
      
      if (smooth && processedPoints.length > 2) {
        // Create smooth curve using quadratic bezier curves
        for (let i = 1; i < processedPoints.length; i++) {
          const prev = processedPoints[i - 1];
          const curr = processedPoints[i];
          const controlX = (prev.x + curr.x) / 2;
          path += ` Q ${controlX} ${prev.y} ${curr.x} ${curr.y}`;
        }
      } else {
        // Simple line
        for (let i = 1; i < processedPoints.length; i++) {
          path += ` L ${processedPoints[i].x} ${processedPoints[i].y}`;
        }
      }
    }

    return { pathData: path, points: processedPoints };
  }, [data, smooth]);

  React.useEffect(() => {
    trackHVACUserAction('line_chart_rendered', 'UI_INTERACTION', {
      dataPoints: data.length,
      hasTitle: !!title,
      smooth
    });
  }, [data.length, title, smooth]);

  return (
    <HVACErrorBoundary context="LINE_CHART">
      <StyledChartContainer theme={theme} height={height} className={className}>
        {title && <StyledChartTitle theme={theme}>{title}</StyledChartTitle>}
        
        <div style={{ height: 'calc(100% - 80px)', position: 'relative' }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 80"
            preserveAspectRatio="none"
            style={{ overflow: 'visible' }}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke={theme.border.color.light}
                  strokeWidth="0.1"
                />
              </pattern>
            </defs>
            <rect width="100" height="80" fill="url(#grid)" />

            {/* Line path */}
            {pathData && (
              <motion.path
                d={pathData}
                fill="none"
                stroke={points[0]?.color || DEFAULT_COLORS[0]}
                strokeWidth="0.5"
                initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            )}

            {/* Data points */}
            {points.map((point, index) => (
              <motion.circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="0.8"
                fill={point.color}
                initial={animated ? { scale: 0 } : { scale: 1 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5 + index * 0.1, duration: 0.3 }}
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </motion.circle>
            ))}
          </svg>

          {/* X-axis labels */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            {data.map((item, index) => (
              <div
                key={index}
                style={{
                  fontSize: theme.font.size.xs,
                  color: theme.font.color.tertiary,
                  textAlign: 'center',
                  flex: 1
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {showLegend && (
          <StyledLegend theme={theme}>
            {data.map((item, index) => (
              <StyledLegendItem 
                key={item.label} 
                theme={theme} 
                color={item.color || DEFAULT_COLORS[0]}
              >
                {item.label}: {item.value}
              </StyledLegendItem>
            ))}
          </StyledLegend>
        )}
      </StyledChartContainer>
    </HVACErrorBoundary>
  );
};
