/**
 * HVAC Authentication Hooks
 * "Pasja rodzi profesjonalizm" - Professional authentication for HVAC systems
 * 
 * Following Twenty CRM cursor rules:
 * - Named exports only
 * - TypeScript without 'any' types
 * - Max 150 lines per component
 * - Integration with Twenty's auth patterns
 */

import { useCallback, useMemo } from 'react';
import { useRecoilValue } from 'recoil';

// HVAC-specific roles and permissions
export type HvacRole = 
  | 'hvac_admin' 
  | 'hvac_manager' 
  | 'hvac_technician' 
  | 'hvac_dispatcher' 
  | 'hvac_viewer';

export type HvacPermission = 
  | 'hvac:read' 
  | 'hvac:write' 
  | 'hvac:delete' 
  | 'hvac:admin'
  | 'hvac:customers:read'
  | 'hvac:customers:write'
  | 'hvac:tickets:read'
  | 'hvac:tickets:write'
  | 'hvac:equipment:read'
  | 'hvac:equipment:write'
  | 'hvac:reports:read'
  | 'hvac:settings:read'
  | 'hvac:settings:write';

export interface HvacUser {
  id: string;
  email: string;
  name: string;
  role: HvacRole;
  permissions: HvacPermission[];
  isActive: boolean;
  lastLogin?: Date;
  hvacCertifications?: string[];
}

export interface HvacAuthState {
  user: HvacUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<HvacRole, HvacPermission[]> = {
  hvac_admin: [
    'hvac:read', 'hvac:write', 'hvac:delete', 'hvac:admin',
    'hvac:customers:read', 'hvac:customers:write',
    'hvac:tickets:read', 'hvac:tickets:write',
    'hvac:equipment:read', 'hvac:equipment:write',
    'hvac:reports:read',
    'hvac:settings:read', 'hvac:settings:write'
  ],
  hvac_manager: [
    'hvac:read', 'hvac:write',
    'hvac:customers:read', 'hvac:customers:write',
    'hvac:tickets:read', 'hvac:tickets:write',
    'hvac:equipment:read', 'hvac:equipment:write',
    'hvac:reports:read',
    'hvac:settings:read'
  ],
  hvac_technician: [
    'hvac:read', 'hvac:write',
    'hvac:customers:read',
    'hvac:tickets:read', 'hvac:tickets:write',
    'hvac:equipment:read', 'hvac:equipment:write'
  ],
  hvac_dispatcher: [
    'hvac:read', 'hvac:write',
    'hvac:customers:read',
    'hvac:tickets:read', 'hvac:tickets:write',
    'hvac:equipment:read'
  ],
  hvac_viewer: [
    'hvac:read',
    'hvac:customers:read',
    'hvac:tickets:read',
    'hvac:equipment:read',
    'hvac:reports:read'
  ]
};

/**
 * Main HVAC authentication hook
 */
export const useHvacAuth = (): HvacAuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: HvacPermission) => boolean;
  hasRole: (role: HvacRole) => boolean;
} => {
  // Mock user for development - in real implementation would use actual auth state
  const mockUser: HvacUser = {
    id: 'hvac-user-1',
    email: 'technician@fulmark.pl',
    name: 'Jan Kowalski',
    role: 'hvac_technician',
    permissions: ROLE_PERMISSIONS.hvac_technician,
    isActive: true,
    lastLogin: new Date(),
    hvacCertifications: ['F-Gas', 'Vaillant Certified']
  };

  const authState: HvacAuthState = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  };

  const login = useCallback(async (email: string, password: string) => {
    // Placeholder implementation
    console.log('HVAC login attempt:', email);
  }, []);

  const logout = useCallback(() => {
    // Placeholder implementation
    console.log('HVAC logout');
  }, []);

  const hasPermission = useCallback((permission: HvacPermission) => {
    return authState.user?.permissions.includes(permission) ?? false;
  }, [authState.user]);

  const hasRole = useCallback((role: HvacRole) => {
    return authState.user?.role === role;
  }, [authState.user]);

  return {
    ...authState,
    login,
    logout,
    hasPermission,
    hasRole,
  };
};

/**
 * HVAC permissions hook
 */
export const useHvacPermissions = () => {
  const { user, hasPermission } = useHvacAuth();

  const permissions = useMemo(() => ({
    canReadCustomers: hasPermission('hvac:customers:read'),
    canWriteCustomers: hasPermission('hvac:customers:write'),
    canReadTickets: hasPermission('hvac:tickets:read'),
    canWriteTickets: hasPermission('hvac:tickets:write'),
    canReadEquipment: hasPermission('hvac:equipment:read'),
    canWriteEquipment: hasPermission('hvac:equipment:write'),
    canReadReports: hasPermission('hvac:reports:read'),
    canReadSettings: hasPermission('hvac:settings:read'),
    canWriteSettings: hasPermission('hvac:settings:write'),
    isAdmin: hasPermission('hvac:admin'),
  }), [hasPermission]);

  return {
    user,
    permissions,
    hasPermission,
  };
};

/**
 * HVAC role access hook
 */
export const useHvacRoleAccess = () => {
  const { user, hasRole } = useHvacAuth();

  const roleAccess = useMemo(() => ({
    isAdmin: hasRole('hvac_admin'),
    isManager: hasRole('hvac_manager'),
    isTechnician: hasRole('hvac_technician'),
    isDispatcher: hasRole('hvac_dispatcher'),
    isViewer: hasRole('hvac_viewer'),
    canManageUsers: hasRole('hvac_admin') || hasRole('hvac_manager'),
    canAssignTickets: hasRole('hvac_admin') || hasRole('hvac_manager') || hasRole('hvac_dispatcher'),
    canCompleteTickets: hasRole('hvac_admin') || hasRole('hvac_manager') || hasRole('hvac_technician'),
  }), [hasRole]);

  return {
    user,
    roleAccess,
    hasRole,
    currentRole: user?.role,
  };
};
