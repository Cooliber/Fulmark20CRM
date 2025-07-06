import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { FieldMetadataType } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { RelationMetadataType } from 'src/engine/metadata-modules/relation-metadata/relation-metadata.entity';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';

@WorkspaceEntity({
  standardId: 'hvac-service-ticket',
  namePlural: 'hvacServiceTickets',
  labelSingular: 'HVAC Service Ticket',
  labelPlural: 'HVAC Service Tickets',
  description: 'HVAC service tickets and work orders',
  icon: 'IconClipboardList',
})
@WorkspaceIsSystem()
@WorkspaceIsNotAuditLogged()
export class HvacServiceTicketWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'title',
    type: FieldMetadataType.TEXT,
    label: 'Title',
    description: 'Service ticket title',
    icon: 'IconTag',
  })
  title: string;

  @WorkspaceField({
    standardId: 'description',
    type: FieldMetadataType.TEXT,
    label: 'Description',
    description: 'Service ticket description',
    icon: 'IconFileText',
  })
  description: string;

  @WorkspaceField({
    standardId: 'priority',
    type: FieldMetadataType.SELECT,
    label: 'Priority',
    description: 'Service ticket priority',
    icon: 'IconFlag',
    options: [
      { value: 'low', label: 'Low', position: 0, color: 'green' },
      { value: 'medium', label: 'Medium', position: 1, color: 'yellow' },
      { value: 'high', label: 'High', position: 2, color: 'orange' },
      { value: 'urgent', label: 'Urgent', position: 3, color: 'red' },
    ],
    defaultValue: 'medium',
  })
  priority: string;

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: 'Status',
    description: 'Service ticket status',
    icon: 'IconCircleDot',
    options: [
      { value: 'open', label: 'Open', position: 0, color: 'blue' },
      { value: 'in_progress', label: 'In Progress', position: 1, color: 'yellow' },
      { value: 'completed', label: 'Completed', position: 2, color: 'green' },
      { value: 'cancelled', label: 'Cancelled', position: 3, color: 'red' },
    ],
    defaultValue: 'open',
  })
  status: string;

  @WorkspaceField({
    standardId: 'ticketNumber',
    type: FieldMetadataType.TEXT,
    label: 'Ticket Number',
    description: 'Unique ticket number',
    icon: 'IconHash',
  })
  ticketNumber: string;

  @WorkspaceField({
    standardId: 'customerName',
    type: FieldMetadataType.TEXT,
    label: 'Customer Name',
    description: 'Customer name',
    icon: 'IconUser',
  })
  customerName: string;

  @WorkspaceField({
    standardId: 'customerAddress',
    type: FieldMetadataType.TEXT,
    label: 'Customer Address',
    description: 'Customer address',
    icon: 'IconMap',
  })
  customerAddress: string;

  @WorkspaceField({
    standardId: 'scheduledDate',
    type: FieldMetadataType.DATE_TIME,
    label: 'Scheduled Date',
    description: 'Scheduled service date',
    icon: 'IconCalendar',
  })
  scheduledDate: Date;

  @WorkspaceField({
    standardId: 'completedDate',
    type: FieldMetadataType.DATE_TIME,
    label: 'Completed Date',
    description: 'Service completion date',
    icon: 'IconCheck',
  })
  completedDate: Date;

  @WorkspaceField({
    standardId: 'estimatedDuration',
    type: FieldMetadataType.NUMBER,
    label: 'Estimated Duration (hours)',
    description: 'Estimated service duration in hours',
    icon: 'IconClock',
  })
  estimatedDuration: number;

  @WorkspaceField({
    standardId: 'actualDuration',
    type: FieldMetadataType.NUMBER,
    label: 'Actual Duration (hours)',
    description: 'Actual service duration in hours',
    icon: 'IconClockHour8',
  })
  actualDuration: number;
}
