/**
 * Kanban Flow Service - System zarządzania projektami HVAC w formie kanban
 * "Pasja rodzi profesjonalizm" - Profesjonalny system kanban flow management
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript with no 'any' types
 * - Proper error handling
 * - Performance monitoring integration
 * - Drag-and-drop functionality
 */

import { trackHVACUserAction } from '../index';

// Kanban Flow Types
export interface KanbanBoard {
  id: string;
  name: string;
  description: string;
  type: BoardType;
  columns: KanbanColumn[];
  settings: BoardSettings;
  permissions: BoardPermissions;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  boardId: string;
  name: string;
  description?: string;
  position: number;
  color: string;
  wipLimit?: number; // Work In Progress limit
  isCollapsed: boolean;
  cards: KanbanCard[];
  rules: ColumnRule[];
  metadata: ColumnMetadata;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description: string;
  type: CardType;
  priority: Priority;
  status: CardStatus;
  assignedTo: string[];
  tags: string[];
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  position: number;
  customFields: Record<string, unknown>;
  attachments: CardAttachment[];
  comments: CardComment[];
  checklist: ChecklistItem[];
  relatedCards: string[];
  metadata: CardMetadata;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColumnRule {
  id: string;
  type: 'auto_move' | 'notification' | 'validation' | 'assignment';
  condition: RuleCondition;
  action: RuleAction;
  isActive: boolean;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'date_passed';
  value: unknown;
}

export interface RuleAction {
  type: 'move_to_column' | 'assign_user' | 'send_notification' | 'update_field';
  parameters: Record<string, unknown>;
}

export interface CardAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface CardComment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  mentions: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  assignedTo?: string;
  dueDate?: Date;
  position: number;
}

export interface ColumnMetadata {
  totalCards: number;
  totalHours: number;
  averageTimeInColumn: number; // hours
  completionRate: number; // percentage
  lastActivity: Date;
}

export interface CardMetadata {
  timeInCurrentColumn: number; // hours
  totalTimeInBoard: number; // hours
  moveHistory: CardMove[];
  activityLog: CardActivity[];
  customerId?: string;
  quoteId?: string;
  projectId?: string;
}

export interface CardMove {
  fromColumnId: string;
  toColumnId: string;
  movedBy: string;
  movedAt: Date;
  reason?: string;
}

export interface CardActivity {
  id: string;
  type: 'created' | 'updated' | 'moved' | 'assigned' | 'commented' | 'completed';
  description: string;
  performedBy: string;
  performedAt: Date;
  details: Record<string, unknown>;
}

export interface BoardSettings {
  allowCardCreation: boolean;
  allowColumnCreation: boolean;
  enableWipLimits: boolean;
  enableTimeTracking: boolean;
  enableAutomation: boolean;
  defaultCardType: CardType;
  defaultPriority: Priority;
  archiveCompletedCards: boolean;
  archiveAfterDays?: number;
}

export interface BoardPermissions {
  viewers: string[];
  editors: string[];
  admins: string[];
  publicView: boolean;
}

export type BoardType = 
  | 'project_management' 
  | 'sales_pipeline' 
  | 'service_requests' 
  | 'maintenance_schedule' 
  | 'installation_tracking' 
  | 'custom';

export type CardType = 
  | 'task' 
  | 'bug' 
  | 'feature' 
  | 'installation' 
  | 'maintenance' 
  | 'quote' 
  | 'service_call' 
  | 'inspection';

export type CardStatus = 
  | 'active' 
  | 'blocked' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled' 
  | 'archived';

export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

// Kanban Analytics
export interface KanbanAnalytics {
  boardId: string;
  totalCards: number;
  completedCards: number;
  completionRate: number;
  averageCycleTime: number; // hours
  averageLeadTime: number; // hours
  throughput: number; // cards per week
  columnMetrics: ColumnAnalytics[];
  burndownData: BurndownPoint[];
  cumulativeFlowData: CumulativeFlowPoint[];
  bottlenecks: Bottleneck[];
}

export interface ColumnAnalytics {
  columnId: string;
  columnName: string;
  cardCount: number;
  averageTimeInColumn: number;
  wipUtilization: number; // percentage
  throughput: number;
}

export interface BurndownPoint {
  date: Date;
  remainingWork: number;
  completedWork: number;
  idealLine: number;
}

export interface CumulativeFlowPoint {
  date: Date;
  columnData: Record<string, number>; // columnId -> card count
}

export interface Bottleneck {
  columnId: string;
  columnName: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

/**
 * Kanban Flow Service Class
 * Zarządza kanban boards, kolumnami i kartami z drag-and-drop
 */
export class KanbanFlowService {
  private baseURL: string;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes for real-time updates

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_HVAC_API_URL || 'http://localhost:8000';
    this.cache = new Map();
  }

  /**
   * Make API call with error handling and performance tracking
   */
  private async makeAPICall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HVAC_API_KEY || ''}`,
          ...options.headers,
        },
        ...options,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      trackHVACUserAction('kanban_api_success', 'API_SUCCESS', {
        endpoint,
        duration,
        status: response.status,
      });

      return { data, status: response.status };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackHVACUserAction('kanban_api_error', 'API_ERROR', {
        endpoint,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get kanban boards
   */
  async getBoards(filters?: {
    type?: BoardType;
    createdBy?: string;
    search?: string;
  }): Promise<KanbanBoard[]> {
    const cacheKey = `boards_${JSON.stringify(filters)}`;
    const cached = this.getCachedData<KanbanBoard[]>(cacheKey);
    
    if (cached) {
      trackHVACUserAction('kanban_cache_hit', 'API_CACHE', { filters });
      return cached;
    }

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.makeAPICall<KanbanBoard[]>(
      `/api/v1/kanban/boards?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Get board by ID with full data
   */
  async getBoardById(boardId: string): Promise<KanbanBoard> {
    const cacheKey = `board_${boardId}`;
    const cached = this.getCachedData<KanbanBoard>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await this.makeAPICall<KanbanBoard>(`/api/v1/kanban/boards/${boardId}`);
    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Create new board
   */
  async createBoard(boardData: Omit<KanbanBoard, 'id' | 'createdAt' | 'updatedAt'>): Promise<KanbanBoard> {
    const response = await this.makeAPICall<KanbanBoard>('/api/v1/kanban/boards', {
      method: 'POST',
      body: JSON.stringify(boardData),
    });

    // Invalidate boards cache
    this.invalidateCache('boards_');

    trackHVACUserAction('kanban_board_created', 'KANBAN_MANAGEMENT', {
      boardId: response.data.id,
      boardType: response.data.type,
      columnsCount: response.data.columns.length,
    });

    return response.data;
  }

  /**
   * Move card between columns (drag-and-drop)
   */
  async moveCard(
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    newPosition: number,
    reason?: string
  ): Promise<KanbanCard> {
    const moveData = {
      fromColumnId,
      toColumnId,
      newPosition,
      reason,
      movedAt: new Date(),
    };

    const response = await this.makeAPICall<KanbanCard>(`/api/v1/kanban/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify(moveData),
    });

    // Invalidate relevant caches
    this.invalidateCache(`board_`);
    this.invalidateCache(`card_${cardId}`);

    trackHVACUserAction('kanban_card_moved', 'KANBAN_MANAGEMENT', {
      cardId,
      fromColumnId,
      toColumnId,
      newPosition,
      reason,
    });

    return response.data;
  }

  /**
   * Create new card
   */
  async createCard(
    columnId: string,
    cardData: Omit<KanbanCard, 'id' | 'columnId' | 'position' | 'createdAt' | 'updatedAt'>
  ): Promise<KanbanCard> {
    const response = await this.makeAPICall<KanbanCard>('/api/v1/kanban/cards', {
      method: 'POST',
      body: JSON.stringify({
        ...cardData,
        columnId,
      }),
    });

    // Invalidate relevant caches
    this.invalidateCache(`board_`);

    trackHVACUserAction('kanban_card_created', 'KANBAN_MANAGEMENT', {
      cardId: response.data.id,
      columnId,
      cardType: response.data.type,
      priority: response.data.priority,
    });

    return response.data;
  }

  /**
   * Update card
   */
  async updateCard(cardId: string, updates: Partial<KanbanCard>): Promise<KanbanCard> {
    const response = await this.makeAPICall<KanbanCard>(`/api/v1/kanban/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    // Invalidate relevant caches
    this.invalidateCache(`board_`);
    this.invalidateCache(`card_${cardId}`);

    trackHVACUserAction('kanban_card_updated', 'KANBAN_MANAGEMENT', {
      cardId,
      changes: Object.keys(updates),
    });

    return response.data;
  }

  /**
   * Add comment to card
   */
  async addComment(cardId: string, content: string, mentions: string[] = []): Promise<CardComment> {
    const commentData = {
      content,
      mentions,
      createdAt: new Date(),
    };

    const response = await this.makeAPICall<CardComment>(`/api/v1/kanban/cards/${cardId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });

    // Invalidate card cache
    this.invalidateCache(`card_${cardId}`);

    trackHVACUserAction('kanban_comment_added', 'KANBAN_MANAGEMENT', {
      cardId,
      mentionsCount: mentions.length,
    });

    return response.data;
  }

  /**
   * Get board analytics
   */
  async getBoardAnalytics(boardId: string, dateRange?: {
    from: Date;
    to: Date;
  }): Promise<KanbanAnalytics> {
    const cacheKey = `analytics_${boardId}_${JSON.stringify(dateRange)}`;
    const cached = this.getCachedData<KanbanAnalytics>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const queryParams = new URLSearchParams();
    if (dateRange) {
      queryParams.append('from', dateRange.from.toISOString());
      queryParams.append('to', dateRange.to.toISOString());
    }

    const response = await this.makeAPICall<KanbanAnalytics>(
      `/api/v1/kanban/boards/${boardId}/analytics?${queryParams.toString()}`
    );

    this.setCachedData(cacheKey, response.data);
    return response.data;
  }

  /**
   * Execute column rule
   */
  async executeRule(ruleId: string, cardId: string): Promise<void> {
    await this.makeAPICall(`/api/v1/kanban/rules/${ruleId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ cardId }),
    });

    trackHVACUserAction('kanban_rule_executed', 'KANBAN_AUTOMATION', {
      ruleId,
      cardId,
    });
  }

  /**
   * Bulk move cards
   */
  async bulkMoveCards(moves: Array<{
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    newPosition: number;
  }>): Promise<void> {
    await this.makeAPICall('/api/v1/kanban/cards/bulk-move', {
      method: 'POST',
      body: JSON.stringify({ moves }),
    });

    // Invalidate board caches
    this.invalidateCache(`board_`);

    trackHVACUserAction('kanban_bulk_move', 'KANBAN_MANAGEMENT', {
      movesCount: moves.length,
    });
  }

  /**
   * Cache management
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const kanbanFlowService = new KanbanFlowService();
