/**
 * Enhanced HVAC Protected Route Component
 * "Pasja rodzi profesjonalizm" - Professional Route Protection
 * 
 * Higher-order component for protecting HVAC routes with authentication and authorization
 * Following Twenty CRM patterns and React best practices
 */

import React, { ReactNode, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useHvacAuth, useHvacPermissions, useHvacRoleAccess } from '../hooks/useHvacAuth';
import { HvacPermission, HvacUserRole } from '../services/HvacAuthService';
import { trackHVACUserAction } from '../index';

// Component props
export interface HvacProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: HvacPermission[];
  allowedRoles?: HvacUserRole[];
  requireAllPermissions?: boolean;
  fallbackComponent?: ReactNode;
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
  onUnauthorized?: () => void;
  className?: string;
}

/**
 * Enhanced HVAC Protected Route Component
 */
export const HvacProtectedRoute: React.FC<HvacProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  allowedRoles = [],
  requireAllPermissions = true,
  fallbackComponent,
  loadingComponent,
  unauthorizedComponent,
  onUnauthorized,
  className = '',
}) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    authenticate,
  } = useHvacAuth();

  // Permission checking
  const { hasAllRequired, hasAnyRequired } = useHvacPermissions(requiredPermissions);
  const { hasAccess: hasRoleAccess } = useHvacRoleAccess(allowedRoles);

  // Determine if user has required access
  const hasPermissionAccess = requiredPermissions.length === 0 || 
    (requireAllPermissions ? hasAllRequired : hasAnyRequired);
  
  const hasRoleAccessCheck = allowedRoles.length === 0 || hasRoleAccess;
  
  const hasAccess = isAuthenticated && hasPermissionAccess && hasRoleAccessCheck;

  // Track access attempts
  useEffect(() => {
    if (!isLoading) {
      if (hasAccess) {
        trackHVACUserAction('route_access_granted', 'AUTHORIZATION', {
          userId: user?.id,
          role: user?.role,
          requiredPermissions,
          allowedRoles,
        });
      } else if (isAuthenticated) {
        trackHVACUserAction('route_access_denied', 'AUTHORIZATION', {
          userId: user?.id,
          role: user?.role,
          requiredPermissions,
          allowedRoles,
          reason: !hasPermissionAccess ? 'insufficient_permissions' : 'invalid_role',
        });
        
        onUnauthorized?.();
      }
    }
  }, [
    hasAccess,
    isAuthenticated,
    isLoading,
    user,
    requiredPermissions,
    allowedRoles,
    hasPermissionAccess,
    onUnauthorized,
  ]);

  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className={`hvac-protected-route-loading ${className}`}>
        <Card className="text-center p-6">
          <ProgressSpinner 
            style={{ width: '50px', height: '50px' }} 
            strokeWidth="4" 
            animationDuration="1s"
          />
          <div className="mt-3">
            <h3 className="text-lg font-semibold mb-2">Ładowanie modułu HVAC</h3>
            <p className="text-gray-600">Sprawdzanie uprawnień dostępu...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Authentication error
  if (error) {
    return (
      <div className={`hvac-protected-route-error ${className}`}>
        <Card className="text-center p-6">
          <Message 
            severity="error" 
            text={`Błąd uwierzytelniania: ${error}`}
            className="mb-4"
          />
          <Button 
            label="Spróbuj ponownie" 
            icon="pi pi-refresh"
            onClick={authenticate}
            className="p-button-outlined"
          />
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className={`hvac-protected-route-unauthenticated ${className}`}>
        <Card className="text-center p-6">
          <div className="mb-4">
            <i className="pi pi-lock text-4xl text-gray-400 mb-3"></i>
            <h3 className="text-lg font-semibold mb-2">Wymagane uwierzytelnienie</h3>
            <p className="text-gray-600 mb-4">
              Aby uzyskać dostęp do modułu HVAC, musisz być zalogowany w systemie Twenty CRM.
            </p>
          </div>
          <Button 
            label="Zaloguj się" 
            icon="pi pi-sign-in"
            onClick={authenticate}
            className="p-button-primary"
          />
        </Card>
      </div>
    );
  }

  // Insufficient permissions or role
  if (!hasAccess) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    return (
      <div className={`hvac-protected-route-unauthorized ${className}`}>
        <Card className="text-center p-6">
          <div className="mb-4">
            <i className="pi pi-ban text-4xl text-red-400 mb-3"></i>
            <h3 className="text-lg font-semibold mb-2">Brak uprawnień</h3>
            <p className="text-gray-600 mb-4">
              Nie masz wystarczających uprawnień do dostępu do tej sekcji modułu HVAC.
            </p>
            
            {/* Show required permissions/roles */}
            {requiredPermissions.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium mb-2">Wymagane uprawnienia:</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {requiredPermissions.map(permission => (
                    <span 
                      key={permission}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {permission.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {allowedRoles.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium mb-2">Dozwolone role:</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {allowedRoles.map(role => (
                    <span 
                      key={role}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      {role.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              Twoja rola: <strong>{user?.role?.toLowerCase() || 'nieznana'}</strong>
            </div>
          </div>
          
          <Button 
            label="Powrót do dashboardu" 
            icon="pi pi-home"
            onClick={() => window.history.back()}
            className="p-button-outlined"
          />
        </Card>
      </div>
    );
  }

  // User has access - render children
  return (
    <div className={`hvac-protected-route-content ${className}`}>
      {children}
    </div>
  );
};

/**
 * Higher-order component for protecting HVAC components
 */
export const withHvacProtection = <P extends object>(
  Component: React.ComponentType<P>,
  protectionOptions: Omit<HvacProtectedRouteProps, 'children'>
) => {
  const ProtectedComponent: React.FC<P> = (props) => (
    <HvacProtectedRoute {...protectionOptions}>
      <Component {...props} />
    </HvacProtectedRoute>
  );

  ProtectedComponent.displayName = `withHvacProtection(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
};

/**
 * Hook for conditional rendering based on permissions
 */
export const useHvacConditionalRender = (
  requiredPermissions: HvacPermission[] = [],
  allowedRoles: HvacUserRole[] = [],
  requireAllPermissions = true
) => {
  const { isAuthenticated, user } = useHvacAuth();
  const { hasAllRequired, hasAnyRequired } = useHvacPermissions(requiredPermissions);
  const { hasAccess: hasRoleAccess } = useHvacRoleAccess(allowedRoles);

  const hasPermissionAccess = requiredPermissions.length === 0 || 
    (requireAllPermissions ? hasAllRequired : hasAnyRequired);
  
  const hasRoleAccessCheck = allowedRoles.length === 0 || hasRoleAccess;
  
  const shouldRender = isAuthenticated && hasPermissionAccess && hasRoleAccessCheck;

  return {
    shouldRender,
    isAuthenticated,
    user,
    hasPermissionAccess,
    hasRoleAccess: hasRoleAccessCheck,
  };
};
