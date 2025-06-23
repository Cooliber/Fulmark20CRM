import { registerEnumType } from '@nestjs/graphql';

import { msg } from '@lingui/core/macro';
import { FieldMetadataType } from 'twenty-shared/types';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { ActorMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/actor.composite-type';
import { CurrencyMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/currency.composite-type';
import { RelationOnDeleteAction } from 'src/engine/metadata-modules/relation-metadata/relation-on-delete-action.type';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';
import { HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_ICONS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';

// Import related entities
import { HvacEquipmentWorkspaceEntity } from './hvac-equipment.workspace-entity';
import { HvacTechnicianWorkspaceEntity } from './hvac-technician.workspace-entity';

export enum HvacMaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
  INSPECTION = 'INSPECTION',
  CLEANING = 'CLEANING',
  CALIBRATION = 'CALIBRATION',
  REPLACEMENT = 'REPLACEMENT',
  ROUTINE = 'ROUTINE',
}

export enum HvacMaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

registerEnumType(HvacMaintenanceType, {
  name: 'HvacMaintenanceType',
});

registerEnumType(HvacMaintenanceStatus, {
  name: 'HvacMaintenanceStatus',
});

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.hvacMaintenanceRecord,
  namePlural: 'hvacMaintenanceRecords',
  labelSingular: msg`HVAC Maintenance Record`,
  labelPlural: msg`HVAC Maintenance Records`,
  description: msg`HVAC equipment maintenance records and history`,
  icon: STANDARD_OBJECT_ICONS.hvacMaintenanceRecord,
  shortcut: 'M',
  labelIdentifierStandardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.title,
})
@WorkspaceIsNotAuditLogged()
export class HvacMaintenanceRecordWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.title,
    type: FieldMetadataType.TEXT,
    label: msg`Title`,
    description: msg`Maintenance record title`,
    icon: 'IconFileText',
  })
  title: string;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.maintenanceType,
    type: FieldMetadataType.SELECT,
    label: msg`Maintenance Type`,
    description: msg`Type of maintenance performed`,
    icon: 'IconTool',
    options: [
      {
        value: HvacMaintenanceType.PREVENTIVE,
        label: 'Preventive',
        position: 0,
        color: 'green',
      },
      {
        value: HvacMaintenanceType.CORRECTIVE,
        label: 'Corrective',
        position: 1,
        color: 'orange',
      },
      {
        value: HvacMaintenanceType.EMERGENCY,
        label: 'Emergency',
        position: 2,
        color: 'red',
      },
      {
        value: HvacMaintenanceType.INSPECTION,
        label: 'Inspection',
        position: 3,
        color: 'blue',
      },
      {
        value: HvacMaintenanceType.CLEANING,
        label: 'Cleaning',
        position: 4,
        color: 'purple',
      },
      {
        value: HvacMaintenanceType.CALIBRATION,
        label: 'Calibration',
        position: 5,
        color: 'yellow',
      },
      {
        value: HvacMaintenanceType.REPLACEMENT,
        label: 'Replacement',
        position: 6,
        color: 'gray',
      },
    ],
  })
  maintenanceType: HvacMaintenanceType;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.status,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Current status of the maintenance`,
    icon: 'IconProgressCheck',
    options: [
      {
        value: HvacMaintenanceStatus.SCHEDULED,
        label: 'Scheduled',
        position: 0,
        color: 'blue',
      },
      {
        value: HvacMaintenanceStatus.IN_PROGRESS,
        label: 'In Progress',
        position: 1,
        color: 'yellow',
      },
      {
        value: HvacMaintenanceStatus.COMPLETED,
        label: 'Completed',
        position: 2,
        color: 'green',
      },
      {
        value: HvacMaintenanceStatus.CANCELLED,
        label: 'Cancelled',
        position: 3,
        color: 'red',
      },
      {
        value: HvacMaintenanceStatus.OVERDUE,
        label: 'Overdue',
        position: 4,
        color: 'red',
      },
    ],
    defaultValue: HvacMaintenanceStatus.SCHEDULED,
  })
  status: HvacMaintenanceStatus;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.scheduledDate,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Scheduled Date`,
    description: msg`Date and time when maintenance is scheduled`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  scheduledDate: Date;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.completedDate,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Completed Date`,
    description: msg`Date and time when maintenance was completed`,
    icon: 'IconCheck',
  })
  @WorkspaceIsNullable()
  completedDate: Date;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.duration,
    type: FieldMetadataType.NUMBER,
    label: msg`Duration (hours)`,
    description: msg`Duration of the maintenance in hours`,
    icon: 'IconClock',
  })
  @WorkspaceIsNullable()
  duration: number;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.description,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Description`,
    description: msg`Detailed description of maintenance performed`,
    icon: 'IconFileDescription',
  })
  @WorkspaceIsNullable()
  description: string;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.workPerformed,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Work Performed`,
    description: msg`Detailed description of work performed`,
    icon: 'IconChecklist',
  })
  @WorkspaceIsNullable()
  workPerformed: string;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.partsUsed,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Parts Used`,
    description: msg`List of parts and materials used`,
    icon: 'IconComponents',
  })
  @WorkspaceIsNullable()
  partsUsed: string;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.cost,
    type: FieldMetadataType.CURRENCY,
    label: msg`Cost`,
    description: msg`Total cost of the maintenance`,
    icon: 'IconCurrencyDollar',
  })
  @WorkspaceIsNullable()
  cost: CurrencyMetadata;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.nextMaintenanceDate,
    type: FieldMetadataType.DATE,
    label: msg`Next Maintenance Date`,
    description: msg`Date when next maintenance is due`,
    icon: 'IconCalendarEvent',
  })
  @WorkspaceIsNullable()
  nextMaintenanceDate: Date;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.recommendations,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Recommendations`,
    description: msg`Technician recommendations for future maintenance`,
    icon: 'IconBulb',
  })
  @WorkspaceIsNullable()
  recommendations: string;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.position,
    type: FieldMetadataType.POSITION,
    label: msg`Position`,
    description: msg`Maintenance record position`,
    icon: 'IconHierarchy2',
    defaultValue: 0,
  })
  @WorkspaceIsSystem()
  position: number;

  @WorkspaceField({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.createdBy,
    type: FieldMetadataType.ACTOR,
    label: msg`Created by`,
    icon: 'IconCreativeCommonsSa',
    description: msg`The creator of the record`,
  })
  createdBy: ActorMetadata;

  @WorkspaceField({
    standardId: '20202020-hvac-mr-equipment-id-field',
    type: FieldMetadataType.TEXT,
    label: msg`Equipment ID`,
    description: msg`ID of the equipment that was maintained`,
    icon: 'IconTool',
  })
  @WorkspaceIsNullable()
  equipmentId: string;

  @WorkspaceField({
    standardId: '20202020-hvac-mr-type-field-value',
    type: FieldMetadataType.TEXT,
    label: msg`Type`,
    description: msg`Type of maintenance (alias for maintenanceType)`,
    icon: 'IconSettings',
  })
  @WorkspaceIsNullable()
  type: string;

  @WorkspaceField({
    standardId: '20202020-hvac-mr-performed-date-fld',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Performed Date`,
    description: msg`Date when maintenance was performed`,
    icon: 'IconCalendarCheck',
  })
  @WorkspaceIsNullable()
  performedDate: Date;

  // Relations
  @WorkspaceRelation({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.equipment,
    type: RelationType.MANY_TO_ONE,
    label: msg`Equipment`,
    description: msg`Equipment that was maintained`,
    icon: 'IconTool',
    inverseSideTarget: () => HvacEquipmentWorkspaceEntity,
    inverseSideFieldKey: 'maintenanceRecords',
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  equipment: Relation<HvacEquipmentWorkspaceEntity>;

  @WorkspaceRelation({
    standardId: HVAC_MAINTENANCE_RECORD_STANDARD_FIELD_IDS.technician,
    type: RelationType.MANY_TO_ONE,
    label: msg`Technician`,
    description: msg`Technician who performed the maintenance`,
    icon: 'IconUserCog',
    inverseSideTarget: () => HvacTechnicianWorkspaceEntity,
    inverseSideFieldKey: 'maintenanceRecords',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  technician: Relation<HvacTechnicianWorkspaceEntity>;
}
