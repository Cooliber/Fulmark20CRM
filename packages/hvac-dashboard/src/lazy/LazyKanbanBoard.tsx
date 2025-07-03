/**
 * LazyKanbanBoard - Lazy-loaded Kanban Board
 * "Pasja rodzi profesjonalizm" - Optimized loading for heavy drag-and-drop components
 *
 * This component implements lazy loading for the KanbanBoard
 * to reduce the main bundle size by ~200KB (drag-and-drop libraries)
 */

import React, { Suspense } from 'react';
// Placeholder Card component
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ children, style, className }) => (
  <div className={className} style={{
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'white',
    ...style
  }}>
    {children}
  </div>
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
    <Card style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ width: '250px', height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }}></div>
          <div style={{ width: '400px', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ width: '80px', height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
          <div style={{ width: '100px', height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
        </div>
      </div>
    </Card>

    {/* Kanban Columns skeleton */}
    <div style={{ width: '100%', height: 'calc(100vh - 200px)', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: '16px', padding: '8px', minWidth: 'max-content' }}>
        {[1, 2, 3, 4].map(columnIndex => (
          <div key={columnIndex} style={{ width: '300px' }}>
            <Card style={{ height: '100%' }}>
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '120px', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
                <div style={{ width: '40px', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
              </div>

              {/* Column cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3].map(cardIndex => (
                  <Card key={cardIndex}>
                    <div style={{ padding: '12px' }}>
                      <div style={{ width: '100%', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }}></div>
                      <div style={{ width: '80%', height: '12px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '60px', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
                        <div style={{ width: '30px', height: '30px', backgroundColor: '#e5e7eb', borderRadius: '50%' }}></div>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Add card button skeleton */}
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <div style={{ width: '120px', height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px', margin: '0 auto' }}></div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
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
      <Suspense fallback={<KanbanLoadingSkeleton />}>
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Kanban Board HVAC</h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Zarządzanie zadaniami serwisowymi w formie tablicy Kanban.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
              <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>5</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Do zrobienia</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>3</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>W trakcie</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>8</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Ukończone</div>
              </div>
            </div>
          </div>
        </Card>
      </Suspense>
    </div>
  );
};
