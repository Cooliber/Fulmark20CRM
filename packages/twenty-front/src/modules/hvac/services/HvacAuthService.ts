/**
 * Enhanced HVAC Authentication Service
 * "Pasja rodzi profesjonalizm" - Professional Authentication Integration
 * 
 * Integrates HVAC authentication with TwentyCRM core authentication system
 * Following Twenty CRM patterns and security best practices
 */

import { trackHVACUserAction, reportHVACError } from '../index';

// Authentication types
export interface HvacAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: 'Bearer';
  scope: string[];
}

export interface HvacUser {
  id: string;
  email: string;
  name: string;
  role: HvacUserRole;
  permissions: HvacPermission[];
  workspaceId: string;
  hvacProfile?: HvacUserProfile;
}

export interface HvacUserProfile {
  specializations: string[];
  certifications: string[];
  region: string;
  phoneNumber?: string;
  emergencyContact?: string;
  preferredLanguage: 'pl' | 'en';
}

export enum HvacUserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TECHNICIAN = 'TECHNICIAN',
  DISPATCHER = 'DISPATCHER',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  VIEWER = 'VIEWER'
}

export enum HvacPermission {
  // Customer permissions
  READ_CUSTOMERS = 'READ_CUSTOMERS',
  WRITE_CUSTOMERS = 'WRITE_CUSTOMERS',
  DELETE_CUSTOMERS = 'DELETE_CUSTOMERS',
  
  // Service ticket permissions
  READ_SERVICE_TICKETS = 'READ_SERVICE_TICKETS',
  WRITE_SERVICE_TICKETS = 'WRITE_SERVICE_TICKETS',
  ASSIGN_SERVICE_TICKETS = 'ASSIGN_SERVICE_TICKETS',
  COMPLETE_SERVICE_TICKETS = 'COMPLETE_SERVICE_TICKETS',
  
  // Equipment permissions
  READ_EQUIPMENT = 'READ_EQUIPMENT',
  WRITE_EQUIPMENT = 'WRITE_EQUIPMENT',
  SCHEDULE_MAINTENANCE = 'SCHEDULE_MAINTENANCE',
  
  // Technician permissions
  READ_TECHNICIANS = 'READ_TECHNICIANS',
  WRITE_TECHNICIANS = 'WRITE_TECHNICIANS',
  ASSIGN_TECHNICIANS = 'ASSIGN_TECHNICIANS',
  
  // Analytics permissions
  READ_ANALYTICS = 'READ_ANALYTICS',
  READ_REPORTS = 'READ_REPORTS',
  EXPORT_DATA = 'EXPORT_DATA',
  
  // System permissions
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  MANAGE_USERS = 'MANAGE_USERS',
  SEMANTIC_SEARCH = 'SEMANTIC_SEARCH',
  
  // Polish compliance permissions
  ACCESS_NIP_VALIDATION = 'ACCESS_NIP_VALIDATION',
  ACCESS_REGON_VALIDATION = 'ACCESS_REGON_VALIDATION',
  GENERATE_INVOICES = 'GENERATE_INVOICES'
}

export interface HvacAuthConfig {
  twentyServerUrl: string;
  hvacServerUrl: string;
  tokenStorageKey: string;
  refreshTokenStorageKey: string;
  autoRefreshEnabled: boolean;
  refreshThresholdMinutes: number;
}

// Default configuration
const DEFAULT_CONFIG: HvacAuthConfig = {
  twentyServerUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001',
  hvacServerUrl: process.env.NEXT_PUBLIC_HVAC_SERVER_URL || 'http://localhost:3002',
  tokenStorageKey: 'hvac_auth_token',
  refreshTokenStorageKey: 'hvac_refresh_token',
  autoRefreshEnabled: true,
  refreshThresholdMinutes: 5,
};

/**
 * Enhanced HVAC Authentication Service
 */
export class HvacAuthService {
  private config: HvacAuthConfig;
  private currentUser: HvacUser | null = null;
  private currentToken: HvacAuthToken | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<HvacAuthConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeAuth();
  }

  /**
   * Initialize authentication from stored tokens
   */
  private async initializeAuth(): Promise<void> {
    try {
      const storedToken = this.getStoredToken();
      if (storedToken && this.isTokenValid(storedToken)) {
        this.currentToken = storedToken;
        await this.loadCurrentUser();
        this.setupAutoRefresh();
      } else {
        this.clearStoredTokens();
      }
    } catch (error) {
      reportHVACError(error as Error, 'AUTHENTICATION', {
        operation: 'initialize_auth',
      });
      this.clearStoredTokens();
    }
  }

  /**
   * Authenticate with TwentyCRM and get HVAC-specific token
   */
  async authenticate(twentyToken: string): Promise<HvacAuthToken> {
    try {
      const response = await fetch(`${this.config.hvacServerUrl}/api/hvac/auth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${twentyToken}`,
        },
        body: JSON.stringify({
          scope: ['hvac:read', 'hvac:write', 'hvac:admin'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json();
      const hvacToken: HvacAuthToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        tokenType: 'Bearer',
        scope: tokenData.scope || [],
      };

      this.currentToken = hvacToken;
      this.storeToken(hvacToken);
      await this.loadCurrentUser();
      this.setupAutoRefresh();

      trackHVACUserAction('user_authenticated', 'AUTHENTICATION', {
        userId: this.currentUser?.id,
        role: this.currentUser?.role,
        scope: hvacToken.scope,
      });

      return hvacToken;
    } catch (error) {
      reportHVACError(error as Error, 'AUTHENTICATION', {
        operation: 'authenticate',
      });
      throw error;
    }
  }

  /**
   * Refresh the current token
   */
  async refreshToken(): Promise<HvacAuthToken> {
    if (!this.currentToken?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.config.hvacServerUrl}/api/hvac/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.currentToken.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json();
      const newToken: HvacAuthToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || this.currentToken.refreshToken,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        tokenType: 'Bearer',
        scope: tokenData.scope || this.currentToken.scope,
      };

      this.currentToken = newToken;
      this.storeToken(newToken);
      this.setupAutoRefresh();

      trackHVACUserAction('token_refreshed', 'AUTHENTICATION', {
        userId: this.currentUser?.id,
      });

      return newToken;
    } catch (error) {
      reportHVACError(error as Error, 'AUTHENTICATION', {
        operation: 'refresh_token',
      });
      this.logout();
      throw error;
    }
  }

  /**
   * Load current user information
   */
  private async loadCurrentUser(): Promise<void> {
    if (!this.currentToken) {
      throw new Error('No authentication token available');
    }

    try {
      const response = await fetch(`${this.config.hvacServerUrl}/api/hvac/auth/me`, {
        headers: {
          'Authorization': `${this.currentToken.tokenType} ${this.currentToken.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load user: ${response.status} ${response.statusText}`);
      }

      this.currentUser = await response.json();
    } catch (error) {
      reportHVACError(error as Error, 'AUTHENTICATION', {
        operation: 'load_current_user',
      });
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: HvacPermission): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: HvacPermission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: HvacPermission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Get current authentication token
   */
  getToken(): HvacAuthToken | null {
    return this.currentToken;
  }

  /**
   * Get current user
   */
  getCurrentUser(): HvacUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentToken !== null && this.isTokenValid(this.currentToken);
  }

  /**
   * Logout and clear all authentication data
   */
  logout(): void {
    this.currentUser = null;
    this.currentToken = null;
    this.clearStoredTokens();
    this.clearAutoRefresh();

    trackHVACUserAction('user_logged_out', 'AUTHENTICATION', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if token is valid
   */
  private isTokenValid(token: HvacAuthToken): boolean {
    return token.expiresAt > new Date();
  }

  /**
   * Store token in localStorage
   */
  private storeToken(token: HvacAuthToken): void {
    try {
      localStorage.setItem(this.config.tokenStorageKey, JSON.stringify({
        accessToken: token.accessToken,
        expiresAt: token.expiresAt.toISOString(),
        tokenType: token.tokenType,
        scope: token.scope,
      }));
      localStorage.setItem(this.config.refreshTokenStorageKey, token.refreshToken);
    } catch (error) {
      console.warn('Failed to store authentication token:', error);
    }
  }

  /**
   * Get stored token from localStorage
   */
  private getStoredToken(): HvacAuthToken | null {
    try {
      const tokenData = localStorage.getItem(this.config.tokenStorageKey);
      const refreshToken = localStorage.getItem(this.config.refreshTokenStorageKey);

      if (!tokenData || !refreshToken) {
        return null;
      }

      const parsed = JSON.parse(tokenData);
      return {
        accessToken: parsed.accessToken,
        refreshToken,
        expiresAt: new Date(parsed.expiresAt),
        tokenType: parsed.tokenType,
        scope: parsed.scope || [],
      };
    } catch (error) {
      console.warn('Failed to retrieve stored token:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens
   */
  private clearStoredTokens(): void {
    try {
      localStorage.removeItem(this.config.tokenStorageKey);
      localStorage.removeItem(this.config.refreshTokenStorageKey);
    } catch (error) {
      console.warn('Failed to clear stored tokens:', error);
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    if (!this.config.autoRefreshEnabled || !this.currentToken) {
      return;
    }

    this.clearAutoRefresh();

    const refreshTime = this.currentToken.expiresAt.getTime() - 
      (this.config.refreshThresholdMinutes * 60 * 1000) - 
      Date.now();

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(error => {
          console.error('Auto refresh failed:', error);
        });
      }, refreshTime);
    }
  }

  /**
   * Clear automatic refresh timer
   */
  private clearAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Export singleton instance
export const hvacAuthService = new HvacAuthService();
