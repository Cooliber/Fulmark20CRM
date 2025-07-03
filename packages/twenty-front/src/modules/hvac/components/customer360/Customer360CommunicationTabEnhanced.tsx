/**
 * Customer 360 Communication Tab Enhanced - AI-Powered Communication Management
 * "Pasja rodzi profesjonalizm" - Professional HVAC communication with AI insights
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React, { useCallback, useState } from 'react';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Skeleton } from 'primereact/skeleton';
import { Chip } from 'primereact/chip';
import { ProgressBar } from 'primereact/progressbar';

// HVAC services and hooks
import {
  Communication,
  AIInsights,
  trackHVACUserAction
} from '../../index';

// Placeholder hook for communication timeline
const useCommunicationTimeline = (customerId: string) => {
  return {
    communications: [] as Communication[],
    loading: false,
    error: null,
    refetch: () => Promise.resolve(),
    loadMore: () => Promise.resolve(),
    hasMore: false,
  };
};

interface Customer360CommunicationTabEnhancedProps {
  customerId: string;
  communications?: Communication[];
}

export const Customer360CommunicationTabEnhanced: React.FC<Customer360CommunicationTabEnhancedProps> = ({
  customerId,
  communications: propCommunications,
}) => {
  // State for dialogs and search
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [selectedInsights, setSelectedInsights] = useState<AIInsights | null>(null);

  // Communication timeline hook
  const {
    communications,
    loading,
    error,
    stats,
    searchResults,
    searchLoading,
    loadTimeline,
    searchCommunications,
    clearSearch,
    processEmailWithAI,
    refreshCommunications,
    clearError,
  } = useCommunicationTimeline({
    customerId,
    autoLoad: true,
    enableRealTimeUpdates: true,
    onError: (error) => {
      trackHVACUserAction('communication_error', 'COMMUNICATION', {
        customerId,
        error: error.message,
      });
    },
    onAIInsightsGenerated: (insights) => {
      setSelectedInsights(insights);
      setShowAIInsights(true);
    },
  });

  // Use prop communications if provided, otherwise use hook communications
  const displayCommunications = propCommunications || communications;

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchCommunications(query);
    } else {
      clearSearch();
    }
  }, [searchCommunications, clearSearch]);

  // Handle AI processing
  const handleProcessWithAI = useCallback(async (communication: Communication) => {
    try {
      trackHVACUserAction('communication_ai_process', 'AI_PROCESSING', {
        communicationId: communication.id,
        type: communication.type,
      });

      await processEmailWithAI(communication.content);
    } catch (error) {
      console.error('Failed to process with AI:', error);
    }
  }, [processEmailWithAI]);

  // Get communication type configuration
  const getTypeConfig = useCallback((type: Communication['type']) => {
    const configs = {
      email: { icon: 'pi-envelope', label: 'Email', color: 'blue' },
      phone: { icon: 'pi-phone', label: 'Telefon', color: 'green' },
      sms: { icon: 'pi-mobile', label: 'SMS', color: 'orange' },
      meeting: { icon: 'pi-users', label: 'Spotkanie', color: 'purple' },
      note: { icon: 'pi-file-edit', label: 'Notatka', color: 'gray' },
      document: { icon: 'pi-file', label: 'Dokument', color: 'teal' },
    };
    return configs[type] || configs.note;
  }, []);

  // Get sentiment configuration
  const getSentimentConfig = useCallback((sentiment: AIInsights['sentiment']) => {
    const configs = {
      positive: { label: 'Pozytywny', severity: 'success' as const, icon: 'pi-thumbs-up' },
      neutral: { label: 'Neutralny', severity: 'info' as const, icon: 'pi-minus' },
      negative: { label: 'Negatywny', severity: 'danger' as const, icon: 'pi-thumbs-down' },
    };
    return configs[sentiment];
  }, []);

  // Render communication timeline item
  const renderTimelineContent = useCallback((communication: Communication) => {
    const typeConfig = getTypeConfig(communication.type);
    const hasAI = !!communication.aiInsights;

    return (
      <Card className="mt-2 communication-timeline-item">
        <div className="flex justify-content-between align-items-start mb-3">
          <div className="flex align-items-center gap-2">
            <i className={`pi ${typeConfig.icon} text-${typeConfig.color}-500`} />
            <span className="font-semibold">{communication.subject || typeConfig.label}</span>
            {hasAI && (
              <Tag 
                icon="pi pi-sparkles" 
                value="AI" 
                severity="info" 
                className="ml-2"
              />
            )}
          </div>
          <div className="flex align-items-center gap-2">
            <Badge
              value={communication.direction === 'inbound' ? 'Przychodzące' : 'Wychodzące'}
              severity={communication.direction === 'inbound' ? 'info' : 'success'}
            />
            <Badge
              value={communication.priority}
              severity={communication.priority === 'urgent' ? 'danger' : 'secondary'}
            />
          </div>
        </div>

        <p className="text-600 mb-3 line-height-3">
          {communication.content.length > 200 
            ? `${communication.content.substring(0, 200)}...` 
            : communication.content
          }
        </p>

        {/* AI Insights Preview */}
        {hasAI && communication.aiInsights && (
          <div className="bg-blue-50 border-round p-3 mb-3">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-sparkles text-blue-500" />
              <span className="font-semibold text-blue-700">Analiza AI</span>
            </div>
            <div className="flex gap-2 mb-2">
              <Chip 
                label={getSentimentConfig(communication.aiInsights.sentiment).label}
                icon={getSentimentConfig(communication.aiInsights.sentiment).icon}
                className="p-chip-sm"
              />
              <Chip 
                label={`Pilność: ${communication.aiInsights.urgency}`}
                className="p-chip-sm"
              />
            </div>
            <p className="text-sm text-600 mb-2">{communication.aiInsights.summary}</p>
            <Button
              label="Zobacz szczegóły"
              size="small"
              text
              onClick={() => {
                setSelectedInsights(communication.aiInsights!);
                setShowAIInsights(true);
              }}
            />
          </div>
        )}

        {/* Tags */}
        {communication.tags.length > 0 && (
          <div className="flex gap-1 mb-3">
            {communication.tags.map((tag, index) => (
              <Tag key={index} value={tag} className="p-tag-sm" />
            ))}
          </div>
        )}

        <div className="flex justify-content-between align-items-center">
          <div className="text-sm text-500">
            {communication.timestamp.toLocaleDateString('pl-PL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="flex gap-2">
            {communication.type === 'email' && !hasAI && (
              <Button
                icon="pi pi-sparkles"
                size="small"
                text
                tooltip="Analizuj z AI"
                onClick={() => handleProcessWithAI(communication)}
              />
            )}
            <Button
              icon="pi pi-reply"
              size="small"
              text
              tooltip="Odpowiedz"
            />
          </div>
        </div>
      </Card>
    );
  }, [getTypeConfig, getSentimentConfig, handleProcessWithAI]);

  // Render loading skeleton
  if (loading && displayCommunications.length === 0) {
    return (
      <div className="grid">
        <div className="col-12">
          <Card>
            <div className="flex flex-column gap-3">
              <Skeleton height="3rem" />
              <Skeleton height="2rem" />
              <Skeleton height="15rem" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      {/* Communication Stats */}
      {stats && (
        <div className="col-12">
          <Card title="Statystyki komunikacji" className="mb-4">
            <div className="grid">
              <div className="col-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-600">Łącznie</div>
                </div>
              </div>
              <div className="col-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.avgResponseTime}h</div>
                  <div className="text-sm text-600">Śr. czas odpowiedzi</div>
                </div>
              </div>
              <div className="col-6">
                <div className="text-sm text-600 mb-2">Rozkład sentymentu</div>
                <div className="flex gap-2">
                  <Chip label={`Pozytywny: ${stats.sentimentDistribution.positive}`} className="p-chip-sm" />
                  <Chip label={`Neutralny: ${stats.sentimentDistribution.neutral}`} className="p-chip-sm" />
                  <Chip label={`Negatywny: ${stats.sentimentDistribution.negative}`} className="p-chip-sm" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Actions */}
      <div className="col-12">
        <Card className="mb-4">
          <div className="flex gap-3 align-items-center">
            <div className="flex-1">
              <span className="p-input-icon-left w-full">
                <i className="pi pi-search" />
                <InputText
                  placeholder="Szukaj w komunikacji..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </span>
            </div>
            <Button
              icon="pi pi-refresh"
              onClick={refreshCommunications}
              tooltip="Odśwież"
              loading={loading}
            />
            <Button
              icon="pi pi-plus"
              label="Nowa komunikacja"
              onClick={() => {
                trackHVACUserAction('new_communication_clicked', 'COMMUNICATION', { customerId });
              }}
            />
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <div className="col-12">
          <div className="p-3 mb-3 bg-red-50 border-round text-red-800">
            <div className="flex justify-content-between align-items-center">
              <div>
                <i className="pi pi-exclamation-triangle mr-2" />
                Błąd podczas ładowania komunikacji: {error}
              </div>
              <Button
                icon="pi pi-times"
                text
                onClick={clearError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Communication Timeline */}
      <div className="col-12">
        <Card title="Historia komunikacji">
          {searchQuery && searchResults.length > 0 ? (
            <div>
              <div className="mb-3">
                <Badge value={`Znaleziono: ${searchResults.length}`} severity="info" />
                {searchLoading && <ProgressBar mode="indeterminate" className="mt-2" style={{ height: '3px' }} />}
              </div>
              <Timeline
                value={searchResults}
                align="left"
                content={renderTimelineContent}
                marker={(item) => {
                  const typeConfig = getTypeConfig(item.type);
                  return (
                    <div className={`timeline-marker bg-${typeConfig.color}-500 border-circle p-2`}>
                      <i className={`pi ${typeConfig.icon} text-white`} />
                    </div>
                  );
                }}
              />
            </div>
          ) : displayCommunications.length > 0 ? (
            <Timeline
              value={displayCommunications}
              align="left"
              content={renderTimelineContent}
              marker={(item) => {
                const typeConfig = getTypeConfig(item.type);
                return (
                  <div className={`timeline-marker bg-${typeConfig.color}-500 border-circle p-2`}>
                    <i className={`pi ${typeConfig.icon} text-white`} />
                  </div>
                );
              }}
            />
          ) : (
            <div className="text-center p-6">
              <i className="pi pi-comments text-6xl text-400 mb-4" />
              <h3 className="text-900 font-semibold mb-2">Brak komunikacji</h3>
              <p className="text-600 mb-4">
                Nie ma jeszcze żadnej komunikacji z tym klientem.
              </p>
              <Button
                label="Rozpocznij komunikację"
                icon="pi pi-plus"
                onClick={() => {
                  trackHVACUserAction('start_communication_clicked', 'COMMUNICATION', { customerId });
                }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* AI Insights Dialog */}
      <Dialog
        header="Analiza AI - Szczegóły"
        visible={showAIInsights}
        onHide={() => setShowAIInsights(false)}
        style={{ width: '50vw' }}
        modal
      >
        {selectedInsights && (
          <div className="flex flex-column gap-4">
            <div className="grid">
              <div className="col-6">
                <div className="text-sm text-600 mb-1">Sentyment</div>
                <div className="flex align-items-center gap-2">
                  <Badge 
                    value={getSentimentConfig(selectedInsights.sentiment).label}
                    severity={getSentimentConfig(selectedInsights.sentiment).severity}
                  />
                  <span className="text-sm">({selectedInsights.sentimentScore.toFixed(2)})</span>
                </div>
              </div>
              <div className="col-6">
                <div className="text-sm text-600 mb-1">Pilność</div>
                <Badge value={selectedInsights.urgency} />
              </div>
            </div>

            <div>
              <div className="text-sm text-600 mb-2">Podsumowanie</div>
              <p className="text-900">{selectedInsights.summary}</p>
            </div>

            <div>
              <div className="text-sm text-600 mb-2">Tematy</div>
              <div className="flex gap-1 flex-wrap">
                {selectedInsights.topics.map((topic, index) => (
                  <Tag key={index} value={topic} />
                ))}
              </div>
            </div>

            {selectedInsights.actionItems.length > 0 && (
              <div>
                <div className="text-sm text-600 mb-2">Działania do podjęcia</div>
                <ul className="list-none p-0 m-0">
                  {selectedInsights.actionItems.map((item, index) => (
                    <li key={index} className="flex align-items-center gap-2 mb-2">
                      <i className="pi pi-check-circle text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-sm text-500">
              Pewność analizy: {(selectedInsights.confidence * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
