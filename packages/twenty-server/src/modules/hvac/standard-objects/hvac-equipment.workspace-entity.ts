import { FieldMetadataType } from 'twenty-shared/types';
import { msg } from '@lingui/macro';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';

@WorkspaceEntity({
  standardId: 'hvac-equipment',
  namePlural: 'hvacEquipment',
  labelSingular: msg`HVAC Equipment`,
  labelPlural: msg`HVAC Equipment`,
  description: msg`HVAC equipment and systems`,
  icon: 'IconBuildingSkyscraper',
})
@WorkspaceIsSystem()
@WorkspaceIsNotAuditLogged()
export class HvacEquipmentWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'name',
    type: FieldMetadataType.TEXT,
    label: msg`Name`,
    description: msg`Equipment name`,
    icon: 'IconTag',
  })
  name: string;

  @WorkspaceField({
    standardId: 'type',
    type: FieldMetadataType.TEXT,
    label: msg`Type`,
    description: msg`Equipment type`,
    icon: 'IconCategory',
  })
  type: string;

  @WorkspaceField({
    standardId: 'model',
    type: FieldMetadataType.TEXT,
    label: msg`Model`,
    description: msg`Equipment model`,
    icon: 'IconTag',
  })
  model: string;

  @WorkspaceField({
    standardId: 'serialNumber',
    type: FieldMetadataType.TEXT,
    label: msg`Serial Number`,
    description: msg`Equipment serial number`,
    icon: 'IconHash',
  })
  serialNumber: string;

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Equipment status`,
    icon: 'IconCircleDot',
    options: [
      { value: 'active', label: 'Active', position: 0, color: 'green' },
      { value: 'maintenance', label: 'Maintenance', position: 1, color: 'yellow' },
      { value: 'inactive', label: 'Inactive', position: 2, color: 'red' },
    ],
    defaultValue: "'active'",
  })
  status: string;

  @WorkspaceField({
    standardId: 'location',
    type: FieldMetadataType.TEXT,
    label: msg`Location`,
    description: msg`Equipment location`,
    icon: 'IconMap',
  })
  location: string;

  @WorkspaceField({
    standardId: 'installationDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Installation Date`,
    description: msg`Equipment installation date`,
    icon: 'IconCalendar',
  })
  installationDate: Date;

  @WorkspaceField({
    standardId: 'lastMaintenanceDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Last Maintenance`,
    description: msg`Last maintenance date`,
    icon: 'IconTool',
  })
  lastMaintenanceDate: Date;

  @WorkspaceField({
    standardId: 'nextMaintenanceDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Next Maintenance`,
    description: msg`Next scheduled maintenance date`,
    icon: 'IconCalendarEvent',
  })
  nextMaintenanceDate: Date;
}
