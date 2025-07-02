/**
 * HVAC Mobile Application Integration Service
 * "Pasja rodzi profesjonalizm" - Professional mobile integration for Polish HVAC technicians and customers
 * 
 * Develops real-time mobile apps with offline-first architecture, GPS tracking,
 * and route optimization specifically designed for Polish HVAC market
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { HvacCircuitBreakerService } from '../services/hvac-circuit-breaker.service';
import { HvacErrorHandlerService, HvacErrorType } from '../services/hvac-error-handler.service';
import { HvacMetricsService } from '../services/hvac-metrics.service';
import { HvacRedisCacheService } from '../services/hvac-redis-cache.service';

// Mobile App Interfaces
export interface MobileAppUser {
  userId: string;
  userType: 'technician' | 'customer' | 'manager' | 'dispatcher';
  name: string;
  email: string;
  phone: string;
  deviceInfo: {
    deviceId: string;
    platform: 'ios' | 'android';
    appVersion: string;
    osVersion: string;
    pushToken?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
    address?: string;
  };
  preferences: {
    language: 'pl' | 'en';
    notifications: boolean;
    offlineMode: boolean;
    gpsTracking: boolean;
  };
  status: 'online' | 'offline' | 'busy' | 'available';
  lastActive: Date;
}

export interface TechnicianProfile extends MobileAppUser {
  userType: 'technician';
  employeeId: string;
  specializations: string[];
  certifications: string[];
  workingHours: {
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
  serviceArea: {
    voivodeships: string[]; // Polish administrative divisions
    maxRadius: number; // km
    preferredCities: string[];
  };
  currentRoute?: RouteOptimization;
  dailyStats: {
    completedJobs: number;
    travelDistance: number; // km
    workingHours: number;
    customerRating: number;
  };
}

export interface CustomerProfile extends MobileAppUser {
  userType: 'customer';
  customerId: string;
  properties: CustomerProperty[];
  serviceHistory: ServiceHistoryItem[];
  preferences: MobileAppUser['preferences'] & {
    preferredTechnician?: string;
    emergencyContact: string;
    serviceReminders: boolean;
  };
}

export interface CustomerProperty {
  propertyId: string;
  address: {
    street: string;
    city: string;
    voivodeship: string;
    postalCode: string;
    coordinates: { lat: number; lng: number };
  };
  propertyType: 'residential' | 'commercial' | 'industrial';
  hvacSystems: {
    equipmentId: string;
    type: 'heating' | 'cooling' | 'ventilation' | 'heat_pump';
    manufacturer: string;
    model: string;
    installationDate: Date;
    lastService: Date;
    nextService: Date;
  }[];
}

export interface ServiceHistoryItem {
  serviceId: string;
  date: Date;
  type: 'maintenance' | 'repair' | 'installation' | 'inspection';
  technician: string;
  description: string;
  cost: number; // PLN
  rating?: number; // 1-5
  feedback?: string;
}

export interface MobileServiceTicket {
  ticketId: string;
  customerId: string;
  technicianId?: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  type: 'maintenance' | 'repair' | 'installation' | 'emergency';
  title: string;
  description: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
    accessInstructions?: string;
  };
  scheduledTime: Date;
  estimatedDuration: number; // minutes
  requiredParts: string[];
  photos: string[]; // URLs
  notes: string[];
  offlineData?: {
    syncStatus: 'pending' | 'synced' | 'conflict';
    lastModified: Date;
    conflictResolution?: 'server' | 'local' | 'manual';
  };
}

export interface RouteOptimization {
  routeId: string;
  technicianId: string;
  date: Date;
  tickets: MobileServiceTicket[];
  optimizedOrder: string[]; // ticket IDs in optimal order
  totalDistance: number; // km
  totalDuration: number; // minutes
  estimatedFuelCost: number; // PLN
  trafficConditions: 'light' | 'moderate' | 'heavy';
  weatherConditions: {
    temperature: number;
    conditions: string;
    visibility: number;
  };
  breaks: {
    type: 'lunch' | 'rest' | 'fuel';
    duration: number; // minutes
    location?: { lat: number; lng: number };
  }[];
}

export interface OfflineDataSync {
  userId: string;
  lastSyncTime: Date;
  pendingChanges: {
    tickets: MobileServiceTicket[];
    photos: string[];
    notes: string[];
    locations: any[];
  };
  conflictResolution: {
    strategy: 'server_wins' | 'client_wins' | 'manual_merge';
    conflicts: any[];
  };
  syncStatus: 'idle' | 'syncing' | 'error' | 'complete';
}

export interface PushNotification {
  notificationId: string;
  userId: string;
  type: 'ticket_assigned' | 'route_updated' | 'emergency' | 'reminder' | 'system';
  title: string;
  titlePolish: string;
  message: string;
  messagePolish: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  scheduledTime?: Date;
  sent: boolean;
  delivered: boolean;
  opened: boolean;
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/mobile-app'
})
export class MobileAppIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(MobileAppIntegrationService.name);
  
  @WebSocketServer()
  private server: Server;

  private readonly connectedUsers = new Map<string, MobileAppUser>();
  private readonly activeRoutes = new Map<string, RouteOptimization>();
  private readonly offlineData = new Map<string, OfflineDataSync>();
  private readonly pendingNotifications = new Map<string, PushNotification>();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly circuitBreakerService: HvacCircuitBreakerService,
    private readonly errorHandlerService: HvacErrorHandlerService,
    private readonly metricsService: HvacMetricsService,
    private readonly cacheService: HvacRedisCacheService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeMobileServices();
    await this.startLocationTracking();
    await this.startOfflineDataSync();
    
    this.logger.log('Mobile Application Integration Service initialized');
  }

  /**
   * Initialize mobile services and configurations
   */
  private async initializeMobileServices(): Promise<void> {
    // Initialize push notification service
    await this.initializePushNotifications();
    
    // Initialize route optimization service
    await this.initializeRouteOptimization();
    
    // Initialize offline data management
    await this.initializeOfflineDataManagement();
    
    this.logger.log('Mobile services initialized');
  }

  /**
   * Register mobile app user
   */
  async registerUser(user: MobileAppUser): Promise<void> {
    try {
      // Validate user data
      await this.validateUserRegistration(user);
      
      // Store user in cache and memory
      this.connectedUsers.set(user.userId, user);
      
      const cacheKey = this.cacheService.generateKey('CUSTOMER', `mobile_user:${user.userId}`);
      await this.cacheService.set(cacheKey, user, {
        ttl: 3600, // 1 hour
        tags: ['mobile', 'user', user.userType]
      });
      
      // Initialize offline data sync for user
      await this.initializeUserOfflineData(user.userId);
      
      // Send welcome notification
      await this.sendWelcomeNotification(user);
      
      this.logger.log(`Mobile user registered: ${user.userId} (${user.userType})`);
      this.metricsService.incrementCounter(`mobile_users_${user.userType}`);
      
    } catch (error) {
      throw this.errorHandlerService.createError(
        HvacErrorType.CUSTOMER_DATA_ERROR,
        `Failed to register mobile user: ${user.userId}`,
        error as Error,
        { userId: user.userId }
      );
    }
  }

  /**
   * Update user location for GPS tracking
   */
  async updateUserLocation(userId: string, location: MobileAppUser['location']): Promise<void> {
    try {
      const user = this.connectedUsers.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Update user location
      user.location = location;
      user.lastActive = new Date();
      this.connectedUsers.set(userId, user);

      // Cache location for route optimization
      const locationCacheKey = this.cacheService.generateKey('EQUIPMENT', `location:${userId}`);
      await this.cacheService.set(locationCacheKey, location, {
        ttl: 300, // 5 minutes
        tags: ['location', 'gps', userId]
      });

      // Emit location update via WebSocket
      this.server.to(`user_${userId}`).emit('location-updated', {
        userId,
        location,
        timestamp: new Date()
      });

      // Update route optimization if user is a technician
      if (user.userType === 'technician') {
        await this.updateTechnicianRoute(userId, location);
      }

      this.metricsService.recordMetric(`location_updates_${user.userType}`, 1);

    } catch (error) {
      this.logger.error(`Failed to update location for user ${userId}`, error);
    }
  }

  /**
   * Assign service ticket to technician with route optimization
   */
  async assignTicketToTechnician(
    ticketId: string, 
    technicianId: string,
    optimizeRoute: boolean = true
  ): Promise<RouteOptimization | null> {
    try {
      const technician = this.connectedUsers.get(technicianId) as TechnicianProfile;
      if (!technician || technician.userType !== 'technician') {
        throw new Error(`Technician not found: ${technicianId}`);
      }

      // Get ticket data (would come from database in production)
      const ticket = await this.getServiceTicket(ticketId);
      
      // Add ticket to technician's route
      let route = this.activeRoutes.get(technicianId);
      if (!route) {
        route = await this.createNewRoute(technicianId);
      }

      route.tickets.push(ticket);

      if (optimizeRoute) {
        // Optimize route with new ticket
        route = await this.optimizeRoute(route);
        this.activeRoutes.set(technicianId, route);
      }

      // Send notification to technician
      await this.sendTicketAssignmentNotification(technicianId, ticket);

      // Emit real-time update
      this.server.to(`user_${technicianId}`).emit('ticket-assigned', {
        ticket,
        route,
        timestamp: new Date()
      });

      this.logger.log(`Ticket ${ticketId} assigned to technician ${technicianId}`);
      this.metricsService.incrementCounter('tickets_assigned');

      return route;

    } catch (error) {
      throw this.errorHandlerService.createError(
        HvacErrorType.TECHNICIAN_ASSIGNMENT_ERROR,
        `Failed to assign ticket ${ticketId} to technician ${technicianId}`,
        error as Error,
        { ticketId, technicianId }
      );
    }
  }

  /**
   * Sync offline data for mobile app
   */
  async syncOfflineData(userId: string, offlineChanges: any): Promise<OfflineDataSync> {
    try {
      const user = this.connectedUsers.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      let syncData = this.offlineData.get(userId);
      if (!syncData) {
        syncData = await this.initializeUserOfflineData(userId);
      }

      syncData.syncStatus = 'syncing';
      syncData.pendingChanges = offlineChanges;

      // Process offline changes
      const conflicts = await this.processOfflineChanges(userId, offlineChanges);
      
      if (conflicts.length > 0) {
        syncData.conflictResolution.conflicts = conflicts;
        syncData.syncStatus = 'error';
        
        // Notify user about conflicts
        await this.sendConflictNotification(userId, conflicts);
      } else {
        syncData.syncStatus = 'complete';
        syncData.lastSyncTime = new Date();
        syncData.pendingChanges = { tickets: [], photos: [], notes: [], locations: [] };
      }

      this.offlineData.set(userId, syncData);

      // Cache sync data
      const cacheKey = this.cacheService.generateKey('CUSTOMER', `offline_sync:${userId}`);
      await this.cacheService.set(cacheKey, syncData, {
        ttl: 1800, // 30 minutes
        tags: ['offline', 'sync', userId]
      });

      this.logger.log(`Offline data synced for user ${userId}`, {
        conflicts: conflicts.length,
        status: syncData.syncStatus
      });

      return syncData;

    } catch (error) {
      throw this.errorHandlerService.createError(
        HvacErrorType.CUSTOMER_DATA_ERROR,
        `Failed to sync offline data for user ${userId}`,
        error as Error,
        { userId }
      );
    }
  }

  // Helper methods

  private async initializePushNotifications(): Promise<void> {
    // Initialize push notification service (Firebase, APNs, etc.)
    this.logger.log('Push notification service initialized');
  }

  private async initializeRouteOptimization(): Promise<void> {
    // Initialize route optimization algorithms
    this.logger.log('Route optimization service initialized');
  }

  private async initializeOfflineDataManagement(): Promise<void> {
    // Initialize offline data management
    this.logger.log('Offline data management initialized');
  }

  private async startLocationTracking(): Promise<void> {
    // Start periodic location tracking for active technicians
    setInterval(async () => {
      await this.processLocationUpdates();
    }, 30000); // Every 30 seconds

    this.logger.log('Location tracking started');
  }

  private async startOfflineDataSync(): Promise<void> {
    // Start periodic offline data synchronization
    setInterval(async () => {
      await this.processOfflineDataSync();
    }, 60000); // Every minute

    this.logger.log('Offline data sync started');
  }

  private async validateUserRegistration(user: MobileAppUser): Promise<void> {
    if (!user.userId || !user.email || !user.deviceInfo.deviceId) {
      throw new Error('Invalid user registration data');
    }

    // Additional validation logic would go here
  }

  private async initializeUserOfflineData(userId: string): Promise<OfflineDataSync> {
    const syncData: OfflineDataSync = {
      userId,
      lastSyncTime: new Date(),
      pendingChanges: {
        tickets: [],
        photos: [],
        notes: [],
        locations: []
      },
      conflictResolution: {
        strategy: 'server_wins',
        conflicts: []
      },
      syncStatus: 'idle'
    };

    this.offlineData.set(userId, syncData);
    return syncData;
  }

  private async sendWelcomeNotification(user: MobileAppUser): Promise<void> {
    const notification: PushNotification = {
      notificationId: `welcome_${user.userId}_${Date.now()}`,
      userId: user.userId,
      type: 'system',
      title: 'Welcome to HVAC CRM',
      titlePolish: 'Witamy w HVAC CRM',
      message: 'Your mobile app is ready to use!',
      messagePolish: 'Twoja aplikacja mobilna jest gotowa do użycia!',
      priority: 'normal',
      sent: false,
      delivered: false,
      opened: false
    };

    await this.sendPushNotification(notification);
  }

  private async updateTechnicianRoute(userId: string, location: MobileAppUser['location']): Promise<void> {
    const route = this.activeRoutes.get(userId);
    if (!route || !location) return;

    // Update route based on current location
    // This would involve complex route optimization algorithms
    this.logger.debug(`Updated route for technician ${userId}`, {
      location: location.address,
      ticketsRemaining: route.tickets.length
    });
  }

  private async getServiceTicket(ticketId: string): Promise<MobileServiceTicket> {
    // Mock service ticket - in production, this would fetch from database
    return {
      ticketId,
      customerId: 'customer_123',
      priority: 'medium',
      status: 'created',
      type: 'maintenance',
      title: 'Heating System Maintenance',
      description: 'Annual maintenance check for heating system',
      location: {
        address: 'ul. Testowa 1, Warsaw',
        coordinates: { lat: 52.2297, lng: 21.0122 },
        accessInstructions: 'Ring doorbell, ask for Mr. Kowalski'
      },
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      estimatedDuration: 120, // 2 hours
      requiredParts: ['filters', 'lubricants'],
      photos: [],
      notes: []
    };
  }

  private async createNewRoute(technicianId: string): Promise<RouteOptimization> {
    const route: RouteOptimization = {
      routeId: `route_${technicianId}_${Date.now()}`,
      technicianId,
      date: new Date(),
      tickets: [],
      optimizedOrder: [],
      totalDistance: 0,
      totalDuration: 0,
      estimatedFuelCost: 0,
      trafficConditions: 'moderate',
      weatherConditions: {
        temperature: 15,
        conditions: 'Partly cloudy',
        visibility: 10
      },
      breaks: [
        {
          type: 'lunch',
          duration: 60,
          location: { lat: 52.2297, lng: 21.0122 }
        }
      ]
    };

    this.activeRoutes.set(technicianId, route);
    return route;
  }

  private async optimizeRoute(route: RouteOptimization): Promise<RouteOptimization> {
    // Implement route optimization algorithm
    // This is a simplified version - in production, use advanced algorithms

    const optimizedRoute = { ...route };

    // Sort tickets by priority and location proximity
    optimizedRoute.tickets.sort((a, b) => {
      const priorityWeight = { emergency: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    optimizedRoute.optimizedOrder = optimizedRoute.tickets.map(t => t.ticketId);

    // Calculate total distance and duration (simplified)
    optimizedRoute.totalDistance = optimizedRoute.tickets.length * 15; // 15km average per ticket
    optimizedRoute.totalDuration = optimizedRoute.tickets.reduce((sum, t) => sum + t.estimatedDuration, 0) +
                                   (optimizedRoute.tickets.length * 30); // 30 min travel between tickets
    optimizedRoute.estimatedFuelCost = optimizedRoute.totalDistance * 0.8; // 0.8 PLN per km

    return optimizedRoute;
  }

  private async sendTicketAssignmentNotification(technicianId: string, ticket: MobileServiceTicket): Promise<void> {
    const notification: PushNotification = {
      notificationId: `ticket_${ticket.ticketId}_${Date.now()}`,
      userId: technicianId,
      type: 'ticket_assigned',
      title: 'New Service Ticket Assigned',
      titlePolish: 'Przydzielono nowe zlecenie serwisowe',
      message: `${ticket.title} at ${ticket.location.address}`,
      messagePolish: `${ticket.title} pod adresem ${ticket.location.address}`,
      data: { ticketId: ticket.ticketId },
      priority: ticket.priority === 'emergency' ? 'critical' : 'high',
      sent: false,
      delivered: false,
      opened: false
    };

    await this.sendPushNotification(notification);
  }

  private async processOfflineChanges(userId: string, offlineChanges: any): Promise<any[]> {
    const conflicts: any[] = [];

    // Process each type of offline change
    for (const ticket of offlineChanges.tickets || []) {
      // Check for conflicts with server data
      const serverTicket = await this.getServiceTicket(ticket.ticketId);
      if (serverTicket && serverTicket.status !== ticket.status) {
        conflicts.push({
          type: 'ticket_status',
          ticketId: ticket.ticketId,
          serverValue: serverTicket.status,
          clientValue: ticket.status
        });
      }
    }

    return conflicts;
  }

  private async sendConflictNotification(userId: string, conflicts: any[]): Promise<void> {
    const notification: PushNotification = {
      notificationId: `conflict_${userId}_${Date.now()}`,
      userId,
      type: 'system',
      title: 'Data Sync Conflicts',
      titlePolish: 'Konflikty synchronizacji danych',
      message: `${conflicts.length} conflicts need resolution`,
      messagePolish: `${conflicts.length} konfliktów wymaga rozwiązania`,
      data: { conflicts },
      priority: 'high',
      sent: false,
      delivered: false,
      opened: false
    };

    await this.sendPushNotification(notification);
  }

  private async processLocationUpdates(): Promise<void> {
    // Process location updates for all active technicians
    const technicians = Array.from(this.connectedUsers.values())
      .filter(user => user.userType === 'technician' && user.status === 'online');

    for (const technician of technicians) {
      if (technician.location) {
        // Update route optimization based on current location
        await this.updateTechnicianRoute(technician.userId, technician.location);
      }
    }
  }

  private async processOfflineDataSync(): Promise<void> {
    // Process offline data sync for all users with pending changes
    for (const [userId, syncData] of this.offlineData.entries()) {
      if (syncData.syncStatus === 'pending' && syncData.pendingChanges.tickets.length > 0) {
        try {
          await this.syncOfflineData(userId, syncData.pendingChanges);
        } catch (error) {
          this.logger.error(`Failed to sync offline data for user ${userId}`, error);
        }
      }
    }
  }

  private async sendPushNotification(notification: PushNotification): Promise<void> {
    try {
      // Store notification
      this.pendingNotifications.set(notification.notificationId, notification);

      // In production, this would send actual push notifications
      // via Firebase Cloud Messaging, Apple Push Notification Service, etc.

      notification.sent = true;

      // Emit via WebSocket for real-time delivery
      this.server.to(`user_${notification.userId}`).emit('notification', notification);

      this.logger.debug(`Push notification sent: ${notification.notificationId}`);
      this.metricsService.incrementCounter(`push_notifications_${notification.type}`);

    } catch (error) {
      this.logger.error(`Failed to send push notification: ${notification.notificationId}`, error);
    }
  }

  // Public API methods

  /**
   * Get connected users
   */
  async getConnectedUsers(): Promise<MobileAppUser[]> {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<MobileAppUser | null> {
    return this.connectedUsers.get(userId) || null;
  }

  /**
   * Get technicians by service area
   */
  async getTechniciansByArea(voivodeship: string): Promise<TechnicianProfile[]> {
    return Array.from(this.connectedUsers.values())
      .filter(user =>
        user.userType === 'technician' &&
        (user as TechnicianProfile).serviceArea.voivodeships.includes(voivodeship)
      ) as TechnicianProfile[];
  }

  /**
   * Get active routes
   */
  async getActiveRoutes(): Promise<RouteOptimization[]> {
    return Array.from(this.activeRoutes.values());
  }

  /**
   * Get route for technician
   */
  async getTechnicianRoute(technicianId: string): Promise<RouteOptimization | null> {
    return this.activeRoutes.get(technicianId) || null;
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    const notification: PushNotification = {
      notificationId: `custom_${userId}_${Date.now()}`,
      userId,
      type: 'system',
      title,
      titlePolish: title, // Would be translated in production
      message,
      messagePolish: message, // Would be translated in production
      data,
      priority: 'normal',
      sent: false,
      delivered: false,
      opened: false
    };

    await this.sendPushNotification(notification);
  }

  /**
   * Get mobile app statistics
   */
  async getMobileAppStats(): Promise<{
    totalUsers: number;
    usersByType: Record<string, number>;
    onlineUsers: number;
    activeRoutes: number;
    pendingNotifications: number;
    offlineSyncPending: number;
  }> {
    const users = Array.from(this.connectedUsers.values());
    const usersByType: Record<string, number> = {};

    for (const user of users) {
      usersByType[user.userType] = (usersByType[user.userType] || 0) + 1;
    }

    const onlineUsers = users.filter(u => u.status === 'online').length;
    const activeRoutes = this.activeRoutes.size;
    const pendingNotifications = Array.from(this.pendingNotifications.values())
      .filter(n => !n.sent).length;
    const offlineSyncPending = Array.from(this.offlineData.values())
      .filter(s => s.syncStatus === 'pending').length;

    return {
      totalUsers: users.length,
      usersByType,
      onlineUsers,
      activeRoutes,
      pendingNotifications,
      offlineSyncPending
    };
  }
}
