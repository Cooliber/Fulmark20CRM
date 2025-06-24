/**
 * HVAC Sentry Status Component
 * "Pasja rodzi profesjonalizm" - Quality monitoring dashboard
 */

import styled from '@emotion/styled';
import React, { useEffect, useState } from 'react';
import { IconAlertTriangle, IconCheck, IconLockCustom, IconX } from 'twenty-ui/display';
import { SentryTestResult, testSentryConfiguration } from '../utils/sentry-test';

const StyledContainer = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: ${({ theme }) => theme.spacing(4)};
  margin: ${({ theme }) => theme.spacing(2)} 0;
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const StyledTitle = styled.h3`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  margin: 0;
`;

const StyledStatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledStatusItem = styled.div<{ status: 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme, status }) => 
    status === 'success' ? theme.color.green10 :
    status === 'warning' ? theme.color.yellow10 :
    theme.color.red10
  };
  border-radius: ${({ theme }) => theme.border.radius.sm};
  border-left: 4px solid ${({ theme, status }) => 
    status === 'success' ? theme.color.green :
    status === 'warning' ? theme.color.yellow :
    theme.color.red
  };
`;

const StyledStatusText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledStatusLabel = styled.span`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const StyledStatusValue = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const StyledTestButton = styled.button`
  background: ${({ theme }) => theme.color.blue};
  color: ${({ theme }) => theme.font.color.inverted};
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: ${({ theme }) => theme.spacing(3)};

  &:hover {
    background: ${({ theme }) => theme.color.blue60};
  }

  &:disabled {
    background: ${({ theme }) => theme.color.gray50};
    cursor: not-allowed;
  }
`;

const StyledLoadingText = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-style: italic;
`;

export const HvacSentryStatus: React.FC = () => {
  const [sentryStatus, setSentryStatus] = useState<SentryTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const runSentryTest = async () => {
    setIsLoading(true);
    try {
      const result = await testSentryConfiguration();
      setSentryStatus(result);
      setLastTestTime(new Date());
    } catch (error) {
      setSentryStatus({
        isConfigured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Run initial test
    runSentryTest();
  }, []);

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <IconCheck size={16} />;
      case 'warning':
        return <IconAlertTriangle size={16} />;
      case 'error':
        return <IconX size={16} />;
    }
  };

  const getOverallStatus = (): 'success' | 'warning' | 'error' => {
    if (!sentryStatus) return 'warning';
    if (sentryStatus.error) return 'error';
    if (sentryStatus.isConfigured) return 'success';
    return 'warning';
  };

  return (
    <StyledContainer>
      <StyledHeader>
        <IconLockCustom size={20} />
        <StyledTitle>Sentry Error Monitoring</StyledTitle>
      </StyledHeader>

      {isLoading ? (
        <StyledLoadingText>Testing Sentry configuration...</StyledLoadingText>
      ) : sentryStatus ? (
        <StyledStatusGrid>
          <StyledStatusItem status={getOverallStatus()}>
            {getStatusIcon(getOverallStatus())}
            <StyledStatusText>
              <StyledStatusLabel>Configuration Status</StyledStatusLabel>
              <StyledStatusValue>
                {sentryStatus.isConfigured ? 'Configured' : 'Not Configured'}
              </StyledStatusValue>
            </StyledStatusText>
          </StyledStatusItem>

          {sentryStatus.environment && (
            <StyledStatusItem status="success">
              {getStatusIcon('success')}
              <StyledStatusText>
                <StyledStatusLabel>Environment</StyledStatusLabel>
                <StyledStatusValue>{sentryStatus.environment}</StyledStatusValue>
              </StyledStatusText>
            </StyledStatusItem>
          )}

          {sentryStatus.release && (
            <StyledStatusItem status="success">
              {getStatusIcon('success')}
              <StyledStatusText>
                <StyledStatusLabel>Release</StyledStatusLabel>
                <StyledStatusValue>{sentryStatus.release}</StyledStatusValue>
              </StyledStatusText>
            </StyledStatusItem>
          )}

          {sentryStatus.dsn && (
            <StyledStatusItem status="success">
              {getStatusIcon('success')}
              <StyledStatusText>
                <StyledStatusLabel>DSN</StyledStatusLabel>
                <StyledStatusValue>{sentryStatus.dsn}</StyledStatusValue>
              </StyledStatusText>
            </StyledStatusItem>
          )}

          {sentryStatus.lastEventId && (
            <StyledStatusItem status="success">
              {getStatusIcon('success')}
              <StyledStatusText>
                <StyledStatusLabel>Last Test Event</StyledStatusLabel>
                <StyledStatusValue>{sentryStatus.lastEventId}</StyledStatusValue>
              </StyledStatusText>
            </StyledStatusItem>
          )}

          {sentryStatus.error && (
            <StyledStatusItem status="error">
              {getStatusIcon('error')}
              <StyledStatusText>
                <StyledStatusLabel>Error</StyledStatusLabel>
                <StyledStatusValue>{sentryStatus.error}</StyledStatusValue>
              </StyledStatusText>
            </StyledStatusItem>
          )}
        </StyledStatusGrid>
      ) : null}

      <StyledTestButton onClick={runSentryTest} disabled={isLoading}>
        {isLoading ? 'Testing...' : 'Test Sentry Configuration'}
      </StyledTestButton>

      {lastTestTime && (
        <StyledStatusValue style={{ marginTop: '8px', display: 'block' }}>
          Last tested: {lastTestTime.toLocaleString('pl-PL')}
        </StyledStatusValue>
      )}
    </StyledContainer>
  );
};
