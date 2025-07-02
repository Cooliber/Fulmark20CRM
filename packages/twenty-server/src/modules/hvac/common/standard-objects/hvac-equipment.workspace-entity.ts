import { msg } from '@lingui/core/macro';
import { FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';

/**
 * HVAC Equipment Workspace Entity
 * "Pasja rodzi profesjonalizm" - Professional equipment management
 * 
 * Manages HVAC equipment inventory, specifications, and lifecycle
 * Integrates with TwentyCRM for complete asset management
 */
@WorkspaceEntity({
  standardId: 'hvac-equipment',
  namePlural: 'hvacEquipment',
  labelSingular: msg`HVAC Equipment`,
  labelPlural: msg`HVAC Equipment`,
  description: msg`HVAC equipment and asset management`,
  icon: 'IconDevices',
  labelIdentifierStandardId: 'equipmentNumber',
})
export class HvacEquipmentWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: 'equipmentNumber',
    type: FieldMetadataType.TEXT,
    label: msg`Equipment Number`,
    description: msg`Unique equipment identifier`,
    icon: 'IconHash',
  })
  equipmentNumber: string;

  @WorkspaceField({
    standardId: 'name',
    type: FieldMetadataType.TEXT,
    label: msg`Equipment Name`,
    description: msg`Name or model of the equipment`,
    icon: 'IconH1',
  })
  name: string;

  @WorkspaceField({
    standardId: 'type',
    type: FieldMetadataType.SELECT,
    label: msg`Equipment Type`,
    description: msg`Type of HVAC equipment`,
    icon: 'IconCategory',
  })
  type: string; // AIR_CONDITIONER, HEAT_PUMP, FURNACE, BOILER, VENTILATION, THERMOSTAT

  @WorkspaceField({
    standardId: 'manufacturer',
    type: FieldMetadataType.TEXT,
    label: msg`Manufacturer`,
    description: msg`Equipment manufacturer`,
    icon: 'IconBuilding',
  })
  manufacturer: string;

  @WorkspaceField({
    standardId: 'model',
    type: FieldMetadataType.TEXT,
    label: msg`Model`,
    description: msg`Equipment model number`,
    icon: 'IconTag',
  })
  model: string;

  @WorkspaceField({
    standardId: 'serialNumber',
    type: FieldMetadataType.TEXT,
    label: msg`Serial Number`,
    description: msg`Equipment serial number`,
    icon: 'IconBarcode',
  })
  @WorkspaceIsNullable()
  serialNumber?: string;

  @WorkspaceField({
    standardId: 'customerId',
    type: FieldMetadataType.TEXT,
    label: msg`Customer ID`,
    description: msg`ID of equipment owner`,
    icon: 'IconUser',
  })
  customerId: string;

  @WorkspaceField({
    standardId: 'location',
    type: FieldMetadataType.TEXT,
    label: msg`Location`,
    description: msg`Equipment installation location`,
    icon: 'IconMapPin',
  })
  location: string;

  @WorkspaceField({
    standardId: 'installationDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Installation Date`,
    description: msg`When equipment was installed`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  installationDate?: Date;

  @WorkspaceField({
    standardId: 'warrantyExpiration',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Warranty Expiration`,
    description: msg`When warranty expires`,
    icon: 'IconShield',
  })
  @WorkspaceIsNullable()
  warrantyExpiration?: Date;

  @WorkspaceField({
    standardId: 'status',
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Current equipment status`,
    icon: 'IconCircleCheck',
  })
  status: string; // ACTIVE, INACTIVE, MAINTENANCE, RETIRED

  @WorkspaceField({
    standardId: 'capacity',
    type: FieldMetadataType.TEXT,
    label: msg`Capacity`,
    description: msg`Equipment capacity (BTU, kW, etc.)`,
    icon: 'IconGauge',
  })
  @WorkspaceIsNullable()
  capacity?: string;

  @WorkspaceField({
    standardId: 'energyRating',
    type: FieldMetadataType.TEXT,
    label: msg`Energy Rating`,
    description: msg`Energy efficiency rating`,
    icon: 'IconBolt',
  })
  @WorkspaceIsNullable()
  energyRating?: string;

  @WorkspaceField({
    standardId: 'refrigerantType',
    type: FieldMetadataType.TEXT,
    label: msg`Refrigerant Type`,
    description: msg`Type of refrigerant used`,
    icon: 'IconDroplet',
  })
  @WorkspaceIsNullable()
  refrigerantType?: string;

  @WorkspaceField({
    standardId: 'lastMaintenanceDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Last Maintenance`,
    description: msg`Date of last maintenance`,
    icon: 'IconTool',
  })
  @WorkspaceIsNullable()
  lastMaintenanceDate?: Date;

  @WorkspaceField({
    standardId: 'nextMaintenanceDate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Next Maintenance`,
    description: msg`Date of next scheduled maintenance`,
    icon: 'IconCalendarTime',
  })
  @WorkspaceIsNullable()
  nextMaintenanceDate?: Date;

  @WorkspaceField({
    standardId: 'maintenanceInterval',
    type: FieldMetadataType.NUMBER,
    label: msg`Maintenance Interval (months)`,
    description: msg`Maintenance interval in months`,
    icon: 'IconClock',
  })
  @WorkspaceIsNullable()
  maintenanceInterval?: number;

  @WorkspaceField({
    standardId: 'purchasePrice',
    type: FieldMetadataType.CURRENCY,
    label: msg`Purchase Price`,
    description: msg`Original purchase price in PLN`,
    icon: 'IconCurrencyDollar',
  })
  @WorkspaceIsNullable()
  purchasePrice?: number;

  @WorkspaceField({
    standardId: 'currentValue',
    type: FieldMetadataType.CURRENCY,
    label: msg`Current Value`,
    description: msg`Current estimated value in PLN`,
    icon: 'IconTrendingUp',
  })
  @WorkspaceIsNullable()
  currentValue?: number;

  @WorkspaceField({
    standardId: 'operatingHours',
    type: FieldMetadataType.NUMBER,
    label: msg`Operating Hours`,
    description: msg`Total operating hours`,
    icon: 'IconClock',
  })
  @WorkspaceIsNullable()
  operatingHours?: number;

  @WorkspaceField({
    standardId: 'specifications',
    type: FieldMetadataType.TEXT,
    label: msg`Specifications`,
    description: msg`Technical specifications (JSON format)`,
    icon: 'IconFileText',
  })
  @WorkspaceIsNullable()
  specifications?: string;

  @WorkspaceField({
    standardId: 'notes',
    type: FieldMetadataType.TEXT,
    label: msg`Notes`,
    description: msg`Additional notes and observations`,
    icon: 'IconNotes',
  })
  @WorkspaceIsNullable()
  notes?: string;

  @WorkspaceField({
    standardId: 'iotDeviceId',
    type: FieldMetadataType.TEXT,
    label: msg`IoT Device ID`,
    description: msg`Connected IoT device identifier`,
    icon: 'IconWifi',
  })
  @WorkspaceIsNullable()
  iotDeviceId?: string;

  @WorkspaceField({
    standardId: 'isConnected',
    type: FieldMetadataType.BOOLEAN,
    label: msg`IoT Connected`,
    description: msg`Whether equipment is IoT connected`,
    icon: 'IconPlugConnected',
    defaultValue: false,
  })
  isConnected: boolean;

  @WorkspaceField({
    standardId: 'lastTelemetryUpdate',
    type: FieldMetadataType.DATE_TIME,
    label: msg`Last Telemetry Update`,
    description: msg`Last IoT data update`,
    icon: 'IconActivity',
  })
  @WorkspaceIsNullable()
  lastTelemetryUpdate?: Date;

  @WorkspaceField({
    standardId: 'currentTemperature',
    type: FieldMetadataType.NUMBER,
    label: msg`Current Temperature (°C)`,
    description: msg`Current temperature reading`,
    icon: 'IconTemperature',
  })
  @WorkspaceIsNullable()
  currentTemperature?: number;

  @WorkspaceField({
    standardId: 'currentHumidity',
    type: FieldMetadataType.NUMBER,
    label: msg`Current Humidity (%)`,
    description: msg`Current humidity reading`,
    icon: 'IconDroplet',
  })
  @WorkspaceIsNullable()
  currentHumidity?: number;

  @WorkspaceField({
    standardId: 'energyConsumption',
    type: FieldMetadataType.NUMBER,
    label: msg`Energy Consumption (kWh)`,
    description: msg`Current energy consumption`,
    icon: 'IconBolt',
  })
  @WorkspaceIsNullable()
  energyConsumption?: number;

  @WorkspaceField({
    standardId: 'alertsEnabled',
    type: FieldMetadataType.BOOLEAN,
    label: msg`Alerts Enabled`,
    description: msg`Whether alerts are enabled for this equipment`,
    icon: 'IconBell',
    defaultValue: true,
  })
  alertsEnabled: boolean;

  @WorkspaceField({
    standardId: 'criticalAlerts',
    type: FieldMetadataType.TEXT,
    label: msg`Critical Alerts`,
    description: msg`Current critical alerts (JSON format)`,
    icon: 'IconAlertTriangle',
  })
  @WorkspaceIsNullable()
  criticalAlerts?: string;
}
