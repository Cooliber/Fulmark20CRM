import { registerEnumType } from '@nestjs/graphql';

import { msg } from '@lingui/core/macro';

import { FieldMetadataType } from 'twenty-shared/types';

import { ActorMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/actor.composite-type';
import { AddressMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/address.composite-type';
import { CurrencyMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/currency.composite-type';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { RelationOnDeleteAction } from 'src/engine/metadata-modules/relation-metadata/relation-on-delete-action.type';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';
import { HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_ICONS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

// Import related entities
import { HvacEquipmentWorkspaceEntity } from './hvac-equipment.workspace-entity';
import { HvacTechnicianWorkspaceEntity } from './hvac-technician.workspace-entity';

export enum HvacServiceTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
  ASSIGNED = 'ASSIGNED',
}

export enum HvacServiceTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY',
}

export enum HvacServiceType {
  INSTALLATION = 'INSTALLATION',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  EMERGENCY = 'EMERGENCY',
  CONSULTATION = 'CONSULTATION',
}

registerEnumType(HvacServiceTicketStatus, {
  name: 'HvacServiceTicketStatus',
});

registerEnumType(HvacServiceTicketPriority, {
  name: 'HvacServiceTicketPriority',
});

registerEnumType(HvacServiceType, {
  name: 'HvacServiceType',
});

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.hvacServiceTicket,
  namePlural: 'hvacServiceTickets',
  labelSingular: msg`HVAC Service Ticket`,
  labelPlural: msg`HVAC Service Tickets`,
  description: msg`HVAC service tickets for tracking customer service requests and work orders`,
  icon: STANDARD_OBJECT_ICONS.hvacServiceTicket,
  shortcut: 'T',
  labelIdentifierStandardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.ticketNumber,
})
@WorkspaceIsNotAuditLogged()
export class HvacServiceTicketWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.ticketNumber,
    type: FieldMetadataType.TEXT,
    label: msg`Ticket Number`,
    description: msg`Unique ticket number for the service request`,
    icon: 'IconHash',
  })
  ticketNumber: string;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.title,
    type: FieldMetadataType.TEXT,
    label: msg`Title`,
    description: msg`Brief title describing the service request`,
    icon: 'IconFileText',
  })
  title: string;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.description,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Description`,
    description: msg`Detailed description of the service request`,
    icon: 'IconFileDescription',
  })
  @WorkspaceIsNullable()
  description: string;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.status,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Current status of the service ticket`,
    icon: 'IconProgressCheck',
    options: [
      { value: HvacServiceTicketStatus.OPEN, label: 'Open', position: 0, color: 'blue' },
      { value: HvacServiceTicketStatus.SCHEDULED, label: 'Scheduled', position: 1, color: 'purple' },
      { value: HvacServiceTicketStatus.IN_PROGRESS, label: 'In Progress', position: 2, color: 'yellow' },
      { value: HvacServiceTicketStatus.ON_HOLD, label: 'On Hold', position: 3, color: 'orange' },
      { value: HvacServiceTicketStatus.COMPLETED, label: 'Completed', position: 4, color: 'green' },
      { value: HvacServiceTicketStatus.CANCELLED, label: 'Cancelled', position: 5, color: 'red' },
    ],
    defaultValue: HvacServiceTicketStatus.OPEN,
  })
  status: HvacServiceTicketStatus;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.priority,
    type: FieldMetadataType.SELECT,
    label: msg`Priority`,
    description: msg`Priority level of the service request`,
    icon: 'IconExclamationMark',
    options: [
      { value: HvacServiceTicketPriority.LOW, label: 'Low', position: 0, color: 'green' },
      { value: HvacServiceTicketPriority.MEDIUM, label: 'Medium', position: 1, color: 'yellow' },
      { value: HvacServiceTicketPriority.HIGH, label: 'High', position: 2, color: 'orange' },
      { value: HvacServiceTicketPriority.CRITICAL, label: 'Critical', position: 3, color: 'red' },
      { value: HvacServiceTicketPriority.EMERGENCY, label: 'Emergency', position: 4, color: 'red' },
    ],
    defaultValue: HvacServiceTicketPriority.MEDIUM,
  })
  priority: HvacServiceTicketPriority;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.serviceType,
    type: FieldMetadataType.SELECT,
    label: msg`Service Type`,
    description: msg`Type of HVAC service being requested`,
    icon: 'IconTool',
    options: [
      { value: HvacServiceType.INSTALLATION, label: 'Installation', position: 0, color: 'blue' },
      { value: HvacServiceType.MAINTENANCE, label: 'Maintenance', position: 1, color: 'green' },
      { value: HvacServiceType.REPAIR, label: 'Repair', position: 2, color: 'orange' },
      { value: HvacServiceType.INSPECTION, label: 'Inspection', position: 3, color: 'purple' },
      { value: HvacServiceType.EMERGENCY, label: 'Emergency', position: 4, color: 'red' },
      { value: HvacServiceType.CONSULTATION, label: 'Consultation', position: 5, color: 'gray' },
    ],
  })
  serviceType: HvacServiceType;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.scheduledDate,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Scheduled Date`,
    description: msg`Date and time when the service is scheduled`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  scheduledDate: Date;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.completedDate,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Completed Date`,
    description: msg`Date and time when the service was completed`,
    icon: 'IconCheck',
  })
  @WorkspaceIsNullable()
  completedDate: Date;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.estimatedDuration,
    type: FieldMetadataType.NUMBER,
    label: msg`Estimated Duration (hours)`,
    description: msg`Estimated duration of the service in hours`,
    icon: 'IconClock',
  })
  @WorkspaceIsNullable()
  estimatedDuration: number;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.actualDuration,
    type: FieldMetadataType.NUMBER,
    label: msg`Actual Duration (hours)`,
    description: msg`Actual duration of the service in hours`,
    icon: 'IconClockHour4',
  })
  @WorkspaceIsNullable()
  actualDuration: number;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.serviceAddress,
    type: FieldMetadataType.ADDRESS,
    label: msg`Service Address`,
    description: msg`Address where the service will be performed`,
    icon: 'IconMapPin',
  })
  @WorkspaceIsNullable()
  serviceAddress: AddressMetadata;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.estimatedCost,
    type: FieldMetadataType.CURRENCY,
    label: msg`Estimated Cost`,
    description: msg`Estimated cost of the service`,
    icon: 'IconCurrencyDollar',
  })
  @WorkspaceIsNullable()
  estimatedCost: CurrencyMetadata;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.actualCost,
    type: FieldMetadataType.CURRENCY,
    label: msg`Actual Cost`,
    description: msg`Actual cost of the service`,
    icon: 'IconReceipt',
  })
  @WorkspaceIsNullable()
  actualCost: CurrencyMetadata;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.notes,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Service Notes`,
    description: msg`Additional notes about the service`,
    icon: 'IconNotes',
  })
  @WorkspaceIsNullable()
  notes: string;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.position,
    type: FieldMetadataType.POSITION,
    label: msg`Position`,
    description: msg`Service ticket position`,
    icon: 'IconHierarchy2',
    defaultValue: 0,
  })
  @WorkspaceIsSystem()
  position: number;

  @WorkspaceField({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.createdBy,
    type: FieldMetadataType.ACTOR,
    label: msg`Created by`,
    icon: 'IconCreativeCommonsSa',
    description: msg`The creator of the record`,
  })
  createdBy: ActorMetadata;

  @WorkspaceField({
    standardId: '20202020-hvac-st-reported-by-field',
    type: FieldMetadataType.TEXT,
    label: msg`Reported By`,
    description: msg`Name of the person who reported the issue`,
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  reportedBy: string;

  @WorkspaceField({
    standardId: '20202020-hvac-st-contact-info-field',
    type: FieldMetadataType.TEXT,
    label: msg`Contact Info`,
    description: msg`Contact information for the reporter`,
    icon: 'IconPhone',
  })
  @WorkspaceIsNullable()
  contactInfo: string;

  @WorkspaceField({
    standardId: '20202020-hvac-st-started-at-field',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Started At`,
    description: msg`When work on the ticket started`,
    icon: 'IconPlay',
  })
  @WorkspaceIsNullable()
  startedAt: Date;

  @WorkspaceField({
    standardId: '20202020-hvac-st-service-location-field',
    type: FieldMetadataType.TEXT,
    label: msg`Service Location`,
    description: msg`Location where service will be performed`,
    icon: 'IconMapPin',
  })
  @WorkspaceIsNullable()
  serviceLocation: string;

  // Relations
  // Note: Customer relation will be handled through Company entity
  // when inverse side fields are properly set up in CompanyWorkspaceEntity

  @WorkspaceRelation({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.equipment,
    type: RelationType.MANY_TO_ONE,
    label: msg`Equipment`,
    description: msg`Equipment related to this service ticket`,
    icon: 'IconTool',
    inverseSideTarget: () => HvacEquipmentWorkspaceEntity,
    inverseSideFieldKey: 'serviceTickets',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  equipment: Relation<HvacEquipmentWorkspaceEntity>;

  @WorkspaceRelation({
    standardId: HVAC_SERVICE_TICKET_STANDARD_FIELD_IDS.assignedTechnician,
    type: RelationType.MANY_TO_ONE,
    label: msg`Assigned Technician`,
    description: msg`Technician assigned to this service ticket`,
    icon: 'IconUserCog',
    inverseSideTarget: () => HvacTechnicianWorkspaceEntity,
    inverseSideFieldKey: 'assignedTickets',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  assignedTechnician: Relation<HvacTechnicianWorkspaceEntity>;
}
