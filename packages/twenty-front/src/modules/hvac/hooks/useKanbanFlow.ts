/**
 * useKanbanFlow Hook - Zarządzanie kanban flow HVAC
 * "Pasja rodzi profesjonalizm" - Profesjonalny hook do kanban management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - Event handlers over useEffect
 * - Proper TypeScript typing
 * - Performance optimization with drag-and-drop
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  kanbanFlowService,
  KanbanBoard,
  KanbanColumn,
  KanbanCard,
  KanbanAnalytics,
  BoardType,
  CardType,
  Priority,
  CardStatus,
} from '../services/KanbanFlowService';
import { trackHVACUserAction } from '../index';

// Hook state interface
interface UseKanbanFlowState {
  boards: KanbanBoard[];
  selectedBoard: KanbanBoard | null;
  selectedCard: KanbanCard | null;
  analytics: KanbanAnalytics | null;
  loading: boolean;
  error: string | null;
  dragState: DragState;
}

// Drag state interface
interface DragState {
  isDragging: boolean;
  draggedCard: KanbanCard | null;
  draggedFromColumn: string | null;
  dragOverColumn: string | null;
  dragPosition: number | null;
}

// Hook options
interface UseKanbanFlowOptions {
  autoLoad?: boolean;
  enableRealTimeUpdates?: boolean;
  refreshInterval?: number; // in milliseconds
  onCardMoved?: (card: KanbanCard, fromColumn: string, toColumn: string) => void;
  onCardCreated?: (card: KanbanCard) => void;
  onCardUpdated?: (card: KanbanCard) => void;
  onBoardChanged?: (board: KanbanBoard) => void;
  onError?: (error: Error) => void;
}

// Hook return type
interface UseKanbanFlowReturn {
  // State
  boards: KanbanBoard[];
  selectedBoard: KanbanBoard | null;
  selectedCard: KanbanCard | null;
  analytics: KanbanAnalytics | null;
  loading: boolean;
  error: string | null;
  dragState: DragState;

  // Board operations
  loadBoards: (filters?: { type?: BoardType; createdBy?: string; search?: string }) => Promise<void>;
  loadBoard: (boardId: string) => Promise<void>;
  createBoard: (boardData: Omit<KanbanBoard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<KanbanBoard>;
  selectBoard: (board: KanbanBoard | null) => void;

  // Card operations
  createCard: (columnId: string, cardData: Omit<KanbanCard, 'id' | 'columnId' | 'position' | 'createdAt' | 'updatedAt'>) => Promise<KanbanCard>;
  updateCard: (cardId: string, updates: Partial<KanbanCard>) => Promise<KanbanCard>;
  selectCard: (card: KanbanCard | null) => void;
  addComment: (cardId: string, content: string, mentions?: string[]) => Promise<void>;

  // Drag and drop operations
  startDrag: (card: KanbanCard, fromColumn: string) => void;
  dragOver: (columnId: string, position: number) => void;
  endDrag: (toColumnId: string, position: number, reason?: string) => Promise<void>;
  cancelDrag: () => void;

  // Analytics operations
  loadAnalytics: (boardId: string, dateRange?: { from: Date; to: Date }) => Promise<void>;
  getColumnMetrics: (columnId: string) => ColumnMetrics;
  getCardsByStatus: (status: CardStatus) => KanbanCard[];
  getCardsByPriority: (priority: Priority) => KanbanCard[];

  // Utility functions
  getCardsByColumn: (columnId: string) => KanbanCard[];
  getOverdueCards: () => KanbanCard[];
  getCardsAssignedTo: (userId: string) => KanbanCard[];
  refreshBoard: () => Promise<void>;
  clearError: () => void;
}

// Column metrics interface
interface ColumnMetrics {
  cardCount: number;
  completedCards: number;
  overdueCards: number;
  averageTimeInColumn: number;
  wipUtilization: number;
}

/**
 * Kanban flow hook with comprehensive board and card management
 * Implements HVAC CRM kanban workflow with drag-and-drop
 */
export const useKanbanFlow = (
  options: UseKanbanFlowOptions = {}
): UseKanbanFlowReturn => {
  const {
    autoLoad = true,
    enableRealTimeUpdates = false,
    refreshInterval = 30000, // 30 seconds
    onCardMoved,
    onCardCreated,
    onCardUpdated,
    onBoardChanged,
    onError,
  } = options;

  // State management
  const [state, setState] = useState<UseKanbanFlowState>({
    boards: [],
    selectedBoard: null,
    selectedCard: null,
    analytics: null,
    loading: false,
    error: null,
    dragState: {
      isDragging: false,
      draggedCard: null,
      draggedFromColumn: null,
      dragOverColumn: null,
      dragPosition: null,
    },
  });

  const abortControllerRef = useRef<AbortController>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Load boards
  const loadBoards = useCallback(async (filters?: {
    type?: BoardType;
    createdBy?: string;
    search?: string;
  }) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      trackHVACUserAction('kanban_boards_load_started', 'KANBAN_MANAGEMENT', {
        filters,
      });

      const boards = await kanbanFlowService.getBoards(filters);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        boards,
        loading: false,
      }));

      trackHVACUserAction('kanban_boards_load_success', 'KANBAN_MANAGEMENT', {
        count: boards.length,
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));

      trackHVACUserAction('kanban_boards_load_error', 'KANBAN_MANAGEMENT', {
        error: errorMessage,
      });
    }
  }, [onError]);

  // Load specific board
  const loadBoard = useCallback(async (boardId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const board = await kanbanFlowService.getBoardById(boardId);

      setState(prev => ({
        ...prev,
        selectedBoard: board,
        loading: false,
      }));

      onBoardChanged?.(board);

      trackHVACUserAction('kanban_board_loaded', 'KANBAN_MANAGEMENT', {
        boardId,
        columnsCount: board.columns.length,
        totalCards: board.columns.reduce((sum, col) => sum + col.cards.length, 0),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [onBoardChanged, onError]);

  // Create board
  const createBoard = useCallback(async (
    boardData: Omit<KanbanBoard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<KanbanBoard> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newBoard = await kanbanFlowService.createBoard(boardData);

      // Refresh boards
      await loadBoards();

      return newBoard;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [loadBoards, onError]);

  // Select board
  const selectBoard = useCallback((board: KanbanBoard | null) => {
    setState(prev => ({ ...prev, selectedBoard: board }));
    
    if (board) {
      trackHVACUserAction('kanban_board_selected', 'KANBAN_MANAGEMENT', {
        boardId: board.id,
        boardType: board.type,
      });
    }
  }, []);

  // Create card
  const createCard = useCallback(async (
    columnId: string,
    cardData: Omit<KanbanCard, 'id' | 'columnId' | 'position' | 'createdAt' | 'updatedAt'>
  ): Promise<KanbanCard> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newCard = await kanbanFlowService.createCard(columnId, cardData);

      // Refresh current board
      if (state.selectedBoard) {
        await loadBoard(state.selectedBoard.id);
      }

      onCardCreated?.(newCard);

      return newCard;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [state.selectedBoard, loadBoard, onCardCreated, onError]);

  // Update card
  const updateCard = useCallback(async (
    cardId: string,
    updates: Partial<KanbanCard>
  ): Promise<KanbanCard> => {
    try {
      const updatedCard = await kanbanFlowService.updateCard(cardId, updates);

      // Update card in state
      setState(prev => {
        if (!prev.selectedBoard) return prev;

        const updatedBoard = {
          ...prev.selectedBoard,
          columns: prev.selectedBoard.columns.map(column => ({
            ...column,
            cards: column.cards.map(card => 
              card.id === cardId ? updatedCard : card
            ),
          })),
        };

        return {
          ...prev,
          selectedBoard: updatedBoard,
          selectedCard: prev.selectedCard?.id === cardId ? updatedCard : prev.selectedCard,
        };
      });

      onCardUpdated?.(updatedCard);

      return updatedCard;

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to update card'));
      throw error;
    }
  }, [onCardUpdated, onError]);

  // Select card
  const selectCard = useCallback((card: KanbanCard | null) => {
    setState(prev => ({ ...prev, selectedCard: card }));
    
    if (card) {
      trackHVACUserAction('kanban_card_selected', 'KANBAN_MANAGEMENT', {
        cardId: card.id,
        cardType: card.type,
        priority: card.priority,
      });
    }
  }, []);

  // Add comment to card
  const addComment = useCallback(async (
    cardId: string,
    content: string,
    mentions: string[] = []
  ) => {
    try {
      await kanbanFlowService.addComment(cardId, content, mentions);

      // Refresh current board to get updated card
      if (state.selectedBoard) {
        await loadBoard(state.selectedBoard.id);
      }

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to add comment'));
    }
  }, [state.selectedBoard, loadBoard, onError]);

  // Start drag operation
  const startDrag = useCallback((card: KanbanCard, fromColumn: string) => {
    setState(prev => ({
      ...prev,
      dragState: {
        isDragging: true,
        draggedCard: card,
        draggedFromColumn: fromColumn,
        dragOverColumn: null,
        dragPosition: null,
      },
    }));

    trackHVACUserAction('kanban_drag_started', 'KANBAN_INTERACTION', {
      cardId: card.id,
      fromColumn,
    });
  }, []);

  // Handle drag over
  const dragOver = useCallback((columnId: string, position: number) => {
    setState(prev => ({
      ...prev,
      dragState: {
        ...prev.dragState,
        dragOverColumn: columnId,
        dragPosition: position,
      },
    }));
  }, []);

  // End drag operation
  const endDrag = useCallback(async (
    toColumnId: string,
    position: number,
    reason?: string
  ) => {
    const { draggedCard, draggedFromColumn } = state.dragState;

    if (!draggedCard || !draggedFromColumn) {
      cancelDrag();
      return;
    }

    try {
      // Only move if actually changing position
      if (draggedFromColumn !== toColumnId || draggedCard.position !== position) {
        const movedCard = await kanbanFlowService.moveCard(
          draggedCard.id,
          draggedFromColumn,
          toColumnId,
          position,
          reason
        );

        // Refresh current board
        if (state.selectedBoard) {
          await loadBoard(state.selectedBoard.id);
        }

        onCardMoved?.(movedCard, draggedFromColumn, toColumnId);
      }

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to move card'));
    } finally {
      cancelDrag();
    }
  }, [state.dragState, state.selectedBoard, loadBoard, onCardMoved, onError]);

  // Cancel drag operation
  const cancelDrag = useCallback(() => {
    setState(prev => ({
      ...prev,
      dragState: {
        isDragging: false,
        draggedCard: null,
        draggedFromColumn: null,
        dragOverColumn: null,
        dragPosition: null,
      },
    }));
  }, []);

  // Load analytics
  const loadAnalytics = useCallback(async (
    boardId: string,
    dateRange?: { from: Date; to: Date }
  ) => {
    try {
      const analytics = await kanbanFlowService.getBoardAnalytics(boardId, dateRange);
      setState(prev => ({ ...prev, analytics }));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load analytics'));
    }
  }, [onError]);

  // Get column metrics
  const getColumnMetrics = useCallback((columnId: string): ColumnMetrics => {
    if (!state.selectedBoard || !state.analytics) {
      return {
        cardCount: 0,
        completedCards: 0,
        overdueCards: 0,
        averageTimeInColumn: 0,
        wipUtilization: 0,
      };
    }

    const column = state.selectedBoard.columns.find(col => col.id === columnId);
    if (!column) {
      return {
        cardCount: 0,
        completedCards: 0,
        overdueCards: 0,
        averageTimeInColumn: 0,
        wipUtilization: 0,
      };
    }

    const now = new Date();
    const overdueCards = column.cards.filter(card => 
      card.dueDate && new Date(card.dueDate) < now
    ).length;

    const completedCards = column.cards.filter(card => 
      card.status === 'completed'
    ).length;

    const columnAnalytics = state.analytics.columnMetrics.find(
      metric => metric.columnId === columnId
    );

    return {
      cardCount: column.cards.length,
      completedCards,
      overdueCards,
      averageTimeInColumn: columnAnalytics?.averageTimeInColumn || 0,
      wipUtilization: columnAnalytics?.wipUtilization || 0,
    };
  }, [state.selectedBoard, state.analytics]);

  // Get cards by status
  const getCardsByStatus = useCallback((status: CardStatus): KanbanCard[] => {
    if (!state.selectedBoard) return [];

    return state.selectedBoard.columns
      .flatMap(column => column.cards)
      .filter(card => card.status === status);
  }, [state.selectedBoard]);

  // Get cards by priority
  const getCardsByPriority = useCallback((priority: Priority): KanbanCard[] => {
    if (!state.selectedBoard) return [];

    return state.selectedBoard.columns
      .flatMap(column => column.cards)
      .filter(card => card.priority === priority);
  }, [state.selectedBoard]);

  // Get cards by column
  const getCardsByColumn = useCallback((columnId: string): KanbanCard[] => {
    if (!state.selectedBoard) return [];

    const column = state.selectedBoard.columns.find(col => col.id === columnId);
    return column ? column.cards : [];
  }, [state.selectedBoard]);

  // Get overdue cards
  const getOverdueCards = useCallback((): KanbanCard[] => {
    if (!state.selectedBoard) return [];

    const now = new Date();
    return state.selectedBoard.columns
      .flatMap(column => column.cards)
      .filter(card => card.dueDate && new Date(card.dueDate) < now);
  }, [state.selectedBoard]);

  // Get cards assigned to user
  const getCardsAssignedTo = useCallback((userId: string): KanbanCard[] => {
    if (!state.selectedBoard) return [];

    return state.selectedBoard.columns
      .flatMap(column => column.cards)
      .filter(card => card.assignedTo.includes(userId));
  }, [state.selectedBoard]);

  // Refresh current board
  const refreshBoard = useCallback(async () => {
    if (state.selectedBoard) {
      await loadBoard(state.selectedBoard.id);
    }
  }, [state.selectedBoard, loadBoard]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-load boards on mount
  useEffect(() => {
    if (autoLoad) {
      loadBoards();
    }
  }, [autoLoad, loadBoards]);

  // Real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates && state.selectedBoard) {
      refreshIntervalRef.current = setInterval(() => {
        refreshBoard();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableRealTimeUpdates, refreshInterval, refreshBoard, state.selectedBoard]);

  return {
    // State
    boards: state.boards,
    selectedBoard: state.selectedBoard,
    selectedCard: state.selectedCard,
    analytics: state.analytics,
    loading: state.loading,
    error: state.error,
    dragState: state.dragState,

    // Board operations
    loadBoards,
    loadBoard,
    createBoard,
    selectBoard,

    // Card operations
    createCard,
    updateCard,
    selectCard,
    addComment,

    // Drag and drop operations
    startDrag,
    dragOver,
    endDrag,
    cancelDrag,

    // Analytics operations
    loadAnalytics,
    getColumnMetrics,
    getCardsByStatus,
    getCardsByPriority,

    // Utility functions
    getCardsByColumn,
    getOverdueCards,
    getCardsAssignedTo,
    refreshBoard,
    clearError,
  };
};
