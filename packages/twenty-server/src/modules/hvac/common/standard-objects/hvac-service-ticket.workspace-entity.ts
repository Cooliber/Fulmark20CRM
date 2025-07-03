import { msg } from '@lingui/core/macro';
import { FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';

/**
 * HVAC Service Ticket Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional service ticket management
 * 
 * Manages HVAC service requests and work orders
 * Integrates with TwentyCRM workspace system for complete customer management
 */
@WorkspaceEntity({
  standardId: 'hvac-service-ticket',
  namePlural: 'hvacServiceTickets',
  labelSingular: msg`HVAC Service Ticket`,
  labelPlural: msg`HVAC Service Tickets`,
  description: msg`HVAC service requests and work orders`,
  icon: 'IconTicket',
  labelIdentifierStandardId: 'ticketNumber',
})
export class HvacServiceTicketWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'ticketNumber',
    type: FieldMetadataType.TEXT,
    label: msg`Ticket Number`,
    description: msg`Unique service ticket identifier`,
    icon: 'IconHash',
  })
  ticketNumber: string;

  @WorkspaceField({
    standardId: 'title',
    type: FieldMetadataType.TEXT,
    label: msg`Title`,
    description: msg`Service ticket title`,
    icon: 'IconH1',
  })
  title: string;

  @WorkspaceField({
    standardId: 'description',
    type: FieldMetadataType.TEXT,
    label: msg`Description`,
    description: msg`Detailed description of the service request`,
    icon: 'IconFileText',
  })
  @WorkspaceIsNullable()
  description?: string;

  @WorkspaceField({
    standardId: 'priority',
    type: FieldMetadataType.SELECT,
    label: msg`Priority`,
    description: msg`Service ticket priority level`,
    icon: 'IconFlag',
  })
  priority: string; // LOW, MEDIUM, HIGH, EMERGENCY

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Current ticket status`,
    icon: 'IconCircleCheck',
  })
  status: string; // OPEN, IN_PROGRESS, COMPLETED, CANCELLED

  @WorkspaceField({
    standardId: 'serviceType',
    type: FieldMetadataType.SELECT,
    label: msg`Service Type`,
    description: msg`Type of HVAC service required`,
    icon: 'IconSettings',
  })
  serviceType: string; // INSTALLATION, MAINTENANCE, REPAIR, EMERGENCY

  @WorkspaceField({
    standardId: 'customerId',
    type: FieldMetadataType.TEXT,
    label: msg`Customer ID`,
    description: msg`ID of the customer requesting service`,
    icon: 'IconUser',
  })
  customerId: string;

  @WorkspaceField({
    standardId: 'customerAddress',
    type: FieldMetadataType.TEXT,
    label: msg`Customer Address`,
    description: msg`Service location address`,
    icon: 'IconMapPin',
  })
  customerAddress: string;

  @WorkspaceField({
    standardId: 'assignedTechnicianId',
    type: FieldMetadataType.TEXT,
    label: msg`Assigned Technician`,
    description: msg`ID of assigned technician`,
    icon: 'IconUserCheck',
  })
  @WorkspaceIsNullable()
  assignedTechnicianId?: string;

  @WorkspaceField({
    standardId: 'scheduledDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Scheduled Date`,
    description: msg`When service is scheduled`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  scheduledDate?: Date;

  @WorkspaceField({
    standardId: 'completedDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Completed Date`,
    description: msg`When service was completed`,
    icon: 'IconCalendarCheck',
  })
  @WorkspaceIsNullable()
  completedDate?: Date;

  @WorkspaceField({
    standardId: 'estimatedDuration',
    type: FieldMetadataType.NUMBER,
    label: msg`Estimated Duration (hours)`,
    description: msg`Estimated service duration in hours`,
    icon: 'IconClock',
  })
  @WorkspaceIsNullable()
  estimatedDuration?: number;

  @WorkspaceField({
    standardId: 'actualDuration',
    type: FieldMetadataType.NUMBER,
    label: msg`Actual Duration (hours)`,
    description: msg`Actual service duration in hours`,
    icon: 'IconClockCheck',
  })
  @WorkspaceIsNullable()
  actualDuration?: number;

  @WorkspaceField({
    standardId: 'estimatedCost',
    type: FieldMetadataType.CURRENCY,
    label: msg`Estimated Cost`,
    description: msg`Estimated service cost in PLN`,
    icon: 'IconCurrencyDollar',
  })
  @WorkspaceIsNullable()
  estimatedCost?: number;

  @WorkspaceField({
    standardId: 'actualCost',
    type: FieldMetadataType.CURRENCY,
    label: msg`Actual Cost`,
    description: msg`Actual service cost in PLN`,
    icon: 'IconCurrencyDollarOff',
  })
  @WorkspaceIsNullable()
  actualCost?: number;

  @WorkspaceField({
    standardId: 'equipmentIds',
    type: FieldMetadataType.TEXT,
    label: msg`Equipment IDs`,
    description: msg`Comma-separated list of equipment IDs`,
    icon: 'IconDevices',
  })
  @WorkspaceIsNullable()
  equipmentIds?: string;

  @WorkspaceField({
    standardId: 'partsUsed',
    type: FieldMetadataType.TEXT,
    label: msg`Parts Used`,
    description: msg`List of parts used in service`,
    icon: 'IconComponents',
  })
  @WorkspaceIsNullable()
  partsUsed?: string;

  @WorkspaceField({
    standardId: 'workPerformed',
    type: FieldMetadataType.TEXT,
    label: msg`Work Performed`,
    description: msg`Description of work performed`,
    icon: 'IconTool',
  })
  @WorkspaceIsNullable()
  workPerformed?: string;

  @WorkspaceField({
    standardId: 'customerSignature',
    type: FieldMetadataType.TEXT,
    label: msg`Customer Signature`,
    description: msg`Customer signature for service completion`,
    icon: 'IconSignature',
  })
  @WorkspaceIsNullable()
  customerSignature?: string;

  @WorkspaceField({
    standardId: 'customerRating',
    type: FieldMetadataType.NUMBER,
    label: msg`Customer Rating`,
    description: msg`Customer satisfaction rating (1-5)`,
    icon: 'IconStar',
  })
  @WorkspaceIsNullable()
  customerRating?: number;

  @WorkspaceField({
    standardId: 'customerFeedback',
    type: FieldMetadataType.TEXT,
    label: msg`Customer Feedback`,
    description: msg`Customer feedback and comments`,
    icon: 'IconMessageCircle',
  })
  @WorkspaceIsNullable()
  customerFeedback?: string;

  @WorkspaceField({
    standardId: 'followUpRequired',
    type: FieldMetadataType.BOOLEAN,
    label: msg`Follow-up Required`,
    description: msg`Whether follow-up service is required`,
    icon: 'IconRefresh',
    defaultValue: false,
  })
  followUpRequired: boolean;

  @WorkspaceField({
    standardId: 'followUpDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Follow-up Date`,
    description: msg`When follow-up service is scheduled`,
    icon: 'IconCalendarTime',
  })
  @WorkspaceIsNullable()
  followUpDate?: Date;

  @WorkspaceField({
    standardId: 'warrantyExpiration',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Warranty Expiration`,
    description: msg`When service warranty expires`,
    icon: 'IconShield',
  })
  @WorkspaceIsNullable()
  warrantyExpiration?: Date;

  @WorkspaceField({
    standardId: 'emergencyService',
    type: FieldMetadataType.BOOLEAN,
    label: msg`Emergency Service`,
    description: msg`Whether this is an emergency service call`,
    icon: 'IconAlertTriangle',
    defaultValue: false,
  })
  emergencyService: boolean;

  @WorkspaceField({
    standardId: 'invoiceNumber',
    type: FieldMetadataType.TEXT,
    label: msg`Invoice Number`,
    description: msg`Associated invoice number`,
    icon: 'IconReceipt',
  })
  @WorkspaceIsNullable()
  invoiceNumber?: string;

  @WorkspaceField({
    standardId: 'paymentStatus',
    type: FieldMetadataType.SELECT,
    label: msg`Payment Status`,
    description: msg`Current payment status`,
    icon: 'IconCreditCard',
  })
  @WorkspaceIsNullable()
  paymentStatus?: string; // PENDING, PAID, OVERDUE, CANCELLED
}
