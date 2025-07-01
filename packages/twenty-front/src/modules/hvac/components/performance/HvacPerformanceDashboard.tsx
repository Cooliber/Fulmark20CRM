/**
 * HVAC Performance Dashboard Component
 * "Pasja rodzi profesjonalizm" - Real-time performance monitoring
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Performance optimization with debouncing
 */

import {
    CheckCircleOutlined,
    CloudOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    ThunderboltOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Progress, Row, Statistic, Table, Tabs } from 'antd';
import React, { useCallback, useState } from 'react';

import { useHVACDebouncedPerformance } from '../../hooks/useHVACDebouncedPerformance';
import { hvacPerformanceOptimizer } from '../../services/HvacPerformanceOptimizer';
import { trackHVACUserAction } from '../../utils/sentry-init';

const { TabPane } = Tabs;

// Performance status types
type PerformanceStatus = 'excellent' | 'good' | 'fair' | 'poor';

// Component props
export interface HvacPerformanceDashboardProps {
  className?: string;
  onOptimizationApplied?: (optimization: string) => void;
  onPerformanceAlert?: (alert: any) => void;
}

// Performance data interface
interface PerformanceData {
  bundleSize: number;
  loadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  searchPerformance: number;
  status: PerformanceStatus;
}

export const HvacPerformanceDashboard: React.FC<HvacPerformanceDashboardProps> = ({
  className,
  onOptimizationApplied,
  onPerformanceAlert,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    bundleSize: 4.2, // MB
    loadTime: 280, // ms
    cacheHitRate: 0.85,
    memoryUsage: 45, // MB
    searchPerformance: 250, // ms
    status: 'good',
  });

  const {
    getMetrics,
    optimizeMemory,
    clearCache,
    measureOperation,
  } = useHVACDebouncedPerformance({
    enableMetrics: true,
    performanceThreshold: 300,
  });

  // Handle performance optimization
  const handleOptimization = useCallback(async (type: string) => {
    setIsOptimizing(true);
    
    try {
      await measureOperation(`optimize_${type}`, async () => {
        switch (type) {
          case 'memory':
            optimizeMemory();
            break;
          case 'cache':
            clearCache();
            break;
          case 'bundle':
            // Trigger bundle optimization
            const analysis = hvacPerformanceOptimizer.optimizeBundleSize();
            console.log('Bundle optimization analysis:', analysis);
            break;
          default:
            break;
        }
        
        // Simulate optimization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      trackHVACUserAction('performance_optimization_applied', 'PERFORMANCE', {
        optimizationType: type,
        beforeStatus: performanceData.status,
      });

      onOptimizationApplied?.(type);
      
      // Update performance data (simulated improvement)
      setPerformanceData(prev => ({
        ...prev,
        bundleSize: type === 'bundle' ? prev.bundleSize * 0.8 : prev.bundleSize,
        loadTime: prev.loadTime * 0.9,
        cacheHitRate: type === 'cache' ? Math.min(prev.cacheHitRate + 0.1, 1) : prev.cacheHitRate,
        memoryUsage: type === 'memory' ? prev.memoryUsage * 0.7 : prev.memoryUsage,
        status: 'excellent',
      }));

    } catch (error) {
      console.error('Optimization failed:', error);
      onPerformanceAlert?.({
        type: 'error',
        message: `Failed to optimize ${type}`,
        error,
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [performanceData, measureOperation, optimizeMemory, clearCache, onOptimizationApplied, onPerformanceAlert]);

  // Get status color based on performance
  const getStatusColor = (status: PerformanceStatus): string => {
    switch (status) {
      case 'excellent': return '#52c41a';
      case 'good': return '#1890ff';
      case 'fair': return '#faad14';
      case 'poor': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  // Get status icon
  const getStatusIcon = (status: PerformanceStatus) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircleOutlined style={{ color: getStatusColor(status) }} />;
      case 'fair':
      case 'poor':
        return <WarningOutlined style={{ color: getStatusColor(status) }} />;
      default:
        return null;
    }
  };

  // Performance overview tab
  const renderOverviewTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Bundle Size"
              value={performanceData.bundleSize}
              suffix="MB"
              precision={1}
              valueStyle={{ color: performanceData.bundleSize > 4.7 ? '#ff4d4f' : '#3f8600' }}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Load Time"
              value={performanceData.loadTime}
              suffix="ms"
              valueStyle={{ color: performanceData.loadTime > 300 ? '#ff4d4f' : '#3f8600' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cache Hit Rate"
              value={performanceData.cacheHitRate * 100}
              suffix="%"
              precision={1}
              valueStyle={{ color: performanceData.cacheHitRate < 0.7 ? '#ff4d4f' : '#3f8600' }}
              prefix={<CloudOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={performanceData.memoryUsage}
              suffix="MB"
              valueStyle={{ color: performanceData.memoryUsage > 100 ? '#ff4d4f' : '#3f8600' }}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Performance Status" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          {getStatusIcon(performanceData.status)}
          <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>
            Overall Status: {performanceData.status.toUpperCase()}
          </span>
        </div>
        
        <Progress
          percent={
            performanceData.status === 'excellent' ? 100 :
            performanceData.status === 'good' ? 80 :
            performanceData.status === 'fair' ? 60 : 40
          }
          strokeColor={getStatusColor(performanceData.status)}
          showInfo={false}
        />
      </Card>

      {performanceData.status !== 'excellent' && (
        <Alert
          message="Performance Optimization Available"
          description="Your HVAC system performance can be improved. Click the optimization buttons below."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Card title="Quick Optimizations">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              loading={isOptimizing}
              onClick={() => handleOptimization('bundle')}
              block
            >
              Optimize Bundle Size
            </Button>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<CloudOutlined />}
              loading={isOptimizing}
              onClick={() => handleOptimization('cache')}
              block
            >
              Clear Cache
            </Button>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<DashboardOutlined />}
              loading={isOptimizing}
              onClick={() => handleOptimization('memory')}
              block
            >
              Optimize Memory
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Bundle analysis tab
  const renderBundleAnalysisTab = () => {
    const bundleAnalysis = hvacPerformanceOptimizer.optimizeBundleSize();
    
    const columns = [
      {
        title: 'Optimization Type',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => type.replace('-', ' ').toUpperCase(),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Estimated Savings',
        dataIndex: 'estimatedSavings',
        key: 'estimatedSavings',
        render: (savings: number) => `${(savings / 1024 / 1024).toFixed(2)} MB`,
      },
      {
        title: 'Priority',
        dataIndex: 'priority',
        key: 'priority',
        render: (priority: string) => (
          <span style={{ 
            color: priority === 'high' ? '#ff4d4f' : priority === 'medium' ? '#faad14' : '#52c41a' 
          }}>
            {priority.toUpperCase()}
          </span>
        ),
      },
    ];

    return (
      <div>
        <Card title="Bundle Size Analysis" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic
                title="Current Bundle Size"
                value={(bundleAnalysis.currentBundleSize / 1024 / 1024).toFixed(2)}
                suffix="MB"
                valueStyle={{ color: bundleAnalysis.currentBundleSize > 4700000 ? '#ff4d4f' : '#3f8600' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Potential Savings"
                value={(bundleAnalysis.totalPotentialSavings / 1024 / 1024).toFixed(2)}
                suffix="MB"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>

        <Card title="Optimization Opportunities">
          <Table
            dataSource={bundleAnalysis.optimizationOpportunities}
            columns={columns}
            pagination={false}
            size="small"
          />
        </Card>
      </div>
    );
  };

  // Performance metrics tab
  const renderMetricsTab = () => {
    const metrics = getMetrics();
    
    return (
      <div>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Operation Metrics">
              <Statistic
                title="Total Operations"
                value={metrics.operationCount}
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Average Time"
                value={metrics.averageTime}
                suffix="ms"
                precision={1}
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Slow Operations"
                value={metrics.slowOperations}
                valueStyle={{ color: metrics.slowOperations > 0 ? '#ff4d4f' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Cache Performance">
              <Statistic
                title="Cache Hit Rate"
                value={metrics.cacheHitRate * 100}
                suffix="%"
                precision={1}
                valueStyle={{ color: metrics.cacheHitRate < 0.7 ? '#ff4d4f' : '#3f8600' }}
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Debounce Efficiency"
                value={metrics.debounceEfficiency * 100}
                suffix="%"
                precision={1}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className={className}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DashboardOutlined style={{ marginRight: 8 }} />
            HVAC Performance Dashboard
          </div>
        }
        extra={
          <Button
            type="link"
            onClick={() => {
              trackHVACUserAction('performance_dashboard_refresh', 'NAVIGATION', {
                activeTab,
              });
              window.location.reload();
            }}
          >
            Refresh
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: renderOverviewTab(),
            },
            {
              key: 'bundle',
              label: 'Bundle Analysis',
              children: renderBundleAnalysisTab(),
            },
            {
              key: 'metrics',
              label: 'Metrics',
              children: renderMetricsTab(),
            },
          ]}
        />
      </Card>
    </div>
  );
};
