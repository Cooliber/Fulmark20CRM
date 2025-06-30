import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { HvacConfigService } from 'src/engine/core-modules/hvac-config/hvac-config.service';

import { HVACErrorContext, HvacSentryService } from './hvac-sentry.service';

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  notificationChannels: NotificationChannel[];
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  threshold: number;
  duration?: number; // minutes
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
  notificationsSent: string[];
}

export interface AlertingMetrics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  alertsByseverity: Record<string, number>;
  averageResolutionTime: number;
  notificationSuccessRate: number;
}

@Injectable()
export class HvacAlertNotificationService {
  private readonly logger = new Logger(HvacAlertNotificationService.name);
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private lastNotificationTime: Map<string, Date> = new Map();

  constructor(
    private readonly hvacConfigService: HvacConfigService,
    private readonly hvacSentryService: HvacSentryService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeDefaultAlertRules();
  }

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-response-time',
        name: 'High API Response Time',
        condition: {
          metric: 'api.response_time',
          operator: '>',
          threshold: 2000, // 2 seconds
          duration: 5, // 5 minutes
        },
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15,
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['admin@hvac-company.com'] },
            enabled: true,
          },
        ],
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: {
          metric: 'api.error_rate',
          operator: '>',
          threshold: 0.05, // 5%
          duration: 3,
        },
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: [
          {
            type: 'email',
            config: {
              recipients: ['admin@hvac-company.com', 'tech@hvac-company.com'],
            },
            enabled: true,
          },
        ],
      },
      {
        id: 'service-down',
        name: 'Service Down',
        condition: {
          metric: 'service.status',
          operator: '=',
          threshold: 0, // 0 = down
        },
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['admin@hvac-company.com'] },
            enabled: true,
          },
        ],
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: {
          metric: 'system.memory_usage',
          operator: '>',
          threshold: 0.85, // 85%
          duration: 10,
        },
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 30,
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['admin@hvac-company.com'] },
            enabled: true,
          },
        ],
      },
      {
        id: 'sync-errors',
        name: 'Data Sync Errors',
        condition: {
          metric: 'sync.error_count',
          operator: '>',
          threshold: 5,
        },
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 20,
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['admin@hvac-company.com'] },
            enabled: true,
          },
        ],
      },
    ];

    defaultRules.forEach((rule) => {
      this.alertRules.set(rule.id, rule);
    });

    this.logger.log(`Initialized ${defaultRules.length} default alert rules`);
  }

  async evaluateMetrics(metrics: Record<string, any>): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = this.evaluateCondition(rule.condition, metrics);

        if (shouldAlert) {
          await this.triggerAlert(rule, metrics);
        } else {
          // Check if we should resolve any existing alerts for this rule
          await this.checkForResolution(ruleId);
        }
      } catch (error) {
        this.logger.error(`Failed to evaluate alert rule ${ruleId}`, error);
        this.hvacSentryService.reportHVACError(
          error as Error,
          {
            context: HVACErrorContext.CONFIGURATION,
            operation: 'evaluate_alert_rule',
            additionalData: { ruleId, ruleName: rule.name },
          },
          'error',
        );
      }
    }
  }

  private evaluateCondition(
    condition: AlertCondition,
    metrics: Record<string, any>,
  ): boolean {
    const value = this.getMetricValue(condition.metric, metrics);

    if (value === undefined || value === null) {
      return false;
    }

    switch (condition.operator) {
      case '>':
        return value > condition.threshold;
      case '<':
        return value < condition.threshold;
      case '>=':
        return value >= condition.threshold;
      case '<=':
        return value <= condition.threshold;
      case '=':
        return value === condition.threshold;
      case '!=':
        return value !== condition.threshold;
      default:
        return false;
    }
  }

  private getMetricValue(
    metricPath: string,
    metrics: Record<string, any>,
  ): any {
    const parts = metricPath.split('.');
    let value = metrics;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async triggerAlert(
    rule: AlertRule,
    metrics: Record<string, any>,
  ): Promise<void> {
    const alertId = `${rule.id}-${Date.now()}`;

    // Check cooldown
    const lastNotification = this.lastNotificationTime.get(rule.id);

    if (lastNotification) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;

      if (Date.now() - lastNotification.getTime() < cooldownMs) {
        this.logger.debug(`Alert rule ${rule.id} is in cooldown period`);

        return;
      }
    }

    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, metrics),
      timestamp: new Date(),
      resolved: false,
      metadata: {
        metrics: this.getRelevantMetrics(rule.condition.metric, metrics),
        threshold: rule.condition.threshold,
        operator: rule.condition.operator,
      },
      notificationsSent: [],
    };

    this.alerts.set(alertId, alert);
    this.lastNotificationTime.set(rule.id, new Date());

    this.logger.warn(`Alert triggered: ${alert.message}`, {
      alertId,
      ruleId: rule.id,
      severity: rule.severity,
    });

    // Send notifications
    await this.sendNotifications(alert, rule.notificationChannels);

    // Emit event for other services
    this.eventEmitter.emit('hvac.alert.triggered', alert);

    // Report to Sentry for critical alerts
    if (rule.severity === 'critical') {
      this.hvacSentryService.reportHVACError(
        new Error(`Critical Alert: ${alert.message}`),
        {
          context: HVACErrorContext.HEALTH_CHECK,
          operation: 'critical_alert',
          additionalData: {
            alertId,
            ruleId: rule.id,
            severity: rule.severity,
          },
        },
        'error',
      );
    }
  }

  private generateAlertMessage(
    rule: AlertRule,
    metrics: Record<string, any>,
  ): string {
    const value = this.getMetricValue(rule.condition.metric, metrics);

    return `${rule.name}: ${rule.condition.metric} is ${value} (threshold: ${rule.condition.operator} ${rule.condition.threshold})`;
  }

  private getRelevantMetrics(
    metricPath: string,
    metrics: Record<string, any>,
  ): Record<string, any> {
    // Extract relevant metrics for the alert context
    const parts = metricPath.split('.');
    const category = parts[0];

    if (metrics[category]) {
      return { [category]: metrics[category] };
    }

    return { [metricPath]: this.getMetricValue(metricPath, metrics) };
  }

  private async sendNotifications(
    alert: Alert,
    channels: NotificationChannel[],
  ): Promise<void> {
    const notificationPromises = channels
      .filter((channel) => channel.enabled)
      .map((channel) => this.sendNotification(alert, channel));

    const results = await Promise.allSettled(notificationPromises);

    results.forEach((result, index) => {
      const channel = channels[index];

      if (result.status === 'fulfilled') {
        alert.notificationsSent.push(channel.type);
        this.logger.log(
          `Notification sent via ${channel.type} for alert ${alert.id}`,
        );
      } else {
        this.logger.error(
          `Failed to send notification via ${channel.type}`,
          result.reason,
        );
      }
    });
  }

  private async sendNotification(
    alert: Alert,
    channel: NotificationChannel,
  ): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(alert, channel.config);
        break;
      case 'slack':
        await this.sendSlackNotification(alert, channel.config);
        break;
      case 'webhook':
        await this.sendWebhookNotification(alert, channel.config);
        break;
      case 'sms':
        await this.sendSmsNotification(alert, channel.config);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${channel.type}`);
    }
  }

  private async sendEmailNotification(
    alert: Alert,
    config: any,
  ): Promise<void> {
    // In production, this would integrate with an email service
    this.logger.log(`[EMAIL] Alert: ${alert.message}`, {
      recipients: config.recipients,
      severity: alert.severity,
    });
  }

  private async sendSlackNotification(
    alert: Alert,
    config: any,
  ): Promise<void> {
    // In production, this would integrate with Slack API
    this.logger.log(`[SLACK] Alert: ${alert.message}`, {
      channel: config.channel,
      severity: alert.severity,
    });
  }

  private async sendWebhookNotification(
    alert: Alert,
    config: any,
  ): Promise<void> {
    // In production, this would make HTTP requests to webhook URLs
    this.logger.log(`[WEBHOOK] Alert: ${alert.message}`, {
      url: config.url,
      severity: alert.severity,
    });
  }

  private async sendSmsNotification(alert: Alert, config: any): Promise<void> {
    // In production, this would integrate with SMS service
    this.logger.log(`[SMS] Alert: ${alert.message}`, {
      recipients: config.recipients,
      severity: alert.severity,
    });
  }

  private async checkForResolution(ruleId: string): Promise<void> {
    const activeAlerts = Array.from(this.alerts.values()).filter(
      (alert) => alert.ruleId === ruleId && !alert.resolved,
    );

    for (const alert of activeAlerts) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      this.logger.log(`Alert resolved: ${alert.message}`, {
        alertId: alert.id,
        duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
      });

      this.eventEmitter.emit('hvac.alert.resolved', alert);
    }
  }

  // Public API
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getAlertingMetrics(): AlertingMetrics {
    const allAlerts = this.getAllAlerts();
    const activeAlerts = this.getActiveAlerts();
    const resolvedAlerts = allAlerts.filter((alert) => alert.resolved);

    const alertsByseverity = allAlerts.reduce(
      (acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>,
    );

    const averageResolutionTime =
      resolvedAlerts.length > 0
        ? resolvedAlerts.reduce((sum, alert) => {
            if (alert.resolvedAt) {
              return (
                sum + (alert.resolvedAt.getTime() - alert.timestamp.getTime())
              );
            }

            return sum;
          }, 0) / resolvedAlerts.length
        : 0;

    const totalNotifications = allAlerts.reduce(
      (sum, alert) => sum + alert.notificationsSent.length,
      0,
    );
    const notificationSuccessRate =
      totalNotifications > 0 ? totalNotifications / (allAlerts.length * 2) : 1; // Assuming 2 channels per alert

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      alertsByseverity,
      averageResolutionTime,
      notificationSuccessRate,
    };
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.log(`Added alert rule: ${rule.name}`);
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const existingRule = this.alertRules.get(ruleId);

    if (existingRule) {
      const updatedRule = { ...existingRule, ...updates };

      this.alertRules.set(ruleId, updatedRule);
      this.logger.log(`Updated alert rule: ${updatedRule.name}`);
    }
  }

  deleteAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.logger.log(`Deleted alert rule: ${ruleId}`);
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }
}
