import { registerEnumType } from '@nestjs/graphql';

import { msg } from '@lingui/core/macro';

import { FieldMetadataType } from 'twenty-shared/types';

import { ActorMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/actor.composite-type';
import { AddressMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/address.composite-type';
import { EmailsMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/emails.composite-type';
import { FullNameMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/full-name.composite-type';
import { PhonesMetadata } from 'src/engine/metadata-modules/field-metadata/composite-types/phones.composite-type';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { RelationOnDeleteAction } from 'src/engine/metadata-modules/relation-metadata/relation-on-delete-action.type';
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNotAuditLogged } from 'src/engine/twenty-orm/decorators/workspace-is-not-audit-logged.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';
import { HVAC_TECHNICIAN_STANDARD_FIELD_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-field-ids';
import { STANDARD_OBJECT_ICONS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-icons';
import { STANDARD_OBJECT_IDS } from 'src/engine/workspace-manager/workspace-sync-metadata/constants/standard-object-ids';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

// Import related entities
import { HvacMaintenanceRecordWorkspaceEntity } from './hvac-maintenance-record.workspace-entity';
import { HvacServiceTicketWorkspaceEntity } from './hvac-service-ticket.workspace-entity';

export enum HvacTechnicianStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TRAINING = 'TRAINING',
  TERMINATED = 'TERMINATED',
  AVAILABLE = 'AVAILABLE',
}

export enum HvacTechnicianLevel {
  APPRENTICE = 'APPRENTICE',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  SUPERVISOR = 'SUPERVISOR',
}

registerEnumType(HvacTechnicianStatus, {
  name: 'HvacTechnicianStatus',
});

registerEnumType(HvacTechnicianLevel, {
  name: 'HvacTechnicianLevel',
});

@WorkspaceEntity({
  standardId: STANDARD_OBJECT_IDS.hvacTechnician,
  namePlural: 'hvacTechnicians',
  labelSingular: msg`HVAC Technician`,
  labelPlural: msg`HVAC Technicians`,
  description: msg`HVAC technicians and service personnel`,
  icon: STANDARD_OBJECT_ICONS.hvacTechnician,
  shortcut: 'H',
  labelIdentifierStandardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.name,
})
@WorkspaceIsNotAuditLogged()
export class HvacTechnicianWorkspaceEntity extends BaseWorkspaceEntity {
  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.name,
    type: FieldMetadataType.FULL_NAME,
    label: msg`Name`,
    description: msg`Technician's full name`,
    icon: 'IconUser',
  })
  name: FullNameMetadata;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.employeeId,
    type: FieldMetadataType.TEXT,
    label: msg`Employee ID`,
    description: msg`Unique employee identifier`,
    icon: 'IconHash',
  })
  @WorkspaceIsNullable()
  employeeId: string;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.emails,
    type: FieldMetadataType.EMAILS,
    label: msg`Emails`,
    description: msg`Technician's email addresses`,
    icon: 'IconMail',
  })
  @WorkspaceIsNullable()
  emails: EmailsMetadata;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.phones,
    type: FieldMetadataType.PHONES,
    label: msg`Phones`,
    description: msg`Technician's phone numbers`,
    icon: 'IconPhone',
  })
  @WorkspaceIsNullable()
  phones: PhonesMetadata;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.address,
    type: FieldMetadataType.ADDRESS,
    label: msg`Address`,
    description: msg`Technician's address`,
    icon: 'IconMapPin',
  })
  @WorkspaceIsNullable()
  address: AddressMetadata;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.status,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Current employment status`,
    icon: 'IconProgressCheck',
    options: [
      { value: HvacTechnicianStatus.ACTIVE, label: 'Active', position: 0, color: 'green' },
      { value: HvacTechnicianStatus.INACTIVE, label: 'Inactive', position: 1, color: 'gray' },
      { value: HvacTechnicianStatus.ON_LEAVE, label: 'On Leave', position: 2, color: 'yellow' },
      { value: HvacTechnicianStatus.TRAINING, label: 'In Training', position: 3, color: 'blue' },
      { value: HvacTechnicianStatus.TERMINATED, label: 'Terminated', position: 4, color: 'red' },
    ],
    defaultValue: HvacTechnicianStatus.ACTIVE,
  })
  status: HvacTechnicianStatus;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.level,
    type: FieldMetadataType.SELECT,
    label: msg`Level`,
    description: msg`Technician skill level`,
    icon: 'IconStars',
    options: [
      { value: HvacTechnicianLevel.APPRENTICE, label: 'Apprentice', position: 0, color: 'gray' },
      { value: HvacTechnicianLevel.JUNIOR, label: 'Junior', position: 1, color: 'blue' },
      { value: HvacTechnicianLevel.SENIOR, label: 'Senior', position: 2, color: 'green' },
      { value: HvacTechnicianLevel.LEAD, label: 'Lead', position: 3, color: 'orange' },
      { value: HvacTechnicianLevel.SUPERVISOR, label: 'Supervisor', position: 4, color: 'purple' },
    ],
    defaultValue: HvacTechnicianLevel.JUNIOR,
  })
  level: HvacTechnicianLevel;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.hireDate,
    type: FieldMetadataType.DATE,
    label: msg`Hire Date`,
    description: msg`Date when the technician was hired`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  hireDate: Date;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.certifications,
    type: FieldMetadataType.MULTI_SELECT,
    label: msg`Certifications`,
    description: msg`HVAC certifications and licenses`,
    icon: 'IconCertificate',
    options: [
      { value: 'EPA_608', label: 'EPA 608 Certification', position: 0, color: 'blue' },
      { value: 'NATE', label: 'NATE Certified', position: 1, color: 'green' },
      { value: 'HVAC_EXCELLENCE', label: 'HVAC Excellence', position: 2, color: 'orange' },
      { value: 'RSES', label: 'RSES Certified', position: 3, color: 'purple' },
      { value: 'ACCA', label: 'ACCA Certified', position: 4, color: 'red' },
      { value: 'ELECTRICAL', label: 'Electrical License', position: 5, color: 'yellow' },
      { value: 'GAS_FITTING', label: 'Gas Fitting License', position: 6, color: 'gray' },
      { value: 'REFRIGERATION', label: 'Refrigeration License', position: 7, color: 'blue' },
    ],
  })
  @WorkspaceIsNullable()
  certifications: string[];

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.specialties,
    type: FieldMetadataType.MULTI_SELECT,
    label: msg`Specialties`,
    description: msg`HVAC specialization areas`,
    icon: 'IconTool',
    options: [
      { value: 'HEATING', label: 'Heating Systems', position: 0, color: 'red' },
      { value: 'COOLING', label: 'Cooling Systems', position: 1, color: 'blue' },
      { value: 'VENTILATION', label: 'Ventilation', position: 2, color: 'green' },
      { value: 'REFRIGERATION', label: 'Refrigeration', position: 3, color: 'purple' },
      { value: 'BOILERS', label: 'Boilers', position: 4, color: 'orange' },
      { value: 'HEAT_PUMPS', label: 'Heat Pumps', position: 5, color: 'yellow' },
      { value: 'DUCTWORK', label: 'Ductwork', position: 6, color: 'gray' },
      { value: 'CONTROLS', label: 'Controls & Automation', position: 7, color: 'blue' },
      { value: 'COMMERCIAL', label: 'Commercial Systems', position: 8, color: 'green' },
      { value: 'RESIDENTIAL', label: 'Residential Systems', position: 9, color: 'orange' },
    ],
  })
  @WorkspaceIsNullable()
  specialties: string[];

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.hourlyRate,
    type: FieldMetadataType.NUMBER,
    label: msg`Hourly Rate`,
    description: msg`Technician's hourly rate in PLN`,
    icon: 'IconCurrencyDollar',
  })
  @WorkspaceIsNullable()
  hourlyRate: number;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.emergencyContact,
    type: FieldMetadataType.TEXT,
    label: msg`Emergency Contact`,
    description: msg`Emergency contact information`,
    icon: 'IconAlertTriangle',
  })
  @WorkspaceIsNullable()
  emergencyContact: string;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.vehicleInfo,
    type: FieldMetadataType.TEXT,
    label: msg`Vehicle Info`,
    description: msg`Service vehicle information`,
    icon: 'IconCar',
  })
  @WorkspaceIsNullable()
  vehicleInfo: string;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.notes,
    type: FieldMetadataType.RICH_TEXT_V2,
    label: msg`Notes`,
    description: msg`Additional notes about the technician`,
    icon: 'IconNotes',
  })
  @WorkspaceIsNullable()
  notes: string;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.position,
    type: FieldMetadataType.POSITION,
    label: msg`Position`,
    description: msg`Technician position`,
    icon: 'IconHierarchy2',
    defaultValue: 0,
  })
  @WorkspaceIsSystem()
  position: number;

  @WorkspaceField({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.createdBy,
    type: FieldMetadataType.ACTOR,
    label: msg`Created by`,
    icon: 'IconCreativeCommonsSa',
    description: msg`The creator of the record`,
  })
  createdBy: ActorMetadata;

  @WorkspaceField({
    standardId: '20202020-hvac-tech-weekly-capacity-f',
    type: FieldMetadataType.NUMBER,
    label: msg`Weekly Capacity`,
    description: msg`Weekly working hours capacity`,
    icon: 'IconClock',
    defaultValue: 40,
  })
  @WorkspaceIsNullable()
  weeklyCapacity: number;

  @WorkspaceField({
    standardId: '20202020-hvac-tech-skills-field-val',
    type: FieldMetadataType.MULTI_SELECT,
    label: msg`Skills`,
    description: msg`Technical skills and competencies`,
    icon: 'IconTool',
    options: [
      { value: 'HEATING', label: 'Heating Systems', position: 0, color: 'red' },
      { value: 'COOLING', label: 'Cooling Systems', position: 1, color: 'blue' },
      { value: 'ELECTRICAL', label: 'Electrical Work', position: 2, color: 'yellow' },
      { value: 'PLUMBING', label: 'Plumbing', position: 3, color: 'green' },
    ],
  })
  @WorkspaceIsNullable()
  skills: string[];

  @WorkspaceField({
    standardId: '20202020-hvac-tech-location-field-v',
    type: FieldMetadataType.TEXT,
    label: msg`Location`,
    description: msg`Current location or base location`,
    icon: 'IconMapPin',
  })
  @WorkspaceIsNullable()
  location: string;

  // Relations
  @WorkspaceRelation({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.assignedTickets,
    type: RelationType.ONE_TO_MANY,
    label: msg`Assigned Tickets`,
    description: msg`Service tickets assigned to this technician`,
    icon: 'IconTicket',
    inverseSideTarget: () => HvacServiceTicketWorkspaceEntity,
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  assignedTickets: Relation<HvacServiceTicketWorkspaceEntity[]>;

  @WorkspaceRelation({
    standardId: HVAC_TECHNICIAN_STANDARD_FIELD_IDS.maintenanceRecords,
    type: RelationType.ONE_TO_MANY,
    label: msg`Maintenance Records`,
    description: msg`Maintenance records performed by this technician`,
    icon: 'IconHistory',
    inverseSideTarget: () => HvacMaintenanceRecordWorkspaceEntity,
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  maintenanceRecords: Relation<HvacMaintenanceRecordWorkspaceEntity[]>;
}
