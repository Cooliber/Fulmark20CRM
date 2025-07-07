import { msg } from '@lingui/macro';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { FieldMetadataType } from 'twenty-shared/types';

@WorkspaceEntity({
  standardId: 'hvac-service-ticket',
  namePlural: 'hvacServiceTickets',
  labelSingular: msg`HVAC Service Ticket`,
  labelPlural: msg`HVAC Service Tickets`,
  description: msg`HVAC service tickets and work orders`,
  icon: 'IconClipboardList',
})
@WorkspaceIsSystem()
@WorkspaceIsNotAuditLogged()
export class HvacServiceTicketWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'title',
    type: FieldMetadataType.TEXT,
    label: msg`Title`,
    description: msg`Service ticket title`,
    icon: 'IconTag',
  })
  title: string;

  @WorkspaceField({
    standardId: 'description',
    type: FieldMetadataType.TEXT,
    label: msg`Description`,
    description: msg`Service ticket description`,
    icon: 'IconFileText',
  })
  description: string;

  @WorkspaceField({
    standardId: 'priority',
    type: FieldMetadataType.SELECT,
    label: msg`Priority`,
    description: msg`Service ticket priority`,
    icon: 'IconFlag',
    options: [
      { value: 'low', label: 'Low', position: 0, color: 'green' },
      { value: 'medium', label: 'Medium', position: 1, color: 'yellow' },
      { value: 'high', label: 'High', position: 2, color: 'orange' },
      { value: 'urgent', label: 'Urgent', position: 3, color: 'red' },
    ],
    defaultValue: "'medium'",
  })
  priority: string;

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Service ticket status`,
    icon: 'IconCircleDot',
    options: [
      { value: 'open', label: 'Open', position: 0, color: 'blue' },
      { value: 'in_progress', label: 'In Progress', position: 1, color: 'yellow' },
      { value: 'completed', label: 'Completed', position: 2, color: 'green' },
      { value: 'cancelled', label: 'Cancelled', position: 3, color: 'red' },
    ],
    defaultValue: "'open'",
  })
  status: string;

  @WorkspaceField({
    standardId: 'ticketNumber',
    type: FieldMetadataType.TEXT,
    label: msg`Ticket Number`,
    description: msg`Unique ticket number`,
    icon: 'IconHash',
  })
  ticketNumber: string;

  @WorkspaceField({
    standardId: 'customerName',
    type: FieldMetadataType.TEXT,
    label: msg`Customer Name`,
    description: msg`Customer name`,
    icon: 'IconUser',
  })
  customerName: string;

  @WorkspaceField({
    standardId: 'customerAddress',
    type: FieldMetadataType.TEXT,
    label: msg`Customer Address`,
    description: msg`Customer address`,
    icon: 'IconMap',
  })
  customerAddress: string;

  @WorkspaceField({
    standardId: 'scheduledDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Scheduled Date`,
    description: msg`Scheduled service date`,
    icon: 'IconCalendar',
  })
  scheduledDate: Date;

  @WorkspaceField({
    standardId: 'completedDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Completed Date`,
    description: msg`Service completion date`,
    icon: 'IconCheck',
  })
  completedDate: Date;

  @WorkspaceField({
    standardId: 'estimatedDuration',
    type: FieldMetadataType.NUMBER,
    label: msg`Estimated Duration (hours)`,
    description: msg`Estimated service duration in hours`,
    icon: 'IconClock',
  })
  estimatedDuration: number;

  @WorkspaceField({
    standardId: 'actualDuration',
    type: FieldMetadataType.NUMBER,
    label: msg`Actual Duration (hours)`,
    description: msg`Actual service duration in hours`,
    icon: 'IconClockHour8',
  })
  actualDuration: number;
}
