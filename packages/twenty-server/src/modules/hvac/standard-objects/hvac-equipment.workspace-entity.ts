import { FieldMetadataType } from 'twenty-shared/types';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { HVAC_EQUIPMENT_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';
import { STANDARD_OBJECT_ICONS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons';
import { ActorMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/actor.composite-type';
import { AddressMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/address.composite-type';
import { CurrencyMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/currency.composite-type';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { RelationOnDeleteAction } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-on-delete-action.interface';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';
import { msg } from '@lingui/core/macro';
import { registerEnumType } from '@nestjs/graphql';

// Import for maintenance records relation
import { HvacMaintenanceRecordWorkspaceEntity } from './hvac-maintenance-record.workspace-entity';
import { HvacServiceTicketWorkspaceEntity } from './hvac-service-ticket.workspace-entity';

export enum HvacEquipmentType {
  BOILER = 'BOILER',
  HEAT_PUMP = 'HEAT_PUMP',
  AIR_CONDITIONER = 'AIR_CONDITIONER',
  FURNACE = 'FURNACE',
  VENTILATION_SYSTEM = 'VENTILATION_SYSTEM',
  THERMOSTAT = 'THERMOSTAT',
  DUCTWORK = 'DUCTWORK',
  RADIATOR = 'RADIATOR',
  HEAT_EXCHANGER = 'HEAT_EXCHANGER',
  CHILLER = 'CHILLER',
  OTHER = 'OTHER',
}

export enum HvacEquipmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR_NEEDED = 'REPAIR_NEEDED',
  DECOMMISSIONED = 'DECOMMISSIONED',
  WARRANTY = 'WARRANTY',
}

export enum HvacEquipmentCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  CRITICAL = 'CRITICAL',
}

registerEnumType(HvacEquipmentType, {
  name: 'HvacEquipmentType',
});

registerEnumType(HvacEquipmentStatus, {
  name: 'HvacEquipmentStatus',
});

registerEnumType(HvacEquipmentCondition, {
  name: 'HvacEquipmentCondition',
});

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.hvacEquipment,
  namePlural: 'hvacEquipment',
  labelSingular: msg`HVAC Equipment`,
  labelPlural: msg`HVAC Equipment`,
  description: msg`HVAC equipment tracking and management`,
  icon: STANDARD_OBJECT_ICONS.hvacEquipment,
  shortcut: 'E',
  labelIdentifierStandardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.name,
})
@WorkspaceIsNotAuditLogged()
export class HvacEquipmentWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.name,
    type: FieldMetadataType.TEXT,
    label: msg`Equipment Name`,
    description: msg`Name or identifier for the HVAC equipment`,
    icon: 'IconTool',
  })
  name: string;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.equipmentType,
    type: FieldMetadataType.SELECT,
    label: msg`Equipment Type`,
    description: msg`Type of HVAC equipment`,
    icon: 'IconCategory',
    options: [
      { value: HvacEquipmentType.BOILER, label: 'Boiler', position: 0, color: 'red' },
      { value: HvacEquipmentType.HEAT_PUMP, label: 'Heat Pump', position: 1, color: 'orange' },
      { value: HvacEquipmentType.AIR_CONDITIONER, label: 'Air Conditioner', position: 2, color: 'blue' },
      { value: HvacEquipmentType.FURNACE, label: 'Furnace', position: 3, color: 'yellow' },
      { value: HvacEquipmentType.VENTILATION_SYSTEM, label: 'Ventilation System', position: 4, color: 'green' },
      { value: HvacEquipmentType.THERMOSTAT, label: 'Thermostat', position: 5, color: 'purple' },
      { value: HvacEquipmentType.DUCTWORK, label: 'Ductwork', position: 6, color: 'gray' },
      { value: HvacEquipmentType.RADIATOR, label: 'Radiator', position: 7, color: 'red' },
      { value: HvacEquipmentType.HEAT_EXCHANGER, label: 'Heat Exchanger', position: 8, color: 'orange' },
      { value: HvacEquipmentType.CHILLER, label: 'Chiller', position: 9, color: 'blue' },
      { value: HvacEquipmentType.OTHER, label: 'Other', position: 10, color: 'gray' },
    ],
  })
  equipmentType: HvacEquipmentType;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.manufacturer,
    type: FieldMetadataType.TEXT,
    label: msg`Manufacturer`,
    description: msg`Equipment manufacturer`,
    icon: 'IconBuildingFactory',
  })
  @WorkspaceIsNullable()
  manufacturer: string;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.model,
    type: FieldMetadataType.TEXT,
    label: msg`Model`,
    description: msg`Equipment model number`,
    icon: 'IconHash',
  })
  @WorkspaceIsNullable()
  model: string;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.serialNumber,
    type: FieldMetadataType.TEXT,
    label: msg`Serial Number`,
    description: msg`Equipment serial number`,
    icon: 'IconBarcode',
  })
  @WorkspaceIsNullable()
  serialNumber: string;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.installationDate,
    type: FieldMetadataType.DATE,
    label: msg`Installation Date`,
    description: msg`Date when the equipment was installed`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  installationDate: Date;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.warrantyExpiration,
    type: FieldMetadataType.DATE,
    label: msg`Warranty Expiration`,
    description: msg`Date when the warranty expires`,
    icon: 'IconShield',
  })
  @WorkspaceIsNullable()
  warrantyExpiration: Date;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.status,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Current status of the equipment`,
    icon: 'IconProgressCheck',
    options: [
      { value: HvacEquipmentStatus.ACTIVE, label: 'Active', position: 0, color: 'green' },
      { value: HvacEquipmentStatus.INACTIVE, label: 'Inactive', position: 1, color: 'gray' },
      { value: HvacEquipmentStatus.MAINTENANCE, label: 'Under Maintenance', position: 2, color: 'yellow' },
      { value: HvacEquipmentStatus.REPAIR_NEEDED, label: 'Repair Needed', position: 3, color: 'orange' },
      { value: HvacEquipmentStatus.DECOMMISSIONED, label: 'Decommissioned', position: 4, color: 'red' },
      { value: HvacEquipmentStatus.WARRANTY, label: 'Under Warranty', position: 5, color: 'blue' },
    ],
    defaultValue: HvacEquipmentStatus.ACTIVE,
  })
  status: HvacEquipmentStatus;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.condition,
    type: FieldMetadataType.SELECT,
    label: msg`Condition`,
    description: msg`Current condition of the equipment`,
    icon: 'IconMoodCheck',
    options: [
      { value: HvacEquipmentCondition.EXCELLENT, label: 'Excellent', position: 0, color: 'green' },
      { value: HvacEquipmentCondition.GOOD, label: 'Good', position: 1, color: 'blue' },
      { value: HvacEquipmentCondition.FAIR, label: 'Fair', position: 2, color: 'yellow' },
      { value: HvacEquipmentCondition.POOR, label: 'Poor', position: 3, color: 'orange' },
      { value: HvacEquipmentCondition.CRITICAL, label: 'Critical', position: 4, color: 'red' },
    ],
    defaultValue: HvacEquipmentCondition.GOOD,
  })
  condition: HvacEquipmentCondition;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.capacity,
    type: FieldMetadataType.TEXT,
    label: msg`Capacity`,
    description: msg`Equipment capacity (e.g., BTU, kW, CFM)`,
    icon: 'IconGauge',
  })
  @WorkspaceIsNullable()
  capacity: string;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.energyRating,
    type: FieldMetadataType.TEXT,
    label: msg`Energy Rating`,
    description: msg`Energy efficiency rating`,
    icon: 'IconBolt',
  })
  @WorkspaceIsNullable()
  energyRating: string;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.location,
    type: FieldMetadataType.ADDRESS,
    label: msg`Location`,
    description: msg`Physical location of the equipment`,
    icon: 'IconMapPin',
  })
  @WorkspaceIsNullable()
  location: AddressMetadata;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.purchasePrice,
    type: FieldMetadataType.CURRENCY,
    label: msg`Purchase Price`,
    description: msg`Original purchase price of the equipment`,
    icon: 'IconCurrencyDollar',
  })
  @WorkspaceIsNullable()
  purchasePrice: CurrencyMetadata;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.lastMaintenanceDate,
    type: FieldMetadataType.DATE,
    label: msg`Last Maintenance`,
    description: msg`Date of the last maintenance service`,
    icon: 'IconTool',
  })
  @WorkspaceIsNullable()
  lastMaintenanceDate: Date;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.nextMaintenanceDate,
    type: FieldMetadataType.DATE,
    label: msg`Next Maintenance`,
    description: msg`Date of the next scheduled maintenance`,
    icon: 'IconCalendarEvent',
  })
  @WorkspaceIsNullable()
  nextMaintenanceDate: Date;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.notes,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Notes`,
    description: msg`Additional notes about the equipment`,
    icon: 'IconNotes',
  })
  @WorkspaceIsNullable()
  notes: string;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.position,
    type: FieldMetadataType.POSITION,
    label: msg`Position`,
    description: msg`Equipment position`,
    icon: 'IconHierarchy2',
    defaultValue: 0,
  })
  @WorkspaceIsSystem()
  position: number;

  @WorkspaceField({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.createdBy,
    type: FieldMetadataType.ACTOR,
    label: msg`Created by`,
    icon: 'IconCreativeCommonsSa',
    description: msg`The creator of the record`,
  })
  createdBy: ActorMetadata;

  // Relations
  // Note: Owner and Company relations are commented out for now
  // They require corresponding inverse fields in PersonWorkspaceEntity and CompanyWorkspaceEntity
  // These can be added later when the inverse side fields are properly set up

  // Note: Service tickets relation will be handled from the service ticket side
  // as a MANY_TO_ONE relation to equipment

  // Maintenance records relation - ONE_TO_MANY from equipment to maintenance records
  @WorkspaceRelation({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.maintenanceRecords,
    type: RelationType.ONE_TO_MANY,
    label: msg`Maintenance Records`,
    description: msg`Maintenance records for this equipment`,
    icon: 'IconTool',
    inverseSideTarget: () => HvacMaintenanceRecordWorkspaceEntity,
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  maintenanceRecords: Relation<HvacMaintenanceRecordWorkspaceEntity[]>;

  // Service tickets relation - ONE_TO_MANY from equipment to service tickets
  @WorkspaceRelation({
    standardId: HVAC_EQUIPMENT_STANDARD_FIELD_IDS.serviceTickets,
    type: RelationType.ONE_TO_MANY,
    label: msg`Service Tickets`,
    description: msg`Service tickets for this equipment`,
    icon: 'IconTicket',
    inverseSideTarget: () => HvacServiceTicketWorkspaceEntity,
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  serviceTickets: Relation<HvacServiceTicketWorkspaceEntity[]>;
}
