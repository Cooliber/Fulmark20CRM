/**
 * KanbanCard - Individual Kanban Card Component
 * "Pasja rodzi profesjonalizm" - Professional kanban card for HVAC
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Card } from 'primereact/card';
import { Chip } from 'primereact/chip';
import React, { useCallback } from 'react';

// HVAC services and hooks
import {
    type KanbanCardType,
    trackHVACUserAction
} from '../../index';

// Component props
interface KanbanCardProps {
  card: KanbanCardType;
  isDragging?: boolean;
  onCardClick?: (card: KanbanCardType) => void;
  onCardDragStart?: (e: React.DragEvent, card: KanbanCardType) => void;
  className?: string;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  isDragging = false,
  onCardClick,
  onCardDragStart,
  className = '',
}) => {
  // Handle card click
  const handleCardClick = useCallback(() => {
    onCardClick?.(card);
    
    trackHVACUserAction('kanban_card_clicked', 'KANBAN_INTERACTION', {
      cardId: card.id,
      cardType: card.type,
      cardStatus: card.status,
    });
  }, [card, onCardClick]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    onCardDragStart?.(e, card);
  }, [card, onCardDragStart]);

  // Get priority color
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'krytyczny':
        return '#dc2626'; // red-600
      case 'high':
      case 'wysoki':
        return '#ea580c'; // orange-600
      case 'medium':
      case 'średni':
        return '#ca8a04'; // yellow-600
      case 'low':
      case 'niski':
        return '#16a34a'; // green-600
      default:
        return '#6b7280'; // gray-500
    }
  }, []);

  // Get status severity
  const getStatusSeverity = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'zakończone':
        return 'success';
      case 'in_progress':
      case 'w trakcie':
        return 'info';
      case 'on_hold':
      case 'wstrzymane':
        return 'warning';
      case 'cancelled':
      case 'anulowane':
        return 'danger';
      default:
        return 'secondary';
    }
  }, []);

  // Check if card is overdue
  const isOverdue = useCallback(() => {
    if (!card.dueDate) return false;
    return new Date(card.dueDate) < new Date();
  }, [card.dueDate]);

  return (
    <div
      className={`kanban-card-wrapper ${className} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <Card 
        className="kanban-card hover:shadow-3 transition-all transition-duration-200"
        style={{
          borderLeft: `4px solid ${getPriorityColor(card.priority)}`,
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        {/* Card Header */}
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

        {/* Card Description */}
        {card.description && (
          <p className="text-xs text-600 mb-2 line-height-3">
            {card.description.length > 100 
              ? `${card.description.substring(0, 100)}...` 
              : card.description
            }
          </p>
        )}

        {/* Card Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.tags.slice(0, 3).map((tag: string, index: number) => (
              <Chip
                key={index}
                label={tag}
                className="text-xs p-1"
                style={{ fontSize: '0.7rem' }}
              />
            ))}
            {card.tags.length > 3 && (
              <Chip 
                label={`+${card.tags.length - 3}`}
                className="text-xs p-1"
                style={{ fontSize: '0.7rem' }}
              />
            )}
          </div>
        )}

        {/* Card Footer */}
        <div className="flex justify-content-between align-items-center">
          <div className="flex align-items-center gap-2">
            {/* Assignee Avatar */}
            {card.assignedTo && card.assignedTo.length > 0 && (
              <Avatar
                label={card.assignedTo[0].substring(0, 2).toUpperCase()}
                size="normal"
                shape="circle"
                style={{ backgroundColor: '#6366f1', color: 'white' }}
              />
            )}

            {/* Status Badge */}
            <Badge 
              value={card.status}
              severity={getStatusSeverity(card.status)}
              className="text-xs"
            />
          </div>

          {/* Due Date */}
          {card.dueDate && (
            <Badge 
              value={new Date(card.dueDate).toLocaleDateString('pl-PL')}
              severity={isOverdue() ? 'danger' : 'secondary'}
              className="text-xs"
            />
          )}
        </div>

        {/* Progress indicator based on checklist completion */}
        {card.checklist && card.checklist.length > 0 && (
          <div className="mt-2">
            <div className="flex justify-content-between align-items-center mb-1">
              <span className="text-xs text-600">Postęp</span>
              <span className="text-xs text-600">
                {card.checklist.filter(item => item.isCompleted).length}/{card.checklist.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 border-round" style={{ height: '4px' }}>
              <div
                className="bg-primary border-round transition-all transition-duration-300"
                style={{
                  width: `${(card.checklist.filter(item => item.isCompleted).length / card.checklist.length) * 100}%`,
                  height: '100%'
                }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
