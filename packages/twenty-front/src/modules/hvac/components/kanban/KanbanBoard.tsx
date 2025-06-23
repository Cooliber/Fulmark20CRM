/**
 * KanbanBoard - Kanban Board Component z drag-and-drop
 * "Pasja rodzi profesjonalizm" - Profesjonalny kanban board dla HVAC
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
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Skeleton } from 'primereact/skeleton';
import { Dialog } from 'primereact/dialog';
import { ScrollPanel } from 'primereact/scrollpanel';

// HVAC services and hooks
import { 
  useKanbanFlow,
  KanbanBoard as KanbanBoardType,
  KanbanColumn,
  KanbanCard,
  trackHVACUserAction 
} from '../../index';

// Kanban components will be imported when created
// import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn';
// import { KanbanCard as KanbanCardComponent } from './KanbanCard';
// import { CreateCardDialog } from './CreateCardDialog';

// Component props
interface KanbanBoardProps {
  boardId?: string;
  board?: KanbanBoardType;
  onCardClick?: (card: KanbanCard) => void;
  onCardCreate?: (card: KanbanCard) => void;
  onCardUpdate?: (card: KanbanCard) => void;
  className?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  board: propBoard,
  onCardClick,
  onCardCreate,
  onCardUpdate,
  className = '',
}) => {
  // State for dialogs
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedColumnForCard, setSelectedColumnForCard] = useState<string | null>(null);

  // Kanban flow hook
  const {
    selectedBoard,
    loading,
    error,
    dragState,
    loadBoard,
    createCard,
    updateCard,
    startDrag,
    dragOver,
    endDrag,
    cancelDrag,
    getColumnMetrics,
    clearError,
  } = useKanbanFlow({
    autoLoad: false,
    enableRealTimeUpdates: true,
    onCardMoved: (card, fromColumn, toColumn) => {
      trackHVACUserAction('kanban_card_moved_success', 'KANBAN_INTERACTION', {
        cardId: card.id,
        fromColumn,
        toColumn,
      });
    },
    onCardCreated: (card) => {
      onCardCreate?.(card);
      setShowCreateCard(false);
      setSelectedColumnForCard(null);
    },
    onCardUpdated: (card) => {
      onCardUpdate?.(card);
    },
    onError: (error) => {
      trackHVACUserAction('kanban_error', 'KANBAN_MANAGEMENT', {
        error: error.message,
      });
    },
  });

  // Use prop board or hook board
  const displayBoard = propBoard || selectedBoard;

  // Load board on mount if boardId provided
  React.useEffect(() => {
    if (boardId && !propBoard) {
      loadBoard(boardId);
    }
  }, [boardId, propBoard, loadBoard]);

  // Handle card drag start
  const handleCardDragStart = useCallback((card: KanbanCard, columnId: string) => {
    startDrag(card, columnId);
  }, [startDrag]);

  // Handle column drag over
  const handleColumnDragOver = useCallback((
    e: React.DragEvent,
    columnId: string,
    position: number
  ) => {
    e.preventDefault();
    dragOver(columnId, position);
  }, [dragOver]);

  // Handle card drop
  const handleCardDrop = useCallback(async (
    e: React.DragEvent,
    columnId: string,
    position: number
  ) => {
    e.preventDefault();
    
    if (dragState.isDragging && dragState.draggedCard) {
      await endDrag(columnId, position);
    }
  }, [dragState, endDrag]);

  // Handle create card
  const handleCreateCard = useCallback((columnId: string) => {
    setSelectedColumnForCard(columnId);
    setShowCreateCard(true);
    
    trackHVACUserAction('kanban_create_card_clicked', 'KANBAN_INTERACTION', {
      columnId,
    });
  }, []);

  // Handle card click
  const handleCardClick = useCallback((card: KanbanCard) => {
    onCardClick?.(card);
    
    trackHVACUserAction('kanban_card_clicked', 'KANBAN_INTERACTION', {
      cardId: card.id,
      cardType: card.type,
    });
  }, [onCardClick]);

  // Render loading skeleton
  if (loading && !displayBoard) {
    return (
      <div className={`kanban-board-loading ${className}`}>
        <div className="flex gap-4 p-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1">
              <Skeleton height="3rem" className="mb-3" />
              <div className="flex flex-column gap-2">
                <Skeleton height="8rem" />
                <Skeleton height="6rem" />
                <Skeleton height="7rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={`kanban-board-error ${className}`}>
        <div className="text-center p-6">
          <i className="pi pi-exclamation-triangle text-6xl text-red-500 mb-4" />
          <h3 className="text-900 font-semibold mb-2">Błąd ładowania kanban board</h3>
          <p className="text-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-content-center">
            <Button
              label="Spróbuj ponownie"
              icon="pi pi-refresh"
              onClick={() => {
                clearError();
                if (boardId) loadBoard(boardId);
              }}
            />
            <Button
              label="Zgłoś problem"
              icon="pi pi-exclamation-triangle"
              severity="secondary"
              outlined
              onClick={() => {
                trackHVACUserAction('kanban_error_reported', 'ERROR_REPORTING', {
                  error,
                });
              }}
            />
          </div>
        </div>
      </Card>
    );
  }

  // Render empty state
  if (!displayBoard) {
    return (
      <Card className={`kanban-board-empty ${className}`}>
        <div className="text-center p-6">
          <i className="pi pi-table text-6xl text-400 mb-4" />
          <h3 className="text-900 font-semibold mb-2">Brak kanban board</h3>
          <p className="text-600 mb-4">
            Wybierz board z listy lub utwórz nowy.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`kanban-board ${className}`}>
      {/* Board Header */}
      <Card className="kanban-board-header mb-4">
        <div className="flex justify-content-between align-items-center">
          <div>
            <h2 className="text-2xl font-bold text-900 mb-1">{displayBoard.name}</h2>
            <p className="text-600">{displayBoard.description}</p>
          </div>
          <div className="flex align-items-center gap-3">
            <Badge 
              value={`${displayBoard.columns.reduce((sum, col) => sum + col.cards.length, 0)} kart`}
              severity="info"
            />
            <Badge 
              value={displayBoard.type}
              severity="secondary"
            />
            {loading && (
              <i className="pi pi-spin pi-spinner text-primary" />
            )}
          </div>
        </div>
      </Card>

      {/* Kanban Columns */}
      <ScrollPanel style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
        <div className="kanban-columns flex gap-4 p-2" style={{ minWidth: 'max-content' }}>
          {displayBoard.columns
            .sort((a, b) => a.position - b.position)
            .map(column => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                cards={column.cards}
                metrics={getColumnMetrics(column.id)}
                isDragOver={dragState.dragOverColumn === column.id}
                onCardDragStart={handleCardDragStart}
                onCardClick={handleCardClick}
                onCreateCard={() => handleCreateCard(column.id)}
                onDragOver={(e, position) => handleColumnDragOver(e, column.id, position)}
                onDrop={(e, position) => handleCardDrop(e, column.id, position)}
                className="kanban-column"
              />
            ))}
        </div>
      </ScrollPanel>

      {/* Create Card Dialog */}
      <CreateCardDialog
        visible={showCreateCard}
        columnId={selectedColumnForCard}
        onHide={() => {
          setShowCreateCard(false);
          setSelectedColumnForCard(null);
        }}
        onCreateCard={async (cardData) => {
          if (selectedColumnForCard) {
            await createCard(selectedColumnForCard, cardData);
          }
        }}
      />
    </div>
  );
};
