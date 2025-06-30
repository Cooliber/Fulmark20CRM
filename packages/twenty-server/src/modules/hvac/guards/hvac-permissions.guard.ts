/**
 * HVAC Permissions Guard
 * "Pasja rodzi profesjonalizm" - Professional HVAC Security
 * 
 * Provides role-based access control for HVAC operations
 * Integrates with Twenty's permission system
 */

import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';
import { isDefined } from 'twenty-shared/utils';

// HVAC Permission Types
export enum HvacPermissionType {
  // Equipment permissions
  READ_EQUIPMENT = 'READ_EQUIPMENT',
  CREATE_EQUIPMENT = 'CREATE_EQUIPMENT',
  UPDATE_EQUIPMENT = 'UPDATE_EQUIPMENT',
  DELETE_EQUIPMENT = 'DELETE_EQUIPMENT',
  
  // Service Ticket permissions
  READ_SERVICE_TICKETS = 'READ_SERVICE_TICKETS',
  CREATE_SERVICE_TICKETS = 'CREATE_SERVICE_TICKETS',
  UPDATE_SERVICE_TICKETS = 'UPDATE_SERVICE_TICKETS',
  DELETE_SERVICE_TICKETS = 'DELETE_SERVICE_TICKETS',
  ASSIGN_SERVICE_TICKETS = 'ASSIGN_SERVICE_TICKETS',
  
  // Technician permissions
  READ_TECHNICIANS = 'READ_TECHNICIANS',
  CREATE_TECHNICIANS = 'CREATE_TECHNICIANS',
  UPDATE_TECHNICIANS = 'UPDATE_TECHNICIANS',
  DELETE_TECHNICIANS = 'DELETE_TECHNICIANS',
  
  // Maintenance permissions
  READ_MAINTENANCE = 'READ_MAINTENANCE',
  CREATE_MAINTENANCE = 'CREATE_MAINTENANCE',
  UPDATE_MAINTENANCE = 'UPDATE_MAINTENANCE',
  DELETE_MAINTENANCE = 'DELETE_MAINTENANCE',
  SCHEDULE_MAINTENANCE = 'SCHEDULE_MAINTENANCE',
  
  // Advanced permissions
  ACCESS_ANALYTICS = 'ACCESS_ANALYTICS',
  MANAGE_HVAC_SETTINGS = 'MANAGE_HVAC_SETTINGS',
  SEMANTIC_SEARCH = 'SEMANTIC_SEARCH',
  CUSTOMER_360_VIEW = 'CUSTOMER_360_VIEW',
  
  // Administrative permissions
  HVAC_ADMIN = 'HVAC_ADMIN',
  MANAGE_HVAC_USERS = 'MANAGE_HVAC_USERS',
}

// Decorator for HVAC permissions
export const HVAC_PERMISSIONS_KEY = 'hvac_permissions';
export const RequireHvacPermissions = (...permissions: HvacPermissionType[]) =>
  Reflector.createDecorator<HvacPermissionType[]>({ key: HVAC_PERMISSIONS_KEY, value: permissions });

// Role-based permission mapping
const HVAC_ROLE_PERMISSIONS = {
  // HVAC Technician - Basic field operations
  'hvac-technician': [
    HvacPermissionType.READ_EQUIPMENT,
    HvacPermissionType.UPDATE_EQUIPMENT,
    HvacPermissionType.READ_SERVICE_TICKETS,
    HvacPermissionType.UPDATE_SERVICE_TICKETS,
    HvacPermissionType.READ_MAINTENANCE,
    HvacPermissionType.UPDATE_MAINTENANCE,
    HvacPermissionType.SEMANTIC_SEARCH,
  ],
  
  // HVAC Supervisor - Team management
  'hvac-supervisor': [
    HvacPermissionType.READ_EQUIPMENT,
    HvacPermissionType.CREATE_EQUIPMENT,
    HvacPermissionType.UPDATE_EQUIPMENT,
    HvacPermissionType.READ_SERVICE_TICKETS,
    HvacPermissionType.CREATE_SERVICE_TICKETS,
    HvacPermissionType.UPDATE_SERVICE_TICKETS,
    HvacPermissionType.ASSIGN_SERVICE_TICKETS,
    HvacPermissionType.READ_TECHNICIANS,
    HvacPermissionType.READ_MAINTENANCE,
    HvacPermissionType.CREATE_MAINTENANCE,
    HvacPermissionType.UPDATE_MAINTENANCE,
    HvacPermissionType.SCHEDULE_MAINTENANCE,
    HvacPermissionType.ACCESS_ANALYTICS,
    HvacPermissionType.SEMANTIC_SEARCH,
    HvacPermissionType.CUSTOMER_360_VIEW,
  ],
  
  // HVAC Manager - Full operational control
  'hvac-manager': [
    ...Object.values(HvacPermissionType).filter(p => p !== HvacPermissionType.HVAC_ADMIN),
  ],
  
  // HVAC Admin - Full system control
  'hvac-admin': Object.values(HvacPermissionType),
  
  // Default workspace admin - Full access
  'admin': Object.values(HvacPermissionType),
};

@Injectable()
export class HvacPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
    private readonly hvacConfigService: HvacConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<HvacPermissionType[]>(
      HVAC_PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    
    const workspaceId = request.workspace?.id;
    const userWorkspaceId = request.userWorkspaceId;
    const apiKey = request.apiKey;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace not found');
    }

    // API keys have full access (for now)
    if (isDefined(apiKey)) {
      return true;
    }

    if (!userWorkspaceId) {
      throw new ForbiddenException('User workspace not found');
    }

    // Check if HVAC features are enabled
    const hvacFeatures = this.hvacConfigService.getHvacFeatureFlags();
    if (!this.areRequiredFeaturesEnabled(requiredPermissions, hvacFeatures)) {
      throw new ForbiddenException('Required HVAC features are not enabled');
    }

    // Get user roles and check permissions
    const hasPermission = await this.checkHvacPermissions(
      userWorkspaceId,
      workspaceId,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient HVAC permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private areRequiredFeaturesEnabled(
    permissions: HvacPermissionType[],
    features: any,
  ): boolean {
    const featureMap = {
      [HvacPermissionType.SEMANTIC_SEARCH]: features.semanticSearch,
      [HvacPermissionType.ACCESS_ANALYTICS]: features.aiInsights,
      [HvacPermissionType.CUSTOMER_360_VIEW]: features.customer360,
      [HvacPermissionType.SCHEDULE_MAINTENANCE]: features.maintenance,
    };

    return permissions.every(permission => {
      const requiredFeature = featureMap[permission];
      return requiredFeature === undefined || requiredFeature === true;
    });
  }

  private async checkHvacPermissions(
    userWorkspaceId: string,
    workspaceId: string,
    requiredPermissions: HvacPermissionType[],
  ): Promise<boolean> {
    try {
      // For now, implement basic role-based checking
      // In the future, this could be extended to use Twenty's object permissions
      
      // Check if user has workspace admin permissions
      const hasAdminPermission = await this.permissionsService.userHasWorkspaceSettingPermission({
        userWorkspaceId,
        workspaceId,
        setting: 'WORKSPACE' as any, // Using workspace permission as proxy for admin
        isExecutedByApiKey: false,
      });

      if (hasAdminPermission) {
        return true; // Admins have all HVAC permissions
      }

      // For now, allow all authenticated workspace users basic HVAC access
      // This should be enhanced with proper role-based permissions
      const basicPermissions = [
        HvacPermissionType.READ_EQUIPMENT,
        HvacPermissionType.READ_SERVICE_TICKETS,
        HvacPermissionType.READ_TECHNICIANS,
        HvacPermissionType.READ_MAINTENANCE,
        HvacPermissionType.SEMANTIC_SEARCH,
      ];

      return requiredPermissions.every(permission => 
        basicPermissions.includes(permission)
      );
    } catch (error) {
      console.error('Error checking HVAC permissions:', error);
      return false;
    }
  }
}

// Convenience decorators for common HVAC operations
export const RequireHvacRead = () => RequireHvacPermissions(
  HvacPermissionType.READ_EQUIPMENT,
  HvacPermissionType.READ_SERVICE_TICKETS,
);

export const RequireHvacWrite = () => RequireHvacPermissions(
  HvacPermissionType.CREATE_EQUIPMENT,
  HvacPermissionType.UPDATE_EQUIPMENT,
  HvacPermissionType.CREATE_SERVICE_TICKETS,
  HvacPermissionType.UPDATE_SERVICE_TICKETS,
);

export const RequireHvacAdmin = () => RequireHvacPermissions(
  HvacPermissionType.HVAC_ADMIN,
);

export const RequireSemanticSearch = () => RequireHvacPermissions(
  HvacPermissionType.SEMANTIC_SEARCH,
);

export const RequireCustomer360 = () => RequireHvacPermissions(
  HvacPermissionType.CUSTOMER_360_VIEW,
);
