import { msg } from '@lingui/core/macro';
import { FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';

/**
 * HVAC Maintenance Record Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional maintenance tracking
 *
 * Tracks all maintenance activities for HVAC equipment
 * Integrates with TwentyCRM workspace system
 */
@WorkspaceEntity({
  standardId: 'hvac-maintenance-record',
  namePlural: 'hvacMaintenanceRecords',
  labelSingular: msg`HVAC Maintenance Record`,
  labelPlural: msg`HVAC Maintenance Records`,
  description: msg`HVAC equipment maintenance records`,
  icon: 'IconTool',
  labelIdentifierStandardId: 'title',
})
export class HvacMaintenanceRecordWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'title',
    type: FieldMetadataType.TEXT,
    label: msg`Title`,
    description: msg`Maintenance record title`,
    icon: 'IconH1',
  })
  title: string;

  @WorkspaceField({
    standardId: 'equipmentId',
    type: FieldMetadataType.TEXT,
    label: msg`Equipment ID`,
    description: msg`ID of the HVAC equipment`,
    icon: 'IconDevices',
  })
  equipmentId: string;

  @WorkspaceField({
    standardId: 'maintenanceType',
    type: FieldMetadataType.SELECT,
    label: msg`Maintenance Type`,
    description: msg`Type of maintenance performed`,
    icon: 'IconSettings',
  })
  maintenanceType: string;

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Current status of maintenance`,
    icon: 'IconCircleCheck',
  })
  status: string;

  @WorkspaceField({
    standardId: 'scheduledDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Scheduled Date`,
    description: msg`When maintenance is scheduled`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  scheduledDate?: Date;

  @WorkspaceField({
    standardId: 'completedDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Completed Date`,
    description: msg`When maintenance was completed`,
    icon: 'IconCalendarCheck',
  })
  @WorkspaceIsNullable()
  completedDate?: Date;

  @WorkspaceField({
    standardId: 'technicianId',
    type: FieldMetadataType.TEXT,
    label: msg`Technician ID`,
    description: msg`ID of assigned technician`,
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  technicianId?: string;

  @WorkspaceField({
    standardId: 'notes',
    type: FieldMetadataType.TEXT,
    label: msg`Notes`,
    description: msg`Maintenance notes and observations`,
    icon: 'IconNotes',
  })
  @WorkspaceIsNullable()
  notes?: string;

  @WorkspaceField({
    standardId: 'cost',
    type: FieldMetadataType.CURRENCY,
    label: msg`Cost`,
    description: msg`Maintenance cost in PLN`,
    icon: 'IconCurrencyDollar',
  })
  @WorkspaceIsNullable()
  cost?: number;

  @WorkspaceField({
    standardId: 'partsUsed',
    type: FieldMetadataType.TEXT,
    label: msg`Parts Used`,
    description: msg`List of parts used in maintenance`,
    icon: 'IconComponents',
  })
  @WorkspaceIsNullable()
  partsUsed?: string;

  @WorkspaceField({
    standardId: 'nextMaintenanceDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Next Maintenance Date`,
    description: msg`When next maintenance is due`,
    icon: 'IconCalendarTime',
  })
  @WorkspaceIsNullable()
  nextMaintenanceDate?: Date;
}