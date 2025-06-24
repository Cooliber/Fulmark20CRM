/**
 * KanbanColumn - Kolumna Kanban z drag-and-drop
 * "Pasja rodzi profesjonalizm" - Profesjonalna kolumna kanban dla HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import React, { useCallback } from 'react';

// HVAC services and hooks
import {
    type KanbanCardType,
    type KanbanColumnType
} from '../../index';

// Component props
interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  metrics: ColumnMetrics;
  isDragOver: boolean;
  onCardDragStart: (card: KanbanCardType, columnId: string) => void;
  onCardClick: (card: KanbanCardType) => void;
  onCreateCard: () => void;
  onDragOver: (e: React.DragEvent, position: number) => void;
  onDrop: (e: React.DragEvent, position: number) => void;
  className?: string;
}

interface ColumnMetrics {
  cardCount: number;
  completedCards: number;
  overdueCards: number;
  averageTimeInColumn: number;
  wipUtilization: number;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  cards,
  metrics,
  isDragOver,
  onCardDragStart,
  onCardClick,
  onCreateCard,
  onDragOver,
  onDrop,
  className = '',
}) => {
  // Handle card drag start
  const handleCardDragStart = useCallback((
    e: React.DragEvent,
    card: KanbanCardType
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    onCardDragStart(card, column.id);
  }, [column.id, onCardDragStart]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Calculate position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const cardHeight = 120; // Approximate card height
    const position = Math.floor(y / cardHeight);
    
    onDragOver(e, Math.max(0, Math.min(position, cards.length)));
  }, [cards.length, onDragOver]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Calculate drop position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const cardHeight = 120;
    const position = Math.floor(y / cardHeight);
    
    onDrop(e, Math.max(0, Math.min(position, cards.length)));
  }, [cards.length, onDrop]);

  // Get column header color
  const getColumnHeaderStyle = useCallback(() => {
    return {
      borderTop: `4px solid ${column.color}`,
      backgroundColor: isDragOver ? 'var(--surface-100)' : 'var(--surface-0)',
    };
  }, [column.color, isDragOver]);

  // Get WIP limit status
  const getWipStatus = useCallback(() => {
    if (!column.wipLimit) return null;
    
    const utilization = (cards.length / column.wipLimit) * 100;
    
    if (utilization >= 100) {
      return { severity: 'danger' as const, label: 'Przekroczono limit' };
    } else if (utilization >= 80) {
      return { severity: 'warning' as const, label: 'Blisko limitu' };
    } else {
      return { severity: 'success' as const, label: 'W limicie' };
    }
  }, [column.wipLimit, cards.length]);

  const wipStatus = getWipStatus();

  return (
    <div 
      className={`kanban-column ${className} ${isDragOver ? 'drag-over' : ''}`}
      style={{ minWidth: '300px', maxWidth: '350px' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <Card 
        className="kanban-column-header mb-3"
        style={getColumnHeaderStyle()}
      >
        <div className="flex justify-content-between align-items-center mb-2">
          <div className="flex align-items-center gap-2">
            <h4 className="text-lg font-semibold text-900 m-0">{column.name}</h4>
            <Badge value={cards.length} severity="info" />
          </div>
          <Button
            icon="pi pi-plus"
            size="small"
            text
            rounded
            tooltip="Dodaj kartę"
            onClick={onCreateCard}
          />
        </div>

        {/* Column Description */}
        {column.description && (
          <p className="text-sm text-600 mb-2">{column.description}</p>
        )}

        {/* WIP Limit */}
        {column.wipLimit && (
          <div className="mb-2">
            <div className="flex justify-content-between align-items-center mb-1">
              <span className="text-sm text-600">WIP Limit</span>
              <span className="text-sm font-semibold">
                {cards.length}/{column.wipLimit}
              </span>
            </div>
            <ProgressBar 
              value={(cards.length / column.wipLimit) * 100}
              showValue={false}
              style={{ height: '4px' }}
              className={cards.length >= column.wipLimit ? 'p-progressbar-danger' : ''}
            />
            {wipStatus && (
              <Badge 
                value={wipStatus.label}
                severity={wipStatus.severity}
                className="mt-1"
                style={{ fontSize: '0.75rem' }}
              />
            )}
          </div>
        )}

        {/* Column Metrics */}
        <div className="grid text-center">
          <div className="col-4">
            <div className="text-sm font-semibold text-primary">{metrics.completedCards}</div>
            <div className="text-xs text-600">Ukończone</div>
          </div>
          <div className="col-4">
            <div className="text-sm font-semibold text-orange-500">{metrics.overdueCards}</div>
            <div className="text-xs text-600">Przeterminowane</div>
          </div>
          <div className="col-4">
            <div className="text-sm font-semibold text-green-500">
              {metrics.averageTimeInColumn.toFixed(1)}h
            </div>
            <div className="text-xs text-600">Śr. czas</div>
          </div>
        </div>
      </Card>

      {/* Cards Container */}
      <div className="kanban-cards-container">
        {cards
          .sort((a, b) => a.position - b.position)
          .map((card, index) => (
            <div
              key={card.id}
              className="kanban-card-wrapper mb-2"
              draggable
              onDragStart={(e) => handleCardDragStart(e, card)}
              onClick={() => onCardClick(card)}
              style={{ cursor: 'pointer' }}
            >
              <Card 
                className="kanban-card hover:shadow-3 transition-all transition-duration-200"
                style={{
                  borderLeft: `4px solid ${getPriorityColor(card.priority)}`,
                }}
              >
                <div className="flex justify-content-between align-items-start mb-2">
                  <h5 className="text-sm font-semibold text-900 m-0 line-height-3">
                    {card.title}
                  </h5>
                  <Badge 
                    value={card.type}
                    severity="secondary"
                    className="text-xs"
                  />
                </div>

                {card.description && (
                  <p className="text-xs text-600 mb-2 line-height-3">
                    {card.description.length > 80 
                      ? `${card.description.substring(0, 80)}...`
                      : card.description
                    }
                  </p>
                )}

                {/* Card Tags */}
                {card.tags.length > 0 && (
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {card.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge 
                        key={tagIndex}
                        value={tag}
                        severity="info"
                        className="text-xs"
                      />
                    ))}
                    {card.tags.length > 3 && (
                      <Badge 
                        value={`+${card.tags.length - 3}`}
                        severity="secondary"
                        className="text-xs"
                      />
                    )}
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex justify-content-between align-items-center">
                  <div className="flex align-items-center gap-2">
                    {card.assignedTo.length > 0 && (
                      <div className="flex align-items-center gap-1">
                        <i className="pi pi-user text-xs text-600" />
                        <span className="text-xs text-600">
                          {card.assignedTo.length}
                        </span>
                      </div>
                    )}
                    {card.comments.length > 0 && (
                      <div className="flex align-items-center gap-1">
                        <i className="pi pi-comment text-xs text-600" />
                        <span className="text-xs text-600">
                          {card.comments.length}
                        </span>
                      </div>
                    )}
                    {card.attachments.length > 0 && (
                      <div className="flex align-items-center gap-1">
                        <i className="pi pi-paperclip text-xs text-600" />
                        <span className="text-xs text-600">
                          {card.attachments.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {card.dueDate && (
                    <Badge 
                      value={new Date(card.dueDate).toLocaleDateString('pl-PL')}
                      severity={new Date(card.dueDate) < new Date() ? 'danger' : 'secondary'}
                      className="text-xs"
                    />
                  )}
                </div>
              </Card>
            </div>
          ))}

        {/* Drop Zone */}
        {isDragOver && (
          <div 
            className="kanban-drop-zone border-2 border-dashed border-primary-300 border-round p-3 text-center"
            style={{ minHeight: '60px' }}
          >
            <i className="pi pi-arrow-down text-primary" />
            <p className="text-sm text-primary m-0">Upuść kartę tutaj</p>
          </div>
        )}

        {/* Empty State */}
        {cards.length === 0 && !isDragOver && (
          <div className="text-center p-4">
            <i className="pi pi-inbox text-4xl text-400 mb-2" />
            <p className="text-sm text-600 mb-2">Brak kart w tej kolumnie</p>
            <Button
              label="Dodaj kartę"
              icon="pi pi-plus"
              size="small"
              text
              onClick={onCreateCard}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get priority color
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#dc3545'; // red
    case 'urgent':
      return '#fd7e14'; // orange
    case 'high':
      return '#ffc107'; // yellow
    case 'medium':
      return '#20c997'; // teal
    case 'low':
      return '#6c757d'; // gray
    default:
      return '#6c757d';
  }
}
