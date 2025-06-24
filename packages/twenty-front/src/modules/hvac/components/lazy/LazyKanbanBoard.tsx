/**
 * LazyKanbanBoard - Lazy-loaded Kanban Board
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy drag-and-drop components
 *
 * This component implements lazy loading for the KanbanBoard
 * to reduce the main bundle size by ~200KB (drag-and-drop libraries)
 */

import { Card } from 'primereact/card';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Skeleton } from 'primereact/skeleton';
import React, { Suspense, lazy } from 'react';
import { HVACErrorBoundary } from '../HVACErrorBoundary';

// Lazy load the heavy kanban board
const KanbanBoard = lazy(() =>
  import('../kanban/KanbanBoard').then(module => ({
    default: module.KanbanBoard
  }))
);

// Component props
interface LazyKanbanBoardProps {
  boardId?: string;
  onCardClick?: (card: any) => void;
  onCardCreate?: (card: any) => void;
  onCardUpdate?: (card: any) => void;
  className?: string;
}

// Loading skeleton component
const KanbanLoadingSkeleton: React.FC = () => (
  <div className="kanban-loading-skeleton">
    {/* Board Header skeleton */}
    <Card className="mb-4">
      <div className="flex justify-content-between align-items-center">
        <div>
          <Skeleton width="250px" height="2rem" className="mb-2" />
          <Skeleton width="400px" height="1rem" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="80px" height="2rem" />
          <Skeleton width="100px" height="2rem" />
        </div>
      </div>
    </Card>

    {/* Kanban Columns skeleton */}
    <ScrollPanel style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
      <div className="flex gap-4 p-2" style={{ minWidth: 'max-content' }}>
        {[1, 2, 3, 4].map(columnIndex => (
          <div key={columnIndex} className="kanban-column-skeleton" style={{ width: '300px' }}>
            <Card className="h-full">
              {/* Column header */}
              <div className="flex justify-content-between align-items-center mb-3">
                <Skeleton width="120px" height="1.5rem" />
                <Skeleton width="40px" height="1.5rem" />
              </div>

              {/* Column cards */}
              <div className="flex flex-column gap-2">
                {[1, 2, 3].map(cardIndex => (
                  <Card key={cardIndex} className="kanban-card-skeleton">
                    <div className="p-3">
                      <Skeleton width="100%" height="1rem" className="mb-2" />
                      <Skeleton width="80%" height="0.8rem" className="mb-2" />
                      <div className="flex justify-content-between align-items-center">
                        <Skeleton width="60px" height="1.2rem" />
                        <Skeleton width="30px" height="30px" className="border-circle" />
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Add card button skeleton */}
                <div className="text-center mt-2">
                  <Skeleton width="120px" height="2rem" />
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </ScrollPanel>
  </div>
);



export const LazyKanbanBoard: React.FC<LazyKanbanBoardProps> = ({
  boardId,
  onCardClick,
  onCardCreate,
  onCardUpdate,
  className = '',
}) => {
  return (
    <div className={`lazy-kanban-board ${className}`}>
      <HVACErrorBoundary
        context="KANBAN_MANAGEMENT"
        customTitle="Błąd ładowania kanban board"
        customMessage="Wystąpił problem podczas ładowania komponentów kanban."
      >
        <Suspense fallback={<KanbanLoadingSkeleton />}>
          <KanbanBoard
            boardId={boardId}
            onCardClick={onCardClick}
            onCardCreate={onCardCreate}
            onCardUpdate={onCardUpdate}
            className={className}
          />
        </Suspense>
      </HVACErrorBoundary>
    </div>
  );
};
